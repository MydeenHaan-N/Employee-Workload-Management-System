import React, { useEffect, useMemo, useState } from 'react';
import axios from '../api/axiosInstance';
import Layout from '../components/Layout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Table from '../components/ui/Table';
import { toast } from 'react-hot-toast';

const ManagerDashboard = () => {
  const [board, setBoard] = useState({ team: [], alerts: [], analytics: null, summary: null });
  const [queries, setQueries] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showQueries, setShowQueries] = useState(false);
  const [replyDrafts, setReplyDrafts] = useState({});

  const load = async () => {
    try {
      const [analyticsResponse, unreadResponse] = await Promise.all([
        axios.get('/tasks/analytics'),
        axios.get('/queries/manager/unread-count'),
      ]);
      setBoard(analyticsResponse.data);
      setUnreadCount(unreadResponse.data.unreadCount || 0);
    } catch {
      toast.error('Failed to load manager dashboard');
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openQueries = async () => {
    try {
      const response = await axios.get('/queries/manager?markRead=true');
      setQueries(response.data.queries || []);
      setUnreadCount(0);
      setShowQueries(true);
    } catch {
      toast.error('Failed to load employee queries');
    }
  };

  const reply = async (queryId) => {
    try {
      const response = await axios.post(`/queries/${queryId}/reply`, { reply: replyDrafts[queryId] });
      setQueries((prev) => prev.map((query) => (query.id === queryId ? response.data : query)));
      toast.success('Reply sent');
    } catch {
      toast.error('Failed to send reply');
    }
  };

  const criticalEmployees = useMemo(
    () => board.team.filter((employee) => employee.burnoutRisk?.level === 'Critical'),
    [board.team]
  );

  return (
    <Layout role="manager">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <Card className="overflow-hidden bg-[linear-gradient(135deg,#20150f,#4f3121)] text-white">
            <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[#d8b99b]">Manager Command Center</p>
                <h1 className="mt-4 max-w-2xl text-4xl font-semibold leading-tight">
                  Balance work with recommendations, simulation, alerts, and performance visibility.
                </h1>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-[#eadbcc]">
                  Dense supporting signals now live in a right sidebar, so the main area stays focused on execution.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button onClick={openQueries}>Employee Mailbox {unreadCount ? `(${unreadCount})` : ''}</Button>
                <Button variant="outline" className="border-white/20 bg-white/10 text-white hover:bg-white/14" onClick={load}>Refresh Insights</Button>
              </div>
            </div>
          </Card>

          <Card title="Team Radar" subtitle="Compact execution table to reduce long vertical card stacks.">
            <Table
              columns={[
                {
                  header: 'Employee',
                  render: (employee) => (
                    <div>
                      <p className="font-semibold">{employee.fullName}</p>
                      <p className="mt-1 text-xs text-[#6b5a4f]">{employee.email}</p>
                    </div>
                  ),
                },
                {
                  header: 'Risk',
                  render: (employee) => (
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${employee.burnoutRisk?.level === 'Critical' ? 'bg-[rgba(184,61,61,0.12)] text-[#9c3232]' : employee.burnoutRisk?.level === 'Watchlist' ? 'bg-[rgba(196,106,47,0.12)] text-[#8e3f16]' : 'bg-[rgba(47,107,95,0.12)] text-[#25564d]'}`}>
                      {employee.burnoutRisk?.level || 'Safe'}
                    </span>
                  ),
                },
                {
                  header: 'Load',
                  render: (employee) => employee.workload?.remainingWeight || 0,
                },
                {
                  header: 'Performance',
                  render: (employee) => employee.performance?.score || 0,
                },
                {
                  header: 'Skills',
                  render: (employee) => (
                    <div className="flex max-w-[300px] flex-wrap gap-2">
                      {(employee.skills || []).slice(0, 4).map((skill) => (
                        <span key={skill} className="rounded-full bg-[rgba(47,107,95,0.1)] px-2.5 py-1 text-xs text-[#25564d]">{skill}</span>
                      ))}
                    </div>
                  ),
                },
              ]}
              data={board.team}
              emptyMessage="No team members available."
            />
          </Card>
        </div>

        <aside className="space-y-6 xl:sticky xl:top-28 xl:self-start">
          <Card title="Operational Snapshot" subtitle="High-level health of the current team.">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
              <Metric label="Team Members" value={board.summary?.teamCount || 0} />
              <Metric label="Assigned Tasks" value={board.summary?.assignedTaskCount || 0} />
              <Metric label="Critical Risk" value={board.summary?.criticalRiskEmployees || 0} />
              <Metric label="Avg Performance" value={board.analytics?.averagePerformance || 0} />
            </div>
          </Card>

          <Card title="Escalation Alerts" subtitle="Auto-generated reminders and overdue warnings.">
            <div className="space-y-3">
              {(board.alerts || []).slice(0, 4).map((alert, index) => (
                <div key={`${alert.assignmentId}-${index}`} className="rounded-[20px] border border-[rgba(58,44,30,0.08)] bg-white/60 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-[#8e3f16]">{alert.type}</p>
                  <p className="mt-2 text-sm text-[#20150f]">{alert.message}</p>
                </div>
              ))}
              {!(board.alerts || []).length ? <p className="text-sm text-[#6b5a4f]">No active alerts right now.</p> : null}
            </div>
          </Card>

          <Card title="Burnout Watchlist">
            <div className="space-y-3">
              {criticalEmployees.map((employee) => (
                <div key={employee.id} className="rounded-[20px] bg-[rgba(184,61,61,0.08)] p-4">
                  <p className="font-semibold">{employee.fullName}</p>
                  <p className="mt-1 text-sm text-[#6b5a4f]">
                    Risk: {employee.burnoutRisk.level} | Remaining load: {employee.workload?.remainingWeight || 0}
                  </p>
                </div>
              ))}
              {!criticalEmployees.length ? <p className="text-sm text-[#6b5a4f]">No critical burnout signals detected.</p> : null}
            </div>
          </Card>
        </aside>
      </div>

      {showQueries ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(32,21,15,0.32)] p-4 backdrop-blur-sm">
          <Card className="max-h-[90vh] w-full max-w-5xl overflow-y-auto" title="Employee Mailbox" action={<Button variant="ghost" onClick={() => setShowQueries(false)}>Close</Button>}>
            <div className="space-y-4">
              {queries.map((query) => (
                <div key={query.id} className="rounded-[22px] border border-[rgba(58,44,30,0.08)] bg-white/65 p-4">
                  <p className="font-semibold">{query.subject}</p>
                  <p className="mt-1 text-sm text-[#6b5a4f]">{query.employee?.fullName}</p>
                  <p className="mt-3 text-sm">{query.message}</p>
                  {query.reply ? (
                    <div className="mt-4 rounded-[18px] bg-[rgba(47,107,95,0.08)] p-3 text-sm text-[#25564d]">{query.reply}</div>
                  ) : (
                    <div className="mt-4 space-y-3">
                      <textarea
                        value={replyDrafts[query.id] || ''}
                        onChange={(e) => setReplyDrafts((prev) => ({ ...prev, [query.id]: e.target.value }))}
                        className="min-h-[110px] w-full rounded-2xl border border-[rgba(58,44,30,0.14)] bg-white/80 px-4 py-3 outline-none focus:border-[#c46a2f] focus:ring-4 focus:ring-[rgba(196,106,47,0.14)]"
                      />
                      <Button onClick={() => reply(query.id)}>Send Reply</Button>
                    </div>
                  )}
                </div>
              ))}
              {!queries.length ? <p className="text-sm text-[#6b5a4f]">No employee questions yet.</p> : null}
            </div>
          </Card>
        </div>
      ) : null}
    </Layout>
  );
};

const Metric = ({ label, value }) => (
  <div className="rounded-[22px] bg-[rgba(244,239,231,0.78)] p-4">
    <p className="text-sm text-[#6b5a4f]">{label}</p>
    <p className="mt-2 text-3xl font-semibold">{value}</p>
  </div>
);

export default ManagerDashboard;
