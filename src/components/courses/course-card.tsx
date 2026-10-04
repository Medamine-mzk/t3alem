import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { BookOpen, Calendar, User } from "lucide-react";

interface CourseCardProps {
  course: {
    id: string;
    title: string;
    description: string;
    className: string;
    createdAt: Date;
    teacher: {
      firstName: string;
      lastName: string;
    };
    _count?: {
      sessions: number;
    };
  };
}

export function CourseCard({ course }: CourseCardProps) {
  return (
    <Link href={`/courses/${course.id}`}>
      <Card className="h-full transition-colors hover:bg-accent/50">
        <CardHeader>
          <CardTitle className="line-clamp-2">{course.title}</CardTitle>
          <CardDescription>{course.className}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="line-clamp-2 text-sm text-muted-foreground">{course.description}</p>
          <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" />
              {course.teacher.firstName} {course.teacher.lastName}
            </span>
            <span className="flex items-center gap-1">
              <BookOpen className="h-3 w-3" />
              {course._count?.sessions || 0} sessions
            </span>
          </div>
          <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            {formatDate(course.createdAt)}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
