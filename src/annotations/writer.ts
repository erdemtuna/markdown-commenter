import { Annotation } from './types';

/**
 * Generate a random 8-character alphanumeric ID
 * @returns An 8-character string containing lowercase letters and digits
 */
export function generateId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let id = '';
  for (let i = 0; i < 8; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
}

/**
 * Format an annotation as a GitHub-style callout block
 * @param annotation The annotation to format
 * @returns Multi-line string with the formatted callout block
 */
export function formatAnnotation(annotation: Annotation): string {
  const lines: string[] = ['> [!COMMENT]'];
  lines.push(`> **ID**: ${annotation.id}`);
  lines.push(`> **Status**: ${annotation.status}`);
  
  if (annotation.re) {
    lines.push(`> **Re**: "${annotation.re}"`);
  }
  
  if (annotation.comment) {
    // Add blank line before comment
    lines.push('>');
    // Prefix each comment line with >
    const commentLines = annotation.comment.split('\n');
    for (const line of commentLines) {
      lines.push(`> ${line}`);
    }
  }
  
  return lines.join('\n');
}

/**
 * Insert an annotation after a specified line in the content
 * @param content The original file content
 * @param lineNumber 0-based line number to insert after
 * @param annotation The annotation to insert
 * @returns The modified content with the annotation inserted
 */
export function insertAnnotation(content: string, lineNumber: number, annotation: Annotation): string {
  const lines = content.split('\n');
  
  // Clamp line number to valid range
  const insertAfter = Math.max(0, Math.min(lineNumber, lines.length - 1));
  
  // Format the annotation
  const annotationBlock = formatAnnotation(annotation);
  
  // Insert after the specified line with blank lines for spacing
  const before = lines.slice(0, insertAfter + 1);
  const after = lines.slice(insertAfter + 1);
  
  return [...before, '', annotationBlock, '', ...after].join('\n');
}
