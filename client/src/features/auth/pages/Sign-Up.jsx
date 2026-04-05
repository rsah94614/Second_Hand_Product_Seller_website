import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User, Phone, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../../context/AuthContext';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';

const SignUpPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    location: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formData.name.trim()) {
      toast.error('Full name is required');
      return;
    }

    if (!emailRegex.test(formData.email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    if (formData.password.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsLoading(true);

    const userData = { ...formData };
    delete userData.confirmPassword;
    const result = await register(userData);

    if (result.success) {
      toast.success('Registration successful!');
      navigate('/');
    } else {
      toast.error(result.message);
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f7f4ec_0%,#f8fafc_24%,#f8fafc_100%)] flex items-center justify-center py-8 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-[1100px] min-h-[700px] overflow-hidden rounded-[2.5rem] bg-white shadow-[0_20px_80px_-20px_rgba(15,23,42,0.15)] flex flex-col lg:flex-row-reverse animate-fade-in border border-stone-100/50">

        {/* Right Form Section */}
        <div className="w-full lg:w-1/2 p-10 sm:p-14 lg:px-16 lg:py-12 flex flex-col justify-center bg-white relative z-10">
          <div className='flex flex-col items-center'>
            <div className="inline-flex mb-10 items-center group">
              <div className="text-2xl w-26 h-12 bg-linear-to-br from-primary-600 to-indigo-600 rounded-lg flex items-center justify-center text-white font-black shadow-md shadow-primary-600/20 group-hover:scale-105 transition-transform duration-300">Campus</div>
              <div className="text-2xl font-display font-black bg-clip-text text-transparent bg-linear-to-r from-gray-900 to-gray-600 tracking-tight ml-0.5">Mitra</div>
            </div>
            <h2 className="text-3xl font-black text-gray-900 tracking-tight">
              Create your account
            </h2>
            <p className="mt-3 text-sm text-gray-600">
              Or{' '}
              <Link
                to="/login"
                className="font-semibold text-primary-600 hover:text-primary-500 transition-colors"
              >
                sign in to your existing account
              </Link>
            </p>
          </div>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="pl-10 pr-10 bg-white border-gray-800 placeholder:text-gray-600"
                    placeholder="Enter your full name"
                  />
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-600 w-5 h-5" />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email address
                </label>
                <div className="relative">
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="pl-10 pr-10 bg-white border-gray-800 placeholder:text-gray-600"
                    placeholder="Enter your email"
                  />
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-600 w-5 h-5" />
                </div>
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number (Optional)
                </label>
                <div className="relative">
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    className="pl-10 pr-10 bg-white border-gray-800 placeholder:text-gray-600"
                    placeholder="Enter your phone number"
                  />
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-600 w-5 h-5" />
                </div>
              </div>

              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                  Location (Optional)
                </label>
                <div className="relative">
                  <Input
                    id="location"
                    name="location"
                    type="text"
                    value={formData.location}
                    onChange={handleChange}
                    className="pl-10 pr-10 bg-white border-gray-800 placeholder:text-gray-600"
                    placeholder="Enter your city/location"
                  />
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-600 w-5 h-5" />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="pl-10 pr-10 bg-white border-gray-800 placeholder:text-gray-600"
                    placeholder="Create a password"
                  />
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-600 w-5 h-5" />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5 text-gray-600" /> : <Eye className="w-5 h-5 text-gray-600" />}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="pl-10 pr-10 bg-white border-gray-800 placeholder:text-gray-600"
                    placeholder="Confirm your password"
                  />
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-600 w-5 h-5" />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-600 hover:text-gray-600 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5 text-gray-600" /> : <Eye className="w-5 h-5 text-gray-600" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <Button type="submit" disabled={isLoading} className="w-full h-12 text-base font-semibold shadow-md hover:shadow-lg transition-all rounded-xl">
                {isLoading ? 'Creating account...' : 'Create account'}
              </Button>
            </div>
          </form>
        </div>

        {/* Left Graphic Section (reversed) */}
        <div className="hidden lg:flex w-1/2 p-16 flex-col justify-between relative overflow-hidden group">
          <div className="absolute inset-0 bg-slate-900 z-0" />
          <div className="absolute inset-0 bg-linear-to-br from-indigo-900 via-primary-900 to-cyan-950 z-0 opacity-90" />

          <div className="absolute top-10 right-[-10%] w-[120%] h-[120%] rounded-full bg-[radial-gradient(ellipse_at_center,var(--tw-gradient-stops))] from-indigo-500/30 via-transparent to-transparent blur-3xl group-hover:scale-105 transition-transform duration-[3s] ease-out z-0" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[80%] h-[80%] rounded-full bg-[radial-gradient(ellipse_at_center,var(--tw-gradient-stops))] from-cyan-400/20 via-transparent to-transparent blur-3xl group-hover:-translate-y-4 transition-transform duration-[3s] ease-out z-0" />
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjIuNSIgZmlsbD0iI2ZmZmZmZiIgZmlsbC1vcGFjaXR5PSIwLjA1Ii8+PC9zdmc+')] opacity-60 mix-blend-overlay z-0" />

          <div className="relative z-10">
          </div>

          <div className="relative z-10 text-white space-y-10 max-w-lg">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-sm font-medium mb-2 transform group-hover:-translate-x-1 transition-transform duration-500">
                <span className="flex h-2 w-2 rounded-full bg-indigo-400 animate-pulse shadow-[0_0_8px_rgba(129,140,248,0.8)]"></span>
                Join the Community
              </div>
              <h3 className="text-[3rem] font-black leading-[1.1] tracking-tight">Make your<br />first trade today.</h3>
              <p className="text-lg text-primary-100/80 leading-relaxed font-medium">The safest and fastest way to trade with your peers on campus.</p>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4">
              {[
                { icon: '🌱', title: 'Eco Friendly', desc: 'Recycle & reuse items' },
                { icon: '📚', title: 'Study Better', desc: 'Get books from seniors' },
                { icon: '📦', title: 'Easy Listing', desc: 'Sell in under 60 sec' },
                { icon: '🛡️', title: 'Secure', desc: 'Verified students only' },
                { icon: '💬', title: 'Connect', desc: 'In-app chat system' },
                { icon: '⚡', title: 'Instant', desc: 'Right here on campus' },
              ].map((item, i) => (
                <div key={i} className="flex flex-col gap-2 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all group/item hover:scale-[1.02]">
                  <div className="text-2xl">{item.icon}</div>
                  <div>
                    <h4 className="font-bold text-sm tracking-tight">{item.title}</h4>
                    <p className="text-[11px] text-white/40 leading-tight">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-8 border-t border-white/10">
              <div className="flex items-center gap-4">
                <div className="flex -space-x-3">
                  {[1, 2, 3, 4].map((n) => (
                    <div key={n} className="w-10 h-10 rounded-full border-2 border-slate-900 bg-slate-800 flex items-center justify-center text-[10px] font-bold">
                      {['👤', '🧑', '👩', '👨'][n - 1]}
                    </div>
                  ))}
                  <div className="w-10 h-10 rounded-full border-2 border-slate-900 bg-primary-600 flex items-center justify-center text-[10px] font-bold">
                    +2k
                  </div>
                </div>
                <p className="text-sm font-medium text-white/60">
                  <span className="text-white font-bold">Hundreds</span> of student are already trading!
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default SignUpPage;
