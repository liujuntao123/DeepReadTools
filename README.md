# 📚 BookTools - epub电子书处理工具

> 一键将epub文件转换为整理好的markdown文档，简单易用，无需复杂配置

[![Node Version](https://img.shields.io/badge/node-14+-green.svg)](https://nodejs.org)
[![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey.svg)](https://github.com)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

## 🚀 2步快速上手

### 第一步：安装工具
```bash
npm install -g booktools
```
*📦 会自动安装epub2md依赖，无需额外配置*

### 第二步：处理你的第一本书
```bash
# 把epub文件放在任意目录，然后运行：
booktools process 我的书籍.epub

# 🎉 完成！工具会自动：
# ✅ 转换epub为markdown章节
# ✅ 合并成完整文档
# ✅ 清理格式
# ✅ 整理文件夹结构
```

### 第三步：查看结果
```
我的书籍/
├── books/              # 📁 原始章节文件
│   ├── 第一章.md
│   ├── 第二章.md
│   └── 我的书籍.md.backup
└── wiki/               # 📁 整理后的文件
    ├── 我的书籍.md     # 📄 完整的书籍内容
    └── GEMINI.md       # 📄 AI分析模板 (可用template命令生成)
```

**就这么简单！** 现在您可以用AI工具分析书籍内容，或者直接阅读整理好的markdown文档。

---

## 📖 更多用法

<details>
<summary><b>🔍 点击展开查看详细功能</b></summary>

### 常用命令

```bash
# 查看帮助
booktools --help

# 指定输出目录
booktools process 书籍.epub ./输出文件夹

# 跳过引用清理（保留原始格式）
booktools process 书籍.epub --no-clean-references

# 重新整理已处理的书籍
booktools organize 书籍名称

# 复制模板文件到当前目录
booktools template
```

### 批量处理

```bash
# Windows PowerShell
Get-ChildItem *.epub | ForEach-Object { booktools process $_.Name }

# Linux/macOS
for file in *.epub; do booktools process "$file"; done
```

### 独立工具

```bash
# 合并文件夹中的所有文件
book-merge ./章节目录 合并文件.md

# 清理markdown中的引用格式
book-clean 文件.md

# 整理书籍文件夹
book-organize 书籍名称
```

</details>

---

## 🛠️ 问题解决

<details>
<summary><b>⚠️ 遇到问题？点击查看解决方案</b></summary>

### 安装问题

**问题：`booktools: command not found`**
```bash
# 解决方案：重新安装
npm install -g booktools
# 然后重启终端
```

**问题：`epub2md: command not found`**
```bash
# 解决方案：重新安装booktools（会自动安装epub2md）
npm install -g booktools
```

**问题：权限错误（Linux/macOS）**
```bash
# 解决方案：使用用户级安装
npm install -g booktools --prefix ~/.local
```

**问题：Windows执行策略错误**
```powershell
# 解决方案：以管理员身份运行PowerShell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### 验证安装

运行这些命令检查是否安装成功：
```bash
booktools --version    # 应该显示版本号
epub2md --help         # 应该显示帮助信息
```

### 卸载

```bash
npm uninstall -g booktools
```

</details>

---

## 📋 命令参考

<details>
<summary><b>📚 点击查看完整命令列表</b></summary>

### booktools process
```bash
booktools process <epub文件> [输出目录] [选项]

选项：
  --no-clean-references  跳过引用清理
  --help                显示帮助

示例：
  booktools process 三国演义.epub
  booktools process 红楼梦.epub ./books
  booktools process 水浒传.epub --no-clean-references
```

### booktools organize
```bash
booktools organize <书籍名称> [选项]

选项：
  --dir <目录>  指定书籍文件夹路径
  --help       显示帮助

示例：
  booktools organize 三国演义
  booktools organize 红楼梦 --dir ./books
```

### booktools template
```bash
booktools template [模板名称] [目标目录]

参数：
  模板名称    要复制的模板文件名 (默认: GEMINI.md)
  目标目录    复制到的目标目录 (默认: 当前目录)

选项：
  --help     显示帮助

示例：
  booktools template                    # 复制GEMINI.md到当前目录
  booktools template GEMINI.md         # 指定模板文件名
  booktools template GEMINI.md ./docs  # 复制到指定目录
```

### book-merge
```bash
book-merge <输入目录> <输出文件>

示例：
  book-merge ./chapters book.md
  book-merge . complete.md
```

### book-clean
```bash
book-clean [文件或目录] [选项]

选项：
  --no-backup      不创建备份
  --recursive, -r  递归处理子目录
  --help          显示帮助

示例：
  book-clean book.md
  book-clean . --recursive
  book-clean ./books --no-backup
```

</details>

---

## ✨ 特性

- 🚀 **一键安装** - npm全局安装，无需复杂配置
- 📚 **epub转换** - 自动转换为markdown格式
- 🧹 **智能清理** - 去除引用格式，保留纯净内容
- 📁 **自动整理** - 创建规范的目录结构
- 📝 **模板管理** - 内置AI分析模板，快速复制使用
- 🔧 **跨平台** - Windows、macOS、Linux完全兼容
- ⚡ **高效处理** - 批量处理多个文件

## 💡 为什么选择BookTools？

| 对比项 | 传统方法 | BookTools |
|--------|----------|-----------|
| 安装复杂度 | 需要配置多个工具 | 一条命令搞定 |
| 处理步骤 | 手动多步操作 | 自动化一键处理 |
| 文件整理 | 需要手动组织 | 自动创建规范结构 |
| 格式清理 | 需要手动编辑 | 智能清理引用格式 |
| 跨平台 | 兼容性问题 | 完美跨平台 |

## 🤝 贡献与反馈

- 📝 [提交问题](https://github.com/your-repo/issues)
- 💡 [功能建议](https://github.com/your-repo/discussions)
- 🔧 [贡献代码](https://github.com/your-repo/pulls)

## 📄 许可证

MIT License - 自由使用，欢迎贡献

---

**开始您的电子书整理之旅！** 📚✨

> 💡 提示：处理完成后，可以将整理好的markdown文档导入到Obsidian、Notion等知识管理工具中，或者使用AI工具进行深度分析。