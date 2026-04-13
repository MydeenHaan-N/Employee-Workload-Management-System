import React, { useEffect, useState } from 'react';
import axios from '../api/axiosInstance';
import Layout from '../components/Layout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { toast } from 'react-hot-toast';

const ManagerEmployeesPage = () => {
  const [availableEmployees, setAvailableEmployees] = useState([]);
  const [team, setTeam] = useState([]);

  const load = async () => {
    try {
      const [teamResponse, availableResponse] = await Promise.all([axios.get('/users/team'), axios.get('/users/available')]);
      setTeam(teamResponse.data);
      setAvailableEmployees(availableResponse.data);
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

        <Card title="My Team" subtitle="View employee skill profiles while employees manage their own skills.">
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

                <div className="mt-5">
                  <p className="text-sm font-medium text-[#20150f]">Skills</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(employee.skills || []).length ? (employee.skills || []).map((skill) => (
                      <span key={skill} className="rounded-full bg-[rgba(47,107,95,0.1)] px-3 py-1 text-xs text-[#25564d]">
                        {skill}
                      </span>
                    )) : (
                      <span className="text-sm text-[#6b5a4f]">No skills added by employee yet.</span>
                    )}
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
