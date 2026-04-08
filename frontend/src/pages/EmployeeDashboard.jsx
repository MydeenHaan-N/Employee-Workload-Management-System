import React, { useEffect, useState } from 'react';
import axios from '../api/axiosInstance';
import Layout from '../components/Layout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { toast } from 'react-hot-toast';
import { useAuth } from '../utils/auth';

const emptyQuery = { subject: '', message: '' };

const EmployeeDashboard = () => {
  const { user, login } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [workload, setWorkload] = useState(null);
  const [queries, setQueries] = useState([]);
  const [queryForm, setQueryForm] = useState(emptyQuery);
  const [skillsDraft, setSkillsDraft] = useState((user?.skills || []).join(', '));
  const [showMailbox, setShowMailbox] = useState(false);

  const load = async () => {
    try {
      const [tasksResponse, workloadResponse] = await Promise.all([
        axios.get('/tasks/my'),
        axios.get('/workload/workload'),
      ]);
      setTasks(tasksResponse.data);
      setWorkload(workloadResponse.data);
    } catch {
      toast.error('Failed to load employee overview');
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openMailbox = async () => {
    try {
      const response = await axios.get('/queries/employee');
      setQueries(response.data.queries || []);
      setShowMailbox(true);
    } catch {
      toast.error('Failed to load mailbox');
    }
  };

  const sendQuery = async (event) => {
    event.preventDefault();
    try {
      await axios.post('/queries/employee', queryForm);
      setQueryForm(emptyQuery);
      toast.success('Question sent');
      openMailbox();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send question');
    }
  };

  const saveSkills = async () => {
    try {
      const response = await axios.put(`/users/${user.id}/skills`, {
        skills: skillsDraft.split(',').map((item) => item.trim()).filter(Boolean),
      });
      login({
        ...user,
        skills: response.data.skills,
      });
      toast.success('Skills updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update skills');
    }
  };

  const nextTask = [...tasks]
    .filter((task) => task.status !== 'Completed')
    .sort((left, right) => new Date(left.deadline) - new Date(right.deadline))[0];

  return (
    <Layout role="employee">
      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="overflow-hidden bg-[linear-gradient(135deg,#2f6b5f,#173d36)] text-white">
          <p className="text-xs uppercase tracking-[0.2em] text-[#b8ddd3]">Employee Overview</p>
          <h1 className="mt-4 max-w-2xl text-4xl font-semibold leading-tight">
            Stay on top of workload, protect focus, and raise blockers early.
          </h1>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <Metric label="Active Tasks" value={workload?.activeAssignments || 0} />
            <Metric label="Workload Score" value={workload?.score || 0} />
            <Metric label="Burnout Risk" value={workload?.burnoutRisk?.level || 'Safe'} />
          </div>
        </Card>

        <Card title="Personal Skill Profile" subtitle="Keep these updated so managers can match tasks more accurately.">
          <Input
            label="Skills"
            value={skillsDraft}
            onChange={(e) => setSkillsDraft(e.target.value)}
            placeholder="documentation, support, compliance"
            helpText="Comma-separated skills used for recommendation matching."
          />
          <Button className="mt-4" onClick={saveSkills}>Save Skills</Button>
        </Card>
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card title="Next Priority">
          {nextTask ? (
            <>
              <p className="text-lg font-semibold">{nextTask.title}</p>
              <p className="mt-2 text-sm text-[#6b5a4f]">{nextTask.description}</p>
              <p className="mt-4 text-sm text-[#7d6c60]">Due {new Date(nextTask.deadline).toLocaleDateString()} | {nextTask.priority}</p>
            </>
          ) : <p className="text-sm text-[#6b5a4f]">No upcoming tasks.</p>}
        </Card>

        <Card title="Performance">
          <Metric label="Completion Rate" value={`${workload?.performance?.completionRate || 0}%`} simple />
          <Metric label="On-Time Rate" value={`${workload?.performance?.onTimeRate || 0}%`} simple />
          <Metric label="Avg Delay" value={`${workload?.performance?.avgDelayDays || 0} d`} simple />
        </Card>

        <Card title="Escalation Signals" action={<Button variant="outline" onClick={openMailbox}>Open Mailbox</Button>}>
          <div className="space-y-3">
            {(workload?.alerts || []).map((alert, index) => (
              <div key={`${alert.assignmentId}-${index}`} className="rounded-[18px] bg-[rgba(244,239,231,0.72)] p-3 text-sm">{alert.message}</div>
            ))}
            {!workload?.alerts?.length ? <p className="text-sm text-[#6b5a4f]">No active alerts right now.</p> : null}
          </div>
        </Card>
      </div>

      {showMailbox ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(32,21,15,0.3)] p-4 backdrop-blur-sm">
          <Card className="max-h-[90vh] w-full max-w-4xl overflow-y-auto" title="Manager Mailbox" action={<Button variant="ghost" onClick={() => setShowMailbox(false)}>Close</Button>}>
            <form onSubmit={sendQuery} className="space-y-4">
              <Input label="Subject" value={queryForm.subject} onChange={(e) => setQueryForm((prev) => ({ ...prev, subject: e.target.value }))} required />
              <Input label="Question" as="textarea" rows={4} value={queryForm.message} onChange={(e) => setQueryForm((prev) => ({ ...prev, message: e.target.value }))} required />
              <Button type="submit">Send Question</Button>
            </form>
            <div className="mt-6 space-y-4">
              {queries.map((query) => (
                <div key={query.id} className="rounded-[22px] border border-[rgba(58,44,30,0.08)] bg-white/65 p-4">
                  <p className="font-semibold">{query.subject}</p>
                  <p className="mt-2 text-sm">{query.message}</p>
                  <p className="mt-3 text-sm text-[#25564d]">{query.reply || 'Waiting for manager reply'}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      ) : null}
    </Layout>
  );
};

const Metric = ({ label, value, simple = false }) => (
  <div className={`rounded-[20px] ${simple ? 'bg-[rgba(244,239,231,0.75)] p-4' : 'bg-white/10 p-4'}`}>
    <p className={`text-sm ${simple ? 'text-[#6b5a4f]' : 'text-[#dceee8]'}`}>{label}</p>
    <p className="mt-2 text-3xl font-semibold">{value}</p>
  </div>
);

export default EmployeeDashboard;
