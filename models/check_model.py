import joblib
import pandas as pd

print("🔍 Verificando modelo improved_recommender_model.pkl")
print("=" * 50)

try:
    # Cargar modelo
    model = joblib.load('improved_recommender_model.pkl')
    
    print(f"Tipo de modelo: {type(model)}")
    print(f"Es diccionario: {isinstance(model, dict)}")
    
    if isinstance(model, dict):
        print("✅ Es un diccionario con metadatos")
        print(f"Claves disponibles: {list(model.keys())}")
        if 'model_info' in model:
            print(f"Características: {model['model_info'].get('features', 'No disponible')}")
        if 'model' in model:
            actual_model = model['model']
            print(f"Número de características del modelo: {actual_model.n_features_in_}")
            if hasattr(actual_model, 'feature_names_in_'):
                print(f"Nombres de características: {actual_model.feature_names_in_}")
    else:
        print("⚠️ Es solo el modelo sklearn (sin metadatos)")
        print(f"Número de características: {model.n_features_in_}")
        if hasattr(model, 'feature_names_in_'):
            print(f"Nombres de características: {model.feature_names_in_}")
        else:
            print("❌ No tiene nombres de características guardados")
            
except Exception as e:
    print(f"❌ Error cargando modelo: {e}")

print("\n🔍 Verificando modelo recommender_model.pkl")
print("=" * 50)

try:
    # Cargar modelo original
    model_orig = joblib.load('recommender_model.pkl')
    
    print(f"Tipo de modelo: {type(model_orig)}")
    print(f"Es diccionario: {isinstance(model_orig, dict)}")
    
    if isinstance(model_orig, dict):
        print("✅ Es un diccionario con metadatos")
        print(f"Claves disponibles: {list(model_orig.keys())}")
        if 'model_info' in model_orig:
            print(f"Características: {model_orig['model_info'].get('features', 'No disponible')}")
    else:
        print("⚠️ Es solo el modelo sklearn (sin metadatos)")
        print(f"Número de características: {model_orig.n_features_in_}")
        if hasattr(model_orig, 'feature_names_in_'):
            print(f"Nombres de características: {model_orig.feature_names_in_}")
            
except Exception as e:
    print(f"❌ Error cargando modelo original: {e}") 