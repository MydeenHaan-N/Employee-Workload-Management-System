import React, { useEffect, useState } from 'react';
import axios from '../api/axiosInstance';
import Layout from '../components/Layout';
import Card from '../components/ui/Card';
import { toast } from 'react-hot-toast';

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const [usersResponse, rolesResponse] = await Promise.all([
        axios.get('/users'),
        axios.get('/roles'),
      ]);
      setUsers(usersResponse.data);
      setRoles(rolesResponse.data);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      toast.error('Failed to load admin data');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout role="admin">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="mt-1 text-sm text-gray-600">
              Admin can create roles and users. Managers will claim and release employee accounts from their dashboard.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
          <StatCard title="Total Users" value={isLoading ? '...' : users.length} bgColor="bg-blue-500" />
          <StatCard title="Roles" value={isLoading ? '...' : roles.length} bgColor="bg-slate-500" />
          <StatCard title="Managers" value={isLoading ? '...' : users.filter((user) => user.role === 'manager').length} bgColor="bg-purple-500" />
          <StatCard title="Employees" value={isLoading ? '...' : users.filter((user) => user.role === 'employee').length} bgColor="bg-green-500" />
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

export default AdminDashboard;
