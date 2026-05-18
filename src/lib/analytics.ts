type AnalyticsProvider = "umami" | "plausible"

declare global {
  interface Window {
    umami?: { track: (event: string, data?: Record<string, string | number>) => void }
    plausible?: (event: string, options?: { props?: Record<string, string | number> }) => void
  }
}

function respectsDnt(): boolean {
  const dnt = navigator.doNotTrack
  return dnt === "1" || dnt === "yes"
}

function embeddedUmamiScript(): HTMLScriptElement | null {
  return document.querySelector('script[src*="umami"][data-website-id]')
}

function provider(): AnalyticsProvider | null {
  const value = import.meta.env.VITE_ANALYTICS_PROVIDER?.trim().toLowerCase()
  if (value === "umami" || value === "plausible") return value
  if (embeddedUmamiScript()) return "umami"
  return null
}

let scriptReady: Promise<void> | null = null

function loadAnalyticsScript(): Promise<void> {
  if (scriptReady) return scriptReady

  const kind = provider()
  if (!kind) {
    scriptReady = Promise.resolve()
    return scriptReady
  }

  if (kind === "umami") {
    const embedded = embeddedUmamiScript()
    if (embedded) {
      scriptReady = waitForScript(embedded)
      return scriptReady
    }
    const src = import.meta.env.VITE_UMAMI_SCRIPT_URL?.trim()
    const websiteId = import.meta.env.VITE_UMAMI_WEBSITE_ID?.trim()
    if (!src || !websiteId) {
      scriptReady = Promise.resolve()
      return scriptReady
    }
    scriptReady = injectScript(src, { "data-website-id": websiteId })
    return scriptReady
  }

  const domain = import.meta.env.VITE_PLAUSIBLE_DOMAIN?.trim()
  if (!domain) {
    scriptReady = Promise.resolve()
    return scriptReady
  }
  const src =
    import.meta.env.VITE_PLAUSIBLE_SCRIPT_URL?.trim() || "https://plausible.io/js/script.js"
  scriptReady = injectScript(src, { "data-domain": domain })
  return scriptReady
}

function waitForScript(script: HTMLScriptElement): Promise<void> {
  return new Promise((resolve) => {
    if (window.umami) {
      resolve()
      return
    }
    if (script.dataset.loaded === "true") {
      resolve()
      return
    }
    script.addEventListener(
      "load",
      () => {
        script.dataset.loaded = "true"
        resolve()
      },
      { once: true },
    )
    script.addEventListener("error", () => resolve(), { once: true })
  })
}

function injectScript(src: string, attrs: Record<string, string>): Promise<void> {
  return new Promise((resolve) => {
    const marker = `analytics:${src}`
    const existing = document.querySelector<HTMLScriptElement>(`script[data-analytics="${marker}"]`)
    if (existing) {
      if (existing.dataset.loaded === "true") resolve()
      else existing.addEventListener("load", () => resolve(), { once: true })
      return
    }

    const script = document.createElement("script")
    script.defer = true
    script.src = src
    script.dataset.analytics = marker
    for (const [key, value] of Object.entries(attrs)) {
      script.setAttribute(key, value)
    }
    script.onload = () => {
      script.dataset.loaded = "true"
      resolve()
    }
    script.onerror = () => resolve()
    document.head.appendChild(script)
  })
}

/** 加载统计脚本；Umami / Plausible 会在首屏自动记录一次页面访问。 */
export function initAnalytics(): void {
  if (typeof window === "undefined" || respectsDnt()) return
  void loadAnalyticsScript()
}

/** 记录自定义事件（如导出 PNG）。未配置统计时为空操作。 */
export function trackEvent(name: string, props?: Record<string, string | number>): void {
  if (typeof window === "undefined" || respectsDnt() || !provider()) return

  void loadAnalyticsScript().then(() => {
    const kind = provider()
    if (kind === "umami" && window.umami) {
      window.umami.track(name, props)
      return
    }
    if (kind === "plausible" && window.plausible) {
      window.plausible(name, props ? { props } : undefined)
    }
  })
}
