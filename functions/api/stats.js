/**
 * Cloudflare Pages Function：代理 Umami Cloud 统计，避免在前端暴露 API Key。
 *
 * Pages 环境变量（Settings → Environment variables）：
 *   UMAMI_API_KEY          — Umami Cloud → Settings → API keys
 *   UMAMI_WEBSITE_ID       — 可选，默认与 index.html 中 data-website-id 一致
 *   UMAMI_API_REGION       — 可选：us | eu，留空则用默认区域
 *
 * 构建时设置：VITE_STATS_URL=/api/stats
 */
const DEFAULT_WEBSITE_ID = "d7aa1126-1498-4b64-83f1-15019f7de9c1"

export async function onRequestGet(context) {
  const { env } = context
  const apiKey = env.UMAMI_API_KEY
  if (!apiKey) {
    return json({ error: "UMAMI_API_KEY not configured" }, 503)
  }

  const websiteId = env.UMAMI_WEBSITE_ID || DEFAULT_WEBSITE_ID
  const region = env.UMAMI_API_REGION?.trim()
  const base = region
    ? `https://api.umami.is/v1/${region}`
    : "https://api.umami.is/v1"

  const endAt = Date.now()
  const startAt = Date.parse("2020-01-01T00:00:00.000Z")
  const url = `${base}/websites/${websiteId}/stats?startAt=${startAt}&endAt=${endAt}`

  try {
    const res = await fetch(url, {
      headers: {
        Accept: "application/json",
        "x-umami-api-key": apiKey,
      },
    })
    if (!res.ok) {
      return json({ error: "umami upstream error" }, 502)
    }
    const data = await res.json()
    return json(
      {
        pageviews: data.pageviews ?? 0,
        visits: data.visits ?? 0,
        visitors: data.visitors ?? 0,
      },
      200,
      { "Cache-Control": "public, max-age=300" },
    )
  } catch {
    return json({ error: "fetch failed" }, 502)
  }
}

function json(body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      ...extraHeaders,
    },
  })
}
