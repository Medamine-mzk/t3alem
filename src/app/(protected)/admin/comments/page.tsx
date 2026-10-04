import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDate } from "@/lib/utils";
import { MessageSquare, Trash2 } from "lucide-react";
import { Pagination } from "@/components/shared/pagination";

export const dynamic = "force-dynamic";

interface AdminCommentsPageProps {
  searchParams: Promise<{ page?: string; search?: string }>;
}

export default async function AdminCommentsPage({ searchParams }: AdminCommentsPageProps) {
  const session = await getServerSession(authOptions);

  if (session?.user.role !== "ADMIN") {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold">Access Denied</h1>
        <p className="text-muted-foreground">You do not have permission to access this page.</p>
      </div>
    );
  }

  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page || "1"));
  const limit = 20;
  const search = params.search || "";

  const where = search
    ? {
        OR: [
          { content: { contains: search, mode: "insensitive" as const } },
          { user: { firstName: { contains: search, mode: "insensitive" as const } } },
          { user: { lastName: { contains: search, mode: "insensitive" as const } } },
        ],
      }
    : {};

  const [comments, total] = await Promise.all([
    prisma.comment.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: { firstName: true, lastName: true },
        },
        session: {
          select: { title: true },
        },
      },
    }),
    prisma.comment.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Comment Moderation</h1>
        <p className="text-muted-foreground">View and moderate all comments</p>
      </div>

      <form action="/admin/comments" method="get" className="mb-6 flex gap-4">
        <Input
          placeholder="Search comments..."
          defaultValue={search}
          className="max-w-sm"
          name="search"
        />
        <Button type="submit">Search</Button>
        {search && (
          <Button variant="outline" asChild>
            <a href="/admin/comments">Clear</a>
          </Button>
        )}
      </form>

      <Card>
        <CardHeader>
          <CardTitle>Comments ({total})</CardTitle>
        </CardHeader>
        <CardContent>
          {comments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <MessageSquare className="h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">No comments found</h3>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {comments.map((comment: any) => (
                  <div
                    key={comment.id}
                    className="flex items-start justify-between rounded-lg border p-4"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {comment.user.firstName} {comment.user.lastName}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          on
                        </span>
                        <span className="font-medium">
                          {comment.session.title}
                        </span>
                      </div>
                      <p className="mt-2 text-sm">{comment.content}</p>
                      <div className="mt-2 text-xs text-muted-foreground">
                        {formatDate(comment.createdAt)}
                      </div>
                    </div>
                    <DeleteCommentButton commentId={comment.id} />
                  </div>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="mt-6">
                  <Pagination currentPage={page} totalPages={totalPages} />
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function DeleteCommentButton({ commentId }: { commentId: string }) {
  return (
    <form action={`/api/comments/${commentId}`} method="delete">
      <Button variant="ghost" size="icon" type="submit">
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>
    </form>
  );
}
