import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { Users, Search, UserPlus, KeyRound, Trash2, Shield, ShieldOff, Eye } from "lucide-react";
import { UserActions } from "./user-actions";
import { Pagination } from "@/components/shared/pagination";

export const dynamic = "force-dynamic";

interface AdminUsersPageProps {
  searchParams: Promise<{ page?: string; search?: string; role?: string }>;
}

export default async function AdminUsersPage({ searchParams }: AdminUsersPageProps) {
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
  const role = params.role || "";

  const where = {
    AND: [
      search
        ? {
            OR: [
              { firstName: { contains: search, mode: "insensitive" as const } },
              { lastName: { contains: search, mode: "insensitive" as const } },
              { email: { contains: search, mode: "insensitive" as const } },
              { username: { contains: search, mode: "insensitive" as const } },
            ],
          }
        : {},
      role ? { role } : {},
    ],
  };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        className: true,
        specialization: true,
        role: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: { courses: true, comments: true },
        },
      },
    }),
    prisma.user.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground">Manage all registered users</p>
        </div>
        <Button asChild>
          <a href="/admin/users/new">
            <UserPlus className="mr-2 h-4 w-4" />
            Create User
          </a>
        </Button>
      </div>

      <form action="/admin/users" method="get" className="mb-6 flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            defaultValue={search}
            className="pl-9"
            name="search"
          />
        </div>
        <select
          name="role"
          defaultValue={role}
          className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <option value="">All Roles</option>
          <option value="ADMIN">Admin</option>
          <option value="TEACHER">Teacher</option>
          <option value="STUDENT">Student</option>
        </select>
        <Button type="submit">Search</Button>
        {(search || role) && (
          <Button variant="outline" asChild>
            <a href="/admin/users">Clear</a>
          </Button>
        )}
      </form>

      <Card>
        <CardHeader>
          <CardTitle>Users ({total})</CardTitle>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">No users found</h3>
              <p className="text-sm text-muted-foreground">
                Try adjusting your search or filter
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {users.map((user: any) => (
                  <div
                    key={user.id}
                    className="flex flex-col gap-4 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">
                          {user.firstName} {user.lastName}
                        </span>
                        <Badge
                          variant={
                            user.role === "ADMIN"
                              ? "default"
                              : user.role === "TEACHER"
                                ? "secondary"
                                : "outline"
                          }
                        >
                          {user.role === "ADMIN" && <Shield className="mr-1 h-3 w-3" />}
                          {user.role}
                        </Badge>
                        {!user.isActive && (
                          <Badge variant="destructive">Inactive</Badge>
                        )}
                      </div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        {user.email} · {user.username}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        Joined {formatDate(user.createdAt)} · {user._count.courses} courses ·{" "}
                        {user._count.comments} comments
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <a href={`/admin/users/${user.id}`}>
                          <Eye className="mr-2 h-4 w-4" />
                          View
                        </a>
                      </Button>
                      <UserActions
                        userId={user.id}
                        userName={`${user.firstName} ${user.lastName}`}
                        userRole={user.role}
                        isAdmin={user.role === "ADMIN"}
                        currentUserId={session?.user.id || ""}
                        isActive={user.isActive}
                      />
                    </div>
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
