import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score
import joblib

import matplotlib.pyplot as plt

# === 1. Cargar y validar los datos ===
df = pd.read_csv("data.csv")

# Verificar columnas necesarias
expected_columns = {'n_shared_genres', 'vote_average', 'vote_count', 'is_favorite_genre', 'years_since_release', 'popularity', 'rating'}
if not expected_columns.issubset(df.columns):
    raise ValueError(f"Faltan columnas necesarias: {expected_columns - set(df.columns)}")

# Eliminar filas nulas si existen
df.dropna(subset=list(expected_columns), inplace=True)

# === 2. Ingeniería de características mínima ===
# Convertimos rating a binario: 1 si le gustó (rating >= 4), 0 si no
df['liked'] = df['rating'].apply(lambda x: 1 if x >= 4 else 0)

# === 3. Definir X (features) y y (target) ===
feature_cols = ['n_shared_genres', 'vote_average', 'vote_count', 'is_favorite_genre', 'years_since_release', 'popularity']
X = df[feature_cols]
y = df['liked']

# === 4. Dividir en entrenamiento y prueba ===
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, stratify=y, random_state=42
)

# === 5. Entrenar modelo Random Forest ===
model = RandomForestClassifier(
    n_estimators=300,
    max_depth=None,
    random_state=42,
    n_jobs=-1
)
model.fit(X_train, y_train)

# === 6. Evaluar el modelo ===
y_pred = model.predict(X_test)

importances = model.feature_importances_
features = feature_cols

# Visualizar
plt.barh(features, importances)
plt.xlabel("Importancia")
plt.title("Importancia de características del modelo")
plt.tight_layout()
plt.show()

print(df['liked'].value_counts(normalize=True))


print("=== Matriz de Confusión ===")
print(confusion_matrix(y_test, y_pred))

print("\n=== Reporte de Clasificación ===")
print(classification_report(y_test, y_pred))

print(f"\nAccuracy: {accuracy_score(y_test, y_pred):.4f}")

# === 7. Guardar el modelo entrenado ===
joblib.dump(model, "recommender_model.pkl")
print("\n✅ Modelo guardado exitosamente como 'recommender_model.pkl'")
