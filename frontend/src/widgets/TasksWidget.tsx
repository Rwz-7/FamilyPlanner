import React, { useEffect, useState } from 'react';
import { tasksAPI } from '../api/api';
import { useFamily } from '../contexts/FamilyContext';
import BaseWidget from './BaseWidget';
import { Widget as WidgetType } from '../contexts/DashboardContext';

interface Task {
  id: number;
  title: string;
  status: string;
  due_date: string | null;
  assigned_to: Array<{
    id: number;
    name: string;
  }>;
}

interface TasksWidgetProps {
  widget: WidgetType;
}

const TasksWidget: React.FC<TasksWidgetProps> = ({ widget }) => {
  const { currentFamily } = useFamily();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  const loadTasks = async () => {
    if (!currentFamily) return;

    try {
      setIsLoading(true);
      const tasksData = await tasksAPI.getTasks(currentFamily.id);
      setTasks(tasksData);
    } catch (error) {
      setError('Failed to load tasks');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, [currentFamily]);

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentFamily || !newTaskTitle.trim()) return;

    try {
      await tasksAPI.createTask({
        title: newTaskTitle,
        family: currentFamily.id,
        status: 'pending'
      });
      setNewTaskTitle('');
      loadTasks();
    } catch (error) {
      setError('Failed to add task');
      console.error(error);
    }
  };

  const handleStatusChange = async (taskId: number, newStatus: string) => {
    try {
      await tasksAPI.updateTask(taskId, { status: newStatus });
      setTasks(prevTasks =>
        prevTasks.map(task =>
          task.id === taskId ? { ...task, status: newStatus } : task
        )
      );
    } catch (error) {
      setError('Failed to update task');
      console.error(error);
    }
  };

  const pendingTasks = tasks.filter(task => task.status === 'pending');
  const inProgressTasks = tasks.filter(task => task.status === 'in_progress');
  const completedTasks = tasks.filter(task => task.status === 'completed');

  return (
    <BaseWidget widget={widget}>
      <div className="space-y-4">
        <form onSubmit={handleAddTask} className="flex space-x-2">
          <input
            type="text"
            className="input py-1 text-sm flex-grow"
            placeholder="Add a new task..."
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
          />
          <button type="submit" className="btn btn-primary py-1 px-3 text-sm">Add</button>
        </form>

        {isLoading ? (
          <div className="text-center py-4">Loading tasks...</div>
        ) : error ? (
          <div className="text-red-500 text-center">{error}</div>
        ) : (
          <div className="space-y-4">
            {pendingTasks.length > 0 && (
              <div>
                <h3 className="font-medium mb-2">Pending</h3>
                <ul className="space-y-2">
                  {pendingTasks.map(task => (
                    <li key={task.id} className="flex items-center">
                      <input
                        type="checkbox"
                        className="mr-2"
                        onChange={() => handleStatusChange(task.id, 'completed')}
                      />
                      <span className="flex-grow">{task.title}</span>
                      <button
                        className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded"
                        onClick={() => handleStatusChange(task.id, 'in_progress')}
                      >
                        Start
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {inProgressTasks.length > 0 && (
              <div>
                <h3 className="font-medium mb-2">In Progress</h3>
                <ul className="space-y-2">
                  {inProgressTasks.map(task => (
                    <li key={task.id} className="flex items-center">
                      <input
                        type="checkbox"
                        className="mr-2"
                        onChange={() => handleStatusChange(task.id, 'completed')}
                      />
                      <span className="flex-grow">{task.title}</span>
                      <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                        In Progress
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {completedTasks.length > 0 && (
              <div>
                <h3 className="font-medium mb-2">Completed</h3>
                <ul className="space-y-2">
                  {completedTasks.map(task => (
                    <li key={task.id} className="flex items-center text-gray-500">
                      <input
                        type="checkbox"
                        className="mr-2"
                        checked
                        onChange={() => handleStatusChange(task.id, 'pending')}
                      />
                      <span className="flex-grow line-through">{task.title}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {tasks.length === 0 && (
              <div className="text-center text-gray-500 py-4">
                No tasks yet. Add your first task above.
              </div>
            )}
          </div>
        )}
      </div>
    </BaseWidget>
  );
};

export default TasksWidget;