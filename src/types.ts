// Type definitions for model analysis

export interface ModelLayer {
  name: string;
  type: string;
  inputShape?: number[];
  outputShape?: number[];
  parameters: number;
  trainableParams: number;
  nonTrainableParams: number;
  activation?: string;
  config?: Record<string, any>;
}

export interface ModelMetadata {
  framework: 'TensorFlow' | 'PyTorch' | 'ONNX' | 'Pickle' | 'Unknown';
  fileName: string;
  fileSize: number;
  format: string;
  totalLayers: number;
  totalParameters: number;
  trainableParameters: number;
  nonTrainableParameters: number;
  inputShape?: number[];
  outputShape?: number[];
  layers: ModelLayer[];
}

export interface ModelInsights {
  summary: {
    totalLayers: number;
    totalParams: number;
    avgParamsPerLayer: number;
    mostComplexLayer: string;
    framework: string;
  };
  distribution: {
    layerTypes: Record<string, number>;
    activationFunctions: Record<string, number>;
  };
  density: {
    trainableRatio: number;
    averageLayerSize: number;
    largestLayer: { name: string; params: number };
    smallestLayer: { name: string; params: number };
  };
  issues: string[];
}

export interface ParseResult {
  success: boolean;
  metadata?: ModelMetadata;
  error?: string;
}
