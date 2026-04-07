import React, { useEffect, useState } from 'react';
import axios from '../api/axiosInstance';
import Layout from '../components/Layout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { toastService, toastMessages } from '../services/toastService';

const defaultQueryForm = {
  subject: '',
  message: '',
};

const EmployeeDashboard = () => {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showMailbox, setShowMailbox] = useState(false);
  const [queryForm, setQueryForm] = useState(defaultQueryForm);
  const [queries, setQueries] = useState([]);
  const [isMailboxLoading, setIsMailboxLoading] = useState(false);
  const [isSendingQuery, setIsSendingQuery] = useState(false);
  const [unreadReplies, setUnreadReplies] = useState(0);

  useEffect(() => {
    fetchTasks();
    loadUnreadReplies();

    const intervalId = window.setInterval(() => {
      loadUnreadReplies();
    }, 30000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  const fetchTasks = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get('/tasks/my');
      setTasks(res.data);
    } catch (err) {
      console.error('Failed to fetch employee overview:', err);
      toastService.error(toastMessages.loadError);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMailbox = async () => {
    setIsMailboxLoading(true);
    try {
      const response = await axios.get('/queries/employee');
      setQueries(response.data.queries || []);
      setUnreadReplies(0);
    } catch (err) {
      toastService.error(err.response?.data?.message || 'Failed to load your questions');
    } finally {
      setIsMailboxLoading(false);
    }
  };

  const loadUnreadReplies = async () => {
    try {
      const response = await axios.get('/queries/employee/unread-count');
      setUnreadReplies(response.data.unreadReplies || 0);
    } catch (err) {
      console.error('Failed to load unread replies:', err);
    }
  };

  const openMailbox = () => {
    setShowMailbox(true);
    loadMailbox();
  };

  const sendQuery = async (e) => {
    e.preventDefault();
    if (!queryForm.subject.trim() || !queryForm.message.trim()) {
      toastService.error('Subject and question are required');
      return;
    }

    setIsSendingQuery(true);
    try {
      await axios.post('/queries/employee', {
        subject: queryForm.subject.trim(),
        message: queryForm.message.trim(),
      });
      toastService.success('Question sent to your manager');
      setQueryForm(defaultQueryForm);
      loadMailbox();
    } catch (err) {
      toastService.error(err.response?.data?.message || 'Failed to send question');
    } finally {
      setIsSendingQuery(false);
    }
  };

  const taskStats = {
    total: tasks.length,
    pending: tasks.filter((task) => task.status?.toLowerCase() === 'pending').length,
    inProgress: tasks.filter((task) => task.status?.toLowerCase() === 'in progress').length,
    completed: tasks.filter((task) => task.status?.toLowerCase() === 'completed').length,
  };

  const nextDeadlineTask = [...tasks]
    .filter((task) => task.deadline && task.status !== 'Completed')
    .sort((left, right) => new Date(left.deadline) - new Date(right.deadline))[0];

  return (
    <Layout role="employee">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Employee Dashboard</h1>
            <p className="mt-1 text-sm text-gray-600">
              View your workload summary here. Open the `My Tasks` page from the sidebar to manage task details and update statuses.
            </p>
          </div>
          <button
            type="button"
            onClick={openMailbox}
            className="relative inline-flex items-center justify-center rounded-full border border-gray-200 bg-white p-3 text-gray-700 shadow-sm transition hover:bg-gray-50"
            title="Ask Questions"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8m-2 10H5a2 2 0 01-2-2V8a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2z" />
            </svg>
            {unreadReplies > 0 && (
              <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-red-600 px-1 text-xs font-semibold text-white">
                {unreadReplies}
              </span>
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
          <StatCard title="Total Tasks" value={isLoading ? '...' : taskStats.total} bgColor="bg-slate-500" />
          <StatCard title="Pending" value={isLoading ? '...' : taskStats.pending} bgColor="bg-yellow-500" />
          <StatCard title="In Progress" value={isLoading ? '...' : taskStats.inProgress} bgColor="bg-blue-500" />
          <StatCard title="Completed" value={isLoading ? '...' : taskStats.completed} bgColor="bg-green-500" />
        </div>

        <Card title="Next Deadline" subtitle="The nearest active task due date is shown here.">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" />
            </div>
          ) : nextDeadlineTask ? (
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-900">{nextDeadlineTask.title}</h3>
              <p className="text-sm text-gray-600">{nextDeadlineTask.description}</p>
              <div className="flex flex-wrap gap-3 text-sm text-gray-500">
                <span>Deadline: {new Date(nextDeadlineTask.deadline).toLocaleDateString()}</span>
                <span>Priority: {nextDeadlineTask.priority}</span>
                <span>Weight: {nextDeadlineTask.weight ?? 1}</span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500">No active deadlines right now.</p>
          )}
        </Card>
      </div>

      {showMailbox && (
        <ModalShell title="Ask Questions" onClose={() => setShowMailbox(false)}>
          <div className="space-y-6">
            <form onSubmit={sendQuery} className="space-y-4">
              <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-900">
                Ask your manager about task details, blockers, deadlines, or workload concerns. Replies will appear here.
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Subject</label>
                <input
                  type="text"
                  value={queryForm.subject}
                  onChange={(e) => setQueryForm((prev) => ({ ...prev, subject: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Task clarification"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Question</label>
                <textarea
                  value={queryForm.message}
                  onChange={(e) => setQueryForm((prev) => ({ ...prev, message: e.target.value }))}
                  className="min-h-[110px] w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Type your question for your manager..."
                />
              </div>
              <div className="flex justify-end">
                <Button type="submit" variant="primary" loading={isSendingQuery} disabled={isSendingQuery}>
                  Send Question
                </Button>
              </div>
            </form>

            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-900">Previous Questions</h3>
              {isMailboxLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" />
                </div>
              ) : queries.length === 0 ? (
                <p className="text-sm text-gray-500">You have not asked any questions yet.</p>
              ) : (
                queries.map((query) => (
                  <div key={query.id} className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-gray-900">{query.subject}</p>
                        <p className="mt-1 text-xs text-gray-500">
                          Manager: {query.queryManager?.fullName || 'Assigned manager'}
                        </p>
                        <p className="text-xs text-gray-500">{new Date(query.createdAt).toLocaleString()}</p>
                      </div>
                      <StatusBadge status={query.status} />
                    </div>
                    <p className="mt-3 text-sm text-gray-700">{query.message}</p>
                    {query.reply ? (
                      <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Manager Reply</p>
                        <p className="mt-1 text-sm text-blue-900">{query.reply}</p>
                      </div>
                    ) : (
                      <p className="mt-4 text-sm text-amber-700">Waiting for your manager to reply.</p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </ModalShell>
      )}
    </Layout>
  );
};

const StatCard = ({ title, value, bgColor }) => (
  <Card className="relative overflow-hidden">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
      </div>
      <div className={`${bgColor} h-12 w-12 rounded-lg`} />
    </div>
  </Card>
);

const ModalShell = ({ title, children, onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
    <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">{title}</h2>
        <button type="button" onClick={onClose} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      {children}
    </div>
  </div>
);

const StatusBadge = ({ status }) => (
  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
    status === 'Answered' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
  }`}>
    {status}
  </span>
);

export default EmployeeDashboard;
