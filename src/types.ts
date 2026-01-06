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
  kernelSize?: number[];
  stride?: number[];
  padding?: string | number[];
  dilation?: number[];
  groups?: number;
  bias?: boolean;
  dtype?: string;
}

export interface TrainingMetadata {
  optimizer?: {
    type: string;
    learningRate?: number;
    momentum?: number;
    weightDecay?: number;
    betas?: [number, number];
    epsilon?: number;
  };
  scheduler?: {
    type: string;
    stepSize?: number;
    gamma?: number;
    milestones?: number[];
  };
  epochs?: number;
  batchSize?: number;
  loss?: string;
  metrics?: string[];
  lastEpoch?: number;
  trainingTime?: number;
  device?: string;
}

export interface PreprocessingInfo {
  normalization?: {
    mean?: number[];
    std?: number[];
    type?: string;
  };
  resize?: {
    width: number;
    height: number;
    mode?: string;
  };
  augmentations?: string[];
  colorSpace?: string;
  inputRange?: [number, number];
  channelOrder?: string;
}

export interface DatasetInference {
  possibleDatasets?: string[];
  inputType?: string;
  taskType?: string;
  numClasses?: number;
  classLabels?: string[];
  dataDistribution?: string;
  estimatedDatasetSize?: string;
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
  // Extended metadata
  training?: TrainingMetadata;
  preprocessing?: PreprocessingInfo;
  datasetInference?: DatasetInference;
  architecture?: {
    type?: string;
    variant?: string;
    backbone?: string;
    head?: string;
  };
  version?: string;
  createdDate?: string;
  modifiedDate?: string;
  author?: string;
  description?: string;
  quantization?: {
    enabled: boolean;
    type?: string;
    bits?: number;
  };
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

export interface HistoryItem {
  fileName: string;
  framework: string;
  timestamp: number;
  layers: number;
  params: number;
}

export interface HealthScore {
  overall: number;
  efficiency: number;
  complexity: number;
  optimization: number;
}

export interface ToastMessage {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  id: string;
}
