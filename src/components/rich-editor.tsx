'use client';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Youtube from '@tiptap/extension-youtube';
import { useState } from 'react';
export function RichEditor({
  value,
  onChange,
  media,
}: {
  value: string;
  onChange: (html: string) => void;
  media: { id: string; url: string; title: string; alt: string }[];
}) {
  const [video, setVideo] = useState('');
  const [link, setLink] = useState('');
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [StarterKit, Image, Youtube.configure({ nocookie: true })],
    content: value,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: 'rich-content',
        role: 'textbox',
        'aria-label': 'Cuerpo del artículo',
        'aria-multiline': 'true',
      },
    },
  });
  if (!editor) return <p>Cargando editor…</p>;
  return (
    <div className="editor">
      <div className="editor-toolbar">
        <button
          type="button"
          aria-pressed={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          Negrita
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()}>
          Cursiva
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          Subtítulo
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()}>
          Lista
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleBlockquote().run()}>
          Cita
        </button>
        <button type="button" onClick={() => editor.chain().focus().undo().run()}>
          Deshacer
        </button>
      </div>
      <EditorContent editor={editor} />
      <div className="editor-tools">
        <label>
          Imagen del archivo
          <select
            defaultValue=""
            onChange={(e) => {
              const image = media.find((m) => m.id === e.target.value);
              if (image) {
                editor.chain().focus().setImage({ src: image.url, alt: image.alt }).run();
                e.target.value = '';
              }
            }}
          >
            <option value="">Seleccionar imagen</option>
            {media.map((m) => (
              <option value={m.id} key={m.id}>
                {m.title}
              </option>
            ))}
          </select>
        </label>
        <label>
          Enlace HTTPS
          <input value={link} onChange={(e) => setLink(e.target.value)} />
        </label>
        <button
          type="button"
          onClick={() => {
            if (/^https?:\/\//.test(link)) editor.chain().focus().setLink({ href: link }).run();
          }}
        >
          Insertar enlace
        </button>
        <label>
          Video de YouTube
          <input value={video} onChange={(e) => setVideo(e.target.value)} />
        </label>
        <button
          type="button"
          onClick={() => {
            if (/^https:\/\/(www\.)?(youtube\.com|youtu\.be)\//.test(video))
              editor.commands.setYoutubeVideo({ src: video });
          }}
        >
          Insertar video
        </button>
      </div>
    </div>
  );
}
