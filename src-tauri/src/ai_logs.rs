use super::*;
use std::fs;
use std::path::PathBuf;
use tauri::AppHandle;

const AI_LOGS_FILE: &str = "ai_logs.json";
const MAX_LOG_ENTRIES: usize = 1000;

fn get_logs_path(_app: &AppHandle) -> PathBuf {
    let cwd = std::env::current_dir().unwrap_or(PathBuf::from("."));
    eprintln!("Current working directory: {:?}", cwd);
    let logs_dir = cwd.join("src-tauri").join("logs");
    eprintln!("Logs directory: {:?}", logs_dir);
    
    if !logs_dir.exists() {
        eprintln!("Logs directory doesn't exist, creating it");
        let result = fs::create_dir_all(&logs_dir);
        eprintln!("Directory creation result: {:?}", result);
    }
    
    let log_file = logs_dir.join(AI_LOGS_FILE);
    eprintln!("Log file path: {:?}", log_file);
    log_file
}

#[tauri::command]
pub async fn save_ai_log(app: AppHandle, log: models::LogEntry) -> Result<(), String> {
    let logs_path = get_logs_path(&app);
    
    eprintln!("Attempting to save log to: {:?}", logs_path);
    
    let mut storage: models::LogStorage = if logs_path.exists() {
        eprintln!("Log file exists, reading existing logs");
        let content = fs::read_to_string(&logs_path)
            .map_err(|e| {
                let msg = format!("Failed to read log file: {}", e);
                eprintln!("{}", msg);
                msg
            })?;
        serde_json::from_str(&content).unwrap_or_else(|e| {
            eprintln!("Failed to parse log file: {}, creating new storage", e);
            models::LogStorage { logs: Vec::new() }
        })
    } else {
        eprintln!("Log file does not exist, creating new storage");
        models::LogStorage { logs: Vec::new() }
    };

    eprintln!("Adding log entry with timestamp: {}", log.timestamp);
    storage.logs.push(log);
    if storage.logs.len() > MAX_LOG_ENTRIES {
        eprintln!("Log storage full, truncating to {} entries", MAX_LOG_ENTRIES);
        storage.logs = storage.logs[storage.logs.len() - MAX_LOG_ENTRIES..].to_vec();
    }

    let content = serde_json::to_string_pretty(&storage)
        .map_err(|e| e.to_string())?;

    fs::write(&logs_path, content)
        .map_err(|e| {
            let msg = format!("Failed to write log file: {}", e);
            eprintln!("{}", msg);
            msg
        })?;
    
    eprintln!("Log saved successfully to: {:?}", logs_path);

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
    let logs_path = get_logs_path(&app);

    if logs_path.exists() {
        fs::remove_file(&logs_path)
            .map_err(|e| e.to_string())?;
    }

    Ok(())
}
