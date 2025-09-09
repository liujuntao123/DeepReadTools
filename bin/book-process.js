#!/usr/bin/env node

const { Command } = require('commander');
const chalk = require('chalk');
const path = require('path');
const fs = require('fs-extra');
const { 
  ensureEpub2md,
  extractBookName, 
  runCommand, 
  moveFilesToDirectory, 
  copyFile,
  selectEpubFile,
  selectOutputDirectory,
  selectProcessOptions
} = require('../lib/utils');

const program = new Command();

/**
 * 处理epub文件的主要流程
 */
async function processEpub(epubPath, outputDir = null, cleanReferences = true) {
  // 确保epub2md可用（自动检测和安装）
  const epub2mdReady = await ensureEpub2md();
  if (!epub2mdReady) {
    console.log(chalk.red('❌ epub2md 不可用'));
    console.log(chalk.yellow('📦 请安装: npm install -g epub2md'));
    return false;
  }
  
  // 提取书籍名称
  const bookName = extractBookName(epubPath);
  const epubPathResolved = path.resolve(epubPath);
  const outputDirResolved = outputDir ? path.resolve(outputDir) : process.cwd();
  const bookDir = path.join(outputDirResolved, bookName);
  const scriptsDir = path.join(__dirname, '..');
  
  console.log(`📚 ${bookName}`);
  console.log(`📁 ${bookDir}`);
  console.log();
  
  // 检查输入文件是否存在
  if (!await fs.pathExists(epubPathResolved)) {
    console.log(chalk.red(`❌ 文件不存在: ${epubPath}`));
    return false;
  }
  
  // 创建输出目录
  await fs.ensureDir(outputDirResolved);
  
  // 步骤1: 使用epub2md转换
  console.log(chalk.blue('=== 步骤1: 转换epub到markdown ==='));
  
  // 尝试不同的epub2md调用方式
  const epub2mdCommands = [
    `epub2md -c "${epubPathResolved}" "${outputDirResolved}"`,
    `npx epub2md -c "${epubPathResolved}" "${outputDirResolved}"`
  ];
  
  let success = false;
  for (const cmd of epub2mdCommands) {
    console.log(`尝试命令: ${cmd}`);
    if (runCommand(cmd, 'epub2md转换')) {
      success = true;
      break;
    }
  }
  
  if (!success) {
    console.log(chalk.red('错误: 所有epub2md调用方式都失败了'));
    return false;
  }
  
  // 检查书籍目录是否创建成功
  if (!await fs.pathExists(bookDir)) {
    console.log(chalk.red(`错误: 转换后未找到书籍目录 - ${bookDir}`));
    return false;
  }
  
  // 步骤2: 进入书籍目录，后续命令都在书籍目录下执行
  console.log(chalk.blue('=== 步骤2: 进入书籍目录 ==='));
  console.log(`进入目录: ${bookDir}`);
  console.log('后续操作将在书籍目录下执行');
  console.log();
  
  // 步骤3: 在书籍目录下创建books目录并移动章节文件
  console.log(chalk.blue('=== 步骤3: 整理文件结构 ==='));
  const booksDir = path.join(bookDir, 'books');
  
  // 移动所有文件到books子目录
  if (!await moveFilesToDirectory(bookDir, booksDir, [])) {
    console.log(chalk.yellow('警告: 没有文件需要移动到books目录'));
  }
  
  // 步骤4: 清理引用（可选，逐个清理books目录下的文件）
  if (cleanReferences) {
    console.log(chalk.blue('=== 步骤4: 清理引用格式 ==='));
    
    // 获取books目录下的所有md文件
    if (await fs.pathExists(booksDir)) {
      const files = await fs.readdir(booksDir);
      const mdFiles = files.filter(file => file.endsWith('.md'));
      
      for (const mdFile of mdFiles) {
        const filePath = path.join(booksDir, mdFile);
        const cleanCmd = `node "${path.join(__dirname, 'book-clean.js')}" "${mdFile}"`;
        
        console.log(`清理文件: ${mdFile}`);
        if (!runCommand(cleanCmd, `清理引用格式: ${mdFile}`, { cwd: booksDir })) {
          console.log(chalk.yellow(`警告: 清理文件 ${mdFile} 失败，但继续执行后续步骤`));
        }
      }
    }
  } else {
    console.log(chalk.blue('=== 步骤4: 跳过清理引用 ==='));
  }
  
  // 步骤5: 复制.claude目录到书籍目录
  console.log(chalk.blue('=== 步骤5: 复制.claude目录 ==='));
  const claudeSource = path.join(scriptsDir, 'templates', '.claude');
  const claudeTarget = path.join(bookDir, '.claude');
  
  if (await fs.pathExists(claudeSource)) {
    try {
      await fs.copy(claudeSource, claudeTarget);
      console.log(chalk.green(`✓ 复制目录: .claude -> ${path.relative(outputDirResolved, claudeTarget)}`));
    } catch (error) {
      console.log(chalk.yellow(`警告: 复制.claude目录失败: ${error.message}`));
    }
  } else {
    console.log(chalk.yellow(`警告: 未找到.claude目录 - ${claudeSource}`));
  }
  
  console.log(chalk.green('\n=== 处理完成 ==='));
  console.log(`输出目录: ${outputDirResolved}`);
  console.log(`书籍目录: ${bookDir}`);
  console.log(`章节文件: ${booksDir}`);
  console.log();
  console.log('目录结构：');
  console.log(`${path.basename(outputDirResolved)}/`);
  console.log(`└── ${bookName}/`);
  console.log(`    ├── books/          # 章节文件`);
  if (cleanReferences) {
    console.log(`    │   ├── 第一章.md`);
    console.log(`    │   ├── 第二章.md`);
    console.log(`    │   ├── 第一章.md.backup`);
    console.log(`    │   └── ...`);
  } else {
    console.log(`    │   ├── 第一章.md`);
    console.log(`    │   ├── 第二章.md`);
    console.log(`    │   └── ...`);
  }
  console.log(`    └── .claude/        # Claude配置文件`);
  console.log(`        ├── agents/`);
  console.log(`        └── commands/`);
  console.log();
  console.log('执行流程：');
  console.log('1. 使用epub2md转换epub文件为markdown章节');
  console.log('2. 进入书籍目录，后续操作在书籍目录下执行');
  console.log('3. 将章节文件移动到books子目录');
  if (cleanReferences) {
    console.log('4. 逐个清理books目录下文件的引用格式');
    console.log('5. 复制.claude目录到书籍目录');
  } else {
    console.log('4. 跳过清理引用');
    console.log('5. 复制.claude目录到书籍目录');
  }
  
  return true;
}

// 设置程序信息
program
  .name('book-process')
  .description('epub文件处理工具：转换epub为markdown并整理文件结构')
  .version('1.0.0');

// 交互式模式
program
  .command('interactive')
  .alias('i')
  .description('交互式处理epub文件（推荐）')
  .option('-d, --dir <dir>', '搜索epub文件的目录（默认为当前目录）')
  .action(async (options) => {
    console.log(chalk.blue('=== epub文件处理工具 - 交互式模式 ==='));
    console.log(`版本: 1.0.0`);
    console.log(`兼容: Windows, macOS, Linux`);
    console.log();
    
    try {
      // 1. 选择epub文件
      const searchDir = options.dir ? path.resolve(options.dir) : process.cwd();
      const epubPath = await selectEpubFile(searchDir);
      
      if (!epubPath) {
        console.log(chalk.yellow('已取消操作'));
        process.exit(0);
      }
      
      console.log(chalk.cyan(`\n📖 已选择: ${path.basename(epubPath)}`));
      console.log(chalk.gray(`   路径: ${epubPath}`));
      console.log();
      
      // 2. 选择输出目录
      const outputDir = await selectOutputDirectory();
      console.log(chalk.cyan(`📁 输出目录: ${outputDir}`));
      console.log();
      
      // 3. 选择处理选项
      const processOptions = await selectProcessOptions();
      console.log(chalk.cyan(`⚙️  处理选项: ${processOptions.cleanReferences ? '✅ 清理引用' : '❌ 跳过清理'}`));
      console.log();
      
      // 确认开始处理
      const inquirer = require('inquirer');
      const { confirmStart } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirmStart',
          message: '确认开始处理？',
          default: true
        }
      ]);
      
      if (!confirmStart) {
        console.log(chalk.yellow('已取消操作'));
        process.exit(0);
      }
      
      // 4. 开始处理
      const success = await processEpub(
        epubPath, 
        outputDir, 
        processOptions.cleanReferences
      );
      
      if (success) {
        console.log(chalk.green('\n[√] 所有步骤执行成功！'));
        process.exit(0);
      } else {
        console.log(chalk.red('\n[×] 处理过程中出现错误'));
        process.exit(1);
      }
    } catch (error) {
      console.log(chalk.red(`\n[×] 发生错误: ${error.message}`));
      process.exit(1);
    }
  });

// 传统模式（向后兼容）
program
  .argument('[epubPath]', 'epub文件路径（可选，未提供时将启动交互模式）')
  .argument('[outputDir]', '输出目录路径（可选，默认为当前目录）')
  .option('--no-clean-references', '跳过清理引用格式步骤（默认会执行清理）')
  .option('-i, --interactive', '强制启动交互式模式')
  .action(async (epubPath, outputDir, options) => {
    console.log(chalk.blue('=== epub文件处理工具 ==='));
    console.log(`版本: 1.0.0`);
    console.log(`兼容: Windows, macOS, Linux`);
    console.log();
    
    // 如果没有提供epub路径或者设置了interactive选项，启动交互模式
    if (!epubPath || options.interactive) {
      console.log(chalk.cyan('🎯 启动交互式模式...'));
      console.log();
      
      try {
        // 1. 选择epub文件
        const selectedEpubPath = await selectEpubFile();
        
        if (!selectedEpubPath) {
          console.log(chalk.yellow('已取消操作'));
          process.exit(0);
        }
        
        console.log(chalk.cyan(`\n📖 已选择: ${path.basename(selectedEpubPath)}`));
        console.log(chalk.gray(`   路径: ${selectedEpubPath}`));
        console.log();
        
        // 2. 选择输出目录（如果没有通过参数指定）
        const selectedOutputDir = outputDir ? path.resolve(outputDir) : await selectOutputDirectory();
        console.log(chalk.cyan(`📁 输出目录: ${selectedOutputDir}`));
        console.log();
        
        // 3. 选择处理选项（如果没有通过参数指定）
        let cleanReferences = options.cleanReferences;
        if (cleanReferences === undefined) {
          const processOptions = await selectProcessOptions();
          cleanReferences = processOptions.cleanReferences;
        }
        console.log(chalk.cyan(`⚙️  处理选项: ${cleanReferences ? '✅ 清理引用' : '❌ 跳过清理'}`));
        console.log();
        
        // 确认开始处理
        const inquirer = require('inquirer');
        const { confirmStart } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'confirmStart',
            message: '确认开始处理？',
            default: true
          }
        ]);
        
        if (!confirmStart) {
          console.log(chalk.yellow('已取消操作'));
          process.exit(0);
        }
        
        // 4. 开始处理
        const success = await processEpub(
          selectedEpubPath, 
          selectedOutputDir, 
          cleanReferences
        );
        
        if (success) {
          console.log(chalk.green('\n[√] 所有步骤执行成功！'));
          process.exit(0);
        } else {
          console.log(chalk.red('\n[×] 处理过程中出现错误'));
          process.exit(1);
        }
      } catch (error) {
        console.log(chalk.red(`\n[×] 发生错误: ${error.message}`));
        process.exit(1);
      }
    } else {
      // 传统模式：直接处理指定的文件
      const success = await processEpub(
        epubPath, 
        outputDir, 
        options.cleanReferences
      );
      
      if (success) {
        console.log(chalk.green('\n[√] 所有步骤执行成功！'));
        process.exit(0);
      } else {
        console.log(chalk.red('\n[×] 处理过程中出现错误'));
        process.exit(1);
      }
    }
  });

program.parse(process.argv);
