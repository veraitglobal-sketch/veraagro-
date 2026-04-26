import { redirect } from 'next/navigation';

/**
 * DB notifications (and older links) use `/missions/:id` from the API, but the web app
 * lists grower transport under `/grower/portal`. This route keeps those links from 404ing.
 */
type Props = { params: Promise<{ id: string }> };

export default async function MissionNotificationRedirectPage({ params }: Props) {
  const { id } = await params;
  redirect(`/grower/portal?missionId=${encodeURIComponent(id)}`);
}
