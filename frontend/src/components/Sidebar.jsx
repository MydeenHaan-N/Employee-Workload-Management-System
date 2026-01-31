import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../utils/auth';

const Sidebar = () => {
  const { user, logout } = useAuth();

  const menuItems = {
    admin: [
      { label: 'Dashboard', path: '/admin' },
      { label: 'Create User', path: '/admin/create-user' },
    ],
    manager: [
      { label: 'Dashboard', path: '/manager' },
      { label: 'Assign Task', path: '/manager/assign-task' },
    ],
    employee: [
      { label: 'Dashboard', path: '/employee' },
      { label: 'My Tasks', path: '/employee/tasks' },
    ],
  };

  return (
    <aside className="bg-gray-200 p-4">
      <ul>
        {menuItems[user?.role]?.map((item) => (
          <li key={item.path}>
            <Link to={item.path}>{item.label}</Link>
          </li>
        ))}
        <li>
          <button onClick={logout}>Logout</button>
        </li>
      </ul>
    </aside>
  );
};

export default Sidebar;