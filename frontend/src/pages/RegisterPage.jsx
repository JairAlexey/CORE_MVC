import { Button, Card, Container, Input, Label } from "../components/ui";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function RegisterPage() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();
  const { signup, errors: signupErrors } = useAuth();
  const navigate = useNavigate();

  const onSubmit = handleSubmit(async (data) => {
    const user = await signup(data);

    if (user) navigate("/tasks");
  });

  return (
    <Container className="h-[calc(100vh-10rem)] flex items-center justify-center">
      <Card>
        {signupErrors &&
          signupErrors.map((err) => (
            <p className="bg-red-500 text-white p-2 text-center">{err}</p>
          ))}

        <h1 className="text-4xl font-bold my-2 text-center">Registrarse</h1>

        <form onSubmit={onSubmit}>
          <Label htmlFor="name">Nombre</Label>
          <Input
            placeholder="Ingresa tu nombre"
            {...register("name", {
              required: true,
            })}
          />

          {errors.name && <p className="text-red-500">El nombre es requerido</p>}

          <Label htmlFor="email">Correo electronico</Label>
          <Input
            type="email"
            placeholder="Ingresa tu correo"
            {...register("email", {
              required: true,
            })}
          />
          {errors.email && <p className="text-red-500">El correo es requerido</p>}

          <Label htmlFor="password">Contraseña</Label>
          <Input
            type="password"
            placeholder="Ingresa tu contraseña"
            {...register("password", {
              required: true,
            })}
          />
          {errors.password && (
            <p className="text-red-500">La Contraseña es requerida</p>
          )}

          <Button>Rgistrarse</Button>

          <div className="flex justify-between my-4">
            <p className="mr-4">Ya tienes una cuenta?</p>
            <Link to="/login" className="font-bold">
              Iniciar Sesion
            </Link>
          </div>
        </form>
      </Card>
    </Container>
  );
}

export default RegisterPage;
