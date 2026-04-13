import React, { useEffect, useState } from 'react';
import axios from '../api/axiosInstance';
import Layout from '../components/Layout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { toast } from 'react-hot-toast';

const ManagerAvailableTasksPage = () => {
  const [board, setBoard] = useState({ unassignedTasks: [], summary: null });

  const load = async () => {
    try {
      const response = await axios.get('/tasks/manager-board');
      setBoard(response.data);
    } catch {
      toast.error('Failed to load backlog tasks');
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <Layout role="manager">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Card
          title="Backlog and Recommendation Feed"
          subtitle="These tasks are not assigned yet. Each card shows the best-fit employees suggested by the recommendation engine."
          action={<Button variant="outline" onClick={load}>Refresh</Button>}
        >
          <div className="space-y-4">
            {board.unassignedTasks.map((task) => (
              <div key={task.id} className="rounded-[26px] border border-[rgba(58,44,30,0.08)] bg-white/60 p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-[rgba(196,106,47,0.12)] px-3 py-1 text-xs text-[#8e3f16]">{task.priority}</span>
                      <span className="rounded-full bg-[rgba(47,107,95,0.1)] px-3 py-1 text-xs text-[#25564d]">Weight {task.weight}</span>
                    </div>
                    <h3 className="mt-3 text-xl font-semibold">{task.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-[#6b5a4f]">{task.description}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {(task.requiredSkills || []).map((skill) => (
                        <span key={skill} className="rounded-full bg-[rgba(32,21,15,0.08)] px-3 py-1 text-xs text-[#3a2c1e]">{skill}</span>
                      ))}
                    </div>
                  </div>
                  <div className="min-w-[240px] rounded-[22px] bg-[rgba(244,239,231,0.8)] p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-[#8e3f16]">Best Match</p>
                    {task.recommendations?.[0] ? (
                      <>
                        <p className="mt-2 font-semibold">{task.recommendations[0].fullName}</p>
                        <p className="text-sm text-[#6b5a4f]">Score {task.recommendations[0].score} | Risk {task.recommendations[0].projectedRisk}</p>
                      </>
                    ) : <p className="mt-2 text-sm text-[#6b5a4f]">No recommendation yet.</p>}
                  </div>
                </div>
              </div>
            ))}
            {!board.unassignedTasks.length ? <p className="text-sm text-[#6b5a4f]">No backlog tasks available.</p> : null}
          </div>
        </Card>

        <aside className="space-y-6 xl:sticky xl:top-28 xl:self-start">
          <Card title="Backlog Summary">
            <div className="space-y-3">
              <Summary label="Unassigned Tasks" value={board.summary?.unassignedTaskCount || 0} />
              <Summary label="High Priority" value={board.unassignedTasks.filter((task) => task.priority === 'High').length} />
              <Summary label="Skill-Based Tasks" value={board.unassignedTasks.filter((task) => (task.requiredSkills || []).length > 0).length} />
            </div>
          </Card>
        </aside>
      </div>
    </Layout>
  );
};

const Summary = ({ label, value }) => (
  <div className="rounded-[18px] bg-[rgba(244,239,231,0.78)] p-4">
    <p className="text-sm text-[#6b5a4f]">{label}</p>
    <p className="mt-2 text-2xl font-semibold">{value}</p>
  </div>
);

export default ManagerAvailableTasksPage;
