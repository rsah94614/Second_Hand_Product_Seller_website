import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { globalSearch, getSearchSuggestions } from '../features/search/api/searchApi';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { Search, Plus, User, LogOut, Menu, Briefcase, ShoppingCart, History, MessageCircle, LayoutDashboard, ShieldCheck, Users, FolderTree, Package, Heart, Flag, Bell, CheckCheck, Clock, TrendingUp, Settings } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Badge } from './ui/Badge';
import { PRODUCT_FALLBACK_IMAGE, setFallbackImage } from '../lib/fallbackImages';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/AlertDialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from './ui/Sheet';

const Header = () => {
  const { user, logout, isUser, isAdmin } = useAuth();
  const socket = useSocket();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef(null);
  const location = useLocation();
  const seenToastIdsRef = useRef(new Set());
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [searchQuery]);

  const { data: globalSearchData } = useQuery({
    queryKey: ['global-search', debouncedSearch],
    queryFn: () => globalSearch(debouncedSearch, { limit: 5 }),
    enabled: debouncedSearch.length >= 2,
    staleTime: 60 * 1000,
  });

  const { data: suggestionsData } = useQuery({
    queryKey: ['search-suggestions', debouncedSearch],
    queryFn: () => getSearchSuggestions(debouncedSearch),
    enabled: showSuggestions && debouncedSearch.length >= 1,
    staleTime: 30 * 1000,
  });

  const searchProducts = globalSearchData?.products || [];
  const searchUsers = globalSearchData?.users || [];
  const hasResults = searchProducts.length > 0 || searchUsers.length > 0;
  const suggestions = suggestionsData?.suggestions || [];
  const showSuggestionDropdown = showSuggestions && debouncedSearch.length >= 1 && !hasResults && suggestions.length > 0;

  // Close search dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const { data: notificationPreview } = useQuery({
    queryKey: ['notifications-preview'],
    queryFn: () => getNotifications({ limit: 6 }),
    enabled: Boolean(user),
    staleTime: 15 * 1000,
    refetchInterval: user ? 15000 : false,
  });

  const { mutateAsync: markNotificationAsRead } = useMutation({
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
      await markNotificationAsRead(notification._id);
    }

    navigate(notification.link || '/notifications');
  }, [markNotificationAsRead, navigate]);

  useEffect(() => {
    if (!socket || !user) {
      return undefined;
    }

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
              className={`w-full max-w-sm rounded-2xl border bg-white p-4 text-left shadow-xl transition-all ${toastInstance.visible ? 'animate-soft-pop' : 'opacity-0'
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

    socket.on('notification:new', handleNewNotification);
    socket.on('notification:unread_count', handleUnreadCount);

    return () => {
      socket.off('notification:new', handleNewNotification);
      socket.off('notification:unread_count', handleUnreadCount);
    };
  }, [socket, user, queryClient, openNotification]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setShowSuggestions(false);
    }
  };

  const handleLogoutClick = () => {
    setIsLogoutDialogOpen(true);
  };

  const confirmLogout = () => {
    logout();
    navigate('/');
    setIsMenuOpen(false);
    setIsLogoutDialogOpen(false);
  };

  const roleTone = user?.role === 'admin' ? 'destructive' : 'success';
  const desktopHeaderIconClass = 'relative inline-flex h-10 w-10 items-center justify-center rounded-xl text-white/75 transition-colors hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/20';
  const mobileHeaderIconClass = 'h-9 w-9 rounded-xl text-white/75 hover:bg-white/10 hover:text-white';

  const primaryLinks = isAdmin
    ? [
      { to: '/admin-dashboard', label: 'Overview', icon: ShieldCheck },
    ]
    : isUser
      ? [
        { to: '/products', label: 'Products', icon: Package },
      ]
      : [];

  const userMenuLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
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
    { to: '/admin/moderation-queue', label: 'Mod Queue', icon: ShieldCheck },
    { to: '/admin/seller-verifications', label: 'Verifications', icon: ShieldCheck },
  ];

  const utilityLinks = isAdmin
    ? [
      { to: '/notifications', label: 'Notifications', icon: Bell },
      { to: '/settings', label: 'Settings', icon: Settings },
      { to: '/profile', label: 'Profile', icon: User },
    ]
    : [
      { to: '/chat', label: 'Chat', icon: MessageCircle },
      { to: '/notifications', label: 'Notifications', icon: Bell },
      { to: '/settings', label: 'Settings', icon: Settings },
      { to: '/profile', label: 'Profile', icon: User },
    ];

  const renderUnifiedProfileDropdown = () => {
    const topLinks = isAdmin ? adminManageLinks : userMenuLinks;
    const bottomLinks = [
      ...utilityLinks,
      { isSeparator: true },
      { label: 'Logout', icon: LogOut, action: 'logout', danger: true },
    ];

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className={desktopHeaderIconClass}
            title="Account"
          >
            <User className="h-5 w-5" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64 rounded-2xl p-2 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] border border-gray-100 animate-soft-pop mt-2">
          <div className="px-3 py-3 mb-1 bg-gray-50/80 rounded-xl">
            <p className="font-semibold text-gray-900 truncate">{user?.name || 'Account'}</p>
            <p className="text-xs text-gray-500 font-medium truncate capitalize mt-0.5">{user?.email || (user?.role && `${user.role} Account`)}</p>
          </div>

          {[...topLinks, { isSeparator: true }, ...bottomLinks].map((item, index) => {
            if (item.isSeparator) {
              return <DropdownMenuSeparator key={`sep-${index}`} className="my-1.5 opacity-50" />;
            }
            const Icon = item.icon;
            const content = (
              <>
                <Icon className="w-[18px] h-[18px]" />
                <span className="font-medium text-[14px]">{item.label}</span>
              </>
            );

            if (item.action === 'logout') {
              return (
                <DropdownMenuItem
                  key={item.label}
                  onClick={handleLogoutClick}
                  className="gap-3 rounded-xl text-red-600 focus:bg-red-50 focus:text-red-700 mt-1 cursor-pointer py-2.5"
                >
                  {content}
                </DropdownMenuItem>
              );
            }

            return (
              <DropdownMenuItem key={item.to || item.label} asChild className="gap-3 rounded-xl mb-0.5 cursor-pointer py-2.5">
                <Link to={item.to}>{content}</Link>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  const renderNotificationsDropdown = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={desktopHeaderIconClass}
          title="Notifications"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-primary-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96 rounded-2xl p-2">
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
          <div className="max-h-96 overflow-y-auto py-1">
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
    <header className="bg-primary-950/90 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50">
      <div className="mx-auto px-4 sm:px-6 lg:px-24">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="shrink-0 flex items-center group">
            <div className="px-2.5 h-8 bg-linear-to-br from-primary-600 to-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-lg tracking-tight group-hover:rotate-2 transition-transform duration-300 shadow-md shadow-primary-600/30">Campus</div>
            <div className="text-2xl font-display font-black text-white tracking-tight ml-0.5">Mitra</div>
          </Link>

          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md mx-4 lg:mx-8">
            <div className="relative w-full group" ref={searchRef}>
              <Input
                type="text"
                placeholder="Search for anything..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setShowSuggestions(true); }}
                onFocus={() => setShowSuggestions(true)}
                className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:bg-white/15 focus:border-white/30 transition-all"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40 group-hover:text-white/70 transition-colors w-4 h-4" />

              {/* Suggestions dropdown (shown when no full results yet) */}
              {showSuggestionDropdown && (
                <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl animate-soft-pop">
                  <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
                    <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Suggestions</p>
                  </div>
                  {suggestions.map((s, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        setSearchQuery(s.query);
                        setShowSuggestions(false);
                        navigate(`/products?search=${encodeURIComponent(s.query)}`);
                      }}
                      className="flex w-full items-center gap-3 border-b border-gray-100 px-4 py-2.5 text-left transition-colors hover:bg-gray-50 last:border-b-0"
                    >
                      {s.type === 'recent' && <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />}
                      {s.type === 'popular' && <TrendingUp className="w-3.5 h-3.5 text-primary-500 shrink-0" />}
                      {s.type === 'product' && <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />}
                      <span className="text-sm text-gray-700">{s.query}</span>
                      {s.type === 'popular' && s.count && (
                        <span className="ml-auto text-xs text-gray-400">{s.count} searches</span>
                      )}
                      {s.category && (
                        <span className="ml-auto text-xs text-gray-400">{s.category}</span>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {/* Full results dropdown */}
              {debouncedSearch.length >= 2 && hasResults && (
                <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl animate-soft-pop">
                  {searchUsers.length > 0 && (
                    <>
                      <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
                        <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">People</p>
                      </div>
                      {searchUsers.map((u) => (
                        <button
                          key={u._id}
                          type="button"
                          onClick={() => {
                            navigate('/chat', { state: { sellerId: u._id, sellerName: u.name } });
                            setSearchQuery('');
                            setDebouncedSearch('');
                          }}
                          className="flex w-full items-center gap-3 border-b border-gray-100 px-4 py-3 text-left transition-colors hover:bg-gray-50 last:border-b-0"
                        >
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary-600 font-bold">
                            {u.name?.[0]?.toUpperCase() || '?'}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-semibold text-gray-900">{u.name}</p>
                            <p className="truncate text-sm text-gray-500">{u.email}</p>
                          </div>
                        </button>
                      ))}
                    </>
                  )}
                  {searchProducts.length > 0 && (
                    <>
                      <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
                        <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Products</p>
                      </div>
                      {searchProducts.map((product) => (
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
                            src={product.images?.[0] || PRODUCT_FALLBACK_IMAGE}
                            alt={product.title}
                            className="h-12 w-12 rounded-xl object-cover bg-gray-100"
                            onError={setFallbackImage}
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-semibold text-gray-900">{product.title}</p>
                            <p className="truncate text-sm text-gray-500">{product.category} | {product.location}</p>
                          </div>
                        </button>
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>
          </form>

          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                <nav className="flex items-center gap-1 xl:gap-2 mr-3 border-r border-white/15 pr-5">
                  {primaryLinks.map((link) => {
                    const Icon = link.icon;

                    return (
                      <Link key={link.to} to={link.to}>
                        <Button variant="ghost" size="sm" className="gap-2 text-white/70 hover:text-white hover:bg-white/10 transition-colors font-medium rounded-xl">
                          <Icon className="w-4 h-4" />
                          <span>{link.label}</span>
                        </Button>
                      </Link>
                    );
                  })}
                </nav>

                {isUser && (
                  <Link to="/create-product" className="mr-1">
                    <Button
                      className="gap-2 rounded-full bg-linear-to-r from-primary-600 to-indigo-500 hover:from-primary-700 hover:to-indigo-600 text-white shadow-lg shadow-primary-600/20 hover:shadow-primary-600/30 hover:-translate-y-0.5 transition-all duration-300 border-none"
                      size="sm"
                    >
                      <Plus className="w-4 h-4" />
                      <span className="font-semibold text-[14px]">List Item</span>
                    </Button>
                  </Link>
                )}

                <div className="flex items-center gap-3 xl:gap-4 pl-1">
                  {!isAdmin && (
                    <Link to="/cart">
                      <button
                        type="button"
                        className={desktopHeaderIconClass}
                        title="Your Cart"
                      >
                        <ShoppingCart className="h-4 w-4" />
                      </button>
                    </Link>
                  )}
                  {renderNotificationsDropdown()}
                  {renderUnifiedProfileDropdown()}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Link to="/login">
                  <Button variant="ghost" className="font-medium text-white/70 hover:text-white hover:bg-white/10">Login</Button>
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
                  <Link to="/cart">
                    <Button variant="ghost" size="icon" className={mobileHeaderIconClass}>
                      <ShoppingCart className="w-5 h-5" />
                    </Button>
                  </Link>
                )}
                <Link to="/notifications" className="relative">
                  <Button variant="ghost" size="icon" className={mobileHeaderIconClass}>
                    <Bell className="w-5 h-5" />
                  </Button>
                  {unreadCount > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 inline-flex min-w-4 items-center justify-center rounded-full bg-primary-600 px-1 py-0.5 text-[10px] font-bold text-white">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>
              </>
            )}
            <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <SheetTrigger asChild>
                <button className={`${mobileHeaderIconClass} inline-flex items-center justify-center`}>
                  <Menu className="w-6 h-6" />
                </button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[88vw] max-w-sm p-0" aria-describedby={undefined}>
                <SheetHeader className="border-b border-gray-100 px-5 py-4">
                  <SheetTitle className="flex items-center gap-2 text-xl">
                    <Package className="w-5 h-5 text-primary-600" />
                    Navigation
                  </SheetTitle>
                </SheetHeader>
                <div className="px-4 py-5 space-y-4 animate-enter">
                  {user ? (
                    <>
                      <div className="flex items-center gap-3 px-3 py-3 bg-gray-50 rounded-2xl mb-2 animate-fade-in">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                          <User className="h-5 w-5" />
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
                        const isActive = location.pathname === link.to;
                        return (
                          <Link
                            key={link.to}
                            to={link.to}
                            onClick={() => setIsMenuOpen(false)}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                              isActive 
                                ? 'bg-primary-50 text-primary-600 font-bold' 
                                : 'text-gray-700 hover:bg-primary-50 hover:text-primary-600 font-medium'
                            }`}
                          >
                            <Icon className="w-5 h-5" />
                            <span>{link.label}</span>
                          </Link>
                        );
                      })}

                      <div className="h-px bg-gray-100 my-2" />

                      <button
                        onClick={handleLogoutClick}
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

      <AlertDialog open={isLogoutDialogOpen} onOpenChange={setIsLogoutDialogOpen}>
        <AlertDialogContent className="rounded-3xl border-gray-100 shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-gray-900">Confirm Logout</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-500">
              Are you sure you want to sign out? You will need to login again to access your account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel className="rounded-xl border-gray-200 font-semibold hover:bg-gray-50">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmLogout}
              className="rounded-xl bg-red-600 font-semibold text-white hover:bg-red-700 border-none shadow-lg shadow-red-200"
            >
              Logout
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </header>
  );
};

export default Header;
