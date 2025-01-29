import MovieList from './components/MovieList';

export default function Home() {
    return (
        <main className="min-h-screen p-4">
            <h1 className="text-3xl font-bold mb-4">MovieMatch - Next.js Version</h1>
            <MovieList />
        </main>
    );
}