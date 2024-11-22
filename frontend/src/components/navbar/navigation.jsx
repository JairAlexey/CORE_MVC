import {MdTaskAlt} from 'react-icons/md'
import {BiTask, BiUserCircle} from 'react-icons/bi'
import {MdMovie} from 'react-icons/md'

export const publicRoutes = [
  {
    name: "Iniciar Sesion",
    path: "/login",
  },
  {
    name: "Registrarse",
    path: "/register",
  },
]

export const privateRoutes = [
  {
    name: "Películas",
    path: "/user-movies",
    icon: <MdMovie className='w-5 h-5' />,
  },
  {
    name: "Géneros Favoritos",
    path: "/favorite-genres",
    icon: <MdTaskAlt className='w-5 h-5' />,
  }
];

export const adminRoutes = [
  {
    name: "Usuarios",
    path: "/admin",
    icon: <BiUserCircle className='w-5 h-5' />,
  },
  {
    name: "Películas",
    path: "/movies",
    icon: <MdMovie className='w-5 h-5' />,
  },
  {
    name: "Crear Película",
    path: "/create-movie",
    icon: <MdMovie className='w-5 h-5' />,
  }
];