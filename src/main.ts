import { ModelParser } from './parser';
import { InsightsGenerator } from './insights';
import { Visualizer } from './visualizer';
import { ModelMetadata, ModelInsights, ModelLayer } from './types';

class LucefactApp {
  private parser: ModelParser;
  private insightsGenerator: InsightsGenerator;
  private visualizer: Visualizer | null = null;
  private currentMetadata: ModelMetadata | null = null;
  private currentInsights: ModelInsights | null = null;

  constructor() {
    this.parser = new ModelParser();
    this.insightsGenerator = new InsightsGenerator();
    this.init();
  }

  private init() {
    // Setup upload button
    const uploadBtn = document.getElementById('upload-btn');
    const fileInput = document.getElementById('file-input') as HTMLInputElement;

    uploadBtn?.addEventListener('click', () => {
      fileInput?.click();
    });

    fileInput?.addEventListener('change', async (e) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];
      if (file) {
        await this.handleFileUpload(file);
      }
    });

    // Setup tabs
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        const tabName = target.getAttribute('data-tab');
        if (tabName) {
          this.switchTab(tabName);
        }
      });
    });

    // Zoom controls removed; visualization auto-sizes

    // Setup layout switcher
    document.getElementById('layout-vertical')?.addEventListener('click', () => {
      this.visualizer?.setLayout('vertical');
      this.updateActiveLayout('vertical');
    });

    document.getElementById('layout-horizontal')?.addEventListener('click', () => {
      this.visualizer?.setLayout('horizontal');
      this.updateActiveLayout('horizontal');
    });

    document.getElementById('layout-circular')?.addEventListener('click', () => {
      this.visualizer?.setLayout('circular');
      this.updateActiveLayout('circular');
    });

    document.getElementById('layout-tree')?.addEventListener('click', () => {
      this.visualizer?.setLayout('tree');
      this.updateActiveLayout('tree');
    });

    // Setup search
    document.getElementById('layer-search')?.addEventListener('input', (e) => {
      const term = (e.target as HTMLInputElement).value;
      this.visualizer?.search(term);
    });

    // Setup export
    document.getElementById('export-image')?.addEventListener('click', () => {
      this.visualizer?.exportAsImage();
    });

    document.getElementById('export-json')?.addEventListener('click', () => {
      this.exportAnalysisJSON();
    });

    // Initialize visualizer
    const vizCanvas = document.getElementById('viz-canvas');
    if (vizCanvas) {
      this.visualizer = new Visualizer(vizCanvas);
      
      // Listen for layer selections
      vizCanvas.addEventListener('layerSelection', ((e: CustomEvent) => {
        this.handleLayerSelection(e.detail);
      }) as EventListener);
    }

    // Setup comparison panel
    document.getElementById('close-comparison')?.addEventListener('click', () => {
      document.getElementById('comparison-panel')!.style.display = 'none';
    });
  }

  private async handleFileUpload(file: File) {
    this.showLoading(true);

    try {
      // Parse the model file
      const result = await this.parser.parseFile(file);

      if (!result.success || !result.metadata) {
        this.showError(result.error || 'Failed to parse model file');
        return;
      }

      this.currentMetadata = result.metadata;
      this.currentInsights = this.insightsGenerator.generateInsights(result.metadata);

      // Update UI
      this.updateFileInfo(result.metadata);
      this.updateModelStats(result.metadata);
      this.updateVisualization(result.metadata);
      this.updateInsights(this.currentInsights);

      // Show controls
  // Zoom controls removed
      document.getElementById('layer-search')!.style.display = 'block';
      document.getElementById('layout-selector')!.style.display = 'flex';
      document.getElementById('export-controls')!.style.display = 'flex';
      document.getElementById('live-stats')!.style.display = 'block';
      
      // Update live stats
      this.updateLiveStats(result.metadata);

    } catch (error) {
      this.showError(`Error processing file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      this.showLoading(false);
    }
  }

  private updateFileInfo(metadata: ModelMetadata) {
    const content = document.getElementById('file-info-content');
    if (!content) return;

    const sizeInMB = (metadata.fileSize / (1024 * 1024)).toFixed(2);

    content.innerHTML = `
      <div class="info-row">
        <span class="info-label">Name</span>
        <span class="info-value">${metadata.fileName}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Format</span>
        <span class="info-value">${metadata.format}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Size</span>
        <span class="info-value">${sizeInMB} MB</span>
      </div>
      <div class="info-row">
        <span class="info-label">Framework</span>
        <span class="info-value">${metadata.framework}</span>
      </div>
    `;
  }

  private updateModelStats(metadata: ModelMetadata) {
    const content = document.getElementById('model-stats-content');
    if (!content) return;

    content.innerHTML = `
      <div class="info-row">
        <span class="info-label">Total Layers</span>
        <span class="info-value">${metadata.totalLayers}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Total Parameters</span>
        <span class="info-value">${this.formatNumber(metadata.totalParameters)}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Trainable</span>
        <span class="info-value">${this.formatNumber(metadata.trainableParameters)}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Non-trainable</span>
        <span class="info-value">${this.formatNumber(metadata.nonTrainableParameters)}</span>
      </div>
    `;
  }

  private updateVisualization(metadata: ModelMetadata) {
    if (this.visualizer) {
      this.visualizer.visualize(metadata);
    }
  }

  private updateInsights(insights: ModelInsights) {
    // Summary tab
    const summaryTab = document.getElementById('tab-summary');
    if (summaryTab) {
      summaryTab.innerHTML = `
        <div class="insight-grid">
          <div class="insight-card">
            <div class="insight-title">Total Layers</div>
            <div class="insight-value">${insights.summary.totalLayers}</div>
            <div class="insight-description">Number of computational layers in the model</div>
          </div>
          <div class="insight-card">
            <div class="insight-title">Total Parameters</div>
            <div class="insight-value">${this.formatNumber(insights.summary.totalParams)}</div>
            <div class="insight-description">All trainable and non-trainable parameters</div>
          </div>
          <div class="insight-card">
            <div class="insight-title">Avg Params/Layer</div>
            <div class="insight-value">${this.formatNumber(insights.summary.avgParamsPerLayer)}</div>
            <div class="insight-description">Average parameter count per layer</div>
          </div>
          <div class="insight-card">
            <div class="insight-title">Most Complex Layer</div>
            <div class="insight-value" style="font-size: 1.2rem;">${insights.summary.mostComplexLayer}</div>
            <div class="insight-description">Layer with the highest parameter count</div>
          </div>
        </div>
      `;
    }

    // Distribution tab
    const distributionTab = document.getElementById('tab-distribution');
    if (distributionTab) {
      const layerTypesList = Object.entries(insights.distribution.layerTypes)
        .map(([type, count]) => `
          <div class="info-row">
            <span class="info-label">${type}</span>
            <span class="info-value">${count}</span>
          </div>
        `).join('');

      const activationsList = Object.entries(insights.distribution.activationFunctions)
        .map(([func, count]) => `
          <div class="info-row">
            <span class="info-label">${func}</span>
            <span class="info-value">${count}</span>
          </div>
        `).join('');

      distributionTab.innerHTML = `
        <div class="insight-grid">
          <div class="insight-card">
            <div class="insight-title">Layer Types</div>
            ${layerTypesList}
          </div>
          <div class="insight-card">
            <div class="insight-title">Activation Functions</div>
            ${activationsList || '<div class="insight-description">No activation functions detected</div>'}
          </div>
        </div>
      `;
    }

    // Density tab
    const densityTab = document.getElementById('tab-density');
    if (densityTab) {
      densityTab.innerHTML = `
        <div class="insight-grid">
          <div class="insight-card">
            <div class="insight-title">Trainable Ratio</div>
            <div class="insight-value">${insights.density.trainableRatio.toFixed(1)}%</div>
            <div class="insight-description">Percentage of parameters that are trainable</div>
          </div>
          <div class="insight-card">
            <div class="insight-title">Average Layer Size</div>
            <div class="insight-value">${this.formatNumber(insights.density.averageLayerSize)}</div>
            <div class="insight-description">Mean parameter count across all layers</div>
          </div>
          <div class="insight-card">
            <div class="insight-title">Largest Layer</div>
            <div class="insight-value" style="font-size: 1rem;">${insights.density.largestLayer.name}</div>
            <div class="insight-description">${this.formatNumber(insights.density.largestLayer.params)} parameters</div>
          </div>
          <div class="insight-card">
            <div class="insight-title">Smallest Layer</div>
            <div class="insight-value" style="font-size: 1rem;">${insights.density.smallestLayer.name}</div>
            <div class="insight-description">${this.formatNumber(insights.density.smallestLayer.params)} parameters</div>
          </div>
        </div>
      `;
    }

    // Issues tab
    const issuesTab = document.getElementById('tab-issues');
    if (issuesTab) {
      const issuesList = insights.issues.map((issue, index) => `
        <div class="insight-card" style="animation-delay: ${index * 0.1}s;">
          <div class="insight-description">${issue}</div>
        </div>
      `).join('');

      issuesTab.innerHTML = `<div class="insight-grid">${issuesList}</div>`;
    }
  }

  private switchTab(tabName: string) {
    // Update button states
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    const activeBtn = document.querySelector(`[data-tab="${tabName}"]`);
    activeBtn?.classList.add('active');

    // Update content visibility
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.remove('active');
    });
    document.getElementById(`tab-${tabName}`)?.classList.add('active');
  }

  private showLoading(show: boolean) {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
      overlay.classList.toggle('active', show);
    }
  }

  private showError(message: string) {
    alert(`Error: ${message}`);
  }

  private updateActiveLayout(layout: string) {
    document.querySelectorAll('.layout-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    document.getElementById(`layout-${layout}`)?.classList.add('active');
  }

  private exportAnalysisJSON() {
    if (!this.currentMetadata || !this.currentInsights) {
      alert('No model loaded to export');
      return;
    }

    const exportData = {
      metadata: this.currentMetadata,
      insights: this.currentInsights,
      exportDate: new Date().toISOString(),
      version: '0.5.0',
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `lucefact-analysis-${this.currentMetadata.fileName}.json`;
    link.click();
  }

  private handleLayerSelection(detail: { count: number; layers: ModelLayer[] }) {
    const panel = document.getElementById('comparison-panel')!;
    const content = document.getElementById('comparison-content')!;
    
    if (detail.count >= 2 && detail.count <= 3) {
      panel.style.display = 'block';
      
      // Generate comparison table
      let html = '<div class="comparison-grid">';
      
      // Headers
      html += '<div class="comparison-row header">';
      html += '<div class="comparison-cell">Property</div>';
      detail.layers.forEach(layer => {
        html += `<div class="comparison-cell">${layer.name}</div>`;
      });
      html += '</div>';
      
      // Type
      html += '<div class="comparison-row">';
      html += '<div class="comparison-cell">Type</div>';
      detail.layers.forEach(layer => {
        html += `<div class="comparison-cell">${layer.type}</div>`;
      });
      html += '</div>';
      
      // Parameters
      html += '<div class="comparison-row">';
      html += '<div class="comparison-cell">Parameters</div>';
      detail.layers.forEach(layer => {
        html += `<div class="comparison-cell">${this.formatNumber(layer.parameters)}</div>`;
      });
      html += '</div>';
      
      // Trainable
      html += '<div class="comparison-row">';
      html += '<div class="comparison-cell">Trainable</div>';
      detail.layers.forEach(layer => {
        html += `<div class="comparison-cell">${this.formatNumber(layer.trainableParams)}</div>`;
      });
      html += '</div>';
      
      // Activation
      html += '<div class="comparison-row">';
      html += '<div class="comparison-cell">Activation</div>';
      detail.layers.forEach(layer => {
        html += `<div class="comparison-cell">${layer.activation || 'None'}</div>`;
      });
      html += '</div>';
      
      html += '</div>';
      content.innerHTML = html;
    } else if (detail.count > 3) {
      content.innerHTML = '<p class="comparison-placeholder">Maximum 3 layers for comparison</p>';
    } else {
      panel.style.display = 'none';
    }
  }

  private updateLiveStats(metadata: ModelMetadata) {
    // Estimate memory (4 bytes per float parameter)
    const memoryBytes = metadata.totalParameters * 4;
    const memoryMB = (memoryBytes / (1024 * 1024)).toFixed(2);
    document.getElementById('memory-est')!.textContent = `${memoryMB} MB`;
    
    // Calculate complexity score (based on layers and params)
    const complexityScore = Math.min(100, (metadata.totalLayers * 2) + (metadata.totalParameters / 100000));
    document.getElementById('complexity')!.textContent = `${complexityScore.toFixed(0)}/100`;
    
    // Calculate efficiency (trainable ratio)
    const efficiency = metadata.totalParameters > 0 
      ? ((metadata.trainableParameters / metadata.totalParameters) * 100).toFixed(1)
      : '0';
    document.getElementById('efficiency')!.textContent = `${efficiency}%`;
  }

  private formatNumber(num: number): string {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(2)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(2)}K`;
    }
    return num.toString();
  }
}

// Initialize the app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new LucefactApp();
});
