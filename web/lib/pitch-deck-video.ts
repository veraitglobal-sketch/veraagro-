/**
 * Public env for pitch deck embed. Supports common YouTube / Vimeo share URLs.
 * Set `NEXT_PUBLIC_PITCH_DECK_VIDEO_URL` in Vercel / `.env.local`.
 */
export type PitchDeckVideoEmbed = {
  embedUrl: string;
  provider: "youtube" | "vimeo";
};

export function parsePitchDeckVideoUrl(raw: string | undefined): PitchDeckVideoEmbed | null {
  const u = raw?.trim();
  if (!u) return null;

  const yt =
    u.match(/(?:youtube\.com\/watch\?v=|youtube\.com\/embed\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/) ??
    u.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/);
  if (yt?.[1]) {
    return {
      embedUrl: `https://www.youtube-nocookie.com/embed/${yt[1]}?rel=0`,
      provider: "youtube",
    };
  }

  const vm = u.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vm?.[1]) {
    return { embedUrl: `https://player.vimeo.com/video/${vm[1]}`, provider: "vimeo" };
  }

  return null;
}

export function getPitchDeckVideoUrlFromEnv(): string | undefined {
  return process.env.NEXT_PUBLIC_PITCH_DECK_VIDEO_URL?.trim() || undefined;
}
