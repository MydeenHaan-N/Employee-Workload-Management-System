import React, { useEffect, useState } from 'react';
import axios from '../api/axiosInstance';
import Layout from '../components/Layout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { toast } from 'react-hot-toast';

const ManagerTaskHoldersPage = () => {
  const [board, setBoard] = useState({ team: [], summary: null });

  const load = async () => {
    try {
      const response = await axios.get('/tasks/manager-board');
      setBoard(response.data);
    } catch {
      toast.error('Failed to load execution view');
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <Layout role="manager">
      <Card title="Execution View" subtitle="See what every employee currently holds, along with live risk and progress context." action={<Button variant="outline" onClick={load}>Refresh</Button>}>
        <div className="grid gap-5 xl:grid-cols-2">
          {board.team.map((employee) => (
            <div key={employee.id} className="rounded-[26px] border border-[rgba(58,44,30,0.08)] bg-white/60 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-xl font-semibold">{employee.fullName}</h3>
                  <p className="text-sm text-[#6b5a4f]">{employee.email}</p>
                </div>
                <span className="rounded-full bg-[rgba(196,106,47,0.12)] px-3 py-1 text-xs text-[#8e3f16]">
                  Load {employee.workload?.remainingWeight || 0}
                </span>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <Mini label="Active" value={employee.workload?.active || 0} />
                <Mini label="Overdue" value={employee.workload?.overdue || 0} />
                <Mini label="Risk" value={employee.burnoutRisk?.level || 'Safe'} />
              </div>

              <div className="mt-5 space-y-3">
                {(employee.assignedTasks || []).map((task) => (
                  <div key={task.id} className="rounded-[20px] bg-[rgba(244,239,231,0.72)] p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">{task.title}</p>
                      <span className="rounded-full bg-white/80 px-2.5 py-1 text-xs text-[#3a2c1e]">{task.status}</span>
                    </div>
                    <p className="mt-2 text-sm text-[#6b5a4f]">{task.description}</p>
                    <p className="mt-2 text-xs text-[#7d6c60]">
                      Completion {task.completionPercent || 0}% | Weight {task.weight} | Due {task.deadline ? new Date(task.deadline).toLocaleDateString() : '-'}
                    </p>
                  </div>
                ))}
                {!employee.assignedTasks?.length ? <p className="text-sm text-[#6b5a4f]">No tasks currently assigned.</p> : null}
              </div>
            </div>
          ))}
          {!board.team.length ? <p className="text-sm text-[#6b5a4f]">No team members available.</p> : null}
        </div>
      </Card>
    </Layout>
  );
};

const Mini = ({ label, value }) => (
  <div className="rounded-[18px] bg-[rgba(255,255,255,0.72)] p-3">
    <p className="text-xs uppercase tracking-[0.18em] text-[#7d6c60]">{label}</p>
    <p className="mt-2 text-lg font-semibold">{value}</p>
  </div>
);

export default ManagerTaskHoldersPage;
