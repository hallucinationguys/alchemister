'use client'

import { memo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { cn } from '@/shared/lib/utils'
import type { Components } from 'react-markdown'

// Import KaTeX CSS for math rendering
import 'katex/dist/katex.min.css'

// Type definitions for component props
interface CodeProps {
  node?: unknown
  className?: string
  children?: React.ReactNode
  [key: string]: unknown
}

interface ElementProps {
  children?: React.ReactNode
  className?: string
  [key: string]: unknown
}

interface LinkProps extends ElementProps {
  href?: string
}

interface InputProps extends ElementProps {
  type?: string
  checked?: boolean
}

interface MarkdownRendererProps {
  content: string
  className?: string
  isUserMessage?: boolean
}

/**
 * Enhanced markdown renderer with support for:
 * - GitHub Flavored Markdown (tables, strikethrough, task lists)
 * - Math equations (LaTeX with KaTeX)
 * - Syntax highlighting for code blocks
 * - Custom styling for chat messages
 */
const MarkdownRenderer = memo(
  ({ content, className = '', isUserMessage = false }: MarkdownRendererProps) => {
    return (
      <div className={cn('markdown-content', className)}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkMath]}
          rehypePlugins={[rehypeKatex]}
          components={
            {
              // Custom code block renderer with syntax highlighting
              code({ node, className, children, ...props }: CodeProps) {
                const match = /language-(\w+)/.exec(className || '')
                const language = match ? match[1] : ''
                const inline = !language

                if (!inline && language) {
                  return (
                    <SyntaxHighlighter
                      style={oneDark}
                      language={language}
                      PreTag="div"
                      className="rounded-lg !mt-2 !mb-2"
                      showLineNumbers={true}
                      wrapLines={true}
                      customStyle={{
                        margin: 0,
                        borderRadius: '0.5rem',
                        fontSize: '0.875rem',
                      }}
                    >
                      {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
                  )
                }

                // Inline code
                return (
                  <code
                    className={cn(
                      'px-1.5 py-0.5 rounded-md text-sm font-mono',
                      isUserMessage
                        ? 'bg-primary-foreground/20 text-primary-foreground'
                        : 'bg-muted text-foreground'
                    )}
                    {...props}
                  >
                    {children}
                  </code>
                )
              },

              // Custom table styling
              table({ children, ...props }: ElementProps) {
                return (
                  <div className="overflow-x-auto my-4">
                    <table
                      className={cn(
                        'min-w-full border-collapse border border-border rounded-lg',
                        'text-sm'
                      )}
                      {...props}
                    >
                      {children}
                    </table>
                  </div>
                )
              },

              // Table header styling
              th({ children, ...props }: ElementProps) {
                return (
                  <th
                    className={cn(
                      'border border-border px-3 py-2 text-left font-semibold',
                      isUserMessage ? 'bg-primary-foreground/10' : 'bg-muted/50'
                    )}
                    {...props}
                  >
                    {children}
                  </th>
                )
              },

              // Table cell styling
              td({ children, ...props }: ElementProps) {
                return (
                  <td className="border border-border px-3 py-2" {...props}>
                    {children}
                  </td>
                )
              },

              // Custom blockquote styling
              blockquote({ children, ...props }: ElementProps) {
                return (
                  <blockquote
                    className={cn(
                      'border-l-4 pl-4 py-2 my-4 italic',
                      isUserMessage
                        ? 'border-primary-foreground/30 text-primary-foreground/80'
                        : 'border-border text-muted-foreground'
                    )}
                    {...props}
                  >
                    {children}
                  </blockquote>
                )
              },

              // Custom heading styles
              h1({ children, ...props }: ElementProps) {
                return (
                  <h1
                    className={cn(
                      'text-2xl font-bold mt-6 mb-4 first:mt-0',
                      isUserMessage ? 'text-primary-foreground' : 'text-foreground'
                    )}
                    {...props}
                  >
                    {children}
                  </h1>
                )
              },

              h2({ children, ...props }: ElementProps) {
                return (
                  <h2
                    className={cn(
                      'text-xl font-semibold mt-5 mb-3 first:mt-0',
                      isUserMessage ? 'text-primary-foreground' : 'text-foreground'
                    )}
                    {...props}
                  >
                    {children}
                  </h2>
                )
              },

              h3({ children, ...props }: ElementProps) {
                return (
                  <h3
                    className={cn(
                      'text-lg font-semibold mt-4 mb-2 first:mt-0',
                      isUserMessage ? 'text-primary-foreground' : 'text-foreground'
                    )}
                    {...props}
                  >
                    {children}
                  </h3>
                )
              },

              // Custom paragraph styling
              p({ children, ...props }: ElementProps) {
                return (
                  <p
                    className={cn(
                      'mb-3 last:mb-0 leading-relaxed',
                      isUserMessage ? 'text-primary-foreground' : 'text-foreground'
                    )}
                    {...props}
                  >
                    {children}
                  </p>
                )
              },

              // Custom list styling
              ul({ children, ...props }: ElementProps) {
                return (
                  <ul
                    className={cn(
                      'list-disc list-inside mb-3 space-y-1',
                      isUserMessage ? 'text-primary-foreground' : 'text-foreground'
                    )}
                    {...props}
                  >
                    {children}
                  </ul>
                )
              },

              ol({ children, ...props }: ElementProps) {
                return (
                  <ol
                    className={cn(
                      'list-decimal list-inside mb-3 space-y-1',
                      isUserMessage ? 'text-primary-foreground' : 'text-foreground'
                    )}
                    {...props}
                  >
                    {children}
                  </ol>
                )
              },

              // Custom link styling
              a({ children, href, ...props }: LinkProps) {
                return (
                  <a
                    href={href}
                    className={cn(
                      'underline underline-offset-2 transition-colors',
                      isUserMessage
                        ? 'text-primary-foreground hover:text-primary-foreground/80'
                        : 'text-primary hover:text-primary/80'
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    {...props}
                  >
                    {children}
                  </a>
                )
              },

              // Custom horizontal rule
              hr({ ...props }: ElementProps) {
                return (
                  <hr
                    className={cn(
                      'my-6 border-t',
                      isUserMessage ? 'border-primary-foreground/30' : 'border-border'
                    )}
                    {...props}
                  />
                )
              },

              // Task list styling (from remark-gfm)
              input({ type, checked, ...props }: InputProps) {
                if (type === 'checkbox') {
                  return (
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled
                      className="mr-2 accent-primary"
                      {...props}
                    />
                  )
                }
                return <input type={type} {...props} />
              },

              // Custom math styling for KaTeX
              span({ className, children, ...props }: ElementProps) {
                // Handle inline math
                if (className?.includes('math-inline')) {
                  return (
                    <span
                      className={cn(
                        'katex-inline',
                        isUserMessage ? 'text-primary-foreground' : 'text-foreground'
                      )}
                      {...props}
                    >
                      {children}
                    </span>
                  )
                }
                return (
                  <span className={className} {...props}>
                    {children}
                  </span>
                )
              },

              // Custom div styling for display math
              div({ className, children, ...props }: ElementProps) {
                // Handle display math
                if (className?.includes('math-display')) {
                  return (
                    <div
                      className={cn(
                        'katex-display my-4 text-center overflow-x-auto',
                        isUserMessage ? 'text-primary-foreground' : 'text-foreground'
                      )}
                      {...props}
                    >
                      {children}
                    </div>
                  )
                }
                return (
                  <div className={className} {...props}>
                    {children}
                  </div>
                )
              },
            } as Components
          }
        >
          {content}
        </ReactMarkdown>
      </div>
    )
  }
)

MarkdownRenderer.displayName = 'MarkdownRenderer'

export default MarkdownRenderer
