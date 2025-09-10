#!/usr/bin/env node

const chalk = require('chalk');
const path = require('path');
const fs = require('fs-extra');
const { execSync } = require('child_process');
const inquirer = require('inquirer');

// 动态获取版本号
function getVersion() {
  try {
    const packagePath = path.join(__dirname, '..', 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    return packageJson.version;
  } catch (error) {
    return '1.0.0';
  }
}

// 工具函数：检查epub2md是否可用
function checkEpub2md() {
  try {
    execSync('epub2md --help', { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

// 工具函数：递归搜索epub文件
function findEpubFiles(directory) {
  const epubFiles = [];
  
  function searchDir(dir) {
    try {
      const items = fs.readdirSync(dir);
      for (const item of items) {
        const itemPath = path.join(dir, item);
        const stat = fs.statSync(itemPath);
        
        if (stat.isDirectory()) {
          searchDir(itemPath);
        } else if (path.extname(item).toLowerCase() === '.epub') {
          epubFiles.push({
            name: item,
            path: itemPath,
            relativePath: path.relative(directory, itemPath),
            size: stat.size,
            mtime: stat.mtime
          });
        }
      }
    } catch (error) {
      // 忽略权限错误等问题
    }
  }
  
  searchDir(directory);
  return epubFiles;
}

// 工具函数：格式化文件大小
function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

// 工具函数：格式化时间
function formatTime(date) {
  const now = new Date();
  const diff = now - date;
  const days = Math.floor(diff / (24 * 60 * 60 * 1000));
  
  if (days === 0) return '今天';
  if (days === 1) return '昨天';
  if (days < 7) return `${days}天前`;
  if (days < 30) return `${Math.floor(days / 7)}周前`;
  return date.toLocaleDateString();
}

// 工具函数：清理markdown引用格式
function cleanReferences(content) {
  let cleaned = content;
  
  // 移除epub2md产生的特殊引用格式
  cleaned = cleaned.replace(/\[\^(\d+)\]:\s*.*$/gm, '');
  cleaned = cleaned.replace(/\[\^(\d+)\]/g, '');
  
  // 清理多余的空行
  cleaned = cleaned.replace(/\n\s*\n\s*\n/g, '\n\n');
  
  return cleaned;
}

// 工具函数：合并markdown文件
function mergeMarkdownFiles(inputDir, outputFile) {
  const files = fs.readdirSync(inputDir)
    .filter(file => path.extname(file).toLowerCase() === '.md')
    .sort();
  
  let mergedContent = '';
  
  for (const file of files) {
    const filePath = path.join(inputDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    
    mergedContent += `# ${path.basename(file, '.md')}\n\n`;
    mergedContent += content + '\n\n';
  }
  
  fs.writeFileSync(outputFile, mergedContent, 'utf8');
}

// 核心功能：复制.claude模板目录
function copyClaudeTemplate() {
  try {
    const templatesDir = path.join(__dirname, '..', 'templates');
    const claudeSourceDir = path.join(templatesDir, '.claude');
    const claudeTargetDir = path.join(process.cwd(), '.claude');
    
    if (!fs.existsSync(claudeSourceDir)) {
      console.log(chalk.yellow('⚠️  .claude模板目录不存在，跳过复制'));
      return;
    }
    
    if (fs.existsSync(claudeTargetDir)) {
      console.log(chalk.blue('📄 .claude目录已存在，跳过复制'));
      return;
    }
    
    fs.copySync(claudeSourceDir, claudeTargetDir);
    console.log(chalk.green('✅ .claude模板目录已复制'));
    
  } catch (error) {
    console.log(chalk.yellow(`⚠️  复制.claude模板失败: ${error.message}`));
  }
}

// 核心功能：处理epub文件（简化版）
async function processEpub(epubPath) {
  try {
    console.log(chalk.blue(`\n📚 开始处理: ${path.basename(epubPath)}`));
    
    // 检查epub2md
    if (!checkEpub2md()) {
      throw new Error('epub2md未安装或不可用。请运行: npm install -g epub2md');
    }
    
    // 检查文件是否存在
    if (!fs.existsSync(epubPath)) {
      throw new Error(`文件不存在: ${epubPath}`);
    }
    
    const bookName = path.basename(epubPath, '.epub');
    
    console.log(chalk.blue('🔄 转换epub到markdown...'));
    try {
      execSync(`epub2md "${epubPath}"`, { stdio: 'inherit' });
    } catch (error) {
      throw new Error('epub转换失败');
    }

    // epub2md转换后会产生一个以bookName命名的目录
    const workDir = path.join(process.cwd(), bookName);
    
    // 检查转换后的目录是否存在
    if (!fs.existsSync(workDir)) {
      throw new Error(`转换后的目录不存在: ${workDir}`);
    }

    // 创建books目录
    const booksDir = path.join(workDir, 'books');
    fs.ensureDirSync(booksDir);
    console.log(chalk.blue('📁 创建books目录...'));
    
    // 将workDir下的所有文件移动到books目录下
    console.log(chalk.blue('📦 移动文件到books目录...'));
    const items = fs.readdirSync(workDir);
    let movedCount = 0;
    
    for (const item of items) {
      // 跳过books目录本身
      if (item === 'books') continue;
      
      const srcPath = path.join(workDir, item);
      const destPath = path.join(booksDir, item);
      
      try {
        fs.moveSync(srcPath, destPath);
        movedCount++;
        console.log(chalk.gray(`   ✓ ${item}`));
      } catch (error) {
        console.log(chalk.yellow(`   ⚠️  无法移动 ${item}: ${error.message}`));
      }
    }
    
    console.log(chalk.blue(`📦 已移动 ${movedCount} 个文件/目录到books目录`));
    
    // 清理books目录中的所有md文件的引用格式
    console.log(chalk.blue('🧹 清理引用格式...'));
    const mdFiles = fs.readdirSync(booksDir)
      .filter(file => path.extname(file).toLowerCase() === '.md')
      .map(file => path.join(booksDir, file));
    
    for (const mdFile of mdFiles) {
      const content = fs.readFileSync(mdFile, 'utf8');
      const cleaned = cleanReferences(content);
      fs.writeFileSync(mdFile, cleaned, 'utf8');
    }
    
    // 在workDir中复制.claude模板（不是在当前目录）
    const originalCwd = process.cwd();
    process.chdir(workDir);
    copyClaudeTemplate();
    process.chdir(originalCwd);
    
    console.log(chalk.green('\n✅ 处理完成！'));
    console.log(chalk.cyan(`📁 查看结果: ${booksDir}`));
    console.log(chalk.cyan(`📄 找到 ${mdFiles.length} 个markdown文件`));
    
    return { success: true, booksDir, fileCount: mdFiles.length };
    
  } catch (error) {
    console.log(chalk.red(`\n❌ 处理失败: ${error.message}`));
    return { success: false, error: error.message };
  }
}

// 核心功能：整理当前目录文件
async function organizeCurrentDirectory() {
  try {
    const currentDir = process.cwd();
    const currentDirName = path.basename(currentDir);
    const targetDir = path.join(currentDir, currentDirName);
    
    console.log(chalk.blue(`\n📁 开始整理当前目录到: ${currentDirName}`));
    
    // 创建目标目录
    fs.ensureDirSync(targetDir);
    
    // 获取当前目录下的所有md文件（除了todo.md）
    const items = fs.readdirSync(currentDir);
    const itemsToMove = items.filter(item => {
      const itemPath = path.join(currentDir, item);
      const isFile = fs.statSync(itemPath).isFile();
      const isMdFile = path.extname(item).toLowerCase() === '.md';
      return isFile && isMdFile && item !== 'todo.md';
    });
    
    if (itemsToMove.length === 0) {
      console.log(chalk.yellow('没有md文件需要移动'));
      return;
    }
    
    console.log(chalk.blue(`📦 移动 ${itemsToMove.length} 个md文件...`));
    
    for (const item of itemsToMove) {
      const srcPath = path.join(currentDir, item);
      const destPath = path.join(targetDir, item);
      
      try {
        if (fs.existsSync(destPath)) {
          // 如果目标已存在，先删除
          fs.removeSync(destPath);
        }
        fs.moveSync(srcPath, destPath);
        console.log(chalk.gray(`   ✓ ${item}`));
      } catch (error) {
        console.log(chalk.yellow(`   ⚠️  无法移动 ${item}: ${error.message}`));
      }
    }
    
    console.log(chalk.green(`\n✅ 整理完成！文件已移动到: ${targetDir}`));
    
  } catch (error) {
    console.log(chalk.red(`❌ 整理失败: ${error.message}`));
    throw error;
  }
}

// 主要交互式流程
async function mainInteractiveFlow() {
  try {
    const version = getVersion();
    
    console.log(chalk.blue('=== epub文件处理工具 ==='));
    console.log(`版本: ${version}`);
    console.log(`兼容: Windows, macOS, Linux`);
    console.log();
    
    // 首先询问用户要做什么
    const { action } = await inquirer.prompt([{
      type: 'list',
      name: 'action',
      message: '请选择操作:',
      choices: [
        { name: '📚 处理epub文件', value: 'process' },
        { name: '📁 整理当前目录', value: 'organize' },
        { name: '❌ 退出', value: 'exit' }
      ]
    }]);
    
    if (action === 'exit') {
      console.log(chalk.yellow('再见！'));
      return;
    }
    
    if (action === 'organize') {
      await organizeCurrentDirectory();
      return;
    }
    
    // 处理epub文件
    console.log(chalk.blue('\n🔍 正在扫描epub文件...'));
    const epubFiles = findEpubFiles(process.cwd());
    
    if (epubFiles.length === 0) {
      console.log(chalk.yellow('❌ 当前目录未找到epub文件'));
      console.log(chalk.gray('提示: 请将epub文件放在当前目录或其子目录中'));
      return;
    }
    
    console.log(chalk.green(`✅ 找到 ${epubFiles.length} 个epub文件`));
    
    // 构建选择列表
    const choices = epubFiles.map(file => ({
      name: `${file.name} (${formatFileSize(file.size)}, ${formatTime(file.mtime)}, ${path.dirname(file.relativePath) || '.'})`,
      value: file.path
    }));
    
    const { selectedFile } = await inquirer.prompt([{
      type: 'list',
      name: 'selectedFile',
      message: '请选择要处理的epub文件:',
      choices: choices,
      pageSize: 15
    }]);
    
    // 处理选定的文件
    await processEpub(selectedFile);
    
  } catch (error) {
    console.log(chalk.red(`❌ 操作失败: ${error.message}`));
  }
}

// 处理命令行参数
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  const version = getVersion();
  console.log(`booktools v${version}`);
  console.log();
  console.log('📚 epub文件处理工具');
  console.log();
  console.log('用法:');
  console.log('  booktools              启动交互式模式');
  console.log('  booktools --help       显示帮助信息');
  console.log('  booktools --version    显示版本信息');
  console.log();
  console.log('功能:');
  console.log('  📚 转换epub为markdown文件');
  console.log('  📁 整理文件夹结构');
  console.log('  📄 自动复制AI分析模板');
  console.log();
  console.log('💡 提示: 直接运行 "booktools" 开始使用！');
  process.exit(0);
}

if (process.argv.includes('--version') || process.argv.includes('-v')) {
  console.log(getVersion());
  process.exit(0);
}

// 启动主流程
mainInteractiveFlow().catch(error => {
  console.log(chalk.red(`\n💥 严重错误: ${error.message}`));
  process.exit(1);
});