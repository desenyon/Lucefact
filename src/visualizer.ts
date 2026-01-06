import { ModelMetadata, ModelLayer } from './types';
import html2canvas from 'html2canvas';

export type LayoutType = 'vertical' | 'horizontal' | 'circular' | 'tree';

export class Visualizer {
  private canvas: HTMLElement;
  private scale = 1;
  private translateX = 0;
  private translateY = 0;
  private isDragging = false;
  private startX = 0;
  private startY = 0;
  private startTranslateX = 0;
  private startTranslateY = 0;
  private currentLayout: LayoutType = 'vertical';
  private currentMetadata: ModelMetadata | null = null;
  private searchTerm = '';

  constructor(canvasElement: HTMLElement) {
    this.canvas = canvasElement;
    this.setupEventListeners();
  }

  private setupEventListeners() {
    // Disable wheel zoom (no user-controlled zoom)
    this.canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      return false;
    }, { passive: false });

    // Mouse drag for pan
    this.canvas.addEventListener('mousedown', (e) => {
      this.isDragging = true;
      this.startX = e.clientX;
      this.startY = e.clientY;
      this.startTranslateX = this.translateX;
      this.startTranslateY = this.translateY;
      this.canvas.style.cursor = 'grabbing';
    });

    this.canvas.addEventListener('mousemove', (e) => {
      if (this.isDragging) {
        const deltaX = e.clientX - this.startX;
        const deltaY = e.clientY - this.startY;
        this.translateX = this.startTranslateX + deltaX;
        this.translateY = this.startTranslateY + deltaY;
        this.render();
      }
    });

    this.canvas.addEventListener('mouseup', () => {
      this.isDragging = false;
      this.canvas.style.cursor = 'default';
    });

    this.canvas.addEventListener('mouseleave', () => {
      this.isDragging = false;
      this.canvas.style.cursor = 'default';
    });
  }

  visualize(metadata: ModelMetadata, layout?: LayoutType) {
    this.currentMetadata = metadata;
    if (layout) {
      this.currentLayout = layout;
    }
    
    this.canvas.innerHTML = '';
    
    // Auto-size canvas based on layer count and layout
    const layerCount = metadata.layers.length;
    
    if (this.currentLayout === 'vertical') {
      const minHeight = 600;
      const heightPerLayer = 150;
      const calculatedHeight = Math.max(minHeight, layerCount * heightPerLayer + 100);
      this.canvas.style.height = `${calculatedHeight}px`;
      this.canvas.style.width = '100%';
      this.canvas.style.overflowY = 'auto';
      this.canvas.style.overflowX = 'hidden';
    } else if (this.currentLayout === 'horizontal') {
      // Calculate rows needed (assume ~3 nodes per row based on typical screen width)
      const nodesPerRow = 3;
      const rows = Math.ceil(layerCount / nodesPerRow);
      const heightPerRow = 180;
      const calculatedHeight = Math.max(600, rows * heightPerRow + 100);
      this.canvas.style.height = `${calculatedHeight}px`;
      this.canvas.style.width = '100%';
      this.canvas.style.overflow = 'auto';
    } else if (this.currentLayout === 'circular') {
      // Keep circular layout within bounds
      const radius = Math.min(300, Math.max(200, layerCount * 15));
      const nodeSize = 150;
      const padding = 100;
      const size = (radius * 2) + nodeSize + padding;
      this.canvas.style.height = `${size}px`;
      this.canvas.style.width = '100%';
      this.canvas.style.overflow = 'auto';
    } else if (this.currentLayout === 'tree') {
      const estimatedHeight = 400 + (metadata.layers.length * 10);
      this.canvas.style.height = `${Math.min(estimatedHeight, 1000)}px`;
      this.canvas.style.width = '100%';
      this.canvas.style.overflow = 'auto';
    }
    
    const container = document.createElement('div');
    container.className = 'viz-container';
    container.id = 'viz-container';
    
    // Render based on layout type
    switch (this.currentLayout) {
      case 'vertical':
        this.renderVerticalLayout(container, metadata);
        break;
      case 'horizontal':
        this.renderHorizontalLayout(container, metadata);
        break;
      case 'circular':
        this.renderCircularLayout(container, metadata);
        break;
      case 'tree':
        this.renderTreeLayout(container, metadata);
        break;
    }

    this.canvas.appendChild(container);
    this.render();
  }

  setLayout(layout: LayoutType) {
    if (this.currentMetadata) {
      this.visualize(this.currentMetadata, layout);
    }
  }

  search(term: string) {
    this.searchTerm = term.toLowerCase();
    const nodes = this.canvas.querySelectorAll('.layer-node');
    
    nodes.forEach(node => {
      const layerName = node.querySelector('.layer-name')?.textContent?.toLowerCase() || '';
      const layerType = node.querySelector('.layer-type')?.textContent?.toLowerCase() || '';
      
      if (term === '' || layerName.includes(this.searchTerm) || layerType.includes(this.searchTerm)) {
        node.classList.remove('dimmed');
        if (term !== '') {
          node.classList.add('highlighted');
        } else {
          node.classList.remove('highlighted');
        }
      } else {
        node.classList.add('dimmed');
        node.classList.remove('highlighted');
      }
    });
  }

  private renderVerticalLayout(container: HTMLElement, metadata: ModelMetadata) {
    container.style.padding = '2rem';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.alignItems = 'center';
    container.style.width = '100%';
    
    metadata.layers.forEach((layer, index) => {
      if (index > 0) {
        const connector = this.createConnector('vertical');
        container.appendChild(connector);
      }
      const node = this.createLayerNode(layer, index, metadata);
      container.appendChild(node);
    });
  }

  private renderHorizontalLayout(container: HTMLElement, metadata: ModelMetadata) {
    container.style.display = 'flex';
    container.style.flexDirection = 'row';
    container.style.flexWrap = 'wrap';
    container.style.alignItems = 'center';
    container.style.padding = '2rem';
    container.style.gap = '1.5rem 1rem';
    container.style.width = '100%';
    container.style.justifyContent = 'flex-start';
    
    metadata.layers.forEach((layer, index) => {
      const node = this.createLayerNode(layer, index, metadata);
      node.style.margin = '0';
      node.style.flex = '0 0 auto';
      
      // Add arrow indicator instead of connector line for wrapped layout
      if (index > 0) {
        const arrow = document.createElement('span');
        arrow.className = 'layer-arrow';
        arrow.textContent = '→';
        arrow.style.cssText = `
          color: var(--color-accent);
          font-size: 1.5rem;
          margin: 0 0.5rem;
          opacity: 0.5;
          flex: 0 0 auto;
        `;
        container.appendChild(arrow);
      }
      
      container.appendChild(node);
    });
  }

  private renderCircularLayout(container: HTMLElement, metadata: ModelMetadata) {
    // Keep radius reasonable to fit on screen
    const layerCount = metadata.layers.length;
    const radius = Math.min(300, Math.max(200, layerCount * 15));
    const nodeSize = 150; // Approximate node width/height
    const padding = 100;
    const size = (radius * 2) + nodeSize + padding;
    
    container.style.position = 'relative';
    container.style.width = `${size}px`;
    container.style.height = `${size}px`;
    container.style.margin = '0 auto';
    container.style.minWidth = `${size}px`;
    container.style.minHeight = `${size}px`;
    
    const centerX = size / 2;
    const centerY = size / 2;
    
    metadata.layers.forEach((layer, index) => {
      const angle = (index / metadata.layers.length) * 2 * Math.PI - Math.PI / 2;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      
      const node = this.createLayerNode(layer, index, metadata);
      node.style.position = 'absolute';
      node.style.left = `${x}px`;
      node.style.top = `${y}px`;
      node.style.transform = 'translate(-50%, -50%)';
      node.style.margin = '0';
      
      container.appendChild(node);
      
      // Draw connection to next layer
      if (index < metadata.layers.length - 1) {
        const nextAngle = ((index + 1) / metadata.layers.length) * 2 * Math.PI - Math.PI / 2;
        const nextX = centerX + radius * Math.cos(nextAngle);
        const nextY = centerY + radius * Math.sin(nextAngle);
        
        const line = this.createConnectionLine(x, y, nextX, nextY);
        container.appendChild(line);
      }
    });
  }

  private renderTreeLayout(container: HTMLElement, metadata: ModelMetadata) {
    container.style.padding = '2rem';
    container.style.width = '100%';
    
    // Group layers by type for tree structure
    const layersByType: Record<string, ModelLayer[]> = {};
    metadata.layers.forEach(layer => {
      if (!layersByType[layer.type]) {
        layersByType[layer.type] = [];
      }
      layersByType[layer.type].push(layer);
    });
    
    Object.entries(layersByType).forEach(([type, layers], groupIndex) => {
      const group = document.createElement('div');
      group.className = 'layer-group';
      group.style.marginBottom = '2rem';
      
      const header = document.createElement('div');
      header.className = 'group-header';
      header.textContent = `${type} (${layers.length})`;
      group.appendChild(header);
      
      const layerContainer = document.createElement('div');
      layerContainer.style.display = 'flex';
      layerContainer.style.flexWrap = 'wrap';
      layerContainer.style.gap = '1rem';
      layerContainer.style.marginTop = '1rem';
      
      layers.forEach((layer, index) => {
        const node = this.createLayerNode(layer, index, metadata);
        node.style.flex = '0 0 calc(33.333% - 1rem)';
        node.style.maxWidth = 'none';
        layerContainer.appendChild(node);
      });
      
      group.appendChild(layerContainer);
      container.appendChild(group);
    });
  }

  private createLayerNode(layer: ModelLayer, index: number, metadata: ModelMetadata): HTMLElement {
    const node = document.createElement('div');
    node.className = 'layer-node';
    node.style.animationDelay = `${index * 0.1}s`;
    
    // Size node based on parameter count (relative to max in model)
    const maxParams = Math.max(...metadata.layers.map(l => l.parameters));
    const relativeSize = layer.parameters / maxParams;
    
    // Different sizing for different layouts
    if (this.currentLayout === 'horizontal') {
      const minWidth = 280;
      const maxWidth = 350;
      const width = minWidth + (maxWidth - minWidth) * relativeSize;
      node.style.width = `${width}px`;
      node.style.minWidth = `${width}px`;
      node.style.maxWidth = `${width}px`;
    } else {
      const minWidth = 300;
      const maxWidth = 500;
      const width = minWidth + (maxWidth - minWidth) * relativeSize;
      node.style.maxWidth = `${width}px`;
      node.style.width = '100%';
    }
    
    // Add visual indicator of size
    const sizeBar = document.createElement('div');
    sizeBar.className = 'size-bar';
    sizeBar.style.width = `${relativeSize * 100}%`;
    node.appendChild(sizeBar);

    const name = document.createElement('div');
    name.className = 'layer-name';
    name.textContent = layer.name;

    const type = document.createElement('div');
    type.className = 'layer-type';
    type.textContent = layer.type;

    const params = document.createElement('div');
    params.className = 'layer-params';
    params.textContent = `${this.formatNumber(layer.parameters)} params`;
    
    // Add activation if available
    if (layer.activation) {
      const activation = document.createElement('div');
      activation.className = 'layer-activation';
      activation.textContent = `⚡ ${layer.activation}`;
      node.appendChild(activation);
    }

    node.appendChild(name);
    node.appendChild(type);
    node.appendChild(params);

    // Add tooltip on hover
    node.addEventListener('mouseenter', (e) => {
      this.showTooltip(e, layer);
    });

    node.addEventListener('mouseleave', () => {
      this.hideTooltip();
    });
    
    // Add click to select
    node.addEventListener('click', (e) => {
      // Check if it's a double click for detail view
      if ((e as any).detail === 2) {
        const event = new CustomEvent('layerClick', { 
          detail: layer
        });
        this.canvas.dispatchEvent(event);
        return;
      }
      
      node.classList.toggle('selected');
      
      // Notify parent about selection change
      const selectedLayers = Array.from(this.canvas.querySelectorAll('.layer-node.selected'));
      const event = new CustomEvent('layerSelection', { 
        detail: { 
          count: selectedLayers.length,
          layers: selectedLayers.map(n => {
            const name = n.querySelector('.layer-name')?.textContent || '';
            return metadata.layers.find(l => l.name === name);
          }).filter(Boolean)
        }
      });
      this.canvas.dispatchEvent(event);
    });

    return node;
  }

  private createConnector(direction: 'vertical' | 'horizontal' = 'vertical'): HTMLElement {
    const connector = document.createElement('div');
    connector.className = `layer-connector ${direction}`;
    return connector;
  }

  private createConnectionLine(x1: number, y1: number, x2: number, y2: number): HTMLElement {
    const line = document.createElement('div');
    line.className = 'connection-line';
    
    const length = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    const angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
    
    line.style.position = 'absolute';
    line.style.left = `${x1}px`;
    line.style.top = `${y1}px`;
    line.style.width = `${length}px`;
    line.style.height = '2px';
    line.style.background = 'linear-gradient(90deg, var(--color-accent), transparent)';
    line.style.transformOrigin = '0 0';
    line.style.transform = `rotate(${angle}deg)`;
    line.style.opacity = '0.3';
    
    return line;
  }

  private showTooltip(event: MouseEvent, layer: ModelLayer) {
    const tooltip = document.getElementById('tooltip');
    if (!tooltip) return;

    let content = `
      <strong>${layer.name}</strong><br>
      Type: ${layer.type}<br>
      Parameters: ${this.formatNumber(layer.parameters)}<br>
      Trainable: ${this.formatNumber(layer.trainableParams)}<br>
      Non-trainable: ${this.formatNumber(layer.nonTrainableParams)}
    `;

    if (layer.activation) {
      content += `<br>Activation: ${layer.activation}`;
    }

    if (layer.inputShape) {
      content += `<br>Input Shape: [${layer.inputShape.join(', ')}]`;
    }

    if (layer.outputShape) {
      content += `<br>Output Shape: [${layer.outputShape.join(', ')}]`;
    }

    tooltip.innerHTML = content;
    tooltip.classList.add('visible');
    
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    tooltip.style.left = `${rect.right + 10}px`;
    tooltip.style.top = `${rect.top}px`;
  }

  private hideTooltip() {
    const tooltip = document.getElementById('tooltip');
    if (tooltip) {
      tooltip.classList.remove('visible');
    }
  }

  private formatNumber(num: number): string {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(2)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(2)}K`;
    }
    return num.toString();
  }

  zoom(direction: 'in' | 'out') {
    if (direction === 'in') {
      this.scale = Math.min(2, this.scale + 0.1);
    } else {
      this.scale = Math.max(0.5, this.scale - 0.1);
    }
    this.render();
  }

  reset() {
    this.scale = 1;
    this.translateX = 0;
    this.translateY = 0;
    this.render();
  }

  toggleLabels() {
    this.canvas.classList.toggle('hide-labels');
  }

  toggleParams() {
    this.canvas.classList.toggle('hide-params');
  }

  private render() {
    const container = this.canvas.querySelector('#viz-container') as HTMLElement;
    if (container) {
      container.style.transform = `scale(${this.scale}) translate(${this.translateX / this.scale}px, ${this.translateY / this.scale}px)`;
      container.style.transformOrigin = 'center top';
      container.style.transition = 'transform 0.2s ease';
    }
  }

  async exportAsImage() {
    const container = this.canvas.querySelector('#viz-container') as HTMLElement;
    if (!container) {
      alert('No visualization to export');
      return;
    }
    
    try {
      // Use html2canvas to capture the visualization
      const canvas = await html2canvas(container, {
        backgroundColor: '#0a0e27',
        scale: 2, // Higher quality
        logging: false,
        useCORS: true,
        allowTaint: true,
      });
      
      // Convert to blob and download
      canvas.toBlob((blob) => {
        if (!blob) return;
        
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `lucefact-${this.currentLayout}-${Date.now()}.png`;
        link.href = url;
        link.click();
        
        // Cleanup
        setTimeout(() => URL.revokeObjectURL(url), 100);
      }, 'image/png');
      
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export image. Please try again.');
    }
  }
}
