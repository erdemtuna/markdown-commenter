/**
 * Verdict types for annotation status
 */
export type Verdict = 'Accept' | 'Reject' | 'Skip' | 'Question';

/**
 * Represents a single annotation with its metadata
 */
export interface Annotation {
  /** Unique 8-character alphanumeric identifier */
  id: string;
  /** User's verdict on the item */
  status: Verdict;
  /** Optional quoted reference to the annotated text */
  re?: string;
  /** Optional user comment explaining the verdict */
  comment?: string;
}

/**
 * An annotation with its location in the document
 */
export interface AnnotatedBlock {
  /** The parsed annotation */
  annotation: Annotation;
  /** 0-based line number where the annotation block starts */
  startLine: number;
  /** 0-based line number where the annotation block ends (inclusive) */
  endLine: number;
}
