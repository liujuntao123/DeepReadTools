const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');
const chalk = require('chalk');

/**
 * 检查 epub2md 命令是否可用
 */
function checkEpub2md() {
  const commandsToTry = [
    'epub2md -help',
    'npx epub2md --help',
    'node -e "require(\'epub2md\')"'
  ];
  
  for (const cmd of commandsToTry) {
    try {
      execSync(cmd, { 
        stdio: 'pipe', 
        timeout: 10000 
      });
      return true;
    } catch (error) {
      continue;
    }
  }
  
  return false;
}

/**
 * 自动安装 epub2md
 */
async function autoInstallEpub2md() {
  console.log(chalk.yellow('📦 检测到缺少 epub2md 依赖，正在自动安装...'));
  console.log(chalk.gray('这可能需要几分钟时间，请耐心等待...'));
  
  try {
    // 尝试全局安装 epub2md
    execSync('npm install -g epub2md', {
      stdio: 'inherit', // 显示安装进度
      timeout: 300000   // 5分钟超时
    });
    
    console.log(chalk.green('\n✅ epub2md 安装成功！'));
    
    // 验证安装
    if (checkEpub2md()) {
      console.log(chalk.green('✅ epub2md 验证通过，可以正常使用'));
      return true;
    } else {
      console.log(chalk.yellow('⚠️  epub2md 安装完成，但验证失败'));
      console.log(chalk.gray('这可能是PATH环境变量问题，重启终端后应该可以正常使用'));
      return true; // 仍然返回true，因为安装命令成功了
    }
  } catch (error) {
    console.log(chalk.red('\n❌ epub2md 自动安装失败'));
    console.log(chalk.yellow('请手动安装：npm install -g epub2md'));
    console.log(chalk.gray(`错误信息: ${error.message}`));
    return false;
  }
}

/**
 * 确保 epub2md 可用（检查+自动安装）
 */
async function ensureEpub2md(autoInstall = true) {
  console.log(chalk.blue('🔍 检查 epub2md 依赖...'));
  
  if (checkEpub2md()) {
    console.log(chalk.green('✅ epub2md 已安装并可用'));
    return true;
  }
  
  console.log(chalk.yellow('⚠️  未检测到 epub2md'));
  
  if (!autoInstall) {
    console.log(chalk.yellow('请手动安装：npm install -g epub2md'));
    return false;
  }
  
  // 检查是否在交互式终端中
  if (process.stdin.isTTY) {
    // 交互式模式：询问用户
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    return new Promise((resolve) => {
      rl.question(chalk.cyan('是否自动安装 epub2md？(Y/n): '), async (answer) => {
        rl.close();
        
        if (answer.toLowerCase() === 'n' || answer.toLowerCase() === 'no') {
          console.log(chalk.yellow('跳过自动安装，请手动安装：npm install -g epub2md'));
          resolve(false);
          return;
        }
        
        const success = await autoInstallEpub2md();
        resolve(success);
      });
    });
  } else {
    // 非交互式模式：直接自动安装
    console.log(chalk.cyan('检测到非交互式环境，将自动安装 epub2md...'));
    const success = await autoInstallEpub2md();
    return success;
  }
}

/**
 * 清理文件名，移除不适合作为目录名的字符
 */
function sanitizeFileName(fileName) {
  // 移除或替换不适合作为目录名的字符
  return fileName
    .replace(/[<>:"/\\|?*]/g, '') // 移除Windows不允许的字符
    .replace(/\s+/g, '_') // 将空格替换为下划线
    .replace(/[^\w\u4e00-\u9fff._-]/g, '') // 只保留字母、数字、中文、点、下划线和连字符
    .replace(/^\.+|\.+$/g, '') // 移除开头和结尾的点
    .trim(); // 移除首尾空白
}

/**
 * 从epub文件路径中提取书籍名称
 */
function extractBookName(epubPath) {
  const rawName = path.basename(epubPath, path.extname(epubPath));
  return sanitizeFileName(rawName);
}

/**
 * 运行命令并处理错误
 */
function runCommand(cmd, description, options = {}) {
  // 只在详细模式下显示命令
  if (options.verbose !== false) {
    console.log(`⚙️  ${description}...`);
  }
  
  try {
    const result = execSync(cmd, {
      cwd: options.cwd || process.cwd(),
      stdio: options.stdio || 'pipe',
      encoding: 'utf8',
      ...options
    });
    
    // 只在有重要输出且不是静默模式时显示
    if (result && options.showOutput && !options.stdio) {
      console.log(result);
    }
    
    if (options.verbose !== false) {
      console.log(chalk.green(`✅ ${description}完成`));
    }
    return true;
  } catch (error) {
    console.log(chalk.red(`❌ ${description}失败`));
    if (error.stderr && !options.silent) {
      console.log(chalk.yellow(`详情: ${error.stderr.slice(0, 200)}...`));
    }
    return false;
  }
}

/**
 * 将源目录下的文件移动到目标目录
 */
async function moveFilesToDirectory(sourceDir, targetDir, excludeFiles = []) {
  const sourcePath = path.resolve(sourceDir);
  const targetPath = path.resolve(targetDir);
  
  // 创建目标目录
  await fs.ensureDir(targetPath);
  
  let movedCount = 0;
  const items = await fs.readdir(sourcePath);
  
  for (const item of items) {
    if (excludeFiles.includes(item)) continue;
    
    const itemPath = path.join(sourcePath, item);
    const targetItemPath = path.join(targetPath, item);
    
    // 检查是否尝试将目录移动到自身内部
    if (path.resolve(itemPath) === path.resolve(targetPath)) {
      console.log(`跳过: 目录 ${item} 与目标目录相同，避免移动到自身内部`);
      continue;
    }
    
    try {
      await fs.move(itemPath, targetItemPath);
      movedCount++;
    } catch (error) {
      console.log(chalk.yellow(`警告: 移动 ${item} 失败: ${error.message}`));
    }
  }
  
  console.log(chalk.green(`[√] 移动了 ${movedCount} 个文件/目录到 ${targetDir}`));
  return movedCount > 0;
}

/**
 * 复制文件
 */
async function copyFile(source, target) {
  try {
    await fs.copy(source, target);
    console.log(chalk.green(`[√] 复制文件: ${path.basename(source)} -> ${path.basename(target)}`));
    return true;
  } catch (error) {
    console.log(chalk.red(`[×] 复制文件失败: ${error.message}`));
    return false;
  }
}

module.exports = {
  checkEpub2md,
  autoInstallEpub2md,
  ensureEpub2md,
  sanitizeFileName,
  extractBookName,
  runCommand,
  moveFilesToDirectory,
  copyFile
};
