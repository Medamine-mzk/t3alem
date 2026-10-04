"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { KeyRound, Trash2, Shield, ShieldOff, UserCheck, UserX } from "lucide-react";

interface UserActionsProps {
  userId: string;
  userName: string;
  userRole: string;
  isAdmin: boolean;
  currentUserId: string;
  isActive: boolean;
}

export function UserActions({ userId, userName, userRole, isAdmin, currentUserId, isActive }: UserActionsProps) {
  const router = useRouter();
  const [showDelete, setShowDelete] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [showRoleChange, setShowRoleChange] = useState(false);
  const [showDeactivate, setShowDeactivate] = useState(false);
  const [tempPassword, setTempPassword] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isChangingRole, setIsChangingRole] = useState(false);
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [newRole, setNewRole] = useState(userRole);

  async function handleDelete() {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/users/${userId}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("User deleted successfully");
        router.refresh();
      } else {
        toast.error("Failed to delete user");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setIsDeleting(false);
      setShowDelete(false);
    }
  }

  async function handleResetPassword() {
    setIsResetting(true);
    try {
      const res = await fetch(`/api/users/${userId}/reset-password`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setTempPassword(data.tempPassword);
        setShowReset(true);
        toast.success("Password reset successfully");
      } else {
        toast.error("Failed to reset password");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setIsResetting(false);
    }
  }

  async function handleChangeRole() {
    setIsChangingRole(true);
    try {
      const res = await fetch(`/api/users/${userId}/role`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) {
        toast.success(`Role changed to ${newRole}`);
        router.refresh();
      } else {
        toast.error("Failed to change role");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setIsChangingRole(false);
      setShowRoleChange(false);
    }
  }

  async function handleDeactivate() {
    setIsDeactivating(true);
    try {
      const res = await fetch(`/api/users/${userId}/deactivate`, { method: "POST" });
      if (res.ok) {
        toast.success(isActive ? "User deactivated" : "User activated");
        router.refresh();
      } else {
        toast.error("Failed to update user status");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setIsDeactivating(false);
      setShowDeactivate(false);
    }
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleResetPassword}
          disabled={isResetting}
        >
          <KeyRound className="h-4 w-4" />
          <span className="ml-2 hidden sm:inline">Reset Password</span>
        </Button>

        {!isAdmin && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setNewRole(userRole === "TEACHER" ? "STUDENT" : "TEACHER");
              setShowRoleChange(true);
            }}
          >
            {userRole === "TEACHER" ? (
              <ShieldOff className="h-4 w-4" />
            ) : (
              <Shield className="h-4 w-4" />
            )}
            <span className="ml-2 hidden sm:inline">
              {userRole === "TEACHER" ? "Demote" : "Promote"}
            </span>
          </Button>
        )}

        {!isAdmin && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDeactivate(true)}
          >
            {isActive ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
            <span className="ml-2 hidden sm:inline">
              {isActive ? "Deactivate" : "Activate"}
            </span>
          </Button>
        )}

        {!isAdmin && userId !== currentUserId && (
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowDelete(true)}
            disabled={isDeleting}
          >
            <Trash2 className="h-4 w-4" />
            <span className="ml-2 hidden sm:inline">Delete</span>
          </Button>
        )}
      </div>

      <Dialog open={showDelete} onOpenChange={setShowDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {userName}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDelete(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting && <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showReset} onOpenChange={setShowReset}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Password Reset</DialogTitle>
            <DialogDescription>
              Share this temporary password with {userName}. They will be asked to change it on next login.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg bg-muted p-4">
            <code className="text-lg font-mono font-bold">{tempPassword}</code>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReset(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showRoleChange} onOpenChange={setShowRoleChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Role</DialogTitle>
            <DialogDescription>
              Change the role for {userName}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="STUDENT">Student</option>
              <option value="TEACHER">Teacher</option>
            </select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRoleChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleChangeRole} disabled={isChangingRole}>
              {isChangingRole && <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />}
              Change Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeactivate} onOpenChange={setShowDeactivate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isActive ? "Deactivate User" : "Activate User"}</DialogTitle>
            <DialogDescription>
              {isActive
                ? `Are you sure you want to deactivate ${userName}? They will not be able to log in.`
                : `Are you sure you want to activate ${userName}? They will be able to log in again.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeactivate(false)}>
              Cancel
            </Button>
            <Button
              variant={isActive ? "destructive" : "default"}
              onClick={handleDeactivate}
              disabled={isDeactivating}
            >
              {isDeactivating && <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />}
              {isActive ? "Deactivate" : "Activate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
