import React, { useEffect, useState } from 'react';
import axios from '../api/axiosInstance';
import Layout from '../components/Layout';
import Card from '../components/ui/Card';
import Table from '../components/ui/Table';
import Button from '../components/ui/Button';
import { alertService } from '../services/alertService';
import { toastService, toastMessages } from '../services/toastService';

/**
 * Admin Dashboard - Manage all users in the system
 */

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingUserId, setDeletingUserId] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get('/users');
      setUsers(res.data);
    } catch (err) {
      console.error('Failed to fetch users:', err);
      toastService.error(toastMessages.loadError);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async (user) => {
    const result = await alertService.confirmUserRemoval(user.fullName);
    
    if (result.isConfirmed) {
      setDeletingUserId(user.id);
      
      try {
        await axios.delete(`/users/${user.id}`);
        setUsers(users.filter(u => u.id !== user.id));
        toastService.success(toastMessages.userDeleted);
      } catch (err) {
        console.error('Failed to delete user:', err);
        toastService.error(toastMessages.userError);
      } finally {
        setDeletingUserId(null);
      }
    }
  };

  const columns = [
    {
      header: 'Name',
      accessor: 'fullName',
      render: (user) => (
        <div className="flex items-center">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
            <span className="text-sm font-medium text-blue-700">
              {user.fullName.charAt(0).toUpperCase()}
            </span>
          </div>
          <span className="font-medium">{user.fullName}</span>
        </div>
      ),
    },
    {
      header: 'Email',
      accessor: 'email',
    },
    {
      header: 'Role',
      accessor: 'role',
      render: (user) => (
        <span className={`
          inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
          ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' : ''}
          ${user.role === 'manager' ? 'bg-blue-100 text-blue-800' : ''}
          ${user.role === 'employee' ? 'bg-green-100 text-green-800' : ''}
        `}>
          {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
        </span>
      ),
    },
    {
      header: 'Actions',
      accessor: 'actions',
      render: (user) => (
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEditUser(user)}
          >
            Edit
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => handleDeleteUser(user)}
            loading={deletingUserId === user.id}
            disabled={deletingUserId === user.id}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  const handleEditUser = (user) => {
    // TODO: Implement edit user modal
    toastService.info('Edit user feature coming soon');
  };

  const handleCreateUser = () => {
    // TODO: Implement create user modal
    toastService.info('Create user feature coming soon');
  };

  return (
    <Layout role="admin">
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-sm text-gray-600 mt-1">Manage users and system settings</p>
          </div>
          <Button variant="primary" onClick={handleCreateUser}>
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add User
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            title="Total Users"
            value={users.length}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            }
            bgColor="bg-blue-500"
          />
          <StatCard
            title="Managers"
            value={users.filter(u => u.role === 'manager').length}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            }
            bgColor="bg-purple-500"
          />
          <StatCard
            title="Employees"
            value={users.filter(u => u.role === 'employee').length}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            }
            bgColor="bg-green-500"
          />
        </div>

        {/* Users Table */}
        <Card title="All Users" subtitle="Manage user accounts and permissions">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : (
            <Table
              columns={columns}
              data={users}
              emptyMessage="No users found. Create your first user to get started."
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

export default AdminDashboard;