import React, { useEffect, useState } from 'react';
import axios from '../api/axiosInstance';
import Layout from '../components/Layout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { toast } from 'react-hot-toast';

const ManagerTaskAssignmentPage = () => {
  const [board, setBoard] = useState({ team: [], unassignedTasks: [], summary: null });
  const [selectedEmployees, setSelectedEmployees] = useState({});

  const load = async () => {
    try {
      const response = await axios.get('/tasks/manager-board');
      setBoard(response.data);
    } catch {
      toast.error('Failed to load assignment board');
    }
  };

  useEffect(() => {
    load();
  }, []);

  const assign = async (taskId, employeeId = null) => {
    try {
      await axios.post(`/tasks/${taskId}/assign`, employeeId ? { employeeId } : {});
      toast.success(employeeId ? 'Task assigned manually' : 'Task assigned using recommendation engine');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to assign task');
    }
  };

  const autoAssignAll = async () => {
    try {
      const response = await axios.post('/tasks/auto-assign');
      toast.success(response.data?.message || 'Tasks assigned');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to auto-assign tasks');
    }
  };

  return (
    <Layout role="manager">
      <Card
        title="Assignment Lab"
        subtitle="Compare manual assignment against smart recommendation, then dispatch tasks in one click."
        action={<Button onClick={autoAssignAll}>Smart Assign Backlog</Button>}
      >
        <div className="space-y-5">
          {board.unassignedTasks.map((task) => (
            <div key={task.id} className="rounded-[26px] border border-[rgba(58,44,30,0.08)] bg-white/60 p-5">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="max-w-2xl">
                  <p className="text-xs uppercase tracking-[0.18em] text-[#8e3f16]">{task.priority} priority</p>
                  <h3 className="mt-2 text-xl font-semibold">{task.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#6b5a4f]">{task.description}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {(task.requiredSkills || []).map((skill) => (
                      <span key={skill} className="rounded-full bg-[rgba(47,107,95,0.1)] px-3 py-1 text-xs text-[#25564d]">{skill}</span>
                    ))}
                  </div>
                </div>

                <div className="grid min-w-[320px] gap-3">
                  <select
                    value={selectedEmployees[task.id] || ''}
                    onChange={(e) => setSelectedEmployees((prev) => ({ ...prev, [task.id]: e.target.value }))}
                    className="rounded-2xl border border-[rgba(58,44,30,0.14)] bg-white/80 px-4 py-3 text-sm outline-none focus:border-[#c46a2f] focus:ring-4 focus:ring-[rgba(196,106,47,0.14)]"
                  >
                    <option value="">Choose employee manually</option>
                    {board.team.map((employee) => (
                      <option key={employee.id} value={employee.id}>{employee.fullName}</option>
                    ))}
                  </select>
                  <div className="flex gap-3">
                    <Button variant="outline" className="flex-1" onClick={() => assign(task.id, selectedEmployees[task.id])}>
                      Assign Manually
                    </Button>
                    <Button className="flex-1" onClick={() => assign(task.id)}>
                      Smart Assign
                    </Button>
                  </div>
                  <div className="rounded-[20px] bg-[rgba(244,239,231,0.8)] p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-[#8e3f16]">Best Match</p>
                    {task.recommendations?.[0] ? (
                      <>
                        <p className="mt-2 font-semibold">{task.recommendations[0].fullName}</p>
                        <p className="text-sm text-[#6b5a4f]">
                          Score {task.recommendations[0].score} | Projected risk {task.recommendations[0].projectedRisk}
                        </p>
                      </>
                    ) : (
                      <p className="mt-2 text-sm text-[#6b5a4f]">No recommendation available.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
          {!board.unassignedTasks.length ? <p className="text-sm text-[#6b5a4f]">No backlog tasks waiting for assignment.</p> : null}
        </div>
      </Card>
    </Layout>
  );
};

export default ManagerTaskAssignmentPage;
