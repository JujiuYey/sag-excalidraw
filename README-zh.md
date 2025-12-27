# SAG-Excalidraw

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Tauri](https://img.shields.io/badge/Tauri-2.x-blue)](https://tauri.app/)
[![React](https://img.shields.io/badge/React-19-61dafb)](https://react.dev/)

一款免费开源的桌面应用，用于管理和编辑本地 Excalidraw 文件。基于 Tauri 构建，提供原生桌面体验。

[English](README.md)

![screenshot](docs/images/excaliapp.jpg)

## 功能特性

- **本地文件管理** - 直接从文件系统浏览、创建、重命名和删除 `.excalidraw` 文件
- **完整的 Excalidraw 编辑器** - 使用官方 Excalidraw 编辑器进行绘图和图表制作
- **智能自动保存** - 带有变更检测的自动保存，永不丢失工作
- **快速文件切换** - 通过键盘快捷键在多个图表之间快速导航
- **树形视图导航** - 分层文件浏览器，更好地组织文件
- **跨平台** - 支持 Windows、macOS 和 Linux
- **轻量级** - 得益于 Tauri，拥有小巧的包体积和低内存占用
- **隐私优先** - 所有文件保存在本地，无需云同步或账户

## 安装

### 下载

从 [Releases](https://github.com/jujiuYey/sag-excalidraw/releases) 页面下载适合您平台的最新版本。

| 平台 | 下载格式 |
|------|----------|
| macOS (Apple Silicon) | `.dmg` |
| macOS (Intel) | `.dmg` |
| Windows | `.msi` / `.exe` |
| Linux | `.AppImage` / `.deb` |

### 从源码构建

#### 前置要求

- [Node.js](https://nodejs.org/) v18+
- [Rust](https://www.rust-lang.org/)（最新稳定版）
- 平台特定依赖：
  - **Windows**: [Visual Studio Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/)
  - **macOS**: Xcode 命令行工具 (`xcode-select --install`)
  - **Linux**: `build-essential`, `libwebkit2gtk-4.1-dev`, `libssl-dev`

#### 构建步骤

```bash
# 克隆仓库
git clone https://github.com/jujiuYey/sag-excalidraw.git
cd sag-excalidraw

# 安装依赖
npm install

# 开发模式运行
npm run tauri dev

# 构建生产版本
npm run tauri build
```

构建完成后，应用程序位于 `src-tauri/target/release/bundle/` 目录。

## 使用指南

### 快速开始

1. **启动** 应用程序
2. **选择目录** - 选择包含 `.excalidraw` 文件的目录（或创建新目录）
3. **创建或打开** 侧边栏中的文件
4. **绘制** - 使用 Excalidraw 编辑器进行绘图
5. 更改会 **自动保存**

### 键盘快捷键

| 操作 | Windows/Linux | macOS |
|------|---------------|-------|
| 新建文件 | `Ctrl+N` | `Cmd+N` |
| 打开目录 | `Ctrl+O` | `Cmd+O` |
| 保存 | `Ctrl+S` | `Cmd+S` |
| 另存为 | `Ctrl+Shift+S` | `Cmd+Shift+S` |
| 切换侧边栏 | `Ctrl+B` | `Cmd+B` |
| 下一个文件 | `Ctrl+Tab` | `Cmd+Tab` |
| 上一个文件 | `Ctrl+Shift+Tab` | `Cmd+Shift+Tab` |

### 文件操作

- **创建**: 点击 "+" 按钮或使用 `Ctrl/Cmd+N`
- **重命名**: 右键点击文件 → 重命名
- **删除**: 右键点击文件 → 删除
- **在资源管理器中显示**: 右键点击文件 → 在资源管理器中显示

## 技术栈

- **框架**: [Tauri 2.x](https://tauri.app/)（Rust 后端 + Web 前端）
- **前端**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **编辑器**: [@excalidraw/excalidraw](https://github.com/excalidraw/excalidraw)
- **样式**: [Tailwind CSS](https://tailwindcss.com/)
- **状态管理**: [Zustand](https://github.com/pmndrs/zustand)
- **构建工具**: [Vite](https://vitejs.dev/)

## 贡献

欢迎贡献！请随时提交 Pull Request。

1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

## 许可证

本项目基于 MIT 许可证开源 - 详见 [LICENSE](LICENSE) 文件。

## 致谢

- [Excalidraw](https://excalidraw.com/) - 优秀的开源白板工具
- [Tauri](https://tauri.app/) - 构建更小、更快、更安全的桌面应用
