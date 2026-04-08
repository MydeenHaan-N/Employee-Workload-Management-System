import React, { useEffect, useState } from 'react';
import axios from '../api/axiosInstance';
import Layout from '../components/Layout';
import Card from '../components/ui/Card';
import { toast } from 'react-hot-toast';

const getRoleName = (user) => user?.roleDetails?.name || '';

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [usersResponse, rolesResponse] = await Promise.all([axios.get('/users'), axios.get('/roles')]);
        setUsers(usersResponse.data);
        setRoles(rolesResponse.data);
      } catch {
        toast.error('Failed to load admin overview');
      }
    };

    load();
  }, []);

  const managers = users.filter((user) => getRoleName(user) === 'manager').length;
  const employees = users.filter((user) => getRoleName(user) === 'employee');
  const skillCoverage = new Set(employees.flatMap((user) => user.skills || [])).size;

  return (
    <Layout role="admin">
      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="overflow-hidden bg-[linear-gradient(135deg,#20150f,#513122)] text-white">
          <p className="text-xs uppercase tracking-[0.2em] text-[#d8b99b]">System Governance</p>
          <h1 className="mt-4 max-w-2xl text-4xl font-semibold leading-tight">
            Configure the people, roles, and structure behind the workload engine.
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[#eadbcc]">
            Admin controls stay simple here, but they now support a smarter project layer with skill-based assignment and risk-aware planning.
          </p>
        </Card>

        <Card title="Platform Pulse" subtitle="Quick system-level coverage for the capstone scope.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Metric label="Total Users" value={users.length} />
            <Metric label="Roles" value={roles.length} />
            <Metric label="Managers" value={managers} />
            <Metric label="Skill Coverage Tags" value={skillCoverage} />
          </div>
        </Card>
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card title="Role Strategy" subtitle="How the product responsibilities are distributed.">
          <InfoRow title="Admin" copy="Controls system users and role access." />
          <InfoRow title="Manager" copy="Uses analytics, recommendations, and simulation to distribute work." />
          <InfoRow title="Employee" copy="Executes tasks, updates status, and raises blockers to managers." />
        </Card>

        <Card title="Why This Now Feels Like a Capstone">
          <InfoRow title="Decision support" copy="The system goes beyond CRUD with assignment ranking and simulation." />
          <InfoRow title="Risk modeling" copy="Burnout and escalation signals make the product more research-oriented." />
          <InfoRow title="Analytics layer" copy="Dashboards expose team performance and completion trends." />
        </Card>

        <Card title="Data Quality Focus">
          <InfoRow title="Skills" copy="Employees carry structured skill tags for matching." />
          <InfoRow title="Tasks" copy="Tasks can ask for required skills and weighted effort." />
          <InfoRow title="Ownership" copy="Managers still claim employees before assignment decisions." />
        </Card>
      </div>
    </Layout>
  );
};

const Metric = ({ label, value }) => (
  <div className="rounded-[22px] bg-[rgba(244,239,231,0.75)] p-4">
    <p className="text-sm text-[#6b5a4f]">{label}</p>
    <p className="mt-2 text-3xl font-semibold text-[#20150f]">{value}</p>
  </div>
);

const InfoRow = ({ title, copy }) => (
  <div className="rounded-[22px] border border-[rgba(58,44,30,0.08)] bg-white/55 p-4">
    <p className="font-semibold text-[#20150f]">{title}</p>
    <p className="mt-2 text-sm leading-6 text-[#6b5a4f]">{copy}</p>
  </div>
);

export default AdminDashboard;
