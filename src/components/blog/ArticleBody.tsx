import { useMemo } from 'react'
import DOMPurify from 'dompurify'
import parse, { domToReact, Element, type DOMNode, type HTMLReactParserOptions } from 'html-react-parser'

interface ArticleBodyProps {
  html: string
  className?: string
}

/**
 * Renders administrator-authored article HTML with a consistent, readable
 * layout. Inline images are lazy-loaded, external links open safely in a new
 * tab, and tables stay usable on small screens.
 */
export default function ArticleBody({ html, className = '' }: ArticleBodyProps) {
  const clean = useMemo(
    () =>
      DOMPurify.sanitize(html || '', {
        ADD_ATTR: ['target', 'rel', 'colspan', 'rowspan', 'loading', 'decoding'],
        ADD_TAGS: ['table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'figure', 'figcaption'],
      }),
    [html],
  )

  const options: HTMLReactParserOptions = {
    replace: (node: DOMNode) => {
      if (!(node instanceof Element)) return undefined
      const attribs = node.attribs || {}

      if (node.name === 'img') {
        return (
          <img
            src={attribs.src}
            alt={attribs.alt || ''}
            loading="lazy"
            decoding="async"
            className="my-6 w-full rounded-xl border border-line bg-card object-cover"
          />
        )
      }

      if (node.name === 'a') {
        const href = attribs.href || ''
        const external = /^https?:\/\//i.test(href)
        return (
          <a
            href={href}
            className="article-link"
            {...(external ? { target: '_blank', rel: 'noopener noreferrer nofollow' } : {})}
          >
            {domToReact(node.children as DOMNode[], options)}
          </a>
        )
      }

      if (node.name === 'table') {
        return (
          <div className="my-6 overflow-x-auto rounded-xl border border-line">
            <table className="article-table">{domToReact(node.children as DOMNode[], options)}</table>
          </div>
        )
      }

      return undefined
    },
  }

  const content = useMemo(() => parse(clean, options), [clean])

  return <div className={`article-prose ${className}`.trim()}>{content}</div>
}
