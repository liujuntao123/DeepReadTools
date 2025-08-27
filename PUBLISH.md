# 📦 发布指南

## 🚀 发布到npm

### 准备工作

1. **确保已登录npm**
   ```bash
   npm login
   ```

2. **检查package.json**
   - 确认版本号
   - 确认包名没有冲突
   - 验证所有字段正确

3. **测试本地安装**
   ```bash
   npm install -g .
   booktools --version
   ```

### 发布步骤

1. **更新版本号**
   ```bash
   # 补丁版本 (1.0.0 -> 1.0.1)
   npm version patch
   
   # 小版本 (1.0.0 -> 1.1.0) 
   npm version minor
   
   # 大版本 (1.0.0 -> 2.0.0)
   npm version major
   ```

2. **发布到npm**
   ```bash
   npm publish
   ```

3. **验证发布**
   ```bash
   # 从npm安装测试
   npm install -g booktools
   booktools --version
   ```

### 发布后

1. **更新README中的安装说明**
   - 确认 `npm install -g booktools` 有效

2. **测试用户体验**
   ```bash
   # 完全卸载
   npm uninstall -g booktools
   
   # 重新从npm安装
   npm install -g booktools
   
   # 测试功能
   booktools --help
   ```

3. **推送代码到仓库**
   ```bash
   git add .
   git commit -m "Release v1.0.0"
   git push
   git tag v1.0.0
   git push --tags
   ```

## 📋 发布检查清单

- [ ] 测试所有功能正常
- [ ] 更新版本号
- [ ] 确认package.json信息正确
- [ ] README安装说明正确
- [ ] 本地测试全局安装
- [ ] 发布到npm
- [ ] 验证npm安装
- [ ] 推送代码和标签

## 🔄 版本管理

```bash
# 查看当前版本
npm version

# 查看npm上的版本
npm view booktools version

# 查看所有发布的版本
npm view booktools versions --json
```

## 📝 注意事项

1. **包名唯一性**: 确保`booktools`在npm上没有被占用
2. **版本递增**: 不能发布相同版本号
3. **依赖正确**: 确保所有依赖都在package.json中
4. **测试充分**: 发布前务必全面测试

## 🚨 回滚操作

如果发布有问题：

```bash
# 撤销最新版本（仅在发布后24小时内）
npm unpublish booktools@1.0.0

# 或者弃用版本
npm deprecate booktools@1.0.0 "This version has issues, please upgrade"
```
