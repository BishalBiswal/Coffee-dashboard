import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { 
  LayoutDashboard, Trees, Wheat, Users, ClipboardList, 
  BarChart3, LogOut, Menu, X, CloudOff, Cloud, Calendar,
  CloudRain, Package, DollarSign, ActivitySquare
} from 'lucide-react';
import { useState, useEffect } from 'react';

export default function Layout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/blocks', icon: Trees, label: 'Blocks' },
    { path: '/crops', icon: Wheat, label: 'Crops' },
    { path: '/seasons', icon: Calendar, label: 'Seasons' },
    { path: '/workers', icon: Users, label: 'Workers' },
    { path: '/work-logs', icon: ClipboardList, label: 'Work Logs' },
    { path: '/activity', icon: ActivitySquare, label: 'Activity' },
    { path: '/weather', icon: CloudRain, label: 'Weather' },
    { path: '/inventory', icon: Package, label: 'Inventory' },
    { path: '/cost-summary', icon: DollarSign, label: 'Costs' },
    { path: '/analytics', icon: BarChart3, label: 'Analytics' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 z-30 h-full w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out
        lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
          <h1 className="text-lg font-bold text-primary-600">Field Management</h1>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="p-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-primary-50 text-primary-600' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`
              }
              end={item.path === '/'}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">{user?.username}</span>
            <button
              onClick={handleLogout}
              className="p-2 text-gray-500 hover:text-red-600 rounded-lg hover:bg-gray-100"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:ml-64">
        {/* Top bar */}
        <header className="sticky top-0 z-10 h-16 bg-white border-b border-gray-200">
          <div className="flex items-center justify-between h-full px-4">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              <Menu className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-2 ml-auto">
              {isOnline ? (
                <Cloud className="w-5 h-5 text-green-500" />
              ) : (
                <div className="flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-sm">
                  <CloudOff className="w-4 h-4" />
                  <span>Offline</span>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-6 overflow-x-hidden max-w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
