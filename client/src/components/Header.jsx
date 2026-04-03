import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Search, Plus, User, LogOut, Menu, X, Briefcase, ShoppingCart, History, MessageCircle, LayoutDashboard, ShieldCheck, Users, FolderTree, Package, Store, ChevronDown } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';

const Header = () => {
  const { user, logout, isUser, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [openDesktopMenu, setOpenDesktopMenu] = useState(null);
  const desktopMenuRef = useRef(null);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsMenuOpen(false);
    setOpenDesktopMenu(null);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (desktopMenuRef.current && !desktopMenuRef.current.contains(event.target)) {
        setOpenDesktopMenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const roleTone = user?.role === 'admin'
    ? 'bg-red-100 text-red-700 border-red-200'
    : 'bg-emerald-100 text-emerald-700 border-emerald-200';

  const roleLabel = user?.role ? `${user.role.charAt(0).toUpperCase()}${user.role.slice(1)}` : '';

  const primaryLinks = isAdmin
    ? [
        { to: '/admin-dashboard', label: 'Overview', icon: ShieldCheck },
      ]
    : isUser
      ? [
          { to: '/products', label: 'Products', icon: Store },
          { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        ]
      : [];

  const userMenuLinks = [
    { to: '/my-products', label: 'My Products', icon: Briefcase },
    { to: '/orders', label: 'Orders', icon: History },
  ];

  const adminManageLinks = [
    { to: '/admin/users', label: 'Users', icon: Users },
    { to: '/admin/products', label: 'Products', icon: Package },
    { to: '/admin/categories', label: 'Categories', icon: FolderTree },
    { to: '/admin/orders', label: 'Orders', icon: History },
  ];

  const utilityLinks = isAdmin
    ? [
        { to: '/profile', label: 'Profile', icon: User },
      ]
    : [
        { to: '/chat', label: 'Chat', icon: MessageCircle },
        { to: '/cart', label: 'Cart', icon: ShoppingCart },
        { to: '/profile', label: 'Profile', icon: User },
      ];

  const renderDesktopDropdown = (menuKey, label, items) => (
    <div className="relative" ref={openDesktopMenu === menuKey ? desktopMenuRef : null}>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="gap-2 text-gray-600"
        onClick={() => setOpenDesktopMenu((prev) => (prev === menuKey ? null : menuKey))}
      >
        <span>{label}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${openDesktopMenu === menuKey ? 'rotate-180' : ''}`} />
      </Button>

      {openDesktopMenu === menuKey && (
        <div className="absolute right-0 top-12 w-56 rounded-2xl border border-gray-200 bg-white shadow-xl p-2 z-50">
          {items.map((item) => {
            const Icon = item.icon;
            const isLogout = item.action === 'logout';

            if (isLogout) {
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                >
                  <Icon className="w-4 h-4" />
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            }

            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpenDesktopMenu(null)}
                className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-primary-50 hover:text-primary-600 rounded-xl transition-colors"
              >
                <Icon className="w-4 h-4" />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="shrink-0 flex items-center group">
            <div className="w-20 h-8 bg-primary-600 rounded-lg flex items-center justify-center text-white font-bold text-xl group-hover:bg-primary-700 transition-colors"> Campus </div>
            <div className="text-2xl font-display font-bold text-gray-900 tracking-tight">Mitra</div>
          </Link>

          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full group">
              <Input
                type="text"
                placeholder="Search for anything..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-gray-50 border-gray-200 focus:bg-white transition-all"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-hover:text-primary-500 transition-colors w-4 h-4" />
            </div>
          </form>

          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                <span className={`hidden xl:inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${roleTone}`}>
                  {roleLabel}
                </span>

                <nav className="flex items-center gap-1 rounded-full border border-gray-200 bg-white px-2 py-1 shadow-sm">
                  {primaryLinks.map((link) => {
                    const Icon = link.icon;

                    return (
                      <Link key={link.to} to={link.to}>
                        <Button variant="ghost" size="sm" className="gap-2 text-gray-600 hover:text-primary-700">
                          <Icon className="w-4 h-4" />
                          <span>{link.label}</span>
                        </Button>
                      </Link>
                    );
                  })}
                </nav>

                {isUser && (
                  <Link to="/create-product">
                    <Button
                      className="gap-2 rounded-full bg-linear-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 text-white shadow-md hover:shadow-lg transition-all border-none"
                      size="sm"
                    >
                      <Plus className="w-4 h-4" />
                      <span className="font-semibold">List Product</span>
                    </Button>
                  </Link>
                )}

                <div className="flex items-center gap-1">
                  {isUser && (
                    renderDesktopDropdown('workspace', 'Workspace', userMenuLinks)
                  )}
                  {isAdmin && renderDesktopDropdown('manage', 'Manage', adminManageLinks)}
                  {renderDesktopDropdown(
                    'account',
                    isAdmin ? 'Account' : 'Account',
                    [
                      ...utilityLinks,
                      { label: 'Logout', icon: LogOut, action: 'logout' },
                    ]
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Link to="/login">
                  <Button variant="ghost" className="font-medium">Login</Button>
                </Link>
                <Link to="/register">
                  <Button variant="primary" className="font-medium">Register</Button>
                </Link>
              </div>
            )}
          </div>

          <div className="flex md:hidden items-center gap-4">
            {user && !isAdmin && (
              <>
                <Link to="/cart">
                  <Button variant="ghost" size="icon" className="text-gray-600">
                    <ShoppingCart className="w-5 h-5" />
                  </Button>
                </Link>
                <Link to="/chat">
                  <Button variant="ghost" size="icon" className="text-gray-600">
                    <MessageCircle className="w-5 h-5" />
                  </Button>
                </Link>
              </>
            )}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 text-gray-600 hover:text-primary-600 transition-colors rounded-lg hover:bg-gray-50"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        <div className="md:hidden pb-4">
          <form onSubmit={handleSearch}>
            <div className="relative">
              <Input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-gray-50"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            </div>
          </form>
        </div>
      </div>

      {isMenuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white absolute w-full shadow-lg animate-in slide-in-from-top-2 duration-200">
          <div className="px-4 py-6 space-y-4">
            {user ? (
              <>
                <div className="flex items-center gap-3 px-2 py-3 bg-gray-50 rounded-xl mb-4">
                  <div className="w-10 h-10 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center font-bold text-lg">
                    {user.name?.[0] || 'U'}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{user.name}</p>
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-gray-500">{user.email}</p>
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wide ${roleTone}`}>
                        {user.role}
                      </span>
                    </div>
                  </div>
                </div>

                {primaryLinks.map((link) => {
                  const Icon = link.icon;

                  return (
                    <Link
                      key={link.to}
                      to={link.to}
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-primary-50 hover:text-primary-600 rounded-lg transition-colors"
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{link.label}</span>
                    </Link>
                  );
                })}
                {isUser && userMenuLinks.map((link) => {
                  const Icon = link.icon;

                  return (
                    <Link
                      key={link.to}
                      to={link.to}
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-primary-50 hover:text-primary-600 rounded-lg transition-colors"
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{link.label}</span>
                    </Link>
                  );
                })}
                {isUser && (
                  <Link
                    to="/create-product"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-primary-50 hover:text-primary-600 rounded-lg transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                      <span className="font-medium">List Product</span>
                  </Link>
                )}
                {utilityLinks.map((link) => {
                  const Icon = link.icon;

                  return (
                    <Link
                      key={link.to}
                      to={link.to}
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-primary-50 hover:text-primary-600 rounded-lg transition-colors"
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{link.label}</span>
                    </Link>
                  );
                })}

                <div className="h-px bg-gray-100 my-2"></div>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="font-medium">Logout</span>
                </button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <Link
                  to="/login"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Button variant="outline" className="w-full justify-center">Login</Button>
                </Link>
                <Link
                  to="/register"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Button variant="primary" className="w-full justify-center">Register</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
