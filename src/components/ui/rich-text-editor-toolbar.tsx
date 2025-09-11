
import { Editor } from "@tiptap/react";
import { Bold, Strikethrough, Italic, Undo, Redo } from "lucide-react";
import { Button } from "./button";


const RichTextEditorToolbar = ({ editor }: { editor: Editor | null }) => {
  if (!editor) {
    return null;
  }

  return (
    <div className="border border-input bg-transparent rounded-md p-1 flex flex-row items-center gap-1">
      <Button
        size="icon"
        variant={editor.isActive("bold") ? "secondary" : "ghost"}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold className="w-4 h-4" />
      </Button>
      <Button
        size="icon"
        variant={editor.isActive("italic") ? "secondary" : "ghost"}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic className="w-4 h-4" />
      </Button>
      <Button
        size="icon"
        variant={editor.isActive("strike") ? "secondary" : "ghost"}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      >
        <Strikethrough className="w-4 h-4" />
      </Button>

      <div className="h-6 border-l border-input mx-1" />

      <Button
        size="icon"
        variant="ghost"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
      >
        <Undo className="w-4 h-4" />
      </Button>
      <Button
        size="icon"
        variant="ghost"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
      >
        <Redo className="w-4 h-4" />
      </Button>
    </div>
  );
};

export default RichTextEditorToolbar;