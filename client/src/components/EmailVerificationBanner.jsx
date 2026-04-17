import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Mail, X, Loader2 } from 'lucide-react';

const EmailVerificationBanner = () => {
  const { user, resendVerificationEmail } = useAuth();
  const [dismissed, setDismissed] = useState(false);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');

  // Don't show banner if user is not logged in, email is verified, or banner is dismissed
  if (!user || user.emailVerified || dismissed) {
    return null;
  }

  const handleResend = async () => {
    setSending(true);
    setMessage('');
    
    const result = await resendVerificationEmail();
    
    if (result.success) {
      setMessage('Verification email sent! Please check your inbox.');
    } else {
      setMessage(result.message || 'Failed to send email. Please try again.');
    }
    
    setSending(false);
  };

  return (
    <div className="bg-yellow-50 border-b border-yellow-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3 flex-1">
            <Mail className="w-5 h-5 text-yellow-600 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-yellow-800 font-medium">
                Please verify your email address to access all features
              </p>
              {message && (
                <p className={`text-xs mt-1 ${message.includes('sent') ? 'text-green-700' : 'text-red-700'}`}>
                  {message}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleResend}
              disabled={sending}
              className="text-sm text-yellow-800 hover:text-yellow-900 font-medium underline disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            >
              {sending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sending...
                </>
              ) : (
                'Resend Email'
              )}
            </button>
            
            <button
              onClick={() => setDismissed(true)}
              className="text-yellow-600 hover:text-yellow-800 p-1"
              aria-label="Dismiss"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationBanner;
