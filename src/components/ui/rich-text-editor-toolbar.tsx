import { Editor } from "@tiptap/react";
import {
  Bold, Strikethrough, Italic, Undo, Redo, Underline, Heading1, Heading2, Heading3, List, ListOrdered, Code2, CheckSquare,
  Highlighter, AlignLeft, AlignCenter, AlignRight, AlignJustify, Link2, Quote, Minus, Table as TableIcon,
  Columns2, Rows2, Trash2, ArrowUpFromLine, ArrowDownFromLine, ArrowLeftFromLine, ArrowRightFromLine, Palette
} from "lucide-react";
import { Button } from "./button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { useCallback } from "react";

const RichTextEditorToolbar = ({ editor }: { editor: Editor | null }) => {
  const setLink = useCallback(() => {
    if (!editor) return;
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);

    // cancelled
    if (url === null) {
      return;
    }

    // empty
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    // update link
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className="border border-input bg-transparent rounded-md p-1 flex flex-row items-center gap-1 flex-wrap">
      {/* Basic Formatting */}
      <Button size="icon" variant={editor.isActive("bold") ? "secondary" : "ghost"} onClick={() => editor.chain().focus().toggleBold().run()}>
        <Bold className="w-4 h-4" />
      </Button>
      <Button size="icon" variant={editor.isActive("italic") ? "secondary" : "ghost"} onClick={() => editor.chain().focus().toggleItalic().run()}>
        <Italic className="w-4 h-4" />
      </Button>
      <Button size="icon" variant={editor.isActive("underline") ? "secondary" : "ghost"} onClick={() => editor.chain().focus().toggleUnderline().run()}>
        <Underline className="w-4 h-4" />
      </Button>
      <Button size="icon" variant={editor.isActive("strike") ? "secondary" : "ghost"} onClick={() => editor.chain().focus().toggleStrike().run()}>
        <Strikethrough className="w-4 h-4" />
      </Button>
      
      <div className="h-6 border-l border-input mx-1" />

      {/* Headings */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="icon" variant="ghost">
            <Heading1 className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>
            <Heading1 className="w-4 h-4 mr-2" /> Heading 1
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
            <Heading2 className="w-4 h-4 mr-2" /> Heading 2
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
            <Heading3 className="w-4 h-4 mr-2" /> Heading 3
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Alignment */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="icon" variant="ghost">
            <AlignLeft className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => editor.chain().focus().setTextAlign('left').run()}>
            <AlignLeft className="w-4 h-4 mr-2" /> Left
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => editor.chain().focus().setTextAlign('center').run()}>
            <AlignCenter className="w-4 h-4 mr-2" /> Center
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => editor.chain().focus().setTextAlign('right').run()}>
            <AlignRight className="w-4 h-4 mr-2" /> Right
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => editor.chain().focus().setTextAlign('justify').run()}>
            <AlignJustify className="w-4 h-4 mr-2" /> Justify
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="h-6 border-l border-input mx-1" />

      {/* Lists */}
      <Button size="icon" variant={editor.isActive("bulletList") ? "secondary" : "ghost"} onClick={() => editor.chain().focus().toggleBulletList().run()}>
        <List className="w-4 h-4" />
      </Button>
      <Button size="icon" variant={editor.isActive("orderedList") ? "secondary" : "ghost"} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
        <ListOrdered className="w-4 h-4" />
      </Button>
      <Button size="icon" variant={editor.isActive("taskList") ? "secondary" : "ghost"} onClick={() => editor.chain().focus().toggleTaskList().run()}>
        <CheckSquare className="w-4 h-4" />
      </Button>

      <div className="h-6 border-l border-input mx-1" />

      {/* Insertables */}
      <Button size="icon" variant={editor.isActive('link') ? "secondary" : "ghost"} onClick={setLink}>
        <Link2 className="w-4 h-4" />
      </Button>
      <Button size="icon" variant={editor.isActive('blockquote') ? "secondary" : "ghost"} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
        <Quote className="w-4 h-4" />
      </Button>
      <Button size="icon" variant="ghost" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
        <Minus className="w-4 h-4" />
      </Button>

      {/* Table Controls */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="icon" variant="ghost">
            <TableIcon className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}>
            Insert Table
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => editor.chain().focus().addColumnBefore().run()}><ArrowLeftFromLine className="w-4 h-4 mr-2" /> Add Column Before</DropdownMenuItem>
          <DropdownMenuItem onClick={() => editor.chain().focus().addColumnAfter().run()}><ArrowRightFromLine className="w-4 h-4 mr-2" /> Add Column After</DropdownMenuItem>
          <DropdownMenuItem onClick={() => editor.chain().focus().deleteColumn().run()}><Trash2 className="w-4 h-4 mr-2" /> Delete Column</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => editor.chain().focus().addRowBefore().run()}><ArrowUpFromLine className="w-4 h-4 mr-2" /> Add Row Before</DropdownMenuItem>
          <DropdownMenuItem onClick={() => editor.chain().focus().addRowAfter().run()}><ArrowDownFromLine className="w-4 h-4 mr-2" /> Add Row After</DropdownMenuItem>
          <DropdownMenuItem onClick={() => editor.chain().focus().deleteRow().run()}><Trash2 className="w-4 h-4 mr-2" /> Delete Row</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => editor.chain().focus().deleteTable().run()}><Trash2 className="w-4 h-4 mr-2" /> Delete Table</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="h-6 border-l border-input mx-1" />

      {/* History */}
      <Button size="icon" variant="ghost" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}>
        <Undo className="w-4 h-4" />
      </Button>
      <Button size="icon" variant="ghost" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}>
        <Redo className="w-4 h-4" />
      </Button>
    </div>
  );
};

export default RichTextEditorToolbar;
