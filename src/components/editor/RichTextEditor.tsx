import { useEffect, useRef, useState, useCallback } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { TableKit } from '@tiptap/extension-table'
import DOMPurify from 'dompurify'
import parse from 'html-react-parser'
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Link,
  Table as TableIcon,
  Heading,
  Code,
  X,
  Maximize,
  Minimize,
  Eye,
} from 'lucide-react'

const TOOLBAR_HEIGHT = 'h-9'

interface RichTextEditorProps {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

const sanitizeHtml = (html: string): string => {
  return DOMPurify.sanitize(html, {
    ADD_ATTR: ['target', 'rel', 'href', 'colspan', 'rowspan'],
    ADD_TAGS: ['table', 'thead', 'tbody', 'tr', 'th', 'td'],
  })
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'Write your product description here…',
  disabled = false,
  className,
}) => {
  const [isMaximized, setIsMaximized] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const editorRef = useRef<HTMLDivElement>(null)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      TableKit.configure({
        table: {
          resizable: false,
        },
      }),
    ],
    content: value || '',
    editable: !disabled,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      onChange(sanitizeHtml(html))
    },
  })

  const isEmpty = useCallback(() => {
    return !editor || editor.getHTML() === '<p><br></p>'
  }, [editor])

  const handleInsertTable = () => {
    if (!editor) return
    editor.chain().focus().insertTable({ rows: 3, cols: 4 }).run()
  }

  const handleTogglePreview = () => {
    setShowPreview(!showPreview)
  }

  const handleToggleMaximize = () => {
    setIsMaximized(!isMaximized)
  }

  const cleanHtmlForPreview = useCallback((html: string) => {
    if (!html || html === '<p><br></p>') return ''
    return html
  }, [])

  const toolbar = (
    <div className="flex items-center gap-1 border border-line rounded-lg bg-card p-1">
      <button
        type="button"
        onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
        disabled={!editor || disabled}
        className={`flex w-8 items-center justify-center rounded-sm text-xs ${editor?.isActive('heading', { level: 2 }) ? 'bg-teal/10 text-tealdeep' : 'text-muted hover:bg-mist'}`}
        title="Heading 2"
        aria-label="Heading 2"
      >
        <Heading className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
        disabled={!editor || disabled}
        className={`flex w-8 items-center justify-center rounded-sm text-xs ${editor?.isActive('heading', { level: 3 }) ? 'bg-teal/10 text-tealdeep' : 'text-muted hover:bg-mist'}`}
        title="Heading 3"
        aria-label="Heading 3"
      >
        <span className="text-xs font-bold">H3</span>
      </button>
      <div className="h-4 w-px bg-line mx-1" />
      <button
        type="button"
        onClick={() => editor?.chain().focus().toggleBold().run()}
        disabled={!editor || disabled}
        className={`flex w-8 items-center justify-center rounded-sm text-xs ${editor?.isActive('bold') ? 'bg-teal/10 text-tealdeep' : 'text-muted hover:bg-mist'}`}
        title="Bold"
        aria-label="Bold"
      >
        <Bold className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => editor?.chain().focus().toggleItalic().run()}
        disabled={!editor || disabled}
        className={`flex w-8 items-center justify-center rounded-sm text-xs ${editor?.isActive('italic') ? 'bg-teal/10 text-tealdeep' : 'text-muted hover:bg-mist'}`}
        title="Italic"
        aria-label="Italic"
      >
        <Italic className="h-4 w-4" />
      </button>
      <div className="h-4 w-px bg-line mx-1" />
      <button
        type="button"
        onClick={() => editor?.chain().focus().toggleBulletList().run()}
        disabled={!editor || disabled}
        className={`flex w-8 items-center justify-center rounded-sm text-xs ${editor?.isActive('bulletList') ? 'bg-teal/10 text-tealdeep' : 'text-muted hover:bg-mist'}`}
        title="Bullet list"
        aria-label="Bullet list"
      >
        <List className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => editor?.chain().focus().toggleOrderedList().run()}
        disabled={!editor || disabled}
        className={`flex w-8 items-center justify-center rounded-sm text-xs ${editor?.isActive('orderedList') ? 'bg-teal/10 text-tealdeep' : 'text-muted hover:bg-mist'}`}
        title="Numbered list"
        aria-label="Numbered list"
      >
        <ListOrdered className="h-4 w-4" />
      </button>
      <div className="h-4 w-px bg-line mx-1" />
      <button
        type="button"
        onClick={handleInsertTable}
        disabled={!editor || disabled}
        className="flex w-8 items-center justify-center rounded-sm text-xs text-muted hover:bg-mist"
        title="Insert table"
        aria-label="Insert table"
      >
        <TableIcon className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => {
          const url = window.prompt('Enter URL:')
          if (url) editor?.chain().focus().setLink({ href: url }).run()
        }}
        disabled={!editor || disabled}
        className="flex w-8 items-center justify-center rounded-sm text-xs text-muted hover:bg-mist"
        title="Insert link"
        aria-label="Insert link"
      >
        <Link className="h-4 w-4" />
      </button>
      <div className="h-4 w-px bg-line mx-1" />
      <button
        type="button"
        onClick={handleTogglePreview}
        className="flex w-8 items-center justify-center rounded-sm text-xs text-muted hover:bg-mist"
        title="Preview"
        aria-label="Preview"
      >
        <Eye className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={handleToggleMaximize}
        className="flex w-8 items-center justify-center rounded-sm text-xs text-muted hover:bg-mist"
        title={isMaximized ? 'Restore size' : 'Maximize'}
        aria-label={isMaximized ? 'Restore size' : 'Maximize'}
      >
        {isMaximized ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
      </button>
    </div>
  )

  const editorContent = editor ? (
    <EditorContent
      editor={editor}
      className={`
        min-h-[300px] border border-line rounded-lg p-4 text-sm leading-relaxed outline-none
        ${isMaximized ? 'min-h-[600px]' : ''}
        ${disabled ? 'bg-muted/50' : ''}
      `}
    />
  ) : null

  const previewContent = showPreview && editor
    ? parse(sanitizeHtml(editor.getHTML()), {
        replace: (domNode: any) => {
          if (domNode.tagName === 'A') {
            return {
              ...domNode,
              target: '_blank',
              rel: 'noopener noreferrer',
            }
          }
          return domNode
        },
      })
    : null

  const containerClass = `border border-line rounded-lg bg-card flex flex-col ${className || ''} ${
    isMaximized ? 'fixed inset-0 z-50 bg-card shadow-2xl' : ''
  }`

  return (
    <div className={containerClass} ref={editorRef}>
      {!isMaximized && (
        <div className="flex items-center justify-between border-b border-line bg-mist/50 px-3 py-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted">
            Product Description
          </span>
          <button
            type="button"
            onClick={handleTogglePreview}
            className="text-[10px] font-bold text-muted hover:text-teal"
          >
            {showPreview ? 'Edit' : 'Preview'}
          </button>
        </div>
      )}
      {!showPreview && (
        <>
          <div className="px-2">{toolbar}</div>
          <div className="relative flex-1 overflow-auto">
            {editorContent}
            {!editor && (
              <div className="absolute inset-0 flex items-center justify-center text-muted text-xs">
                {placeholder}
              </div>
            )}
            {isEmpty() && !editorContent && (
              <div className="absolute inset-0 flex items-center justify-center text-muted/50 text-xs pointer-events-none">
                {placeholder}
              </div>
            )}
          </div>
        </>
      )}
      {showPreview && (
        <div className="flex-1 overflow-auto p-4 bg-muted/30">
          {previewContent || (
            <div className="text-muted text-xs text-center py-10">No content to preview.</div>
          )}
        </div>
      )}
      {isMaximized && (
        <div className="absolute top-3 right-3 z-10">
          <button
            type="button"
            onClick={handleToggleMaximize}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-card text-muted hover:text-ink"
            title="Restore size"
            aria-label="Restore size"
          >
            <Minimize className="h-4 w-4" />
          </button>
        </div>
      )}
      {isMaximized && (
        <button
          type="button"
          onClick={() => setIsMaximized(false)}
          className="absolute top-3 left-3 z-10 flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-card text-muted hover:text-ink"
          aria-label="Close editor"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}

export default RichTextEditor
export { sanitizeHtml }
