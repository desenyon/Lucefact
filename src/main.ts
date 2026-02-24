import { ModelParser } from './parser';
import { InsightsGenerator } from './insights';
import { Visualizer } from './visualizer';
import { ModelMetadata, ModelInsights, ModelLayer, HistoryItem, HealthScore } from './types';

class LucefactApp {
  private parser: ModelParser;
  private insightsGenerator: InsightsGenerator;
  private visualizer: Visualizer | null = null;
  private currentMetadata: ModelMetadata | null = null;
  private currentInsights: ModelInsights | null = null;
  private currentView: string = 'dashboard';
  private modelHistory: HistoryItem[] = [];
  private isDarkTheme: boolean = true;

  constructor() {
    this.parser = new ModelParser();
    this.insightsGenerator = new InsightsGenerator();
    this.loadHistory();
    this.init();
  }

  private init() {
    this.setupUploadHandlers();
    this.setupNavigationHandlers();
    this.setupKeyboardShortcuts();
    this.setupThemeToggle();
    this.setupModals();
    this.setupVisualizerToolbar();
    this.setupSearchHandlers();
    this.setupExportHandlers();
    this.setupDragAndDrop();
    this.setupSettings();
    this.initVisualizer();
    this.renderHistory();
    this.loadSettings();
    this.updateAboutStats();
  }

  // ==================== UPLOAD HANDLERS ====================
  private setupUploadHandlers() {
    const uploadBtn = document.getElementById('upload-btn');
    const fileInput = document.getElementById('file-input') as HTMLInputElement;
    const uploadZone = document.getElementById('upload-zone');
    const loadSample = document.getElementById('load-sample');

    uploadBtn?.addEventListener('click', () => fileInput?.click());
    uploadZone?.addEventListener('click', () => fileInput?.click());

    fileInput?.addEventListener('change', async (e) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];
      if (file) {
        await this.handleFileUpload(file);
      }
      target.value = ''; // Reset for re-upload
    });

    loadSample?.addEventListener('click', () => this.loadSampleModel());
  }

  private setupDragAndDrop() {
    const uploadZone = document.getElementById('upload-zone');
    if (!uploadZone) return;

    ['dragenter', 'dragover'].forEach(event => {
      uploadZone.addEventListener(event, (e) => {
        e.preventDefault();
        uploadZone.classList.add('drag-over');
      });
    });

    ['dragleave', 'drop'].forEach(event => {
      uploadZone.addEventListener(event, (e) => {
        e.preventDefault();
        uploadZone.classList.remove('drag-over');
      });
    });

    uploadZone.addEventListener('drop', async (e) => {
      const files = (e as DragEvent).dataTransfer?.files;
      if (files && files.length > 0) {
        await this.handleFileUpload(files[0]);
      }
    });

    // Also handle drop on window
    document.body.addEventListener('dragover', (e) => e.preventDefault());
    document.body.addEventListener('drop', async (e) => {
      e.preventDefault();
      const files = (e as DragEvent).dataTransfer?.files;
      if (files && files.length > 0) {
        await this.handleFileUpload(files[0]);
      }
    });
  }

  private async handleFileUpload(file: File) {
    this.showLoading(true, 'Processing model file...');

    try {
      const result = await this.parser.parseFile(file);

      if (!result.success || !result.metadata) {
        this.showToast('error', result.error || 'Failed to parse model file');
        return;
      }

      this.currentMetadata = result.metadata;
      this.currentInsights = this.insightsGenerator.generateInsights(result.metadata);

      // Add to history
      this.addToHistory(result.metadata);

      // Update usage stats
      this.updateUsageStats(result.metadata.totalParameters);

      // Update all UI sections
      this.updateModelStatus(true, result.metadata.fileName);
      this.hideWelcomeState();
      this.updateDashboard(result.metadata, this.currentInsights);
      this.updateVisualization(result.metadata);
      this.updateAnalytics(result.metadata, this.currentInsights);
      this.updateLayersTable(result.metadata);
      this.updateExtractionView(result.metadata);

      this.showToast('success', `Model "${result.metadata.fileName}" loaded successfully`);

    } catch (error) {
      this.showToast('error', `Error processing file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      this.showLoading(false);
    }
  }

  private async loadSampleModel() {
    // Create a sample model for demonstration with full metadata
    const sampleMetadata: ModelMetadata = {
      framework: 'PyTorch',
      fileName: 'sample_resnet18.pth',
      fileSize: 44698880,
      format: 'PyTorch StateDict',
      totalLayers: 21,
      totalParameters: 11689512,
      trainableParameters: 11689512,
      nonTrainableParameters: 0,
      inputShape: [1, 3, 224, 224],
      outputShape: [1, 1000],
      architecture: {
        type: 'ResNet',
        variant: 'ResNet-18',
        backbone: 'Residual Blocks',
        head: 'Linear Classifier'
      },
      training: {
        optimizer: {
          type: 'SGD with Momentum',
          learningRate: 0.1,
          momentum: 0.9,
          weightDecay: 0.0001
        },
        scheduler: {
          type: 'StepLR',
          stepSize: 30,
          gamma: 0.1
        },
        epochs: 90,
        batchSize: 256,
        loss: 'Cross-Entropy',
        device: 'CUDA (8x V100)'
      },
      preprocessing: {
        normalization: {
          mean: [0.485, 0.456, 0.406],
          std: [0.229, 0.224, 0.225],
          type: 'ImageNet'
        },
        resize: { width: 256, height: 256, mode: 'bilinear' },
        augmentations: ['RandomResizedCrop(224)', 'RandomHorizontalFlip', 'ColorJitter', 'Normalize'],
        colorSpace: 'RGB',
        inputRange: [0, 1],
        channelOrder: 'CHW'
      },
      datasetInference: {
        possibleDatasets: ['ImageNet-1K', 'ImageNet-21K'],
        inputType: 'RGB Image (224×224)',
        taskType: 'Multi-class Classification',
        numClasses: 1000,
        classLabels: ['tench', 'goldfish', 'great white shark', 'tiger shark', 'hammerhead',
          'electric ray', 'stingray', 'cock', 'hen', 'ostrich', 'brambling', 'goldfinch',
          'house finch', 'junco', 'indigo bunting', 'American robin', 'bulbul', 'jay', 'magpie', 'chickadee'],
        estimatedDatasetSize: '~1.28M images'
      },
      layers: [
        { name: 'conv1', type: 'Conv2d', parameters: 9408, trainableParams: 9408, nonTrainableParams: 0, inputShape: [3, 224, 224], outputShape: [64, 112, 112], activation: 'relu', kernelSize: [7, 7], stride: [2, 2], padding: [3, 3] },
        { name: 'bn1', type: 'BatchNorm2d', parameters: 128, trainableParams: 128, nonTrainableParams: 0, outputShape: [64, 112, 112] },
        { name: 'maxpool', type: 'MaxPool2d', parameters: 0, trainableParams: 0, nonTrainableParams: 0, outputShape: [64, 56, 56], kernelSize: [3, 3], stride: [2, 2] },
        { name: 'layer1.0.conv1', type: 'Conv2d', parameters: 36864, trainableParams: 36864, nonTrainableParams: 0, activation: 'relu', kernelSize: [3, 3] },
        { name: 'layer1.0.conv2', type: 'Conv2d', parameters: 36864, trainableParams: 36864, nonTrainableParams: 0, kernelSize: [3, 3] },
        { name: 'layer1.1.conv1', type: 'Conv2d', parameters: 36864, trainableParams: 36864, nonTrainableParams: 0, activation: 'relu', kernelSize: [3, 3] },
        { name: 'layer1.1.conv2', type: 'Conv2d', parameters: 36864, trainableParams: 36864, nonTrainableParams: 0, kernelSize: [3, 3] },
        { name: 'layer2.0.conv1', type: 'Conv2d', parameters: 73728, trainableParams: 73728, nonTrainableParams: 0, activation: 'relu', stride: [2, 2] },
        { name: 'layer2.0.conv2', type: 'Conv2d', parameters: 147456, trainableParams: 147456, nonTrainableParams: 0 },
        { name: 'layer2.0.downsample', type: 'Conv2d', parameters: 8192, trainableParams: 8192, nonTrainableParams: 0, kernelSize: [1, 1] },
        { name: 'layer2.1.conv1', type: 'Conv2d', parameters: 147456, trainableParams: 147456, nonTrainableParams: 0, activation: 'relu' },
        { name: 'layer2.1.conv2', type: 'Conv2d', parameters: 147456, trainableParams: 147456, nonTrainableParams: 0 },
        { name: 'layer3.0.conv1', type: 'Conv2d', parameters: 294912, trainableParams: 294912, nonTrainableParams: 0, activation: 'relu', stride: [2, 2] },
        { name: 'layer3.0.conv2', type: 'Conv2d', parameters: 589824, trainableParams: 589824, nonTrainableParams: 0 },
        { name: 'layer3.0.downsample', type: 'Conv2d', parameters: 32768, trainableParams: 32768, nonTrainableParams: 0, kernelSize: [1, 1] },
        { name: 'layer3.1.conv1', type: 'Conv2d', parameters: 589824, trainableParams: 589824, nonTrainableParams: 0, activation: 'relu' },
        { name: 'layer3.1.conv2', type: 'Conv2d', parameters: 589824, trainableParams: 589824, nonTrainableParams: 0 },
        { name: 'layer4.0.conv1', type: 'Conv2d', parameters: 1179648, trainableParams: 1179648, nonTrainableParams: 0, activation: 'relu', stride: [2, 2] },
        { name: 'layer4.0.conv2', type: 'Conv2d', parameters: 2359296, trainableParams: 2359296, nonTrainableParams: 0 },
        { name: 'layer4.0.downsample', type: 'Conv2d', parameters: 131072, trainableParams: 131072, nonTrainableParams: 0, kernelSize: [1, 1] },
        { name: 'layer4.1.conv1', type: 'Conv2d', parameters: 2359296, trainableParams: 2359296, nonTrainableParams: 0, activation: 'relu' },
        { name: 'avgpool', type: 'AdaptiveAvgPool2d', parameters: 0, trainableParams: 0, nonTrainableParams: 0, outputShape: [512, 1, 1] },
        { name: 'fc', type: 'Linear', parameters: 513000, trainableParams: 513000, nonTrainableParams: 0, inputShape: [512], outputShape: [1000] },
      ]
    };

    this.currentMetadata = sampleMetadata;
    this.currentInsights = this.insightsGenerator.generateInsights(sampleMetadata);

    this.addToHistory(sampleMetadata);
    this.updateUsageStats(sampleMetadata.totalParameters);
    this.updateModelStatus(true, sampleMetadata.fileName);
    this.hideWelcomeState();
    this.updateDashboard(sampleMetadata, this.currentInsights);
    this.updateVisualization(sampleMetadata);
    this.updateAnalytics(sampleMetadata, this.currentInsights);
    this.updateLayersTable(sampleMetadata);
    this.updateExtractionView(sampleMetadata);

    this.showToast('success', 'Sample ResNet-18 model loaded');
  }

  // ==================== NAVIGATION ====================
  private setupNavigationHandlers() {
    const navItems = document.querySelectorAll('.nav-link[data-view]');
    navItems.forEach(item => {
      item.addEventListener('click', () => {
        const view = item.getAttribute('data-view');
        if (view) this.switchView(view);
      });
    });
  }

  private switchView(viewName: string) {
    // Update nav items
    document.querySelectorAll('.nav-link[data-view]').forEach(item => {
      item.classList.toggle('active', item.getAttribute('data-view') === viewName);
    });

    // Update view containers
    document.querySelectorAll('.view-container').forEach(container => {
      container.classList.toggle('active', container.id === `view-${viewName}`);
    });

    // Update breadcrumb
    const viewNames: Record<string, string> = {
      dashboard: 'Dashboard',
      visualizer: 'Architecture',
      analytics: 'Analytics',
      layers: 'Layer Explorer',
      extraction: 'Model Data',
      settings: 'Settings'
    };
    const breadcrumb = document.getElementById('current-view-name');
    if (breadcrumb) {
      breadcrumb.textContent = viewNames[viewName] || viewName;
    }

    this.currentView = viewName;
  }

  // ==================== KEYBOARD SHORTCUTS ====================
  private setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const cmdKey = isMac ? e.metaKey : e.ctrlKey;

      // Upload: Cmd/Ctrl + U
      if (cmdKey && e.key === 'u') {
        e.preventDefault();
        document.getElementById('file-input')?.click();
      }

      // Search: Cmd/Ctrl + K
      if (cmdKey && e.key === 'k') {
        e.preventDefault();
        document.getElementById('global-search')?.focus();
      }

      // Theme toggle: Cmd/Ctrl + T (when not typing)
      if (cmdKey && e.key === 't' && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        this.toggleTheme();
      }

      // Export PNG: Cmd/Ctrl + E
      if (cmdKey && e.key === 'e') {
        e.preventDefault();
        this.visualizer?.exportAsImage();
      }

      // Export JSON: Cmd/Ctrl + S
      if (cmdKey && e.key === 's') {
        e.preventDefault();
        this.exportAnalysisJSON();
      }

      // Navigation shortcuts (1-6)
      if (!cmdKey && ['1', '2', '3', '4', '5', '6'].includes(e.key) && document.activeElement?.tagName !== 'INPUT') {
        const views = ['dashboard', 'visualizer', 'analytics', 'layers', 'extraction', 'settings'];
        const index = parseInt(e.key) - 1;
        if (views[index]) this.switchView(views[index]);
      }

      // Help: ?
      if (e.key === '?' && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        this.showModal('shortcuts-modal');
      }

      // Visualizer shortcuts
      if (this.currentView === 'visualizer' && document.activeElement?.tagName !== 'INPUT') {
        if (e.key === '+' || e.key === '=') this.visualizer?.zoom('in');
        if (e.key === '-') this.visualizer?.zoom('out');
        if (e.key === '0') this.visualizer?.reset();
        if (e.key === 'm') this.toggleMinimap();
      }

      // Escape: Close modals
      if (e.key === 'Escape') {
        document.querySelectorAll('.modal').forEach(modal => {
          (modal as HTMLElement).style.display = 'none';
        });
      }
    });
  }

  // ==================== THEME ====================
  private setupThemeToggle() {
    const themeToggle = document.getElementById('theme-toggle');
    themeToggle?.addEventListener('click', () => this.toggleTheme());

    // Load saved theme
    const savedTheme = localStorage.getItem('lucefact-theme');
    if (savedTheme) {
      this.isDarkTheme = savedTheme === 'dark';
      document.documentElement.setAttribute('data-theme', savedTheme);
    }
  }

  private toggleTheme() {
    this.isDarkTheme = !this.isDarkTheme;
    const theme = this.isDarkTheme ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('lucefact-theme', theme);
    this.showToast('info', `Switched to ${theme} theme`);
  }

  // ==================== MODALS ====================
  private setupModals() {
    // Help/shortcuts modal
    document.getElementById('help-btn')?.addEventListener('click', () => {
      this.showModal('shortcuts-modal');
    });

    document.getElementById('close-shortcuts')?.addEventListener('click', () => {
      this.hideModal('shortcuts-modal');
    });

    document.getElementById('close-comparison')?.addEventListener('click', () => {
      this.hideModal('comparison-modal');
    });

    // Close modals on overlay click
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', () => {
        const modal = overlay.closest('.modal') as HTMLElement;
        if (modal) modal.style.display = 'none';
      });
    });
  }

  private showModal(modalId: string) {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = 'flex';
  }

  private hideModal(modalId: string) {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = 'none';
  }

  // ==================== VISUALIZER TOOLBAR ====================
  private setupVisualizerToolbar() {
    // Layout buttons
    const layouts = ['vertical', 'horizontal', 'radial', 'force'];
    layouts.forEach(layout => {
      document.getElementById(`layout-${layout}`)?.addEventListener('click', () => {
        this.setLayout(layout as any);
      });
    });

    // Zoom controls
    document.getElementById('zoom-in')?.addEventListener('click', () => this.visualizer?.zoom('in'));
    document.getElementById('zoom-out')?.addEventListener('click', () => this.visualizer?.zoom('out'));
    document.getElementById('zoom-fit')?.addEventListener('click', () => this.visualizer?.reset());

    // View toggles
    document.getElementById('toggle-minimap')?.addEventListener('click', () => this.toggleMinimap());
    document.getElementById('toggle-labels')?.addEventListener('click', () => this.visualizer?.toggleLabels());
    document.getElementById('toggle-params')?.addEventListener('click', () => this.visualizer?.toggleParams());

    // Layer search
    document.getElementById('layer-search')?.addEventListener('input', (e) => {
      const term = (e.target as HTMLInputElement).value;
      this.visualizer?.search(term);
    });

    // Layer detail close
    document.getElementById('close-detail')?.addEventListener('click', () => {
      const panel = document.getElementById('layer-detail-panel');
      if (panel) panel.style.display = 'none';
    });
  }

  private setLayout(layout: 'vertical' | 'horizontal' | 'radial' | 'force') {
    // Map new layout names to old ones
    const layoutMap: Record<string, any> = {
      'vertical': 'vertical',
      'horizontal': 'horizontal',
      'radial': 'circular',
      'force': 'tree'
    };

    this.visualizer?.setLayout(layoutMap[layout]);

    // Update active button
    ['vertical', 'horizontal', 'radial', 'force'].forEach(l => {
      document.getElementById(`layout-${l}`)?.classList.toggle('active', l === layout);
    });
  }

  private toggleMinimap() {
    const minimap = document.getElementById('minimap');
    const btn = document.getElementById('toggle-minimap');
    if (minimap) {
      const isVisible = minimap.style.display !== 'none';
      minimap.style.display = isVisible ? 'none' : 'block';
      btn?.classList.toggle('active', !isVisible);
    }
  }

  // ==================== SEARCH ====================
  private setupSearchHandlers() {
    const globalSearch = document.getElementById('global-search') as HTMLInputElement;
    globalSearch?.addEventListener('input', (e) => {
      const term = (e.target as HTMLInputElement).value.toLowerCase();
      if (term && this.currentMetadata) {
        // Switch to layer explorer and filter
        this.switchView('layers');
        this.filterLayersTable(term);
      }
    });

    const layersSearch = document.getElementById('layers-search') as HTMLInputElement;
    layersSearch?.addEventListener('input', (e) => {
      const term = (e.target as HTMLInputElement).value.toLowerCase();
      this.filterLayersTable(term);
    });

    const layersSort = document.getElementById('layers-sort') as HTMLSelectElement;
    layersSort?.addEventListener('change', () => {
      if (this.currentMetadata) {
        this.updateLayersTable(this.currentMetadata);
      }
    });
  }

  private filterLayersTable(term: string) {
    const tbody = document.getElementById('layers-tbody');
    if (!tbody) return;

    const rows = tbody.querySelectorAll('tr:not(.empty-row)');
    rows.forEach(row => {
      const text = row.textContent?.toLowerCase() || '';
      (row as HTMLElement).style.display = text.includes(term) ? '' : 'none';
    });
  }

  // ==================== EXPORT ====================
  private setupExportHandlers() {
    document.getElementById('export-png')?.addEventListener('click', () => {
      this.visualizer?.exportAsImage();
    });

    document.getElementById('export-json')?.addEventListener('click', () => {
      this.exportAnalysisJSON();
    });

    document.getElementById('export-svg')?.addEventListener('click', () => {
      this.exportAsSVG();
    });

    document.getElementById('share-link')?.addEventListener('click', () => {
      this.copyShareLink();
    });

    document.getElementById('copy-info')?.addEventListener('click', () => {
      this.copyModelInfo();
    });
  }

  private exportAnalysisJSON() {
    if (!this.currentMetadata || !this.currentInsights) {
      this.showToast('warning', 'No model loaded to export');
      return;
    }

    const exportData = {
      metadata: this.currentMetadata,
      insights: this.currentInsights,
      exportDate: new Date().toISOString(),
      version: '1.0.0',
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `lucefact-${this.currentMetadata.fileName.replace(/\.[^.]+$/, '')}.json`;
    link.click();

    this.showToast('success', 'JSON exported successfully');
  }

  private exportAsSVG() {
    this.showToast('info', 'SVG export coming soon');
  }

  private copyShareLink() {
    // For now, just copy current URL
    navigator.clipboard.writeText(window.location.href);
    this.showToast('success', 'Link copied to clipboard');
  }

  private copyModelInfo() {
    if (!this.currentMetadata) {
      this.showToast('warning', 'No model loaded');
      return;
    }

    const info = `
Model: ${this.currentMetadata.fileName}
Framework: ${this.currentMetadata.framework}
Layers: ${this.currentMetadata.totalLayers}
Parameters: ${this.formatNumber(this.currentMetadata.totalParameters)}
Trainable: ${this.formatNumber(this.currentMetadata.trainableParameters)}
Size: ${(this.currentMetadata.fileSize / (1024 * 1024)).toFixed(2)} MB
    `.trim();

    navigator.clipboard.writeText(info);
    this.showToast('success', 'Model info copied to clipboard');
  }

  // ==================== HISTORY ====================
  private loadHistory() {
    const saved = localStorage.getItem('lucefact-history');
    if (saved) {
      try {
        this.modelHistory = JSON.parse(saved);
      } catch {
        this.modelHistory = [];
      }
    }
  }

  private saveHistory() {
    localStorage.setItem('lucefact-history', JSON.stringify(this.modelHistory.slice(0, 10)));
  }

  private addToHistory(metadata: ModelMetadata) {
    const item: HistoryItem = {
      fileName: metadata.fileName,
      framework: metadata.framework,
      timestamp: Date.now(),
      layers: metadata.totalLayers,
      params: metadata.totalParameters
    };

    // Remove duplicate if exists
    this.modelHistory = this.modelHistory.filter(h => h.fileName !== item.fileName);
    this.modelHistory.unshift(item);
    this.modelHistory = this.modelHistory.slice(0, 10);

    this.saveHistory();
    this.renderHistory();
  }

  private renderHistory() {
    const container = document.getElementById('history-list');
    if (!container) return;

    if (this.modelHistory.length === 0) {
      container.innerHTML = '<div class="history-empty">No recent models</div>';
      return;
    }

    container.innerHTML = this.modelHistory.map(item => `
      <div class="history-item" data-filename="${item.fileName}">
        <svg class="history-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
          <path d="M14 2v6h6"/>
        </svg>
        <span class="history-name">${item.fileName}</span>
        <span class="history-time">${this.formatTime(item.timestamp)}</span>
      </div>
    `).join('');
  }

  private formatTime(timestamp: number): string {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  }

  // ==================== UI UPDATES ====================
  private initVisualizer() {
    const vizCanvas = document.getElementById('viz-canvas');
    if (vizCanvas) {
      this.visualizer = new Visualizer(vizCanvas);

      vizCanvas.addEventListener('layerSelection', ((e: CustomEvent) => {
        this.handleLayerSelection(e.detail);
      }) as EventListener);

      vizCanvas.addEventListener('layerClick', ((e: CustomEvent) => {
        this.showLayerDetail(e.detail);
      }) as EventListener);
    }
  }

  private updateModelStatus(loaded: boolean, fileName?: string) {
    const status = document.getElementById('model-status');
    if (!status) return;

    const indicator = status.querySelector('.status-indicator');
    const text = status.querySelector('.status-text');

    indicator?.classList.toggle('online', loaded);
    indicator?.classList.toggle('offline', !loaded);

    if (text) {
      text.textContent = loaded && fileName ? fileName : 'No Model';
    }
  }

  private hideWelcomeState() {
    const welcomeState = document.getElementById('welcome-state');
    const dashboardContent = document.getElementById('dashboard-content');

    if (welcomeState) welcomeState.style.display = 'none';
    if (dashboardContent) dashboardContent.style.display = 'block';
  }

  private updateDashboard(metadata: ModelMetadata, insights: ModelInsights) {
    // Health Score
    const healthScore = this.calculateHealthScore(metadata, insights);
    this.updateHealthScore(healthScore);

    // Quick Stats
    document.getElementById('stat-layers')!.textContent = metadata.totalLayers.toString();
    document.getElementById('stat-params')!.textContent = this.formatNumber(metadata.totalParameters);
    document.getElementById('stat-memory')!.textContent = this.formatBytes(metadata.totalParameters * 4);
    document.getElementById('stat-trainable')!.textContent =
      `${((metadata.trainableParameters / metadata.totalParameters) * 100).toFixed(0)}%`;

    // Model Info
    document.getElementById('info-name')!.textContent = metadata.fileName;
    document.getElementById('info-framework')!.textContent = metadata.framework;
    document.getElementById('info-format')!.textContent = metadata.format;
    document.getElementById('info-size')!.textContent = this.formatBytes(metadata.fileSize);
    document.getElementById('info-input')!.textContent =
      metadata.inputShape ? `[${metadata.inputShape.join(', ')}]` : 'Unknown';
    document.getElementById('info-output')!.textContent =
      metadata.outputShape ? `[${metadata.outputShape.join(', ')}]` : 'Unknown';

    // Layer Distribution
    this.renderDistributionChart(insights.distribution.layerTypes);

    // Issues
    this.renderIssues(insights.issues);
  }

  private calculateHealthScore(metadata: ModelMetadata, insights: ModelInsights): HealthScore {
    let score = 100;
    const issues: string[] = [];

    // Efficiency score (trainable ratio)
    const trainableRatio = metadata.trainableParameters / metadata.totalParameters;
    const efficiency = Math.round(trainableRatio * 100);

    // Complexity score
    const complexityScore = Math.min(100, (metadata.totalLayers * 2) + (metadata.totalParameters / 1000000));
    const complexity = Math.round(complexityScore);

    // Optimization opportunities
    let optimization = 85;

    // Check for issues
    if (insights.issues.length > 1) {
      score -= insights.issues.length * 5;
      optimization -= insights.issues.length * 3;
    }

    // Very large models
    if (metadata.totalParameters > 100000000) {
      score -= 10;
      issues.push('Very large model');
    }

    // No trainable params
    if (metadata.trainableParameters === 0) {
      score -= 15;
      optimization -= 20;
    }

    return {
      overall: Math.max(0, Math.min(100, score)),
      efficiency,
      complexity: Math.min(100, complexity),
      optimization: Math.max(0, Math.min(100, optimization))
    };
  }

  private updateHealthScore(score: HealthScore) {
    // Update ring - use querySelector for SVG element
    const ring = document.querySelector('#health-ring') as SVGCircleElement | null;
    if (ring) {
      const circumference = 339.292;
      const offset = circumference - (score.overall / 100) * circumference;
      ring.style.strokeDashoffset = offset.toString();
    }

    // Update score value - be more specific with selector
    const scoreValue = document.getElementById('health-score') || document.querySelector('.score-value');
    if (scoreValue) scoreValue.textContent = score.overall.toString();

    // Update health trend badge using threshold setting
    const threshold = this.settings.healthThreshold;
    const healthTrend = document.getElementById('health-trend');
    if (healthTrend) {
      const badge = healthTrend.querySelector('span');
      if (badge) {
        if (score.overall >= threshold + 10) {
          badge.textContent = 'Excellent';
          healthTrend.className = 'card-badge success';
        } else if (score.overall >= threshold) {
          badge.textContent = 'Good';
          healthTrend.className = 'card-badge';
        } else {
          badge.textContent = 'Needs Review';
          healthTrend.className = 'card-badge warning';
        }
      }
    }

    // Update metrics
    const metrics = [
      { id: 'efficiency', value: score.efficiency },
      { id: 'complexity', value: score.complexity },
      { id: 'optimization', value: score.optimization }
    ];

    metrics.forEach(({ id, value }) => {
      const bar = document.getElementById(`${id}-bar`);
      const val = document.getElementById(`${id}-value`);
      if (bar) bar.style.width = `${value}%`;
      if (val) val.textContent = id === 'complexity' ? value.toString() : `${value}%`;
    });
  }

  private renderDistributionChart(layerTypes: Record<string, number>) {
    const container = document.getElementById('distribution-chart');
    if (!container) return;

    const total = Object.values(layerTypes).reduce((a, b) => a + b, 0);
    const sorted = Object.entries(layerTypes).sort((a, b) => b[1] - a[1]);

    container.innerHTML = `
      <div class="dist-bar-container">
        ${sorted.map(([type, count]) => {
      const percentage = (count / total) * 100;
      return `
            <div class="dist-bar-item">
              <span class="dist-bar-label">${type}</span>
              <div class="dist-bar-track">
                <div class="dist-bar-fill" style="width: ${percentage}%">
                  <span class="dist-bar-value">${percentage.toFixed(0)}%</span>
                </div>
              </div>
              <span class="dist-bar-count">${count}</span>
            </div>
          `;
    }).join('')}
      </div>
    `;
  }

  private renderIssues(issues: string[]) {
    const container = document.getElementById('issues-list');
    const countEl = document.getElementById('issue-count');

    if (countEl) countEl.textContent = `${issues.length} items`;

    if (!container) return;

    if (issues.length === 0 || (issues.length === 1 && issues[0].includes('No significant'))) {
      container.innerHTML = `
        <div class="issue-item success">
          <svg class="issue-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
            <path d="M22 4L12 14.01l-3-3"/>
          </svg>
          <div class="issue-content">
            <div class="issue-title">All Clear</div>
            <div class="issue-desc">No significant issues detected in this model</div>
          </div>
        </div>
      `;
      return;
    }

    container.innerHTML = issues.map(issue => {
      const isWarning = issue.includes('High') || issue.includes('Very large') || issue.includes('Highly');
      const isError = issue.includes('no trainable') || issue.includes('No layers');
      const type = isError ? 'error' : isWarning ? 'warning' : 'info';
      const icon = type === 'error'
        ? '<path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><path d="M12 9v4"/><path d="M12 17h.01"/>'
        : '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>';

      return `
        <div class="issue-item ${type}">
          <svg class="issue-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            ${icon}
          </svg>
          <div class="issue-content">
            <div class="issue-title">${type === 'error' ? 'Error' : type === 'warning' ? 'Warning' : 'Info'}</div>
            <div class="issue-desc">${issue}</div>
          </div>
        </div>
      `;
    }).join('');
  }

  private updateVisualization(metadata: ModelMetadata) {
    if (this.visualizer) {
      this.visualizer.visualize(metadata);
    }
  }

  private updateAnalytics(metadata: ModelMetadata, insights: ModelInsights) {
    // Parameter Distribution Chart
    const paramDistChart = document.getElementById('param-dist-chart');
    if (paramDistChart) {
      const topLayers = [...metadata.layers]
        .sort((a, b) => b.parameters - a.parameters)
        .slice(0, 10);

      const maxParams = Math.max(...topLayers.map(l => l.parameters));

      paramDistChart.innerHTML = `
        <div class="dist-bar-container">
          ${topLayers.map(layer => {
        const percentage = (layer.parameters / maxParams) * 100;
        return `
              <div class="dist-bar-item">
                <span class="dist-bar-label">${layer.name}</span>
                <div class="dist-bar-track">
                  <div class="dist-bar-fill" style="width: ${percentage}%"></div>
                </div>
                <span class="dist-bar-count">${this.formatNumber(layer.parameters)}</span>
              </div>
            `;
      }).join('')}
        </div>
      `;
    }

    // Layer Type Chart
    const layerTypeChart = document.getElementById('layer-type-chart');
    if (layerTypeChart) {
      const types = Object.entries(insights.distribution.layerTypes);
      layerTypeChart.innerHTML = `
        <div class="dist-bar-container">
          ${types.map(([type, count]) => `
            <div class="dist-bar-item">
              <span class="dist-bar-label">${type}</span>
              <div class="dist-bar-track">
                <div class="dist-bar-fill" style="width: ${(count / metadata.totalLayers) * 100}%"></div>
              </div>
              <span class="dist-bar-count">${count}</span>
            </div>
          `).join('')}
        </div>
      `;
    }

    // Memory Analysis - use precision setting
    const bytesPerParam = this.getBytesPerParam();
    const weightsMemory = metadata.totalParameters * bytesPerParam;
    const activationsMemory = metadata.totalParameters * Math.ceil(bytesPerParam / 2); // Estimate
    const gradientsMemory = metadata.trainableParameters * bytesPerParam;
    const totalMemory = weightsMemory + activationsMemory + gradientsMemory;

    const memWeights = document.getElementById('mem-weights');
    const memActivations = document.getElementById('mem-activations');
    const memGradients = document.getElementById('mem-gradients');
    const memTotal = document.getElementById('mem-total');

    if (memWeights) memWeights.textContent = this.formatBytes(weightsMemory);
    if (memActivations) memActivations.textContent = this.formatBytes(activationsMemory);
    if (memGradients) memGradients.textContent = this.formatBytes(gradientsMemory);
    if (memTotal) memTotal.textContent = this.formatBytes(totalMemory);

    // Computational Cost
    const flops = this.estimateFLOPs(metadata);
    const flopsEl = document.getElementById('flops-estimate');
    const inferenceEl = document.getElementById('inference-time');

    if (flopsEl) flopsEl.textContent = this.formatNumber(flops);
    if (inferenceEl) inferenceEl.textContent = `~${Math.max(1, Math.round(flops / 1e9 * 0.5))}ms`;

    // Heavy Layers
    const heavyLayers = document.getElementById('heavy-layers');
    if (heavyLayers) {
      const top5 = [...metadata.layers]
        .sort((a, b) => b.parameters - a.parameters)
        .slice(0, 5);

      heavyLayers.innerHTML = top5.map((layer, i) => `
        <div class="heavy-layer-item">
          <span class="heavy-layer-rank">#${i + 1}</span>
          <div class="heavy-layer-info">
            <div class="heavy-layer-name">${layer.name}</div>
            <div class="heavy-layer-type">${layer.type}</div>
          </div>
          <span class="heavy-layer-params">${this.formatNumber(layer.parameters)}</span>
        </div>
      `).join('');
    }
  }

  private estimateFLOPs(metadata: ModelMetadata): number {
    let flops = 0;

    for (const layer of metadata.layers) {
      const type = layer.type.toLowerCase();

      if (type.includes('conv')) {
        // Conv2d: 2 * Cin * Cout * K * K * Hout * Wout
        // Approximate from params: params ≈ Cin * Cout * K * K
        const outputSize = layer.outputShape ?
          layer.outputShape.reduce((a, b) => a * b, 1) : 1000;
        flops += layer.parameters * 2 * Math.sqrt(outputSize);
      } else if (type.includes('linear') || type.includes('dense')) {
        // Linear: 2 * in_features * out_features
        flops += layer.parameters * 2;
      } else if (type.includes('bn') || type.includes('batchnorm')) {
        // BatchNorm: ~4 * features
        flops += layer.parameters * 4;
      } else if (type.includes('attention') || type.includes('transformer')) {
        // Attention: ~4 * seq_len^2 * d_model
        flops += layer.parameters * 4;
      } else {
        // Generic: assume 2 ops per param
        flops += layer.parameters * 2;
      }
    }

    return Math.round(flops);
  }

  private updateLayersTable(metadata: ModelMetadata) {
    const tbody = document.getElementById('layers-tbody');
    if (!tbody) return;

    const sortBy = (document.getElementById('layers-sort') as HTMLSelectElement)?.value || 'index';

    let layers = [...metadata.layers];

    switch (sortBy) {
      case 'name':
        layers.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'type':
        layers.sort((a, b) => a.type.localeCompare(b.type));
        break;
      case 'params':
        layers.sort((a, b) => b.parameters - a.parameters);
        break;
    }

    tbody.innerHTML = layers.map((layer, i) => `
      <tr>
        <td>${i + 1}</td>
        <td class="layer-name-cell">${layer.name}</td>
        <td class="layer-type-cell">${layer.type}</td>
        <td>${this.formatNumber(layer.parameters)}</td>
        <td>${this.formatNumber(layer.trainableParams)}</td>
        <td>${layer.inputShape ? `[${layer.inputShape.join(', ')}]` : '-'}</td>
        <td>${layer.outputShape ? `[${layer.outputShape.join(', ')}]` : '-'}</td>
        <td>${layer.activation || '-'}</td>
      </tr>
    `).join('');
  }

  private handleLayerSelection(detail: { count: number; layers: ModelLayer[] }) {
    if (detail.count >= 2 && detail.count <= 3) {
      this.showModal('comparison-modal');
      this.renderComparison(detail.layers);
    } else if (detail.count > 3) {
      this.showToast('warning', 'Select up to 3 layers to compare');
    } else {
      this.hideModal('comparison-modal');
    }
  }

  private renderComparison(layers: ModelLayer[]) {
    const content = document.getElementById('comparison-content');
    if (!content) return;

    const properties = [
      { key: 'type', label: 'Type' },
      { key: 'parameters', label: 'Parameters', format: this.formatNumber.bind(this) },
      { key: 'trainableParams', label: 'Trainable', format: this.formatNumber.bind(this) },
      { key: 'activation', label: 'Activation' },
      { key: 'inputShape', label: 'Input Shape', format: (v: any) => v ? `[${v.join(', ')}]` : '-' },
      { key: 'outputShape', label: 'Output Shape', format: (v: any) => v ? `[${v.join(', ')}]` : '-' }
    ];

    let html = '<div class="comparison-grid">';

    // Header
    html += '<div class="comparison-row header">';
    html += '<div class="comparison-cell">Property</div>';
    layers.forEach(layer => {
      html += `<div class="comparison-cell">${layer.name}</div>`;
    });
    html += '</div>';

    // Rows
    properties.forEach(prop => {
      html += '<div class="comparison-row">';
      html += `<div class="comparison-cell">${prop.label}</div>`;
      layers.forEach(layer => {
        const value = (layer as any)[prop.key];
        html += `<div class="comparison-cell">${prop.format ? prop.format(value) : value || '-'}</div>`;
      });
      html += '</div>';
    });

    html += '</div>';
    content.innerHTML = html;
  }

  private showLayerDetail(layer: ModelLayer) {
    const panel = document.getElementById('layer-detail-panel');
    const title = document.getElementById('detail-layer-name');
    const content = document.getElementById('detail-content');

    if (!panel || !content) return;

    if (title) title.textContent = layer.name;

    content.innerHTML = `
      <div class="detail-section">
        <div class="detail-section-title">Basic Info</div>
        <div class="detail-row">
          <span class="detail-label">Type</span>
          <span class="detail-value">${layer.type}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Parameters</span>
          <span class="detail-value">${this.formatNumber(layer.parameters)}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Trainable</span>
          <span class="detail-value">${this.formatNumber(layer.trainableParams)}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Non-trainable</span>
          <span class="detail-value">${this.formatNumber(layer.nonTrainableParams)}</span>
        </div>
      </div>
      
      ${layer.activation ? `
        <div class="detail-section">
          <div class="detail-section-title">Activation</div>
          <div class="detail-row">
            <span class="detail-label">Function</span>
            <span class="detail-value">${layer.activation}</span>
          </div>
        </div>
      ` : ''}
      
      <div class="detail-section">
        <div class="detail-section-title">Shape</div>
        <div class="detail-row">
          <span class="detail-label">Input</span>
          <span class="detail-value">${layer.inputShape ? `[${layer.inputShape.join(', ')}]` : '-'}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Output</span>
          <span class="detail-value">${layer.outputShape ? `[${layer.outputShape.join(', ')}]` : '-'}</span>
        </div>
      </div>
    `;

    panel.style.display = 'block';
  }

  // ==================== UTILITIES ====================
  private showLoading(show: boolean, status?: string) {
    const overlay = document.getElementById('loading-overlay');
    const statusEl = document.getElementById('loading-status');

    if (overlay) overlay.classList.toggle('active', show);
    if (statusEl && status) statusEl.textContent = status;
  }

  private showToast(type: 'success' | 'error' | 'warning' | 'info', message: string) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const icons: Record<string, string> = {
      success: '<path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/>',
      error: '<circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6"/><path d="M9 9l6 6"/>',
      warning: '<path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
      info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>'
    };

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        ${icons[type]}
      </svg>
      <span class="toast-message">${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('toast-out');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  private formatNumber(num: number): string {
    if (num >= 1000000000) return `${(num / 1000000000).toFixed(2)}B`;
    if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(2)}K`;
    return num.toString();
  }

  private formatBytes(bytes: number): string {
    if (bytes >= 1073741824) return `${(bytes / 1073741824).toFixed(2)} GB`;
    if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(2)} MB`;
    if (bytes >= 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${bytes} B`;
  }

  // ==================== EXTRACTION VIEW ====================
  private updateExtractionView(metadata: ModelMetadata) {
    // Setup extraction export handlers if not done
    this.setupExtractionHandlers();

    // Parameter Statistics
    const setEl = (id: string, value: string) => {
      const el = document.getElementById(id);
      if (el) el.textContent = value;
    };

    setEl('ext-total-params', this.formatNumber(metadata.totalParameters));
    setEl('ext-trainable-params', this.formatNumber(metadata.trainableParameters));
    setEl('ext-frozen-params', this.formatNumber(metadata.nonTrainableParameters));
    setEl('ext-param-memory', this.formatBytes(metadata.totalParameters * 4));
    setEl('ext-param-memory-fp16', this.formatBytes(metadata.totalParameters * 2));

    // Calculate sparsity (estimate)
    const sparsity = metadata.nonTrainableParameters / metadata.totalParameters * 100;
    setEl('ext-param-density', `${sparsity.toFixed(1)}%`);

    // Per-layer parameter breakdown
    this.renderParamBreakdown(metadata);

    // Training Configuration (inferred or extracted)
    this.renderTrainingInfo(metadata);

    // Preprocessing Pipeline (inferred)
    this.renderPreprocessingInfo(metadata);

    // Dataset Inference
    this.renderDatasetInference(metadata);

    // Architecture Detection
    this.renderArchitectureInfo(metadata);

    // Quantization Info
    this.renderQuantizationInfo(metadata);

    // Raw data JSON
    this.renderRawData(metadata);
  }

  private setupExtractionHandlers() {
    // Only setup once
    if ((this as any)._extractionHandlersSetup) return;
    (this as any)._extractionHandlersSetup = true;

    document.getElementById('export-all-data')?.addEventListener('click', () => {
      this.exportFullModelData();
    });

    document.getElementById('copy-all-data')?.addEventListener('click', () => {
      this.copyFullModelData();
    });

    document.getElementById('copy-raw-data')?.addEventListener('click', () => {
      this.copyRawData();
    });

    document.getElementById('download-raw-data')?.addEventListener('click', () => {
      this.exportFullModelData();
    });

    // Copy section buttons
    document.querySelectorAll('.copy-section').forEach(btn => {
      btn.addEventListener('click', () => {
        const section = btn.getAttribute('data-section');
        this.copySectionData(section || '');
      });
    });
  }

  private renderParamBreakdown(metadata: ModelMetadata) {
    const container = document.getElementById('param-breakdown-table');
    if (!container) return;

    const maxParams = Math.max(...metadata.layers.map(l => l.parameters));

    container.innerHTML = metadata.layers.map(layer => `
      <div class="param-row">
        <span class="param-row-name">${layer.name}</span>
        <span class="param-row-type">${layer.type}</span>
        <span class="param-row-count">${this.formatNumber(layer.parameters)}</span>
        <div class="param-row-bar">
          <div class="param-row-bar-fill" style="width: ${(layer.parameters / maxParams) * 100}%"></div>
        </div>
      </div>
    `).join('');
  }

  private renderTrainingInfo(metadata: ModelMetadata) {
    const setEl = (id: string, value: string) => {
      const el = document.getElementById(id);
      if (el) el.textContent = value;
    };

    // Use extracted training info or infer from architecture
    const training = metadata.training || this.inferTrainingConfig(metadata);

    if (training.optimizer) {
      setEl('opt-type', training.optimizer.type);
      setEl('opt-lr', training.optimizer.learningRate?.toExponential(2) || '--');
      setEl('opt-wd', training.optimizer.weightDecay?.toString() || '0');
      setEl('opt-momentum', training.optimizer.momentum?.toString() || '--');
    }

    setEl('train-epochs', training.epochs?.toString() || 'Unknown');
    setEl('train-batch', training.batchSize?.toString() || 'Unknown');
    setEl('train-loss', training.loss || this.inferLoss(metadata));
    setEl('train-device', training.device || 'Unknown');

    // Update status badge
    const status = document.getElementById('training-status');
    if (status) {
      if (metadata.training) {
        status.textContent = 'Extracted';
        status.className = 'extraction-badge detected';
      } else {
        status.textContent = 'Inferred';
        status.className = 'extraction-badge inferred';
      }
    }
  }

  private inferTrainingConfig(metadata: ModelMetadata) {
    // Infer common training configs based on architecture
    const hasResidual = metadata.layers.some(l => l.name.includes('residual') || l.name.includes('skip'));
    const hasBatchNorm = metadata.layers.some(l => l.type.toLowerCase().includes('batchnorm'));

    return {
      optimizer: {
        type: hasBatchNorm ? 'SGD with Momentum' : 'Adam',
        learningRate: hasBatchNorm ? 0.1 : 0.001,
        momentum: hasBatchNorm ? 0.9 : undefined,
        weightDecay: hasResidual ? 0.0001 : 0
      },
      batchSize: metadata.inputShape && metadata.inputShape[2] > 100 ? 32 : 64,
      loss: this.inferLoss(metadata),
      epochs: undefined as number | undefined,
      device: undefined as string | undefined
    };
  }

  private inferLoss(metadata: ModelMetadata): string {
    if (!metadata.outputShape) return 'Unknown';
    const outputSize = metadata.outputShape[metadata.outputShape.length - 1];
    if (outputSize === 1) return 'Binary Cross-Entropy';
    if (outputSize > 1) return 'Cross-Entropy';
    return 'MSE Loss';
  }

  private renderPreprocessingInfo(metadata: ModelMetadata) {
    const setEl = (id: string, value: string) => {
      const el = document.getElementById(id);
      if (el) el.textContent = value;
    };

    // Use extracted or infer from input shape
    const preprocess = metadata.preprocessing || this.inferPreprocessing(metadata);

    if (preprocess.normalization) {
      setEl('norm-mean', preprocess.normalization.mean ? `[${preprocess.normalization.mean.join(', ')}]` : '--');
      setEl('norm-std', preprocess.normalization.std ? `[${preprocess.normalization.std.join(', ')}]` : '--');
      setEl('norm-type', preprocess.normalization.type || 'Standard');
    }

    if (preprocess.resize) {
      setEl('input-resize', `${preprocess.resize.width} × ${preprocess.resize.height}`);
    } else if (metadata.inputShape) {
      const h = metadata.inputShape[2] || metadata.inputShape[1];
      const w = metadata.inputShape[3] || metadata.inputShape[2];
      setEl('input-resize', `${w} × ${h}`);
    }

    setEl('input-colorspace', preprocess.colorSpace || 'RGB');
    setEl('input-range', preprocess.inputRange ? `[${preprocess.inputRange.join(', ')}]` : '[0, 1]');
    setEl('input-channels', preprocess.channelOrder || 'CHW');

    // Augmentations
    const augContainer = document.getElementById('augmentation-tags');
    if (augContainer) {
      const augs = preprocess.augmentations || ['Random Crop', 'Horizontal Flip', 'Color Jitter'];
      augContainer.innerHTML = augs.map(aug => `<span class="aug-tag">${aug}</span>`).join('');
    }
  }

  private inferPreprocessing(metadata: ModelMetadata) {
    // Infer based on common patterns
    const isImageNet = metadata.inputShape &&
      (metadata.inputShape[2] === 224 || metadata.inputShape[3] === 224);

    return {
      normalization: {
        mean: isImageNet ? [0.485, 0.456, 0.406] : [0.5, 0.5, 0.5],
        std: isImageNet ? [0.229, 0.224, 0.225] : [0.5, 0.5, 0.5],
        type: isImageNet ? 'ImageNet' : 'Standard'
      },
      resize: metadata.inputShape ? {
        width: metadata.inputShape[3] || metadata.inputShape[2] || 224,
        height: metadata.inputShape[2] || metadata.inputShape[1] || 224
      } : undefined,
      colorSpace: 'RGB',
      inputRange: [0, 1] as [number, number],
      channelOrder: 'CHW',
      augmentations: ['Random Crop', 'Horizontal Flip', 'Normalize']
    };
  }

  private renderDatasetInference(metadata: ModelMetadata) {
    const setEl = (id: string, value: string) => {
      const el = document.getElementById(id);
      if (el) el.textContent = value;
    };

    const inference = metadata.datasetInference || this.inferDataset(metadata);

    // Dataset suggestions
    const sugContainer = document.getElementById('dataset-suggestions');
    if (sugContainer && inference.possibleDatasets) {
      sugContainer.innerHTML = inference.possibleDatasets.map((ds, i) => {
        const confidence = Math.max(95 - i * 15, 30);
        return `
          <div class="dataset-item">
            <span class="dataset-name">${ds}</span>
            <span class="dataset-confidence">${confidence}%</span>
          </div>
        `;
      }).join('');
    }

    setEl('task-input-type', inference.inputType || 'Unknown');
    setEl('task-type', inference.taskType || 'Unknown');
    setEl('task-classes', inference.numClasses?.toString() || '--');
    setEl('task-dataset-size', inference.estimatedDatasetSize || 'Unknown');

    // Class labels
    const labelsContainer = document.getElementById('class-labels');
    if (labelsContainer && inference.classLabels && inference.classLabels.length > 0) {
      labelsContainer.innerHTML = inference.classLabels.slice(0, 50).map(label =>
        `<span class="class-label">${label}</span>`
      ).join('');
      if (inference.classLabels.length > 50) {
        labelsContainer.innerHTML += `<span class="class-label">+${inference.classLabels.length - 50} more</span>`;
      }
    }
  }

  private inferDataset(metadata: ModelMetadata) {
    const outputSize = metadata.outputShape ? metadata.outputShape[metadata.outputShape.length - 1] : 0;
    const inputChannels = metadata.inputShape ? metadata.inputShape[1] : 3;
    const inputSize = metadata.inputShape ? metadata.inputShape[2] : 0;

    let possibleDatasets: string[] = [];
    let taskType = 'Classification';
    let inputType = 'Unknown';

    // Infer based on output and input shapes
    if (outputSize === 1000 && inputSize === 224) {
      possibleDatasets = ['ImageNet-1K', 'ImageNet-21K (subset)'];
      inputType = 'RGB Image';
    } else if (outputSize === 10 && inputSize === 32) {
      possibleDatasets = ['CIFAR-10', 'SVHN'];
      inputType = 'RGB Image';
    } else if (outputSize === 100 && inputSize === 32) {
      possibleDatasets = ['CIFAR-100'];
      inputType = 'RGB Image';
    } else if (outputSize === 10 && inputSize === 28 && inputChannels === 1) {
      possibleDatasets = ['MNIST', 'Fashion-MNIST'];
      inputType = 'Grayscale Image';
    } else if (outputSize >= 2 && outputSize <= 10) {
      possibleDatasets = ['Custom Dataset', 'Domain-Specific'];
      inputType = inputChannels === 3 ? 'RGB Image' : inputChannels === 1 ? 'Grayscale Image' : 'Multi-channel';
    } else {
      possibleDatasets = ['Custom Dataset'];
      inputType = 'Unknown';
    }

    // Generate common ImageNet class labels if 1000 classes
    let classLabels: string[] = [];
    if (outputSize === 1000) {
      classLabels = ['tench', 'goldfish', 'great white shark', 'tiger shark', 'hammerhead',
        'electric ray', 'stingray', 'cock', 'hen', 'ostrich', 'brambling', 'goldfinch',
        'house finch', 'junco', 'indigo bunting', 'robin', 'bulbul', 'jay', 'magpie', 'chickadee'];
    }

    return {
      possibleDatasets,
      inputType,
      taskType,
      numClasses: outputSize,
      classLabels,
      estimatedDatasetSize: outputSize === 1000 ? '~1.2M images' : outputSize >= 100 ? '~50K+ images' : '~10K images'
    };
  }

  private renderArchitectureInfo(metadata: ModelMetadata) {
    const setEl = (id: string, value: string) => {
      const el = document.getElementById(id);
      if (el) el.textContent = value;
    };

    const arch = metadata.architecture || this.detectArchitecture(metadata);

    setEl('arch-type', arch.type || 'Custom');
    setEl('arch-variant', arch.variant || '--');
    setEl('arch-backbone', arch.backbone || '--');
    setEl('arch-head', arch.head || '--');
    setEl('arch-depth', metadata.totalLayers.toString());

    // Estimate width based on max layer params
    const maxLayerParams = Math.max(...metadata.layers.map(l => l.parameters));
    setEl('arch-width', this.formatNumber(maxLayerParams));
  }

  private detectArchitecture(metadata: ModelMetadata) {
    const layerNames = metadata.layers.map(l => l.name.toLowerCase()).join(' ');
    const layerTypes = metadata.layers.map(l => l.type.toLowerCase()).join(' ');

    let type = 'Custom CNN';
    let variant = '';
    let backbone = '';
    let head = 'Linear Classifier';

    if (layerNames.includes('resnet') || (layerNames.includes('layer') && layerNames.includes('conv'))) {
      type = 'ResNet';
      if (metadata.totalLayers <= 25) variant = 'ResNet-18';
      else if (metadata.totalLayers <= 40) variant = 'ResNet-34';
      else if (metadata.totalLayers <= 60) variant = 'ResNet-50';
      else variant = 'ResNet-101+';
      backbone = 'Residual Blocks';
    } else if (layerNames.includes('vgg')) {
      type = 'VGG';
      variant = metadata.totalLayers <= 16 ? 'VGG-16' : 'VGG-19';
      backbone = 'Conv Blocks';
    } else if (layerNames.includes('inception') || layerNames.includes('mixed')) {
      type = 'Inception';
      variant = 'InceptionV3';
      backbone = 'Inception Modules';
    } else if (layerNames.includes('densenet') || layerNames.includes('dense')) {
      type = 'DenseNet';
      backbone = 'Dense Blocks';
    } else if (layerNames.includes('efficientnet')) {
      type = 'EfficientNet';
      backbone = 'MBConv Blocks';
    } else if (layerNames.includes('mobilenet')) {
      type = 'MobileNet';
      backbone = 'Depthwise Separable Conv';
    } else if (layerTypes.includes('attention') || layerTypes.includes('transformer')) {
      type = 'Vision Transformer';
      backbone = 'Transformer Blocks';
      head = 'MLP Head';
    } else if (layerTypes.includes('lstm') || layerTypes.includes('gru')) {
      type = 'RNN';
      backbone = layerTypes.includes('lstm') ? 'LSTM Cells' : 'GRU Cells';
      head = 'Sequence Output';
    }

    return { type, variant, backbone, head };
  }

  private renderQuantizationInfo(metadata: ModelMetadata) {
    const setEl = (id: string, value: string) => {
      const el = document.getElementById(id);
      if (el) el.textContent = value;
    };

    const quant = metadata.quantization || { enabled: false };

    // Update status indicator
    const statusEl = document.getElementById('quant-status');
    if (statusEl) {
      const indicator = statusEl.querySelector('.quant-indicator');
      const text = statusEl.querySelector('span');
      if (indicator) {
        indicator.classList.toggle('not-quantized', !quant.enabled);
      }
      if (text) {
        text.textContent = quant.enabled ? `Quantized (${quant.type || 'INT8'})` : 'Not Quantized';
      }
    }

    setEl('quant-precision', quant.enabled ? `${quant.bits || 8}-bit` : 'FP32 (32-bit)');
    setEl('quant-size', this.formatBytes(metadata.fileSize));
    setEl('quant-fp16-size', this.formatBytes(metadata.totalParameters * 2));
    setEl('quant-int8-size', this.formatBytes(metadata.totalParameters));
  }

  private renderRawData(metadata: ModelMetadata) {
    const container = document.getElementById('raw-data-view');
    if (!container) return;

    const exportData = {
      fileName: metadata.fileName,
      framework: metadata.framework,
      format: metadata.format,
      fileSize: metadata.fileSize,
      totalLayers: metadata.totalLayers,
      totalParameters: metadata.totalParameters,
      trainableParameters: metadata.trainableParameters,
      nonTrainableParameters: metadata.nonTrainableParameters,
      inputShape: metadata.inputShape,
      outputShape: metadata.outputShape,
      architecture: metadata.architecture || this.detectArchitecture(metadata),
      training: metadata.training || this.inferTrainingConfig(metadata),
      preprocessing: metadata.preprocessing || this.inferPreprocessing(metadata),
      datasetInference: metadata.datasetInference || this.inferDataset(metadata),
      layers: metadata.layers.map(l => ({
        name: l.name,
        type: l.type,
        parameters: l.parameters,
        trainable: l.trainableParams,
        inputShape: l.inputShape,
        outputShape: l.outputShape,
        activation: l.activation
      }))
    };

    container.textContent = JSON.stringify(exportData, null, 2);
  }

  private exportFullModelData() {
    if (!this.currentMetadata) {
      this.showToast('warning', 'No model loaded');
      return;
    }

    const exportData = {
      exportDate: new Date().toISOString(),
      version: '1.0.0',
      metadata: this.currentMetadata,
      insights: this.currentInsights,
      architecture: this.detectArchitecture(this.currentMetadata),
      training: this.currentMetadata.training || this.inferTrainingConfig(this.currentMetadata),
      preprocessing: this.currentMetadata.preprocessing || this.inferPreprocessing(this.currentMetadata),
      datasetInference: this.currentMetadata.datasetInference || this.inferDataset(this.currentMetadata)
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `lucefact-full-${this.currentMetadata.fileName.replace(/\.[^.]+$/, '')}.json`;
    link.click();

    this.showToast('success', 'Full model data exported');
  }

  private copyFullModelData() {
    if (!this.currentMetadata) {
      this.showToast('warning', 'No model loaded');
      return;
    }

    const raw = document.getElementById('raw-data-view')?.textContent || '';
    navigator.clipboard.writeText(raw);
    this.showToast('success', 'Model data copied to clipboard');
  }

  private copyRawData() {
    const raw = document.getElementById('raw-data-view')?.textContent || '';
    navigator.clipboard.writeText(raw);
    this.showToast('success', 'JSON copied to clipboard');
  }

  private copySectionData(section: string) {
    if (!this.currentMetadata) return;

    let data: any = {};
    switch (section) {
      case 'parameters':
        data = {
          total: this.currentMetadata.totalParameters,
          trainable: this.currentMetadata.trainableParameters,
          frozen: this.currentMetadata.nonTrainableParameters,
          layers: this.currentMetadata.layers.map(l => ({ name: l.name, params: l.parameters }))
        };
        break;
    }

    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    this.showToast('success', 'Section data copied');
  }

  // ==================== SETTINGS ====================
  private settings = {
    theme: 'dark',
    autoload: false,
    animation: 'normal',
    layout: 'vertical',
    showParams: true,
    minimap: false,
    scaleNodes: true,
    quality: 2,
    metadata: true,
    exportBg: true,
    precision: 'fp32',
    flops: true,
    healthThreshold: 70,
    historyLimit: 10
  };

  private setupSettings() {
    // Settings button opens settings view
    document.getElementById('settings-btn')?.addEventListener('click', () => {
      this.switchView('settings');
    });

    // Theme setting
    document.getElementById('setting-theme')?.addEventListener('change', (e) => {
      const value = (e.target as HTMLSelectElement).value;
      this.settings.theme = value;
      if (value === 'system') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
      } else {
        document.documentElement.setAttribute('data-theme', value);
      }
      this.saveSettings();
    });

    // Auto-load setting
    document.getElementById('setting-autoload')?.addEventListener('change', (e) => {
      this.settings.autoload = (e.target as HTMLInputElement).checked;
      this.saveSettings();
    });

    // Animation setting
    document.getElementById('setting-animation')?.addEventListener('change', (e) => {
      this.settings.animation = (e.target as HTMLSelectElement).value;
      document.documentElement.style.setProperty('--transition-normal',
        this.settings.animation === 'fast' ? '150ms ease' :
          this.settings.animation === 'slow' ? '400ms ease' :
            this.settings.animation === 'none' ? '0ms' : '250ms ease'
      );
      this.saveSettings();
    });

    // Layout setting
    document.getElementById('setting-layout')?.addEventListener('change', (e) => {
      this.settings.layout = (e.target as HTMLSelectElement).value;
      this.saveSettings();
    });

    // Show params setting
    document.getElementById('setting-showparams')?.addEventListener('change', (e) => {
      this.settings.showParams = (e.target as HTMLInputElement).checked;
      this.saveSettings();
    });

    // Minimap setting
    document.getElementById('setting-minimap')?.addEventListener('change', (e) => {
      this.settings.minimap = (e.target as HTMLInputElement).checked;
      this.saveSettings();
    });

    // Scale nodes setting
    document.getElementById('setting-scalenodes')?.addEventListener('change', (e) => {
      this.settings.scaleNodes = (e.target as HTMLInputElement).checked;
      this.saveSettings();
    });

    // Quality setting
    document.getElementById('setting-quality')?.addEventListener('change', (e) => {
      this.settings.quality = parseInt((e.target as HTMLSelectElement).value);
      this.saveSettings();
    });

    // Metadata setting
    document.getElementById('setting-metadata')?.addEventListener('change', (e) => {
      this.settings.metadata = (e.target as HTMLInputElement).checked;
      this.saveSettings();
    });

    // Export background setting
    document.getElementById('setting-exportbg')?.addEventListener('change', (e) => {
      this.settings.exportBg = (e.target as HTMLInputElement).checked;
      this.saveSettings();
    });

    // Precision setting
    document.getElementById('setting-precision')?.addEventListener('change', (e) => {
      this.settings.precision = (e.target as HTMLSelectElement).value;
      if (this.currentMetadata && this.currentInsights) {
        this.updateAnalytics(this.currentMetadata, this.currentInsights);
      }
      this.saveSettings();
    });

    // FLOPs setting
    document.getElementById('setting-flops')?.addEventListener('change', (e) => {
      this.settings.flops = (e.target as HTMLInputElement).checked;
      this.saveSettings();
    });

    // Health threshold setting
    document.getElementById('setting-healththreshold')?.addEventListener('change', (e) => {
      this.settings.healthThreshold = parseInt((e.target as HTMLSelectElement).value);
      if (this.currentMetadata && this.currentInsights) {
        this.updateDashboard(this.currentMetadata, this.currentInsights);
      }
      this.saveSettings();
    });

    // History limit setting
    document.getElementById('setting-historylimit')?.addEventListener('change', (e) => {
      this.settings.historyLimit = parseInt((e.target as HTMLSelectElement).value);
      this.modelHistory = this.modelHistory.slice(0, this.settings.historyLimit);
      this.saveHistory();
      this.renderHistory();
      this.saveSettings();
    });

    // Clear history button
    document.getElementById('clear-history')?.addEventListener('click', () => {
      this.modelHistory = [];
      this.saveHistory();
      this.renderHistory();
      this.showToast('success', 'History cleared');
    });

    // Reset settings button
    document.getElementById('reset-settings')?.addEventListener('click', () => {
      localStorage.removeItem('lucefact-settings');
      this.settings = {
        theme: 'dark',
        autoload: false,
        animation: 'normal',
        layout: 'vertical',
        showParams: true,
        minimap: false,
        scaleNodes: true,
        quality: 2,
        metadata: true,
        exportBg: true,
        precision: 'fp32',
        flops: true,
        healthThreshold: 70,
        historyLimit: 10
      };
      this.loadSettings();
      this.showToast('success', 'Settings reset to defaults');
    });
  }

  private saveSettings() {
    localStorage.setItem('lucefact-settings', JSON.stringify(this.settings));
  }

  private loadSettings() {
    const saved = localStorage.getItem('lucefact-settings');
    if (saved) {
      try {
        this.settings = { ...this.settings, ...JSON.parse(saved) };
      } catch {
        // ignore
      }
    }

    // Apply settings to UI
    const themeSelect = document.getElementById('setting-theme') as HTMLSelectElement;
    if (themeSelect) themeSelect.value = this.settings.theme;

    const autoloadCheck = document.getElementById('setting-autoload') as HTMLInputElement;
    if (autoloadCheck) autoloadCheck.checked = this.settings.autoload;

    const animationSelect = document.getElementById('setting-animation') as HTMLSelectElement;
    if (animationSelect) animationSelect.value = this.settings.animation;

    const layoutSelect = document.getElementById('setting-layout') as HTMLSelectElement;
    if (layoutSelect) layoutSelect.value = this.settings.layout;

    const showParamsCheck = document.getElementById('setting-showparams') as HTMLInputElement;
    if (showParamsCheck) showParamsCheck.checked = this.settings.showParams;

    const minimapCheck = document.getElementById('setting-minimap') as HTMLInputElement;
    if (minimapCheck) minimapCheck.checked = this.settings.minimap;

    const scaleNodesCheck = document.getElementById('setting-scalenodes') as HTMLInputElement;
    if (scaleNodesCheck) scaleNodesCheck.checked = this.settings.scaleNodes;

    const qualitySelect = document.getElementById('setting-quality') as HTMLSelectElement;
    if (qualitySelect) qualitySelect.value = this.settings.quality.toString();

    const metadataCheck = document.getElementById('setting-metadata') as HTMLInputElement;
    if (metadataCheck) metadataCheck.checked = this.settings.metadata;

    const exportBgCheck = document.getElementById('setting-exportbg') as HTMLInputElement;
    if (exportBgCheck) exportBgCheck.checked = this.settings.exportBg;

    const precisionSelect = document.getElementById('setting-precision') as HTMLSelectElement;
    if (precisionSelect) precisionSelect.value = this.settings.precision;

    const flopsCheck = document.getElementById('setting-flops') as HTMLInputElement;
    if (flopsCheck) flopsCheck.checked = this.settings.flops;

    const healthThresholdSelect = document.getElementById('setting-healththreshold') as HTMLSelectElement;
    if (healthThresholdSelect) healthThresholdSelect.value = this.settings.healthThreshold.toString();

    const historyLimitSelect = document.getElementById('setting-historylimit') as HTMLSelectElement;
    if (historyLimitSelect) historyLimitSelect.value = this.settings.historyLimit.toString();

    // Apply theme
    if (this.settings.theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    } else {
      document.documentElement.setAttribute('data-theme', this.settings.theme);
    }

    // Apply animation speed
    document.documentElement.style.setProperty('--transition-normal',
      this.settings.animation === 'fast' ? '150ms ease' :
        this.settings.animation === 'slow' ? '400ms ease' :
          this.settings.animation === 'none' ? '0ms' : '250ms ease'
    );

    // Auto-load sample if enabled
    if (this.settings.autoload && !this.currentMetadata) {
      this.loadSampleModel();
    }
  }

  private updateAboutStats() {
    const stats = this.getUsageStats();

    const modelsEl = document.getElementById('total-models-analyzed');
    if (modelsEl) modelsEl.textContent = stats.modelsAnalyzed.toString();

    const paramsEl = document.getElementById('total-params-processed');
    if (paramsEl) paramsEl.textContent = this.formatNumber(stats.paramsProcessed);
  }

  private getUsageStats(): { modelsAnalyzed: number; paramsProcessed: number } {
    const saved = localStorage.getItem('lucefact-stats');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return { modelsAnalyzed: 0, paramsProcessed: 0 };
      }
    }
    return { modelsAnalyzed: 0, paramsProcessed: 0 };
  }

  private updateUsageStats(params: number) {
    const stats = this.getUsageStats();
    stats.modelsAnalyzed++;
    stats.paramsProcessed += params;
    localStorage.setItem('lucefact-stats', JSON.stringify(stats));
    this.updateAboutStats();
  }

  private getBytesPerParam(): number {
    switch (this.settings.precision) {
      case 'fp16': return 2;
      case 'mixed': return 3; // Average of fp16 and fp32
      default: return 4; // fp32
    }
  }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
  new LucefactApp();
});
