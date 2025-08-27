#!/usr/bin/env node

const { Command } = require('commander');
const chalk = require('chalk');
const path = require('path');
const { execSync } = require('child_process');

const program = new Command();

// 设置程序信息
program
  .name('booktools')
  .description('书籍处理工具集：epub转换和文件夹整理')
  .version('1.0.0');

// process 子命令
program
  .command('process <epubPath> [outputDir]')
  .description('处理epub文件，转换为markdown并整理文件结构')
  .option('--no-clean-references', '跳过清理引用格式步骤（默认会执行清理）')
  .action((epubPath, outputDir, options) => {
    console.log(chalk.blue('=== epub文件处理工具 ==='));
    console.log(`版本: 1.0.0`);
    console.log(`兼容: Windows, macOS, Linux`);
    console.log();
    
    try {
      // 调用 book-process 命令
      const args = [epubPath];
      if (outputDir) args.push(outputDir);
      if (!options.cleanReferences) args.push('--no-clean-references');
      
      const bookProcessPath = path.join(__dirname, 'book-process.js');
      const command = `node "${bookProcessPath}" ${args.map(arg => `"${arg}"`).join(' ')}`;
      
      execSync(command, { stdio: 'inherit' });
      console.log(chalk.green('\n[√] 所有步骤执行成功！'));
    } catch (error) {
      console.log(chalk.red('\n[×] 处理过程中出现错误'));
      process.exit(1);
    }
  });

// organize 子命令
program
  .command('organize <bookName>')
  .description('重新整理已处理的书籍文件夹结构')
  .option('--dir <baseDir>', '书籍文件夹路径（默认为当前目录）')
  .action((bookName, options) => {
    console.log(chalk.blue('=== 书籍文件夹整理工具 ==='));
    console.log(`版本: 1.0.0`);
    console.log(`兼容: Windows, macOS, Linux`);
    console.log();
    
    try {
      // 调用 book-organize 命令
      const args = [bookName];
      if (options.dir) args.push('--dir', options.dir);
      
      const bookOrganizePath = path.join(__dirname, 'book-organize.js');
      const command = `node "${bookOrganizePath}" ${args.map(arg => `"${arg}"`).join(' ')}`;
      
      execSync(command, { stdio: 'inherit' });
      console.log(chalk.green('\n🎉 文件夹整理完成！'));
    } catch (error) {
      console.log(chalk.red('\n❌ 整理过程中出现错误'));
      process.exit(1);
    }
  });

// template 子命令
program
  .command('template [templateName] [targetDir]')
  .description('复制模板文件到当前目录或指定目录')
  .action((templateName, targetDir) => {
    console.log(chalk.blue('=== 模板复制工具 ==='));
    console.log(`版本: 1.0.0`);
    console.log(`兼容: Windows, macOS, Linux`);
    console.log();
    
    try {
      // 调用 book-template 命令
      const args = [];
      if (templateName) args.push(templateName);
      if (targetDir) args.push(targetDir);
      
      const bookTemplatePath = path.join(__dirname, 'book-template.js');
      const command = `node "${bookTemplatePath}" ${args.map(arg => `"${arg}"`).join(' ')}`;
      
      execSync(command, { stdio: 'inherit' });
    } catch (error) {
      console.log(chalk.red('\n❌ 模板复制过程中出现错误'));
      process.exit(1);
    }
  });

// 显示帮助信息
program.on('--help', () => {
  console.log('');
  console.log('子命令说明:');
  console.log('  process    处理epub文件，转换为markdown并整理文件结构');
  console.log('  organize   重新整理已处理的书籍文件夹结构');
  console.log('  template   复制模板文件到当前目录或指定目录');
  console.log('');
  console.log('示例用法:');
  console.log('  booktools process book.epub');
  console.log('  booktools process book.epub ./output');
  console.log('  booktools process book.epub --no-clean-references');
  console.log('  booktools organize 三国演义');
  console.log('  booktools organize 红楼梦 --dir /path/to/book/folder');
  console.log('  booktools template');
  console.log('  booktools template GEMINI.md');
  console.log('  booktools template GEMINI.md ./my-project');
  console.log('');
  console.log('获取子命令帮助:');
  console.log('  booktools process --help');
  console.log('  booktools organize --help');
  console.log('  booktools template --help');
});

// 如果没有参数，显示帮助
if (process.argv.length <= 2) {
  program.help();
}

program.parse(process.argv);
