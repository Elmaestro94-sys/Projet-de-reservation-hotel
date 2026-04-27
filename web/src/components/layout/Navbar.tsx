import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, Bell, ChevronDown, LogOut, Home, Heart, Calendar, MessageSquare, Settings, LayoutDashboard, Sparkles } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { useQuery } from '@tanstack/react-query';
import { notificationApi } from '@/services/api';

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { isAuthenticated, user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === '/';

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setDropdownOpen(false);
  }, [location.pathname]);

  const { data: unreadData } = useQuery({
    queryKey: ['notifications-count'],
    queryFn: () => notificationApi.unreadCount().then(r => r.data.data),
    enabled: isAuthenticated,
    refetchInterval: 30000,
  });

  const unreadCount = unreadData?.count || 0;
  const isOwner = user?.role === 'OWNER';
  const isAdmin = ['SUPER_ADMIN', 'SUPPORT', 'FINANCE', 'MODERATOR'].includes(user?.role || '');

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navBg = isHome && !scrolled
    ? 'bg-transparent'
    : 'bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100/80';

  const textColor = isHome && !scrolled ? 'text-white' : 'text-gray-700';
  const logoColor = isHome && !scrolled ? 'text-white' : 'text-gray-900';

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${navBg}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 py-3">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 flex-shrink-0">
            <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shadow-sm">
              <Home className="w-5 h-5 text-white" />
            </div>
            <div className="leading-tight">
              <span className={`font-display font-bold text-lg leading-none ${logoColor} transition-colors duration-300`}>
                Séjour <span className="text-primary-500">Sénégal</span>
              </span>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            <Link
              to="/recherche"
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 hover:bg-white/10 ${textColor}`}
            >
              Explorer
            </Link>
            {isOwner && (
              <Link
                to="/proprietaire"
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 hover:bg-white/10 ${textColor}`}
              >
                Espace propriétaire
              </Link>
            )}
            {isAdmin && (
              <Link
                to="/admin"
                className="px-4 py-2 rounded-xl text-sm font-medium text-primary-500 hover:bg-primary-50 transition-all duration-200"
              >
                Administration
              </Link>
            )}
          </nav>

          {/* Desktop actions */}
          <div className="hidden md:flex items-center gap-2">
            {isAuthenticated ? (
              <>
                {/* Notifications */}
                <Link
                  to="/dashboard"
                  className={`relative p-2.5 rounded-xl transition-all duration-200 hover:bg-white/10 ${textColor}`}
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 rounded-full text-white text-[10px] flex items-center justify-center font-bold ring-2 ring-white">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>

                {/* User dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className={`flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-xl border transition-all duration-200 ${
                      isHome && !scrolled
                        ? 'border-white/30 hover:bg-white/10 text-white'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    {user?.avatar ? (
                      <img src={user.avatar} alt="" className="w-8 h-8 rounded-lg object-cover" />
                    ) : (
                      <div className="w-8 h-8 bg-gradient-to-br from-primary-400 to-primary-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs font-bold">
                          {user?.firstName?.[0]}{user?.lastName?.[0]}
                        </span>
                      </div>
                    )}
                    <span className="text-sm font-medium">{user?.firstName}</span>
                    <ChevronDown className={`w-3.5 h-3.5 opacity-60 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-60 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 animate-fade-in-down">
                      <div className="px-4 py-3 border-b border-gray-50">
                        <p className="text-sm font-semibold text-gray-900">{user?.firstName} {user?.lastName}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{user?.email}</p>
                      </div>
                      <div className="py-1">
                        <Link to="/dashboard" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg mx-1 transition-colors">
                          <LayoutDashboard className="w-4 h-4 text-gray-400" /> Mon tableau de bord
                        </Link>
                        <Link to="/mes-reservations" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg mx-1 transition-colors">
                          <Calendar className="w-4 h-4 text-gray-400" /> Mes réservations
                        </Link>
                        <Link to="/mes-favoris" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg mx-1 transition-colors">
                          <Heart className="w-4 h-4 text-gray-400" /> Mes favoris
                        </Link>
                        <Link to="/messages" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg mx-1 transition-colors">
                          <MessageSquare className="w-4 h-4 text-gray-400" /> Messages
                          {unreadCount > 0 && (
                            <span className="ml-auto text-xs bg-red-100 text-red-600 font-bold px-1.5 py-0.5 rounded-full">{unreadCount}</span>
                          )}
                        </Link>
                        <Link to="/profil" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg mx-1 transition-colors">
                          <Settings className="w-4 h-4 text-gray-400" /> Paramètres
                        </Link>
                        {isAdmin && (
                          <Link to="/admin" className="flex items-center gap-3 px-4 py-2.5 text-sm text-primary-600 hover:bg-primary-50 rounded-lg mx-1 transition-colors">
                            <Sparkles className="w-4 h-4" /> Administration
                          </Link>
                        )}
                      </div>
                      <div className="border-t border-gray-100 pt-1">
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 rounded-lg mx-1 transition-colors"
                        >
                          <LogOut className="w-4 h-4" /> Déconnexion
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 hover:bg-white/10 ${textColor}`}
                >
                  Connexion
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-xl transition-all duration-200 shadow-sm hover:shadow"
                >
                  S'inscrire
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className={`md:hidden p-2.5 rounded-xl transition-colors ${
              isHome && !scrolled ? 'text-white hover:bg-white/10' : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden absolute left-0 right-0 top-full bg-white border-t border-gray-100 shadow-xl animate-fade-in-down">
            <div className="px-4 py-4 space-y-1">
              <Link to="/recherche" className="flex items-center gap-3 px-3 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-xl">
                Explorer les logements
              </Link>
              {isAuthenticated ? (
                <>
                  <div className="flex items-center gap-3 px-3 py-2 mb-2">
                    <div className="w-9 h-9 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center">
                      <span className="text-white text-sm font-bold">{user?.firstName?.[0]}{user?.lastName?.[0]}</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{user?.firstName} {user?.lastName}</p>
                      <p className="text-xs text-gray-400">{user?.email}</p>
                    </div>
                  </div>
                  <Link to="/dashboard" className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-xl">
                    <LayoutDashboard className="w-4 h-4 text-gray-400" /> Tableau de bord
                  </Link>
                  <Link to="/mes-reservations" className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-xl">
                    <Calendar className="w-4 h-4 text-gray-400" /> Mes réservations
                  </Link>
                  <Link to="/messages" className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-xl">
                    <MessageSquare className="w-4 h-4 text-gray-400" /> Messages
                  </Link>
                  {isOwner && (
                    <Link to="/proprietaire" className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-xl">
                      Espace propriétaire
                    </Link>
                  )}
                  <div className="pt-2 border-t border-gray-100">
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-red-500 hover:bg-red-50 rounded-xl"
                    >
                      <LogOut className="w-4 h-4" /> Déconnexion
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex gap-3 pt-2">
                  <Link to="/login" className="flex-1 text-center py-2.5 text-sm font-medium text-gray-700 border border-gray-200 rounded-xl">Connexion</Link>
                  <Link to="/register" className="flex-1 text-center py-2.5 text-sm font-semibold text-white bg-primary-600 rounded-xl">S'inscrire</Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {dropdownOpen && <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />}
    </header>
  );
}
