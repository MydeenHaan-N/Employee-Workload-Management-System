import React, { useState } from 'react';
import axios from '../api/axiosInstance';
import Layout from '../components/Layout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { toast } from 'react-hot-toast';

const defaultTaskForm = {
  title: '',
  description: '',
  priority: 'Medium',
  deadline: '',
};

const ManagerCreateTaskPage = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [taskForm, setTaskForm] = useState(defaultTaskForm);

  const handleCreateTask = async (e) => {
    e.preventDefault();

    setIsSubmitting(true);
    try {
      await axios.post('/tasks', taskForm);
      toast.success('Task created successfully');
      setTaskForm(defaultTaskForm);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create task');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout role="manager">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create Task</h1>
          <p className="mt-1 text-sm text-gray-600">
            This page is only for task creation. No employee selection is required here.
          </p>
        </div>

        <Card title="Task Creation" subtitle="Managers can create any number of tasks from this page.">
          <form onSubmit={handleCreateTask} className="space-y-5">
            <Field label="Task Title">
              <input
                type="text"
                value={taskForm.title}
                onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </Field>

            <Field label="Description">
              <textarea
                value={taskForm.description}
                onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                className="min-h-[90px] w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </Field>

            <div className="grid gap-5 md:grid-cols-2">
              <Field label="Priority">
                <select
                  value={taskForm.priority}
                  onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </Field>

              <Field label="Deadline">
                <input
                  type="date"
                  value={taskForm.deadline}
                  onChange={(e) => setTaskForm({ ...taskForm, deadline: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </Field>
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" variant="primary" loading={isSubmitting} disabled={isSubmitting}>
                Create Task
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </Layout>
  );
};

const Field = ({ label, children }) => (
  <div>
    <label className="mb-1.5 block text-sm font-medium text-gray-700">{label}</label>
    {children}
  </div>
);

export default ManagerCreateTaskPage;
