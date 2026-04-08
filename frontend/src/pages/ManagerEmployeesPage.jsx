import React, { useEffect, useState } from 'react';
import axios from '../api/axiosInstance';
import Layout from '../components/Layout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { toast } from 'react-hot-toast';

const ManagerEmployeesPage = () => {
  const [availableEmployees, setAvailableEmployees] = useState([]);
  const [team, setTeam] = useState([]);
  const [skillDrafts, setSkillDrafts] = useState({});

  const load = async () => {
    try {
      const [teamResponse, availableResponse] = await Promise.all([axios.get('/users/team'), axios.get('/users/available')]);
      setTeam(teamResponse.data);
      setAvailableEmployees(availableResponse.data);
      setSkillDrafts(Object.fromEntries(teamResponse.data.map((employee) => [employee.id, (employee.skills || []).join(', ')])));
    } catch {
      toast.error('Failed to load employees');
    }
  };

  useEffect(() => {
    load();
  }, []);

  const claim = async (employeeId) => {
    try {
      await axios.post(`/users/${employeeId}/claim`);
      toast.success('Employee added to team');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to claim employee');
    }
  };

  const release = async (employeeId) => {
    try {
      await axios.post(`/users/${employeeId}/release`);
      toast.success('Employee released');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to release employee');
    }
  };

  const saveSkills = async (employeeId) => {
    try {
      await axios.put(`/users/${employeeId}/skills`, {
        skills: (skillDrafts[employeeId] || '').split(',').map((item) => item.trim()).filter(Boolean),
      });
      toast.success('Skills updated');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update skills');
    }
  };

  return (
    <Layout role="manager">
      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card title="Available Employees" subtitle="Claim unassigned employees into your working team.">
          <div className="space-y-4">
            {availableEmployees.map((employee) => (
              <div key={employee.id} className="rounded-[24px] border border-[rgba(58,44,30,0.08)] bg-white/60 p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-lg font-semibold">{employee.fullName}</p>
                    <p className="text-sm text-[#6b5a4f]">{employee.email}</p>
                  </div>
                  <Button onClick={() => claim(employee.id)}>Claim</Button>
                </div>
              </div>
            ))}
            {!availableEmployees.length ? <p className="text-sm text-[#6b5a4f]">No unassigned employees available.</p> : null}
          </div>
        </Card>

        <Card title="My Team" subtitle="Keep employee skill profiles clean so smart assignment works better.">
          <div className="space-y-5">
            {team.map((employee) => (
              <div key={employee.id} className="rounded-[24px] border border-[rgba(58,44,30,0.08)] bg-white/65 p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-lg font-semibold">{employee.fullName}</p>
                    <p className="text-sm text-[#6b5a4f]">{employee.email}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="rounded-full bg-[rgba(196,106,47,0.12)] px-3 py-1 text-xs text-[#8e3f16]">Risk: {employee.insights?.burnoutRisk?.level || employee.burnoutRisk?.level || 'Safe'}</span>
                      <span className="rounded-full bg-[rgba(47,107,95,0.1)] px-3 py-1 text-xs text-[#25564d]">Performance: {employee.insights?.performance?.score || employee.performance?.score || 0}</span>
                    </div>
                  </div>
                  <Button variant="outline" onClick={() => release(employee.id)}>Release</Button>
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-[1fr_auto]">
                  <Input
                    label="Skills"
                    value={skillDrafts[employee.id] || ''}
                    onChange={(e) => setSkillDrafts((prev) => ({ ...prev, [employee.id]: e.target.value }))}
                    placeholder="forecasting, support, analytics"
                  />
                  <div className="flex items-end">
                    <Button onClick={() => saveSkills(employee.id)}>Save Skills</Button>
                  </div>
                </div>
              </div>
            ))}
            {!team.length ? <p className="text-sm text-[#6b5a4f]">You have not claimed any employees yet.</p> : null}
          </div>
        </Card>
      </div>
    </Layout>
  );
};

export default ManagerEmployeesPage;
