import { ModelMetadata, ModelInsights } from './types';

export class InsightsGenerator {
  generateInsights(metadata: ModelMetadata): ModelInsights {
    const { layers, totalParameters, trainableParameters, nonTrainableParameters } = metadata;

    // Calculate summary metrics
    const avgParamsPerLayer = layers.length > 0 
      ? Math.round(totalParameters / layers.length) 
      : 0;
    
    const mostComplexLayer = layers.reduce((max, layer) => 
      layer.parameters > max.parameters ? layer : max
    , layers[0] || { name: 'N/A', parameters: 0 });

    // Analyze layer type distribution
    const layerTypes: Record<string, number> = {};
    const activationFunctions: Record<string, number> = {};
    
    layers.forEach(layer => {
      layerTypes[layer.type] = (layerTypes[layer.type] || 0) + 1;
      
      if (layer.activation) {
        activationFunctions[layer.activation] = (activationFunctions[layer.activation] || 0) + 1;
      }
    });

    // Calculate density metrics
    const trainableRatio = totalParameters > 0 
      ? (trainableParameters / totalParameters) * 100 
      : 0;
    
    const layersWithParams = layers.filter(l => l.parameters > 0);
    const largestLayer = layersWithParams.reduce((max, layer) => 
      layer.parameters > max.parameters ? layer : max
    , layersWithParams[0] || { name: 'N/A', parameters: 0 });
    
    const smallestLayer = layersWithParams.reduce((min, layer) => 
      layer.parameters < min.parameters ? layer : min
    , layersWithParams[0] || { name: 'N/A', parameters: 0 });

    // Identify potential issues
    const issues: string[] = this.identifyIssues(metadata);

    return {
      summary: {
        totalLayers: layers.length,
        totalParams: totalParameters,
        avgParamsPerLayer,
        mostComplexLayer: mostComplexLayer.name,
        framework: metadata.framework,
      },
      distribution: {
        layerTypes,
        activationFunctions,
      },
      density: {
        trainableRatio,
        averageLayerSize: avgParamsPerLayer,
        largestLayer: { name: largestLayer.name, params: largestLayer.parameters },
        smallestLayer: { name: smallestLayer.name, params: smallestLayer.parameters },
      },
      issues,
    };
  }

  private identifyIssues(metadata: ModelMetadata): string[] {
    const issues: string[] = [];
    const { layers, totalParameters } = metadata;

    // Check for missing metadata
    if (layers.length === 0) {
      issues.push('No layers detected in the model');
    }

    // Check for layers without parameters
    const layersWithoutParams = layers.filter(l => l.parameters === 0);
    if (layersWithoutParams.length > layers.length * 0.5) {
      issues.push(`High proportion of layers without parameters (${layersWithoutParams.length}/${layers.length})`);
    }

    // Check for missing shapes
    const missingShapes = layers.filter(l => !l.inputShape && !l.outputShape);
    if (missingShapes.length > 0) {
      issues.push(`${missingShapes.length} layers missing shape information`);
    }

    // Check for very large models
    if (totalParameters > 100000000) {
      issues.push(`Very large model with ${this.formatNumber(totalParameters)} parameters - may require significant resources`);
    }

    // Check for models with no trainable parameters
    if (metadata.trainableParameters === 0 && totalParameters > 0) {
      issues.push('Model has no trainable parameters - may be frozen or inference-only');
    }

    // Check for unbalanced layer sizes
    const paramCounts = layers.map(l => l.parameters).filter(p => p > 0);
    if (paramCounts.length > 1) {
      const maxParams = Math.max(...paramCounts);
      const minParams = Math.min(...paramCounts);
      if (maxParams > minParams * 1000) {
        issues.push('Highly unbalanced parameter distribution across layers');
      }
    }

    if (issues.length === 0) {
      issues.push('No significant issues detected');
    }

    return issues;
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
