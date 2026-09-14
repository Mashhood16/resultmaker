import DOMPurify from 'dompurify'

export function sanitizeHtml(html: string): string {
  if (typeof window === 'undefined') {
    // Return raw HTML during Server-Side Rendering
    return html;
  }
  // Sanitize on the client
  return DOMPurify.sanitize(html);
}
