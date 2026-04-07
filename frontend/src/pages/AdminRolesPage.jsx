import React, { useEffect, useState } from 'react';
import axios from '../api/axiosInstance';
import Layout from '../components/Layout';
import Card from '../components/ui/Card';
import Table from '../components/ui/Table';
import Button from '../components/ui/Button';
import { toast } from 'react-hot-toast';

const defaultRoleForm = {
  name: '',
  description: '',
};

const AdminRolesPage = () => {
  const [roles, setRoles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [roleForm, setRoleForm] = useState(defaultRoleForm);

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get('/roles');
      setRoles(response.data);
    } catch (err) {
      console.error('Error loading roles:', err);
      toast.error('Failed to load roles');
    } finally {
      setIsLoading(false);
    }
  };

  const closeRoleModal = () => {
    setShowRoleModal(false);
    setRoleForm(defaultRoleForm);
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
      loadRoles();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create role');
    }
  };

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
            <h1 className="text-2xl font-bold text-gray-900">Role Management</h1>
            <p className="mt-1 text-sm text-gray-600">
              Create roles and review access descriptions from this dedicated page.
            </p>
          </div>
          <Button variant="primary" onClick={() => setShowRoleModal(true)}>
            Create Role
          </Button>
        </div>

        <Card title="Role Table" subtitle="This table is shown only on the Add Role page.">
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

const getRoleBadgeClass = (role) => {
  const baseClass = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium';
  if (role === 'admin') return `${baseClass} bg-purple-100 text-purple-800`;
  if (role === 'manager') return `${baseClass} bg-blue-100 text-blue-800`;
  if (role === 'employee') return `${baseClass} bg-green-100 text-green-800`;
  return `${baseClass} bg-slate-100 text-slate-800`;
};

export default AdminRolesPage;
