import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Building2, Calendar, CreditCard, LogOut, ChevronRight } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';

const navItems = [
  { to: '/admin', icon: LayoutDashboard, label: 'Tableau de bord', exact: true },
  { to: '/admin/utilisateurs', icon: Users, label: 'Utilisateurs' },
  { to: '/admin/annonces', icon: Building2, label: 'Annonces' },
  { to: '/admin/reservations', icon: Calendar, label: 'Réservations' },
  { to: '/admin/paiements', icon: CreditCard, label: 'Paiements' },
];

export default function AdminLayout() {
  const { pathname } = useLocation();
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 flex flex-col">
        <div className="p-6 border-b border-gray-800">
          <Link to="/" className="text-white font-bold text-lg">Séjour Sénégal</Link>
          <p className="text-gray-400 text-xs mt-1">Administration</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(({ to, icon: Icon, label, exact }) => {
            const active = exact ? pathname === to : pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active ? 'bg-primary-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                {label}
                {active && <ChevronRight className="w-4 h-4 ml-auto" />}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">{user?.firstName?.[0]}{user?.lastName?.[0]}</span>
            </div>
            <div>
              <p className="text-white text-sm font-medium">{user?.firstName}</p>
              <p className="text-gray-400 text-xs">{user?.role}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 text-gray-400 hover:text-red-400 text-sm w-full transition-colors">
            <LogOut className="w-4 h-4" /> Déconnexion
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
