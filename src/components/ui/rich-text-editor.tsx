
"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import RichTextEditorToolbar from "./rich-text-editor-toolbar";

const RichTextEditor = ({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) => {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "prose dark:prose-invert prose-sm sm:prose-base lg:prose-lg xl:prose-2xl m-5 focus:outline-none",
      },
    },
    immediatelyRender: false,
  });

  return (
    <div>
      <RichTextEditorToolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
};

export default RichTextEditor;
