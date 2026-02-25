/**
 * Sidebar panel module
 * 
 * Provides the webview-based sidebar panel for listing and navigating annotations.
 * 
 * Components:
 * - AnnotationsPanelProvider: WebviewViewProvider for the sidebar panel
 * - registerAnnotationsPanelProvider: Registration helper
 * - registerFocusAnnotationsViewCommand: Command to focus the panel
 */

export {
  AnnotationsPanelProvider,
  registerAnnotationsPanelProvider,
  registerFocusAnnotationsViewCommand,
} from './annotationsPanelProvider';
