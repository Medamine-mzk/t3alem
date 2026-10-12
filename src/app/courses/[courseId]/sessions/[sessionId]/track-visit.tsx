"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { v4 as uuidv4 } from "uuid";

interface TrackVisitProps {
  sessionId: string;
}

export function TrackVisit({ sessionId }: TrackVisitProps) {
  const { data: session } = useSession();

  useEffect(() => {
    let userId = session?.user?.id;

    if (!userId) {
      let anonymousId = localStorage.getItem("t3alem_anonymous_id");
      if (!anonymousId) {
        anonymousId = uuidv4();
        localStorage.setItem("t3alem_anonymous_id", anonymousId);
      }
      userId = anonymousId;
    }

    fetch("/api/visits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, userId }),
    }).catch(() => {});
  }, [session, sessionId]);

  return null;
}
