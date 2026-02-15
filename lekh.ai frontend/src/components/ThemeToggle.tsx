import React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "./ThemeProvider";

const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg border border-border bg-card hover:bg-accent transition-all duration-200 hover:scale-105 group"
      aria-label="Toggle theme"
    >
      {theme === "light" ? (
        <Moon className="w-4 h-4 text-foreground group-hover:text-primary transition-colors" strokeWidth={1.5} />
      ) : (
        <Sun className="w-4 h-4 text-foreground group-hover:text-primary transition-colors" strokeWidth={1.5} />
      )}
    </button>
  );
};

export default ThemeToggle;
