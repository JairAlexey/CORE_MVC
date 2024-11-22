import { useAuth } from "../context/AuthContext";
import { Card } from "../components/ui";

function ProfilePage() {
  const { user } = useAuth();

  return (
    <div className="flex h-[80vh] justify-center items-center">
      <Card className="max-w-md w-full p-6 shadow-lg rounded-lg">
        <div className="flex flex-col items-center">
          <img
            src={user.gravatar}
            alt=""
            className="h-24 w-24 rounded-full mb-4"
          />
          <h2 className="text-2xl font-bold mb-2 text-white">{user?.name || "No disponible"}</h2>
          <p className="text-white">{user?.email || "No disponible"}</p>
        </div>
        <div className="mt-6">
          <p className="text-sm text-white mt-4 text-center">
            Puedes cambiar tu foto de perfil en <a href="https://gravatar.com" target="_blank" rel="noopener noreferrer" className="text-blue-200 underline">Gravatar</a>.
          </p>
        </div>
      </Card>
    </div>
  );
}

export default ProfilePage;