import { Outlet } from 'react-router-dom';
import { useEffect } from 'react';
import Header from './Header';
import Footer from './Footer';
import { useAuthStore } from '@/store/authStore';

export default function Layout() {
  const checkAuth = useAuthStore((s) => s.checkAuth);

  // Restore the logged-in user (if any) so the header shows account state
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
