import React, { useEffect, useState } from 'react';
import axios from '../api/axiosInstance';
import Layout from '../components/Layout';
import Card from '../components/ui/Card';
import Table from '../components/ui/Table';
import Button from '../components/ui/Button';
import { toast } from 'react-hot-toast';

const defaultTaskForm = {
  title: '',
  description: '',
  priority: 'Medium',
  deadline: '',
};

const ManagerDashboard = () => {
  const [employees, setEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAssignTaskModal, setShowAssignTaskModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [taskForm, setTaskForm] = useState(defaultTaskForm);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get('/users/team');
      setEmployees(res.data);
    } catch (err) {
      console.error('Failed to fetch employees:', err);
      toast.error(err.response?.data?.message || 'Failed to load team');
    } finally {
      setIsLoading(false);
    }
  };

  const getWorkloadStatus = (workload) => {
    const total = workload?.total || 0;
    if (total === 0) return { label: 'No tasks', color: 'bg-gray-100 text-gray-800' };
    if (total <= 3) return { label: 'Light', color: 'bg-green-100 text-green-800' };
    if (total <= 6) return { label: 'Moderate', color: 'bg-yellow-100 text-yellow-800' };
    return { label: 'Heavy', color: 'bg-red-100 text-red-800' };
  };

  const openAssignTaskModal = (employee) => {
    setSelectedEmployee(employee);
    setTaskForm(defaultTaskForm);
    setShowAssignTaskModal(true);
  };

  const handleAssignTask = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/tasks', {
        ...taskForm,
        assignedTo: selectedEmployee.id,
      });
      toast.success(`Task assigned to ${selectedEmployee.fullName}`);
      setShowAssignTaskModal(false);
      setSelectedEmployee(null);
      fetchEmployees();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to assign task');
    }
  };

  const columns = [
    {
      header: 'Employee',
      accessor: 'fullName',
      render: (emp) => (
        <div className="flex items-center">
          <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
            <span className="text-sm font-medium text-blue-700">
              {emp.fullName.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <p className="font-medium text-gray-900">{emp.fullName}</p>
            <p className="text-sm text-gray-500">{emp.email}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Total Tasks',
      accessor: 'workload.total',
      render: (emp) => <span className="font-semibold">{emp.workload?.total || 0}</span>,
    },
    {
      header: 'Pending',
      accessor: 'workload.pending',
      render: (emp) => <span className="font-medium text-yellow-600">{emp.workload?.pending || 0}</span>,
    },
    {
      header: 'In Progress',
      accessor: 'workload.inProgress',
      render: (emp) => <span className="font-medium text-blue-600">{emp.workload?.inProgress || 0}</span>,
    },
    {
      header: 'Completed',
      accessor: 'workload.completed',
      render: (emp) => <span className="font-medium text-green-600">{emp.workload?.completed || 0}</span>,
    },
    {
      header: 'Workload Status',
      accessor: 'workloadStatus',
      render: (emp) => {
        const status = getWorkloadStatus(emp.workload);
        return (
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${status.color}`}>
            {status.label}
          </span>
        );
      },
    },
    {
      header: 'Actions',
      accessor: 'actions',
      render: (emp) => (
        <Button variant="primary" size="sm" onClick={() => openAssignTaskModal(emp)}>
          Assign Task
        </Button>
      ),
    },
  ];

  const teamStats = {
    totalEmployees: employees.length,
    totalTasks: employees.reduce((sum, emp) => sum + (emp.workload?.total || 0), 0),
    averageWorkload: employees.length > 0
      ? Math.round(employees.reduce((sum, emp) => sum + (emp.workload?.total || 0), 0) / employees.length)
      : 0,
    heavyWorkload: employees.filter((emp) => (emp.workload?.total || 0) > 6).length,
  };

  return (
    <Layout role="manager">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Manager Dashboard</h1>
            <p className="mt-1 text-sm text-gray-600">
              Use the team members assigned by the admin and create tasks for them.
            </p>
          </div>
          <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-900">
            Team membership is controlled by admin-created users and team assignments.
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
          <StatCard
            title="Team Members"
            value={teamStats.totalEmployees}
            icon={
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            }
            bgColor="bg-blue-500"
          />
          <StatCard
            title="Total Tasks"
            value={teamStats.totalTasks}
            icon={
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            }
            bgColor="bg-purple-500"
          />
          <StatCard
            title="Avg. Workload"
            value={teamStats.averageWorkload}
            icon={
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            }
            bgColor="bg-green-500"
          />
          <StatCard
            title="Heavy Workload"
            value={teamStats.heavyWorkload}
            icon={
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            }
            bgColor="bg-red-500"
          />
        </div>

        <Card title="Team Workload" subtitle="Only employees assigned to your team are available for task assignment.">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" />
            </div>
          ) : (
            <Table
              columns={columns}
              data={employees}
              emptyMessage="No team members are assigned to you yet. Ask the admin to create users and assign them to your team."
            />
          )}
        </Card>
      </div>

      {showAssignTaskModal && selectedEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white/95 p-6 shadow-2xl">
            <h2 className="mb-5 text-xl font-bold text-gray-900">
              Assign Task to {selectedEmployee.fullName}
            </h2>

            <form onSubmit={handleAssignTask} className="space-y-5">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Task Title</label>
                <input
                  type="text"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                  className="min-h-[80px] w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Priority</label>
                <select
                  value={taskForm.priority}
                  onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Deadline</label>
                <input
                  type="date"
                  value={taskForm.deadline}
                  onChange={(e) => setTaskForm({ ...taskForm, deadline: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowAssignTaskModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary">
                  Assign Task
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

const StatCard = ({ title, value, icon, bgColor }) => (
  <Card className="relative overflow-hidden">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
      </div>
      <div className={`${bgColor} rounded-lg p-3`}>
        <div className="text-white">{icon}</div>
      </div>
    </div>
  </Card>
);

export default ManagerDashboard;
