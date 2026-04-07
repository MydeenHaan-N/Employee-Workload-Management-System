import React, { useEffect, useState } from 'react';
import axios from '../api/axiosInstance';
import Layout from '../components/Layout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { toast } from 'react-hot-toast';

const ManagerAvailableTasksPage = () => {
  const [board, setBoard] = useState({ unassignedTasks: [], summary: null });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAvailableTasks();
  }, []);

  const loadAvailableTasks = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get('/tasks/manager-board');
      setBoard(response.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load available tasks');
    } finally {
      setIsLoading(false);
    }
  };

  const summary = board.summary || {
    unassignedTaskCount: 0,
  };

  return (
    <Layout role="manager">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Available Tasks</h1>
            <p className="mt-1 text-sm text-gray-600">
              View all tasks you created that are still available in backlog and not yet assigned to any employee.
            </p>
          </div>
          <Button variant="outline" onClick={loadAvailableTasks} disabled={isLoading}>
            Refresh
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-1">
          <SummaryCard title="Available Backlog Tasks" value={summary.unassignedTaskCount} color="bg-amber-500" />
        </div>

        <Card
          title="Manager Created Available Tasks"
          subtitle="These tasks are waiting in backlog until they are assigned from the assignment board."
        >
          {isLoading ? (
            <LoadingState />
          ) : board.unassignedTasks.length === 0 ? (
            <EmptyState message="No available tasks in backlog right now." />
          ) : (
            <div className="space-y-4">
              {board.unassignedTasks.map((task) => (
                <div key={task.id} className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold text-gray-900">{task.title}</h3>
                      <Badge color="amber">{task.status}</Badge>
                      <Badge color="slate">Weight {task.weight}</Badge>
                      <Badge color={task.priority === 'High' ? 'red' : task.priority === 'Medium' ? 'blue' : 'green'}>
                        {task.priority}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">{task.description}</p>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                      <span>Deadline: {task.deadline ? new Date(task.deadline).toLocaleDateString() : 'No deadline'}</span>
                      <span>Created: {task.createdAt ? new Date(task.createdAt).toLocaleDateString() : '-'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </Layout>
  );
};

const SummaryCard = ({ title, value, color }) => (
  <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
      </div>
      <div className={`h-12 w-12 rounded-lg ${color}`} />
    </div>
  </div>
);

const Badge = ({ children, color }) => {
  const colors = {
    amber: 'bg-amber-100 text-amber-800',
    blue: 'bg-blue-100 text-blue-800',
    green: 'bg-green-100 text-green-800',
    red: 'bg-red-100 text-red-800',
    slate: 'bg-slate-100 text-slate-800',
  };

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colors[color] || colors.slate}`}>
      {children}
    </span>
  );
};

const LoadingState = () => (
  <div className="flex items-center justify-center py-12">
    <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" />
  </div>
);

const EmptyState = ({ message }) => (
  <div className="py-12 text-center text-sm text-gray-500">
    {message}
  </div>
);

export default ManagerAvailableTasksPage;
