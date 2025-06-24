#!/usr/bin/env python3
"""
Script para instalar dependencias necesarias para los scripts de Machine Learning
"""

import subprocess
import sys
import os

def install_package(package):
    """Instala un paquete usando pip"""
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", package])
        print(f"✅ {package} instalado exitosamente")
        return True
    except subprocess.CalledProcessError:
        print(f"❌ Error instalando {package}")
        return False

def check_package(package):
    """Verifica si un paquete está instalado"""
    try:
        __import__(package)
        return True
    except ImportError:
        return False

def main():
    print("🚀 Instalador de Dependencias para ML - MovieMatch")
    print("=" * 50)
    
    # Lista de paquetes requeridos
    required_packages = [
        "pandas",
        "numpy", 
        "scikit-learn",
        "joblib",
        "matplotlib",
        "seaborn",
        "psycopg2-binary"
    ]
    
    print("📦 Verificando paquetes instalados...")
    
    installed_count = 0
    total_packages = len(required_packages)
    
    for package in required_packages:
        if check_package(package):
            print(f"✅ {package} ya está instalado")
            installed_count += 1
        else:
            print(f"📥 Instalando {package}...")
            if install_package(package):
                installed_count += 1
    
    print(f"\n📊 Resumen:")
    print(f"   Paquetes instalados: {installed_count}/{total_packages}")
    
    if installed_count == total_packages:
        print("🎉 ¡Todas las dependencias están instaladas!")
        print("\n📋 Próximos pasos:")
        print("1. Ejecuta: python generate_enhanced_training_dataset.py")
        print("2. Ve a models/ y ejecuta: python train_enhanced_model.py")
        print("3. Prueba el modelo: python test_enhanced_model.py")
    else:
        print("⚠️  Algunos paquetes no se pudieron instalar")
        print("💡 Intenta instalarlos manualmente:")
        for package in required_packages:
            if not check_package(package):
                print(f"   pip install {package}")

if __name__ == "__main__":
    main() 