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
  copyFile 
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
  
  // 步骤3: 合并文件（在书籍目录下执行）
  console.log(chalk.blue('=== 步骤3: 合并章节文件 ==='));
  const mergedFile = path.join(bookDir, `${bookName}.md`);
  const mergeCmd = `node "${path.join(__dirname, 'book-merge.js')}" "." "${bookName}.md"`;
  
  if (!runCommand(mergeCmd, '合并章节文件', { cwd: bookDir })) {
    return false;
  }
  
  // 步骤4: 清理引用（可选，在书籍目录下执行）
  if (cleanReferences) {
    console.log(chalk.blue('=== 步骤4: 清理引用格式 ==='));
    const cleanCmd = `node "${path.join(__dirname, 'book-clean.js')}" "${bookName}.md"`;
    
    if (!runCommand(cleanCmd, '清理引用格式', { cwd: bookDir })) {
      console.log(chalk.yellow('警告: 清理引用步骤失败，但继续执行后续步骤'));
    }
  } else {
    console.log(chalk.blue('=== 步骤4: 跳过清理引用 ==='));
  }
  
  // 步骤5: 在书籍目录下创建books目录并移动章节文件
  console.log(chalk.blue('=== 步骤5: 整理文件结构 ==='));
  const booksDir = path.join(bookDir, 'books');
  
  // 只排除合并文件，其他所有文件（包括备份文件）都移动到books目录
  const excludeFiles = [];
  if (await fs.pathExists(mergedFile)) {
    excludeFiles.push(`${bookName}.md`);
  }
  
  // 移动章节文件和备份文件到books子目录
  if (!await moveFilesToDirectory(bookDir, booksDir, excludeFiles)) {
    console.log(chalk.yellow('警告: 没有文件需要移动到books目录'));
  }
  
  // 步骤6: 在书籍目录下创建wiki目录并移动文件
  console.log(chalk.blue('=== 步骤6: 创建wiki目录 ==='));
  const wikiDir = path.join(bookDir, 'wiki');
  await fs.ensureDir(wikiDir);
  
  // 移动合并后的md文件到wiki目录（从书籍目录）
  if (await fs.pathExists(mergedFile)) {
    const targetFile = path.join(wikiDir, `${bookName}.md`);
    try {
      await fs.move(mergedFile, targetFile);
      console.log(chalk.green(`✓ 移动文件: ${path.basename(mergedFile)} -> wiki/${path.basename(mergedFile)}`));
    } catch (error) {
      console.log(chalk.red(`✗ 移动文件失败: ${error.message}`));
      return false;
    }
  }
  
  // 复制GEMINI.md到wiki目录
  const geminiSource = path.join(scriptsDir, 'templates', 'GEMINI.md');
  const geminiTarget = path.join(wikiDir, 'GEMINI.md');
  if (await fs.pathExists(geminiSource)) {
    await copyFile(geminiSource, geminiTarget);
  } else {
    console.log(chalk.yellow(`警告: 未找到GEMINI.md文件 - ${geminiSource}`));
  }
  
  console.log(chalk.green('\n=== 处理完成 ==='));
  console.log(`输出目录: ${outputDirResolved}`);
  console.log(`书籍目录: ${bookDir}`);
  console.log(`原始章节: ${booksDir}`);
  console.log(`Wiki文件: ${wikiDir}`);
  console.log();
  console.log('目录结构：');
  console.log(`${path.basename(outputDirResolved)}/`);
  console.log(`└── ${bookName}/`);
  console.log(`    ├── books/          # 原始章节文件`);
  if (cleanReferences) {
    console.log(`    │   ├── 第一章.md`);
    console.log(`    │   ├── 第二章.md`);
    console.log(`    │   ├── ${bookName}.md.backup`);
    console.log(`    │   └── ...`);
  } else {
    console.log(`    │   ├── 第一章.md`);
    console.log(`    │   ├── 第二章.md`);
    console.log(`    │   └── ...`);
  }
  console.log(`    └── wiki/           # 合并后的文件`);
  console.log(`        ├── ${bookName}.md`);
  console.log(`        └── GEMINI.md`);
  console.log();
  console.log('执行流程：');
  console.log('1. 使用epub2md转换epub文件为markdown章节');
  console.log('2. 进入书籍目录，后续操作在书籍目录下执行');
  console.log('3. 在书籍目录下合并章节文件');
  if (cleanReferences) {
    console.log('4. 在书籍目录下清理引用格式');
    console.log('5. 将章节文件移动到books子目录');
    console.log('6. 将合并文件移动到wiki子目录');
  } else {
    console.log('4. 跳过清理引用');
    console.log('5. 将章节文件移动到books子目录');
    console.log('6. 将合并文件移动到wiki子目录');
  }
  
  return true;
}

// 设置程序信息
program
  .name('book-process')
  .description('epub文件处理工具：转换epub为markdown并整理文件结构')
  .version('1.0.0');

program
  .argument('<epubPath>', 'epub文件路径')
  .argument('[outputDir]', '输出目录路径（可选，默认为当前目录）')
  .option('--no-clean-references', '跳过清理引用格式步骤（默认会执行清理）')
  .action(async (epubPath, outputDir, options) => {
    console.log(chalk.blue('=== epub文件处理工具 ==='));
    console.log(`版本: 1.0.0`);
    console.log(`兼容: Windows, macOS, Linux`);
    console.log();
    
    // 开始处理
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
  });

program.parse(process.argv);
