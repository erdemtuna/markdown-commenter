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
  
  // Status icons - Fluent UI style SVGs (optimized for 14px render)
  const STATUS_ICONS = {
    'Accept': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.704 5.296a1 1 0 010 1.408l-8 8a1 1 0 01-1.408 0l-4-4a1 1 0 111.408-1.408L8 12.586l7.296-7.29a1 1 0 011.408 0z" clip-rule="evenodd"/></svg>`,
    'Reject': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/></svg>`,
    'Skip': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M4 4a1 1 0 011 1v10a1 1 0 11-2 0V5a1 1 0 011-1zm12.293.293a1 1 0 011.414 0l.003.003A1 1 0 0118 5v10a1 1 0 01-.293.707l-6 6a1 1 0 01-1.414-1.414L15.586 15H9a1 1 0 110-2h6.586l-5.293-5.293a1 1 0 010-1.414l6-6z"/></svg>`,
    'Question': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd"/></svg>`,
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
