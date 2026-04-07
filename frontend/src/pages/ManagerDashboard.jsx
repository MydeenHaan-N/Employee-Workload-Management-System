import React, { useEffect, useMemo, useState } from 'react';
import axios from '../api/axiosInstance';
import Layout from '../components/Layout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { toast } from 'react-hot-toast';

const ManagerDashboard = () => {
  const [employees, setEmployees] = useState([]);
  const [availableEmployees, setAvailableEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showQueries, setShowQueries] = useState(false);
  const [queries, setQueries] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isQueriesLoading, setIsQueriesLoading] = useState(false);
  const [replyDrafts, setReplyDrafts] = useState({});
  const [replyingQueryId, setReplyingQueryId] = useState(null);

  useEffect(() => {
    loadManagerData();
    loadUnreadQueryCount();

    const intervalId = window.setInterval(() => {
      loadUnreadQueryCount();
    }, 30000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  const loadManagerData = async () => {
    setIsLoading(true);
    try {
      const [teamResponse, availableResponse] = await Promise.all([
        axios.get('/users/team'),
        axios.get('/users/available'),
      ]);
      setEmployees(teamResponse.data);
      setAvailableEmployees(availableResponse.data);
    } catch (err) {
      console.error('Failed to fetch manager data:', err);
      toast.error(err.response?.data?.message || 'Failed to load manager dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const loadUnreadQueryCount = async () => {
    try {
      const response = await axios.get('/queries/manager/unread-count');
      setUnreadCount(response.data.unreadCount || 0);
    } catch (err) {
      console.error('Failed to load unread query count:', err);
    }
  };

  const openQueries = async () => {
    setShowQueries(true);
    setIsQueriesLoading(true);
    try {
      const response = await axios.get('/queries/manager?markRead=true');
      setQueries(response.data.queries || []);
      setUnreadCount(0);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load employee questions');
    } finally {
      setIsQueriesLoading(false);
    }
  };

  const handleReply = async (queryId) => {
    const reply = replyDrafts[queryId];
    if (!reply?.trim()) {
      toast.error('Reply is required');
      return;
    }

    setReplyingQueryId(queryId);
    try {
      const response = await axios.post(`/queries/${queryId}/reply`, { reply: reply.trim() });
      setQueries((prev) => prev.map((query) => (query.id === queryId ? response.data : query)));
      setReplyDrafts((prev) => ({ ...prev, [queryId]: '' }));
      toast.success('Reply sent successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send reply');
    } finally {
      setReplyingQueryId(null);
    }
  };

  const totalTasks = employees.reduce((sum, emp) => sum + (emp.workload?.total || 0), 0);
  const heavyWorkload = employees.filter((emp) => (emp.workload?.total || 0) > 6).length;
  const openQueryCount = useMemo(
    () => queries.filter((query) => query.status === 'Open').length,
    [queries]
  );

  return (
    <Layout role="manager">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Manager Dashboard</h1>
            <p className="mt-1 text-sm text-gray-600">
              Use the sidebar to manage employees and tasks, and use the query bell to answer employee questions.
            </p>
          </div>
          <button
            type="button"
            onClick={openQueries}
            className="relative inline-flex items-center justify-center rounded-full border border-gray-200 bg-white p-3 text-gray-700 shadow-sm transition hover:bg-gray-50"
            title="Employee Queries"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V4a2 2 0 10-4 0v1.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-red-600 px-1 text-xs font-semibold text-white">
                {unreadCount}
              </span>
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
          <StatCard title="Team Members" value={isLoading ? '...' : employees.length} bgColor="bg-blue-500" />
          <StatCard title="Available Employees" value={isLoading ? '...' : availableEmployees.length} bgColor="bg-emerald-500" />
          <StatCard title="Total Tasks" value={isLoading ? '...' : totalTasks} bgColor="bg-purple-500" />
          <StatCard title="Heavy Workload" value={isLoading ? '...' : heavyWorkload} bgColor="bg-red-500" />
        </div>
      </div>

      {showQueries && (
        <ModalShell title="Employee Queries" onClose={() => setShowQueries(false)}>
          <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <MiniStat label="Unread Notifications" value={unreadCount} />
            <MiniStat label="Open Questions" value={openQueryCount} />
          </div>

          {isQueriesLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" />
            </div>
          ) : queries.length === 0 ? (
            <p className="py-12 text-center text-sm text-gray-500">No employee questions yet.</p>
          ) : (
            <div className="space-y-4">
              {queries.map((query) => (
                <div key={query.id} className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-gray-900">{query.subject}</p>
                        <StatusBadge status={query.status} />
                        {!query.isManagerRead && (
                          <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                            New
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-gray-500">
                        {`${query.employee?.fullName || 'Employee'} | ${query.employee?.email || 'No email'}`}
                      </p>
                      <p className="text-xs text-gray-500">{new Date(query.createdAt).toLocaleString()}</p>
                    </div>
                  </div>

                  <p className="mt-3 text-sm text-gray-700">{query.message}</p>

                  {query.reply ? (
                    <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Your Reply</p>
                      <p className="mt-1 text-sm text-blue-900">{query.reply}</p>
                    </div>
                  ) : (
                    <div className="mt-4 space-y-3">
                      <textarea
                        value={replyDrafts[query.id] || ''}
                        onChange={(e) => setReplyDrafts((prev) => ({ ...prev, [query.id]: e.target.value }))}
                        className="min-h-[100px] w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder={`Reply to ${query.employee?.fullName || 'employee'}...`}
                      />
                      <div className="flex justify-end">
                        <Button
                          variant="primary"
                          onClick={() => handleReply(query.id)}
                          loading={replyingQueryId === query.id}
                          disabled={replyingQueryId === query.id}
                        >
                          Send Reply
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
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

const MiniStat = ({ label, value }) => (
  <div className="rounded-lg border border-gray-200 bg-white p-4">
    <p className="text-sm text-gray-500">{label}</p>
    <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
  </div>
);

const ModalShell = ({ title, children, onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
    <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl">
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

export default ManagerDashboard;
