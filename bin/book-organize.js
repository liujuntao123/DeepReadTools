#!/usr/bin/env node

const { Command } = require('commander');
const chalk = require('chalk');
const path = require('path');
const fs = require('fs-extra');
const { sanitizeFileName } = require('../lib/utils');

const program = new Command();

/**
 * 如果文件存在则移动到目标目录
 */
async function moveFileIfExists(source, targetDir) {
  const sourcePath = path.resolve(source);
  const targetDirPath = path.resolve(targetDir);
  
  if (await fs.pathExists(sourcePath)) {
    try {
      await fs.ensureDir(targetDirPath);
      const targetFile = path.join(targetDirPath, path.basename(sourcePath));
      await fs.move(sourcePath, targetFile);
      console.log(chalk.green(`✓ 移动文件: ${path.basename(sourcePath)} -> backup/${path.basename(sourcePath)}`));
      return true;
    } catch (error) {
      console.log(chalk.red(`✗ 移动文件失败 ${path.basename(sourcePath)}: ${error.message}`));
      return false;
    }
  } else {
    console.log(chalk.gray(`• 文件不存在，跳过: ${path.basename(sourcePath)}`));
    return false;
  }
}

/**
 * 重命名目录
 */
async function renameDirectory(oldPath, newPath) {
  const oldPathResolved = path.resolve(oldPath);
  const newPathResolved = path.resolve(newPath);
  
  if (await fs.pathExists(oldPathResolved)) {
    const stat = await fs.stat(oldPathResolved);
    if (!stat.isDirectory()) {
      console.log(chalk.red(`错误: 源路径不是目录 - ${oldPath}`));
      return false;
    }
    
    if (await fs.pathExists(newPathResolved)) {
      console.log(chalk.yellow(`警告: 目标目录已存在 - ${newPath}`));
      return false;
    }
    
    try {
      await fs.move(oldPathResolved, newPathResolved);
      console.log(chalk.green(`✓ 重命名目录: ${path.basename(oldPath)} -> ${path.basename(newPath)}`));
      return true;
    } catch (error) {
      console.log(chalk.red(`✗ 重命名目录失败: ${error.message}`));
      return false;
    }
  } else {
    console.log(chalk.red(`错误: 源目录不存在 - ${oldPath}`));
    return false;
  }
}

/**
 * 整理书籍文件夹
 */
async function organizeBookFolder(bookName, baseDir = null) {
  const baseDirResolved = baseDir ? path.resolve(baseDir) : process.cwd();
  
  // 清理书籍名称，确保可以作为目录名使用
  const sanitizedBookName = sanitizeFileName(bookName);
  
  console.log(`书籍名称: ${bookName}`);
  if (sanitizedBookName !== bookName) {
    console.log(`清理后名称: ${sanitizedBookName}`);
  }
  console.log(`工作目录: ${baseDirResolved}`);
  
  // 检查基础目录是否存在
  if (!await fs.pathExists(baseDirResolved)) {
    console.log(chalk.red(`错误: 基础目录不存在 - ${baseDirResolved}`));
    return false;
  }
  
  // 设置路径
  const wikiDir = path.join(baseDirResolved, 'wiki');
  const backupDir = path.join(baseDirResolved, 'backup');
  const bookMdFile = path.join(wikiDir, `${sanitizedBookName}.md`);
  const geminiMdFile = path.join(wikiDir, 'GEMINI.md');
  const todoMdFile = path.join(wikiDir, 'todo.md');
  
  console.log(`Wiki目录: ${wikiDir}`);
  console.log(`备份目录: ${backupDir}`);
  console.log();
  
  // 检查wiki目录是否存在
  if (!await fs.pathExists(wikiDir)) {
    console.log(chalk.red(`❌ wiki目录不存在`));
    return false;
  }
  
  // 步骤1: 创建backup目录并移动指定文件
  console.log(chalk.blue('=== 步骤1: 创建backup目录并移动文件 ==='));
  
  let movedCount = 0;
  
  // 移动书籍md文件
  if (await moveFileIfExists(bookMdFile, backupDir)) {
    movedCount++;
  }
  
  // 移动GEMINI.md文件
  if (await moveFileIfExists(geminiMdFile, backupDir)) {
    movedCount++;
  }
  
  // 移动todo.md文件
  if (await moveFileIfExists(todoMdFile, backupDir)) {
    movedCount++;
  }
  
  if (movedCount === 0) {
    console.log(chalk.yellow('警告: 没有文件被移动到backup目录'));
  } else {
    console.log(chalk.green(`✓ 总共移动了 ${movedCount} 个文件到backup目录`));
  }
  
  console.log();
  
  // 步骤2: 重命名wiki目录为书籍名称
  console.log(chalk.blue('=== 步骤2: 重命名wiki目录 ==='));
  
  const newWikiDir = path.join(baseDirResolved, sanitizedBookName);
  
  if (await renameDirectory(wikiDir, newWikiDir)) {
    console.log(chalk.green(`✓ wiki目录已重命名为: ${sanitizedBookName}`));
  } else {
    console.log(chalk.red('✗ 重命名wiki目录失败'));
    return false;
  }
  
  console.log();
  
  // 显示最终结果
  console.log(chalk.green('=== 整理完成 ==='));
  console.log(`备份文件: ${backupDir}`);
  console.log(`Wiki目录: ${newWikiDir}`);
  
  // 列出最终的目录结构
  console.log('\n当前目录结构:');
  try {
    const items = await fs.readdir(baseDirResolved);
    const sortedItems = items.sort();
    
    for (const item of sortedItems) {
      const itemPath = path.join(baseDirResolved, item);
      const stat = await fs.stat(itemPath);
      
      if (stat.isDirectory()) {
        console.log(`  📁 ${item}/`);
        // 显示目录内容（最多5个文件）
        try {
          const contents = await fs.readdir(itemPath);
          const sortedContents = contents.sort();
          
          for (let i = 0; i < Math.min(5, sortedContents.length); i++) {
            const content = sortedContents[i];
            const contentPath = path.join(itemPath, content);
            const contentStat = await fs.stat(contentPath);
            const icon = contentStat.isDirectory() ? '📁' : '📄';
            console.log(`    ${icon} ${content}`);
          }
          
          if (sortedContents.length > 5) {
            console.log(`    ... 还有 ${sortedContents.length - 5} 个文件`);
          }
        } catch (error) {
          // 忽略读取目录内容的错误
        }
      } else {
        console.log(`  📄 ${item}`);
      }
    }
  } catch (error) {
    console.log(chalk.yellow(`无法列出目录结构: ${error.message}`));
  }
  
  return true;
}

// 设置程序信息
program
  .name('book-organize')
  .description('书籍文件夹整理工具：重新整理已处理的书籍文件夹结构')
  .version('1.0.0');

program
  .argument('<bookName>', '书籍名称')
  .option('--dir <baseDir>', '书籍文件夹路径（默认为当前目录）')
  .action(async (bookName, options) => {
    console.log(chalk.blue('=== 书籍文件夹整理工具 ==='));
    console.log(`版本: 1.0.0`);
    console.log(`兼容: Windows, macOS, Linux`);
    console.log();
    
    // 开始整理
    const success = await organizeBookFolder(bookName, options.dir);
    
    if (success) {
      console.log(chalk.green('\n🎉 文件夹整理完成！'));
      process.exit(0);
    } else {
      console.log(chalk.red('\n❌ 整理过程中出现错误'));
      process.exit(1);
    }
  });

// 显示帮助信息
program.on('--help', () => {
  console.log('');
  console.log('功能说明:');
  console.log('  1. 创建backup目录，移动wiki目录下的指定文件');
  console.log('  2. 将wiki目录重命名为书籍名称');
  console.log('');
  console.log('示例用法:');
  console.log('  book-organize 三国演义');
  console.log('  book-organize 红楼梦 --dir /path/to/book/folder');
  console.log('  book-organize "水浒传" --dir ./books/');
});

program.parse(process.argv);
