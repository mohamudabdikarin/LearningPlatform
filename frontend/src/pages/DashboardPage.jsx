import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

const DashboardPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
    } else if (user.roles && user.roles.includes('TEACHER')) {
      navigate('/dashboard/teacher', { replace: true });
    } else if (user.roles && user.roles.includes('STUDENT')) {
      navigate('/dashboard/student', { replace: true });
    } else {
      // Default to student dashboard if role is not specified
      navigate('/dashboard/student', { replace: true });
    }
  }, [user, navigate]);

  if (!user) return null;

  // Optionally, show a loading spinner or nothing while redirecting
  return null;
};

export default DashboardPage;