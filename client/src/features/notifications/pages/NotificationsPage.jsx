import React from 'react';
import { Link } from 'react-router-dom';
import { Bell, CheckCheck, SlidersHorizontal } from 'lucide-react';
import Header from '../../../components/Header';
import Footer from '../../../components/Footer';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/Tabs';
import { useNotificationsLogic } from '../hooks/useNotificationsLogic';
import { NotificationGroup } from '../components/NotificationGroup';
import { NotificationCategoryFilters } from '../components/NotificationCategoryFilters';
import { NotificationEmptyState } from '../components/NotificationEmptyState';

const NotificationsPage = () => {
  const {
    activeTab,
    setActiveTab,
    activeCategory,
    setActiveCategory,
    isLoading,
    unreadCount,
    totalCount,
    groupedEntries,
    categoryCounts,
    handleOpenNotification,
    handleSnooze,
    markAllRead,
    isMarkAllPending,
  } = useNotificationsLogic();

  const renderContent = (type) => {
    if (isLoading) {
      return (
        <div className="space-y-4">
          {[...Array(6)].map((_, index) => (
            <div key={index} className="h-28 animate-pulse rounded-2xl bg-gray-100" />
          ))}
        </div>
      );
    }

    if (groupedEntries.length > 0) {
      return (
        <div className="space-y-8">
          {groupedEntries.map((group) => (
            <NotificationGroup
              key={group.label}
              title={group.label}
              items={group.items}
              onOpen={handleOpenNotification}
              onSnooze={handleSnooze}
            />
          ))}
        </div>
      );
    }

    return <NotificationEmptyState type={type} category={activeCategory} />;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <Card className="rounded-2xl border-gray-100 shadow-sm overflow-hidden">
          <CardHeader className="flex flex-col gap-5 border-b border-gray-100 pb-6 sm:flex-row sm:items-start sm:justify-between bg-white">
            <div>
              <CardTitle className="flex items-center gap-3 text-3xl font-black">
                <Bell className="h-7 w-7 text-primary-600" />
                Notifications
              </CardTitle>
              <CardDescription className="mt-2 max-w-2xl text-base text-gray-600">
                Stay on top of orders, chats, saved-item changes, reviews, and moderation updates.
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant={unreadCount ? 'default' : 'secondary'} className="px-3 py-1 text-sm font-bold">
                {unreadCount} unread
              </Badge>
              <Button
                variant="outline"
                className="gap-2 shadow-sm"
                onClick={markAllRead}
                disabled={!unreadCount || isMarkAllPending}
              >
                <CheckCheck className="h-4 w-4" />
                Mark All Read
              </Button>
              <Link to="/notifications/preferences">
                <Button variant="outline" className="gap-2 shadow-sm">
                  <SlidersHorizontal className="h-4 w-4" />
                  Preferences
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-6 bg-gray-100 p-1 rounded-xl">
                <TabsTrigger value="all" className="rounded-lg px-6">All</TabsTrigger>
                <TabsTrigger value="unread" className="rounded-lg px-6">Unread</TabsTrigger>
              </TabsList>

              <NotificationCategoryFilters
                activeCategory={activeCategory}
                setActiveCategory={setActiveCategory}
                categoryCounts={categoryCounts}
                totalCount={totalCount}
              />

              <TabsContent value="all" className="mt-0 focus-visible:outline-none">
                {renderContent('all')}
              </TabsContent>

              <TabsContent value="unread" className="mt-0 focus-visible:outline-none">
                {renderContent('unread')}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default NotificationsPage;
