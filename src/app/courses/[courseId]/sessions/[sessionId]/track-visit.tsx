"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";

interface TrackVisitProps {
  sessionId: string;
}

export function TrackVisit({ sessionId }: TrackVisitProps) {
  const { data: session } = useSession();

  useEffect(() => {
    if (!session) return;

    fetch("/api/visits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
    }).catch(() => {});
  }, [session, sessionId]);

  return null;
}
