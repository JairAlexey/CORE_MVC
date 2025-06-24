import joblib
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score, precision_score, recall_score, f1_score, roc_auc_score
from sklearn.model_selection import cross_val_score, StratifiedKFold

class ModelComparator:
    def __init__(self):
        self.original_model = None
        self.balanced_model = None
        self.test_data = None
        self.X_test = None
        self.y_test = None
        
    def load_models(self):
        """Carga ambos modelos"""
        print("📂 Cargando modelos...")
        
        try:
            # Cargar modelo original
            self.original_model = joblib.load('enhanced_recommender_model.pkl')
            print("✅ Modelo original cargado")
        except FileNotFoundError:
            print("⚠️  Modelo original no encontrado")
            self.original_model = None
        
        try:
            # Cargar modelo balanceado
            self.balanced_model = joblib.load('balanced_recommender_model.pkl')
            print("✅ Modelo balanceado cargado")
        except FileNotFoundError:
            print("⚠️  Modelo balanceado no encontrado")
            self.balanced_model = None
    
    def load_test_data(self, file_path='balanced_training_data.csv'):
        """Carga datos de prueba"""
        print(f"📊 Cargando datos de prueba desde: {file_path}")
        
        try:
            self.test_data = pd.read_csv(file_path)
            print(f"✅ Datos de prueba cargados: {len(self.test_data)} muestras")
            
            # Verificar balance
            class_counts = self.test_data['liked'].value_counts()
            print(f"📊 Balance de clases en datos de prueba:")
            print(f"   Clase 0 (no gustó): {class_counts[0]} ({class_counts[0]/len(self.test_data)*100:.1f}%)")
            print(f"   Clase 1 (gustó): {class_counts[1]} ({class_counts[1]/len(self.test_data)*100:.1f}%)")
            
        except FileNotFoundError:
            print(f"❌ No se encontró el archivo {file_path}")
            self.test_data = None
    
    def prepare_test_data(self):
        """Prepara los datos de prueba"""
        if self.test_data is None:
            return None, None
        
        feature_columns = [
            'n_shared_genres',
            'genre_match_ratio', 
            'vote_average',
            'vote_count',
            'popularity',
            'years_since_release',
            'is_favorite_genre',
            'was_recommended',
            'avg_user_rating',
            'user_num_rated'
        ]
        
        X = self.test_data[feature_columns]
        y = self.test_data['liked']
        
        return X, y
    
    def evaluate_model(self, model_data, X_test, y_test, model_name):
        """Evalúa un modelo específico"""
        if model_data is None:
            return None
        
        print(f"\n🔍 Evaluando {model_name}...")
        
        # Escalar datos si es necesario
        if 'scaler' in model_data:
            X_test_scaled = model_data['scaler'].transform(X_test)
        else:
            X_test_scaled = X_test
        
        # Hacer predicciones
        y_pred = model_data['model'].predict(X_test_scaled)
        y_pred_proba = model_data['model'].predict_proba(X_test_scaled)[:, 1]
        
        # Calcular métricas
        accuracy = accuracy_score(y_test, y_pred)
        precision = precision_score(y_test, y_pred, average='weighted')
        recall = recall_score(y_test, y_pred, average='weighted')
        f1 = f1_score(y_test, y_pred, average='weighted')
        roc_auc = roc_auc_score(y_test, y_pred_proba)
        
        # Métricas por clase
        precision_per_class = precision_score(y_test, y_pred, average=None)
        recall_per_class = recall_score(y_test, y_pred, average=None)
        f1_per_class = f1_score(y_test, y_pred, average=None)
        
        # Validación cruzada
        cv_scores = cross_val_score(
            model_data['model'], X_test_scaled, y_test,
            cv=StratifiedKFold(n_splits=5, shuffle=True, random_state=42),
            scoring='f1_weighted'
        )
        
        results = {
            'model_name': model_name,
            'accuracy': accuracy,
            'precision': precision,
            'recall': recall,
            'f1': f1,
            'roc_auc': roc_auc,
            'precision_per_class': precision_per_class,
            'recall_per_class': recall_per_class,
            'f1_per_class': f1_per_class,
            'cv_mean': cv_scores.mean(),
            'cv_std': cv_scores.std(),
            'confusion_matrix': confusion_matrix(y_test, y_pred),
            'y_pred': y_pred,
            'y_pred_proba': y_pred_proba
        }
        
        # Mostrar resultados
        print(f"📈 Métricas de {model_name}:")
        print(f"   Accuracy: {accuracy:.4f}")
        print(f"   Precision (weighted): {precision:.4f}")
        print(f"   Recall (weighted): {recall:.4f}")
        print(f"   F1-Score (weighted): {f1:.4f}")
        print(f"   ROC-AUC: {roc_auc:.4f}")
        print(f"   CV F1 (weighted): {cv_scores.mean():.4f} (+/- {cv_scores.std() * 2:.4f})")
        
        print(f"\n🎯 Métricas por clase - {model_name}:")
        for i, class_name in enumerate(['No gustó', 'Gustó']):
            print(f"   {class_name}:")
            print(f"     Precision: {precision_per_class[i]:.4f}")
            print(f"     Recall: {recall_per_class[i]:.4f}")
            print(f"     F1-Score: {f1_per_class[i]:.4f}")
        
        return results
    
    def compare_models(self):
        """Compara ambos modelos"""
        print("🔄 Comparando modelos...")
        
        # Preparar datos de prueba
        X_test, y_test = self.prepare_test_data()
        if X_test is None or y_test is None:
            print("❌ No se pudieron preparar los datos de prueba")
            return
        
        # Store test data for later use
        self.X_test = X_test
        self.y_test = y_test
        
        results = {}
        
        # Evaluar modelo original
        if self.original_model:
            results['original'] = self.evaluate_model(
                self.original_model, X_test, y_test, "Modelo Original"
            )
        
        # Evaluar modelo balanceado
        if self.balanced_model:
            results['balanced'] = self.evaluate_model(
                self.balanced_model, X_test, y_test, "Modelo Balanceado"
            )
        
        return results
    
    def create_comparison_visualization(self, results):
        """Crea visualizaciones de comparación"""
        if not results or len(results) < 2:
            print("⚠️  No hay suficientes modelos para comparar")
            return
        
        print("📊 Creando visualizaciones de comparación...")
        
        # Preparar datos para gráficos
        models = list(results.keys())
        metrics = ['accuracy', 'precision', 'recall', 'f1', 'roc_auc']
        
        # Gráfico de comparación de métricas
        plt.figure(figsize=(15, 10))
        
        # 1. Métricas generales
        plt.subplot(2, 3, 1)
        metric_values = [results[model][metric] for model in models for metric in metrics]
        metric_names = [f"{model}_{metric}" for model in models for metric in metrics]
        
        bars = plt.bar(range(len(metric_values)), metric_values)
        plt.xticks(range(len(metric_values)), metric_names, rotation=45, ha='right')
        plt.title('Comparación de Métricas Generales')
        plt.ylabel('Puntuación')
        
        # Colorear barras por modelo
        colors = ['skyblue', 'lightcoral']
        for i, bar in enumerate(bars):
            bar.set_color(colors[i // len(metrics)])
        
        # 2. Métricas por clase - Precision
        plt.subplot(2, 3, 2)
        precision_data = []
        for model in models:
            precision_data.extend(results[model]['precision_per_class'])
        
        class_names = ['No gustó', 'Gustó'] * len(models)
        model_names = [model for model in models for _ in range(2)]
        
        x_pos = np.arange(len(precision_data))
        bars = plt.bar(x_pos, precision_data)
        plt.xticks(x_pos, [f"{m}\n{c}" for m, c in zip(model_names, class_names)], rotation=45)
        plt.title('Precision por Clase')
        plt.ylabel('Precision')
        
        # Colorear barras
        for i, bar in enumerate(bars):
            bar.set_color(colors[i // 2])
        
        # 3. Métricas por clase - Recall
        plt.subplot(2, 3, 3)
        recall_data = []
        for model in models:
            recall_data.extend(results[model]['recall_per_class'])
        
        bars = plt.bar(x_pos, recall_data)
        plt.xticks(x_pos, [f"{m}\n{c}" for m, c in zip(model_names, class_names)], rotation=45)
        plt.title('Recall por Clase')
        plt.ylabel('Recall')
        
        for i, bar in enumerate(bars):
            bar.set_color(colors[i // 2])
        
        # 4. Matrices de confusión
        for i, model in enumerate(models):
            plt.subplot(2, 3, 4 + i)
            cm = results[model]['confusion_matrix']
            sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', 
                       xticklabels=['No gustó', 'Gustó'],
                       yticklabels=['No gustó', 'Gustó'])
            plt.title(f'Matriz de Confusión - {model.title()}')
            plt.ylabel('Real')
            plt.xlabel('Predicción')
        
        plt.tight_layout()
        plt.savefig('model_comparison.png', dpi=300, bbox_inches='tight')
        plt.show()
        
        # 5. Gráfico de ROC (si ambos modelos están disponibles)
        if len(results) == 2:
            plt.figure(figsize=(8, 6))
            for model in models:
                y_pred_proba = results[model]['y_pred_proba']
                from sklearn.metrics import roc_curve
                fpr, tpr, _ = roc_curve(self.y_test, y_pred_proba)
                plt.plot(fpr, tpr, label=f'{model.title()} (AUC = {results[model]["roc_auc"]:.3f})')
            
            plt.plot([0, 1], [0, 1], 'k--', label='Random')
            plt.xlabel('False Positive Rate')
            plt.ylabel('True Positive Rate')
            plt.title('Curvas ROC')
            plt.legend()
            plt.grid(True)
            plt.savefig('roc_comparison.png', dpi=300, bbox_inches='tight')
            plt.show()
    
    def generate_comparison_report(self, results):
        """Genera un reporte de comparación"""
        if not results:
            return
        
        print("📄 Generando reporte de comparación...")
        
        report = """
# Reporte de Comparación de Modelos

## 📊 Resumen de Comparación

"""
        
        # Tabla de comparación
        report += "| Métrica | " + " | ".join([model.title() for model in results.keys()]) + " |\n"
        report += "|---------|" + "|".join(["---" for _ in results.keys()]) + "|\n"
        
        metrics = ['accuracy', 'precision', 'recall', 'f1', 'roc_auc']
        metric_names = ['Accuracy', 'Precision', 'Recall', 'F1-Score', 'ROC-AUC']
        
        for metric, name in zip(metrics, metric_names):
            values = [f"{results[model][metric]:.4f}" for model in results.keys()]
            report += f"| {name} | " + " | ".join(values) + " |\n"
        
        # Comparación por clase
        report += "\n## 🎯 Comparación por Clase\n\n"
        
        for i, class_name in enumerate(['No gustó', 'Gustó']):
            report += f"### {class_name}\n\n"
            report += "| Métrica | " + " | ".join([model.title() for model in results.keys()]) + " |\n"
            report += "|---------|" + "|".join(["---" for _ in results.keys()]) + "|\n"
            
            for metric, name in zip(['precision_per_class', 'recall_per_class', 'f1_per_class'], 
                                  ['Precision', 'Recall', 'F1-Score']):
                values = [f"{results[model][metric][i]:.4f}" for model in results.keys()]
                report += f"| {name} | " + " | ".join(values) + " |\n"
            report += "\n"
        
        # Análisis de mejoras
        if len(results) == 2:
            report += "## 📈 Análisis de Mejoras\n\n"
            
            improvements = []
            for metric in metrics:
                original = results['original'][metric]
                balanced = results['balanced'][metric]
                improvement = ((balanced - original) / original) * 100
                improvements.append(improvement)
                report += f"- **{metric.title()}**: {improvement:+.2f}%\n"
            
            avg_improvement = np.mean(improvements)
            report += f"\n**Mejora promedio**: {avg_improvement:+.2f}%\n"
        
        # Guardar reporte
        with open('model_comparison_report.md', 'w', encoding='utf-8') as f:
            f.write(report)
        
        print("📄 Reporte de comparación guardado en: model_comparison_report.md")
        return report

def main():
    """Función principal"""
    print("🔄 Comparador de Modelos ML")
    print("=" * 50)
    
    comparator = ModelComparator()
    
    try:
        # 1. Cargar modelos
        comparator.load_models()
        
        # 2. Cargar datos de prueba
        comparator.load_test_data()
        
        # 3. Comparar modelos
        results = comparator.compare_models()
        
        if results:
            # 4. Crear visualizaciones
            comparator.create_comparison_visualization(results)
            
            # 5. Generar reporte
            comparator.generate_comparison_report(results)
            
            print("\n🎉 ¡Comparación completada exitosamente!")
            print("📁 Archivos generados:")
            print("   - model_comparison.png")
            print("   - roc_comparison.png")
            print("   - model_comparison_report.md")
        else:
            print("❌ No se pudieron comparar los modelos")
        
    except Exception as e:
        print(f"❌ Error durante la comparación: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main() 