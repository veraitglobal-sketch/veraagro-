"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";

/** Legacy URL: canonical content lives under `/technical-proposal`; grant anchors start at #eic-why-exists */
export default function EicPartBRedirectPage() {
  const params = useParams<{ locale: string }>();

  useEffect(() => {
    const locale = typeof params.locale === "string" ? params.locale : "en";
    if (typeof window === "undefined") return;
    window.location.replace(`/${locale}/technical-proposal#eic-why-exists`);
  }, [params.locale]);

  return (
    <main className="flex min-h-[50vh] items-center justify-center bg-[#f4f7f4] px-4 text-center text-sm text-gray-600">
      <p>Redirecting to the technical proposal…</p>
    </main>
  );
}
