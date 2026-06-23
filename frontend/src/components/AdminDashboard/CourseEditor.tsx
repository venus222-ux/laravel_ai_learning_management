import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import Placeholder from "@tiptap/extension-placeholder";
import { useEffect } from "react";

import styles from "../../styles/CourseEditor.module.css"

interface Props {
  value: string;
  onChange: (value: string) => void;
}

export default function CourseEditor({ value, onChange }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3],
        },
      }),
      Image.configure({
        inline: false,
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      Placeholder.configure({
        placeholder: "Write your course content here...",
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || "");
    }
  }, [value, editor]);

  if (!editor) return null;

  const addImage = () => {
    const url = window.prompt("Enter Image URL:");
    if (url) editor.chain().focus().setImage({ src: url }).run();
  };

  const addLink = () => {
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("Enter Link Destination URL:", previousUrl);
    
    if (url === null) return; // Cancelled
    if (url === "") {
      editor.chain().focus().unsetLink().run();
      return;
    }
    
    editor.chain().focus().setLink({ href: url }).run();
  };

  const addTable = () => {
    editor
      .chain()
      .focus()
      .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
      .run();
  };

  return (
    <div className={styles.editorContainer}>
      {/* TOOLBAR SYSTEM */}
      <div className={styles.toolbar}>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`${styles.menuBtn} ${editor.isActive("bold") ? styles.activeBtn : ""}`}
        >
          <strong>B</strong>
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`${styles.menuBtn} ${editor.isActive("italic") ? styles.activeBtn : ""}`}
        >
          <em>I</em>
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`${styles.menuBtn} ${editor.isActive("heading", { level: 2 }) ? styles.activeBtn : ""}`}
        >
          H2
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`${styles.menuBtn} ${editor.isActive("bulletList") ? styles.activeBtn : ""}`}
        >
          • List
        </button>

        <div className="" />

        <button
          type="button"
          onClick={addLink}
          className={`${styles.menuBtn} ${editor.isActive("link") ? styles.activeBtn : ""}`}
        >
          Link
        </button>

        <button type="button" onClick={addImage} className={styles.menuBtn}>
          Image
        </button>

        <button type="button" onClick={addTable} className={styles.menuBtn}>
          + Table
        </button>
      </div>

      {/* CORE INTERACTION FRAMEWORK */}
      <EditorContent editor={editor} />
    </div>
  );
}