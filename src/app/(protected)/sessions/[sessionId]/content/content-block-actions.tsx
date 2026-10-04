"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { MoreHorizontal, Trash2, ArrowUp, ArrowDown, Edit } from "lucide-react";

interface ContentBlockActionsProps {
  sessionId: string;
  blockId: string;
  blockType: string;
  isFirst: boolean;
  isLast: boolean;
}

export function ContentBlockActions({
  sessionId,
  blockId,
  blockType,
  isFirst,
  isLast,
}: ContentBlockActionsProps) {
  const router = useRouter();
  const [showDelete, setShowDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/sessions/${sessionId}/content/${blockId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        router.refresh();
      }
    } catch {
      console.error("Failed to delete content block");
    } finally {
      setIsDeleting(false);
      setShowDelete(false);
    }
  }

  async function handleMove(direction: "up" | "down") {
    try {
      const res = await fetch(`/api/sessions/${sessionId}/content/${blockId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ position: direction }),
      });
      if (res.ok) {
        router.refresh();
      }
    } catch {
      console.error("Failed to move content block");
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {!isFirst && (
            <DropdownMenuItem onClick={() => handleMove("up")}>
              <ArrowUp className="h-4 w-4" />
              Move up
            </DropdownMenuItem>
          )}
          {!isLast && (
            <DropdownMenuItem onClick={() => handleMove("down")}>
              <ArrowDown className="h-4 w-4" />
              Move down
            </DropdownMenuItem>
          )}
          <DropdownMenuItem asChild>
            <a href={`/api/sessions/${sessionId}/content/${blockId}/edit`}>
              <Edit className="h-4 w-4" />
              Edit
            </a>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-red-600 focus:text-red-600"
            onClick={() => setShowDelete(true)}
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDialog
        open={showDelete}
        onOpenChange={setShowDelete}
        title="Delete Content Block"
        description="Are you sure you want to delete this content block? This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        isLoading={isDeleting}
        variant="destructive"
      />
    </>
  );
}
