import { Annotation, AnnotatedBlock, Verdict } from './types';

const VALID_VERDICTS: Verdict[] = ['Accept', 'Reject', 'Skip', 'Question'];

/**
 * Parse a single annotation block text into an Annotation object
 * @param blockText The raw text of the annotation block (including `> ` prefixes)
 * @returns Parsed annotation or null if invalid/malformed
 */
export function parseAnnotation(blockText: string): Annotation | null {
  const lines = blockText.split('\n').map(line => line.trim());
  
  // Must start with > [!COMMENT]
  if (!lines[0]?.match(/^>\s*\[!COMMENT\]/i)) {
    return null;
  }

  let id: string | undefined;
  let status: Verdict | undefined;
  let re: string | undefined;
  const commentLines: string[] = [];
  let foundMetadata = false;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    
    // Skip empty blockquote lines
    if (line === '>' || line === '') {
      continue;
    }

    // Must be a blockquote line
    if (!line.startsWith('>')) {
      break;
    }

    const content = line.slice(1).trim();

    // Parse ID field
    const idMatch = content.match(/^\*\*ID\*\*:\s*(.+)$/i);
    if (idMatch) {
      id = idMatch[1].trim();
      foundMetadata = true;
      continue;
    }

    // Parse Status field
    const statusMatch = content.match(/^\*\*Status\*\*:\s*(.+)$/i);
    if (statusMatch) {
      const statusValue = statusMatch[1].trim() as Verdict;
      if (VALID_VERDICTS.includes(statusValue)) {
        status = statusValue;
      }
      foundMetadata = true;
      continue;
    }

    // Parse Re field (optional)
    const reMatch = content.match(/^\*\*Re\*\*:\s*"(.+)"$/i);
    if (reMatch) {
      re = reMatch[1];
      foundMetadata = true;
      continue;
    }

    // Any other content is part of the comment
    if (foundMetadata && content) {
      commentLines.push(content);
    }
  }

  // ID and status are required
  if (!id || !status) {
    return null;
  }

  const annotation: Annotation = { id, status };
  if (re) {
    annotation.re = re;
  }
  if (commentLines.length > 0) {
    annotation.comment = commentLines.join('\n');
  }

  return annotation;
}

/**
 * Find all annotation blocks in file content
 * @param content The full file content
 * @returns Array of annotated blocks with their positions
 */
export function findAnnotations(content: string): AnnotatedBlock[] {
  const lines = content.split('\n');
  const blocks: AnnotatedBlock[] = [];
  
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    
    // Check if this line starts an annotation block
    if (line.trim().match(/^>\s*\[!COMMENT\]/i)) {
      const startLine = i;
      const blockLines: string[] = [line];
      
      // Collect all subsequent blockquote lines
      i++;
      while (i < lines.length) {
        const nextLine = lines[i];
        // Continue if it's a blockquote line or empty
        if (nextLine.trim().startsWith('>') || nextLine.trim() === '') {
          // Stop if we hit a blank line followed by non-blockquote
          if (nextLine.trim() === '' && i + 1 < lines.length && !lines[i + 1].trim().startsWith('>')) {
            break;
          }
          blockLines.push(nextLine);
          i++;
        } else {
          break;
        }
      }
      
      // Remove trailing empty lines from block
      while (blockLines.length > 0 && blockLines[blockLines.length - 1].trim() === '') {
        blockLines.pop();
      }
      
      const endLine = startLine + blockLines.length - 1;
      const blockText = blockLines.join('\n');
      const annotation = parseAnnotation(blockText);
      
      if (annotation) {
        blocks.push({ annotation, startLine, endLine });
      }
    } else {
      i++;
    }
  }
  
  return blocks;
}
