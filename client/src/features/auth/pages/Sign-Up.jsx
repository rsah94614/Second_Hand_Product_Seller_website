import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User, MapPin, GraduationCap, Building2, CheckCircle2 } from 'lucide-react';
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
    location: '',
    otp: '',
    profileRole: 'student',
  });
  const [campusData, setCampusData] = useState({
    collegeName: '',
    department: '',
    year: '',
    hostel: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [timer, setTimer] = useState(0);
  const [errors, setErrors] = useState({});

  const { register, sendSignupOtp } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleCampusChange = (e) => {
    const { name, value } = e.target;
    setCampusData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for campus fields if needed (though we mostly validate core fields)
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSendOtp = async () => {
    if (!formData.email) {
      setErrors((prev) => ({ ...prev, email: 'Email is required to send code' }));
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setErrors((prev) => ({ ...prev, email: 'Please enter a valid email address' }));
      return;
    }

    setIsSendingOtp(true);
    setErrors((prev) => ({ ...prev, email: '' }));
    const result = await sendSignupOtp(formData.email);
    setIsSendingOtp(false);

    if (result.success) {
      setIsOtpSent(true);
      setTimer(60);
      toast.success('Verification code sent to your email!');

      // Development Fallback: Log OTP to console for easy testing
      if (import.meta.env.MODE !== 'production' && result.code) {
        console.log(`[DEBUG] Signup OTP: ${result.code}`);
      }
    } else {
      toast.error(result.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    const newErrors = {};

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formData.name.trim()) newErrors.name = 'Full name is required';
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!isOtpSent) {
      newErrors.otp = 'Please verify your email first';
    } else if (!formData.otp || formData.otp.length !== 6) {
      newErrors.otp = 'Please enter a valid 6-digit verification code';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      if (newErrors.otp) toast.error(newErrors.otp);
      return;
    }

    setIsLoading(true);

    const userData = { ...formData };
    delete userData.confirmPassword;
    // Attach campus data if any field is filled
    const hasCampus = Object.values(campusData).some((v) => v.trim());
    if (hasCampus) userData.campus = campusData;

    const result = await register(userData);

    if (result.success) {
      toast.success('Registration successful!');
      navigate('/');
    } else {
      setErrors({ server: result.message });
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f7f4ec_0%,#f8fafc_24%,#f8fafc_100%)] flex items-center justify-center py-8 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-[1100px] min-h-[700px] overflow-hidden rounded-4xl sm:rounded-[2.5rem] bg-white shadow-[0_20px_80px_-20px_rgba(15,23,42,0.15)] flex flex-col lg:flex-row-reverse animate-fade-in border border-stone-100/50">

        {/* Right Form Section */}
        <div className="w-full lg:w-1/2 p-6 sm:p-14 lg:px-16 lg:py-12 flex flex-col justify-center bg-white relative z-10">
          <div className='flex flex-col items-center text-center'>
            <div className="inline-flex mb-8 sm:mb-10 items-center group">
              <div className="text-2xl w-24 h-12 sm:w-26 bg-linear-to-br from-primary-600 to-indigo-600 rounded-lg flex items-center justify-center text-white font-black shadow-md shadow-primary-600/20 group-hover:scale-105 transition-transform duration-300">Campus</div>
              <div className="text-2xl font-display font-black bg-clip-text text-transparent bg-linear-to-r from-gray-900 to-gray-600 tracking-tight ml-0.5">Mitra</div>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight text-center">
              Create your account
            </h2>
            <p className="mt-3 text-sm text-gray-600">
              Or{' '}
              <Link to="/login" className="font-semibold text-primary-600 hover:text-primary-500 transition-colors">
                sign in to your existing account
              </Link>
            </p>
          </div>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            {errors.server && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm font-medium animate-shake">
                {errors.server}
              </div>
            )}
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
                    value={formData.name}
                    onChange={handleChange}
                    className={`pl-10 pr-10 bg-white placeholder:text-gray-600 ${errors.name ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-800'
                      }`}
                    placeholder="Enter your full name"
                  />
                  <User className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${errors.name ? 'text-red-500' : 'text-gray-600'}`} />
                </div>
                {errors.name && <p className="mt-1 text-[11px] font-bold text-red-600 animate-fade-in">{errors.name}</p>}
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email address
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      value={formData.email}
                      onChange={handleChange}
                      disabled={isOtpSent && timer > 0}
                      className={`pl-10 pr-10 bg-white placeholder:text-gray-600 ${errors.email ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-800'
                        }`}
                      placeholder="Enter your email"
                    />
                    <Mail className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${errors.email ? 'text-red-500' : 'text-gray-600'}`} />
                  </div>
                  <Button type="button" onClick={handleSendOtp} disabled={isSendingOtp || timer > 0} className="h-11 px-6 text-xs font-bold bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-all shadow-sm shadow-primary-600/20 whitespace-nowrap">
                    {timer > 0 ? `Resend in ${timer}s` : isOtpSent ? 'Resend' : 'Send Code'}
                  </Button>
                </div>
                {errors.email && <p className="mt-1 text-[11px] font-bold text-red-600 animate-fade-in">{errors.email}</p>}

                {isOtpSent && (
                  <div className="mt-3 animate-fade-in space-y-2">
                    <div className="relative">
                      <Input id="otp" name="otp" type="text" maxLength={6} value={formData.otp} onChange={handleChange}
                        className={`pl-10 pr-10 bg-white font-mono tracking-[0.5em] text-center text-lg ${errors.otp ? 'border-red-500' : 'border-primary-600 ring-1 ring-primary-100'}`}
                        placeholder="000000" />
                      <CheckCircle2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-600" />
                    </div>
                    <p className="text-[10px] text-primary-600 font-medium flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-primary-600" />
                      Check your inbox for the 6-digit verification code
                    </p>
                    {errors.otp && <p className="text-[10px] font-bold text-red-600">{errors.otp}</p>}
                  </div>
                )}
              </div>

              {/* Password Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <div className="relative">
                    <Input id="password" name="password" type={showPassword ? 'text' : 'password'} value={formData.password} onChange={handleChange}
                      className="pl-10 pr-10 bg-white border-gray-800" placeholder="Password" />
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                  <div className="relative">
                    <Input id="confirmPassword" name="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} value={formData.confirmPassword} onChange={handleChange}
                      className={`pl-10 pr-10 bg-white border-gray-800 ${errors.confirmPassword ? 'border-red-500 ring-1 ring-red-500' : ''}`} placeholder="Confirm Password" />
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="mt-1 text-[11px] font-bold text-red-600 animate-fade-in">{errors.confirmPassword}</p>}
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
                    placeholder="Enter your address (if day scholar) or hostel"
                  />
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-600 w-5 h-5" />
                </div>
              </div>

              {/* Campus Role Selection */}
              <div className="pt-2">
                <label className="block text-sm font-medium text-gray-700 mb-3">I am a...</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: 'student', label: 'Student', icon: GraduationCap },
                    { id: 'faculty', label: 'Faculty', icon: User },
                    { id: 'staff', label: 'Staff Member', icon: Building2 },
                  ].map((role) => (
                    <button
                      key={role.id}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, profileRole: role.id }))}
                      className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all border ${formData.profileRole === role.id
                          ? 'bg-primary-600 border-primary-600 text-white shadow-md shadow-primary-600/20'
                          : 'bg-white border-gray-200 text-gray-600 hover:border-primary-400 hover:text-primary-600'
                        }`}
                    >
                      <role.icon className="w-3 h-3" />
                      {role.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Campus Details */}
              <div className="pt-3 border-t border-gray-100">
                <div className="flex items-center gap-2 mb-3">
                  <Building2 className="w-4 h-4 text-primary-600" />
                  <span className="text-xs font-bold uppercase tracking-widest text-gray-700">Campus Details (Optional)</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className={formData.profileRole === 'student' ? 'col-span-1' : 'col-span-2'}>
                    <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1">
                      Department
                    </label>
                    <Input
                      id="department"
                      name="department"
                      type="text"
                      value={campusData.department}
                      onChange={handleCampusChange}
                      className="bg-white border-gray-800 placeholder:text-gray-600 text-sm"
                      placeholder="Enter Department"
                    />
                  </div>

                  {formData.profileRole === 'student' && (
                    <div className="animate-fade-in">
                      <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-1">
                        Current Year
                      </label>
                      <select
                        id="year"
                        name="year"
                        value={campusData.year}
                        onChange={handleCampusChange}
                        className="w-full h-11 rounded-lg border border-gray-800 bg-white px-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="">Select Year</option>
                        <option value="1st">1st Year</option>
                        <option value="2nd">2nd Year</option>
                        <option value="3rd">3rd Year</option>
                        <option value="4th">4th Year</option>
                        <option value="5th">5th Year</option>
                        <option value="Alumni">Alumni</option>
                      </select>
                    </div>
                  )}

                  {formData.profileRole === 'student' && (
                    <div className="col-span-2 animate-fade-in">
                      <label htmlFor="hostel" className="block text-sm font-medium text-gray-700 mb-1">
                        Hostel Name
                      </label>
                      <Input
                        id="hostel"
                        name="hostel"
                        type="text"
                        value={campusData.hostel}
                        onChange={handleCampusChange}
                        className="bg-white border-gray-800 placeholder:text-gray-600 text-sm"
                        placeholder="Hostel name (if applicable)"
                      />
                    </div>
                  )}
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
        <div className="hidden lg:flex w-1/2 p-16 flex-col justify-center items-center relative overflow-hidden group">
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
                { icon: '🛡️', title: 'Secure', desc: 'Email-verified campus trading' },
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
