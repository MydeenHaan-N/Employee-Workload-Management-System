import React, { useEffect, useState } from 'react';
import axios from '../api/axiosInstance';
import Layout from '../components/Layout';
import Card from '../components/ui/Card';
import Table from '../components/ui/Table';
import { toastService, toastMessages } from '../services/toastService';

/**
 * Employee Dashboard - View and update assigned tasks
 */

const EmployeeDashboard = () => {
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
      setTasks(tasks.map(t => t.id === id ? res.data : t));
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
            <p className="text-sm text-gray-500 mt-1 line-clamp-2">{task.description}</p>
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
      header: 'Due Date',
      accessor: 'dueDate',
      render: (task) => (
        <span className="text-sm text-gray-600">
          {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No deadline'}
        </span>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (task) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
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
          className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <option value="Pending">Pending</option>
          <option value="In Progress">In Progress</option>
          <option value="Completed">Completed</option>
        </select>
      ),
    },
  ];

  const taskStats = {
    total: tasks.length,
    pending: tasks.filter(t => t.status.toLowerCase() === 'pending').length,
    inProgress: tasks.filter(t => t.status.toLowerCase() === 'in progress').length,
    completed: tasks.filter(t => t.status.toLowerCase() === 'completed').length,
  };

  return (
    <Layout role="employee">
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Tasks</h1>
          <p className="text-sm text-gray-600 mt-1">Track and update your assigned tasks</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatCard
            title="Total Tasks"
            value={taskStats.total}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            }
            bgColor="bg-gray-500"
          />
          <StatCard
            title="Pending"
            value={taskStats.pending}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            bgColor="bg-yellow-500"
          />
          <StatCard
            title="In Progress"
            value={taskStats.inProgress}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            }
            bgColor="bg-blue-500"
          />
          <StatCard
            title="Completed"
            value={taskStats.completed}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            bgColor="bg-green-500"
          />
        </div>

        {/* Tasks Table */}
        <Card title="Assigned Tasks" subtitle="Update task status as you make progress">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
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

const StatCard = ({ title, value, icon, bgColor }) => (
  <Card className="relative overflow-hidden">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
      </div>
      <div className={`${bgColor} p-3 rounded-lg`}>
        <div className="text-white">{icon}</div>
      </div>
    </div>
  </Card>
);

export default EmployeeDashboard;