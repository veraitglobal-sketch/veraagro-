import { redirect } from 'next/navigation';

type PageProps = {
  params: Promise<{ threadId: string }>;
};

export default async function GrowerPartnerThreadLegacyRedirect({ params }: PageProps) {
  const { threadId } = await params;
  redirect(`/grower/where-to-buy/thread/${encodeURIComponent(threadId)}`);
}
