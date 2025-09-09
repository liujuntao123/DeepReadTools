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

// interactive 子命令 (推荐)
program
  .command('interactive')
  .alias('i')
  .description('交互式处理epub文件（推荐使用）')
  .option('-d, --dir <dir>', '搜索epub文件的目录（默认为当前目录）')
  .action((options) => {
    console.log(chalk.blue('=== epub文件处理工具 - 交互式模式 ==='));
    console.log(`版本: 1.0.0`);
    console.log(`兼容: Windows, macOS, Linux`);
    console.log();
    
    try {
      const args = ['interactive'];
      if (options.dir) args.push('--dir', options.dir);
      
      const bookProcessPath = path.join(__dirname, 'book-process.js');
      const command = `node "${bookProcessPath}" ${args.map(arg => `"${arg}"`).join(' ')}`;
      
      execSync(command, { stdio: 'inherit' });
    } catch (error) {
      console.log(chalk.red('\n[×] 处理过程中出现错误'));
      process.exit(1);
    }
  });

// process 子命令
program
  .command('process [epubPath] [outputDir]')
  .description('处理epub文件，转换为markdown并整理文件结构')
  .option('--no-clean-references', '跳过清理引用格式步骤（默认会执行清理）')
  .option('-i, --interactive', '启动交互式模式')
  .action((epubPath, outputDir, options) => {
    console.log(chalk.blue('=== epub文件处理工具 ==='));
    console.log(`版本: 1.0.0`);
    console.log(`兼容: Windows, macOS, Linux`);
    console.log();
    
    try {
      // 构建命令参数
      const args = [];
      if (epubPath) args.push(epubPath);
      if (outputDir) args.push(outputDir);
      if (!options.cleanReferences) args.push('--no-clean-references');
      if (options.interactive) args.push('--interactive');
      
      const bookProcessPath = path.join(__dirname, 'book-process.js');
      const command = `node "${bookProcessPath}" ${args.map(arg => `"${arg}"`).join(' ')}`;
      
      execSync(command, { stdio: 'inherit' });
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
  console.log('  interactive (i)  🎯 交互式处理epub文件（推荐使用）');
  console.log('  process          📚 处理epub文件，转换为markdown并整理文件结构');
  console.log('  organize         📁 重新整理已处理的书籍文件夹结构');
  console.log('  template         📄 复制模板文件到当前目录或指定目录');
  console.log('');
  console.log('推荐用法 (交互式):');
  console.log('  booktools interactive              # 在当前目录搜索并选择epub文件');
  console.log('  booktools i                        # 交互式模式简写');
  console.log('  booktools i --dir /path/to/books   # 在指定目录搜索epub文件');
  console.log('');
  console.log('传统用法 (命令行参数):');
  console.log('  booktools process                  # 启动交互式模式');
  console.log('  booktools process book.epub        # 处理指定文件');
  console.log('  booktools process book.epub ./output');
  console.log('  booktools process book.epub --no-clean-references');
  console.log('  booktools process --interactive    # 强制交互式模式');
  console.log('');
  console.log('其他命令:');
  console.log('  booktools organize 三国演义');
  console.log('  booktools organize 红楼梦 --dir /path/to/book/folder');
  console.log('  booktools template');
  console.log('  booktools template GEMINI.md');
  console.log('  booktools template GEMINI.md ./my-project');
  console.log('');
  console.log('获取子命令帮助:');
  console.log('  booktools interactive --help');
  console.log('  booktools process --help');
  console.log('  booktools organize --help');
  console.log('  booktools template --help');
  console.log('');
  console.log(chalk.yellow('💡 提示: 建议使用 "booktools interactive" 来获得最佳体验！'));
});

// 如果没有参数，启动交互式模式
if (process.argv.length <= 2) {
  console.log(chalk.blue('=== epub文件处理工具集 ==='));
  console.log(`版本: 1.0.0`);
  console.log(`兼容: Windows, macOS, Linux`);
  console.log();
  console.log(chalk.cyan('🎯 默认启动交互式模式...'));
  console.log(chalk.gray('   提示: 使用 "booktools --help" 查看所有可用命令'));
  console.log();
  
  try {
    const bookProcessPath = path.join(__dirname, 'book-process.js');
    const command = `node "${bookProcessPath}" interactive`;
    
    execSync(command, { stdio: 'inherit' });
  } catch (error) {
    console.log(chalk.red('\n[×] 启动交互式模式失败'));
    console.log(chalk.yellow('使用 "booktools --help" 查看帮助信息'));
    process.exit(1);
  }
  process.exit(0);
}

program.parse(process.argv);
