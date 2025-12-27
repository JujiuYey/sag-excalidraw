# SAG-Excalidraw

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Tauri](https://img.shields.io/badge/Tauri-2.x-blue)](https://tauri.app/)
[![React](https://img.shields.io/badge/React-19-61dafb)](https://react.dev/)

A free, open-source desktop application for managing and editing local Excalidraw files. Built with Tauri for a native desktop experience.

[中文文档](README-zh.md)

![screenshot](docs/images/excaliapp.jpg)

## Features

- **Local File Management** - Browse, create, rename, and delete `.excalidraw` files directly from your filesystem
- **Full Excalidraw Editor** - Complete drawing and diagramming with the official Excalidraw editor
- **Auto-Save** - Intelligent auto-save with change detection, never lose your work
- **Fast File Switching** - Quickly navigate between drawings with keyboard shortcuts
- **Tree View Navigation** - Hierarchical file browser for better organization
- **Cross-Platform** - Works on Windows, macOS, and Linux
- **Lightweight** - Small bundle size and low memory footprint thanks to Tauri
- **Privacy First** - All files stay local, no cloud sync or account required

## Installation

### Download

Download the latest release for your platform from the [Releases](https://github.com/jujiuYey/sag-excalidraw/releases) page.

| Platform | Download |
|----------|----------|
| macOS (Apple Silicon) | `.dmg` |
| macOS (Intel) | `.dmg` |
| Windows | `.msi` / `.exe` |
| Linux | `.AppImage` / `.deb` |

### Build from Source

#### Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [Rust](https://www.rust-lang.org/) (latest stable)
- Platform-specific dependencies:
  - **Windows**: [Visual Studio Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/)
  - **macOS**: Xcode Command Line Tools (`xcode-select --install`)
  - **Linux**: `build-essential`, `libwebkit2gtk-4.1-dev`, `libssl-dev`

#### Build Steps

```bash
# Clone the repository
git clone https://github.com/jujiuYey/sag-excalidraw.git
cd sag-excalidraw

# Install dependencies
npm install

# Run in development mode
npm run tauri dev

# Build for production
npm run tauri build
```

The built application will be in `src-tauri/target/release/bundle/`.

## Usage

### Quick Start

1. **Launch** the application
2. **Select a directory** containing your `.excalidraw` files (or create a new one)
3. **Create or open** files from the sidebar
4. **Draw** using the Excalidraw editor
5. Changes are **auto-saved** automatically

### Keyboard Shortcuts

| Action | Windows/Linux | macOS |
|--------|---------------|-------|
| New File | `Ctrl+N` | `Cmd+N` |
| Open Directory | `Ctrl+O` | `Cmd+O` |
| Save | `Ctrl+S` | `Cmd+S` |
| Save As | `Ctrl+Shift+S` | `Cmd+Shift+S` |
| Toggle Sidebar | `Ctrl+B` | `Cmd+B` |
| Next File | `Ctrl+Tab` | `Cmd+Tab` |
| Previous File | `Ctrl+Shift+Tab` | `Cmd+Shift+Tab` |

### File Operations

- **Create**: Click the "+" button or use `Ctrl/Cmd+N`
- **Rename**: Right-click on a file → Rename
- **Delete**: Right-click on a file → Delete
- **Open in Explorer/Finder**: Right-click on a file → Show in Explorer

## Tech Stack

- **Framework**: [Tauri 2.x](https://tauri.app/) (Rust backend + Web frontend)
- **Frontend**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Editor**: [@excalidraw/excalidraw](https://github.com/excalidraw/excalidraw)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Build Tool**: [Vite](https://vitejs.dev/)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Excalidraw](https://excalidraw.com/) - The amazing open-source whiteboard
- [Tauri](https://tauri.app/) - Build smaller, faster, and more secure desktop applications
