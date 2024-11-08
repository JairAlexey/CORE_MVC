import { useEffect } from "react";
import TaskCard from "../components/tasks/TaskCard";
import { useTasks } from "../context/TaskContext";
import { Link } from "react-router-dom";

function TasksPage() {
  const { tasks, loadTasks } = useTasks();

  useEffect(() => {
    loadTasks();
  }, []);

  if (tasks.length === 0) return (
    <div className="flex flex-col justify-center items-center h-[calc(100vh-10rem)]">
    <h1 className="text-3xl font-bold mb-4">Aún no tienes tareas creadas</h1>
    <Link
      to="/tasks/new"
      className="bg-red-500 text-white py-2 px-4 rounded-full hover:bg-red-600 transition-colors"
    >
      Crear tarea
    </Link>
  </div>
  )

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-2">
      {tasks.map((task) => (
        <TaskCard task={task} key={task.id} />
      ))}
    </div>
  );
}

export default TasksPage;
