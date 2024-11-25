import { MdTaskAlt, MdLocalMovies, MdCategory, MdRecommend } from 'react-icons/md';
import { BiTask, BiUserCircle, BiMoviePlay } from 'react-icons/bi';
import { FaUsers, FaFilm } from 'react-icons/fa';

export const publicRoutes = [
  {
    name: "Iniciar Sesión",
    path: "/login",
    icon: <BiUserCircle className="w-5 h-5" />,
  },
  {
    name: "Registrarse",
    path: "/register",
    icon: <FaUsers className="w-5 h-5" />,
  },
];

export const privateRoutes = [
  {
    name: "Películas",
    path: "/user-movies",
    icon: <MdLocalMovies className="w-5 h-5" />,
  },
  {
    name: "Géneros Favoritos",
    path: "/favorite-genres",
    icon: <MdCategory className="w-5 h-5" />,
  }
];

export const adminRoutes = [
  {
    name: "Usuarios",
    path: "/admin",
    icon: <FaUsers className="w-5 h-5" />,
  },
  {
    name: "Películas",
    path: "/movies",
    icon: <FaFilm className="w-5 h-5" />,
  },
  {
    name: "Crear Película",
    path: "/create-movie",
    icon: <BiMoviePlay className="w-5 h-5" />,
  },
];
