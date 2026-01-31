import React, { useEffect, useState } from 'react';
import axios from '../api/axiosInstance';
import Layout from '../components/Layout';
import Card from '../components/ui/Card';
import Table from '../components/ui/Table';
import Button from '../components/ui/Button';
import { toastService, toastMessages } from '../services/toastService';

/**
 * Manager Dashboard - View team workload and assign tasks
 */

const ManagerDashboard = () => {
  const [employees, setEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    setIsLoading(true);
    try {
      // Fetch employees under this manager
      const res = await axios.get('/users', { params: { managerId: 'me' } });
      
      // Fetch workload for each employee
      const employeesWithWorkload = await Promise.all(
        res.data.map(async (emp) => {
          try {
            const workloadRes = await axios.get(`/tasks/workload/${emp.id}`);
            return {
              ...emp,
              workload: workloadRes.data,
            };
          } catch (err) {
            console.error(`Failed to fetch workload for employee ${emp.id}:`, err);
            return {
              ...emp,
              workload: { total: 0, pending: 0, inProgress: 0, completed: 0 },
            };
          }
        })
      );
      
      setEmployees(employeesWithWorkload);
    } catch (err) {
      console.error('Failed to fetch employees:', err);
      toastService.error(toastMessages.loadError);
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

  const columns = [
    {
      header: 'Employee',
      accessor: 'fullName',
      render: (emp) => (
        <div className="flex items-center">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
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
      render: (emp) => (
        <span className="font-semibold text-gray-900">
          {emp.workload?.total || 0}
        </span>
      ),
    },
    {
      header: 'Pending',
      accessor: 'workload.pending',
      render: (emp) => (
        <span className="text-yellow-600 font-medium">
          {emp.workload?.pending || 0}
        </span>
      ),
    },
    {
      header: 'In Progress',
      accessor: 'workload.inProgress',
      render: (emp) => (
        <span className="text-blue-600 font-medium">
          {emp.workload?.inProgress || 0}
        </span>
      ),
    },
    {
      header: 'Completed',
      accessor: 'workload.completed',
      render: (emp) => (
        <span className="text-green-600 font-medium">
          {emp.workload?.completed || 0}
        </span>
      ),
    },
    {
      header: 'Workload Status',
      accessor: 'workloadStatus',
      render: (emp) => {
        const status = getWorkloadStatus(emp.workload);
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
            {status.label}
          </span>
        );
      },
    },
    {
      header: 'Actions',
      accessor: 'actions',
      render: (emp) => (
        <Button
          variant="primary"
          size="sm"
          onClick={() => handleAssignTask(emp)}
        >
          Assign Task
        </Button>
      ),
    },
  ];

  const handleAssignTask = (employee) => {
    // TODO: Implement task assignment modal
    toastService.info(`Assign task to ${employee.fullName} - Coming soon`);
  };

  const teamStats = {
    totalEmployees: employees.length,
    totalTasks: employees.reduce((sum, emp) => sum + (emp.workload?.total || 0), 0),
    averageWorkload: employees.length > 0
      ? Math.round(employees.reduce((sum, emp) => sum + (emp.workload?.total || 0), 0) / employees.length)
      : 0,
    heavyWorkload: employees.filter(emp => (emp.workload?.total || 0) > 6).length,
  };

  return (
    <Layout role="manager">
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Manager Dashboard</h1>
            <p className="text-sm text-gray-600 mt-1">Monitor team workload and assign tasks</p>
          </div>
          <Button variant="primary" onClick={() => toastService.info('Create task feature coming soon')}>
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Create Task
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatCard
            title="Team Members"
            value={teamStats.totalEmployees}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            }
            bgColor="bg-blue-500"
          />
          <StatCard
            title="Total Tasks"
            value={teamStats.totalTasks}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            }
            bgColor="bg-purple-500"
          />
          <StatCard
            title="Avg. Workload"
            value={teamStats.averageWorkload}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            }
            bgColor="bg-green-500"
          />
          <StatCard
            title="Heavy Workload"
            value={teamStats.heavyWorkload}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            }
            bgColor="bg-red-500"
          />
        </div>

        {/* Team Workload Table */}
        <Card title="Team Workload" subtitle="Monitor and balance task distribution across your team">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : (
            <Table
              columns={columns}
              data={employees}
              emptyMessage="No team members found. Add employees to your team to get started."
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

export default ManagerDashboard;