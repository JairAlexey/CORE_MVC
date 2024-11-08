import {MdTaskAlt} from 'react-icons/md'
import {BiTask, BiUserCircle} from 'react-icons/bi'

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
    name: "Tareas",
    path: "/tasks",
    icon: <BiTask className='w-5 h-5' />,
  },
  {
    name: "Crear Tarea",
    path: "/tasks/new",
    icon: <MdTaskAlt className='w-5 h-5' />,
  }
];