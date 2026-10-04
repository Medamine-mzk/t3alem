import Link from "next/link";
import { BookOpen } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t bg-muted/50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            <span className="text-sm font-medium">T3alem</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Course sharing platform for students and teachers.
          </p>
          <div className="flex gap-4">
            <Link href="/courses" className="text-sm text-muted-foreground hover:text-foreground">
              Courses
            </Link>
            <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">
              Dashboard
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
