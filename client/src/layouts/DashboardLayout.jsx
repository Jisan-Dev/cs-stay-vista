import React from 'react';
import { Outlet } from 'react-router-dom';

const DashboardLayout = () => {
  return (
    <>
      <p className="text-6xl">SIDEBAR</p>
      <div>
        <Outlet />
      </div>
    </>
  );
};

export default DashboardLayout;
