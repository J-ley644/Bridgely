
import { useTheme } from "../context/ThemeContext";

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      className={`theme-toggle ${isDark ? "dark" : "light"}`}
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      title={`Switch to ${isDark ? "light" : "dark"} mode`}
    >
      <span className="theme-toggle-icon">
        {isDark ? "☀️" : "🌙"}
      </span>

      <span className="theme-toggle-text">
        {isDark ? "Light" : "Dark"}
      </span>
    </button>
  );
}

export default ThemeToggle;

