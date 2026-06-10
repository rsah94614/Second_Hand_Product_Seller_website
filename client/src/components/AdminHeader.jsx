import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import {
  User, LogOut, Menu, ShieldCheck, Users, FolderTree,
  Package, Flag, Bell, CheckCheck, Settings, AlertTriangle,
  History, BarChart3, ListChecks, BadgeCheck, Gavel,
} from 'lucide-react';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
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

const AdminHeader = () => {
  const { user, logout } = useAuth();
  const socket = useSocket();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const seenToastIdsRef = useRef(new Set());
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);

  const desktopIconClass = 'relative inline-flex h-10 w-10 items-center justify-center rounded-xl text-white/75 transition-colors hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/20';
  const mobileIconClass = 'h-9 w-9 rounded-xl text-white/75 hover:bg-white/10 hover:text-white';

  /* ── Notifications ── */
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
      try {
        await markNotificationAsRead(notification._id);
      } catch (error) {
        console.error('Failed to mark notification as read:', error);
      }
    }
    navigate(notification.link || '/admin-dashboard');
  }, [markNotificationAsRead, navigate]);

  /* ── Socket listeners ── */
  useEffect(() => {
    if (!socket || !user) return undefined;

    const handleNewNotification = (notification) => {
      queryClient.setQueryData(['notifications-preview'], (current) => {
        const existing = current?.notifications || [];
        const deduped = existing.filter((item) => item._id !== notification._id);
        return {
          ...current,
          notifications: [notification, ...deduped].slice(0, 6),
          unreadCount: typeof current?.unreadCount === 'number'
            ? current.unreadCount + (notification.isRead ? 0 : 1)
            : 1,
        };
      });

      queryClient.setQueriesData({ queryKey: ['notifications-list'] }, (current) => {
        if (!current?.notifications) return current;
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
              className={`w-full max-w-sm rounded-2xl border bg-white p-4 text-left shadow-xl transition-all ${toastInstance.visible ? 'animate-soft-pop' : 'opacity-0'}`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-600">
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
          { duration: 4500, position: 'top-right' }
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
        if (!current) return current;
        return { ...current, unreadCount: count };
      });
    };

    socket.on('notification:new', handleNewNotification);
    socket.on('notification:unread_count', handleUnreadCount);

    return () => {
      socket.off('notification:new', handleNewNotification);
      socket.off('notification:unread_count', handleUnreadCount);
    };
  }, [socket, user, queryClient, openNotification]);

  /* ── Navigation links ── */
  const navLinks = [
    { to: '/admin-dashboard', label: 'Overview', icon: ShieldCheck },
    { to: '/admin/users', label: 'Users', icon: Users },
    { to: '/admin/products', label: 'Products', icon: Package },
    { to: '/admin/categories', label: 'Categories', icon: FolderTree },
    { to: '/admin/orders', label: 'Orders', icon: History },
    { to: '/admin/disputes', label: 'Disputes', icon: AlertTriangle },
    { to: '/admin/reports', label: 'Reports', icon: Flag },
    { to: '/admin/moderation-queue', label: 'Mod Queue', icon: ListChecks },
    { to: '/admin/seller-verifications', label: 'Verifications', icon: BadgeCheck },
  ];


  const profileMenuLinks = [
    { to: '/admin/reports-hub', label: 'Sales & Revenue', icon: BarChart3 },
    { to: '/admin/audit-logs', label: 'Audit Logs', icon: ShieldCheck },
    { isSeparator: true },
    { label: 'Logout', icon: LogOut, action: 'logout', danger: true },
  ];

  const handleLogoutClick = () => setIsLogoutDialogOpen(true);

  const confirmLogout = () => {
    logout();
    navigate('/');
    setIsMenuOpen(false);
    setIsLogoutDialogOpen(false);
  };

  /* ── Notification Dropdown ── */
  const renderNotificationsDropdown = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" className={desktopIconClass} title="Notifications">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
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
                className={`mb-1 flex cursor-pointer items-start gap-3 rounded-2xl px-3 py-3 ${notification.isRead ? '' : 'bg-red-50/50'}`}
                onClick={() => openNotification(notification)}
              >
                <div className={`mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full ${notification.isRead ? 'bg-gray-200' : 'bg-red-600'}`} />
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
      </DropdownMenuContent>
    </DropdownMenu>
  );

  /* ── Profile Dropdown ── */
  const renderProfileDropdown = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" className={desktopIconClass} title="Account">
          <User className="h-5 w-5" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 rounded-2xl p-2 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] border border-gray-100 animate-soft-pop mt-2">
        <div className="px-3 py-3 mb-1 bg-red-50/60 rounded-xl">
          <p className="font-semibold text-gray-900 truncate">{user?.name || 'Account'}</p>
          <p className="text-xs text-gray-500 font-medium truncate mt-0.5">{user?.email}</p>
          <Badge variant="destructive" className="uppercase tracking-wide mt-1.5 text-[10px]">
            Admin
          </Badge>
        </div>

        {profileMenuLinks.map((item, index) => {
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

  return (
    <header className="bg-slate-900/95 backdrop-blur-xl border-b border-red-500/20 sticky top-0 z-50">
      <div className="mx-auto px-4 sm:px-6 lg:px-24">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/admin-dashboard" className="shrink-0 flex items-center group">
            <div className="px-2.5 h-8 bg-linear-to-br from-red-600 to-rose-600 rounded-xl flex items-center justify-center text-white font-black text-lg tracking-tight group-hover:rotate-2 transition-transform duration-300 shadow-md shadow-red-600/30">Campus</div>
            <div className="text-2xl font-display font-black text-white tracking-tight ml-0.5">Mitra</div>
            <Badge variant="destructive" className="ml-2.5 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border-red-400/30">
              Admin
            </Badge>
          </Link>

          {/* Desktop right */}
          <div className="hidden md:flex items-center gap-3">

            {renderNotificationsDropdown()}
            {renderProfileDropdown()}
          </div>

          {/* Mobile */}
          <div className="flex md:hidden items-center gap-4">
            <Link to="/admin-dashboard" className="relative">
              <Button variant="ghost" size="icon" className={mobileIconClass}>
                <Bell className="w-5 h-5" />
              </Button>
              {unreadCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 inline-flex min-w-4 items-center justify-center rounded-full bg-red-600 px-1 py-0.5 text-[10px] font-bold text-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>
            <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <SheetTrigger asChild>
                <button className={`${mobileIconClass} inline-flex items-center justify-center`}>
                  <Menu className="w-6 h-6" />
                </button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[88vw] max-w-sm p-0" aria-describedby={undefined}>
                <SheetHeader className="border-b border-gray-100 px-5 py-4">
                  <SheetTitle className="flex items-center gap-2 text-xl">
                    <ShieldCheck className="w-5 h-5 text-red-600" />
                    Admin Panel
                  </SheetTitle>
                </SheetHeader>
                <div className="px-4 py-5 space-y-4 animate-enter">
                  {/* User info */}
                  <div className="flex items-center gap-3 px-3 py-3 bg-red-50/60 rounded-2xl mb-2 animate-fade-in">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 text-red-600">
                      <User className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 truncate">{user?.name}</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm text-gray-500 truncate">{user?.email}</p>
                        <Badge variant="destructive" className="uppercase tracking-wide">
                          Admin
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Nav links */}
                  {navLinks.map((link) => {
                    const Icon = link.icon;
                    const isActive = location.pathname === link.to;
                    return (
                      <Link
                        key={link.to}
                        to={link.to}
                        onClick={() => setIsMenuOpen(false)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                          isActive
                            ? 'bg-red-50 text-red-600 font-bold'
                            : 'text-gray-700 hover:bg-red-50 hover:text-red-600 font-medium'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span>{link.label}</span>
                      </Link>
                    );
                  })}

                  <div className="h-px bg-gray-100 my-2" />

                  <Link
                    to="/admin/reports-hub"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-red-50 hover:text-red-600 font-medium transition-colors"
                  >
                    <BarChart3 className="w-5 h-5" />
                    <span>Sales & Revenue</span>
                  </Link>
                  <Link
                    to="/admin/audit-logs"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-red-50 hover:text-red-600 font-medium transition-colors"
                  >
                    <ShieldCheck className="w-5 h-5" />
                    <span>Audit Logs</span>
                  </Link>

                  <div className="h-px bg-gray-100 my-2" />

                  <button
                    onClick={handleLogoutClick}
                    className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                  >
                    <LogOut className="w-5 h-5" />
                    <span className="font-medium">Logout</span>
                  </button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      <AlertDialog open={isLogoutDialogOpen} onOpenChange={setIsLogoutDialogOpen}>
        <AlertDialogContent className="rounded-3xl border-gray-100 shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-gray-900">Confirm Logout</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-500">
              Are you sure you want to sign out of the admin panel? You will need to login again to access your account.
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

export default AdminHeader;
