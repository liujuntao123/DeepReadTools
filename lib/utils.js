const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');
const chalk = require('chalk');
const inquirer = require('inquirer');

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
  // 只移除或替换真正不适合作为目录名的字符
  return fileName
    .replace(/[<>:"/\\|?*]/g, '') // 移除Windows不允许的字符
    .replace(/^\.+|\.+$/g, '') // 移除开头和结尾的点
    .replace(/^\s+|\s+$/g, '') // 移除首尾空白
    .replace(/\s{2,}/g, ' '); // 将多个连续空格合并为单个空格
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

/**
 * 扫描指定目录下的epub文件
 */
async function scanEpubFiles(searchDir = process.cwd(), recursive = true) {
  const epubFiles = [];
  
  async function scanDirectory(dir) {
    try {
      const items = await fs.readdir(dir, { withFileTypes: true });
      
      for (const item of items) {
        const fullPath = path.join(dir, item.name);
        
        if (item.isDirectory() && recursive && !item.name.startsWith('.')) {
          // 递归扫描子目录（排除隐藏目录）
          await scanDirectory(fullPath);
        } else if (item.isFile() && path.extname(item.name).toLowerCase() === '.epub') {
          // 找到epub文件
          const stat = await fs.stat(fullPath);
          epubFiles.push({
            name: item.name,
            path: fullPath,
            relativePath: path.relative(searchDir, fullPath),
            size: stat.size,
            modified: stat.mtime
          });
        }
      }
    } catch (error) {
      console.log(chalk.yellow(`警告: 无法扫描目录 ${dir}: ${error.message}`));
    }
  }
  
  await scanDirectory(searchDir);
  
  // 按修改时间排序，最新的在前
  epubFiles.sort((a, b) => b.modified - a.modified);
  
  return epubFiles;
}

/**
 * 格式化文件大小显示
 */
function formatFileSize(bytes) {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

/**
 * 格式化修改时间显示
 */
function formatModifiedTime(date) {
  const now = new Date();
  const diff = now - date;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (days === 0) {
    return '今天';
  } else if (days === 1) {
    return '昨天';
  } else if (days < 7) {
    return `${days}天前`;
  } else {
    return date.toLocaleDateString('zh-CN');
  }
}

/**
 * 交互式选择epub文件
 */
async function selectEpubFile(searchDir = process.cwd(), recursive = true) {
  console.log(chalk.blue('🔍 正在扫描epub文件...'));
  
  const epubFiles = await scanEpubFiles(searchDir, recursive);
  
  if (epubFiles.length === 0) {
    console.log(chalk.yellow('未找到任何epub文件'));
    if (searchDir !== process.cwd()) {
      console.log(chalk.gray(`搜索路径: ${searchDir}`));
    }
    
    // 询问是否要更改搜索目录
    const { changeDir } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'changeDir',
        message: '是否要在其他目录中搜索epub文件？',
        default: false
      }
    ]);
    
    if (changeDir) {
      const { newDir } = await inquirer.prompt([
        {
          type: 'input',
          name: 'newDir',
          message: '请输入要搜索的目录路径:',
          default: process.cwd(),
          validate: async (input) => {
            const dirPath = path.resolve(input);
            const exists = await fs.pathExists(dirPath);
            if (!exists) {
              return '目录不存在，请输入有效的目录路径';
            }
            const stat = await fs.stat(dirPath);
            if (!stat.isDirectory()) {
              return '指定的路径不是目录';
            }
            return true;
          }
        }
      ]);
      
      return selectEpubFile(path.resolve(newDir), recursive);
    }
    
    return null;
  }
  
  console.log(chalk.green(`✅ 找到 ${epubFiles.length} 个epub文件`));
  console.log();
  
  // 创建选择列表
  const choices = epubFiles.map((file, index) => {
    const displayName = file.name;
    const size = formatFileSize(file.size);
    const modified = formatModifiedTime(file.modified);
    const location = path.dirname(file.relativePath) || '.';
    
    return {
      name: `${displayName} ${chalk.gray(`(${size}, ${modified}, ${location})`)}`,
      value: file.path,
      short: displayName
    };
  });
  
  // 添加其他选项
  choices.push(
    new inquirer.Separator(),
    {
      name: '🔄 重新扫描当前目录',
      value: 'RESCAN'
    },
    {
      name: '📁 在其他目录中搜索',
      value: 'CHANGE_DIR'
    },
    {
      name: '❌ 取消',
      value: 'CANCEL'
    }
  );
  
  const { selectedFile } = await inquirer.prompt([
    {
      type: 'list',
      name: 'selectedFile',
      message: '请选择要处理的epub文件:',
      choices: choices,
      pageSize: Math.min(15, choices.length)
    }
  ]);
  
  switch (selectedFile) {
    case 'RESCAN':
      console.log();
      return selectEpubFile(searchDir, recursive);
      
    case 'CHANGE_DIR':
      const { newDir } = await inquirer.prompt([
        {
          type: 'input',
          name: 'newDir',
          message: '请输入要搜索的目录路径:',
          default: searchDir,
          validate: async (input) => {
            const dirPath = path.resolve(input);
            const exists = await fs.pathExists(dirPath);
            if (!exists) {
              return '目录不存在，请输入有效的目录路径';
            }
            const stat = await fs.stat(dirPath);
            if (!stat.isDirectory()) {
              return '指定的路径不是目录';
            }
            return true;
          }
        }
      ]);
      
      console.log();
      return selectEpubFile(path.resolve(newDir), recursive);
      
    case 'CANCEL':
      console.log(chalk.yellow('已取消操作'));
      return null;
      
    default:
      return selectedFile;
  }
}

/**
 * 交互式选择输出目录
 */
async function selectOutputDirectory(defaultDir = process.cwd()) {
  const { outputChoice } = await inquirer.prompt([
    {
      type: 'list',
      name: 'outputChoice',
      message: '请选择输出目录:',
      choices: [
        {
          name: `📁 当前目录 ${chalk.gray(`(${defaultDir})`)}`,
          value: 'CURRENT'
        },
        {
          name: '📂 自定义目录',
          value: 'CUSTOM'
        }
      ]
    }
  ]);
  
  if (outputChoice === 'CURRENT') {
    return defaultDir;
  }
  
  const { customDir } = await inquirer.prompt([
    {
      type: 'input',
      name: 'customDir',
      message: '请输入输出目录路径:',
      default: defaultDir,
      validate: async (input) => {
        const dirPath = path.resolve(input);
        try {
          await fs.ensureDir(dirPath);
          return true;
        } catch (error) {
          return `无法创建目录: ${error.message}`;
        }
      }
    }
  ]);
  
  return path.resolve(customDir);
}

/**
 * 交互式选择处理选项
 */
async function selectProcessOptions() {
  const { options } = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'options',
      message: '请选择处理选项:',
      choices: [
        {
          name: '🧹 清理引用格式 (推荐)',
          value: 'cleanReferences',
          checked: true
        }
      ]
    }
  ]);
  
  return {
    cleanReferences: options.includes('cleanReferences')
  };
}

module.exports = {
  checkEpub2md,
  autoInstallEpub2md,
  ensureEpub2md,
  sanitizeFileName,
  extractBookName,
  runCommand,
  moveFilesToDirectory,
  copyFile,
  scanEpubFiles,
  selectEpubFile,
  selectOutputDirectory,
  selectProcessOptions,
  formatFileSize,
  formatModifiedTime
};
