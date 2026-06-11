import { GroomInvitePage } from "@/components/site/invite/groom-invite-page"
import { getPublicEventsList } from "@/lib/gallery/public-event"
import { getDaysUntilCountdown } from "@/lib/site/countdown"
import { buildGroomInviteMetadata } from "@/lib/site/share-metadata"

export const metadata = buildGroomInviteMetadata()

export default async function GroomInvitePageRoute() {
  const events = await getPublicEventsList()
  const days = getDaysUntilCountdown()

  return (
    <GroomInvitePage
      days={days}
      events={events.map((e) => ({
        id: e.id,
        title: e.title,
        eventSlug: e.eventSlug,
        subtitle: e.subtitle,
        coverPicHorizontal: e.coverPicHorizontal,
        coverPicVertical: e.coverPicVertical,
      }))}
    />
  )
}
