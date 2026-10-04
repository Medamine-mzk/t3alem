"use client";

import { useState } from "react";
import MDEditor from "@uiw/react-md-editor";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface RichTextEditorProps {
  value: string;
  onSave: (value: string) => Promise<void>;
  placeholder?: string;
}

export function RichTextEditor({ value, onSave, placeholder = "Enter content..." }: RichTextEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [isSaving, setIsSaving] = useState(false);

  async function handleSave() {
    if (editValue.trim() === value) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    try {
      await onSave(editValue);
      toast.success("Content saved");
      setIsEditing(false);
    } catch {
      toast.error("Failed to save");
    } finally {
      setIsSaving(false);
    }
  }

  function handleCancel() {
    setEditValue(value);
    setIsEditing(false);
  }

  if (isEditing) {
    return (
      <div className="space-y-2">
        <MDEditor
          value={editValue}
          onChange={(val) => setEditValue(val || "")}
          height={300}
          preview="edit"
        />
        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={isSaving} size="sm">
            {isSaving && <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />}
            Save
          </Button>
          <Button onClick={handleCancel} variant="outline" size="sm">
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={() => setIsEditing(true)}
      className="cursor-pointer rounded-md px-2 py-1 transition-colors hover:bg-accent"
      title="Click to edit"
    >
      {value ? (
        <div className="prose prose-sm max-w-none" data-color-mode="light">
          <MDEditor.Markdown source={value} remarkPlugins={[remarkGfm]} />
        </div>
      ) : (
        <span className="text-muted-foreground">{placeholder}</span>
      )}
    </div>
  );
}
