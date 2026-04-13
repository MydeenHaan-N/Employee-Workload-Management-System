import React, { useEffect, useState } from 'react';
import axios from '../api/axiosInstance';
import Layout from '../components/Layout';
import Card from '../components/ui/Card';
import Table from '../components/ui/Table';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { toast } from 'react-hot-toast';

const emptyForm = { fullName: '', email: '', password: '', role: 'employee', skills: '' };
const getRoleName = (user) => user?.roleDetails?.name || user?.role || 'employee';

const AdminUsersPage = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const load = async () => {
    try {
      const [usersResponse, rolesResponse] = await Promise.all([axios.get('/users'), axios.get('/roles')]);
      setUsers(usersResponse.data);
      setRoles(rolesResponse.data);
    } catch {
      toast.error('Failed to load users');
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openModal = (user = null) => {
    setSelectedUser(user);
    setForm(user ? {
      fullName: user.fullName,
      email: user.email,
      password: '',
      role: getRoleName(user),
      skills: (user.skills || []).join(', '),
    } : emptyForm);
    setShowModal(true);
  };

  const save = async (event) => {
    event.preventDefault();
    try {
      const payload = {
        fullName: form.fullName,
        role: form.role,
      };

      if (selectedUser) {
        await axios.put(`/users/${selectedUser.id}`, payload);
      } else {
        await axios.post('/users', {
          ...payload,
          skills: form.skills.split(',').map((item) => item.trim()).filter(Boolean),
          email: form.email,
          password: form.password,
        });
      }

      setShowModal(false);
      setSelectedUser(null);
      setForm(emptyForm);
      toast.success(`User ${selectedUser ? 'updated' : 'created'} successfully`);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save user');
    }
  };

  const remove = async (user) => {
    if (!window.confirm(`Delete ${user.fullName}?`)) return;
    try {
      await axios.delete(`/users/${user.id}`);
      toast.success('User deleted');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete user');
    }
  };

  const columns = [
    {
      header: 'User',
      render: (user) => (
        <div>
          <p className="font-semibold">{user.fullName}</p>
          <p className="mt-1 text-xs text-[#6b5a4f]">{user.email}</p>
        </div>
      ),
    },
    {
      header: 'Role',
      render: (user) => <span className="rounded-full bg-[rgba(196,106,47,0.12)] px-3 py-1 text-xs font-semibold text-[#8e3f16]">{getRoleName(user)}</span>,
    },
    {
      header: 'Skills',
      render: (user) => (
        <div className="flex flex-wrap gap-2">
          {(user.skills || []).length ? (user.skills || []).map((skill) => (
            <span key={skill} className="rounded-full bg-[rgba(47,107,95,0.1)] px-3 py-1 text-xs text-[#25564d]">{skill}</span>
          )) : <span className="text-[#6b5a4f]">No skills</span>}
        </div>
      ),
    },
    {
      header: 'Actions',
      render: (user) => (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => openModal(user)}>Edit</Button>
          <Button size="sm" variant="danger" onClick={() => remove(user)}>Delete</Button>
        </div>
      ),
    },
  ];

  return (
    <Layout role="admin">
      <Card
        title="User Management"
        subtitle="Create accounts, assign roles, and seed the skill profiles used by the smart allocation engine."
        action={<Button onClick={() => openModal()}>Create User</Button>}
      >
        <Table columns={columns} data={users} emptyMessage="No users found." />
      </Card>

      {showModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(32,21,15,0.3)] p-4 backdrop-blur-sm">
          <Card className="w-full max-w-2xl" title={selectedUser ? 'Edit User' : 'Create User'}>
            <form onSubmit={save} className="grid gap-4 md:grid-cols-2">
              <Input label="Full Name" value={form.fullName} onChange={(e) => setForm((prev) => ({ ...prev, fullName: e.target.value }))} required />
              <Input label="Email" type="email" value={form.email} disabled={Boolean(selectedUser)} onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))} required />
              {!selectedUser ? (
                <Input label="Password" type="password" value={form.password} onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))} required />
              ) : <div />}
              <Input label="Role" as="select" value={form.role} onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value }))}>
                {roles.map((role) => <option key={role.id} value={role.name}>{role.name}</option>)}
              </Input>
              {!selectedUser ? (
                <div className="md:col-span-2">
                  <Input
                    label="Skills"
                    value={form.skills}
                    onChange={(e) => setForm((prev) => ({ ...prev, skills: e.target.value }))}
                    placeholder="react, reporting, auditing"
                    helpText="Optional starting skills. Employees manage updates themselves after account creation."
                  />
                </div>
              ) : null}
              <div className="md:col-span-2 flex justify-end gap-3">
                <Button type="button" variant="ghost" onClick={() => setShowModal(false)}>Cancel</Button>
                <Button type="submit">{selectedUser ? 'Update User' : 'Create User'}</Button>
              </div>
            </form>
          </Card>
        </div>
      ) : null}
    </Layout>
  );
};

export default AdminUsersPage;
