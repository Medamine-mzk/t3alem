"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { CheckCircle, PlusCircle } from "lucide-react";

interface EnrollButtonProps {
  courseId: string;
  isEnrolled: boolean;
}

export function EnrollButton({ courseId, isEnrolled }: EnrollButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function handleEnroll() {
    setIsLoading(true);
    try {
      const res = await fetch("/api/enrollments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to enroll");
        return;
      }

      toast.success("Enrolled successfully!");
      router.refresh();
    } catch {
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  if (isEnrolled) {
    return (
      <Button variant="outline" disabled>
        <CheckCircle className="mr-2 h-4 w-4" />
        Enrolled
      </Button>
    );
  }

  return (
    <Button onClick={handleEnroll} disabled={isLoading}>
      {isLoading ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : (
        <PlusCircle className="mr-2 h-4 w-4" />
      )}
      Enroll
    </Button>
  );
}
