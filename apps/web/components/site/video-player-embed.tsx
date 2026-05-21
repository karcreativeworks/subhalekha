import { getVideoEmbedUrl } from "@/lib/media/video-url"
import { cn } from "@workspace/ui/lib/utils"

interface VideoPlayerEmbedProps {
  videoUrl: string
  title: string
  className?: string
}

export function VideoPlayerEmbed({
  videoUrl,
  title,
  className,
}: VideoPlayerEmbedProps) {
  const embedUrl = getVideoEmbedUrl(videoUrl)

  if (!embedUrl) {
    return (
      <div
        className={cn(
          "mx-auto flex max-w-4xl flex-col items-center justify-center gap-4 rounded-2xl border border-dashed p-12 text-center",
          className,
        )}
      >
        <p className="text-muted-foreground text-sm">
          This video link cannot be embedded here yet.
        </p>
        <a
          href={videoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium underline underline-offset-4"
        >
          Open video in a new tab
        </a>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "relative mx-auto aspect-video w-full max-w-4xl overflow-hidden rounded-2xl bg-black shadow-2xl ring-1 ring-white/10",
        className,
      )}
    >
      <iframe
        src={embedUrl}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        className="absolute inset-0 h-full w-full border-0"
      />
    </div>
  )
}
