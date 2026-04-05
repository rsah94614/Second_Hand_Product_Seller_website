import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../../context/AuthContext';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const { forgotPassword } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    const result = await forgotPassword(email);
    setIsLoading(false);

    if (result.success) {
      toast.success(result.message);
      setIsSent(true);
    } else {
      toast.error(result.message);
    }
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f7f4ec_0%,#f8fafc_24%,#f8fafc_100%)] flex items-center justify-center py-8 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md overflow-hidden rounded-4xl bg-white shadow-[0_20px_60px_rgba(15,23,42,0.08)] flex flex-col p-8 sm:p-12 animate-fade-in border border-stone-100">
        
        {!isSent ? (
          <>
            <div>
              <Link to="/login" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors mb-8">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Login
              </Link>
              <h2 className="text-3xl font-black text-gray-900 tracking-tight">
                Reset Password
              </h2>
              <p className="mt-3 text-sm text-gray-600 leading-relaxed">
                Enter the email address associated with your account and we'll send you a link to reset your password.
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
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-11 h-12 bg-gray-50 border-gray-200"
                      placeholder="Enter your email"
                    />
                    <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <Button type="submit" disabled={isLoading} variant="primary" className="w-full h-12 text-base font-semibold shadow-md hover:shadow-lg transition-all rounded-xl">
                  {isLoading ? 'Sending...' : 'Send Reset Link'}
                </Button>
              </div>
            </form>
          </>
        ) : (
          <div className="text-center py-6">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 mb-6">
              <Mail className="h-8 w-8 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">Check your email</h2>
            <p className="mt-3 text-sm text-gray-600 leading-relaxed">
              We've sent a password reset link to <span className="font-semibold text-gray-900">{email}</span>.
            </p>
            <p className="mt-6 text-sm text-gray-500">
              <span className="opacity-75">Didn't receive the email?</span>{' '}
              <button 
                onClick={() => setIsSent(false)} 
                className="font-medium text-primary-600 hover:text-primary-500"
              >
                Click to try again
              </button>
            </p>
            <div className="mt-8">
              <Link to="/login">
                <Button variant="outline" className="w-full h-12 rounded-xl">Return to Login</Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
