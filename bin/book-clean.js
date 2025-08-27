#!/usr/bin/env node

const { Command } = require('commander');
const chalk = require('chalk');
const path = require('path');
const fs = require('fs-extra');

const program = new Command();

/**
 * 清除指定格式的引用文本并清理多余空行
 */
function cleanReferenceText(content) {
  const lines = content.split('\n');
  const cleanedLines = [];
  
  // 定义匹配模式
  // 匹配 [\[数字\]](链接) 格式
  const pattern1 = /\[\\\[\d+\\\]\]\([^)]+\)/g;
  // 匹配 [〔中文数字〕](链接) 格式
  const pattern2 = /\[〔[^〕]+〕\]\([^)]+\)/g;
  // 匹配图片引用格式 ![](./images/文件名.扩展名) 或 ![alt文本](路径)
  const pattern3 = /!\[[^\]]*\]\([^)]+\)/g;
  
  for (const line of lines) {
    // 检查是否以指定格式开头（可能前面有空格）
    const strippedLine = line.trimStart();
    
    // 如果整行以这些格式开头，跳过整行
    if (pattern1.test(strippedLine) && strippedLine.match(pattern1)?.[0] === strippedLine.trim() ||
        pattern2.test(strippedLine) && strippedLine.match(pattern2)?.[0] === strippedLine.trim() ||
        pattern3.test(strippedLine) && strippedLine.match(pattern3)?.[0] === strippedLine.trim()) {
      continue;
    }
    
    // 否则，清除行中的这些格式文本
    let cleanedLine = line;
    cleanedLine = cleanedLine.replace(pattern1, '');
    cleanedLine = cleanedLine.replace(pattern2, '');
    cleanedLine = cleanedLine.replace(pattern3, '');
    
    cleanedLines.push(cleanedLine);
  }
  
  // 清理多余的空行：将连续的多个空行合并为单个空行
  const resultLines = [];
  let prevEmpty = false;
  
  for (const line of cleanedLines) {
    const isEmpty = line.trim().length === 0;
    
    if (isEmpty) {
      // 如果当前行是空行，只在前一行不是空行时才添加
      if (!prevEmpty) {
        resultLines.push(line);
      }
      prevEmpty = true;
    } else {
      // 非空行直接添加
      resultLines.push(line);
      prevEmpty = false;
    }
  }
  
  // 移除文件开头和结尾的空行
  while (resultLines.length > 0 && resultLines[0].trim().length === 0) {
    resultLines.shift();
  }
  while (resultLines.length > 0 && resultLines[resultLines.length - 1].trim().length === 0) {
    resultLines.pop();
  }
  
  return resultLines.join('\n');
}

/**
 * 处理单个文件
 */
async function processFile(filePath, backup = true) {
  try {
    // 读取文件
    const content = await fs.readFile(filePath, 'utf8');
    
    // 清理内容
    const cleanedContent = cleanReferenceText(content);
    
    // 如果内容有变化，才进行写入
    if (content !== cleanedContent) {
      // 创建备份
      if (backup) {
        const backupPath = `${filePath}.backup`;
        await fs.writeFile(backupPath, content, 'utf8');
        console.log(chalk.green(`[√] 已创建备份: ${path.basename(backupPath)}`));
      }
      
      // 写入清理后的内容
      await fs.writeFile(filePath, cleanedContent, 'utf8');
      console.log(chalk.green(`[√] 已处理: ${path.basename(filePath)}`));
    } else {
      console.log(chalk.gray(`[·] 无需处理: ${path.basename(filePath)}`));
    }
  } catch (error) {
    console.log(chalk.red(`[×] 处理失败 ${path.basename(filePath)}: ${error.message}`));
  }
}

/**
 * 处理目录中的所有markdown文件
 */
async function processDirectory(dirPath, recursive = false, backup = true) {
  try {
    let mdFiles = [];
    
    if (recursive) {
      // 递归查找所有.md文件
      const findMdFiles = async (dir) => {
        const items = await fs.readdir(dir);
        for (const item of items) {
          const itemPath = path.join(dir, item);
          const stat = await fs.stat(itemPath);
          if (stat.isDirectory()) {
            await findMdFiles(itemPath);
          } else if (path.extname(item).toLowerCase() === '.md') {
            mdFiles.push(itemPath);
          }
        }
      };
      await findMdFiles(dirPath);
    } else {
      // 只查找当前目录的.md文件
      const items = await fs.readdir(dirPath);
      for (const item of items) {
        const itemPath = path.join(dirPath, item);
        const stat = await fs.stat(itemPath);
        if (stat.isFile() && path.extname(item).toLowerCase() === '.md') {
          mdFiles.push(itemPath);
        }
      }
    }
    
    if (mdFiles.length > 0) {
      console.log(`找到 ${mdFiles.length} 个Markdown文件`);
      for (const mdFile of mdFiles) {
        await processFile(mdFile, backup);
      }
    } else {
      console.log(chalk.yellow('未找到Markdown文件'));
    }
  } catch (error) {
    console.log(chalk.red(`处理目录失败: ${error.message}`));
  }
}

// 设置程序信息
program
  .name('book-clean')
  .description('清除Markdown文件中的引用格式文本')
  .version('1.0.0');

program
  .argument('[path]', '要处理的文件或目录路径 (默认: 当前目录)', '.')
  .option('--no-backup', '不创建备份文件')
  .option('--recursive, -r', '递归处理子目录')
  .action(async (targetPath, options) => {
    console.log(chalk.blue('=== Markdown引用清理工具 ==='));
    console.log(`处理路径: ${targetPath}`);
    console.log(`创建备份: ${options.backup ? '是' : '否'}`);
    console.log(`递归处理: ${options.recursive ? '是' : '否'}`);
    console.log();
    
    const resolvedPath = path.resolve(targetPath);
    
    try {
      const stat = await fs.stat(resolvedPath);
      
      if (stat.isFile()) {
        // 处理单个文件
        if (path.extname(resolvedPath).toLowerCase() === '.md') {
          await processFile(resolvedPath, options.backup);
        } else {
          console.log(chalk.yellow(`跳过非Markdown文件: ${path.basename(resolvedPath)}`));
        }
      } else if (stat.isDirectory()) {
        // 处理目录
        await processDirectory(resolvedPath, options.recursive, options.backup);
      }
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.log(chalk.red(`路径不存在: ${resolvedPath}`));
      } else {
        console.log(chalk.red(`处理失败: ${error.message}`));
      }
      process.exit(1);
    }
  });

// 显示帮助信息
program.on('--help', () => {
  console.log('');
  console.log('功能说明:');
  console.log('  - 清除 [\\[数字\\]](链接) 格式的文本');
  console.log('  - 清除 [〔中文数字〕](链接) 格式的文本');
  console.log('  - 清除图片引用，如 ![](./images/00318.jpeg) 格式');
  console.log('  - 如果整行以这些格式开头，则删除整行');
  console.log('  - 清理多余的空行');
  console.log('');
  console.log('示例用法:');
  console.log('  book-clean book.md');
  console.log('  book-clean . --recursive');
  console.log('  book-clean ./books --no-backup');
});

program.parse(process.argv);
