import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from '../api/axiosInstance';
import Layout from '../components/Layout';
import Card from '../components/ui/Card';
import Table from '../components/ui/Table';
import Button from '../components/ui/Button';
import { toast } from 'react-hot-toast';

const defaultUserForm = {
  fullName: '',
  email: '',
  password: '',
  role: 'employee',
  managerId: '',
};

const defaultRoleForm = {
  name: '',
  description: '',
};

const AdminDashboard = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userForm, setUserForm] = useState(defaultUserForm);
  const [roleForm, setRoleForm] = useState(defaultRoleForm);

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    setShowRoleModal(searchParams.get('modal') === 'role');
  }, [searchParams]);

  const managers = useMemo(
    () => users.filter((user) => user.role === 'manager'),
    [users]
  );

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

  const openUserModal = (user = null) => {
    if (user) {
      setIsEditMode(true);
      setSelectedUser(user);
      setUserForm({
        fullName: user.fullName || '',
        email: user.email || '',
        password: '',
        role: user.role || 'employee',
        managerId: user.managerId ? String(user.managerId) : '',
      });
    } else {
      setIsEditMode(false);
      setSelectedUser(null);
      setUserForm(defaultUserForm);
    }

    setShowUserModal(true);
  };

  const closeUserModal = () => {
    setShowUserModal(false);
    setIsEditMode(false);
    setSelectedUser(null);
    setUserForm(defaultUserForm);
  };

  const closeRoleModal = () => {
    setShowRoleModal(false);
    setRoleForm(defaultRoleForm);
    setSearchParams({});
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();

    if (!userForm.fullName.trim() || !userForm.email.trim()) {
      toast.error('Full name and email are required');
      return;
    }

    if (!isEditMode && !userForm.password.trim()) {
      toast.error('Password is required for new users');
      return;
    }

    const payload = {
      fullName: userForm.fullName.trim(),
      role: userForm.role,
      managerId: userForm.role === 'employee' && userForm.managerId ? Number(userForm.managerId) : null,
    };

    try {
      if (isEditMode) {
        await axios.put(`/users/${selectedUser.id}`, payload);
        toast.success('User updated successfully');
      } else {
        await axios.post('/users', {
          ...payload,
          email: userForm.email.trim(),
          password: userForm.password,
        });
        toast.success('User created successfully');
      }

      closeUserModal();
      loadDashboardData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save user');
    }
  };

  const handleCreateRole = async (e) => {
    e.preventDefault();

    if (!roleForm.name.trim()) {
      toast.error('Role name is required');
      return;
    }

    try {
      await axios.post('/roles', {
        name: roleForm.name.trim(),
        description: roleForm.description.trim(),
      });
      toast.success('Role created successfully');
      closeRoleModal();
      loadDashboardData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create role');
    }
  };

  const handleDelete = async (user) => {
    if (!window.confirm(`Delete user ${user.fullName}?\nThis cannot be undone.`)) {
      return;
    }

    setDeletingId(user.id);
    try {
      await axios.delete(`/users/${user.id}`);
      toast.success('User deleted successfully');
      setUsers((prev) => prev.filter((item) => item.id !== user.id));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete user');
    } finally {
      setDeletingId(null);
    }
  };

  const userColumns = [
    {
      header: 'Name',
      accessor: 'fullName',
      render: (user) => (
        <div className="flex items-center">
          <div className="mr-3 flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
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
        <span className={getRoleBadgeClass(user.role)}>
          {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
        </span>
      ),
    },
    {
      header: 'Manager',
      accessor: 'managerId',
      render: (user) => {
        const manager = managers.find((item) => item.id === user.managerId);
        return user.role === 'employee'
          ? <span>{manager?.fullName || 'Unassigned'}</span>
          : <span className="text-gray-400">Not applicable</span>;
      },
    },
    {
      header: 'Actions',
      accessor: 'actions',
      render: (user) => (
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" onClick={() => openUserModal(user)}>
            Edit
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => handleDelete(user)}
            loading={deletingId === user.id}
            disabled={deletingId === user.id}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  const roleColumns = [
    {
      header: 'Role Name',
      accessor: 'name',
      render: (role) => (
        <span className={getRoleBadgeClass(role.name)}>
          {role.name.charAt(0).toUpperCase() + role.name.slice(1)}
        </span>
      ),
    },
    {
      header: 'Description',
      accessor: 'description',
      render: (role) => role.description || 'No description',
    },
  ];

  return (
    <Layout role="admin">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="mt-1 text-sm text-gray-600">Admin can create roles, create users, and assign employees to manager teams.</p>
          </div>
          <div className="flex gap-3">
            <Button variant="primary" onClick={() => openUserModal()}>
              Add User
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
          <StatCard title="Total Users" value={users.length} bgColor="bg-blue-500" />
          <StatCard title="Roles" value={roles.length} bgColor="bg-slate-500" />
          <StatCard title="Managers" value={users.filter((user) => user.role === 'manager').length} bgColor="bg-purple-500" />
          <StatCard title="Employees" value={users.filter((user) => user.role === 'employee').length} bgColor="bg-green-500" />
        </div>

        <Card title="Users" subtitle="Create users and assign employee accounts to manager teams.">
          {isLoading ? (
            <LoadingState />
          ) : (
            <Table
              columns={userColumns}
              data={users}
              emptyMessage="No users found. Create the first user to get started."
            />
          )}
        </Card>

        <Card title="Role Table" subtitle="Roles available for user creation and access control.">
          {isLoading ? (
            <LoadingState />
          ) : (
            <Table
              columns={roleColumns}
              data={roles}
              emptyMessage="No roles found. Create a role to start assigning users."
            />
          )}
        </Card>
      </div>

      {showUserModal && (
        <ModalShell title={isEditMode ? 'Edit User' : 'Create New User'}>
          <form onSubmit={handleSaveUser} className="space-y-5">
            <Field label="Full Name">
              <input
                type="text"
                value={userForm.fullName}
                onChange={(e) => setUserForm({ ...userForm, fullName: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </Field>

            <Field label="Email">
              <input
                type="email"
                value={userForm.email}
                onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500"
                required
                disabled={isEditMode}
              />
            </Field>

            {!isEditMode && (
              <Field label="Password">
                <input
                  type="password"
                  value={userForm.password}
                  onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  minLength={6}
                />
              </Field>
            )}

            <Field label="Role">
              <select
                value={userForm.role}
                onChange={(e) => setUserForm({ ...userForm, role: e.target.value, managerId: e.target.value === 'employee' ? userForm.managerId : '' })}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500"
              >
                {roles.map((role) => (
                  <option key={role.id} value={role.name}>
                    {role.name.charAt(0).toUpperCase() + role.name.slice(1)}
                  </option>
                ))}
              </select>
            </Field>

            {userForm.role === 'employee' && (
              <Field label="Assign Manager">
                <select
                  value={userForm.managerId}
                  onChange={(e) => setUserForm({ ...userForm, managerId: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Unassigned</option>
                  {managers.map((manager) => (
                    <option key={manager.id} value={manager.id}>
                      {manager.fullName}
                    </option>
                  ))}
                </select>
              </Field>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={closeUserModal}>
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                {isEditMode ? 'Update User' : 'Create User'}
              </Button>
            </div>
          </form>
        </ModalShell>
      )}

      {showRoleModal && (
        <ModalShell title="Create Role">
          <form onSubmit={handleCreateRole} className="space-y-5">
            <Field label="Role Name">
              <input
                type="text"
                value={roleForm.name}
                onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value.toLowerCase() })}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </Field>

            <Field label="Description">
              <textarea
                value={roleForm.description}
                onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
                className="min-h-[90px] w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </Field>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={closeRoleModal}>
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                Create Role
              </Button>
            </div>
          </form>
        </ModalShell>
      )}
    </Layout>
  );
};

const LoadingState = () => (
  <div className="flex items-center justify-center py-12">
    <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" />
  </div>
);

const ModalShell = ({ title, children }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
    <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white/95 p-6 shadow-2xl">
      <h2 className="mb-5 text-xl font-bold text-gray-900">{title}</h2>
      {children}
    </div>
  </div>
);

const Field = ({ label, children }) => (
  <div>
    <label className="mb-1.5 block text-sm font-medium text-gray-700">{label}</label>
    {children}
  </div>
);

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

const getRoleBadgeClass = (role) => {
  const baseClass = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium';
  if (role === 'admin') return `${baseClass} bg-purple-100 text-purple-800`;
  if (role === 'manager') return `${baseClass} bg-blue-100 text-blue-800`;
  if (role === 'employee') return `${baseClass} bg-green-100 text-green-800`;
  return `${baseClass} bg-slate-100 text-slate-800`;
};

export default AdminDashboard;
