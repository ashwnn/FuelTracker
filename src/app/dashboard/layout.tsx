'use client';

import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  if (!user) {
    return null;
  }

  return (
    <div className="dashboard-layout">
      <nav className="dashboard-nav">
        <Link href="/dashboard" className="nav-brand">
          <h1>⛽ FuelTracker</h1>
        </Link>
        
        {/* Hamburger button for mobile */}
        <button 
          className="nav-hamburger"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          <span className={mobileMenuOpen ? 'open' : ''}></span>
          <span className={mobileMenuOpen ? 'open' : ''}></span>
          <span className={mobileMenuOpen ? 'open' : ''}></span>
        </button>

        <div className={`nav-links ${mobileMenuOpen ? 'mobile-open' : ''}`}>
          <Link 
            href="/dashboard" 
            className={pathname === '/dashboard' ? 'active' : ''}
            onClick={closeMobileMenu}
          >
            Dashboard
          </Link>
          <Link 
            href="/dashboard/vehicles" 
            className={pathname?.startsWith('/dashboard/vehicles') ? 'active' : ''}
            onClick={closeMobileMenu}
          >
            Vehicles
          </Link>
          <Link 
            href="/dashboard/entries" 
            className={pathname?.startsWith('/dashboard/entries') ? 'active' : ''}
            onClick={closeMobileMenu}
          >
            Entries
          </Link>
          <Link 
            href="/dashboard/analytics" 
            className={pathname === '/dashboard/analytics' ? 'active' : ''}
            onClick={closeMobileMenu}
          >
            Analytics
          </Link>
          <Link 
            href="/dashboard/settings" 
            className={pathname === '/dashboard/settings' ? 'active' : ''}
            onClick={closeMobileMenu}
          >
            Settings
          </Link>
          
          <div className="nav-user-mobile">
            <span>{user.email}</span>
            <button onClick={() => { handleLogout(); closeMobileMenu(); }} className="btn-secondary">
              Logout
            </button>
          </div>
        </div>
        
        <div className="nav-user">
          <span>{user.email}</span>
          <button onClick={handleLogout} className="btn-secondary">Logout</button>
        </div>
      </nav>
      <main className="dashboard-content">
        {children}
      </main>
    </div>
  );
}
