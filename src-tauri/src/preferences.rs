use super::*;
use tauri::{AppHandle};

#[tauri::command]
pub async fn get_preferences(app: AppHandle) -> Result<models::Preferences, String> {
    use tauri_plugin_store::StoreExt;

    let store = app.store("preferences.json").map_err(|e| e.to_string())?;

    let prefs = if let Some(value) = store.get("preferences") {
        match serde_json::from_value::<models::Preferences>(value.clone()) {
            Ok(mut p) => {
                if p.recent_directories.is_empty() {
                    p.recent_directories = Vec::new();
                }
                p
            }
            Err(_) => models::Preferences::default(),
        }
    } else {
        models::Preferences::default()
    };

    Ok(prefs)
}

#[tauri::command]
pub async fn save_preferences(app: AppHandle, preferences: models::Preferences) -> Result<(), String> {
    use tauri_plugin_store::StoreExt;

    let store = app.store("preferences.json").map_err(|e| e.to_string())?;

    store.set("preferences", serde_json::to_value(&preferences).unwrap());
    store.save().map_err(|e| e.to_string())?;

    Ok(())
}
