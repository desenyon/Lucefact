import { TensorFlowParser } from './parsers/tensorflow';
import { PyTorchParser } from './parsers/pytorch';
import { ONNXParser } from './parsers/onnx';
import { PickleParser } from './parsers/pickle';
import { ParseResult } from './types';

export class ModelParser {
  private tensorflowParser = new TensorFlowParser();
  private pytorchParser = new PyTorchParser();
  private onnxParser = new ONNXParser();
  private pickleParser = new PickleParser();

  async parseFile(file: File): Promise<ParseResult> {
    const extension = this.getFileExtension(file.name);
    
    try {
      switch (extension) {
        case 'h5':
        case 'keras':
          return await this.tensorflowParser.parse(file);
        
        case 'pt':
        case 'pth':
          return await this.pytorchParser.parse(file);
        
        case 'onnx':
          return await this.onnxParser.parse(file);
        
        case 'pkl':
        case 'pickle':
          return await this.pickleParser.parse(file);
        
        default:
          return {
            success: false,
            error: `Unsupported file format: .${extension}`,
          };
      }
    } catch (error) {
      return {
        success: false,
        error: `Failed to parse model: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  private getFileExtension(filename: string): string {
    const parts = filename.split('.');
    return parts[parts.length - 1].toLowerCase();
  }
}
