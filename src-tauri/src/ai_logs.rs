use super::*;
use std::fs;
use std::path::PathBuf;
use tauri::AppHandle;

const AI_LOGS_FILE: &str = "ai_logs.json";
const MAX_LOG_ENTRIES: usize = 1000;

fn get_logs_path(_app: &AppHandle) -> PathBuf {
    // 使用项目根目录下的logs文件夹
    let cwd = std::env::current_dir().unwrap_or(PathBuf::from("."));
    eprintln!("[get_logs_path] Current working directory: {:?}", cwd);
    
    // 检查是否在src-tauri目录下，如果是则返回上一级
    let project_root = if cwd.ends_with("src-tauri") {
        cwd.parent().unwrap_or(&cwd).to_path_buf()
    } else {
        cwd
    };
    eprintln!("[get_logs_path] Project root directory: {:?}", project_root);
    
    let logs_dir = project_root.join("logs");
    eprintln!("[get_logs_path] Logs directory: {:?}", logs_dir);
    
    if !logs_dir.exists() {
        eprintln!("[get_logs_path] Logs directory doesn't exist, creating it");
        let result = fs::create_dir_all(&logs_dir);
        eprintln!("[get_logs_path] Directory creation result: {:?}", result);
    } else {
        eprintln!("[get_logs_path] Logs directory exists");
    }
    
    let log_file = logs_dir.join(AI_LOGS_FILE);
    eprintln!("[get_logs_path] Log file path: {:?}", log_file);
    eprintln!("[get_logs_path] Log file exists: {}", log_file.exists());
    log_file
}

#[tauri::command]
pub async fn save_ai_log(app: AppHandle, log: models::LogEntry) -> Result<(), String> {
    eprintln!("[save_ai_log] Function called with log: {:?}", log);
    let logs_path = get_logs_path(&app);
    
    eprintln!("[save_ai_log] Attempting to save log to: {:?}", logs_path);
    
    let mut storage: models::LogStorage = if logs_path.exists() {
        eprintln!("[save_ai_log] Log file exists, reading existing logs");
        let content = fs::read_to_string(&logs_path)
            .map_err(|e| {
                let msg = format!("[save_ai_log] Failed to read log file: {}", e);
                eprintln!("{}", msg);
                msg
            })?;
        serde_json::from_str(&content).unwrap_or_else(|e| {
            eprintln!("[save_ai_log] Failed to parse log file: {}, creating new storage", e);
            models::LogStorage { logs: Vec::new() }
        })
    } else {
        eprintln!("[save_ai_log] Log file does not exist, creating new storage");
        models::LogStorage { logs: Vec::new() }
    };

    eprintln!("[save_ai_log] Adding log entry with timestamp: {}", log.timestamp);
    storage.logs.push(log);
    if storage.logs.len() > MAX_LOG_ENTRIES {
        eprintln!("[save_ai_log] Log storage full, truncating to {} entries", MAX_LOG_ENTRIES);
        storage.logs = storage.logs[storage.logs.len() - MAX_LOG_ENTRIES..].to_vec();
    }

    eprintln!("[save_ai_log] Serializing log storage to JSON");
    let content = serde_json::to_string_pretty(&storage)
        .map_err(|e| {
            let msg = format!("[save_ai_log] Failed to serialize log storage: {}", e);
            eprintln!("{}", msg);
            msg
        })?;

    eprintln!("[save_ai_log] Writing log file ({} bytes)", content.len());
    fs::write(&logs_path, content)
        .map_err(|e| {
            let msg = format!("[save_ai_log] Failed to write log file: {}", e);
            eprintln!("{}", msg);
            msg
        })?;
    
    eprintln!("[save_ai_log] Log saved successfully to: {:?}", logs_path);

    Ok(())
}

#[tauri::command]
pub async fn load_ai_logs(app: AppHandle) -> Result<Vec<models::LogEntry>, String> {
    let logs_path = get_logs_path(&app);

    if !logs_path.exists() {
        return Ok(Vec::new());
    }

    let content = fs::read_to_string(&logs_path)
        .map_err(|e| e.to_string())?;

    let storage: models::LogStorage = serde_json::from_str(&content)
        .map_err(|e| e.to_string())?;

    Ok(storage.logs)
}

#[tauri::command]
pub async fn clear_ai_logs(app: AppHandle) -> Result<(), String> {
    eprintln!("[clear_ai_logs] Function called");
    let logs_path = get_logs_path(&app);

    eprintln!("[clear_ai_logs] Clearing logs from: {:?}", logs_path);
    if logs_path.exists() {
        eprintln!("[clear_ai_logs] Log file exists, removing it");
        fs::remove_file(&logs_path)
            .map_err(|e| {
                let msg = format!("[clear_ai_logs] Failed to remove log file: {}", e);
                eprintln!("{}", msg);
                msg
            })?;
        eprintln!("[clear_ai_logs] Log file removed successfully");
    } else {
        eprintln!("[clear_ai_logs] Log file does not exist, nothing to do");
    }

    Ok(())
}
