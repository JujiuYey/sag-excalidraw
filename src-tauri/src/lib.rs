mod security;
mod models;
mod file_ops;
mod preferences;
mod ai_logs;

use tauri::{ Emitter, Manager };
use std::sync::Mutex;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_clipboard_manager::init())
        .setup(|app| {
            app.manage(models::AppState {
                current_directory: Mutex::new(None),
                modified_files: Mutex::new(Vec::new()),
            });

            let window = app.get_webview_window("main").unwrap();
            let window_clone = window.clone();
            window.on_window_event(move |event| {
                if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                    api.prevent_close();
                    
                    let _ = window_clone.emit("check-unsaved-before-close", ());
                }
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            file_ops::select_directory,
            file_ops::list_excalidraw_files,
            file_ops::get_file_tree,
            file_ops::read_file,
            file_ops::save_file,
            file_ops::save_file_as,
            file_ops::create_new_file,
            file_ops::rename_file,
            file_ops::delete_file,
            file_ops::watch_directory,
            file_ops::force_close_app,
            preferences::get_preferences,
            preferences::save_preferences,
            ai_logs::save_ai_log,
            ai_logs::load_ai_logs,
            ai_logs::clear_ai_logs,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
