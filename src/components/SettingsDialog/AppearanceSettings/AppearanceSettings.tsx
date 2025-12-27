import { Radio } from "antd";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/store/uiStore";
import { useTheme } from "@/hooks/useTheme";

const themeOptions: {
  value: "light" | "dark" | "system";
  label: string;
  description: string;
}[] = [
  { value: "light", label: "浅色", description: "使用浅色主题" },
  { value: "dark", label: "深色", description: "使用深色主题" },
  { value: "system", label: "跟随系统", description: "自动跟随系统主题设置" },
];

export function AppearanceSettings() {
  const { preferences, setPreferences, savePreferences } = useUIStore();
  const { applyTheme } = useTheme();

  const onThemeChange = async (themeValue: "light" | "dark" | "system") => {
    setPreferences({ ...preferences, theme: themeValue });
    await savePreferences();
    applyTheme(themeValue);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">外观设置</h3>

        <div className="space-y-4">
          <div>
            <p className="font-medium text-sm mb-3">主题</p>
            <div className="space-y-2">
              {themeOptions.map((option) => (
                <label
                  key={option.value}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg border cursor-pointer transition-colors",
                    preferences.theme === option.value
                      ? "border-(--colorPrimary) bg-(--colorPrimaryBg) dark:bg-(--colorPrimaryBg5)"
                      : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600",
                  )}
                >
                  <Radio
                    checked={preferences.theme === option.value}
                    onChange={() => onThemeChange(option.value)}
                  />
                  <div>
                    <p className="font-medium text-sm">{option.label}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {option.description}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
