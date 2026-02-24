# Lucefact

**A minimalist model introspection laboratory**

> Illuminating your models with elegance and precision

![Version](https://img.shields.io/badge/version-3.0.0-yellow)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## Overview

Lucefact is a beautiful, futuristic web application designed for comprehensive machine learning model analysis. With a minimalist design philosophy and powerful TypeScript architecture, it provides deep insights into model architectures across multiple frameworks.


## Supported Formats

- `.h5`, `.keras` - TensorFlow/Keras models
- `.pt`, `.pth` - PyTorch models
- `.onnx` - ONNX (Open Neural Network Exchange)
- `.pkl`, `.pickle` - Scikit-learn and Python pickled models

## Quick Start

### Installation

```bash
# Clone or navigate to the project directory
cd Lucefact

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will open automatically at `http://localhost:3000`

### Building for Production

```bash
npm run build
npm run preview
```


## Features in Detail

### Architecture Map
- Vertical flow diagram of model layers
- Text-only nodes with glowing connections
- Interactive zoom and pan controls
- Hover tooltips with detailed information

### Insights Panels

1. **Architecture Summary**
   - Total layers and parameters
   - Average parameters per layer
   - Most complex layer identification

2. **Layer Distribution**
   - Layer type frequency analysis
   - Activation function usage
   - Architecture pattern detection

3. **Parameter Density**
   - Trainable vs non-trainable ratio
   - Layer size distribution
   - Complexity metrics

4. **Potential Issues**
   - Missing metadata detection
   - Unbalanced architectures
   - Resource requirement warnings


## Development

### Type Checking

```bash
npm run type-check
```

### Adding New Parsers

1. Create a new parser in `src/parsers/`
2. Implement the `parse(file: File): Promise<ParseResult>` method
3. Register in `src/parser.ts`
4. Add file extension support

Example:

```typescript
export class CustomParser {
  async parse(file: File): Promise<ParseResult> {
    // Your parsing logic
    return { success: true, metadata };
  }
}
```

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

**Lucefact** — *illuminating your models*

Version: Alpha v0.4
