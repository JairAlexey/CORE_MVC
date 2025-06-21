import psycopg2
import csv

# Configuración de conexión
DB_HOST = 'localhost'
DB_PORT = 5432
DB_NAME = 'MovieMatch'
DB_USER = 'postgres'
DB_PASSWORD = 'admin'

# Archivos CSV generados por generate_realistic_test_data.py
USERS_CSV = 'real_users.csv'
MOVIES_CSV = 'real_movies.csv'
USER_MOVIES_CSV = 'real_user_movies.csv'
USER_CONNECTIONS_CSV = 'real_user_connections.csv'
RECOMMENDATIONS_CSV = 'real_movie_recommendations.csv'

# Conexión a la base de datos
conn = psycopg2.connect(
    host=DB_HOST,
    port=DB_PORT,
    dbname=DB_NAME,
    user=DB_USER,
    password=DB_PASSWORD
)
conn.autocommit = True
cur = conn.cursor()

# 1. Insertar usuarios
with open(USERS_CSV, newline='', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        cur.execute('''
            INSERT INTO users (id, name, password, email, created_at, updated_at, favorite_genres, gravatar, is_admin)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (id) DO NOTHING
        ''', (
            row['id'], row['name'], row['password'], row['email'], row['created_at'], row['updated_at'],
            row['favorite_genres'], row['gravatar'], row['is_admin']
        ))
print('Usuarios insertados.')

# 2. Insertar películas
with open(MOVIES_CSV, newline='', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        cur.execute('''
            INSERT INTO movies (id, title, overview, genre_ids, release_date, poster_path, is_modified, vote_average, vote_count, popularity)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (id) DO NOTHING
        ''', (
            row['id'], row['title'], row['overview'], row['genre_ids'], row['release_date'], row['poster_path'],
            row['is_modified'], row['vote_average'], row['vote_count'], row['popularity']
        ))
print('Películas insertadas.')

# 3. Insertar user_movies
with open(USER_MOVIES_CSV, newline='', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        cur.execute('''
            INSERT INTO user_movies (user_id, movie_id, watched, comment, rating, created_at)
            VALUES (%s, %s, %s, %s, %s, %s)
            ON CONFLICT (user_id, movie_id) DO NOTHING
        ''', (
            row['user_id'], row['movie_id'], row['watched'], row['comment'], row['rating'] if row['rating'] != '' else None, row['created_at']
        ))
print('user_movies insertados.')

# 4. Insertar user_connections
with open(USER_CONNECTIONS_CSV, newline='', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        cur.execute('''
            INSERT INTO user_connections (user1_id, user2_id, compatibility_score, created_at)
            VALUES (%s, %s, %s, %s)
            ON CONFLICT (user1_id, user2_id) DO NOTHING
        ''', (
            row['user1_id'], row['user2_id'], row['compatibility_score'], row['created_at']
        ))
print('user_connections insertados.')

# 5. Insertar movie_recommendations
with open(RECOMMENDATIONS_CSV, newline='', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        cur.execute('''
            INSERT INTO movie_recommendations (recommender_id, receiver_id, movie_id, rating, created_at)
            VALUES (%s, %s, %s, %s, %s)
            ON CONFLICT (recommender_id, receiver_id, movie_id) DO NOTHING
        ''', (
            row['recommender_id'], row['receiver_id'], row['movie_id'], row['rating'], row['created_at']
        ))
print('movie_recommendations insertados.')

cur.close()
conn.close()
print('¡Datos ficticios importados exitosamente!') 