import React, { useEffect, useMemo, useState } from 'react';
import axios from '../api/axiosInstance';
import Layout from '../components/Layout';
import Card from '../components/ui/Card';
import Table from '../components/ui/Table';
import { toastService, toastMessages } from '../services/toastService';

const EmployeeTasksPage = () => {
  const [tasks, setTasks] = useState([]);
  const [updatingTaskId, setUpdatingTaskId] = useState(null);

  const fetchTasks = async () => {
    try {
      const response = await axios.get('/tasks/my');
      setTasks(response.data);
    } catch {
      toastService.error(toastMessages.loadError);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const summary = useMemo(() => ({
    total: tasks.length,
    inProgress: tasks.filter((task) => task.status === 'In Progress').length,
    overdue: tasks.filter((task) => task.status === 'Overdue').length,
  }), [tasks]);

  const updateStatus = async (taskId, status) => {
    setUpdatingTaskId(taskId);
    try {
      const response = await axios.put(`/tasks/${taskId}/status`, { status });
      setTasks((prev) => prev.map((task) => (task.id === taskId ? response.data : task)));
      toastService.success(toastMessages.taskStatusUpdated);
    } catch {
      toastService.error(toastMessages.taskError);
    } finally {
      setUpdatingTaskId(null);
    }
  };

  return (
    <Layout role="employee">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
        <Card title="My Task Table" subtitle="Compact view to reduce vertical scrolling while keeping all task controls visible.">
          <Table
            columns={[
              {
                header: 'Task',
                render: (task) => (
                  <div>
                    <p className="font-semibold">{task.title}</p>
                    <p className="mt-1 text-xs text-[#6b5a4f]">{task.description}</p>
                  </div>
                ),
              },
              { header: 'Priority', accessor: 'priority' },
              { header: 'Weight', accessor: 'weight' },
              {
                header: 'Deadline',
                render: (task) => (task.deadline ? new Date(task.deadline).toLocaleDateString() : '-'),
              },
              { header: 'Status', accessor: 'status' },
              {
                header: 'Action',
                render: (task) => (
                  <select
                    value={task.status}
                    disabled={updatingTaskId === task.id}
                    onChange={(e) => updateStatus(task.id, e.target.value)}
                    className="rounded-xl border border-[rgba(58,44,30,0.14)] bg-white/80 px-3 py-2 text-sm outline-none focus:border-[#c46a2f] focus:ring-4 focus:ring-[rgba(196,106,47,0.14)]"
                  >
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                ),
              },
            ]}
            data={tasks}
            emptyMessage="No tasks assigned yet."
          />
        </Card>

        <aside className="space-y-6 xl:sticky xl:top-28 xl:self-start">
          <Card title="Task Summary">
            <Summary label="Total Tasks" value={summary.total} />
            <Summary label="In Progress" value={summary.inProgress} />
            <Summary label="Overdue" value={summary.overdue} />
          </Card>
        </aside>
      </div>
    </Layout>
  );
};

const Summary = ({ label, value }) => (
  <div className="mb-3 rounded-[18px] bg-[rgba(244,239,231,0.78)] p-4">
    <p className="text-sm text-[#6b5a4f]">{label}</p>
    <p className="mt-2 text-2xl font-semibold">{value}</p>
  </div>
);

export default EmployeeTasksPage;
