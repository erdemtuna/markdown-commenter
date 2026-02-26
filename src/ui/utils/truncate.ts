/**
 * Truncate text for display, adding ellipsis if needed
 * @param text The text to truncate
 * @param maxLength Maximum length before truncation (default: 50)
 * @returns Truncated text with "..." if it exceeded maxLength
 */
export function truncateForDisplay(text: string, maxLength = 50): string {
  // Normalize whitespace (collapse multiple spaces/newlines into single space)
  const normalized = text.replace(/\s+/g, ' ').trim();
  
  if (normalized.length <= maxLength) {
    return normalized;
  }
  
  // Minimum meaningful maxLength is 3 (for "...")
  if (maxLength < 3) {
    return '...'.slice(0, maxLength);
  }
  
  return normalized.slice(0, maxLength - 3) + '...';
}
