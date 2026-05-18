import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  User, 
  Bell, 
  Shield, 
  Trash2, 
  HelpCircle, 
  FileText, 
  ChevronRight,
  Smartphone,
  ShieldAlert,
  Lock
} from 'lucide-react';
import { useAuth } from '../../../../context/AuthContext';
import Header from '../../../../components/Header';
import Footer from '../../../../components/Footer';


const SettingsPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('account');

  const navItems = [
    { id: 'account', label: 'Account & Security', icon: User },
    { id: 'privacy', label: 'Privacy & Notifications', icon: Shield },
    { id: 'support', label: 'Support & Legal', icon: HelpCircle },
  ];

  const SettingRow = ({ icon: Icon, title, subtitle, to, onClick, danger }) => {
    const Component = to ? Link : 'button';
    return (
      <Component
        to={to}
        onClick={onClick}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors group border-b border-gray-100 last:border-0"
      >
        <div className="flex items-center gap-4">
          <div className={`p-2 rounded-xl ${danger ? 'bg-red-50 text-red-500' : 'bg-indigo-50 text-indigo-600'}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="text-left">
            <p className={`font-semibold text-sm ${danger ? 'text-red-600' : 'text-gray-900'}`}>{title}</p>
            {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-400 transition-transform group-hover:translate-x-0.5" />
      </Component>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'account':
        return (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <h2 className="hidden md:block text-lg font-bold text-gray-900 mb-4 px-1">Account & Security</h2>
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
              <SettingRow 
                icon={Lock} 
                title="Change Password" 
                subtitle="Update your account password"
                to="/forgot-password" 
              />
              <SettingRow 
                icon={Smartphone} 
                title="Active Devices" 
                subtitle="Manage your signed-in sessions"
                to="/settings/devices" 
              />

              <SettingRow 
                icon={Trash2} 
                title="Delete Account" 
                subtitle="Permanently remove your account and data"
                to="/settings/delete-account"
                danger
              />
            </div>
          </div>
        );
      case 'privacy':
        return (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <h2 className="hidden md:block text-lg font-bold text-gray-900 mb-4 px-1">Privacy & Notifications</h2>
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
              <SettingRow 
                icon={Bell} 
                title="Notification Preferences" 
                subtitle="Control what alerts you receive"
                to="/notifications/preferences" 
              />
              <SettingRow 
                icon={ShieldAlert} 
                title="Blocked Users" 
                subtitle="Manage users you've blocked"
                to="/settings/blocked-users" 
              />
            </div>
          </div>
        );
      case 'support':
        return (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <h2 className="hidden md:block text-lg font-bold text-gray-900 mb-4 px-1">Support & Legal</h2>
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
              <SettingRow 
                icon={HelpCircle} 
                title="Help Center" 
                subtitle="FAQs and support contact"
                to="/help" 
              />
              <SettingRow 
                icon={FileText} 
                title="Terms of Service" 
                to="/terms" 
              />
              <SettingRow 
                icon={FileText} 
                title="Privacy Policy" 
                to="/privacy" 
              />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <Header />

    <div className="min-h-screen bg-gray-50/50 py-6 md:py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="pb-6 border-b border-gray-200 mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-black text-gray-900">Settings</h1>
          <p className="text-gray-500 mt-1 md:mt-2 font-medium text-sm md:text-base">Manage your account preferences and security.</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 md:gap-8">
          {/* Sidebar */}
          <div className="w-full lg:w-1/3 flex flex-col gap-6">
            <div className="bg-white rounded-2xl lg:rounded-3xl border border-gray-100 shadow-sm p-2 flex overflow-x-auto lg:flex-col gap-2 hide-scrollbar">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl lg:rounded-2xl transition-all duration-200 whitespace-nowrap shrink-0 ${
                    activeTab === item.id 
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' 
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-semibold text-sm">{item.label}</span>
                </button>
              ))}
            </div>

            {/* Profile Brief */}
            <div className="hidden lg:block mt-6 bg-indigo-600 rounded-3xl p-6 text-white shadow-xl shadow-indigo-100 relative overflow-hidden group">
              <div className="relative z-10">
                <p className="text-indigo-100 text-xs font-bold uppercase tracking-wider mb-1">Signed in as</p>
                <p className="text-lg font-bold truncate">{user?.name}</p>
                <p className="text-indigo-200 text-sm truncate">{user?.email}</p>
                <Link 
                  to="/profile" 
                  className="mt-4 inline-flex items-center gap-2 text-sm font-bold bg-white/20 hover:bg-white/30 px-4 py-2 rounded-xl transition-colors backdrop-blur-md"
                >
                  View Profile <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all duration-500" />
            </div>
          </div>

          {/* Content Area */}
          <div className="w-full lg:w-2/3">
            {renderContent()}

            {/* Profile Brief - Mobile (Bottom) */}
            <div className="lg:hidden mt-8 bg-indigo-600 rounded-2xl p-5 text-white shadow-xl shadow-indigo-100 relative overflow-hidden">
              <div className="relative z-10 flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-indigo-100 text-[10px] font-bold uppercase tracking-wider mb-0.5">Signed in as</p>
                  <p className="text-base font-bold truncate">{user?.name}</p>
                  <p className="text-indigo-200 text-xs truncate">{user?.email}</p>
                </div>
                <Link 
                  to="/profile" 
                  className="shrink-0 inline-flex items-center justify-center bg-white/20 hover:bg-white/30 p-3 rounded-xl transition-colors backdrop-blur-md"
                >
                  <ChevronRight className="w-5 h-5 text-white" />
                </Link>
              </div>
              <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
            </div>
          </div>
        </div>
      </div>
    </div>
    <Footer />
  </>
);



};

export default SettingsPage;
