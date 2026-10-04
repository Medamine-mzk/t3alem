"use client";

import { Button } from "@/components/ui/button";
import { Pencil, Check } from "lucide-react";

interface EditModeToggleProps {
  isEditMode: boolean;
  onToggle: () => void;
}

export function EditModeToggle({ isEditMode, onToggle }: EditModeToggleProps) {
  return (
    <Button
      variant={isEditMode ? "default" : "outline"}
      onClick={onToggle}
      className="gap-2"
    >
      {isEditMode ? (
        <>
          <Check className="h-4 w-4" />
          Done Editing
        </>
      ) : (
        <>
          <Pencil className="h-4 w-4" />
          Edit Course
        </>
      )}
    </Button>
  );
}
