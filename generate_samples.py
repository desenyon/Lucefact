#!/usr/bin/env python3
"""
Sample Model Generator for Lucefact Testing
Creates dummy model files in various formats for testing the Lucefact application
"""

import struct
import pickle
import os

def create_sample_keras_model():
    """Create a simple Keras HDF5 model file"""
    # HDF5 signature
    hdf5_signature = bytes([137, 72, 68, 70, 13, 10, 26, 10])
    
    # Create a minimal HDF5-like structure
    with open('sample_model.h5', 'wb') as f:
        f.write(hdf5_signature)
        # Add some padding to make it look more realistic
        f.write(b'\x00' * 10000)
        # Add some layer-like data
        for i in range(5):
            f.write(f'layer_{i}'.encode())
            f.write(struct.pack('I', 1000 * (i + 1)))
    
    print("✓ Created sample_model.h5")

def create_sample_pytorch_model():
    """Create a simple PyTorch model file"""
    # PyTorch uses pickle format
    model_data = {
        'state_dict': {
            'layer1.weight': list(range(1000)),
            'layer1.bias': list(range(100)),
            'layer2.weight': list(range(2000)),
            'layer2.bias': list(range(200)),
        },
        'model_info': {
            'architecture': 'Sequential',
            'layers': ['Linear', 'ReLU', 'Linear']
        }
    }
    
    with open('sample_model.pt', 'wb') as f:
        pickle.dump(model_data, f, protocol=4)
    
    print("✓ Created sample_model.pt")

def create_sample_onnx_model():
    """Create a simple ONNX-like model file"""
    # ONNX uses Protocol Buffers
    onnx_header = b'onnx\x00\x00\x00\x00'
    
    with open('sample_model.onnx', 'wb') as f:
        f.write(onnx_header)
        f.write(b'ir_version: 8\n')
        f.write(b'graph {\n')
        f.write(b'  node { op_type: "Conv" }\n')
        f.write(b'  node { op_type: "Relu" }\n')
        f.write(b'  node { op_type: "MaxPool" }\n')
        f.write(b'}\n')
        # Add padding
        f.write(b'\x00' * 5000)
    
    print("✓ Created sample_model.onnx")

def create_sample_pickle_model():
    """Create a simple scikit-learn pickle model"""
    model_data = {
        'model_type': 'RandomForestClassifier',
        'n_estimators': 100,
        'max_depth': 10,
        'features': ['feature_' + str(i) for i in range(20)],
        'classes': ['class_0', 'class_1'],
        'feature_importances': [0.05] * 20
    }
    
    with open('sample_model.pkl', 'wb') as f:
        pickle.dump(model_data, f)
    
    print("✓ Created sample_model.pkl")

def main():
    print("Generating sample model files for Lucefact testing...\n")
    
    create_sample_keras_model()
    create_sample_pytorch_model()
    create_sample_onnx_model()
    create_sample_pickle_model()
    
    print("\n✨ All sample model files created successfully!")
    print("\nYou can now upload these files to Lucefact:")
    print("  • sample_model.h5   (TensorFlow/Keras)")
    print("  • sample_model.pt   (PyTorch)")
    print("  • sample_model.onnx (ONNX)")
    print("  • sample_model.pkl  (Pickle)")

if __name__ == '__main__':
    main()
