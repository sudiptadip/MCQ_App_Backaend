import { Sun, Moon } from "lucide-react";
import { useTheme } from "./ThemeProvider";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="relative flex items-center h-10 w-[4.5rem] rounded-full p-1 bg-slate-100 dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 shadow-[inset_0_2px_4px_rgba(0,0,0,0.06)] transition-all duration-300 cursor-pointer focus:outline-none hover:border-slate-300 dark:hover:border-zinc-700 group"
      title={`Switch to ${isDark ? "Light" : "Dark"} Mode`}
    >
      {/* Sliding indicator */}
      <div 
        className={`absolute top-[3px] bottom-[3px] left-[3px] w-8 rounded-full shadow-md transition-all duration-300 ease-out ${
          isDark 
            ? "translate-x-9 bg-zinc-800 border border-zinc-700 shadow-[0_0_12px_rgba(99,102,241,0.25)]" 
            : "translate-x-0 bg-white border border-slate-200/50"
        }`} 
      />

      {/* Sun and Moon Icons */}
      <div className="relative w-full flex items-center justify-between px-1.5 z-10 pointer-events-none">
        <Sun 
          className={`h-4 w-4 transition-all duration-300 ${
            isDark 
              ? "text-zinc-500 scale-90" 
              : "text-amber-500 scale-105 drop-shadow-[0_0_3px_rgba(245,158,11,0.5)] rotate-0 group-hover:rotate-12"
          }`} 
        />
        <Moon 
          className={`h-4 w-4 transition-all duration-300 ${
            isDark 
              ? "text-indigo-400 scale-105 dark:drop-shadow-[0_0_6px_rgba(129,140,248,0.5)] rotate-0 group-hover:rotate-12" 
              : "text-zinc-400 scale-90"
          }`} 
        />
      </div>
    </button>
  );
}
