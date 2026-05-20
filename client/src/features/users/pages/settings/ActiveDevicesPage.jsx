import React from 'react';
import { Smartphone, Trash2, ArrowLeft, ShieldCheck, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { getMyDevices, removeDevice, trustDevice } from '../../api/userApi';
import Header from '../../../../components/Header';
import Footer from '../../../../components/Footer';
import { Button } from '../../../../components/ui/Button';


const ActiveDevicesPage = () => {
  const queryClient = useQueryClient();

  const { data: devicesData, isLoading } = useQuery({
    queryKey: ['my-devices'],
    queryFn: getMyDevices,
  });

  const removeDeviceMutation = useMutation({
    mutationFn: removeDevice,
    onSuccess: () => {
      toast.success('Device removed');
      queryClient.invalidateQueries({ queryKey: ['my-devices'] });
    },
    onError: () => {
      toast.error('Failed to remove device');
    },
  });

  const trustDeviceMutation = useMutation({
    mutationFn: trustDevice,
    onSuccess: () => {
      toast.success('Device marked as trusted');
      queryClient.invalidateQueries({ queryKey: ['my-devices'] });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50/50">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <Header />
      <div className="min-h-screen bg-gray-50/50 py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <Link to="/settings" className="inline-flex items-center gap-2 text-gray-500 mb-6 hover:gap-3 transition-all">
            <ArrowLeft className="w-4 h-4" /> Back to Settings
          </Link>

          <div className="bg-white rounded-4xl border border-gray-100 shadow-xl p-8">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 bg-blue-50 rounded-2xl">
                <Smartphone className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-gray-900">Active Devices</h1>
                <p className="text-gray-500 font-medium text-sm">Devices currently logged into your account</p>
              </div>
            </div>

            <div className="space-y-4">
              {devicesData?.devices?.map((device) => (
                <div key={device._id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gray-50 border border-gray-100 group hover:border-blue-100 hover:bg-white transition-all duration-300">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-2xl ${device.isTrusted ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                      <Smartphone className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-lg">{device.deviceName}</p>
                      <p className="text-sm text-gray-500 font-medium">{device.browser} · {device.os}</p>
                      <p className="text-xs text-gray-400 font-mono mt-1">{device.lastIpAddress}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 w-full sm:w-auto mt-2 sm:mt-0">
                    {device.isTrusted ? (
                      <span className="text-sm text-emerald-600 font-bold px-4 py-2 bg-emerald-50 rounded-xl">Trusted</span>
                    ) : (
                      <Button variant="outline" onClick={() => trustDeviceMutation.mutate(device._id)} className="flex-1 sm:flex-none font-bold rounded-xl text-primary-600 border-primary-200 hover:bg-primary-50">
                        Trust
                      </Button>
                    )}
                    <Button 
                      variant="outline" 
                      onClick={() => removeDeviceMutation.mutate(device._id)} 
                      className="flex-1 sm:flex-none text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 hover:text-red-700 font-bold rounded-xl gap-2"
                      disabled={removeDeviceMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4" /> Remove
                    </Button>
                  </div>
                </div>
              ))}
              
              {(!devicesData?.devices || devicesData.devices.length === 0) && (
                <div className="text-center py-12 bg-gray-50/50 rounded-3xl border-2 border-dashed border-gray-100">
                  <Smartphone className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                  <p className="text-gray-900 font-bold text-lg">No active devices</p>
                  <p className="text-gray-500 text-sm mt-1">You are not logged in anywhere else.</p>
                </div>
              )}
            </div>

            <div className="mt-8 rounded-3xl bg-blue-50/50 p-6 border border-blue-50 flex gap-4 items-start">
              <ShieldCheck className="w-6 h-6 text-blue-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-blue-900">Security Tip</p>
                <p className="text-sm text-blue-700/80 mt-1 leading-relaxed">
                  Session logs are audited daily. Always sign out from shared or public devices. 
                  If you see a device you don't recognize, remove it immediately and consider changing your password.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ActiveDevicesPage;
