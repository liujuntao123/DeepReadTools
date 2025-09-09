#!/usr/bin/env node

const { Command } = require('commander');
const chalk = require('chalk');
const path = require('path');
const fs = require('fs-extra');
const { sanitizeFileName } = require('../lib/utils');

const program = new Command();

/**
 * 移动md文件到目标目录
 */
async function moveMdFilesToBookDir(sourceDir, targetDir, excludeFiles = []) {
  try {
    await fs.ensureDir(targetDir);
    
    const files = await fs.readdir(sourceDir);
    let movedCount = 0;
    
    for (const file of files) {
      const filePath = path.join(sourceDir, file);
      const stat = await fs.stat(filePath);
      
      // 跳过目录和非md文件
      if (stat.isDirectory() || !file.endsWith('.md')) {
        continue;
      }
      
      // 跳过排除的文件
      if (excludeFiles.includes(file)) {
        console.log(chalk.gray(`• 跳过文件: ${file}`));
        continue;
      }
      
      const targetFile = path.join(targetDir, file);
      await fs.move(filePath, targetFile);
      console.log(chalk.green(`✓ 移动文件: ${file} -> ${path.basename(targetDir)}/${file}`));
      movedCount++;
    }
    
    return movedCount;
  } catch (error) {
    console.log(chalk.red(`✗ 移动文件失败: ${error.message}`));
    return 0;
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
  console.log();
  
  // 检查基础目录是否存在
  if (!await fs.pathExists(baseDirResolved)) {
    console.log(chalk.red(`错误: 基础目录不存在 - ${baseDirResolved}`));
    return false;
  }
  
  // 设置目标目录路径
  const bookDir = path.join(baseDirResolved, sanitizedBookName);
  
  // 检查目标目录是否已存在
  if (await fs.pathExists(bookDir)) {
    console.log(chalk.yellow(`警告: 目标目录已存在 - ${sanitizedBookName}`));
    console.log(chalk.yellow('请确认是否要继续操作...'));
  }
  
  console.log(chalk.blue('=== 开始整理书籍文件夹 ==='));
  console.log(`目标目录: ${bookDir}`);
  console.log();
  
  // 排除的文件列表
  const excludeFiles = ['todo.md'];
  
  // 移动md文件到书籍目录
  console.log(chalk.blue('=== 移动MD文件到书籍目录 ==='));
  const movedCount = await moveMdFilesToBookDir(baseDirResolved, bookDir, excludeFiles);
  
  if (movedCount === 0) {
    console.log(chalk.yellow('警告: 没有MD文件被移动'));
  } else {
    console.log(chalk.green(`✓ 总共移动了 ${movedCount} 个MD文件到 ${sanitizedBookName} 目录`));
  }
  
  console.log();
  
  // 显示最终结果
  console.log(chalk.green('=== 整理完成 ==='));
  console.log(`书籍目录: ${bookDir}`);
  
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
  .description('书籍文件夹整理工具：创建书籍目录并移动MD文件')
  .version('1.0.0');

program
  .argument('[bookName]', '书籍名称（可选，默认使用当前目录名）')
  .option('--dir <baseDir>', '书籍文件夹路径（默认为当前目录）')
  .action(async (bookName, options) => {
    console.log(chalk.blue('=== 书籍文件夹整理工具 ==='));
    console.log(`版本: 1.0.0`);
    console.log(`兼容: Windows, macOS, Linux`);
    console.log();
    
    // 如果没有提供书籍名称，使用当前目录名
    let finalBookName = bookName;
    if (!finalBookName) {
      const currentDir = options.dir ? path.resolve(options.dir) : process.cwd();
      finalBookName = path.basename(currentDir);
      console.log(chalk.yellow(`未提供书籍名称，使用当前目录名: ${finalBookName}`));
    }
    
    // 开始整理
    const success = await organizeBookFolder(finalBookName, options.dir);
    
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
  console.log('  1. 创建以书籍名称命名的目录');
  console.log('  2. 将当前目录下的所有MD文件移动到书籍目录中');
  console.log('  3. 排除文件：todo.md 和 .claude 目录不会被移动');
  console.log('  4. 书籍名称可选，默认使用当前目录名');
  console.log('');
  console.log('示例用法:');
  console.log('  book-organize                    # 使用当前目录名作为书籍名称');
  console.log('  book-organize 三国演义           # 指定书籍名称');
  console.log('  book-organize 红楼梦 --dir /path/to/book/folder');
  console.log('  book-organize "水浒传" --dir ./books/');
  console.log('  book-organize --dir ./books/     # 在指定目录下使用该目录名作为书籍名');
});

program.parse(process.argv);
