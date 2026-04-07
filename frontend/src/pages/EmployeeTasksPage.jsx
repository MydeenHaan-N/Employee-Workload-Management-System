import React, { useEffect, useState } from 'react';
import axios from '../api/axiosInstance';
import Layout from '../components/Layout';
import Card from '../components/ui/Card';
import Table from '../components/ui/Table';
import { toastService, toastMessages } from '../services/toastService';

const EmployeeTasksPage = () => {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingTaskId, setUpdatingTaskId] = useState(null);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get('/tasks/my');
      setTasks(res.data);
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
      toastService.error(toastMessages.loadError);
    } finally {
      setIsLoading(false);
    }
  };

  const updateStatus = async (id, status) => {
    setUpdatingTaskId(id);

    try {
      const res = await axios.put(`/tasks/${id}/status`, { status });
      setTasks((prev) => prev.map((task) => (task.id === id ? res.data : task)));
      toastService.success(toastMessages.taskStatusUpdated);
    } catch (err) {
      console.error('Failed to update task status:', err);
      toastService.error(toastMessages.taskError);
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in progress':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return 'text-red-600';
      case 'medium':
        return 'text-orange-600';
      case 'low':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  const columns = [
    {
      header: 'Task',
      accessor: 'title',
      render: (task) => (
        <div>
          <p className="font-medium text-gray-900">{task.title}</p>
          {task.description && (
            <p className="mt-1 line-clamp-2 text-sm text-gray-500">{task.description}</p>
          )}
        </div>
      ),
    },
    {
      header: 'Priority',
      accessor: 'priority',
      render: (task) => (
        <span className={`font-medium ${getPriorityColor(task.priority)}`}>
          {task.priority || 'Medium'}
        </span>
      ),
    },
    {
      header: 'Weight',
      accessor: 'weight',
      render: (task) => (
        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-800">
          {task.weight ?? 1}
        </span>
      ),
    },
    {
      header: 'Due Date',
      accessor: 'deadline',
      render: (task) => (
        <span className="text-sm text-gray-600">
          {task.deadline ? new Date(task.deadline).toLocaleDateString() : 'No deadline'}
        </span>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (task) => (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(task.status)}`}>
          {task.status}
        </span>
      ),
    },
    {
      header: 'Actions',
      accessor: 'actions',
      render: (task) => (
        <select
          onChange={(e) => updateStatus(task.id, e.target.value)}
          value={task.status}
          disabled={updatingTaskId === task.id}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value="Pending">Pending</option>
          <option value="In Progress">In Progress</option>
          <option value="Completed">Completed</option>
        </select>
      ),
    },
  ];

  return (
    <Layout role="employee">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Tasks</h1>
          <p className="mt-1 text-sm text-gray-600">View and update the tasks currently assigned to you.</p>
        </div>

        <Card title="Assigned Tasks" subtitle="This page contains only your active assigned tasks.">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" />
            </div>
          ) : (
            <Table
              columns={columns}
              data={tasks}
              emptyMessage="No tasks assigned yet. Check back later for new assignments."
            />
          )}
        </Card>
      </div>
    </Layout>
  );
};

export default EmployeeTasksPage;
