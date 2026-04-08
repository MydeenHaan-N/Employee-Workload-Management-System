import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../utils/auth';
import Button from './ui/Button';

const navigationByRole = {
  admin: [
    { to: '/admin', label: 'Overview', icon: 'A' },
    { to: '/admin/users', label: 'Users', icon: 'U' },
    { to: '/admin/roles', label: 'Roles', icon: 'R' },
  ],
  manager: [
    { to: '/manager', label: 'Command Center', icon: 'C' },
    { to: '/manager/employees', label: 'People', icon: 'P' },
    { to: '/manager/create-task', label: 'Create Task', icon: 'T' },
    { to: '/manager/available-tasks', label: 'Backlog', icon: 'B' },
    { to: '/manager/assign-task', label: 'Assignment Lab', icon: 'L' },
    { to: '/manager/task-holders', label: 'Execution View', icon: 'E' },
  ],
  employee: [
    { to: '/employee', label: 'Overview', icon: 'O' },
    { to: '/employee/tasks', label: 'My Tasks', icon: 'M' },
  ],
};

const roleCopy = {
  admin: {
    title: 'Administration Studio',
    subtitle: 'Own the structure behind the system.',
  },
  manager: {
    title: 'Workload Command Center',
    subtitle: 'Balance people, priorities, and deadlines from one place.',
  },
  employee: {
    title: 'Personal Work Hub',
    subtitle: 'Track progress, protect focus, and flag blockers early.',
  },
};

const Layout = ({ children, role }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const navItems = navigationByRole[role] || [];
  const headerCopy = roleCopy[role] || roleCopy.employee;

  return (
    <div className="min-h-screen bg-transparent text-[#20150f]">
      <div className="mx-auto flex min-h-screen max-w-[1600px] gap-5 px-3 py-3 lg:px-5 lg:py-5">
        {sidebarOpen && (
          <button
            type="button"
            className="fixed inset-0 z-30 bg-[rgba(32,21,15,0.28)] lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <aside className={`fixed inset-y-3 left-3 z-40 w-[290px] rounded-[30px] border border-[rgba(58,44,30,0.12)] bg-[linear-gradient(180deg,rgba(255,252,246,0.95),rgba(247,240,232,0.92))] p-5 shadow-[0_24px_60px_rgba(89,66,44,0.14)] backdrop-blur transition duration-300 lg:static lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-[120%]'}`}>
          <div className="flex h-full flex-col">
            <div className="flex items-start justify-between">
              <div>
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#20150f] text-lg font-bold text-white shadow-[0_14px_28px_rgba(32,21,15,0.2)]">
                  WM
                </div>
                <h1 className="mt-4 text-xl font-semibold">{headerCopy.title}</h1>
                <p className="mt-1 text-sm leading-6 text-[#6b5a4f]">{headerCopy.subtitle}</p>
              </div>
              <button type="button" className="rounded-xl p-2 text-[#6b5a4f] lg:hidden" onClick={() => setSidebarOpen(false)}>
                x
              </button>
            </div>

            <div className="mt-8 rounded-[24px] bg-[rgba(196,106,47,0.1)] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-[#8e3f16]">Signed in as</p>
              <p className="mt-2 text-base font-semibold">{user?.fullName || 'User'}</p>
              <p className="text-sm capitalize text-[#6b5a4f]">{role}</p>
            </div>

            <nav className="mt-6 space-y-2">
              {navItems.map((item) => {
                const active = location.pathname === item.to;
                return (
                  <button
                    key={item.to}
                    type="button"
                    onClick={() => {
                      navigate(item.to);
                      setSidebarOpen(false);
                    }}
                    className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition ${active ? 'bg-[#20150f] text-white shadow-[0_14px_28px_rgba(32,21,15,0.16)]' : 'text-[#3a2c1e] hover:bg-white/70'}`}
                  >
                    <span className={`inline-flex h-9 w-9 items-center justify-center rounded-xl text-sm font-semibold ${active ? 'bg-white/12 text-white' : 'bg-[rgba(196,106,47,0.12)] text-[#8e3f16]'}`}>
                      {item.icon}
                    </span>
                    <span className="font-medium">{item.label}</span>
                  </button>
                );
              })}
            </nav>

            <div className="mt-auto rounded-[24px] border border-[rgba(58,44,30,0.08)] bg-white/60 p-4">
              <p className="text-sm text-[#6b5a4f]">Project mode</p>
              <p className="mt-1 text-base font-semibold">Capstone Edition</p>
              <Button className="mt-4 w-full" variant="outline" onClick={logout}>
                Sign Out
              </Button>
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-3 z-20 rounded-[28px] border border-[rgba(58,44,30,0.1)] bg-[rgba(255,252,246,0.78)] px-5 py-4 shadow-[0_12px_36px_rgba(89,66,44,0.08)] backdrop-blur">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[rgba(58,44,30,0.12)] bg-white/70 text-[#3a2c1e] lg:hidden"
                  onClick={() => setSidebarOpen(true)}
                >
                  =
                </button>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-[#8e3f16]">Employee Workload Management</p>
                  <h2 className="text-xl font-semibold text-[#20150f]">{headerCopy.title}</h2>
                </div>
              </div>
              <div className="hidden items-center gap-3 md:flex">
                <div className="rounded-2xl bg-[rgba(47,107,95,0.1)] px-4 py-2 text-sm font-medium text-[#25564d]">
                  Decision support enabled
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1 px-1 py-5 lg:px-2">
            <div className="space-y-6">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default Layout;
