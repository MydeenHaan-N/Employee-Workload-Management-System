import React, { useEffect, useState } from 'react';
import axios from '../api/axiosInstance';
import Layout from '../components/Layout';
import Card from '../components/ui/Card';
import { toast } from 'react-hot-toast';

const ManagerDashboard = () => {
  const [employees, setEmployees] = useState([]);
  const [availableEmployees, setAvailableEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadManagerData();
  }, []);

  const loadManagerData = async () => {
    setIsLoading(true);
    try {
      const [teamResponse, availableResponse] = await Promise.all([
        axios.get('/users/team'),
        axios.get('/users/available'),
      ]);
      setEmployees(teamResponse.data);
      setAvailableEmployees(availableResponse.data);
    } catch (err) {
      console.error('Failed to fetch manager data:', err);
      toast.error(err.response?.data?.message || 'Failed to load manager dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const totalTasks = employees.reduce((sum, emp) => sum + (emp.workload?.total || 0), 0);
  const averageWorkload = employees.length > 0 ? Math.round(totalTasks / employees.length) : 0;
  const heavyWorkload = employees.filter((emp) => (emp.workload?.total || 0) > 6).length;

  return (
    <Layout role="manager">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Manager Dashboard</h1>
            <p className="mt-1 text-sm text-gray-600">
              Use the sidebar to manage available employees and create tasks for your selected team members.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
          <StatCard title="Team Members" value={isLoading ? '...' : employees.length} bgColor="bg-blue-500" />
          <StatCard title="Available Employees" value={isLoading ? '...' : availableEmployees.length} bgColor="bg-emerald-500" />
          <StatCard title="Total Tasks" value={isLoading ? '...' : totalTasks} bgColor="bg-purple-500" />
          <StatCard title="Heavy Workload" value={isLoading ? '...' : heavyWorkload} bgColor="bg-red-500" />
        </div>
      </div>
    </Layout>
  );
};

const StatCard = ({ title, value, bgColor }) => (
  <Card className="relative overflow-hidden">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
      </div>
      <div className={`${bgColor} h-12 w-12 rounded-lg`} />
    </div>
  </Card>
);

export default ManagerDashboard;
