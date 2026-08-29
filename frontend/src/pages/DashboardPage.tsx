import React from 'react';
import { useUser } from '../context/UserContext';
import { MemberDashboard } from './MemberDashboard';
import { OrganizerDashboard } from './OrganizerDashboard';

export const DashboardPage: React.FC = () => {
  const { isStaffOrAdmin } = useUser();

  // Role-based single unified Dashboard
  if (isStaffOrAdmin) {
    return <OrganizerDashboard />;
  }

  return <MemberDashboard />;
};

export default DashboardPage;
