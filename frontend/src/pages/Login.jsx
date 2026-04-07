import React, { useState } from 'react';
import axios from '../api/axiosInstance';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../utils/auth';

const getRoleName = (userLike) => (
  userLike?.roleName
  || userLike?.role
  || userLike?.roleDetails?.name
  || ''
).toLowerCase().trim();

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Invalid email format';

    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const res = await axios.post('/auth/login', {
        email: formData.email.trim(),
        password: formData.password,
      });

      const nextUser = res.data?.user;
      if (!nextUser) {
        throw new Error('No user received from server');
      }

      login(nextUser);

      const role = getRoleName(nextUser) || 'unknown';
      if (!['admin', 'manager', 'employee'].includes(role)) {
        navigate('/admin');
        return;
      }

      navigate(`/${role}`);
    } catch (err) {
      console.error('Login failed:', err);

      let message = 'Something went wrong. Please try again.';

      if (err.response) {
        if (err.response.status === 401) {
          message = 'Invalid email or password';
        } else if (err.response.status === 404) {
          message = 'Login endpoint not found - check backend';
        } else if (err.response.data?.message) {
          message = err.response.data.message;
        }
      } else if (err.code === 'ERR_NETWORK') {
        message = 'Cannot reach backend. Is it running on port 5000?';
      }

      alert(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-2xl bg-blue-600 mb-6">
            <span className="text-2xl font-bold text-white">ETM</span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">Sign in</h2>
          <p className="mt-2 text-sm text-gray-600">Employee Task Management System</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                name="email"
                type="email"
                autoComplete="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                  errors.email ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="admin@example.com"
                disabled={isLoading}
                required
              />
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <input
                name="password"
                type="password"
                autoComplete="current-password"
                value={formData.password}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                  errors.password ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="********"
                disabled={isLoading}
                required
              />
              {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-xl font-semibold hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-500 mt-8">
          © {new Date().getFullYear()} Employee Task Management System
        </p>
      </div>
    </div>
  );
};

export default Login;
