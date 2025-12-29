use super::*;
use notify::{Event, EventKind, RecursiveMode, Watcher};
use std::fs;
use std::path::{Path, PathBuf};
use std::sync::mpsc;
use tauri::{AppHandle, Emitter, State};

#[tauri::command]
pub async fn select_directory(app: AppHandle) -> Result<Option<String>, String> {
    use tauri_plugin_dialog::DialogExt;

    let (tx, rx) = mpsc::channel();

    app.dialog().file().pick_folder(move |path| {
        let _ = tx.send(path);
    });

    match rx.recv() {
        Ok(Some(path)) => Ok(Some(path.to_string())),
        Ok(None) => Ok(None),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
pub async fn list_excalidraw_files(directory: String) -> Result<Vec<models::ExcalidrawFile>, String> {
    let path = Path::new(&directory);

    if !path.exists() {
        return Err("Directory does not exist".to_string());
    }

    let mut files = Vec::new();
    collect_excalidraw_files_recursive(path, &mut files)?;
    files.sort_by(|a, b| a.name.cmp(&b.name));
    Ok(files)
}

#[tauri::command]
pub async fn get_file_tree(directory: String) -> Result<Vec<models::FileTreeNode>, String> {
    let path = Path::new(&directory);

    if !path.exists() {
        return Err("Directory does not exist".to_string());
    }

    let mut tree = Vec::new();
    build_file_tree(path, &mut tree)?;
    tree.sort_by(|a, b| match (a.is_directory, b.is_directory) {
        (true, false) => std::cmp::Ordering::Less,
        (false, true) => std::cmp::Ordering::Greater,
        _ => a.name.cmp(&b.name),
    });
    Ok(tree)
}

fn collect_excalidraw_files_recursive(
    dir: &Path,
    files: &mut Vec<models::ExcalidrawFile>,
) -> Result<(), String> {
    match fs::read_dir(dir) {
        Ok(entries) => {
            for entry in entries.flatten() {
                let path = entry.path();
                if path.is_file() {
                    if let Some(extension) = path.extension() {
                        if extension == "excalidraw" {
                            if let Some(file_name) = path.file_name() {
                                files.push(models::ExcalidrawFile {
                                    name: file_name.to_string_lossy().to_string(),
                                    path: path.to_string_lossy().to_string(),
                                    modified: false,
                                });
                            }
                        }
                    }
                } else if path.is_dir() {
                    collect_excalidraw_files_recursive(&path, files)?;
                }
            }
        }
        Err(e) => return Err(e.to_string()),
    }
    Ok(())
}

fn build_file_tree(dir: &Path, tree: &mut Vec<models::FileTreeNode>) -> Result<(), String> {
    match fs::read_dir(dir) {
        Ok(entries) => {
            for entry in entries.flatten() {
                let path = entry.path();
                let name = path
                    .file_name()
                    .ok_or("Invalid file name")?
                    .to_string_lossy()
                    .to_string();

                if path.is_dir() {
                    let mut children = Vec::new();
                    build_file_tree(&path, &mut children)?;

                    if has_excalidraw_files(&path)? {
                        children.sort_by(|a, b| match (a.is_directory, b.is_directory) {
                            (true, false) => std::cmp::Ordering::Less,
                            (false, true) => std::cmp::Ordering::Greater,
                            _ => a.name.cmp(&b.name),
                        });

                        tree.push(models::FileTreeNode {
                            name,
                            path: path.to_string_lossy().to_string(),
                            is_directory: true,
                            modified: false,
                            children: Some(children),
                        });
                    }
                } else if path.is_file() {
                    if let Some(extension) = path.extension() {
                        if extension == "excalidraw" {
                            tree.push(models::FileTreeNode {
                                name,
                                path: path.to_string_lossy().to_string(),
                                is_directory: false,
                                modified: false,
                                children: None,
                            });
                        }
                    }
                }
            }
        }
        Err(e) => return Err(e.to_string()),
    }
    Ok(())
}

fn has_excalidraw_files(dir: &Path) -> Result<bool, String> {
    match fs::read_dir(dir) {
        Ok(entries) => {
            for entry in entries.flatten() {
                let path = entry.path();
                if path.is_file() {
                    if let Some(extension) = path.extension() {
                        if extension == "excalidraw" {
                            return Ok(true);
                        }
                    }
                } else if path.is_dir() && has_excalidraw_files(&path)? {
                    return Ok(true);
                }
            }
        }
        Err(e) => return Err(e.to_string()),
    }
    Ok(false)
}

#[tauri::command]
pub async fn read_file(file_path: String) -> Result<String, String> {
    let path = Path::new(&file_path);
    let validated_path = security::validate_path(path, None)?;
    
    security::validate_excalidraw_file(&validated_path)?;
    
    let content = fs::read_to_string(&validated_path)
        .map_err(|e| e.to_string())?;
    
    security::validate_excalidraw_content(&content)?;
    
    Ok(content)
}

#[tauri::command]
pub async fn save_file(file_path: String, content: String) -> Result<(), String> {
    let path = Path::new(&file_path);
    let validated_path = security::validate_path(path, None)?;
    
    security::validate_excalidraw_file(&validated_path)?;
    
    security::validate_excalidraw_content(&content)?;
    
    fs::write(&validated_path, content)
        .map_err(|e| e.to_string())?;
    
    Ok(())
}

#[tauri::command]
pub async fn save_file_as(app: AppHandle, content: String) -> Result<Option<String>, String> {
    use tauri_plugin_dialog::DialogExt;

    let (tx, rx) = mpsc::channel();

    app.dialog()
        .file()
        .add_filter("Excalidraw", &["excalidraw"])
        .set_title("Save As")
        .save_file(move |path| {
            let _ = tx.send(path);
        });

    match rx.recv() {
        Ok(Some(path)) => {
            let path_str = path.to_string();
            match fs::write(&path_str, content) {
                Ok(_) => Ok(Some(path_str)),
                Err(e) => Err(e.to_string()),
            }
        }
        Ok(None) => Ok(None),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
pub async fn create_new_file(directory: String, file_name: String) -> Result<String, String> {
    println!(
        "[create_new_file] Called with directory: {}, file_name: {}",
        directory, file_name
    );

    let dir_path = Path::new(&directory);
    let validated_dir = security::validate_path(dir_path, None)?;
    
    if !validated_dir.is_dir() {
        return Err(format!("Path is not a directory: {}", directory));
    }

    let mut path = security::safe_path_join(&validated_dir, &file_name)?;
    println!("[create_new_file] Initial path: {:?}", path);

    if path.exists() {
        println!("[create_new_file] File already exists, finding unique name");
        let mut counter = 1;

        let stem = path
            .file_stem()
            .and_then(|s| s.to_str())
            .ok_or("Invalid file name")?
            .to_string();

        let base_stem = if stem.ends_with(".excalidraw") {
            stem.trim_end_matches(".excalidraw").to_string()
        } else {
            stem
        };

        loop {
            let new_name = format!("{}-{}.excalidraw", base_stem, counter);
            path = dir_path.join(&new_name);

            if !path.exists() {
                println!("[create_new_file] Found unique name: {:?}", path);
                break;
            }
            counter += 1;

            if counter > 100 {
                return Err("Could not find unique file name".to_string());
            }
        }
    }

    let default_content = serde_json::json!({
        "type": "excalidraw",
        "version": 2,
        "source": "SAG-Excalidraw",
        "elements": [],
        "appState": {
            "gridSize": null,
            "viewBackgroundColor": "#ffffff"
        },
        "files": {}
    });

    let content_str = serde_json::to_string_pretty(&default_content)
        .map_err(|e| format!("Failed to serialize content: {}", e))?;

    println!("[create_new_file] Writing to path: {:?}", path);
    match fs::write(&path, &content_str) {
        Ok(_) => {
            println!("[create_new_file] Successfully created file: {:?}", path);

            if !path.exists() {
                eprintln!("[create_new_file] File doesn't exist after creation!");
                return Err("File creation verification failed".to_string());
            }

            match fs::read_to_string(&path) {
                Ok(read_content) => {
                    println!(
                        "[create_new_file] File verified, content length: {}",
                        read_content.len()
                    );
                }
                Err(e) => {
                    eprintln!(
                        "[create_new_file] Warning: Could not verify file content: {}",
                        e
                    );
                }
            }

            Ok(path.to_string_lossy().to_string())
        }
        Err(e) => {
            eprintln!("[create_new_file] Failed to create file: {}", e);
            Err(format!("Failed to create file: {}", e))
        }
    }
}

#[tauri::command]
pub async fn rename_file(old_path: String, new_name: String) -> Result<String, String> {
    let old_path = Path::new(&old_path);
    let validated_old = security::validate_path(old_path, None)?;
    
    if !validated_old.exists() {
        return Err("File does not exist".to_string());
    }
    
    security::validate_excalidraw_file(&validated_old)?;

    let parent = validated_old.parent().ok_or("Invalid file path")?;
    
    let new_path = security::safe_path_join(parent, &new_name)?;
    
    let new_path = if new_path.extension() != Some(std::ffi::OsStr::new("excalidraw")) {
        new_path.with_extension("excalidraw")
    } else {
        new_path
    };

    if new_path.exists() && new_path != old_path {
        return Err("A file with that name already exists".to_string());
    }

    let content = match fs::read_to_string(old_path) {
        Ok(content) => content,
        Err(e) => return Err(format!("Failed to read original file: {}", e)),
    };

    match fs::write(&new_path, &content) {
        Ok(_) => {},
        Err(e) => return Err(format!("Failed to create new file: {}", e)),
    }

    match fs::read_to_string(&new_path) {
        Ok(new_content) => {
            if new_content != content {
                eprintln!("Warning: New file content doesn't match original!");
                let _ = fs::remove_file(&new_path);
                return Err("File content verification failed".to_string());
            }
        }
        Err(e) => {
            eprintln!("Failed to verify new file: {}", e);
            let _ = fs::remove_file(&new_path);
            return Err(format!("Failed to verify new file: {}", e));
        }
    }

    match fs::remove_file(old_path) {
        Ok(_) => Ok(new_path.to_string_lossy().to_string()),
        Err(e) => {
            eprintln!("Warning: Failed to delete original file: {}", e);
            Ok(new_path.to_string_lossy().to_string())
        }
    }
}

#[tauri::command]
pub async fn delete_file(file_path: String) -> Result<(), String> {
    let path = Path::new(&file_path);
    let validated_path = security::validate_path(path, None)?;
    
    if !validated_path.exists() {
        return Err("File does not exist".to_string());
    }
    
    security::validate_excalidraw_file(&validated_path)?;

    fs::remove_file(&validated_path)
        .map_err(|e| e.to_string())?;
    
    Ok(())
}

#[tauri::command]
pub async fn watch_directory(
    app: AppHandle,
    directory: String,
    state: State<'_, models::AppState>,
) -> Result<(), String> {
    let path = PathBuf::from(&directory);

    {
        let mut current_dir = state.current_directory.lock().unwrap();
        *current_dir = Some(path.clone());
    }

    let app_handle = app.clone();
    let (tx, rx) = std::sync::mpsc::channel();

    let mut watcher = notify::recommended_watcher(tx).map_err(|e| e.to_string())?;

    watcher
        .watch(&path, RecursiveMode::Recursive)
        .map_err(|e| e.to_string())?;

    std::thread::spawn(move || loop {
        match rx.recv() {
            Ok(Ok(Event {
                kind: EventKind::Create(_) | EventKind::Remove(_) | EventKind::Modify(_),
                paths,
                ..
            })) => {
                for path in paths {
                    if let Some(extension) = path.extension() {
                        if extension == "excalidraw" {
                            let _ = app_handle.emit("file-system-change", &path);
                        }
                    }
                }
            }
            Ok(Err(e)) => eprintln!("Watch error: {:?}", e),
            Err(e) => {
                eprintln!("Watch channel error: {:?}", e);
                break;
            }
            _ => {}
        }
    });

    Ok(())
}

#[tauri::command]
pub async fn force_close_app(app: AppHandle) -> Result<(), String> {
    app.exit(0);
    Ok(())
}
