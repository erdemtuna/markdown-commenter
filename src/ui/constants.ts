/**
 * Shared constants for UI components
 */

import type { Verdict } from '../annotations/types';

/**
 * Command identifiers for the extension
 */
export const COMMANDS = {
  ANNOTATE: 'markdown-commenter.annotate',
  ANNOTATE_WITH_STATUS: 'markdown-commenter.annotateWithStatus',
  REVEAL_ANNOTATION: 'markdown-commenter.revealAnnotation',
  FOCUS_ANNOTATIONS_VIEW: 'markdown-commenter.focusAnnotationsView',
} as const;

/**
 * View identifiers for the extension
 */
export const VIEWS = {
  ANNOTATIONS_PANEL: 'markdown-commenter.annotationsView',
} as const;

/**
 * Status icons using VS Code codicons for Quick-pick and CodeLens
 */
export const STATUS_CODICONS: Record<Verdict, string> = {
  Accept: '$(check)',
  Reject: '$(x)',
  Skip: '$(arrow-right)',
  Question: '$(question)',
};

/**
 * Status icons using Unicode for webview display (fallback)
 */
export const STATUS_UNICODE: Record<Verdict, string> = {
  Accept: '✓',
  Reject: '✗',
  Skip: '⏭',
  Question: '?',
};

/**
 * Default truncation length for annotation reference text
 */
export const DEFAULT_TRUNCATE_LENGTH = 50;

/**
 * Large file size threshold in bytes (10MB) for warning
 */
export const LARGE_FILE_THRESHOLD = 10 * 1024 * 1024;

/**
 * Debounce delay in milliseconds for document change events
 */
export const DEBOUNCE_DELAY_MS = 300;
