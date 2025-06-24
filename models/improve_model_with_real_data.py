import joblib
import pandas as pd
import numpy as np
import psycopg2
from psycopg2.extras import RealDictCursor
import os
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score
import matplotlib.pyplot as plt
import seaborn as sns

# Cargar variables de entorno (opcional)
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    print("⚠️  python-dotenv no disponible, usando valores por defecto")

class ModelImprover:
    def __init__(self):
        self.db_connection = None
        self.original_model = None
        self.connect_db()
        self.load_original_model()
    
    def connect_db(self):
        """Conectar a la base de datos"""
        try:
            # Usar variables de entorno o valores por defecto
            db_host = os.getenv('DB_HOST', 'localhost')
            db_name = os.getenv('DB_NAME', 'MovieMatch')
            db_user = os.getenv('DB_USER', 'postgres')
            db_password = os.getenv('DB_PASSWORD', 'admin')
            db_port = os.getenv('DB_PORT', '5432')
            
            print(f"🔌 Conectando a: {db_host}:{db_port}/{db_name}")
            
            self.db_connection = psycopg2.connect(
                host=db_host,
                database=db_name,
                user=db_user,
                password=db_password,
                port=db_port
            )
            print("✅ Conexión a base de datos establecida")
        except Exception as e:
            print(f"❌ Error conectando a la base de datos: {e}")
            print("💡 Asegúrate de que PostgreSQL esté corriendo y las credenciales sean correctas")
            self.db_connection = None
    
    def load_original_model(self):
        """Cargar modelo original"""
        try:
            self.original_model = joblib.load("balanced_recommender_model.pkl")
            print("✅ Modelo original cargado")
        except FileNotFoundError:
            print("⚠️  Modelo original no encontrado")
            self.original_model = None
    
    def collect_real_user_data(self):
        """Recolectar datos reales de usuarios"""
        if not self.db_connection:
            return None
        
        print("📊 Recolectando datos reales de usuarios...")
        
        try:
            with self.db_connection.cursor(cursor_factory=RealDictCursor) as cursor:
                # Obtener usuarios con calificaciones
                cursor.execute("""
                    SELECT DISTINCT u.id, u.favorite_genres
                    FROM users u
                    JOIN user_movies um ON u.id = um.user_id
                    WHERE um.rating IS NOT NULL
                    AND u.favorite_genres IS NOT NULL
                    AND array_length(u.favorite_genres, 1) > 0
                """)
                users = cursor.fetchall()
                
                print(f"👥 Encontrados {len(users)} usuarios con calificaciones")
                
                all_data = []
                
                for user in users:
                    user_id = user['id']
                    favorite_genres = user['favorite_genres'] or []
                    
                    # Obtener calificaciones del usuario
                    cursor.execute("""
                        SELECT um.movie_id, um.rating, m.genre_ids, m.vote_average, 
                               m.vote_count, m.release_date, m.popularity
                        FROM user_movies um
                        JOIN movies m ON um.movie_id = m.id
                        WHERE um.user_id = %s AND um.rating IS NOT NULL
                    """, (user_id,))
                    ratings = cursor.fetchall()
                    
                    if len(ratings) < 3:  # Solo usuarios con al menos 3 calificaciones
                        continue
                    
                    # Obtener estadísticas del usuario
                    cursor.execute("""
                        SELECT 
                            AVG(rating) as avg_user_rating,
                            COUNT(*) as user_num_rated
                        FROM user_movies 
                        WHERE user_id = %s AND rating IS NOT NULL
                    """, (user_id,))
                    user_stats = cursor.fetchone()
                    avg_user_rating = float(user_stats['avg_user_rating'] or 3.5)
                    user_num_rated = int(user_stats['user_num_rated'] or 0)
                    
                    # Procesar cada calificación
                    for rating in ratings:
                        movie_genres = rating['genre_ids'] or []
                        
                        # Calcular características
                        shared_genres = [g for g in favorite_genres if g in movie_genres]
                        n_shared_genres = len(shared_genres)
                        genre_match_ratio = len(shared_genres) / len(movie_genres) if movie_genres else 0
                        is_favorite_genre = 1 if n_shared_genres > 0 else 0
                        
                        # Años desde lanzamiento
                        current_year = 2024
                        release_year = 2020  # default
                        if rating['release_date']:
                            try:
                                release_year = int(str(rating['release_date'])[:4])
                            except:
                                pass
                        years_since_release = current_year - release_year
                        
                        # Verificar si fue recomendada
                        cursor.execute("""
                            SELECT 1 FROM movie_recommendations 
                            WHERE receiver_id = %s AND movie_id = %s
                        """, (user_id, rating['movie_id']))
                        was_recommended = 1 if cursor.fetchone() else 0
                        
                        # Target: 1 si rating >= 4, 0 si < 4
                        liked = 1 if rating['rating'] >= 4 else 0
                        
                        data_point = {
                            'user_id': user_id,
                            'movie_id': rating['movie_id'],
                            'n_shared_genres': n_shared_genres,
                            'genre_match_ratio': round(genre_match_ratio, 3),
                            'vote_average': float(rating['vote_average'] or 0),
                            'vote_count': int(rating['vote_count'] or 0),
                            'popularity': float(rating['popularity'] or 0),
                            'years_since_release': years_since_release,
                            'is_favorite_genre': is_favorite_genre,
                            'was_recommended': was_recommended,
                            'avg_user_rating': round(avg_user_rating, 2),
                            'user_num_rated': user_num_rated,
                            'liked': liked,
                            'real_rating': rating['rating']
                        }
                        
                        all_data.append(data_point)
                
                print(f"📈 Recolectados {len(all_data)} puntos de datos reales")
                return all_data
                
        except Exception as e:
            print(f"❌ Error recolectando datos: {e}")
            return None
    
    def analyze_real_data(self, data):
        """Analizar los datos reales recolectados"""
        if not data:
            return
        
        df = pd.DataFrame(data)
        
        print(f"\n📊 ANÁLISIS DE DATOS REALES")
        print("=" * 50)
        
        print(f"Total de puntos de datos: {len(df)}")
        print(f"Usuarios únicos: {df['user_id'].nunique()}")
        print(f"Películas únicas: {df['movie_id'].nunique()}")
        
        # Balance de clases
        class_counts = df['liked'].value_counts()
        print(f"\nBalance de clases:")
        print(f"   No gustó (0): {class_counts[0]} ({class_counts[0]/len(df)*100:.1f}%)")
        print(f"   Gustó (1): {class_counts[1]} ({class_counts[1]/len(df)*100:.1f}%)")
        
        # Estadísticas de características
        feature_columns = [
            'n_shared_genres', 'genre_match_ratio', 'vote_average', 'vote_count',
            'popularity', 'years_since_release', 'is_favorite_genre', 
            'was_recommended', 'avg_user_rating', 'user_num_rated'
        ]
        
        print(f"\nEstadísticas de características:")
        for feature in feature_columns:
            if feature in df.columns:
                mean_val = df[feature].mean()
                std_val = df[feature].std()
                print(f"   {feature}: {mean_val:.3f} ± {std_val:.3f}")
        
        # Correlación con target
        print(f"\nCorrelación con 'liked':")
        for feature in feature_columns:
            if feature in df.columns:
                corr = df[feature].corr(df['liked'])
                print(f"   {feature}: {corr:.3f}")
        
        return df
    
    def train_improved_model(self, df):
        """Entrenar modelo mejorado con datos reales"""
        if df is None or len(df) < 10:
            print("❌ No hay suficientes datos para entrenar")
            return None
        
        print(f"\n🤖 ENTRENANDO MODELO MEJORADO")
        print("=" * 50)
        
        # Preparar datos
        feature_columns = [
            'n_shared_genres', 'genre_match_ratio', 'vote_average', 'vote_count',
            'popularity', 'years_since_release', 'is_favorite_genre', 
            'was_recommended', 'avg_user_rating', 'user_num_rated'
        ]
        
        X = df[feature_columns]
        y = df['liked']
        
        # Dividir datos
        self.X_train, self.X_test, self.y_train, self.y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )
        
        print(f"Datos de entrenamiento: {len(self.X_train)}")
        print(f"Datos de prueba: {len(self.X_test)}")
        
        # Escalar características
        scaler = StandardScaler()
        self.X_train_scaled = scaler.fit_transform(self.X_train)
        self.X_test_scaled = scaler.transform(self.X_test)
        
        # Entrenar modelo
        model = RandomForestClassifier(
            n_estimators=100,
            max_depth=10,
            random_state=42,
            class_weight='balanced'
        )
        
        print("🔄 Entrenando modelo...")
        model.fit(self.X_train_scaled, self.y_train)
        
        # Evaluar modelo
        y_pred = model.predict(self.X_test_scaled)
        y_pred_proba = model.predict_proba(self.X_test_scaled)
        
        accuracy = accuracy_score(self.y_test, y_pred)
        
        print(f"\n📈 RESULTADOS DEL MODELO MEJORADO")
        print("=" * 50)
        print(f"Accuracy: {accuracy:.4f}")
        
        # Validación cruzada
        cv_scores = cross_val_score(model, self.X_train_scaled, self.y_train, cv=5, scoring='accuracy')
        print(f"CV Accuracy: {cv_scores.mean():.4f} (+/- {cv_scores.std() * 2:.4f})")
        
        # Reporte de clasificación
        print(f"\n📊 Reporte de clasificación:")
        print(classification_report(self.y_test, y_pred, target_names=['No gustó', 'Gustó']))
        
        # Matriz de confusión
        cm = confusion_matrix(self.y_test, y_pred)
        print(f"\n🎯 Matriz de confusión:")
        print(cm)
        
        # Guardar modelo mejorado
        improved_model_data = {
            'model': model,
            'scaler': scaler,
            'model_info': {
                'type': 'RandomForestClassifier',
                'features': feature_columns,
                'improved': True,
                'real_data_training': True,
                'training_samples': len(self.X_train),
                'test_samples': len(self.X_test),
                'accuracy': accuracy,
                'cv_accuracy': cv_scores.mean()
            }
        }
        
        joblib.dump(improved_model_data, 'improved_recommender_model.pkl')
        print(f"\n✅ Modelo mejorado guardado como 'improved_recommender_model.pkl'")
        
        # Crear visualización
        self.create_improvement_visualization(model, feature_columns, self.X_test_scaled, self.y_test, y_pred_proba)
        
        return improved_model_data
    
    def create_improvement_visualization(self, model, feature_columns, X_test, y_test, y_pred_proba):
        """Crear visualizaciones del modelo mejorado"""
        print(f"\n📊 Creando visualizaciones...")
        
        plt.figure(figsize=(15, 10))
        
        # 1. Importancia de características
        plt.subplot(2, 3, 1)
        importances = model.feature_importances_
        feature_importance = list(zip(feature_columns, importances))
        feature_importance.sort(key=lambda x: x[1], reverse=True)
        
        features, importances = zip(*feature_importance)
        plt.barh(range(len(features)), importances)
        plt.yticks(range(len(features)), features)
        plt.xlabel('Importancia')
        plt.title('Importancia de Características')
        
        # 2. Distribución de probabilidades
        plt.subplot(2, 3, 2)
        prob_like = y_pred_proba[:, 1]
        plt.hist(prob_like[y_test == 0], alpha=0.5, label='No gustó', bins=20)
        plt.hist(prob_like[y_test == 1], alpha=0.5, label='Gustó', bins=20)
        plt.xlabel('Probabilidad de "Me gusta"')
        plt.ylabel('Frecuencia')
        plt.title('Distribución de Probabilidades')
        plt.legend()
        
        # 3. Matriz de confusión
        plt.subplot(2, 3, 3)
        cm = confusion_matrix(y_test, model.predict(X_test))
        sns.heatmap(cm, annot=True, fmt='d', cmap='Blues',
                   xticklabels=['No gustó', 'Gustó'],
                   yticklabels=['No gustó', 'Gustó'])
        plt.title('Matriz de Confusión')
        plt.ylabel('Real')
        plt.xlabel('Predicción')
        
        # 4. Comparación con modelo original (si está disponible)
        if self.original_model:
            plt.subplot(2, 3, 4)
            # Aquí podrías agregar comparación con el modelo original
            plt.text(0.5, 0.5, 'Comparación con\nmodelo original\n(implementar)', 
                    ha='center', va='center', transform=plt.gca().transAxes)
            plt.title('Comparación de Modelos')
            plt.axis('off')
        
        plt.tight_layout()
        plt.savefig('improved_model_analysis.png', dpi=300, bbox_inches='tight')
        plt.show()
        
        print("✅ Visualizaciones guardadas en 'improved_model_analysis.png'")
    
    def compare_models(self, improved_model):
        """Compara el modelo original con el mejorado"""
        print("\n🔄 COMPARANDO MODELOS")
        print("=" * 50)
        
        # Evaluar modelo original
        original_accuracy = self.evaluate_model(self.original_model, self.X_test, self.y_test)
        improved_accuracy = self.evaluate_model(improved_model, self.X_test, self.y_test)
        
        print(f"Modelo original accuracy: {original_accuracy:.4f}")
        print(f"Modelo mejorado accuracy: {improved_accuracy:.4f}")
        
        # Calcular mejora evitando división por cero
        if original_accuracy > 0:
            improvement = ((improved_accuracy - original_accuracy) / original_accuracy) * 100
            print(f"📈 Mejora: {improvement:.2f}%")
        else:
            print(f"📈 Mejora: El modelo original tenía accuracy 0, el mejorado tiene {improved_accuracy:.2f} ({improved_accuracy*100:.1f}%)")
        
        # Crear gráfico de comparación
        self.plot_model_comparison(original_accuracy, improved_accuracy)
    
    def evaluate_model(self, model, X_test, y_test):
        """Evalúa un modelo y retorna su accuracy"""
        try:
            # Si el modelo es un diccionario (como se guarda), extraer el modelo real
            if isinstance(model, dict):
                actual_model = model['model']
                scaler = model['scaler']
                # Escalar los datos de prueba
                X_test_scaled = scaler.transform(X_test)
                y_pred = actual_model.predict(X_test_scaled)
            else:
                # Si es un modelo directo
                y_pred = model.predict(X_test)
            
            accuracy = accuracy_score(y_test, y_pred)
            return accuracy
        except Exception as e:
            print(f"⚠️  Error evaluando modelo: {e}")
            return 0.0
    
    def plot_model_comparison(self, original_accuracy, improved_accuracy):
        """Crea un gráfico comparando los modelos"""
        try:
            import matplotlib.pyplot as plt
            
            models = ['Modelo Original', 'Modelo Mejorado']
            accuracies = [original_accuracy, improved_accuracy]
            colors = ['#ff6b6b', '#51cf66']
            
            plt.figure(figsize=(10, 6))
            bars = plt.bar(models, accuracies, color=colors, alpha=0.8)
            
            # Agregar valores en las barras
            for bar, acc in zip(bars, accuracies):
                height = bar.get_height()
                plt.text(bar.get_x() + bar.get_width()/2., height + 0.01,
                        f'{acc:.1%}', ha='center', va='bottom', fontweight='bold')
            
            plt.title('Comparación de Accuracy: Modelo Original vs Mejorado', fontsize=14, fontweight='bold')
            plt.ylabel('Accuracy', fontsize=12)
            plt.ylim(0, 1.1)
            plt.grid(axis='y', alpha=0.3)
            
            # Agregar línea de mejora
            if improved_accuracy > original_accuracy:
                plt.annotate(f'Mejora: +{(improved_accuracy-original_accuracy)*100:.1f}%',
                            xy=(1, improved_accuracy), xytext=(0.5, improved_accuracy + 0.1),
                            arrowprops=dict(arrowstyle='->', color='green', lw=2),
                            fontsize=12, ha='center', color='green', fontweight='bold')
            
            plt.tight_layout()
            plt.savefig('model_comparison.png', dpi=300, bbox_inches='tight')
            plt.close()
            
            print("✅ Gráfico de comparación guardado como 'model_comparison.png'")
            
        except Exception as e:
            print(f"⚠️  Error creando gráfico de comparación: {e}")
    
    def close(self):
        """Cerrar conexiones"""
        if self.db_connection:
            self.db_connection.close()

def main():
    """Función principal"""
    print("🚀 MEJORADOR DE MODELO CON DATOS REALES")
    print("=" * 60)
    
    improver = ModelImprover()
    
    try:
        # 1. Recolectar datos reales
        real_data = improver.collect_real_user_data()
        
        if not real_data:
            print("❌ No se pudieron recolectar datos reales")
            return
        
        # 2. Analizar datos
        df = improver.analyze_real_data(real_data)
        
        # 3. Entrenar modelo mejorado
        improved_model = improver.train_improved_model(df)
        
        if improved_model:
            # 4. Comparar con modelo original
            improver.compare_models(improved_model)
            
            print(f"\n🎉 ¡Modelo mejorado entrenado exitosamente!")
            print(f"📁 Archivo: improved_recommender_model.pkl")
            print(f"📊 Visualización: improved_model_analysis.png")
        
    except Exception as e:
        print(f"❌ Error durante la mejora del modelo: {e}")
        import traceback
        traceback.print_exc()
    finally:
        improver.close()

if __name__ == "__main__":
    main() 