import { useEffect, useMemo, useRef, useState } from "react"
import type { ChangeEvent, PointerEvent as ReactPointerEvent, ReactNode } from "react"
import {
  ChevronDown,
  Download,
  ImagePlus,
  Layers,
  Link as LinkIcon,
  Move,
  RotateCcw,
  Search,
  Sparkles,
  Star,
  Trash2,
  Upload,
  X,
} from "lucide-react"

import { Button } from "./components/ui/button"
import { cn } from "./lib/utils"

type IconKind = "upload" | "url" | "dashboard" | "lobe"
type LibraryImage = {
  id: string
  name: string
  src: string
  srcFallback?: string
  kind: IconKind
  aliases?: string[]
}
type SourceFilter = "all" | "recent" | "favorite" | "user" | "dashboard" | "lobe"
type CornerKey = "top-left" | "top-right" | "bottom-left" | "bottom-right"
type SlotKey = "base" | "badge"
type DashboardIconMeta = {
  base?: "svg" | "png" | "webp"
  aliases?: string[]
}
type DashboardMetadata = Record<string, DashboardIconMeta>

const dashboardIconsMetadataUrl = "https://raw.githubusercontent.com/homarr-labs/dashboard-icons/main/metadata.json"
const dashboardIconsCdnBase = "https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons"
const lobeIconsCdnBase = "https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/icons"
const lobeIconSlugs = [
  "ace","adobe","adobefirefly","agentvoice","agui","ai2","ai21","ai302","ai360","aihubmix","aimass","aionlabs","aistudio","akashchat","alephalpha","alibaba","alibabacloud","amp","antgroup","anthropic","antigravity","anyscale","apertis","apple","arcee","askverdict","assemblyai","atlascloud","automatic","aws","aya","azure","azureai","baai","baichuan","baidu","baiducloud","bailian","baseten","bedrock","bfl","bilibili","bilibiliindex","bing","briaai","burncloud","bytedance","capcut","centml","cerebras","chatglm","cherrystudio","civitai","claude","claudecode","cline","clipdrop","cloudflare","codeflicker","codegeex","codex","cogvideo","cogview","cohere","colab","cometapi","comfyui","commanda","copilot","copilotkit","coqui","coze","crewai","crusoe","cursor","cybercut","dalle","dbrx","deepai","deepcogito","deepinfra","deepl","deepmind","deepseek","dify","doc2x","docsearch","dolphin","doubao","dreammachine","elevenlabs","elevenx","essentialai","exa","fal","fastgpt","featherless","figma","fireworks","fishaudio","flora","flowith","flux","friendli","gemini","geminicli","gemma","giteeai","github","githubcopilot","glama","glif","glmv","google","googlecloud","goose","gradio","greptile","grok","groq","hailuo","haiper","hedra","hermesagent","higress","huawei","huaweicloud","huggingface","hunyuan","hyperbolic","ibm","ideogram","iflytekcloud","inception","inference","infermatic","infinigence","inflection","internlm","jimeng","jina","junie","kilocode","kimi","kling","kluster","kolors","krea","kwaikat","kwaipilot","lambda","langchain","langfuse","langgraph","langsmith","leptonai","lg","lightricks","liquid","livekit","llamaindex","llava","llmapi","lmstudio","lobehub","longcat","lovable","lovart","luma","magic","make","manus","mastra","mcp","mcpso","menlo","meshy","meta","metaai","metagpt","microsoft","midjourney","minimax","mistral","modelscope","monica","moonshot","morph","myshell","n8n","nanobanana","nebius","newapi","notebooklm","notion","nousresearch","nova","novelai","novita","nplcloud","nvidia","obsidian","ollama","openai","openchat","openclaw","opencode","openhands","openrouter","openwebui","palm","parasail","perplexity","phidata","phind","pika","pixverse","player2","poe","pollinations","ppio","prunaai","pydanticai","qingyan","qiniu","qoder","qwen","railway","recraft","relace","replicate","replit","reve","roocode","rsshub","runway","rwkv","sambanova","search1api","searchapi","sensenova","siliconcloud","skywork","smithery","snowflake","sophnet","sora","spark","speedai","stability","statecloud","stepfun","straico","streamlake","submodel","suno","sync","targon","tavily","tencent","tencentcloud","tiangong","tii","together","topazlabs","trae","tripo","turix","udio","unstructured","upstage","v0","vectorizerai","venice","vercel","vertexai","vidu","viggle","vllm","volcengine","voyage","wenxin","windsurf","workersai","xai","xiaomimimo","xinference","xpay","xuanyuan","yandex","yi","youmind","yuanbao","zai","zapier","zeabur","zencoder","zenmux","zeroone","zhipu",
]

const lobeNameOverrides: Record<string, string> = {
  "ai21": "AI21 Labs", "ai302": "302.AI", "ai360": "360 智脑", "aistudio": "AI Studio",
  "alibabacloud": "阿里云", "azureai": "Azure AI", "baai": "智源研究院", "baichuan": "百川",
  "baiducloud": "百度智能云", "bailian": "百炼", "chatglm": "智谱 ChatGLM", "claudecode": "Claude Code",
  "codex": "OpenAI Codex", "dalle": "DALL·E", "deepcogito": "Deep Cogito", "deepseek": "DeepSeek",
  "elevenlabs": "ElevenLabs", "elevenx": "11x", "githubcopilot": "GitHub Copilot",
  "googlecloud": "Google Cloud", "hunyuan": "腾讯混元", "iflytekcloud": "讯飞云",
  "internlm": "书生·浦语", "jimeng": "即梦", "kimi": "Kimi", "kling": "可灵",
  "llamaindex": "LlamaIndex", "lmstudio": "LM Studio", "midjourney": "Midjourney",
  "minimax": "MiniMax", "modelscope": "魔搭", "moonshot": "月之暗面", "notebooklm": "NotebookLM",
  "ollama": "Ollama", "openai": "OpenAI", "openrouter": "OpenRouter", "openwebui": "Open WebUI",
  "qwen": "通义千问", "siliconcloud": "硅基流动", "spark": "讯飞星火", "stability": "Stability AI",
  "stepfun": "阶跃星辰", "tencentcloud": "腾讯云", "tiangong": "天工", "volcengine": "火山引擎",
  "wenxin": "文心一言", "xai": "xAI", "xiaomimimo": "小米 MiMo", "xuanyuan": "轩辕",
  "yuanbao": "元宝", "zhipu": "智谱",
}

const cornerPresets: Record<CornerKey, { x: number; y: number }> = {
  "top-left": { x: 0, y: 0 },
  "top-right": { x: 100, y: 0 },
  "bottom-left": { x: 0, y: 100 },
  "bottom-right": { x: 100, y: 100 },
}
const cornerLabels: Record<CornerKey, string> = {
  "top-left": "左上", "top-right": "右上", "bottom-left": "左下", "bottom-right": "右下",
}

const sourceLabels: Record<SourceFilter, string> = {
  all: "全部", recent: "最近", favorite: "收藏", user: "我的", dashboard: "Dashboard", lobe: "Lobe",
}

const RECENTS_LIMIT = 24
const DRAG_MIME = "application/x-iconforge-id"

type Scene = {
  id: string
  label: string
  desc: string
  outputSize: number
  roundedBase: boolean
  badgeRing: boolean
  badgeScale: number
}

const scenes: Scene[] = [
  { id: "app",     label: "应用图标",     desc: "1024 圆角",  outputSize: 1024, roundedBase: true,  badgeRing: true,  badgeScale: 30 },
  { id: "favicon", label: "网站 Favicon", desc: "512 方形",   outputSize: 512,  roundedBase: false, badgeRing: false, badgeScale: 38 },
  { id: "dock",    label: "Dock 图标",    desc: "1024 方形",  outputSize: 1024, roundedBase: false, badgeRing: true,  badgeScale: 26 },
]

const STORAGE_KEY = "iconforge.v1"
const DEFAULT_BADGE_POS = { x: 100, y: 100 }
const DEFAULT_BADGE_SCALE = 30

type Persisted = {
  baseId?: string
  badgeId?: string
  badgeScale?: number
  badgePos?: { x: number; y: number }
  outputSize?: number
  roundedBase?: boolean
  badgeRing?: boolean
  favorites?: string[]
  recentIds?: string[]
  urlLibrary?: LibraryImage[]
}

function loadPersisted(): Persisted {
  if (typeof localStorage === "undefined") return {}
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Persisted) : {}
  } catch {
    return {}
  }
}

function App() {
  const persistedRef = useRef<Persisted>(loadPersisted())
  const persisted = persistedRef.current

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [library, setLibrary] = useState<LibraryImage[]>(persisted.urlLibrary ?? [])
  const [dashboardIcons, setDashboardIcons] = useState<LibraryImage[]>([])
  const [lobeIcons, setLobeIcons] = useState<LibraryImage[]>([])
  const [favorites, setFavorites] = useState<string[]>(persisted.favorites ?? [])
  const [recentIds, setRecentIds] = useState<string[]>(persisted.recentIds ?? [])

  const [activeSlot, setActiveSlot] = useState<SlotKey>(persisted.baseId ? "badge" : "base")
  const [searches, setSearches] = useState<Record<SlotKey, string>>({ base: "", badge: "" })
  const iconSearch = searches[activeSlot]
  const setIconSearch = (v: string) => setSearches((prev) => ({ ...prev, [activeSlot]: v }))
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("all")
  const [urlValue, setUrlValue] = useState("")
  const [dragOverSlot, setDragOverSlot] = useState<SlotKey | null>(null)

  const [baseId, setBaseId] = useState(persisted.baseId ?? "")
  const [badgeId, setBadgeId] = useState(persisted.badgeId ?? "")
  const [outputSize, setOutputSize] = useState(persisted.outputSize ?? 1024)
  const [badgeScale, setBadgeScale] = useState(persisted.badgeScale ?? DEFAULT_BADGE_SCALE)
  const [badgePos, setBadgePos] = useState<{ x: number; y: number }>(persisted.badgePos ?? DEFAULT_BADGE_POS)
  const [roundedBase, setRoundedBase] = useState(persisted.roundedBase ?? true)
  const [badgeRing, setBadgeRing] = useState(persisted.badgeRing ?? true)

  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [downloadUrl, setDownloadUrl] = useState("")
  const [renderError, setRenderError] = useState("")
  const [isDragging, setIsDragging] = useState(false)
  const [hoverCanvas, setHoverCanvas] = useState(false)

  const allImages = useMemo(() => [...library, ...dashboardIcons, ...lobeIcons], [dashboardIcons, library, lobeIcons])
  const baseImage = useMemo(() => allImages.find((i) => i.id === baseId), [allImages, baseId])
  const badgeImage = useMemo(() => allImages.find((i) => i.id === badgeId), [allImages, badgeId])

  // Dashboard fetch
  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await fetch(dashboardIconsMetadataUrl)
        if (!res.ok) throw new Error("metadata")
        const meta = (await res.json()) as DashboardMetadata
        if (cancelled) return
        const icons = Object.entries(meta)
          .map(([slug, m]) => {
            const fmt = m.base ?? "svg"
            return {
              id: `dashboard-${slug}`,
              name: titleFromSlug(slug),
              src: `${dashboardIconsCdnBase}/${fmt}/${slug}.${fmt}`,
              kind: "dashboard" as const,
              aliases: m.aliases ?? [],
            }
          })
          .sort((a, b) => a.name.localeCompare(b.name))
        setDashboardIcons(icons)
      } catch {
        /* ignore */
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  // Lobe load
  useEffect(() => {
    const icons = lobeIconSlugs.map((slug) => ({
      id: `lobe-${slug}`,
      name: lobeNameOverrides[slug] ?? titleFromSlug(slug),
      src: `${lobeIconsCdnBase}/${slug}-color.svg`,
      srcFallback: `${lobeIconsCdnBase}/${slug}.svg`,
      kind: "lobe" as const,
    }))
    setLobeIcons(icons)
  }, [])

  // Defaults: only if no persisted base/badge
  useEffect(() => {
    if (baseId || badgeId) return
    if (dashboardIcons.length === 0) return
    const pick = (name: string) => dashboardIcons.find((i) => i.id === `dashboard-${name}`)
    const fb = pick("docker") ?? pick("github") ?? dashboardIcons[0]
    const fd = pick("claude") ?? pick("openai") ?? dashboardIcons.find((i) => i.id !== fb?.id) ?? dashboardIcons[1]
    if (!baseId && fb) setBaseId(fb.id)
    if (!badgeId && fd) setBadgeId(fd.id)
  }, [baseId, badgeId, dashboardIcons])

  // Persist
  useEffect(() => {
    if (typeof localStorage === "undefined") return
    const data: Persisted = {
      baseId, badgeId, badgeScale, badgePos, outputSize, roundedBase, badgeRing, favorites, recentIds,
      urlLibrary: library.filter((i) => i.kind === "url"),
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch {
      /* quota etc. */
    }
  }, [baseId, badgeId, badgeScale, badgePos, outputSize, roundedBase, badgeRing, favorites, recentIds, library])

  // Render
  useEffect(() => {
    let cancelled = false
    async function render() {
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext("2d")
      if (!ctx) return
      canvas.width = outputSize
      canvas.height = outputSize
      ctx.clearRect(0, 0, outputSize, outputSize)
      setRenderError("")

      if (!baseImage) {
        setDownloadUrl("")
        return
      }
      try {
        const base = await loadImage(baseImage.src, baseImage.srcFallback)
        if (cancelled) return
        ctx.save()
        if (roundedBase) {
          roundedRect(ctx, 0, 0, outputSize, outputSize, Math.round(outputSize * 0.2))
          ctx.clip()
        }
        drawContain(ctx, base, 0, 0, outputSize, outputSize)
        ctx.restore()

        if (badgeImage) {
          const badge = await loadImage(badgeImage.src, badgeImage.srcFallback)
          if (cancelled) return
          const bSize = Math.round(outputSize * (badgeScale / 100))
          const range = outputSize - bSize
          const x = Math.round(range * (badgePos.x / 100))
          const y = Math.round(range * (badgePos.y / 100))
          const radius = Math.round(bSize * 0.22)

          if (badgeRing) {
            ctx.save()
            ctx.fillStyle = "#ffffff"
            roundedRect(ctx, x - 8, y - 8, bSize + 16, bSize + 16, radius + 8)
            ctx.shadowColor = "rgba(15, 23, 42, 0.25)"
            ctx.shadowBlur = 18
            ctx.shadowOffsetY = 7
            ctx.fill()
            ctx.restore()
          }
          ctx.save()
          roundedRect(ctx, x, y, bSize, bSize, radius)
          ctx.clip()
          drawContain(ctx, badge, x, y, bSize, bSize)
          ctx.restore()
        }

        setDownloadUrl(canvas.toDataURL("image/png"))
      } catch {
        setRenderError("图片可能禁止跨域读取，请换一个支持跨域的图片地址，或先下载后上传。")
        setDownloadUrl("")
      }
    }
    render()
    return () => {
      cancelled = true
    }
  }, [baseImage, badgeImage, badgePos, badgeRing, badgeScale, outputSize, roundedBase])

  function pushRecent(id: string) {
    setRecentIds((prev) => [id, ...prev.filter((x) => x !== id)].slice(0, RECENTS_LIMIT))
  }

  function selectImage(id: string) {
    if (activeSlot === "base") {
      setBaseId(id)
      if (!badgeId) setActiveSlot("badge")
    } else {
      setBadgeId(id)
      if (!baseId) setActiveSlot("base")
    }
    pushRecent(id)
  }

  function dropToSlot(slot: SlotKey, id: string) {
    if (slot === "base") setBaseId(id)
    else setBadgeId(id)
    setActiveSlot(slot)
    pushRecent(id)
  }

  function toggleFavorite(id: string) {
    setFavorites((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  function applyScene(s: Scene) {
    setOutputSize(s.outputSize)
    setRoundedBase(s.roundedBase)
    setBadgeRing(s.badgeRing)
    setBadgeScale(s.badgeScale)
  }

  function reset() {
    setBadgeScale(DEFAULT_BADGE_SCALE)
    setBadgePos(DEFAULT_BADGE_POS)
    setOutputSize(1024)
    setRoundedBase(true)
    setBadgeRing(true)
  }

  function addUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    const src = URL.createObjectURL(file)
    const item: LibraryImage = {
      id: `upload-${crypto.randomUUID()}`,
      name: file.name.replace(/\.[^.]+$/, ""),
      src,
      kind: "upload",
    }
    setLibrary((items) => [item, ...items])
    setSourceFilter("user")
    selectImage(item.id)
    event.target.value = ""
  }

  function addUrl() {
    const trimmed = urlValue.trim()
    if (!trimmed) return
    let parsed: URL
    try {
      parsed = new URL(trimmed)
    } catch {
      setRenderError("请输入完整图片 URL。")
      return
    }
    const item: LibraryImage = {
      id: `url-${crypto.randomUUID()}`,
      name: parsed.hostname.replace(/^www\./, ""),
      src: trimmed,
      kind: "url",
    }
    setLibrary((items) => [item, ...items])
    setSourceFilter("user")
    selectImage(item.id)
    setUrlValue("")
  }

  function removeImage(id: string) {
    const item = library.find((entry) => entry.id === id)
    if (!item) return
    if (item.kind === "upload") URL.revokeObjectURL(item.src)
    setLibrary((items) => items.filter((entry) => entry.id !== id))
    if (baseId === id) setBaseId("")
    if (badgeId === id) setBadgeId("")
    setFavorites((prev) => prev.filter((x) => x !== id))
  }

  function download() {
    if (!downloadUrl) return
    const a = document.createElement("a")
    a.download = `${baseImage?.name ?? "icon"}${badgeImage ? `-${badgeImage.name}` : ""}-${outputSize}.png`
    a.href = downloadUrl
    a.click()
  }

  // Canvas drag
  function applyCanvasPointer(event: ReactPointerEvent<HTMLCanvasElement>) {
    if (!canvasRef.current) return
    const rect = canvasRef.current.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) return
    const px = ((event.clientX - rect.left) / rect.width) * 100
    const py = ((event.clientY - rect.top) / rect.height) * 100
    const sizePct = badgeScale
    const range = 100 - sizePct
    if (range <= 0) return
    const tlx = px - sizePct / 2
    const tly = py - sizePct / 2
    const nx = Math.max(0, Math.min(100, (tlx / range) * 100))
    const ny = Math.max(0, Math.min(100, (tly / range) * 100))
    setBadgePos({ x: nx, y: ny })
  }
  function onCanvasPointerDown(e: ReactPointerEvent<HTMLCanvasElement>) {
    if (!baseImage || !badgeImage) return
    setIsDragging(true)
    canvasRef.current?.setPointerCapture(e.pointerId)
    applyCanvasPointer(e)
  }
  function onCanvasPointerMove(e: ReactPointerEvent<HTMLCanvasElement>) {
    if (!isDragging) return
    applyCanvasPointer(e)
  }
  function onCanvasPointerUp(e: ReactPointerEvent<HTMLCanvasElement>) {
    if (!isDragging) return
    setIsDragging(false)
    canvasRef.current?.releasePointerCapture(e.pointerId)
  }

  const showBadgeBox = !!(baseImage && badgeImage) && (hoverCanvas || isDragging)
  const badgeBoxLeft = (badgePos.x / 100) * (100 - badgeScale)
  const badgeBoxTop = (badgePos.y / 100) * (100 - badgeScale)

  // Library data
  const recentImages = useMemo(() => {
    const map = new Map(allImages.map((i) => [i.id, i]))
    return recentIds.map((id) => map.get(id)).filter(Boolean) as LibraryImage[]
  }, [allImages, recentIds])

  const counts = useMemo(
    () => ({
      all: allImages.length,
      recent: recentImages.length,
      favorite: favorites.length,
      user: library.length,
      dashboard: dashboardIcons.length,
      lobe: lobeIcons.length,
    }),
    [allImages.length, dashboardIcons.length, favorites.length, library.length, lobeIcons.length, recentImages.length],
  )

  const visibleLibrary = useMemo(() => {
    let pool: LibraryImage[]
    if (sourceFilter === "recent") pool = recentImages
    else if (sourceFilter === "favorite") pool = allImages.filter((i) => favorites.includes(i.id))
    else if (sourceFilter === "user") pool = library
    else if (sourceFilter === "dashboard") pool = dashboardIcons
    else if (sourceFilter === "lobe") pool = lobeIcons
    else pool = allImages

    const q = iconSearch.trim().toLowerCase()

    if (sourceFilter === "all" && !q) {
      // Default view: pin recents + favorites at top
      const pinnedIds = new Set<string>()
      const pinned: LibraryImage[] = []
      for (const id of recentIds) {
        const found = allImages.find((i) => i.id === id)
        if (found && !pinnedIds.has(id)) {
          pinned.push(found)
          pinnedIds.add(id)
        }
      }
      for (const id of favorites) {
        if (pinnedIds.has(id)) continue
        const found = allImages.find((i) => i.id === id)
        if (found) {
          pinned.push(found)
          pinnedIds.add(id)
        }
      }
      const rest = allImages.filter((i) => !pinnedIds.has(i.id))
      pool = [...pinned, ...rest]
    }

    const filtered = !q
      ? pool
      : pool.filter(
          (i) =>
            i.name.toLowerCase().includes(q) ||
            i.id.toLowerCase().includes(q) ||
            i.aliases?.some((a) => a.toLowerCase().includes(q)),
        )
    return q ? filtered.slice(0, 240) : filtered.slice(0, 120)
  }, [allImages, dashboardIcons, favorites, iconSearch, library, lobeIcons, recentIds, recentImages, sourceFilter])

  const activeSceneId = useMemo(() => {
    return scenes.find((s) =>
      s.outputSize === outputSize && s.roundedBase === roundedBase && s.badgeRing === badgeRing,
    )?.id
  }, [outputSize, roundedBase, badgeRing])

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#eef2f7_54%,#f8fafc_100%)] text-foreground">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-5 pb-24 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-1.5 inline-flex w-fit items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-800">
              <Sparkles className="h-3 w-3" />
              本地合成 · 数据不出浏览器
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
              IconForge
              <span className="ml-2 align-middle text-base font-normal text-muted-foreground">合成你的图标</span>
            </h1>
            <p className="text-sm text-muted-foreground">先点右边任一卡槽 → 再点左边图标即可填入（也可拖拽 / Enter / ⌘1–9）</p>
          </div>
        </header>

        <div className="grid gap-5 lg:grid-cols-[minmax(420px,1fr)_minmax(440px,520px)]">
          {/* LEFT: Library */}
          <div className="flex flex-col gap-3 rounded-xl border border-border bg-white p-4 shadow-soft">
            <div className="flex flex-wrap items-center gap-2">
              {(Object.keys(sourceLabels) as SourceFilter[]).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setSourceFilter(k)}
                  className={cn(
                    "rounded-md border px-2.5 py-1 text-xs font-medium transition",
                    sourceFilter === k
                      ? "border-slate-950 bg-slate-950 text-white"
                      : "border-input bg-white text-slate-600 hover:border-slate-400",
                  )}
                >
                  {sourceLabels[k]}
                  <span className="ml-1 text-[11px] opacity-70">{counts[k]}</span>
                </button>
              ))}
              <div className="ml-auto">
                <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="h-4 w-4" />
                  上传
                </Button>
                <input ref={fileInputRef} className="hidden" type="file" accept="image/*" onChange={addUpload} />
              </div>
            </div>

            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={iconSearch}
                onChange={(e) => setIconSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const first = visibleLibrary[0]
                    if (first) {
                      e.preventDefault()
                      selectImage(first.id)
                    }
                    return
                  }
                  if ((e.metaKey || e.ctrlKey) && /^[1-9]$/.test(e.key)) {
                    const idx = Number(e.key) - 1
                    const target = visibleLibrary[idx]
                    if (target) {
                      e.preventDefault()
                      selectImage(target.id)
                    }
                  }
                }}
                placeholder="搜索 · Enter 选第一个 · ⌘1–9 选第 N 个"
                className="h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <LinkIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={urlValue}
                  onChange={(e) => setUrlValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") addUrl()
                  }}
                  placeholder="或贴一个图片 URL"
                  className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <Button variant="secondary" size="sm" onClick={addUrl}>
                加入
              </Button>
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>正在填入 → <b className="text-slate-950">{activeSlot === "base" ? "底图" : "Logo"}</b></span>
              <span>显示 {visibleLibrary.length}</span>
            </div>

            {visibleLibrary.length === 0 ? (
              <div className="grid place-items-center rounded-md border border-dashed border-slate-300 px-4 py-12 text-sm text-muted-foreground">
                {sourceFilter === "favorite" ? "还没有收藏图标。点星标添加。" : "没找到匹配图标。"}
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5">
                {visibleLibrary.map((item, index) => {
                  const fav = favorites.includes(item.id)
                  const isBase = item.id === baseId
                  const isBadge = item.id === badgeId
                  const isUserItem = item.kind === "upload" || item.kind === "url"
                  const shortcutIdx = index < 9 && iconSearch.trim().length > 0 ? index + 1 : null
                  return (
                    <div
                      key={item.id}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData(DRAG_MIME, item.id)
                        e.dataTransfer.setData("text/plain", item.name)
                        e.dataTransfer.effectAllowed = "copy"
                      }}
                      className={cn(
                        "group relative flex cursor-pointer flex-col overflow-hidden rounded-lg border bg-white transition hover:border-slate-400",
                        (isBase || isBadge) && "border-slate-950 ring-2 ring-slate-950/10",
                      )}
                      onClick={() => selectImage(item.id)}
                    >
                      <div className="relative aspect-square w-full p-3">
                        <img
                          className="h-full w-full object-contain"
                          src={item.src}
                          alt={item.name}
                          loading="lazy"
                          onError={(e) => {
                            const img = e.currentTarget
                            if (item.srcFallback && img.src !== item.srcFallback) img.src = item.srcFallback
                          }}
                        />
                        <div className="absolute left-1.5 top-1.5 flex gap-1">
                          {isBase && <Pill>底</Pill>}
                          {isBadge && <Pill>Logo</Pill>}
                        </div>
                        {shortcutIdx !== null && (
                          <span className="absolute bottom-1 left-1 rounded bg-slate-900/80 px-1 py-0.5 text-[10px] font-mono font-semibold text-white">
                            ⌘{shortcutIdx}
                          </span>
                        )}
                        <div className="absolute right-1.5 top-1.5 flex gap-1 opacity-0 transition group-hover:opacity-100">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleFavorite(item.id)
                            }}
                            className={cn(
                              "rounded-md p-1 shadow-sm transition",
                              fav ? "bg-amber-400 text-white opacity-100" : "bg-white text-slate-400 hover:text-amber-500",
                            )}
                            title={fav ? "取消收藏" : "收藏"}
                          >
                            <Star className={cn("h-3.5 w-3.5", fav && "fill-current")} />
                          </button>
                          {isUserItem && (
                            <button
                              type="button"
                              className="rounded-md bg-white p-1 text-slate-400 shadow-sm transition hover:text-red-600"
                              onClick={(e) => {
                                e.stopPropagation()
                                removeImage(item.id)
                              }}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                        {fav && (
                          <div className="absolute right-1.5 top-1.5 group-hover:opacity-0">
                            <div className="rounded-md bg-amber-400 p-1 text-white shadow-sm">
                              <Star className="h-3.5 w-3.5 fill-current" />
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="truncate border-t border-slate-100 px-2 py-1 text-center text-[11px] font-medium text-slate-700">
                        {item.name}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* RIGHT: Composer */}
          <aside className="flex flex-col gap-4">
            <div className="grid gap-2">
              <span className="text-xs font-medium text-slate-500">用途预设</span>
              <div className="flex flex-wrap gap-2">
                {scenes.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => applyScene(s)}
                    className={cn(
                      "flex flex-1 min-w-[100px] flex-col items-start gap-0.5 rounded-lg border px-3 py-2 text-left transition",
                      activeSceneId === s.id
                        ? "border-slate-950 bg-slate-950 text-white"
                        : "border-input bg-white hover:border-slate-400",
                    )}
                  >
                    <span className="text-sm font-semibold">{s.label}</span>
                    <span className={cn("text-xs", activeSceneId === s.id ? "text-slate-300" : "text-muted-foreground")}>
                      {s.desc}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Slot
                slotKey="base"
                label="底图"
                hint="点这里再去左边选 / 拖图标到此"
                image={baseImage}
                active={activeSlot === "base"}
                dragOver={dragOverSlot === "base"}
                onActivate={() => setActiveSlot("base")}
                onClear={baseImage ? () => setBaseId("") : undefined}
                onDragEnter={() => setDragOverSlot("base")}
                onDragLeave={() => setDragOverSlot(null)}
                onDrop={(id) => {
                  dropToSlot("base", id)
                  setDragOverSlot(null)
                }}
              />
              <Slot
                slotKey="badge"
                label="叠加 Logo"
                hint="点这里再去左边选 / 拖图标到此"
                image={badgeImage}
                active={activeSlot === "badge"}
                dragOver={dragOverSlot === "badge"}
                onActivate={() => setActiveSlot("badge")}
                onClear={badgeImage ? () => setBadgeId("") : undefined}
                onDragEnter={() => setDragOverSlot("badge")}
                onDragLeave={() => setDragOverSlot(null)}
                onDrop={(id) => {
                  dropToSlot("badge", id)
                  setDragOverSlot(null)
                }}
              />
            </div>

            <div className="rounded-2xl border border-border bg-white p-4 shadow-soft">
              <div
                className="relative mx-auto aspect-square w-full max-w-[420px]"
                onMouseEnter={() => setHoverCanvas(true)}
                onMouseLeave={() => setHoverCanvas(false)}
              >
                <div className="absolute inset-0 rounded-xl border border-dashed border-slate-300 bg-[conic-gradient(from_90deg_at_1px_1px,#e2e8f0_90deg,transparent_0)_0_0/22px_22px]" />
                <canvas
                  ref={canvasRef}
                  className={cn(
                    "relative h-full w-full touch-none rounded-xl object-contain shadow-lg",
                    baseImage && badgeImage ? (isDragging ? "cursor-grabbing" : "cursor-grab") : "cursor-default",
                  )}
                  onPointerDown={onCanvasPointerDown}
                  onPointerMove={onCanvasPointerMove}
                  onPointerUp={onCanvasPointerUp}
                  onPointerCancel={onCanvasPointerUp}
                />
                {showBadgeBox && (
                  <div
                    className="pointer-events-none absolute rounded-md border-2 border-dashed border-blue-500/70"
                    style={{
                      left: `${badgeBoxLeft}%`,
                      top: `${badgeBoxTop}%`,
                      width: `${badgeScale}%`,
                      height: `${badgeScale}%`,
                    }}
                  />
                )}
                {!baseImage && (
                  <div className="pointer-events-none absolute inset-0 grid place-items-center text-sm text-muted-foreground">
                    👈 选一张底图开始
                  </div>
                )}
              </div>
              {baseImage && badgeImage && (
                <div className="mt-2 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                  <Move className="h-3.5 w-3.5" />
                  在画布上拖拽调整 Logo 位置
                </div>
              )}
              {renderError && (
                <div className="mt-3 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                  {renderError}
                </div>
              )}
            </div>

            <details
              className="rounded-xl border border-border bg-white shadow-soft"
              open={advancedOpen}
              onToggle={(event) => setAdvancedOpen((event.target as HTMLDetailsElement).open)}
            >
              <summary className="flex cursor-pointer items-center justify-between px-4 py-3 text-sm font-medium text-slate-700">
                <span className="flex items-center gap-2">
                  <Layers className="h-4 w-4" />
                  高级设置
                </span>
                <ChevronDown className={cn("h-4 w-4 transition", advancedOpen && "rotate-180")} />
              </summary>
              <div className="grid gap-5 border-t border-border px-4 py-4">
                <NumberControl label="画布大小" value={outputSize} min={128} max={2048} step={32} unit="px" onChange={setOutputSize} />
                <NumberControl label="Logo 大小" value={badgeScale} min={12} max={60} step={1} unit="%" onChange={setBadgeScale} />
                <div className="grid gap-2">
                  <span className="text-sm font-medium text-slate-700">Logo 位置 · 一键吸附</span>
                  <div className="grid grid-cols-4 gap-2">
                    {(Object.keys(cornerPresets) as CornerKey[]).map((c) => {
                      const p = cornerPresets[c]
                      const active = Math.round(badgePos.x) === p.x && Math.round(badgePos.y) === p.y
                      return (
                        <Button key={c} variant={active ? "default" : "outline"} size="sm" onClick={() => setBadgePos(p)}>
                          {cornerLabels[c]}
                        </Button>
                      )
                    })}
                  </div>
                </div>
                <ToggleRow label="底图圆角（iOS 风）" value={roundedBase} onChange={setRoundedBase} />
                <ToggleRow label="Logo 白底托盘" value={badgeRing} onChange={setBadgeRing} />
                <Button variant="outline" size="sm" onClick={reset}>
                  <RotateCcw className="h-4 w-4" />
                  恢复默认设置
                </Button>
              </div>
            </details>
          </aside>
        </div>

        <footer className="mt-4 border-t border-border pt-5 text-sm text-muted-foreground">
          <div className="mb-1 text-slate-700">图标致谢</div>
          <p className="leading-relaxed">
            感谢{" "}
            <a
              href="https://github.com/homarr-labs/dashboard-icons"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-slate-900 underline-offset-2 hover:underline"
            >
              homarr-labs/dashboard-icons
            </a>
            {" "}与{" "}
            <a
              href="https://github.com/lobehub/lobe-icons"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-slate-900 underline-offset-2 hover:underline"
            >
              lobehub/lobe-icons
            </a>
            {" "}两个开源项目提供海量高质量图标，本工具仅在浏览器内合成，不会向后端上传任何图片。
          </p>
        </footer>
      </div>

      {/* Sticky download bar */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-white/90 px-4 py-3 backdrop-blur sm:px-6">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3">
          <div className="min-w-0 text-sm text-slate-600">
            {baseImage && badgeImage ? (
              <span className="truncate">
                <span className="font-medium text-slate-950">{baseImage.name}</span>
                <span className="mx-1 text-slate-400">+</span>
                <span className="font-medium text-slate-950">{badgeImage.name}</span>
                <span className="ml-2 text-xs text-muted-foreground">{outputSize}px</span>
              </span>
            ) : baseImage ? (
              <span>选一个 Logo 叠加，或直接下载</span>
            ) : (
              <span>先选一张底图</span>
            )}
          </div>
          <Button disabled={!downloadUrl} onClick={download} className="shrink-0">
            <Download className="h-4 w-4" />
            下载 PNG
          </Button>
        </div>
      </div>
    </main>
  )
}

function Slot({
  slotKey, label, hint, image, active, dragOver, onActivate, onClear, onDragEnter, onDragLeave, onDrop,
}: {
  slotKey: SlotKey
  label: string
  hint: string
  image: LibraryImage | undefined
  active: boolean
  dragOver?: boolean
  onActivate: () => void
  onClear?: () => void
  onDragEnter?: () => void
  onDragLeave?: () => void
  onDrop?: (id: string) => void
}) {
  return (
    <div
      onDragOver={(e) => {
        if (Array.from(e.dataTransfer.types).includes(DRAG_MIME)) {
          e.preventDefault()
          e.dataTransfer.dropEffect = "copy"
        }
      }}
      onDragEnter={(e) => {
        if (Array.from(e.dataTransfer.types).includes(DRAG_MIME)) {
          e.preventDefault()
          onDragEnter?.()
        }
      }}
      onDragLeave={(e) => {
        if (e.currentTarget.contains(e.relatedTarget as Node | null)) return
        onDragLeave?.()
      }}
      onDrop={(e) => {
        const id = e.dataTransfer.getData(DRAG_MIME)
        if (id && onDrop) {
          e.preventDefault()
          onDrop(id)
        }
      }}
      className={cn(
        "relative flex flex-col rounded-xl border bg-white p-3 text-center shadow-soft transition",
        dragOver
          ? "border-blue-500 bg-blue-50 ring-4 ring-blue-500/20"
          : active
            ? "border-slate-950 ring-2 ring-slate-950/15"
            : image ? "border-border hover:border-slate-400" : "border-dashed border-slate-300 hover:border-slate-500",
      )}
    >
      <div className="absolute left-2 top-2 flex items-center gap-1.5">
        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">{label}</span>
        {active && <span className="rounded bg-slate-950 px-1.5 py-0.5 text-[10px] font-semibold text-white">填入中</span>}
      </div>
      {onClear && (
        <button
          type="button"
          onClick={onClear}
          className="absolute right-2 top-2 rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          title="清除"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
      <button
        onClick={onActivate}
        className="flex flex-1 flex-col items-center gap-2 pt-7"
        data-slot={slotKey}
      >
        <div className={cn(
          "grid h-16 w-16 shrink-0 place-items-center rounded-lg",
          image ? "bg-slate-50" : "bg-slate-100",
        )}>
          {image ? (
            <img src={image.src} alt={image.name} className="h-14 w-14 object-contain" />
          ) : (
            <ImagePlus className="h-6 w-6 text-slate-400" />
          )}
        </div>
        {image ? (
          <div className="w-full truncate text-sm font-semibold text-slate-950">{image.name}</div>
        ) : (
          <div className="text-xs text-slate-500">{hint}</div>
        )}
      </button>
    </div>
  )
}

function Pill({ children }: { children: ReactNode }) {
  return <span className="rounded bg-slate-950 px-1.5 py-0.5 text-[10px] font-semibold text-white">{children}</span>
}

function ToggleRow({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between rounded-md border border-input px-3 py-2 text-sm font-medium text-slate-700">
      {label}
      <input className="h-4 w-4 accent-slate-950" type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} />
    </label>
  )
}

function NumberControl({
  label, value, min, max, step, unit, onChange,
}: {
  label: string; value: number; min: number; max: number; step: number; unit: string; onChange: (v: number) => void
}) {
  function clamp(next: number) {
    if (Number.isNaN(next)) return value
    return Math.max(min, Math.min(max, Math.round(next / step) * step))
  }
  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between text-sm font-medium text-slate-700">
        <span>{label}</span>
        <div className="flex items-center gap-1">
          <input
            type="number"
            value={value}
            min={min}
            max={max}
            step={step}
            onChange={(e) => onChange(clamp(Number(e.target.value)))}
            className="w-16 rounded border border-input bg-background px-2 py-0.5 text-right text-sm tabular-nums outline-none focus:ring-2 focus:ring-ring"
          />
          <span className="text-xs text-muted-foreground">{unit}</span>
        </div>
      </div>
      <input
        className="w-full accent-slate-950"
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  )
}

function loadImage(src: string, fallback?: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.crossOrigin = "anonymous"
    let triedFallback = false
    image.onload = () => resolve(image)
    image.onerror = () => {
      if (fallback && !triedFallback) {
        triedFallback = true
        image.src = fallback
      } else {
        reject(new Error("image load failed"))
      }
    }
    image.src = src
  })
}

function drawContain(ctx: CanvasRenderingContext2D, image: HTMLImageElement, x: number, y: number, width: number, height: number) {
  const scale = Math.min(width / image.naturalWidth, height / image.naturalHeight)
  const drawWidth = image.naturalWidth * scale
  const drawHeight = image.naturalHeight * scale
  ctx.drawImage(image, x + (width - drawWidth) / 2, y + (height - drawHeight) / 2, drawWidth, drawHeight)
}

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  const r = Math.min(radius, width / 2, height / 2)
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + width, y, x + width, y + height, r)
  ctx.arcTo(x + width, y + height, x, y + height, r)
  ctx.arcTo(x, y + height, x, y, r)
  ctx.arcTo(x, y, x + width, y, r)
  ctx.closePath()
}

function titleFromSlug(slug: string) {
  return slug
    .split("-")
    .map((part) => (part.length <= 3 ? part.toUpperCase() : part.charAt(0).toUpperCase() + part.slice(1)))
    .join(" ")
}

export default App
