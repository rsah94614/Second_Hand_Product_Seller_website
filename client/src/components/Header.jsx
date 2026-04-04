import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { Search, Plus, User, LogOut, Menu, Briefcase, ShoppingCart, History, MessageCircle, LayoutDashboard, ShieldCheck, Users, FolderTree, Package, Store, Heart, Flag, Bell, CheckCheck } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Badge } from './ui/Badge';
import { API_BASE_URL, SOCKET_URL } from '../config/api';
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../features/notifications/api/notificationApi';
import { formatNotificationTime } from '../features/notifications/utils/notificationMeta';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from './ui/DropdownMenu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from './ui/Sheet';

const Header = () => {
  const { user, logout, isUser, isAdmin } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const seenToastIdsRef = useRef(new Set());

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [searchQuery]);

  const { data: suggestionResponse } = useQuery({
    queryKey: ['header-search-suggestions', debouncedSearch],
    queryFn: () =>
      axios.get(`${API_BASE_URL}/api/products`, {
        params: {
          search: debouncedSearch,
          limit: 5,
        },
      }).then((res) => res.data),
    enabled: debouncedSearch.length >= 2,
    staleTime: 60 * 1000,
  });

  const suggestions = suggestionResponse?.products || [];

  const { data: notificationPreview } = useQuery({
    queryKey: ['notifications-preview'],
    queryFn: () => getNotifications({ limit: 6 }),
    enabled: Boolean(user),
    staleTime: 15 * 1000,
    refetchInterval: user ? 15000 : false,
  });

  const markNotificationMutation = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-preview'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-list'] });
    },
  });

  const markAllNotificationsMutation = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-preview'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-list'] });
    },
  });

  const notificationItems = notificationPreview?.notifications || [];
  const unreadCount = notificationPreview?.unreadCount || 0;

  const openNotification = useCallback(async (notification) => {
    if (!notification.isRead) {
      await markNotificationMutation.mutateAsync(notification._id);
    }

    navigate(notification.link || '/notifications');
  }, [markNotificationMutation, navigate]);

  useEffect(() => {
    if (!user) {
      return undefined;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      return undefined;
    }

    const notificationSocket = io(SOCKET_URL, {
      auth: {
        token: `Bearer ${token}`,
      },
      transports: ['websocket'],
    });

    const handleNewNotification = (notification) => {
      queryClient.setQueryData(['notifications-preview'], (current) => {
        const existingNotifications = current?.notifications || [];
        const deduped = existingNotifications.filter((item) => item._id !== notification._id);

        return {
          ...current,
          notifications: [notification, ...deduped].slice(0, 6),
          unreadCount: typeof current?.unreadCount === 'number'
            ? current.unreadCount + (notification.isRead ? 0 : 1)
            : 1,
        };
      });

      queryClient.setQueriesData({ queryKey: ['notifications-list'] }, (current) => {
        if (!current?.notifications) {
          return current;
        }

        const deduped = current.notifications.filter((item) => item._id !== notification._id);
        const shouldInclude = current.notifications.length < (current.total || deduped.length + 1);

        return {
          ...current,
          notifications: shouldInclude ? [notification, ...deduped] : [notification, ...deduped].slice(0, current.notifications.length),
          unreadCount: typeof current.unreadCount === 'number'
            ? current.unreadCount + (notification.isRead ? 0 : 1)
            : 1,
          total: (current.total || 0) + 1,
        };
      });

      if (!seenToastIdsRef.current.has(notification._id)) {
        seenToastIdsRef.current.add(notification._id);

        toast.custom(
          (toastInstance) => (
            <button
              type="button"
              onClick={() => {
                toast.dismiss(toastInstance.id);
                openNotification(notification);
              }}
              className={`w-full max-w-sm rounded-2xl border bg-white p-4 text-left shadow-xl transition-all ${
                toastInstance.visible ? 'animate-soft-pop' : 'opacity-0'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary-50 text-primary-600">
                  <Bell className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <p className="line-clamp-1 font-semibold text-gray-900">{notification.title}</p>
                    <span className="text-[11px] font-medium text-gray-400">now</span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-gray-500">{notification.message}</p>
                </div>
              </div>
            </button>
          ),
          {
            duration: 4500,
            position: 'top-right',
          }
        );
      }
    };

    const handleUnreadCount = ({ count }) => {
      queryClient.setQueryData(['notifications-preview'], (current) => ({
        ...current,
        notifications: current?.notifications || [],
        unreadCount: count,
      }));

      queryClient.setQueriesData({ queryKey: ['notifications-list'] }, (current) => {
        if (!current) {
          return current;
        }

        return {
          ...current,
          unreadCount: count,
        };
      });
    };

    notificationSocket.on('notification:new', handleNewNotification);
    notificationSocket.on('notification:unread_count', handleUnreadCount);

    return () => {
      notificationSocket.off('notification:new', handleNewNotification);
      notificationSocket.off('notification:unread_count', handleUnreadCount);
      notificationSocket.close();
    };
  }, [user, queryClient, openNotification]);

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
  };

  const roleTone = user?.role === 'admin' ? 'destructive' : 'success';

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
    { to: '/wishlist', label: 'Saved Items', icon: Heart },
    { to: '/orders', label: 'Orders', icon: History },
  ];

  const adminManageLinks = [
    { to: '/admin/users', label: 'Users', icon: Users },
    { to: '/admin/products', label: 'Products', icon: Package },
    { to: '/admin/categories', label: 'Categories', icon: FolderTree },
    { to: '/admin/orders', label: 'Orders', icon: History },
    { to: '/admin/reports', label: 'Reports', icon: Flag },
  ];

  const utilityLinks = isAdmin
    ? [
        { to: '/notifications', label: 'Notifications', icon: Bell },
        { to: '/profile', label: 'Profile', icon: User },
      ]
    : [
        { to: '/chat', label: 'Chat', icon: MessageCircle },
        { to: '/cart', label: 'Cart', icon: ShoppingCart },
        { to: '/notifications', label: 'Notifications', icon: Bell },
        { to: '/profile', label: 'Profile', icon: User },
      ];

  const renderDesktopDropdown = (label, items) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="ghost" size="sm" className="gap-2 text-gray-600">
          <span>{label}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 animate-soft-pop">
        {items.map((item, index) => {
          const Icon = item.icon;
          const isLogout = item.action === 'logout';
          const content = (
            <>
              <Icon className="w-4 h-4" />
              <span className="font-medium">{item.label}</span>
            </>
          );

          if (isLogout) {
            return (
              <React.Fragment key={item.label}>
                {index > 0 && <DropdownMenuSeparator />}
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="gap-3 rounded-xl text-red-600 focus:bg-red-50 focus:text-red-600"
                >
                  {content}
                </DropdownMenuItem>
              </React.Fragment>
            );
          }

          return (
            <DropdownMenuItem key={item.to} asChild className="gap-3 rounded-xl">
              <Link to={item.to}>{content}</Link>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const renderNotificationsDropdown = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 shadow-sm transition-colors hover:border-primary-200 hover:text-primary-700"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-primary-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96 rounded-3xl p-2">
        <DropdownMenuLabel className="flex items-center justify-between gap-3 px-3 py-2">
          <div>
            <p className="text-sm font-semibold text-gray-900">Notifications</p>
            <p className="text-xs font-normal text-gray-500">
              {unreadCount ? `${unreadCount} unread update${unreadCount > 1 ? 's' : ''}` : 'You are all caught up'}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 gap-2 px-2 text-xs"
            onClick={() => markAllNotificationsMutation.mutate()}
            disabled={!unreadCount || markAllNotificationsMutation.isPending}
          >
            <CheckCheck className="h-3.5 w-3.5" />
            Read all
          </Button>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notificationItems.length ? (
          <div className="max-h-[24rem] overflow-y-auto py-1">
            {notificationItems.map((notification) => (
              <DropdownMenuItem
                key={notification._id}
                className={`mb-1 flex cursor-pointer items-start gap-3 rounded-2xl px-3 py-3 ${notification.isRead ? '' : 'bg-primary-50/50'}`}
                onClick={() => openNotification(notification)}
              >
                <div className={`mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full ${notification.isRead ? 'bg-gray-200' : 'bg-primary-600'}`} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <p className="line-clamp-1 font-semibold text-gray-900">{notification.title}</p>
                    <span className="shrink-0 text-[11px] font-medium text-gray-400">
                      {formatNotificationTime(notification.createdAt)}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-gray-500">
                    {notification.message}
                  </p>
                </div>
              </DropdownMenuItem>
            ))}
          </div>
        ) : (
          <div className="px-3 py-8 text-center text-sm text-gray-500">
            No notifications yet.
          </div>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="justify-center rounded-2xl py-2.5 font-semibold text-primary-600 focus:text-primary-700"
          onClick={() => navigate('/notifications')}
        >
          View all notifications
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <header className="bg-white/85 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50">
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
              {debouncedSearch.length >= 2 && suggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl animate-soft-pop">
                  {suggestions.map((product) => (
                    <button
                      key={product._id}
                      type="button"
                      onClick={() => {
                        navigate(`/products/${product._id}`);
                        setSearchQuery('');
                        setDebouncedSearch('');
                      }}
                      className="flex w-full items-center gap-3 border-b border-gray-100 px-4 py-3 text-left transition-colors hover:bg-gray-50 last:border-b-0"
                    >
                      <img
                        src={product.images?.[0] || 'https://via.placeholder.com/56?text=Item'}
                        alt={product.title}
                        className="h-12 w-12 rounded-xl object-cover bg-gray-100"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-gray-900">{product.title}</p>
                        <p className="truncate text-sm text-gray-500">{product.category} | {product.location}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </form>

          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                <Badge variant={roleTone} className="hidden xl:inline-flex uppercase tracking-[0.18em] animate-fade-in">
                  {roleLabel}
                </Badge>

                <nav className="flex items-center gap-1 rounded-full border border-gray-200 bg-white/90 px-2 py-1 shadow-sm animate-soft-pop">
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
                  {renderNotificationsDropdown()}
                  {isUser && (
                    renderDesktopDropdown('Workspace', userMenuLinks)
                  )}
                  {isAdmin && renderDesktopDropdown('Manage', adminManageLinks)}
                  {renderDesktopDropdown(
                    'Account',
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
            {user && (
              <>
                {!isAdmin && (
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
                <Link to="/notifications" className="relative">
                  <Button variant="ghost" size="icon" className="text-gray-600">
                    <Bell className="w-5 h-5" />
                  </Button>
                  {unreadCount > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 inline-flex min-w-[1rem] items-center justify-center rounded-full bg-primary-600 px-1 py-0.5 text-[10px] font-bold text-white">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>
              </>
            )}
            <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <SheetTrigger asChild>
                <button className="p-2 text-gray-600 hover:text-primary-600 transition-colors rounded-lg hover:bg-gray-50">
                  <Menu className="w-6 h-6" />
                </button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[88vw] max-w-sm p-0">
                <SheetHeader className="border-b border-gray-100 px-5 py-4">
                  <SheetTitle className="flex items-center gap-2 text-xl">
                    <Store className="w-5 h-5 text-primary-600" />
                    Navigation
                  </SheetTitle>
                </SheetHeader>
                <div className="px-4 py-5 space-y-4 animate-enter">
                  {user ? (
                    <>
                      <div className="flex items-center gap-3 px-3 py-3 bg-gray-50 rounded-2xl mb-2 animate-fade-in">
                        <div className="w-10 h-10 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center font-bold text-lg">
                          {user.name?.[0] || 'U'}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 truncate">{user.name}</p>
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm text-gray-500 truncate">{user.email}</p>
                            <Badge variant={roleTone} className="uppercase tracking-wide">
                              {user.role}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      {[...primaryLinks, ...(isUser ? userMenuLinks : []), ...(isAdmin ? adminManageLinks : []), ...(isUser ? [{ to: '/create-product', label: 'List Product', icon: Plus }] : []), ...utilityLinks].map((link) => {
                        const Icon = link.icon;
                        return (
                          <Link
                            key={link.to}
                            to={link.to}
                            onClick={() => setIsMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-primary-50 hover:text-primary-600 rounded-xl transition-colors"
                          >
                            <Icon className="w-5 h-5" />
                            <span className="font-medium">{link.label}</span>
                          </Link>
                        );
                      })}

                      <div className="h-px bg-gray-100 my-2" />

                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                      >
                        <LogOut className="w-5 h-5" />
                        <span className="font-medium">Logout</span>
                      </button>
                    </>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      <Link to="/login" onClick={() => setIsMenuOpen(false)}>
                        <Button variant="outline" className="w-full justify-center">Login</Button>
                      </Link>
                      <Link to="/register" onClick={() => setIsMenuOpen(false)}>
                        <Button variant="primary" className="w-full justify-center">Register</Button>
                      </Link>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
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

    </header>
  );
};

export default Header;
