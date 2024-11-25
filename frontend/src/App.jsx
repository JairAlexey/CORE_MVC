import { Routes, Route, Outlet } from "react-router-dom";

import { useAuth } from "./context/AuthContext";
import { UsersProvider } from "./context/UsersContext";
import { MoviesProvider } from "./context/MoviesContext";

import Navbar from "./components/navbar/Navbar";
import { Container } from "./components/ui";
import { ProtectedRoute } from "./components/ProtectedRoute";

import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ProfilePage from "./pages/ProfilePage";
import AdminPage from "./pages/AdminPage";
import MoviesPage from "./pages/MoviesPage";
import CreateMoviePage from "./pages/CreatedMoviePage";
import NotFound from "./pages/NotFound";
import UserMoviePage from "./pages/UserMoviePage";
import CommentAndRatePage from "./pages/CommentAndRatePage";
import MovieDetailsPage from './pages/MovieDetailsPage';
import FavoriteGenresPage from './pages/FavoriteGenresPage';


function App() {
  const { isAuth, user, loading } = useAuth();

  if (loading) return <h1>Cargando...</h1>;

  return (
    <div className="relative min-h-screen bg-slate-950">
      <div className="absolute bottom-0 left-[-20%] right-0 top-[-10%] size-[500px] rounded-full bg-[radial-gradient(circle_farthest-side,rgba(255,0,0,.15),rgba(255,255,255,0))] z-0"></div>
      <div className="absolute bottom-0 right-[-20%] top-[-10%] size-[500px] rounded-full bg-[radial-gradient(circle_farthest-side,rgba(255,0,0,.15),rgba(255,255,255,0))] z-0"></div>
      
      <div className="relative z-10">
        <Navbar />

        <Container className="py-5">
          <Routes>
            <Route
              element={<ProtectedRoute isAllowed={!isAuth} redirectTo="/user-movies" />}
            >
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
            </Route>

            <Route
              element={<ProtectedRoute isAllowed={isAuth} redirectTo="/login" />}
            >

              <Route path="/profile" element={<ProfilePage />} />
            </Route>

            <Route
              path="/movies/:movieId/details"
              element={
                <ProtectedRoute isAllowed={isAuth}>
                  <MoviesProvider>
                    <MovieDetailsPage />
                  </MoviesProvider>
                </ProtectedRoute>
              }
            />

            <Route
              path="/user-movies"
              element={
                <ProtectedRoute isAllowed={isAuth} redirectTo="/login">
                  <MoviesProvider>
                    <UserMoviePage />
                  </MoviesProvider>
                </ProtectedRoute>
              }
            />

            <Route 
              path="/favorite-genres" 
              element=
              {
              <FavoriteGenresPage />
              } 
            />

            <Route
              path="/movies/:movieId/comment"
              element={
                <ProtectedRoute isAllowed={isAuth} redirectTo="/login">
                  <MoviesProvider>
                    <CommentAndRatePage />
                  </MoviesProvider>
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin"
              element={
                <ProtectedRoute
                  isAllowed={isAuth && user?.is_admin}
                  redirectTo="/"
                >
                  <UsersProvider>
                    <AdminPage />
                  </UsersProvider>
                </ProtectedRoute>
              }
            />

            <Route
              path="/movies"
              element={
                <ProtectedRoute isAllowed={isAuth && user?.is_admin} redirectTo="/">
                  <MoviesProvider>
                    <MoviesPage />
                  </MoviesProvider>
                </ProtectedRoute>
              }
            />

            <Route
              path="/create-movie"
              element={
                <ProtectedRoute isAllowed={isAuth && user?.is_admin} redirectTo="/">
                  <MoviesProvider>
                    <CreateMoviePage />
                  </MoviesProvider>
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </Container>
      </div>
    </div>
  );
}

export default App;