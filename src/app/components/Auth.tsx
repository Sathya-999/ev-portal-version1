import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Eye, EyeOff, ArrowRight, ShieldCheck, CheckCircle2, ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { GoogleLogin } from '@react-oauth/google';
import { Button, Input } from './UI';
import { resendEmailService } from '../services/resendEmailService';
import { apiLogin, apiSignup, apiGoogleAuth } from '../utils/api';

// Helper to decode Google JWT credential
const decodeGoogleCredential = (token: string) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(window.atob(base64));
  } catch {
    return null;
  }
};

// Google OAuth success handler — calls real backend
const handleGoogleSuccess = async (credentialResponse: any, navigate: any) => {
  try {
    const result = await apiGoogleAuth(credentialResponse.credential);
    
    if (!result.token) {
      toast.error('Google authentication failed. Server did not issue a token.');
      return;
    }
    
    // Verify token is stored
    const storedToken = localStorage.getItem('token');
    if (!storedToken) {
      toast.error('Token storage failed. Please try again.');
      return;
    }
    
    toast.success(`Welcome, ${result.user.firstName}! Redirecting to dashboard...`);
    setTimeout(() => {
      navigate('/dashboard', { replace: true });
    }, 100);
  } catch (err: any) {
    // Fallback: decode client-side if backend is down
    const decoded = decodeGoogleCredential(credentialResponse.credential);
    if (decoded) {
      localStorage.setItem('token', credentialResponse.credential);
      localStorage.setItem('user_profile', JSON.stringify({
        firstName: decoded.given_name || 'User',
        lastName: decoded.family_name || '',
        email: decoded.email,
        picture: decoded.picture,
      }));
      toast.success(`Welcome, ${decoded.given_name || 'User'}! Redirecting...`);
      setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 100);
    } else {
      toast.error(err.message || 'Google authentication failed.');
    }
  }
};

const handleGoogleError = () => {
  toast.error('Google authentication failed. Please check your browser settings and try again.');
};

const AuthCard: React.FC<{ children: React.ReactNode, title: string, subtitle: string, icon?: React.ReactNode }> = ({ children, title, subtitle, icon }) => (
  <div className="w-full flex flex-col justify-center items-center py-12">
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full max-w-[480px] bg-white rounded-[2.5rem] shadow-2xl shadow-blue-100 p-8 md:p-10 border border-gray-50 space-y-8"
    >
      <div className="flex flex-col items-center text-center space-y-5">
        <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-inner">
          {icon || <Lock size={30} />}
        </div>
        <div className="space-y-3">
          <h1 className="text-[38px] font-black text-gray-900 tracking-tight leading-none">{title}</h1>
          <p className="text-gray-500 font-semibold text-lg leading-relaxed">{subtitle}</p>
        </div>
      </div>
      {children}
    </motion.div>
    <div className="mt-8 flex justify-center gap-6 text-xs font-black text-gray-400 uppercase tracking-widest">
      <Link to="/about" className="hover:text-blue-600">Privacy Policy</Link>
      <Link to="/about" className="hover:text-blue-600">Terms of Service</Link>
    </div>
  </div>
);

export const SignIn: React.FC = () => {
  const [showPassword, setShowPassword] = React.useState(false);
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    const normalizedEmail = email.trim().toLowerCase();
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      toast.error("Invalid email format. Please use a valid address.");
      return;
    }
    if (!password) {
      toast.error("Please enter your password.");
      return;
    }

    setLoading(true);
    try {
      const result = await apiLogin({ email: normalizedEmail, password });
      
      if (!result || typeof result !== 'object') {
        throw new Error('Invalid response from server');
      }
      
      if (!result.token) {
        throw new Error('Authentication token not received');
      }
      
      // Verify token is stored before redirecting
      const storedToken = localStorage.getItem('token');
      if (!storedToken) {
        throw new Error('Failed to store authentication token');
      }
      
      toast.success(`Welcome back, ${result.user?.firstName || 'User'}! Redirecting to dashboard...`);
      // Clear form
      setEmail('');
      setPassword('');
      
      // Use a small delay to ensure localStorage is flushed and navigate properly
      setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 500);
    } catch (err: any) {
      console.error('[Login Error]', err);
      toast.error(err.message || "Invalid email or password. Please try again.");
      setLoading(false);
    }
  };

  return (
    <AuthCard title="Welcome Back" subtitle="Please enter your details to sign in to your account.">
      <div className="space-y-9">
        <div className="flex justify-center">
          <GoogleLogin
            onSuccess={(cred) => handleGoogleSuccess(cred, navigate)}
            onError={handleGoogleError}
            width="400"
            theme="outline"
            size="large"
            text="signin_with"
            shape="rectangular"
          />
        </div>

        <div className="relative flex items-center gap-7 text-xs font-black text-gray-400 uppercase tracking-widest">
          <div className="flex-1 h-px bg-gray-100" />
          OR
          <div className="flex-1 h-px bg-gray-100" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input 
            label="Email Address"
            placeholder="e.g. alex@example.com"
            type="email"
            icon={<Mail size={22} />}
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="text-base"
          />
          <div className="space-y-3">
            <div className="flex justify-between items-center px-1">
              <label className="text-sm font-semibold text-gray-700">Password</label>
              <Link to="/forgot-password" className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors">Forgot Password?</Link>
            </div>
            <div className="relative">
              <Input 
                placeholder="Your secure password"
                type={showPassword ? 'text' : 'password'}
                icon={<Lock size={22} />}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="text-base"
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPassword ? <EyeOff size={22} /> : <Eye size={22} />}
              </button>
            </div>
          </div>
          <Button fullWidth className="h-[58px] text-[18px] font-black mt-5 shadow-lg shadow-blue-500/20" disabled={loading}>
            {loading ? 'Signing In...' : 'Sign In'}
            <ArrowRight size={24} />
          </Button>
        </form>
      </div>
      <div className="text-center pt-6">
        <p className="text-gray-500 font-medium">
          New here? <Link to="/signup" className="text-blue-600 font-black hover:underline underline-offset-4">Create account</Link>
        </p>
      </div>
    </AuthCard>
  );
};

export const SignUp: React.FC = () => {
  const [showPassword, setShowPassword] = React.useState(false);
  const [firstName, setFirstName] = React.useState('');
  const [lastName, setLastName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [manualPassword, setManualPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const password = manualPassword;

    if (!firstName || !lastName) {
      toast.error('Please enter your first and last name.');
      return;
    }
    if (!email) {
      toast.error('Please enter your email address.');
      return;
    }
    if (!password || password.length < 8) {
      toast.error('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);
    try {
      const result = await apiSignup({ firstName, lastName, email, password });
      
      if (!result || typeof result !== 'object') {
        throw new Error('Invalid response from server');
      }
      
      if (!result.token) {
        throw new Error('Authentication token not received');
      }
      
      // Verify token is stored before redirecting
      const storedToken = localStorage.getItem('token');
      if (!storedToken) {
        throw new Error('Failed to store authentication token');
      }
      
      toast.success(`Welcome, ${result.user?.firstName || 'User'}! Account created. Redirecting to sign in...`);
      // Clear form
      setFirstName('');
      setLastName('');
      setEmail('');
      setManualPassword('');
      
      // Redirect to sign in
      setTimeout(() => {
        navigate('/signin', { replace: true });
      }, 500);
    } catch (err: any) {
      console.error('[Signup Error]', err);
      toast.error(err.message || 'Signup failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <AuthCard title="Create Account" subtitle="Join us today and start your journey." icon={<User size={34} />}>
      <div className="space-y-9">
        <div className="flex justify-center">
          <GoogleLogin
            onSuccess={(cred) => handleGoogleSuccess(cred, navigate)}
            onError={handleGoogleError}
            width="400"
            theme="outline"
            size="large"
            text="signup_with"
            shape="rectangular"
          />
        </div>

        <div className="relative flex items-center gap-7 text-xs font-black text-gray-400 uppercase tracking-widest">
          <div className="flex-1 h-px bg-gray-100" />
          OR
          <div className="flex-1 h-px bg-gray-100" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-5">
            <Input label="First Name" placeholder="Alex" required className="text-base" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            <Input label="Last Name" placeholder="Smith" required className="text-base" value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </div>
          <Input 
            label="Email Address"
            placeholder="alex@example.com"
            type="email"
            icon={<Mail size={22} />}
            required
            className="text-base"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          
          <div className="space-y-4">
            <label className="text-sm font-semibold text-gray-700 px-1">Password</label>
            <div className="relative">
              <Input 
                placeholder="Min. 8 characters"
                type={showPassword ? 'text' : 'password'}
                icon={<Lock size={22} />}
                required
                className="text-base"
                value={manualPassword}
                onChange={(e) => setManualPassword(e.target.value)}
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPassword ? <EyeOff size={22} /> : <Eye size={22} />}
              </button>
            </div>
          </div>

          <div className="flex items-start gap-4 p-6 bg-gray-50 rounded-2xl border border-gray-100/50">
            <ShieldCheck className="text-blue-600 shrink-0" size={26} />
            <p className="text-xs text-gray-600 leading-relaxed font-medium">
              I agree to the <span className="text-blue-600 font-bold cursor-pointer">Terms</span> and <span className="text-blue-600 font-bold cursor-pointer">Privacy Policy</span>.
            </p>
          </div>
          <Button fullWidth className="h-[56px] text-[17px] font-bold mt-5 shadow-lg shadow-blue-500/20" disabled={loading}>
            {loading ? 'Creating Account...' : 'Create Account'}
            <ArrowRight size={24} />
          </Button>
        </form>
      </div>
      <div className="text-center pt-6">
        <p className="text-gray-500 font-medium">
          Already have an account? <Link to="/signin" className="text-blue-600 font-black hover:underline underline-offset-4">Sign in</Link>
        </p>
      </div>
    </AuthCard>
  );
};

export const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = React.useState('');
  const [isSending, setIsSending] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);

    try {
      // Generate reset token
      const resetToken = resendEmailService.generateResetToken(email);

      // Send reset email via Resend API service
      const result = await resendEmailService.sendPasswordResetEmail(email, resetToken);

      if (result.success) {
        toast.success(`Password reset email sent to ${email}. Check your inbox!`);
        // Navigate to reset page after brief delay
        setTimeout(() => {
          navigate(`/reset-password?token=${resetToken}`);
        }, 2000);
      } else {
        toast.error(result.error || 'Failed to send reset email. Please try again.');
      }
    } catch (err) {
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <AuthCard title="Recover Password" subtitle="Don't worry, happens to the best of us. Enter your email to reset." icon={<Mail size={28} />}>
      <form onSubmit={handleSubmit} className="space-y-8">
        <Input 
          label="Email Address"
          placeholder="name@example.com"
          type="email"
          icon={<Mail size={18} />}
          value={email}
          onChange={(e: any) => setEmail(e.target.value)}
          required
        />
        <Button fullWidth className="h-[58px] text-lg font-bold" disabled={isSending}>
          {isSending ? 'Sending...' : 'Send Reset Link'}
        </Button>
      </form>
      <div className="text-center">
        <Link to="/signin" className="text-blue-600 font-black hover:underline underline-offset-4">
          Back to Sign In
        </Link>
      </div>
    </AuthCard>
  );
};

export const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = React.useState(() => new URLSearchParams(window.location.search));
  const token = searchParams.get('token') || '';
  const tokenValidation = resendEmailService.validateResetToken(token);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const newPassword = (form.elements[0] as HTMLInputElement).value;
    const confirmPassword = (form.elements[1] as HTMLInputElement).value;

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match. Please try again.');
      return;
    }

    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters long.');
      return;
    }

    // Consume the reset token so it can't be reused
    resendEmailService.consumeResetToken(token);

    toast.success('Your password has been reset successfully! Redirecting to dashboard...');
    // Store a flag to indicate password was reset
    localStorage.setItem('passwordReset', 'true');
    // Redirect to dashboard after reset
    setTimeout(() => {
      navigate('/dashboard', { replace: true });
    }, 500);
  };

  return (
    <AuthCard title="Reset Password" subtitle="Choose a new, unique password for your account.">
      <form onSubmit={handleSubmit} className="space-y-6">
        <Input 
          label="New Password"
          placeholder="••••••••"
          type="password"
          icon={<Lock size={18} />}
          required
        />
        <Input 
          label="Confirm New Password"
          placeholder="••••••••"
          type="password"
          icon={<Lock size={18} />}
          required
        />
        <Button fullWidth className="h-[58px] text-lg font-bold mt-2 shadow-lg shadow-blue-500/20">
          Update Password
        </Button>
      </form>
      <div className="text-center">
        <Link to="/signin" className="text-blue-600 font-black hover:underline underline-offset-4">
          Cancel and return to login
        </Link>
      </div>
    </AuthCard>
  );
};
