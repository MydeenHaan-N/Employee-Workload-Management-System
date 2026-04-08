import React, { useEffect, useState } from 'react';
import axios from '../api/axiosInstance';
import Layout from '../components/Layout';
import Card from '../components/ui/Card';
import Table from '../components/ui/Table';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { toast } from 'react-hot-toast';

const AdminRolesPage = () => {
  const [roles, setRoles] = useState([]);
  const [form, setForm] = useState({ name: '', description: '' });
  const [showModal, setShowModal] = useState(false);

  const load = async () => {
    try {
      const response = await axios.get('/roles');
      setRoles(response.data);
    } catch {
      toast.error('Failed to load roles');
    }
  };

  useEffect(() => {
    load();
  }, []);

  const save = async (event) => {
    event.preventDefault();
    try {
      await axios.post('/roles', form);
      setForm({ name: '', description: '' });
      setShowModal(false);
      toast.success('Role created');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create role');
    }
  };

  return (
    <Layout role="admin">
      <Card
        title="Role Management"
        subtitle="Review role definitions and extend system permissions if your academic scope needs more personas."
        action={<Button onClick={() => setShowModal(true)}>Create Role</Button>}
      >
        <Table
          columns={[
            { header: 'Role', render: (role) => <span className="rounded-full bg-[rgba(196,106,47,0.12)] px-3 py-1 text-xs font-semibold text-[#8e3f16]">{role.name}</span> },
            { header: 'Description', accessor: 'description' },
          ]}
          data={roles}
          emptyMessage="No roles available."
        />
      </Card>

      {showModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(32,21,15,0.3)] p-4 backdrop-blur-sm">
          <Card className="w-full max-w-xl" title="Create Role">
            <form onSubmit={save} className="space-y-4">
              <Input label="Role Name" value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value.toLowerCase() }))} required />
              <Input label="Description" as="textarea" rows={4} value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} />
              <div className="flex justify-end gap-3">
                <Button type="button" variant="ghost" onClick={() => setShowModal(false)}>Cancel</Button>
                <Button type="submit">Create Role</Button>
              </div>
            </form>
          </Card>
        </div>
      ) : null}
    </Layout>
  );
};

export default AdminRolesPage;
