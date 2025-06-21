import requests
import random
import csv
import time
from datetime import datetime

# Configuración
TMDB_API_KEY = 'd73468cfd03d633688b7bee80c78f659'  # Reemplaza esto por tu API Key
TMDB_API_URL = 'https://api.themoviedb.org/3'
N_USERS = 50
N_RECORDS = 3000
GENRES_URL = f'{TMDB_API_URL}/genre/movie/list?api_key={TMDB_API_KEY}&language=en-US'
MOVIES_PER_PAGE = 20
CURRENT_YEAR = datetime.now().year

# 1. Obtener lista de géneros de TMDB
response = requests.get(GENRES_URL)
genres_data = response.json()
genre_list = genres_data['genres']  # [{'id': 28, 'name': 'Action'}, ...]
genre_ids = [g['id'] for g in genre_list]

# 2. Simular usuarios y sus géneros favoritos
users = []
for user_id in range(1, N_USERS + 1):
    fav_genres = random.sample(genre_ids, k=random.choice([2, 3]))
    users.append({'user_id': user_id, 'favorite_genres': fav_genres})

# 3. Obtener películas reales de TMDB (populares y variadas)
def get_movies_from_tmdb(pages=60):
    movies = []
    for page in range(1, pages + 1):
        url = f'{TMDB_API_URL}/movie/popular?api_key={TMDB_API_KEY}&language=en-US&page={page}'
        resp = requests.get(url)
        if resp.status_code != 200:
            print(f'Error en página {page}, status {resp.status_code}')
            continue
        data = resp.json()
        for m in data['results']:
            if m.get('vote_average') is None or m.get('vote_count') is None:
                continue
            if not m.get('genre_ids'):
                continue
            if not m.get('release_date') or m.get('popularity') is None:
                continue
            try:
                release_year = int(m['release_date'][:4])
            except:
                continue
            movies.append({
                'movie_id': m['id'],
                'genre_ids': m['genre_ids'],
                'vote_average': m['vote_average'],
                'vote_count': m['vote_count'],
                'release_year': release_year,
                'popularity': m['popularity']
            })
        time.sleep(0.2)  # Para no sobrecargar la API
    return movies

print('Descargando películas de TMDB...')
movies = get_movies_from_tmdb(pages=60)  # ~1200 películas
print(f'Se obtuvieron {len(movies)} películas.')

# 4. Generar dataset balanceado y con features útiles
rows = []
count_high = 0
count_low = 0
max_high = N_RECORDS // 2
max_low = N_RECORDS // 2
while len(rows) < N_RECORDS:
    user = random.choice(users)
    movie = random.choice(movies)
    n_shared_genres = len(set(user['favorite_genres']) & set(movie['genre_ids']))
    vote_average = movie['vote_average']
    vote_count = movie['vote_count']
    years_since_release = CURRENT_YEAR - movie['release_year']
    popularity = movie['popularity']
    is_favorite_genre = 1 if n_shared_genres >= 1 else 0
    # Lógica de rating
    if n_shared_genres >= 2 and vote_average > 6.5:
        rating = random.choices([4, 5], weights=[0.4, 0.6])[0]
    elif n_shared_genres == 0 and vote_average < 5.5:
        rating = random.choices([1, 2], weights=[0.6, 0.4])[0]
    else:
        rating = random.randint(1, 5)
    # Balancear: asegurar mitad altos y mitad bajos
    if rating >= 4:
        if count_high >= max_high:
            continue
        count_high += 1
    elif rating <= 2:
        if count_low >= max_low:
            continue
        count_low += 1
    else:
        # Solo permitir ratings medios si aún no se llenó el dataset
        if len(rows) >= N_RECORDS - 100:
            continue
    rows.append({
        'n_shared_genres': n_shared_genres,
        'vote_average': vote_average,
        'vote_count': vote_count,
        'is_favorite_genre': is_favorite_genre,
        'years_since_release': years_since_release,
        'popularity': popularity,
        'rating': rating
    })

# 5. Guardar en CSV (sin user_id ni movie_id)
with open('data.csv', 'w', newline='', encoding='utf-8') as f:
    writer = csv.DictWriter(f, fieldnames=['n_shared_genres', 'vote_average', 'vote_count', 'is_favorite_genre', 'years_since_release', 'popularity', 'rating'])
    writer.writeheader()
    for row in rows:
        writer.writerow(row)

print('¡Dataset mejorado generado como data.csv!') 