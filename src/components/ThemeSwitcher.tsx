import { Monitor, Moon, Sun } from "lucide-react"
import { useTheme } from "../lib/use-theme"
import { cn } from "../lib/utils"

const options = [
  { value: "light", label: "浅色", icon: Sun },
  { value: "dark", label: "深色", icon: Moon },
  { value: "system", label: "跟随系统", icon: Monitor },
] as const

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme()

  return (
    <div role="group" aria-label="外观主题" className="flex w-fit shrink-0 items-center gap-1 rounded-lg border border-border bg-surface p-1 shadow-sm">
      {options.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          type="button"
          aria-pressed={theme === value}
          onClick={() => setTheme(value)}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            theme === value
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
        >
          <Icon className="h-3.5 w-3.5" aria-hidden="true" />
          {label}
        </button>
      ))}
    </div>
  )
}
