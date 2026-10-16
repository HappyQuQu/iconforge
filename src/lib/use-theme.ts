import { useEffect, useState } from "react"

type Theme = "light" | "dark" | "system"
const STORAGE_KEY = "iconforge.theme"

function readTheme(): Theme {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === "light" || saved === "dark") return saved
  } catch {
    // Keep theme switching available when browser storage is disabled.
  }
  return "system"
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(readTheme)

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)")
    function apply() {
      const dark = theme === "dark" || (theme === "system" && media.matches)
      document.documentElement.classList.toggle("dark", dark)
      document.documentElement.style.colorScheme = dark ? "dark" : "light"
    }
    apply()
    media.addEventListener("change", apply)
    return () => media.removeEventListener("change", apply)
  }, [theme])

  useEffect(() => {
    function sync(event: StorageEvent) {
      if (event.storageArea === localStorage && (event.key === STORAGE_KEY || event.key === null)) {
        setTheme(readTheme())
      }
    }
    window.addEventListener("storage", sync)
    return () => window.removeEventListener("storage", sync)
  }, [])

  function changeTheme(next: Theme) {
    setTheme(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // The selected theme still applies for this session.
    }
  }

  return { theme, setTheme: changeTheme }
}
