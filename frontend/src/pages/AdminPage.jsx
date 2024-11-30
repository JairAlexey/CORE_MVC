import { useEffect } from "react";
import { useUsers } from "../context/UsersContext";
import { Card, Button } from "../components/ui";

function AdminPage() {
    const { users, loadUsers, deleteUser, updateUser, errors } = useUsers();

    useEffect(() => {
        loadUsers();
    }, []);

    const handleDelete = async (id) => {
        if (window.confirm("¿Estás seguro de eliminar este usuario?")) {
            await deleteUser(id);
        }
    };

    const handleToggleAdmin = async (user) => {
        await updateUser(user.id, {
            ...user,
            is_admin: !user.is_admin
        });
    };

    return (
        <div className="flex h-[80vh] justify-center items-center">
            <Card>
                <h2 className="text-3xl font-bold my-4">Administración de Usuarios</h2>
                {errors.length > 0 && (
                    <div className="bg-red-500 text-white p-2 rounded mb-4">
                        {errors.map((error, index) => (
                            <p key={index} className="text-center">{error}</p>
                        ))}
                    </div>
                )}
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead>
                            <tr className="border-b border-gray-700">
                                <th className="px-6 py-3 text-left">Nombre</th>
                                <th className="px-6 py-3 text-left">Email</th>
                                <th className="px-6 py-3 text-left">Admin</th>
                                <th className="px-6 py-3 text-left">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user) => (
                                <tr key={user.id} className="border-b border-gray-700">
                                    <td className="px-6 py-4">{user.name}</td>
                                    <td className="px-6 py-4">{user.email}</td>
                                    <td className="px-6 py-4">
                                        <Button
                                            onClick={() => handleToggleAdmin(user)}
                                            className={user.is_admin ? "bg-green-500" : "bg-gray-500"}
                                        >
                                            {user.is_admin ? "Sí" : "No"}
                                        </Button>
                                    </td>
                                    <td className="px-6 py-4">
                                        <Button
                                            onClick={() => handleDelete(user.id)}
                                            className="bg-red-500"
                                        >
                                            Eliminar
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}

export default AdminPage;