import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';

const Unauthorized = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-xl rounded-[32px] border border-[rgba(58,44,30,0.12)] bg-[rgba(255,251,245,0.84)] p-10 text-center shadow-[0_26px_70px_rgba(89,66,44,0.14)] backdrop-blur">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[rgba(184,61,61,0.12)] text-3xl text-[#b83d3d]">
          !
        </div>
        <h1 className="mt-6 text-4xl font-semibold text-[#20150f]">Access denied</h1>
        <p className="mt-4 text-base leading-7 text-[#6b5a4f]">
          This route is outside your role permissions. Head back to your workspace home or sign in with a different account.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button onClick={() => navigate(-1)}>Go Back</Button>
          <Button variant="outline" onClick={() => navigate('/login')}>Return to Login</Button>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;
