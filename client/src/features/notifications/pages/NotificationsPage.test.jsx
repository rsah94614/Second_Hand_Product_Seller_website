import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';
import NotificationsPage from './NotificationsPage';

const mockNavigate = vi.fn();
const mockMarkOne = vi.fn();
const mockMarkAll = vi.fn();

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

const { useMutation, useQuery, useQueryClient } = await import('@tanstack/react-query');

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
    useQuery.mockReturnValue({
      data: {
        unreadCount: 2,
        notifications: [
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
      isLoading: false,
    });

    renderPage();

    expect(screen.getByText('Notifications')).toBeInTheDocument();
    expect(screen.getByText('2 unread')).toBeInTheDocument();
    expect(screen.getByText('Today')).toBeInTheDocument();
    expect(screen.getByText('New message')).toBeInTheDocument();
    expect(screen.getByText('Order update')).toBeInTheDocument();
  });

  it('shows the empty state when no notifications are available', () => {
    useQuery.mockReturnValue({
      data: {
        unreadCount: 0,
        notifications: [],
      },
      isLoading: false,
    });

    renderPage();

    expect(screen.getByText('No notifications yet')).toBeInTheDocument();
  });

  it('filters the visible notifications by category', () => {
    useQuery.mockReturnValue({
      data: {
        unreadCount: 1,
        notifications: [
          {
            _id: 'n1',
            type: 'new_message',
            title: 'Message alert',
            message: 'A new message arrived.',
            isRead: false,
            createdAt: '2026-04-04T09:00:00.000Z',
            link: '/chat',
          },
          {
            _id: 'n2',
            type: 'order_status_updated',
            title: 'Order alert',
            message: 'Your order shipped.',
            isRead: true,
            createdAt: '2026-04-04T08:00:00.000Z',
            link: '/orders',
          },
        ],
      },
      isLoading: false,
    });

    renderPage();
    fireEvent.click(screen.getByRole('button', { name: /messages/i }));

    expect(screen.getByText('Message alert')).toBeInTheDocument();
    expect(screen.queryByText('Order alert')).not.toBeInTheDocument();
  });
});
