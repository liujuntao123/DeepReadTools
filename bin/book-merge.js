#!/usr/bin/env node

const { Command } = require('commander');
const chalk = require('chalk');
const path = require('path');
const fs = require('fs-extra');

const program = new Command();

/**
 * 读取文件内容
 */
async function readFile(filepath) {
  try {
    return await fs.readFile(filepath, 'utf8');
  } catch (error) {
    console.log(chalk.yellow(`⚠️  读取失败: ${path.basename(filepath)}`));
    return '';
  }
}

/**
 * 合并目录下的所有文件
 */
async function mergeFiles(inputDir, outputFile) {
  const inputPath = path.resolve(inputDir);
  
  // 检查输入目录是否存在
  if (!await fs.pathExists(inputPath)) {
    console.log(chalk.red(`❌ 目录不存在: ${inputDir}`));
    return false;
  }
  
  const stat = await fs.stat(inputPath);
  if (!stat.isDirectory()) {
    console.log(chalk.red(`❌ 不是目录: ${inputDir}`));
    return false;
  }
  
  // 获取目录下所有文件，按文件名排序
  const items = await fs.readdir(inputPath);
  const files = [];
  
  for (const item of items) {
    const itemPath = path.join(inputPath, item);
    const itemStat = await fs.stat(itemPath);
    if (itemStat.isFile()) {
      files.push(itemPath);
    }
  }
  
  if (files.length === 0) {
    console.log(chalk.yellow(`⚠️  目录为空: ${inputDir}`));
    return false;
  }
  
  // 按文件名排序
  files.sort((a, b) => path.basename(a).localeCompare(path.basename(b)));
  
  console.log(`📁 发现 ${files.length} 个文件`);
  
  // 开始合并
  const mergedContent = [];
  let successfulCount = 0;
  
  // 显示进度条
  process.stdout.write('📄 合并进度: ');
  
  for (let i = 0; i < files.length; i++) {
    const filePath = files[i];
    
    // 简化的进度显示
    if (i % Math.max(1, Math.floor(files.length / 10)) === 0 || i === files.length - 1) {
      const progress = Math.round((i + 1) / files.length * 100);
      process.stdout.write(`${progress}% `);
    }
    
    const content = await readFile(filePath);
    if (content) {
      mergedContent.push(content);
      successfulCount++;
    }
  }
  
  console.log(); // 换行
  
  // 写入合并后的文件
  try {
    const outputPath = path.resolve(outputFile);
    // 确保输出目录存在
    await fs.ensureDir(path.dirname(outputPath));
    
    await fs.writeFile(outputPath, mergedContent.join('\n'), 'utf8');
    
    // 显示文件大小
    const stat = await fs.stat(outputPath);
    const fileSize = stat.size;
    const sizeText = fileSize > 1024 * 1024 
      ? `${(fileSize / 1024 / 1024).toFixed(2)} MB`
      : `${(fileSize / 1024).toFixed(2)} KB`;
    
    console.log(chalk.green(`\n✅ 合并完成!`));
    console.log(`📊 ${successfulCount}/${files.length} 个文件 | 💾 ${sizeText}`);
    console.log(`📄 ${outputFile}`);
    
    return true;
  } catch (error) {
    console.log(chalk.red(`❌ 写入失败: ${error.message}`));
    return false;
  }
}

// 设置程序信息
program
  .name('book-merge')
  .description('通用文件合并工具：将指定目录下的所有文件按字母顺序合并成一个文件')
  .version('1.0.0');

program
  .argument('<inputDir>', '输入目录路径')
  .argument('<outputFile>', '输出文件路径')
  .action(async (inputDir, outputFile) => {
    console.log(chalk.blue('🔗 文件合并工具'));
    console.log(`📂 ${inputDir} → 📄 ${outputFile}`);
    console.log();
    
    // 开始合并
    const success = await mergeFiles(inputDir, outputFile);
    
    if (success) {
      process.exit(0);
    } else {
      process.exit(1);
    }
  });

// 显示帮助信息
program.on('--help', () => {
  console.log('');
  console.log('示例用法:');
  console.log('  book-merge ./books merged_output.txt');
  console.log('  book-merge . complete_book.md');
});

program.parse(process.argv);
