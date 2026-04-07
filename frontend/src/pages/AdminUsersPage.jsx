import React, { useEffect, useState } from 'react';
import axios from '../api/axiosInstance';
import Layout from '../components/Layout';
import Card from '../components/ui/Card';
import Table from '../components/ui/Table';
import Button from '../components/ui/Button';
import { toast } from 'react-hot-toast';

const getRoleName = (user) => user?.roleDetails?.name || user?.role || 'employee';

const defaultUserForm = {
  fullName: '',
  email: '',
  password: '',
  role: 'employee',
};

const AdminUsersPage = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userForm, setUserForm] = useState(defaultUserForm);

  useEffect(() => {
    loadUsersPageData();
  }, []);

  const loadUsersPageData = async () => {
    setIsLoading(true);
    try {
      const [usersResponse, rolesResponse] = await Promise.all([
        axios.get('/users'),
        axios.get('/roles'),
      ]);
      setUsers(usersResponse.data);
      setRoles(rolesResponse.data);
    } catch (err) {
      console.error('Error loading users page data:', err);
      toast.error('Failed to load users');
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
        role: getRoleName(user),
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
      loadUsersPageData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save user');
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
        <span className={getRoleBadgeClass(getRoleName(user))}>
          {getRoleName(user).charAt(0).toUpperCase() + getRoleName(user).slice(1)}
        </span>
      ),
    },
    {
      header: 'Manager',
      accessor: 'managerId',
      render: (user) => {
        const manager = users.find((item) => item.id === user.managerId);
        return getRoleName(user) === 'employee'
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

  return (
    <Layout role="admin">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
            <p className="mt-1 text-sm text-gray-600">
              Create users and monitor which manager currently owns each employee account.
            </p>
          </div>
          <Button variant="primary" onClick={() => openUserModal()}>
            Create User
          </Button>
        </div>

        <Card title="Users" subtitle="This table is shown only on the Add User page.">
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
                onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
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
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                This employee will be created as unassigned. Managers can claim and release employees from the manager dashboard.
              </div>
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

const getRoleBadgeClass = (role) => {
  const baseClass = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium';
  if (role === 'admin') return `${baseClass} bg-purple-100 text-purple-800`;
  if (role === 'manager') return `${baseClass} bg-blue-100 text-blue-800`;
  if (role === 'employee') return `${baseClass} bg-green-100 text-green-800`;
  return `${baseClass} bg-slate-100 text-slate-800`;
};

export default AdminUsersPage;
