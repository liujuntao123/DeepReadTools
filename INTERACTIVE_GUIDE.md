# 交互式epub处理工具使用指南

## 新增功能 ✨

现在工具支持**引导式交互模式**，无需用户手动输入文件路径和参数，通过可视化菜单进行选择。

## 使用方法

### 1. 推荐用法 (交互式模式)

```bash
# 直接启动（默认启动交互式模式）
booktools

# 或者明确指定交互式模式
booktools interactive

# 简写形式
booktools i

# 在指定目录搜索epub文件
booktools i --dir /path/to/your/books
```

### 2. 交互式流程

1. **文件扫描**: 自动扫描当前目录（或指定目录）下的所有epub文件
2. **文件选择**: 通过方向键选择要处理的epub文件
   - 显示文件名、大小、修改时间和位置
   - 支持重新扫描或切换目录
3. **输出目录**: 选择输出目录（当前目录或自定义）
4. **处理选项**: 选择是否清理引用格式
5. **确认处理**: 最终确认后开始处理

### 3. 传统用法 (向后兼容)

```bash
# 直接指定文件
booktools process book.epub

# 指定文件和输出目录
booktools process book.epub ./output

# 跳过清理引用
booktools process book.epub --no-clean-references

# 强制启动交互式模式
booktools process --interactive
```

## 功能特点

- 🔍 **智能扫描**: 递归搜索目录下的所有epub文件
- 📋 **可视化选择**: 使用方向键和回车键选择文件
- 📊 **文件信息**: 显示文件大小、修改时间和相对路径
- 🔄 **灵活操作**: 支持重新扫描、切换目录、取消操作
- ⚙️  **选项配置**: 交互式选择处理选项
- 🎯 **用户友好**: 引导式界面，无需记忆复杂命令

## 使用示例

### 基本使用
```bash
# 启动工具
booktools

# 屏幕将显示：
# 🔍 正在扫描epub文件...
# ✅ 找到 3 个epub文件
# 
# ? 请选择要处理的epub文件: (Use arrow keys)
# ❯ 西游记.epub (1.2 MB, 昨天, test-files)
#   三国演义.epub (2.1 MB, 3天前, books)
#   红楼梦.epub (1.8 MB, 1周前, .)
#   ──────────
#   🔄 重新扫描当前目录
#   📁 在其他目录中搜索
#   ❌ 取消
```

### 目录搜索
```bash
# 在指定目录搜索
booktools i --dir ~/Downloads

# 或在交互过程中切换目录
# 选择 "📁 在其他目录中搜索"
# 输入新的目录路径
```

## 帮助信息

```bash
# 查看所有命令
booktools --help

# 查看交互式模式帮助
booktools interactive --help

# 查看process命令帮助
booktools process --help
```

## 注意事项

- 确保已安装Node.js 14.0.0或更高版本
- 工具会自动检测并安装epub2md依赖
- 交互式模式需要在支持TTY的终端中运行
- 大目录扫描可能需要一些时间，请耐心等待

## 错误处理

- 如果没有找到epub文件，工具会提示并允许切换搜索目录
- 如果选择了无效的目录，会显示错误并要求重新输入
- 可以随时取消操作而不影响现有文件
