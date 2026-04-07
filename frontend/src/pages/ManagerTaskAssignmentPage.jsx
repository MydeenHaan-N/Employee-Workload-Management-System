import React, { useEffect, useMemo, useState } from 'react';
import axios from '../api/axiosInstance';
import Layout from '../components/Layout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { toast } from 'react-hot-toast';

const ManagerTaskAssignmentPage = () => {
  const [board, setBoard] = useState({ team: [], unassignedTasks: [], summary: null });
  const [isLoading, setIsLoading] = useState(true);
  const [assigningTaskId, setAssigningTaskId] = useState(null);
  const [isAutoAssigningAll, setIsAutoAssigningAll] = useState(false);
  const [selectedEmployees, setSelectedEmployees] = useState({});

  useEffect(() => {
    loadBoard();
  }, []);

  const loadBoard = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get('/tasks/manager-board');
      setBoard(response.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load task assignment board');
    } finally {
      setIsLoading(false);
    }
  };

  const employeeOptions = useMemo(
    () => board.team.map((employee) => ({ id: employee.id, fullName: employee.fullName })),
    [board.team]
  );

  const handleAssignTask = async (taskId) => {
    const employeeId = selectedEmployees[taskId];
    if (!employeeId) {
      toast.error('Select an employee first');
      return;
    }

    setAssigningTaskId(taskId);
    try {
      await axios.post(`/tasks/${taskId}/assign`, { employeeId });
      toast.success('Task assigned successfully');
      setSelectedEmployees((prev) => {
        const next = { ...prev };
        delete next[taskId];
        return next;
      });
      loadBoard();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to assign task');
    } finally {
      setAssigningTaskId(null);
    }
  };

  const handleAutoAssign = async (taskId) => {
    setAssigningTaskId(taskId);
    try {
      await axios.post(`/tasks/${taskId}/assign`, {});
      toast.success('Task auto-assigned successfully');
      loadBoard();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to auto-assign task');
    } finally {
      setAssigningTaskId(null);
    }
  };

  const handleAutoAssignAll = async () => {
    setIsAutoAssigningAll(true);
    try {
      const response = await axios.post('/tasks/auto-assign');
      toast.success(response.data?.message || 'Backlog tasks auto-assigned successfully');
      setSelectedEmployees({});
      loadBoard();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to auto-assign backlog tasks');
    } finally {
      setIsAutoAssigningAll(false);
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
            <h1 className="text-2xl font-bold text-gray-900">Task Assignment Board</h1>
            <p className="mt-1 text-sm text-gray-600">
              Create tasks in backlog, then assign them manually or use the top auto-assign action to distribute the whole backlog by workload, priority, and deadline urgency.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="primary"
              onClick={handleAutoAssignAll}
              loading={isAutoAssigningAll}
              disabled={isAutoAssigningAll || isLoading || board.unassignedTasks.length === 0 || board.team.length === 0}
            >
              Auto Assign Tasks
            </Button>
            <Button variant="outline" onClick={loadBoard} disabled={isLoading || isAutoAssigningAll}>
              Refresh Board
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <SummaryCard title="Team Members" value={summary.teamCount} color="bg-blue-500" />
          <SummaryCard title="Assigned Tasks" value={summary.assignedTaskCount} color="bg-emerald-500" />
          <SummaryCard title="Backlog Tasks" value={summary.unassignedTaskCount} color="bg-amber-500" />
        </div>

        <Card
          title="Unassigned Task Backlog"
          subtitle="Tasks created without an employee will stay here until you assign them. Use the top auto-assign button to distribute all backlog tasks in one go."
        >
          {isLoading ? (
            <LoadingState />
          ) : board.unassignedTasks.length === 0 ? (
            <EmptyState message="No backlog tasks. Create a task first and it will appear here." />
          ) : (
            <div className="space-y-4">
              {board.unassignedTasks.map((task) => (
                <div key={task.id} className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-semibold text-gray-900">{task.title}</h3>
                        <Badge color="amber">{task.status}</Badge>
                        <Badge color="slate">Weight {task.weight}</Badge>
                        <Badge color={task.priority === 'High' ? 'red' : task.priority === 'Medium' ? 'blue' : 'green'}>
                          {task.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">{task.description}</p>
                      <p className="text-sm text-gray-500">
                        Deadline: {task.deadline ? new Date(task.deadline).toLocaleDateString() : 'No deadline'}
                      </p>
                    </div>

                    <div className="flex w-full flex-col gap-3 lg:w-80">
                      <select
                        value={selectedEmployees[task.id] || ''}
                        onChange={(e) => setSelectedEmployees((prev) => ({ ...prev, [task.id]: e.target.value }))}
                        className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select employee</option>
                        {employeeOptions.map((employee) => (
                          <option key={employee.id} value={employee.id}>
                            {employee.fullName}
                          </option>
                        ))}
                      </select>

                      <div className="flex gap-2">
                        <Button
                          variant="primary"
                          className="flex-1"
                          onClick={() => handleAssignTask(task.id)}
                          loading={assigningTaskId === task.id}
                          disabled={assigningTaskId === task.id || board.team.length === 0}
                        >
                          Assign
                        </Button>
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={() => handleAutoAssign(task.id)}
                          loading={assigningTaskId === task.id}
                          disabled={assigningTaskId === task.id || board.team.length === 0}
                        >
                          Auto Assign
                        </Button>
                      </div>
                    </div>
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

const EmptyState = ({ message }) => (
  <div className="py-12 text-center text-sm text-gray-500">
    {message}
  </div>
);

export default ManagerTaskAssignmentPage;
