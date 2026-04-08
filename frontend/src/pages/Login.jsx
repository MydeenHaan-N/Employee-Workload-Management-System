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
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await axios.post('/auth/login', {
        email: formData.email.trim(),
        password: formData.password,
      });

      const nextUser = response.data?.user;
      login(nextUser);
      navigate(`/${getRoleName(nextUser) || 'admin'}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to sign in');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(196,106,47,0.24),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(47,107,95,0.18),transparent_28%)]" />
      <div className="relative grid w-full max-w-6xl overflow-hidden rounded-[36px] border border-[rgba(58,44,30,0.12)] bg-[rgba(255,251,245,0.84)] shadow-[0_30px_80px_rgba(89,66,44,0.18)] backdrop-blur lg:grid-cols-[1.05fr_0.95fr]">
        <section className="bg-[#20150f] px-8 py-10 text-white lg:px-12 lg:py-14">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#c46a2f] text-xl font-bold shadow-[0_18px_36px_rgba(196,106,47,0.24)]">
            WM
          </div>
          <p className="mt-8 text-sm uppercase tracking-[0.22em] text-[#d9ba9b]">Mini Capstone Platform</p>
          <h1 className="mt-4 max-w-lg text-4xl font-semibold leading-tight">
            Intelligent employee workload management for real team decisions.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-[#e8d8c8]">
            Plan assignments, predict overload, monitor execution, and keep your workforce balanced with a smarter command center.
          </p>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {[
              ['Smart Assignment', 'Find the best fit using skills, performance, and workload.'],
              ['Burnout Alerts', 'Spot overload before deadlines start slipping.'],
              ['Analytics', 'Track trends, risk, and team execution in one place.'],
            ].map(([title, copy]) => (
              <div key={title} className="rounded-[24px] border border-white/10 bg-white/6 p-4">
                <p className="font-semibold">{title}</p>
                <p className="mt-2 text-sm leading-6 text-[#dccabc]">{copy}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="px-8 py-10 lg:px-12 lg:py-14">
          <p className="text-sm uppercase tracking-[0.22em] text-[#8e3f16]">Welcome back</p>
          <h2 className="mt-3 text-3xl font-semibold text-[#20150f]">Sign in to continue</h2>
          <p className="mt-3 text-sm leading-6 text-[#6b5a4f]">
            Use the seeded sample accounts or your own users created from the admin panel.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-[#3a2c1e]">Email</label>
              <input
                name="email"
                type="email"
                value={formData.email}
                onChange={(event) => setFormData((prev) => ({ ...prev, email: event.target.value }))}
                className="w-full rounded-2xl border border-[rgba(58,44,30,0.14)] bg-white/80 px-4 py-3 outline-none transition focus:border-[#c46a2f] focus:ring-4 focus:ring-[rgba(196,106,47,0.14)]"
                placeholder="admin@gmail.com"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[#3a2c1e]">Password</label>
              <input
                name="password"
                type="password"
                value={formData.password}
                onChange={(event) => setFormData((prev) => ({ ...prev, password: event.target.value }))}
                className="w-full rounded-2xl border border-[rgba(58,44,30,0.14)] bg-white/80 px-4 py-3 outline-none transition focus:border-[#c46a2f] focus:ring-4 focus:ring-[rgba(196,106,47,0.14)]"
                placeholder="123456"
                required
              />
            </div>

            {error ? (
              <div className="rounded-2xl border border-[rgba(184,61,61,0.16)] bg-[rgba(184,61,61,0.08)] px-4 py-3 text-sm text-[#9c3232]">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-2xl bg-[#c46a2f] px-5 py-3.5 text-sm font-semibold text-white shadow-[0_14px_32px_rgba(196,106,47,0.24)] transition hover:bg-[#ad5922] disabled:opacity-60"
            >
              {isLoading ? 'Signing in...' : 'Enter Workspace'}
            </button>
          </form>

          <div className="mt-8 rounded-[24px] border border-[rgba(58,44,30,0.1)] bg-white/60 p-4 text-sm text-[#6b5a4f]">
            Demo accounts:
            <div className="mt-2 grid gap-2 sm:grid-cols-3">
              <span>`admin@gmail.com`</span>
              <span>`haan@gmail.com`</span>
              <span>`mydeen@gamil.com`</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Login;
