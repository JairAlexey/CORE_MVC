import requests
import csv
import random
from datetime import datetime, timedelta

# Configuración
TMDB_API_KEY = 'd73468cfd03d633688b7bee80c78f659'  # <-- PON AQUÍ TU API KEY
TMDB_API_URL = 'https://api.themoviedb.org/3'
N_USERS = 20
N_MOVIES = 200
N_CONNECTIONS = 30
N_USER_MOVIES = 600
N_RECOMMENDATIONS = 100

# 1. Obtener géneros de TMDB
resp = requests.get(f'{TMDB_API_URL}/genre/movie/list?api_key={TMDB_API_KEY}&language=es-ES')
genres = resp.json()['genres']
genre_ids = [g['id'] for g in genres]

# 2. Descargar películas reales de TMDB
movies = []
page = 1
while len(movies) < N_MOVIES:
    url = f'{TMDB_API_URL}/movie/popular?api_key={TMDB_API_KEY}&language=es-ES&page={page}'
    resp = requests.get(url)
    for m in resp.json()['results']:
        if not m.get('poster_path') or not m.get('genre_ids'):
            continue
        movies.append({
            'id': m['id'],
            'title': m['title'],
            'overview': m.get('overview', ''),
            'genre_ids': '{' + ','.join(map(str, m['genre_ids'])) + '}',
            'release_date': m.get('release_date', '2000-01-01'),
            'poster_path': f'https://image.tmdb.org/t/p/w500{m["poster_path"]}',
            'is_modified': 'FALSE',
            'vote_average': m.get('vote_average', 5),
            'vote_count': m.get('vote_count', 0),
            'popularity': m.get('popularity', 0)
        })
        if len(movies) >= N_MOVIES:
            break
    page += 1

with open('real_movies.csv', 'w', newline='', encoding='utf-8') as f:
    writer = csv.DictWriter(f, fieldnames=movies[0].keys())
    writer.writeheader()
    for row in movies:
        writer.writerow(row)

# 3. Usuarios
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
with open('real_users.csv', 'w', newline='', encoding='utf-8') as f:
    writer = csv.DictWriter(f, fieldnames=users[0].keys())
    writer.writeheader()
    for row in users:
        writer.writerow(row)

# 4. Conexiones entre usuarios
connections = set()
while len(connections) < N_CONNECTIONS:
    u1, u2 = random.sample(range(1, N_USERS + 1), 2)
    if u1 > u2:
        u1, u2 = u2, u1
    if u1 != u2:
        connections.add((u1, u2))

connections_rows = []
for u1, u2 in connections:
    score = round(random.uniform(60, 99), 2)
    connections_rows.append({
        'user1_id': u1,
        'user2_id': u2,
        'compatibility_score': score,
        'created_at': (datetime.now() - timedelta(days=random.randint(0, 365))).isoformat()
    })
with open('real_user_connections.csv', 'w', newline='', encoding='utf-8') as f:
    writer = csv.DictWriter(f, fieldnames=connections_rows[0].keys())
    writer.writeheader()
    for row in connections_rows:
        writer.writerow(row)

# 5. user_movies (vistas y ratings)
user_movies = []
for _ in range(N_USER_MOVIES):
    user = random.choice(users)
    # Películas de géneros favoritos (más probabilidad)
    if random.random() < 0.7:
        fav_g = [int(g) for g in user['favorite_genres'].strip('{}').split(',')]
        candidates = [m for m in movies if any(int(g) in fav_g for g in m['genre_ids'].strip('{}').split(','))]
        if not candidates:
            candidates = movies
        movie = random.choice(candidates)
    else:
        movie = random.choice(movies)
    watched = 'TRUE'
    rating = random.choices([4, 5, 3, 2, 1], weights=[0.35, 0.35, 0.15, 0.1, 0.05])[0] if watched == 'TRUE' else ''
    comment = f'Comentario de {user["name"]} sobre {movie["title"]}' if watched == 'TRUE' else ''
    user_movies.append({
        'user_id': user['id'],
        'movie_id': movie['id'],
        'watched': watched,
        'comment': comment,
        'rating': rating,
        'created_at': (datetime.now() - timedelta(days=random.randint(0, 365))).isoformat()
    })
with open('real_user_movies.csv', 'w', newline='', encoding='utf-8') as f:
    writer = csv.DictWriter(f, fieldnames=user_movies[0].keys())
    writer.writeheader()
    for row in user_movies:
        writer.writerow(row)

# 6. movie_recommendations (solo si hay conexiones y películas no vistas por el receiver)
recommendations = []
for conn in connections_rows:
    recommender_id = conn['user1_id']
    receiver_id = conn['user2_id']
    # Películas vistas por el recommender pero no por el receiver
    recommender_movies = [um['movie_id'] for um in user_movies if um['user_id'] == recommender_id]
    receiver_movies = [um['movie_id'] for um in user_movies if um['user_id'] == receiver_id]
    possible_movies = list(set(recommender_movies) - set(receiver_movies))
    for movie_id in random.sample(possible_movies, min(2, len(possible_movies))):
        rating = random.randint(4, 5)
        recommendations.append({
            'recommender_id': recommender_id,
            'receiver_id': receiver_id,
            'movie_id': movie_id,
            'rating': rating,
            'created_at': (datetime.now() - timedelta(days=random.randint(0, 365))).isoformat()
        })
with open('real_movie_recommendations.csv', 'w', newline='', encoding='utf-8') as f:
    writer = csv.DictWriter(f, fieldnames=recommendations[0].keys())
    writer.writeheader()
    for row in recommendations:
        writer.writerow(row) 