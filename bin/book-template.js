#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');

async function copyTemplate(templateName = 'GEMINI.md', targetDir = process.cwd()) {
  try {
    console.log(chalk.blue('=== 模板复制工具 ==='));
    console.log(`版本: 1.0.0`);
    console.log(`兼容: Windows, macOS, Linux`);
    console.log();

    // 获取脚本所在目录，推导出项目根目录
    const scriptDir = __dirname;
    const projectRoot = path.join(scriptDir, '..');
    const templatesDir = path.join(projectRoot, 'templates');
    const templatePath = path.join(templatesDir, templateName);

    // 检查模板文件是否存在
    if (!await fs.pathExists(templatePath)) {
      console.log(chalk.red(`❌ 模板文件不存在: ${templatePath}`));
      console.log(chalk.yellow(`可用的模板文件:`));
      
      try {
        const templates = await fs.readdir(templatesDir);
        templates.forEach(template => {
          console.log(chalk.cyan(`  - ${template}`));
        });
      } catch (error) {
        console.log(chalk.red('无法读取模板目录'));
      }
      
      return false;
    }

    // 目标文件路径
    const targetPath = path.join(targetDir, templateName);

    // 检查目标文件是否已存在
    if (await fs.pathExists(targetPath)) {
      console.log(chalk.yellow(`⚠️  目标文件已存在: ${targetPath}`));
      console.log(chalk.yellow(`将会覆盖现有文件`));
    }

    // 复制模板文件
    await fs.copy(templatePath, targetPath);

    console.log(chalk.green(`✅ 成功复制模板文件:`));
    console.log(chalk.cyan(`   源文件: ${templatePath}`));
    console.log(chalk.cyan(`   目标文件: ${targetPath}`));
    console.log();
    console.log(chalk.blue(`💡 使用说明:`));
    console.log(`   1. 编辑 ${templateName} 文件来自定义提示词`);
    console.log(`   2. 将书籍内容粘贴到 AI 对话中`);
    console.log(`   3. 使用模板进行深度分析`);

    return true;

  } catch (error) {
    console.log(chalk.red(`❌ 复制过程中出现错误: ${error.message}`));
    return false;
  }
}

// 命令行参数处理
const args = process.argv.slice(2);
const templateName = args[0] || 'GEMINI.md';
const targetDir = args[1] || process.cwd();

// 执行复制
copyTemplate(templateName, targetDir).then(success => {
  process.exit(success ? 0 : 1);
});
