import React, { useMemo, useState } from 'react';
import axios from '../api/axiosInstance';
import Layout from '../components/Layout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { toast } from 'react-hot-toast';

const initialForm = {
  title: '',
  description: '',
  priority: 'Medium',
  deadline: '',
  weight: 3,
  requiredSkills: '',
  autoAssign: false,
};

const ManagerCreateTaskPage = () => {
  const [form, setForm] = useState(initialForm);
  const [simulation, setSimulation] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const payload = useMemo(() => ({
    ...form,
    requiredSkills: form.requiredSkills.split(',').map((item) => item.trim()).filter(Boolean),
  }), [form]);

  const simulate = async () => {
    setIsSimulating(true);
    try {
      const response = await axios.post('/tasks/simulate-assignment', payload);
      setSimulation(response.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Unable to run simulation');
    } finally {
      setIsSimulating(false);
    }
  };

  const createTask = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      await axios.post('/tasks', payload);
      toast.success('Task created successfully');
      setForm(initialForm);
      setSimulation(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create task');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout role="manager">
      <div className="grid gap-6 xl:grid-cols-[1fr_0.95fr]">
        <Card title="Create Intelligent Task" subtitle="Define effort, urgency, and required skills before creating the work item.">
          <form onSubmit={createTask} className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <Input label="Task Title" value={form.title} onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))} required />
            </div>
            <div className="md:col-span-2">
              <Input label="Description" as="textarea" rows={5} value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} required />
            </div>
            <Input label="Priority" as="select" value={form.priority} onChange={(e) => setForm((prev) => ({ ...prev, priority: e.target.value }))}>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </Input>
            <Input label="Weight" type="number" min="1" max="10" value={form.weight} onChange={(e) => setForm((prev) => ({ ...prev, weight: e.target.value }))} required />
            <Input label="Deadline" type="date" value={form.deadline} onChange={(e) => setForm((prev) => ({ ...prev, deadline: e.target.value }))} required />
            <div className="md:col-span-2">
              <Input
                label="Required Skills"
                value={form.requiredSkills}
                onChange={(e) => setForm((prev) => ({ ...prev, requiredSkills: e.target.value }))}
                placeholder="analytics, auditing, documentation"
                helpText="Comma-separated skills used by the recommendation engine."
              />
            </div>

            <label className="md:col-span-2 flex items-center gap-3 rounded-[20px] bg-[rgba(244,239,231,0.75)] px-4 py-3 text-sm text-[#3a2c1e]">
              <input type="checkbox" checked={form.autoAssign} onChange={(e) => setForm((prev) => ({ ...prev, autoAssign: e.target.checked }))} />
              Use smart assignment immediately after creation
            </label>

            <div className="md:col-span-2 flex flex-wrap justify-end gap-3">
              <Button type="button" variant="outline" onClick={simulate} loading={isSimulating}>Run Simulation</Button>
              <Button type="submit" loading={isSubmitting}>Create Task</Button>
            </div>
          </form>
        </Card>

        <Card title="Simulation Output" subtitle="Preview who the system would recommend before you create the task.">
          {simulation?.rankings?.length ? (
            <div className="space-y-4">
              {simulation.rankings.slice(0, 5).map((candidate, index) => (
                <div key={candidate.employeeId} className="rounded-[22px] border border-[rgba(58,44,30,0.08)] bg-white/60 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold">{index + 1}. {candidate.fullName}</p>
                      <p className="text-sm text-[#6b5a4f]">Match score: {candidate.score}</p>
                    </div>
                    <span className="rounded-full bg-[rgba(47,107,95,0.1)] px-3 py-1 text-xs text-[#25564d]">
                      Projected risk: {candidate.projectedRisk}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(candidate.matchedSkills || []).map((skill) => (
                      <span key={skill} className="rounded-full bg-[rgba(196,106,47,0.12)] px-3 py-1 text-xs text-[#8e3f16]">{skill}</span>
                    ))}
                  </div>
                  <ul className="mt-3 space-y-1 text-sm text-[#6b5a4f]">
                    {candidate.reasons.map((reason) => <li key={reason}>{reason}</li>)}
                  </ul>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-[24px] border border-dashed border-[rgba(58,44,30,0.18)] bg-white/40 p-10 text-center text-sm text-[#6b5a4f]">
              Run a simulation to see ranking recommendations, projected workload, and risk changes.
            </div>
          )}
        </Card>
      </div>
    </Layout>
  );
};

export default ManagerCreateTaskPage;
