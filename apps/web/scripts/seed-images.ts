import { createWriteStream } from "node:fs"
import { mkdir, readFile, stat } from "node:fs/promises"
import { pipeline } from "node:stream/promises"
import { Readable } from "node:stream"
import { basename, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const scriptDir = fileURLToPath(new URL(".", import.meta.url))
const repoRoot = resolve(scriptDir, "../../..")

const DEFAULT_HTML_PATH = resolve(repoRoot, "reference/images/images_html.txt")
const DEFAULT_OUT_DIR = resolve(repoRoot, "reference/images/downloaded")

const CONCURRENCY = Number(process.env.SEED_IMAGES_CONCURRENCY ?? "8")

type ImageEntry = {
  filename: string
  url: string
}

function decodeHtmlEntities(value: string): string {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
}

function stripUrlQuery(url: string): string {
  try {
    const parsed = new URL(url)
    parsed.search = ""
    return parsed.toString()
  } catch {
    return url.split("?")[0] ?? url
  }
}

function sanitizeFilename(name: string): string {
  const base = basename(name.trim())
  if (!base || base === "." || base === "..") {
    throw new Error(`Invalid filename: ${name}`)
  }
  return base
}

function parseImagesFromHtml(html: string): ImageEntry[] {
  const imgTagRe = /<img\s[^>]*?>/gi
  const srcRe = /src=["']([^"']+)["']/i
  const altRe = /alt=["']([^"']*)["']/i
  const titleRe = /title=["']([^"']*)["']/i

  const entries: ImageEntry[] = []

  for (const imgTag of html.match(imgTagRe) ?? []) {
    const src = srcRe.exec(imgTag)?.[1]
    const alt = altRe.exec(imgTag)?.[1]
    const title = titleRe.exec(imgTag)?.[1]

    if (!src) continue

    const label = alt?.trim() || title?.trim()
    if (!label) {
      console.warn("Skipping img without alt/title:", imgTag.slice(0, 120))
      continue
    }

    entries.push({
      filename: sanitizeFilename(label),
      url: stripUrlQuery(decodeHtmlEntities(src)),
    })
  }

  return entries
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await stat(path)
    return true
  } catch {
    return false
  }
}

async function downloadToFile(url: string, destPath: string): Promise<void> {
  const response = await fetch(url, {
    headers: { Accept: "image/*" },
  })

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${url}`)
  }

  if (!response.body) {
    throw new Error(`Empty response body for ${url}`)
  }

  await pipeline(Readable.fromWeb(response.body), createWriteStream(destPath))
}

async function runPool<T>(
  items: T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<void>,
): Promise<void> {
  let nextIndex = 0

  async function runWorker(): Promise<void> {
    while (true) {
      const index = nextIndex++
      if (index >= items.length) return
      await worker(items[index]!, index)
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, () => runWorker()),
  )
}

async function main() {
  const htmlPath = process.env.SEED_IMAGES_HTML_PATH ?? DEFAULT_HTML_PATH
  const outDir = process.env.SEED_IMAGES_OUT_DIR ?? DEFAULT_OUT_DIR

  const htmlContent = await readFile(htmlPath, "utf8")
  const images = parseImagesFromHtml(htmlContent)

  if (images.length === 0) {
    throw new Error(`No images found in ${htmlPath}`)
  }

  await mkdir(outDir, { recursive: true })

  let downloaded = 0
  let skipped = 0
  let failed = 0

  console.log(`Found ${images.length} images`)
  console.log(`Output: ${outDir}`)
  console.log(`Concurrency: ${CONCURRENCY}`)

  await runPool(images, CONCURRENCY, async (entry, index) => {
    const destPath = resolve(outDir, entry.filename)

    if (await fileExists(destPath)) {
      skipped++
      return
    }

    try {
      await downloadToFile(entry.url, destPath)
      downloaded++
      if ((index + 1) % 50 === 0 || index + 1 === images.length) {
        console.log(`Progress: ${index + 1}/${images.length}`)
      }
    } catch (error) {
      failed++
      console.error(`Failed ${entry.filename}:`, error)
    }
  })

  console.log(`Done. downloaded=${downloaded} skipped=${skipped} failed=${failed}`)
  if (failed > 0) process.exit(1)
}

main().catch((error) => {
  console.error("Seed images failed:", error)
  process.exit(1)
})
