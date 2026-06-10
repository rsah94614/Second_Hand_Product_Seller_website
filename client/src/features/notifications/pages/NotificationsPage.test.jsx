import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';
import NotificationsPage from './NotificationsPage';

const mockNavigate = vi.fn();
const mockMarkOne = vi.fn();
const mockMarkAll = vi.fn();
const mockSetActiveTab = vi.fn();
const mockSetActiveCategory = vi.fn();
const mockHandleOpenNotification = vi.fn();
const mockHandleSnooze = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual('@tanstack/react-query');
  return {
    ...actual,
    useQuery: vi.fn(),
    useMutation: vi.fn(),
    useQueryClient: vi.fn(),
  };
});

vi.mock('../../../components/Header', () => ({ default: () => <div>Header</div> }));
vi.mock('../../../components/Footer', () => ({ default: () => <div>Footer</div> }));
vi.mock('../hooks/useNotificationsLogic', () => ({
  useNotificationsLogic: vi.fn(),
}));

vi.mock('../api/notificationApi', () => ({
  getNotifications: vi.fn(),
  markAllNotificationsRead: vi.fn(),
  markNotificationRead: vi.fn(),
}));

vi.mock('../utils/notificationMeta', () => ({
  formatNotificationTime: vi.fn(() => 'Just now'),
  getNotificationDateBucket: vi.fn(() => 'Today'),
  getNotificationCategory: vi.fn((type) => {
    if (type.includes('message')) return 'messages';
    if (type.includes('order')) return 'orders';
    return 'activity';
  }),
  getNotificationVisual: vi.fn(() => ({
    icon: () => <span>icon</span>,
    iconTone: 'bg-primary-50 text-primary-700',
    badge: 'secondary',
  })),
  notificationCategoryOptions: [
    { value: 'all', label: 'All' },
    { value: 'messages', label: 'Messages' },
    { value: 'orders', label: 'Orders' },
    { value: 'activity', label: 'Activity' },
  ],
}));

const { useMutation, useQueryClient } = await import('@tanstack/react-query');
const { useNotificationsLogic } = await import('../hooks/useNotificationsLogic');

const renderPage = () => {
  const queryClient = new QueryClient();
  let mutationCall = 0;
  useQueryClient.mockReturnValue({
    invalidateQueries: vi.fn(),
  });
  useMutation.mockImplementation(() => {
    mutationCall += 1;

    if (mutationCall % 2 === 1) {
      return {
        mutateAsync: mockMarkOne,
        isPending: false,
      };
    }

    return {
      mutate: mockMarkAll,
      isPending: false,
    };
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <NotificationsPage />
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe('NotificationsPage', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders the notification inbox with grouped items', () => {
    useNotificationsLogic.mockReturnValue({
      activeTab: 'all',
      setActiveTab: mockSetActiveTab,
      activeCategory: 'all',
      setActiveCategory: mockSetActiveCategory,
      isLoading: false,
      unreadCount: 2,
      totalCount: 2,
      categoryCounts: { all: 2, messages: 1, orders: 1, activity: 0 },
      groupedEntries: [
        {
          label: 'Today',
          items: [
            {
              _id: 'n1',
              type: 'new_message',
              title: 'New message',
              message: 'Someone messaged you.',
              isRead: false,
              createdAt: '2026-04-04T09:00:00.000Z',
              link: '/chat',
            },
            {
              _id: 'n2',
              type: 'order_status_updated',
              title: 'Order update',
              message: 'Your order shipped.',
              isRead: true,
              createdAt: '2026-04-04T08:00:00.000Z',
              link: '/orders',
            },
          ],
        },
      ],
      handleOpenNotification: mockHandleOpenNotification,
      handleSnooze: mockHandleSnooze,
      markAllRead: mockMarkAll,
      isMarkAllPending: false,
    });

    renderPage();

    expect(screen.getByText('Notifications')).toBeInTheDocument();
    expect(screen.getByText('2 unread')).toBeInTheDocument();
    expect(screen.getByText('Today')).toBeInTheDocument();
    expect(screen.getByText('New message')).toBeInTheDocument();
    expect(screen.getByText('Order update')).toBeInTheDocument();
  });

  it('shows the empty state when no notifications are available', () => {
    useNotificationsLogic.mockReturnValue({
      activeTab: 'all',
      setActiveTab: mockSetActiveTab,
      activeCategory: 'all',
      setActiveCategory: mockSetActiveCategory,
      isLoading: false,
      unreadCount: 0,
      totalCount: 0,
      categoryCounts: { all: 0, messages: 0, orders: 0, activity: 0 },
      groupedEntries: [],
      handleOpenNotification: mockHandleOpenNotification,
      handleSnooze: mockHandleSnooze,
      markAllRead: mockMarkAll,
      isMarkAllPending: false,
    });

    renderPage();

    expect(screen.getByText('No notifications yet')).toBeInTheDocument();
  });

  it('filters the visible notifications by category', () => {
    useNotificationsLogic.mockReturnValue({
      activeTab: 'all',
      setActiveTab: mockSetActiveTab,
      activeCategory: 'messages',
      setActiveCategory: mockSetActiveCategory,
      isLoading: false,
      unreadCount: 1,
      totalCount: 1,
      categoryCounts: { all: 2, messages: 1, orders: 1, activity: 0 },
      groupedEntries: [
        {
          label: 'Today',
          items: [
            {
              _id: 'n1',
              type: 'new_message',
              title: 'Message alert',
              message: 'A new message arrived.',
              isRead: false,
              createdAt: '2026-04-04T09:00:00.000Z',
              link: '/chat',
            },
          ],
        },
      ],
      handleOpenNotification: mockHandleOpenNotification,
      handleSnooze: mockHandleSnooze,
      markAllRead: mockMarkAll,
      isMarkAllPending: false,
    });

    renderPage();
    fireEvent.click(screen.getByRole('button', { name: /messages/i }));

    expect(mockSetActiveCategory).toHaveBeenCalledWith('messages');
    expect(screen.getByText('Message alert')).toBeInTheDocument();
    expect(screen.queryByText('Order alert')).not.toBeInTheDocument();
  });
});
