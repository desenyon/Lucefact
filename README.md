# Lucefact

**A minimalist model introspection laboratory**

> Illuminating your models with elegance and precision

![Version](https://img.shields.io/badge/version-0.4.0-yellow)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## Overview

Lucefact is a beautiful, futuristic web application designed for comprehensive machine learning model analysis. With a minimalist design philosophy and powerful TypeScript architecture, it provides deep insights into model architectures across multiple frameworks.

### Key Features

- 🎨 **Elegant Design**: Futuristic dark gradient theme with glowing accents
- 🔍 **Multi-Framework Support**: TensorFlow, PyTorch, ONNX, and Pickle formats
- 📊 **Interactive Visualization**: Text-only layer diagrams with smooth animations
- 🧠 **Intelligent Analysis**: Automatic detection of architecture patterns and potential issues
- ⚡ **Real-time Insights**: Parameter density, layer distribution, and complexity metrics
- 🎯 **Zero Dependencies (UI)**: Pure CSS animations and transitions
- 🔧 **Modular Architecture**: Clean TypeScript modules for easy extension

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

## Project Structure

```
Lucefact/
├── src/
│   ├── main.ts                 # Main application controller
│   ├── types.ts                # TypeScript type definitions
│   ├── parser.ts               # Model parser orchestrator
│   ├── insights.ts             # Insights generation engine
│   ├── visualizer.ts           # Interactive visualization
│   └── parsers/
│       ├── tensorflow.ts       # TensorFlow/Keras parser
│       ├── pytorch.ts          # PyTorch parser
│       ├── onnx.ts            # ONNX parser
│       └── pickle.ts          # Pickle parser
├── index.html                  # Main HTML structure
├── styles.css                  # Minimalist CSS design
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Architecture

### Modular Design

Each parser is self-contained and follows a consistent interface:

```typescript
interface ParseResult {
  success: boolean;
  metadata?: ModelMetadata;
  error?: string;
}
```

### Data Flow

1. **Upload** → File selected by user
2. **Parse** → Appropriate parser extracts metadata
3. **Analyze** → Insights generator computes metrics
4. **Visualize** → Interactive layer map rendered
5. **Display** → Comprehensive insights presented

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

## Design Philosophy

Lucefact embraces:

- **Minimalism**: No icons, pure text-based interface
- **Elegance**: Smooth animations and microinteractions
- **Clarity**: Precise typography and whitespace
- **Intelligence**: Deep model understanding without complexity

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

## Performance Considerations

- Client-side parsing (no server required)
- Lazy loading for large models
- Efficient DOM manipulation
- Optimized animations with CSS transforms

## Future Enhancements

- [ ] Export analysis reports
- [ ] Model comparison view
- [ ] Advanced graph layouts
- [ ] Full HDF5 parsing library integration
- [ ] WebAssembly parsers for performance
- [ ] Custom model format plugins

## Contributing

Contributions welcome! Please follow the modular architecture and maintain the minimalist design philosophy.

## Documentation

- 📖 **[USAGE.md](USAGE.md)** - Complete user guide
- 🛠️ **[DEVELOPER.md](DEVELOPER.md)** - Architecture & API documentation
- 📋 **[QUICKREF.md](QUICKREF.md)** - Quick reference card
- 📝 **[CHANGELOG.md](CHANGELOG.md)** - Version history

## Testing

Generate sample model files for testing:

```bash
python3 generate_samples.py
```

This creates sample files in all supported formats that you can upload to Lucefact.

## License

MIT License - feel free to use in your projects

---

**Lucefact** — *illuminating your models*

Version: Alpha v0.4
