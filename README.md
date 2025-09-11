# 📚 BookTools - AI驱动的电子书知识图谱构建工具

> 一键将epub转换为结构化markdown，并自动构建AI知识图谱，让每本书都成为可深度分析的知识网络


## 🔗 相关资源

- 📖 [**AI驱动的书籍知识图谱制作完整指南**](https://deepread.aizhi.site/AI驱动的书籍知识图谱制作完整指南) - 详细的制作教程
- 🎯 [**Demo项目代码库**](https://github.com/liujuntao123/DeepRead) - 完整的演示项目和案例

## 🚀 2步快速上手

### 第一步：安装工具
```bash
npm install -g booktools
```
*📦 会自动安装epub2md依赖，无需额外配置*

### 第二步：启动交互式工具
```bash
# 进入包含epub文件的目录，然后运行：
booktools

# 🎯 工具会自动：
# ✅ 扫描当前目录下的所有epub文件
# ✅ 提供友好的交互式选择界面
# ✅ 一键完成转换和整理流程
```

### 工作流程展示
```
📚 epub文件处理工具
版本: 1.1.0
兼容: Windows, macOS, Linux

? 请选择操作: (Use arrow keys)
❯ 📚 处理epub文件
  📁 整理当前目录  
  ❌ 退出

🔍 正在扫描epub文件...
✅ 找到 3 个epub文件

? 请选择要处理的epub文件: (Use arrow keys)
❯ 三国演义.epub (2.1 MB, 2天前, .)
  红楼梦.epub (3.5 MB, 1周前, ./classics)
  水浒传.epub (2.8 MB, 昨天, ./books)
```

### 处理结果
```
我的书籍/
├── .claude/            # 🤖 AI代理工作流模板
│   ├── agents/        # 知识架构师和节点生成器
│   └── commands/      # 初始构建和节点生成命令
└── books/             # 📁 原始markdown章节文件
    ├── 第一章.md
    ├── 第二章.md
    └── ...
```

**就这么简单！** 现在您可以使用AI进行深度分析，构建完整的知识图谱网络。


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

---

## 🤖 AI知识图谱构建

处理完epub文件后，BookTools会自动复制.claude模板到输出目录，让您可以直接使用AI构建专业的知识图谱网络。

### AI工作流

```text
我的书籍/
├── .claude/                    # 🤖 AI工作流模板
│   ├── agents/                # AI代理定义
│   │   ├── Architect.md       # 知识架构师 - 负责分析和设计蓝图
│   │   └── Generator.md       # 节点生成器 - 负责生成知识节点
│   └── commands/              # 工作流命令
│       ├── Initial_construction.md  # 初始构建命令
│       └── node_generation.md      # 节点生成命令
└── books/                     # 📁 原始章节文件
    ├── 第一章.md
    └── ...
```

### 使用步骤

1. **打开Claude Code** - 在目录下打开Claude Code
2. **执行初始构建** - 运行 `Initial_construction` 命令，生成知识网络蓝图
3. **自动化节点生成** - 运行 `node_generation` 命令，批量生成所有知识节点
4. **享受知识图谱** - 获得完整的、相互关联的知识网络

### 工作流特性

- 🎯 **专业架构** - 基于"核心实体、核心抽象、关键事件"三大类别构建
- 📊 **结构化输出** - 每个知识节点包含YAML元数据、原文引述、展开阐述和关联网络
- 🔗 **智能关联** - 自动识别并链接相关知识节点，构建完整知识网络
- ⚡ **批量处理** - 支持自动化批量生成，无需手动逐个处理
- 📋 **任务管理** - 内置todo系统，实时跟踪构建进度


---

## ✨ 特性

- 🚀 **一键安装** - npm全局安装，无需复杂配置
- 🎯 **交互式界面** - 友好的命令行交互，自动扫描和选择epub文件
- 📚 **智能转换** - 自动转换epub为结构化markdown格式
- 🧹 **智能清理** - 去除引用格式，保留纯净内容
- 📁 **自动整理** - 创建books目录，规范化文件结构
- 🤖 **AI工作流集成** - 自动复制.claude模板，支持AI代理知识图谱构建
- 📊 **知识图谱构建** - 内置专业的Wiki知识网络分析框架
- 🔧 **跨平台兼容** - Windows、macOS、Linux完全兼容
- ⚡ **递归搜索** - 智能扫描目录树中的所有epub文件
- 📋 **文件信息展示** - 显示文件大小、修改时间和相对路径

## 🙏 鸣谢

感谢以下开源项目和贡献者：

- **[epub2md](https://github.com/zacchaeus1/epub2md)** - 提供了epub转markdown的核心功能
- **所有使用者和贡献者** - 感谢您的反馈和建议，让工具不断完善

## 🤝 贡献与反馈

- 📝 [提交问题](https://github.com/your-repo/issues)
- 💡 [功能建议](https://github.com/your-repo/discussions)
- 🔧 [贡献代码](https://github.com/your-repo/pulls)

## 📄 许可证

MIT License - 自由使用，欢迎贡献

---

**开始您的AI驱动知识图谱构建之旅！** 📚🤖✨

> 💡 提示：处理完成后，您可以：
> - 🤖 使用Claude AI自动构建专业知识图谱网络
> - 📊 导入到Obsidian、Notion等工具进行可视化管理
> - 🔍 享受结构化的、相互关联的深度知识分析体验