import fs from "node:fs"
import path from "node:path"
import { defineConfig, type Plugin } from "vite"
import react from "@vitejs/plugin-react"

const DEFAULT_WEBSITE_ID = "d7aa1126-1498-4b64-83f1-15019f7de9c1"

function loadDevVars(): Record<string, string> {
  const file = path.resolve(process.cwd(), ".dev.vars")
  if (!fs.existsSync(file)) return {}
  const vars: Record<string, string> = {}
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue
    const eq = trimmed.indexOf("=")
    if (eq === -1) continue
    vars[trimmed.slice(0, eq)] = trimmed.slice(eq + 1)
  }
  return vars
}

/** 开发时模拟 Cloudflare Pages 的 /api/stats（读取 .dev.vars 中的 UMAMI_API_KEY） */
function umamiStatsDevPlugin(): Plugin {
  return {
    name: "umami-stats-dev",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url?.split("?")[0]
        if (url !== "/api/stats") return next()

        const vars = loadDevVars()
        const apiKey = vars.UMAMI_API_KEY ?? process.env.UMAMI_API_KEY
        const websiteId = vars.UMAMI_WEBSITE_ID ?? DEFAULT_WEBSITE_ID
        if (!apiKey) {
          res.statusCode = 503
          res.setHeader("Content-Type", "application/json")
          res.end(JSON.stringify({ error: "UMAMI_API_KEY not configured in .dev.vars" }))
          return
        }

        const endAt = Date.now()
        const startAt = Date.parse("2020-01-01T00:00:00.000Z")
        try {
          const upstream = await fetch(
            `https://api.umami.is/v1/websites/${websiteId}/stats?startAt=${startAt}&endAt=${endAt}`,
            {
              headers: {
                Accept: "application/json",
                "x-umami-api-key": apiKey,
              },
            },
          )
          const data = (await upstream.json()) as {
            pageviews?: number
            visits?: number
            visitors?: number
          }
          res.statusCode = upstream.ok ? 200 : 502
          res.setHeader("Content-Type", "application/json")
          res.end(
            JSON.stringify({
              pageviews: data.pageviews ?? 0,
              visits: data.visits ?? 0,
              visitors: data.visitors ?? 0,
            }),
          )
        } catch {
          res.statusCode = 502
          res.setHeader("Content-Type", "application/json")
          res.end(JSON.stringify({ error: "fetch failed" }))
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), umamiStatsDevPlugin()],
})
