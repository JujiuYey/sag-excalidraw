# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SAG-Excalidraw is a desktop application for managing and editing local `.excalidraw` files. Built with Tauri 2.x (Rust backend) and React 19 (TypeScript frontend).

## Development Commands

```bash
# Install dependencies
pnpm install

# Development mode (runs both frontend and Tauri backend)
pnpm tauri dev

# Build for production
pnpm tauri build

# Run tests
pnpm test           # Watch mode
pnpm test:run       # Single run
pnpm test:coverage  # With coverage

# Type checking and linting
pnpm build          # Runs tsc && vite build
```

## Architecture

### Frontend (`src/`)

- **Entry**: `main.tsx` → `App.tsx`
- **State Management**: Zustand stores in `src/store/`
  - `fileStore.ts` - File operations, directory management, active file state
  - `uiStore.ts` - UI preferences (theme, sidebar visibility)
  - `aiStore.ts` / `aiConfigStore.ts` - AI chat feature state
- **Components**: `src/components/`
  - `ExcalidrawEditor/` - Wraps @excalidraw/excalidraw
  - `Sidebar/` - File tree navigation
  - `TopBar/` - Application toolbar
  - `AIChatPanel/` - AI assistant panel
  - `SettingsDialog/` - User preferences

### Backend (`src-tauri/src/`)

- **Entry**: `main.rs` → `lib.rs`
- **Tauri Commands** (invoked from frontend via `invoke()`):
  - `select_directory`, `list_excalidraw_files`, `get_file_tree`
  - `read_file`, `save_file`, `save_file_as`
  - `create_new_file`, `rename_file`, `delete_file`
  - `get_preferences`, `save_preferences`
  - `watch_directory`, `force_close_app`
- **Security**: `security.rs` - Path validation, content validation

### Frontend-Backend Communication

- Uses `@tauri-apps/api/core` `invoke()` for commands
- Uses `@tauri-apps/api/event` `listen()` for events (e.g., `file-system-change`, `check-unsaved-before-close`)
- File watcher in Rust emits events when `.excalidraw` files change

### Key Patterns

- **Path aliasing**: `@/` maps to `src/` (configured in `vite.config.ts`)
- **Auto-save**: Changes detected in ExcalidrawEditor trigger `isDirty` state, save on file switch
- **File tree**: Only directories containing `.excalidraw` files are shown
- **Unsaved changes handling**: Modal prompts before file switch or app close

## UI Stack

- Ant Design 6.x for components
- Tailwind CSS 4.x for styling
- Lucide React for icons

## Testing

- Vitest with jsdom environment
- React Testing Library
- Setup file: `src/test/setup.ts`

## Tauri Plugins Used

- `tauri-plugin-dialog` - File/folder dialogs
- `tauri-plugin-fs` - File system access
- `tauri-plugin-store` - Persistent preferences storage
- `tauri-plugin-clipboard-manager` - Clipboard operations
- `tauri-plugin-opener` - Open files externally
