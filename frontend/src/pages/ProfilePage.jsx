import { useAuth } from "../context/AuthContext";
import { Card } from "../components/ui";

function ProfilePage() {
  const { user } = useAuth();

  return (
    <div className="flex h-[80vh] justify-center items-center">
      <Card>
        <h2 className="text-3xl font-bold my-4">Perfil de usuario
        </h2>
        <div className="flex justify-between">
          <span className="font-medium">Nombre:</span>
          <span>{user?.name || "No disponible"}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-medium">Email:</span>
          <span>{user?.email || "No disponible"}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-medium">ID:</span>
          <span>{user?.id || "No disponible"}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-medium">Foto de usuario:</span>
          <img
                  src={user.gravatar}
                  alt=""
                  className="h-8 w-8 rounded-full"
          />
        </div>
      </Card>
    </div>
  );

}

export default ProfilePage;
