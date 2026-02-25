/**
 * Annotations Panel Client-side Script
 * 
 * Handles webview message passing and DOM updates for the annotations sidebar.
 * Renders annotation items and handles click-to-navigate functionality.
 */

(function() {
  // @ts-ignore - acquireVsCodeApi is provided by VS Code webview
  const vscode = acquireVsCodeApi();
  
  // DOM elements
  const placeholder = document.getElementById('placeholder');
  const annotationsList = document.getElementById('annotations-list');
  
  // Status icons (Unicode for webview display)
  const STATUS_ICONS = {
    'Accept': '✓',
    'Reject': '✗',
    'Skip': '⏭',
    'Question': '?',
  };
  
  // Current state
  let currentAnnotations = [];
  let selectedIndex = -1;
  
  /**
   * Handle messages from the extension
   */
  window.addEventListener('message', event => {
    const message = event.data;
    
    switch (message.type) {
      case 'updateAnnotations':
        renderAnnotations(message.annotations);
        break;
      case 'setPlaceholder':
        showPlaceholder(message.message);
        break;
    }
  });
  
  /**
   * Show placeholder message (no annotations or no markdown file)
   */
  function showPlaceholder(message) {
    if (placeholder) {
      const p = placeholder.querySelector('p');
      if (p) {
        p.textContent = message;
      }
      placeholder.classList.remove('hidden');
    }
    if (annotationsList) {
      annotationsList.classList.add('hidden');
      annotationsList.innerHTML = '';
    }
    currentAnnotations = [];
    selectedIndex = -1;
  }
  
  /**
   * Render annotations list
   */
  function renderAnnotations(annotations) {
    currentAnnotations = annotations;
    selectedIndex = -1;
    
    if (!annotations || annotations.length === 0) {
      showPlaceholder('No annotations in this file');
      return;
    }
    
    // Hide placeholder, show list
    if (placeholder) {
      placeholder.classList.add('hidden');
    }
    if (annotationsList) {
      annotationsList.classList.remove('hidden');
      annotationsList.innerHTML = '';
      
      annotations.forEach((annotation, index) => {
        const item = createAnnotationItem(annotation, index);
        annotationsList.appendChild(item);
      });
    }
  }
  
  /**
   * Create a single annotation list item
   */
  function createAnnotationItem(annotation, index) {
    const li = document.createElement('li');
    li.className = 'annotation-item';
    li.setAttribute('role', 'option');
    li.setAttribute('tabindex', '0');
    li.setAttribute('aria-label', `${annotation.status} annotation ${annotation.id}: ${annotation.displayText}`);
    li.dataset.index = index;
    li.dataset.startLine = annotation.startLine;
    li.dataset.endLine = annotation.endLine;
    
    // Main row (status icon + display text)
    const mainRow = document.createElement('div');
    mainRow.className = 'annotation-main';
    
    // Status icon
    const statusIcon = document.createElement('span');
    statusIcon.className = `status-icon ${annotation.status.toLowerCase()}`;
    statusIcon.textContent = STATUS_ICONS[annotation.status] || '•';
    statusIcon.setAttribute('aria-hidden', 'true');
    mainRow.appendChild(statusIcon);
    
    // Display text (prominent)
    const textSpan = document.createElement('span');
    textSpan.className = 'annotation-text';
    textSpan.textContent = annotation.displayText;
    mainRow.appendChild(textSpan);
    
    li.appendChild(mainRow);
    
    // Secondary row (ID - subtle)
    const idRow = document.createElement('div');
    idRow.className = 'annotation-id';
    idRow.textContent = `#${annotation.id}`;
    idRow.setAttribute('aria-hidden', 'true');
    li.appendChild(idRow);
    
    // Click handler
    li.addEventListener('click', () => navigateToAnnotation(annotation));
    
    // Keyboard handler
    li.addEventListener('keydown', (e) => handleItemKeydown(e, annotation, index));
    
    return li;
  }
  
  /**
   * Handle keyboard navigation on list items
   */
  function handleItemKeydown(event, annotation, index) {
    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault();
        navigateToAnnotation(annotation);
        break;
      case 'ArrowDown':
        event.preventDefault();
        focusItem(index + 1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        focusItem(index - 1);
        break;
      case 'Home':
        event.preventDefault();
        focusItem(0);
        break;
      case 'End':
        event.preventDefault();
        focusItem(currentAnnotations.length - 1);
        break;
    }
  }
  
  /**
   * Focus a specific item by index
   */
  function focusItem(index) {
    if (index < 0 || index >= currentAnnotations.length) {
      return;
    }
    
    const items = annotationsList?.querySelectorAll('.annotation-item');
    if (items && items[index]) {
      // Update aria-selected
      items.forEach((item, i) => {
        item.setAttribute('aria-selected', i === index ? 'true' : 'false');
      });
      
      items[index].focus();
      selectedIndex = index;
    }
  }
  
  /**
   * Navigate to annotation in editor
   */
  function navigateToAnnotation(annotation) {
    vscode.postMessage({
      command: 'navigateTo',
      startLine: annotation.startLine,
      endLine: annotation.endLine,
    });
  }
  
  // Set up keyboard navigation on the list container
  if (annotationsList) {
    annotationsList.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown' && selectedIndex === -1) {
        e.preventDefault();
        focusItem(0);
      }
    });
  }
})();
