import { LiveRoom } from "@/components/webcast/live-room"

// The live webcast, rendered inside the dashboard shell (sidebar + hamburger stay available).
// Negative margins cancel the dashboard <main> padding so the room fills the content area.
// The dashboard support chat bubble is hidden on this route (the room has its own live chat).
export default function DashboardLiveWebcastPage() {
  return (
    <div className="-m-4 lg:-m-6">
      <LiveRoom />
    </div>
  )
}
