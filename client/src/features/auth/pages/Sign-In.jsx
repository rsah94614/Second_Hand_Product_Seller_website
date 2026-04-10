import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../../context/AuthContext';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';

const SignInPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const from = '/';

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    if (!formData.password) {
      toast.error('Password is required');
      return;
    }

    setIsLoading(true);

    const result = await login(formData.email, formData.password);

    if (result.success) {
      toast.success('Login successful!');
      navigate(from, { replace: true });
    } else {
      toast.error(result.message);
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f7f4ec_0%,#f8fafc_24%,#f8fafc_100%)] flex items-center justify-center py-8 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-[1100px] min-h-[600px] lg:min-h-[640px] overflow-hidden rounded-[2rem] sm:rounded-[2.5rem] bg-white shadow-[0_20px_80px_-20px_rgba(15,23,42,0.15)] flex flex-col lg:flex-row-reverse animate-fade-in border border-stone-100/50">

        {/* Right Form Section */}
        <div className="w-full lg:w-1/2 p-6 sm:p-14 lg:p-16 flex flex-col justify-center bg-white relative z-10">
          <div className='flex flex-col items-center text-center pt-10'>
            <div className="inline-flex mb-8 sm:mb-10 items-center group">
              <div className="text-2xl w-24 h-12 sm:w-26 bg-linear-to-br from-primary-600 to-indigo-600 rounded-lg flex items-center justify-center text-white font-black shadow-md shadow-primary-600/20 group-hover:scale-105 transition-transform duration-300">Campus</div>
              <div className="text-2xl font-display font-black bg-clip-text text-transparent bg-linear-to-r from-gray-900 to-gray-600 tracking-tight ml-0.5">Mitra</div>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight text-center">
              Sign in to your account
            </h2>
            <p className="mt-3 text-sm text-gray-600">
              Or{' '}
              <Link
                to="/register"
                className="font-semibold text-primary-600 hover:text-primary-500 transition-colors"
              >
                create a new account
              </Link>
            </p>
          </div>

          <form className="mt-10 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1.5">
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
                    className="pl-11 pr-11 h-12 bg-white border-gray-800 placeholder:text-gray-600"
                    placeholder="Enter your email"
                  />
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-600 w-5 h-5" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="password" className="block text-sm font-semibold text-gray-700">
                    Password
                  </label>
                  <Link to="/forgot-password" className="text-sm font-semibold text-primary-600 hover:text-primary-500 transition-colors">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="pl-11 pr-11 h-12 bg-white border-gray-800 placeholder:text-gray-600"
                    placeholder="Enter your password"
                  />
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-600 w-5 h-5" />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-600 hover:text-gray-600 transition-colors focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <Button type="submit" disabled={isLoading} variant="primary" className="w-full h-12 text-base font-semibold shadow-md hover:shadow-lg transition-all rounded-xl">
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>
            </div>
          </form>
        </div>

        {/* Left Graphic Section */}
        <div className="hidden lg:flex w-1/2 p-16 flex-col justify-between items-center relative overflow-hidden group">
          <div className="absolute inset-0 bg-slate-900 z-0" />
          <div className="absolute inset-0 bg-linear-to-br from-primary-900 via-indigo-900 to-blue-950 z-0 opacity-90" />

          {/* Animated meshes */}
          <div className="absolute top-[-20%] left-[-20%] w-[140%] h-[140%] rounded-full bg-[radial-gradient(ellipse_at_center,var(--tw-gradient-stops))] from-primary-600/30 via-transparent to-transparent blur-3xl group-hover:scale-105 transition-transform duration-[3s] ease-out z-0" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[80%] h-[80%] rounded-full bg-[radial-gradient(ellipse_at_center,var(--tw-gradient-stops))] from-cyan-400/20 via-transparent to-transparent blur-3xl group-hover:-translate-y-4 transition-transform duration-[3s] ease-out z-0" />

          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjIuNSIgZmlsbD0iI2ZmZmZmZiIgZmlsbC1vcGFjaXR5PSIwLjA1Ii8+PC9zdmc+')] opacity-60 mix-blend-overlay z-0" />

          <div className="relative z-10">
          </div>

          <div className="relative z-10 text-white space-y-8 max-w-md">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-sm font-medium mb-2 transform group-hover:translate-x-1 transition-transform duration-500">
                <span className="flex h-2 w-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.8)]"></span>
                Premier Campus Marketplace
              </div>
              <h3 className="text-[2.75rem] font-black leading-[1.1] tracking-tight">Welcome back to<br />CampusMitra.</h3>
              <p className="text-lg text-primary-100/80 leading-relaxed font-medium">The most beautifully designed place to buy, sell, and discover amazing deals right within your college campus.</p>
            </div>

            <div className="grid grid-cols-1 gap-4 pt-4 border-t border-white/10">
              {[
                { icon: '🛡️', title: 'Verified Students', desc: 'Safe & trusted community' },
                { icon: '💬', title: 'Secure Chat', desc: 'Real-time communication' },
                { icon: '💸', title: 'Zero Fees', desc: 'Keep 100% of your sales' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-4 p-3 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors group/item">
                  <div className="text-2xl">{item.icon}</div>
                  <div>
                    <h4 className="font-bold text-sm">{item.title}</h4>
                    <p className="text-xs text-white/50">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default SignInPage;
