'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  Building2, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  Bell,
  UserCircle,
  ChevronDown
} from 'lucide-react';
import useAuthStore from '@/store/authStore';
import { useState } from 'react';
import { UserRole } from '@/types';

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();

  // Check if user is authenticated, otherwise redirect to login
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const isSuperAdmin = user.role === UserRole.SUPERADMIN;

  const navigationItems = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      name: 'Planos',
      href: '/dashboard/plans',
      icon: FileText,
    },
    {
      name: 'Usuários',
      href: '/dashboard/users',
      icon: Users,
      adminOnly: true,
    },
    {
      name: 'Empresas',
      href: '/dashboard/companies',
      icon: Building2,
      adminOnly: true,
    },
    {
      name: 'Configurações',
      href: '/dashboard/settings',
      icon: Settings,
    },
  ];

  // Filter out admin-only items for regular users
  const filteredNavigation = navigationItems.filter(
    item => !item.adminOnly || isSuperAdmin
  );

  const handleLogout = () => {
    logout();
    router.push('/auth/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-gray-800 bg-opacity-50 z-20 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-30 w-64 h-full transition-transform duration-300 transform bg-white border-r border-gray-200 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <Link href="/dashboard" className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-emerald-600">Lyz.ai</span>
          </Link>
          <button
            className="p-1 rounded-md lg:hidden focus:outline-none focus:ring-2 focus:ring-emerald-500"
            onClick={() => setIsSidebarOpen(false)}
          >
            <X size={24} className="text-gray-500" />
          </button>
        </div>
        <nav className="flex flex-col h-full py-4">
          <div className="flex-1">
            <ul className="space-y-1 px-3">
              {filteredNavigation.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg ${
                      pathname === item.href
                        ? 'text-emerald-700 bg-emerald-50'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <item.icon
                      size={18}
                      className={`mr-3 ${
                        pathname === item.href ? 'text-emerald-600' : 'text-gray-500'
                      }`}
                    />
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="px-3 mt-auto">
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-4 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100"
            >
              <LogOut size={18} className="mr-3 text-gray-500" />
              Sair
            </button>
          </div>
        </nav>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top navbar */}
        <header className="sticky top-0 z-10 bg-white border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
            <button
              className="p-1 text-gray-500 rounded-md lg:hidden focus:outline-none focus:ring-2 focus:ring-emerald-500"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu size={24} />
            </button>
            
            <div className="flex items-center space-x-4">
              <button className="relative p-1 text-gray-500 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500">
                <Bell size={20} />
                <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              
              <div className="relative">
                <button
                  className="flex items-center space-x-2 focus:outline-none"
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                >
                  <UserCircle size={32} className="text-gray-500" />
                  <div className="hidden md:block text-left">
                    <p className="text-sm font-medium text-gray-700">{user.name}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                  <ChevronDown size={16} className="text-gray-500" />
                </button>
                
                {isProfileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 py-2 bg-white rounded-md shadow-lg border border-gray-200 z-50">
                    <Link
                      href="/dashboard/profile"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsProfileMenuOpen(false)}
                    >
                      Perfil
                    </Link>
                    <Link
                      href="/dashboard/settings"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsProfileMenuOpen(false)}
                    >
                      Configurações
                    </Link>
                    <hr className="my-1 border-gray-200" />
                    <button
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        handleLogout();
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                    >
                      Sair
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
