import React, { useEffect, useState } from 'react';
import axios from '../api/axiosInstance';
import Layout from '../components/Layout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { toast } from 'react-hot-toast';

const ManagerTaskHoldersPage = () => {
  const [board, setBoard] = useState({ team: [], summary: null });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadBoard();
  }, []);

  const loadBoard = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get('/tasks/manager-board');
      setBoard(response.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load employee task holders');
    } finally {
      setIsLoading(false);
    }
  };

  const summary = board.summary || {
    teamCount: 0,
    assignedTaskCount: 0,
    unassignedTaskCount: 0,
  };

  return (
    <Layout role="manager">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Employee Task Holders</h1>
            <p className="mt-1 text-sm text-gray-600">
              View which tasks are currently held by each employee and how much weighted work remains on their plate.
            </p>
          </div>
          <Button variant="outline" onClick={loadBoard} disabled={isLoading}>
            Refresh
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <SummaryCard title="Team Members" value={summary.teamCount} color="bg-blue-500" />
          <SummaryCard title="Assigned Tasks" value={summary.assignedTaskCount} color="bg-emerald-500" />
          <SummaryCard title="Backlog Tasks" value={summary.unassignedTaskCount} color="bg-amber-500" />
        </div>

        <Card
          title="Employee Task Holders"
          subtitle="Each employee card shows the tasks currently held by that team member."
        >
          {isLoading ? (
            <LoadingState />
          ) : board.team.length === 0 ? (
            <EmptyState message="No employees in your team yet. Claim employees first from the employee page." />
          ) : (
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              {board.team.map((employee) => (
                <div key={employee.id} className="rounded-xl border border-gray-200 bg-white">
                  <div className="border-b border-gray-200 px-5 py-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{employee.fullName}</h3>
                        <p className="text-sm text-gray-500">{employee.email}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs uppercase tracking-wide text-gray-500">Remaining Load</p>
                        <p className="text-lg font-bold text-blue-700">{employee.workload?.remainingWeight ?? 0}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 p-5">
                    <div className="flex flex-wrap gap-2 text-xs">
                      <Badge color="blue">Total {employee.assignedTasks?.length || 0}</Badge>
                      <Badge color="amber">Pending {employee.workload?.pending || 0}</Badge>
                      <Badge color="green">In Progress {employee.workload?.inProgress || 0}</Badge>
                      <Badge color="red">Overdue {employee.workload?.overdue || 0}</Badge>
                    </div>

                    {!employee.assignedTasks?.length ? (
                      <EmptyState message="No tasks assigned to this employee right now." compact />
                    ) : (
                      <div className="space-y-3">
                        {employee.assignedTasks.map((task) => (
                          <div key={task.id} className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-medium text-gray-900">{task.title}</p>
                              <Badge color="slate">Weight {task.weight}</Badge>
                              <Badge color={task.status === 'Completed' ? 'green' : task.status === 'Overdue' ? 'red' : 'blue'}>
                                {task.status}
                              </Badge>
                            </div>
                            <p className="mt-2 text-sm text-gray-600">{task.description}</p>
                            <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-500">
                              <span>Deadline: {task.deadline ? new Date(task.deadline).toLocaleDateString() : 'No deadline'}</span>
                              <span>Completion: {task.completionPercent ?? 0}%</span>
                              <span>Priority: {task.priority}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </Layout>
  );
};

const SummaryCard = ({ title, value, color }) => (
  <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
      </div>
      <div className={`h-12 w-12 rounded-lg ${color}`} />
    </div>
  </div>
);

const Badge = ({ children, color }) => {
  const colors = {
    amber: 'bg-amber-100 text-amber-800',
    blue: 'bg-blue-100 text-blue-800',
    green: 'bg-green-100 text-green-800',
    red: 'bg-red-100 text-red-800',
    slate: 'bg-slate-100 text-slate-800',
  };

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colors[color] || colors.slate}`}>
      {children}
    </span>
  );
};

const LoadingState = () => (
  <div className="flex items-center justify-center py-12">
    <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" />
  </div>
);

const EmptyState = ({ message, compact = false }) => (
  <div className={`${compact ? 'py-3' : 'py-12'} text-center text-sm text-gray-500`}>
    {message}
  </div>
);

export default ManagerTaskHoldersPage;
