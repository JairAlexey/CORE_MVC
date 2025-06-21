import csv
import random
from datetime import datetime, timedelta

# Configuración
N_USERS = 20
N_MOVIES = 100
N_USER_MOVIES = 300
N_RECOMMENDATIONS = 100

# Géneros de ejemplo (IDs de TMDB)
genre_ids = [28, 12, 16, 35, 80, 99, 18, 10751, 14, 36, 27, 10402, 9648, 10749, 878, 10770, 53, 10752, 37]
genre_names = [
    "Acción", "Aventura", "Animación", "Comedia", "Crimen", "Documental", "Drama", "Familia", "Fantasía",
    "Historia", "Terror", "Música", "Misterio", "Romance", "Ciencia ficción", "Película de TV", "Suspense", "Bélica", "Western"
]

# 1. Usuarios
users = []
for i in range(1, N_USERS + 1):
    fav_genres = random.sample(genre_ids, k=random.choice([2, 3]))
    users.append({
        'id': i,
        'name': f'Usuario{i}',
        'password': 'hashed_password',
        'email': f'user{i}@mail.com',
        'created_at': datetime.now().isoformat(),
        'updated_at': datetime.now().isoformat(),
        'favorite_genres': '{' + ','.join(map(str, fav_genres)) + '}',
        'gravatar': f'https://www.gravatar.com/avatar/{i}?d=identicon',
        'is_admin': 'FALSE'
    })

with open('fake_users.csv', 'w', newline='', encoding='utf-8') as f:
    writer = csv.DictWriter(f, fieldnames=users[0].keys())
    writer.writeheader()
    for row in users:
        writer.writerow(row)

# 2. Películas
movies = []
for i in range(1, N_MOVIES + 1):
    g_ids = random.sample(genre_ids, k=random.choice([1, 2, 3]))
    release_year = random.randint(2000, 2024)
    release_date = datetime(release_year, random.randint(1, 12), random.randint(1, 28)).date().isoformat()
    movies.append({
        'id': i,
        'title': f'Película {i}',
        'overview': f'Descripción de la película {i}',
        'genre_ids': '{' + ','.join(map(str, g_ids)) + '}',
        'release_date': release_date,
        'poster_path': f'https://picsum.photos/200/300?random={i}',
        'is_modified': 'FALSE',
        'vote_average': round(random.uniform(4.0, 8.5), 1),
        'vote_count': random.randint(10, 5000),
        'popularity': round(random.uniform(10, 100), 2)
    })

with open('fake_movies.csv', 'w', newline='', encoding='utf-8') as f:
    writer = csv.DictWriter(f, fieldnames=movies[0].keys())
    writer.writeheader()
    for row in movies:
        writer.writerow(row)

# 3. user_movies (películas vistas y calificadas por usuarios)
user_movies = []
for _ in range(N_USER_MOVIES):
    user = random.choice(users)
    movie = random.choice(movies)
    watched = random.choice(['TRUE', 'FALSE'])
    comment = f'Comentario de {user["name"]} sobre {movie["title"]}' if watched == 'TRUE' else ''
    rating = random.randint(1, 5) if watched == 'TRUE' else ''
    user_movies.append({
        'user_id': user['id'],
        'movie_id': movie['id'],
        'watched': watched,
        'comment': comment,
        'rating': rating,
        'created_at': (datetime.now() - timedelta(days=random.randint(0, 365))).isoformat()
    })

with open('fake_user_movies.csv', 'w', newline='', encoding='utf-8') as f:
    writer = csv.DictWriter(f, fieldnames=user_movies[0].keys())
    writer.writeheader()
    for row in user_movies:
        writer.writerow(row)

# 4. movie_recommendations
recommendations = []
for _ in range(N_RECOMMENDATIONS):
    rec = random.choice(users)
    recv = random.choice([u for u in users if u['id'] != rec['id']])
    movie = random.choice(movies)
    rating = random.randint(4, 5)
    recommendations.append({
        'recommender_id': rec['id'],
        'receiver_id': recv['id'],
        'movie_id': movie['id'],
        'rating': rating,
        'created_at': (datetime.now() - timedelta(days=random.randint(0, 365))).isoformat()
    })

with open('fake_movie_recommendations.csv', 'w', newline='', encoding='utf-8') as f:
    writer = csv.DictWriter(f, fieldnames=recommendations[0].keys())
    writer.writeheader()
    for row in recommendations:
        writer.writerow(row) 