import { redirect } from 'next/navigation';

export default async function VerifySeedRedirect({ params }: { params: Promise<{ serial: string }> }) {
  const { serial } = await params;
  redirect(`/s/${encodeURIComponent(serial)}`);
}
