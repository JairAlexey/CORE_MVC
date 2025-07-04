import { Link, useLocation } from "react-router-dom";
import { MdMovie } from 'react-icons/md';
import { publicRoutes, privateRoutes, adminRoutes } from "./navigation";
import { Container } from "../ui";
import { useAuth } from "../../context/AuthContext";
import { twMerge } from "tailwind-merge";
import { BiLogOut } from "react-icons/bi";
import { BiHome } from "react-icons/bi";

function Navbar() {
  const location = useLocation();
  const { isAuth, signout, user } = useAuth();

  return (
    <nav className="bg-[#2B2A2A] rounded-lg m-6 max-w-2 sticky top-0 z-50 shadow-lg">
      <Container className="flex justify-between py-4">
        <Link to="/">
          <BiHome className="w-7 h-7" />
        </Link>

        <ul className="flex items-center justify-center md:gap-x-1">
          {isAuth ? (
            <>
              {user?.is_admin ? (
                adminRoutes.map(({ path, name, icon }) => (
                  <li key={path}>
                    <Link
                      to={path}
                      className={twMerge(
                        "text-slate-300 flex items-center px-3 py-1 gap-x-1",
                        location.pathname === path && "bg-red-500 rounded-lg"
                      )}
                    >
                      {icon}
                      <span className="hidden sm:block">{name}</span>
                    </Link>
                  </li>
                ))
              ) : (
                privateRoutes.map(({ path, name, icon }) => (
                  <li key={path}>
                    <Link
                      to={path}
                      className={twMerge(
                        "text-slate-300 flex items-center px-3 py-1 gap-x-1",
                        location.pathname === path && "bg-red-500 rounded-lg"
                      )}
                    >
                      {icon}
                      <span className="hidden sm:block">{name}</span>
                    </Link>
                  </li>
                ))
              )}

              <li
                className="text-slate-300 flex items-center px-3 py-1 hover:cursor-pointer"
                onClick={() => {
                  signout();
                }}
              >
                <BiLogOut className="w-5 h-5" />
                <span className="hidden sm:block">Salir</span>
              </li>

              <Link to="/profile">
                <li className="flex gap-x-1 items-center justify-center">
                  <img
                    src={user.gravatar}
                    alt=""
                    className="h-8 w-8 rounded-full"
                  />
                  <span className="font-medium">{user.name}</span>
                </li>
              </Link>
            </>
          ) : (
            publicRoutes.map(({ path, name }) => (
              <li
                className={twMerge(
                  "text-slate-300 flex items-center px-3 py-1",
                  location.pathname === path && "bg-red-500 rounded-lg"
                )}
                key={path}
              >
                <Link to={path}>{name}</Link>
              </li>
            ))
          )}
        </ul>
      </Container>
    </nav>
  );
}

export default Navbar;