import React, { useEffect, useState } from 'react';
import axios from '../api/axiosInstance';
import Layout from '../components/Layout';
import Card from '../components/ui/Card';
import Table from '../components/ui/Table';
import Button from '../components/ui/Button';
import { toast } from 'react-hot-toast';

const ManagerEmployeesPage = () => {
  const [availableEmployees, setAvailableEmployees] = useState([]);
  const [myEmployees, setMyEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionEmployeeId, setActionEmployeeId] = useState(null);

  useEffect(() => {
    loadEmployeesData();
  }, []);

  const loadEmployeesData = async () => {
    setIsLoading(true);
    try {
      const [teamResponse, availableResponse] = await Promise.all([
        axios.get('/users/team'),
        axios.get('/users/available'),
      ]);
      setMyEmployees(teamResponse.data);
      setAvailableEmployees(availableResponse.data);
    } catch (err) {
      console.error('Failed to fetch employees:', err);
      toast.error(err.response?.data?.message || 'Failed to load employees');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClaimEmployee = async (employee) => {
    setActionEmployeeId(employee.id);
    try {
      await axios.post(`/users/${employee.id}/claim`);
      toast.success(`${employee.fullName} added to your team`);
      loadEmployeesData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to claim employee');
    } finally {
      setActionEmployeeId(null);
    }
  };

  const handleReleaseEmployee = async (employee) => {
    setActionEmployeeId(employee.id);
    try {
      await axios.post(`/users/${employee.id}/release`);
      toast.success(`${employee.fullName} released from your team`);
      loadEmployeesData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to release employee');
    } finally {
      setActionEmployeeId(null);
    }
  };

  const availableColumns = [
    {
      header: 'Employee',
      accessor: 'fullName',
      render: (emp) => (
        <div className="flex items-center">
          <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
            <span className="text-sm font-medium text-emerald-700">
              {emp.fullName.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <p className="font-medium text-gray-900">{emp.fullName}</p>
            <p className="text-sm text-gray-500">{emp.email}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: 'managerId',
      render: () => (
        <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800">
          Available
        </span>
      ),
    },
    {
      header: 'Actions',
      accessor: 'actions',
      render: (emp) => (
        <Button
          variant="primary"
          size="sm"
          onClick={() => handleClaimEmployee(emp)}
          loading={actionEmployeeId === emp.id}
          disabled={actionEmployeeId === emp.id}
        >
          Select User
        </Button>
      ),
    },
  ];

  const teamColumns = [
    {
      header: 'Employee',
      accessor: 'fullName',
      render: (emp) => (
        <div className="flex items-center">
          <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
            <span className="text-sm font-medium text-blue-700">
              {emp.fullName.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <p className="font-medium text-gray-900">{emp.fullName}</p>
            <p className="text-sm text-gray-500">{emp.email}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Total Tasks',
      accessor: 'workload.total',
      render: (emp) => <span className="font-semibold">{emp.workload?.total || 0}</span>,
    },
    {
      header: 'Pending',
      accessor: 'workload.pending',
      render: (emp) => <span className="font-medium text-yellow-600">{emp.workload?.pending || 0}</span>,
    },
    {
      header: 'Actions',
      accessor: 'actions',
      render: (emp) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleReleaseEmployee(emp)}
          loading={actionEmployeeId === emp.id}
          disabled={actionEmployeeId === emp.id}
        >
          Release
        </Button>
      ),
    },
  ];

  return (
    <Layout role="manager">
      <div className="space-y-6">
        <Card title="Available Employees" subtitle="Any unassigned employee created by admin can be selected by exactly one manager.">
          {isLoading ? (
            <LoadingState />
          ) : (
            <Table
              columns={availableColumns}
              data={availableEmployees}
              emptyMessage="No unassigned employees are available right now."
            />
          )}
        </Card>

        <Card title="My Team" subtitle="Employees currently selected by you are listed here.">
          {isLoading ? (
            <LoadingState />
          ) : (
            <Table
              columns={teamColumns}
              data={myEmployees}
              emptyMessage="You have not selected any employees yet."
            />
          )}
        </Card>
      </div>
    </Layout>
  );
};

const LoadingState = () => (
  <div className="flex items-center justify-center py-12">
    <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" />
  </div>
);

export default ManagerEmployeesPage;
