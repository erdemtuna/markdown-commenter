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
  
  // Status icons - Fluent UI style SVGs
  const STATUS_ICONS = {
    'Accept': `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z"/></svg>`,
    'Reject': `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M3.72 3.72a.75.75 0 011.06 0L8 6.94l3.22-3.22a.75.75 0 111.06 1.06L9.06 8l3.22 3.22a.75.75 0 11-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 01-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 010-1.06z"/></svg>`,
    'Skip': `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M4.25 3a.75.75 0 01.75.75v8.5a.75.75 0 01-1.5 0v-8.5A.75.75 0 014.25 3zm6.5 0a.75.75 0 01.53.22l3.5 3.5a.75.75 0 010 1.06l-3.5 3.5a.75.75 0 01-1.28-.53V8.5H6.75a.75.75 0 010-1.5H10V4.75a.75.75 0 01.22-.53.75.75 0 01.53-.22z"/></svg>`,
    'Question': `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM0 8a8 8 0 1116 0A8 8 0 010 8zm9 3a1 1 0 11-2 0 1 1 0 012 0zM6.92 6.085c.081-.16.19-.299.34-.398.145-.097.371-.187.74-.187.28 0 .553.087.738.225.167.126.262.291.262.478 0 .39-.152.616-.525.93l-.084.07c-.392.325-.738.66-.738 1.267v.25a.75.75 0 001.5 0v-.115c0-.134.075-.238.286-.415l.09-.074c.448-.371.897-.793.897-1.563 0-.498-.22-.923-.628-1.234-.396-.302-.918-.463-1.476-.463-.605 0-1.102.163-1.464.429-.37.27-.626.644-.788 1.057a.75.75 0 101.392.556z"/></svg>`,
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
    statusIcon.innerHTML = STATUS_ICONS[annotation.status] || '•';
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
