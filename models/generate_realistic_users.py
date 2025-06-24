import psycopg2
from psycopg2.extras import RealDictCursor
import os
import random
import numpy as np
from datetime import datetime
import hashlib

# Listas de nombres y apellidos realistas
FIRST_NAMES = [
    "Sofía", "Mateo", "Valentina", "Santiago", "Isabella", "Sebastián", "Camila", "Emiliano", "Victoria", "Martín",
    "Lucía", "Diego", "Mariana", "Daniel", "Gabriela", "David", "Sara", "Andrés", "Paula", "Joaquín",
    "Alejandro", "María", "Tomás", "Antonella", "Lucas", "Renata", "Samuel", "Julieta", "Benjamín", "Mía",
    "Juan", "Emma", "Felipe", "Regina", "Dylan", "Catalina", "Adrián", "Ariana", "Gabriel", "Nicole"
]
LAST_NAMES = [
    "García", "Martínez", "Rodríguez", "López", "Hernández", "González", "Pérez", "Sánchez", "Ramírez", "Cruz",
    "Flores", "Rivera", "Gómez", "Díaz", "Torres", "Vargas", "Castro", "Morales", "Ortiz", "Ramos",
    "Silva", "Romero", "Mendoza", "Herrera", "Jiménez", "Ruiz", "Aguilar", "Moreno", "Muñoz", "Molina",
    "Salazar", "Delgado", "Paredes", "Navarro", "Campos", "Vega", "Soto", "Peña", "Cabrera", "Rojas"
]

# Comentarios realistas por calificación
COMMENTS_BY_RATING = {
    5: [
        "¡Una obra maestra absoluta! No puedo dejar de recomendarla.",
        "Simplemente perfecta. Una de las mejores películas que he visto.",
        "¡Increíble! Me encantó cada minuto de esta película.",
        "Una experiencia cinematográfica excepcional. 10/10.",
        "¡Brillante! Esta película superó todas mis expectativas.",
        "Una joya del cine. Definitivamente la veré muchas veces más.",
        "¡Espectacular! No puedo creer lo buena que es esta película.",
        "Una película que te marca para siempre. Absolutamente genial.",
        "¡Perfecta! Cada detalle está cuidado al máximo.",
        "Una obra de arte. Me dejó sin palabras."
    ],
    4: [
        "Muy buena película, la disfruté mucho.",
        "Excelente entretenimiento. Definitivamente la recomiendo.",
        "Una película sólida con buenas actuaciones.",
        "Me gustó bastante, tiene momentos memorables.",
        "Buena historia y buena dirección. Vale la pena verla.",
        "Entretenida y bien hecha. Me sorprendió gratamente.",
        "Una película que cumple con lo que promete.",
        "Buena calidad cinematográfica. La disfruté.",
        "Interesante y bien ejecutada. Recomendada.",
        "Una película que te mantiene interesado hasta el final."
    ],
    3: [
        "Está bien, pero no es nada del otro mundo.",
        "Pasable, tiene sus momentos buenos y malos.",
        "Una película promedio, ni muy buena ni muy mala.",
        "Entretenida pero olvidable.",
        "Cumple su función de entretener, pero no más.",
        "Regular, no me decepcionó pero tampoco me sorprendió.",
        "Una película que puedes ver una vez y ya.",
        "Ni buena ni mala, simplemente normal.",
        "Tiene algunas cosas buenas pero también defectos.",
        "Una película que no destaca especialmente."
    ],
    2: [
        "No me gustó mucho, tiene varios problemas.",
        "Discreta, esperaba más de esta película.",
        "No es muy buena, pero tampoco es terrible.",
        "Tiene algunos momentos buenos pero en general es débil.",
        "No la recomendaría, pero tampoco es la peor.",
        "Una película que no cumple las expectativas.",
        "Tiene fallas evidentes pero no es completamente mala.",
        "No me convenció, pero tiene algún mérito.",
        "Una película que podría haber sido mejor.",
        "No es lo que esperaba, pero no es horrible."
    ],
    1: [
        "Muy mala película, no la recomiendo para nada.",
        "Una pérdida de tiempo total.",
        "Terrible, no entiendo cómo se hizo esta película.",
        "Una de las peores películas que he visto.",
        "Horrible, no tiene nada de bueno.",
        "Una película que debería ser olvidada.",
        "Pésima calidad, no vale la pena verla.",
        "Una decepción total, no la recomiendo.",
        "Muy mala, no entiendo las buenas críticas.",
        "Una película que me arrepiento de haber visto."
    ]
}

# Cargar variables de entorno (opcional)
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    print("⚠️  python-dotenv no disponible, usando valores por defecto")

class RealisticUserGenerator:
    def __init__(self):
        self.db_connection = None
        self.connect_db()
        self.used_emails = set()
        self.used_names = set()
        # Definir géneros de TMDB con sus IDs
        self.genres = {
            28: "Acción", 12: "Aventura", 16: "Animación", 35: "Comedia", 
            80: "Crimen", 99: "Documental", 18: "Drama", 10751: "Familiar",
            14: "Fantasía", 36: "Historia", 27: "Terror", 10402: "Música",
            9648: "Misterio", 10749: "Romance", 878: "Ciencia ficción",
            10770: "Película de TV", 53: "Suspenso", 10752: "Guerra",
            37: "Western"
        }
        # Perfiles de gustos (igual que antes)
        self.user_profiles = [
            {"genres": [27]}, {"genres": [16]}, {"genres": [28]}, {"genres": [35]}, {"genres": [18]}, {"genres": [878]},
            {"genres": [27, 28]}, {"genres": [16, 35]}, {"genres": [18, 10749]}, {"genres": [878, 53]},
            {"genres": [28, 35]}, {"genres": [27, 53]}, {"genres": [16, 12]}, {"genres": [18, 80]},
            {"genres": [16, 35, 10751]}, {"genres": [28, 12, 53]}, {"genres": [27, 80, 53]}, {"genres": [35, 10749, 16]},
            {"genres": [18, 14, 12]}, {"genres": [878, 9648, 53]}, {"genres": [28, 35, 18, 16]}, {"genres": [12, 14, 28, 10751]},
            {"genres": [27, 80, 53, 18]}, {"genres": [35, 16, 10749, 10751]}, {"genres": [27, 16]}, {"genres": [878, 10749]},
            {"genres": [10752, 18]}, {"genres": [10402, 99]}, {"genres": [37, 28]}
        ]
    def connect_db(self):
        try:
            db_host = os.getenv('DB_HOST', 'switchyard.proxy.rlwy.net')
            db_name = os.getenv('DB_NAME', 'railway')
            db_user = os.getenv('DB_USER', 'postgres')
            db_password = os.getenv('DB_PASSWORD', 'vdphatjluNLYdQuzOIofuSMYQvxGnQgx')
            db_port = os.getenv('DB_PORT', '43162')
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
            self.db_connection = None
    def get_movies_by_genres(self, genre_ids):
        if not self.db_connection:
            return []
        try:
            with self.db_connection.cursor(cursor_factory=RealDictCursor) as cursor:
                genre_conditions = [f"{genre_id} = ANY(genre_ids)" for genre_id in genre_ids]
                query = f"""
                    SELECT id, title, genre_ids, vote_average, vote_count, popularity
                    FROM movies 
                    WHERE ({' OR '.join(genre_conditions)})
                    AND vote_count > 100
                    ORDER BY popularity DESC
                    LIMIT 200
                """
                cursor.execute(query)
                return cursor.fetchall()
        except Exception as e:
            print(f"❌ Error obteniendo películas: {e}")
            return []
    def generate_realistic_rating(self, user_genres, movie_genres, movie_quality, randomness=0.3):
        shared_genres = set(user_genres) & set(movie_genres)
        genre_match_ratio = len(shared_genres) / len(user_genres) if user_genres else 0
        if genre_match_ratio >= 0.5:
            base_rating = 4.5
        elif genre_match_ratio >= 0.25:
            base_rating = 3.5
        else:
            base_rating = 2.0
        quality_bonus = (movie_quality - 5) * 0.1
        base_rating += quality_bonus
        random_factor = random.uniform(-randomness, randomness)
        final_rating = base_rating + random_factor
        final_rating = max(1, min(5, final_rating))
        return round(final_rating)
    def generate_gravatar_url(self, email):
        """Genera una URL de Gravatar basada en el email"""
        email_hash = hashlib.md5(email.lower().encode()).hexdigest()
        # Usar diferentes tipos de avatares para variedad
        avatar_types = ['identicon', 'monsterid', 'wavatar', 'retro', 'robohash']
        avatar_type = random.choice(avatar_types)
        return f"https://www.gravatar.com/avatar/{email_hash}?d={avatar_type}&s=200"
    def generate_comment(self, rating):
        """Genera un comentario realista basado en la calificación"""
        comments = COMMENTS_BY_RATING.get(rating, COMMENTS_BY_RATING[3])
        return random.choice(comments)
    def generate_unique_name_email(self):
        while True:
            first = random.choice(FIRST_NAMES)
            last = random.choice(LAST_NAMES)
            name = f"{first} {last}"
            email = f"{first.lower()}.{last.lower()}{random.randint(1000,9999)}@example.com"
            if email not in self.used_emails and name not in self.used_names:
                self.used_emails.add(email)
                self.used_names.add(name)
                return name, email
    def create_user_with_ratings(self, profile):
        if not self.db_connection:
            return False
        movies = self.get_movies_by_genres(profile['genres'])
        if not movies or len(movies) < 10:
            return False
        try:
            with self.db_connection.cursor() as cursor:
                name, email = self.generate_unique_name_email()
                gravatar_url = self.generate_gravatar_url(email)
                
                cursor.execute("""
                    INSERT INTO users (name, email, password, favorite_genres, gravatar, created_at)
                    VALUES (%s, %s, %s, %s, %s, %s)
                    RETURNING id
                """, (
                    name,
                    email,
                    "hashed_password_123",
                    profile['genres'],
                    gravatar_url,
                    datetime.now()
                ))
                user_db_id = cursor.fetchone()[0]
                
                num_ratings = random.randint(15, 40)
                selected_movies = random.sample(movies, min(num_ratings, len(movies)))
                
                for movie in selected_movies:
                    movie_quality = (movie['vote_average'] + (movie['popularity'] / 20)) / 2
                    rating = self.generate_realistic_rating(
                        profile['genres'], movie['genre_ids'] or [], movie_quality)
                    comment = self.generate_comment(rating)
                    
                    cursor.execute("""
                        INSERT INTO user_movies (user_id, movie_id, rating, comment, created_at)
                        VALUES (%s, %s, %s, %s, %s)
                    """, (
                        user_db_id,
                        movie['id'],
                        rating,
                        comment,
                        datetime.now()
                    ))
                
                self.db_connection.commit()
                print(f"✅ Usuario {name} creado con {len(selected_movies)} calificaciones y avatar")
                return True
        except Exception as e:
            print(f"❌ Error creando usuario: {e}")
            self.db_connection.rollback()
            return False
    def generate_users(self, num_users=1000):
        if not self.db_connection:
            print("❌ No hay conexión a la base de datos")
            return
        print(f"🚀 GENERANDO {num_users} USUARIOS REALISTAS")
        print("=" * 60)
        print("✨ Incluyendo: Avatares Gravatar + Comentarios realistas")
        print("=" * 60)
        
        num_profiles = len(self.user_profiles)
        users_per_profile = num_users // num_profiles
        extra_users = num_users % num_profiles
        successful_users = 0
        
        for i, profile in enumerate(self.user_profiles):
            profile_users = users_per_profile + (1 if i < extra_users else 0)
            created = 0
            for _ in range(profile_users):
                if self.create_user_with_ratings(profile):
                    successful_users += 1
                    created += 1
                if successful_users % 50 == 0:
                    print(f"📊 Progreso: {successful_users}/{num_users} usuarios creados")
            print(f"👥 Perfil {i+1}/{num_profiles}: {created} usuarios creados para géneros {profile['genres']}")
        
        print(f"\n🎉 ¡GENERACIÓN COMPLETADA!")
        print(f"✅ Usuarios creados exitosamente: {successful_users}")
        print(f"📊 Promedio de calificaciones por usuario: ~25-30")
        print(f"🎯 Total de calificaciones generadas: ~{successful_users * 25}")
        print(f"💬 Comentarios realistas incluidos en cada calificación")
        print(f"🖼️  Avatares Gravatar únicos para cada usuario")
        self.show_genre_statistics()
    def show_genre_statistics(self):
        if not self.db_connection:
            return
        try:
            with self.db_connection.cursor(cursor_factory=RealDictCursor) as cursor:
                cursor.execute("""
                    SELECT favorite_genres, COUNT(*) as user_count
                    FROM users 
                    WHERE favorite_genres IS NOT NULL
                    GROUP BY favorite_genres
                    ORDER BY user_count DESC
                """)
                results = cursor.fetchall()
                print(f"\n📊 ESTADÍSTICAS DE GÉNEROS FAVORITOS")
                print("=" * 50)
                for result in results[:10]:
                    genres = result['favorite_genres']
                    genre_names = [self.genres.get(g, f'ID_{g}') for g in genres]
                    print(f"   {genre_names}: {result['user_count']} usuarios")
        except Exception as e:
            print(f"❌ Error obteniendo estadísticas: {e}")
    def close(self):
        if self.db_connection:
            self.db_connection.close()
def main():
    print("🎭 GENERADOR DE USUARIOS REALISTAS MEJORADO")
    print("=" * 60)
    print("✨ Nuevas características:")
    print("   • Avatares Gravatar únicos para cada usuario")
    print("   • Comentarios realistas basados en calificaciones")
    print("   • 1000 usuarios con perfiles variados")
    print("=" * 60)
    
    generator = RealisticUserGenerator()
    try:
        generator.generate_users(1000)
        print(f"\n🎯 PRÓXIMOS PASOS:")
        print("1. Ejecuta 'python improve_model_with_real_data.py' para reentrenar el modelo")
        print("2. El nuevo modelo tendrá muchos más datos realistas para aprender")
        print("3. Las predicciones serán más precisas y variadas")
        print("4. Los usuarios tendrán avatares y comentarios realistas")
    except Exception as e:
        print(f"❌ Error durante la generación: {e}")
        import traceback
        traceback.print_exc()
    finally:
        generator.close()
if __name__ == "__main__":
    main() 