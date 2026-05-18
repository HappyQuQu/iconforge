import { useEffect, useState } from "react"
import { Eye } from "lucide-react"

const UMAMI_DASHBOARD = "https://cloud.umami.is"

type PublicStats = {
  pageviews?: number
  visits?: number
  visitors?: number
}

export function VisitCount() {
  const statsUrl = import.meta.env.VITE_STATS_URL?.trim()
  const [stats, setStats] = useState<PublicStats | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const url = statsUrl
    if (!url) return

    let cancelled = false
    async function load(endpoint: string) {
      try {
        const res = await fetch(endpoint, { credentials: "omit" })
        if (!res.ok) return
        const data = (await res.json()) as PublicStats
        if (!cancelled) {
          setStats({
            pageviews: data.pageviews ?? 0,
            visits: data.visits ?? 0,
            visitors: data.visitors ?? 0,
          })
        }
      } catch {
        /* 未配置代理或网络失败 */
      } finally {
        if (!cancelled) setReady(true)
      }
    }

    void load(url)
    return () => {
      cancelled = true
    }
  }, [statsUrl])

  if (!statsUrl || !ready || !stats) return null

  const { pageviews = 0, visits = 0, visitors = 0 } = stats

  return (
    <div className="mt-2 space-y-1 text-xs text-muted-foreground">
      <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="inline-flex items-center gap-1.5">
          <Eye className="h-3.5 w-3.5 shrink-0" aria-hidden />
          累计 {pageviews.toLocaleString("zh-CN")} 次浏览
        </span>
        <span>{visitors.toLocaleString("zh-CN")} 位访客</span>
        <span>{visits.toLocaleString("zh-CN")} 次访问</span>
      </p>
      <p>
        详细访问记录在{" "}
        <a
          href={UMAMI_DASHBOARD}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-slate-700 underline-offset-2 hover:text-slate-950 hover:underline"
        >
          Umami 控制台
        </a>
        {" "}查看（需登录你的账号）
      </p>
    </div>
  )
}
