// frontend/src/auth/LoginForm.tsx - PERFECTLY POSITIONED PREMIUM LOGIN
import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useAuth } from './AuthContext';
import { Eye, EyeOff, Mail, Lock, CheckCircle, AlertCircle, ArrowRight, Award, Shield } from 'lucide-react';
import { Logo } from '../components/common/Logo';

interface LoginFormProps {
  onSuccess?: () => void;
}

export const LoginForm = ({ onSuccess }: LoginFormProps) => {
  // --- Keep your existing authentication logic ---
  const { login, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // --- Enhanced state for premium experience ---
  const [showPassword, setShowPassword] = useState(false);
  const [emailValid, setEmailValid] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [focusedField, setFocusedField] = useState('');
  const [isFormValid, setIsFormValid] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Mount animation
  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Real-time email validation
  useEffect(() => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    setEmailValid(emailRegex.test(email));
  }, [email]);

  // Password strength calculation
  useEffect(() => {
    let strength = 0;
    if (password.length >= 6) strength += 25;
    if (password.match(/[a-z]/) && password.match(/[A-Z]/)) strength += 25;
    if (password.match(/[0-9]/)) strength += 25;
    if (password.match(/[^a-zA-Z0-9]/)) strength += 25;
    setPasswordStrength(strength);
  }, [password]);

  // Form validation
  useEffect(() => {
    setIsFormValid(emailValid && password.length >= 6);
  }, [emailValid, password]);

  const getPasswordStrengthColor = () => {
    if (passwordStrength < 50) return '#ef4444';
    if (passwordStrength < 75) return '#f59e0b';
    return '#10b981';
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength < 25) return 'Very Weak';
    if (passwordStrength < 50) return 'Weak';
    if (passwordStrength < 75) return 'Good';
    if (passwordStrength < 100) return 'Strong';
    return 'Very Strong';
  };

  // --- Keep your existing submit handler ---
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await login(email, password);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Sophisticated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
        {/* Layered Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-indigo-600/20"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(147,197,253,0.1),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(139,92,246,0.1),transparent_50%)]"></div>
        
        {/* Refined Floating Elements */}
        <div className="absolute top-20 left-1/4 w-32 h-32 bg-blue-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }}></div>
        <div className="absolute top-1/3 right-1/4 w-24 h-24 bg-purple-400/10 rounded-full blur-2xl animate-pulse" style={{ animationDuration: '6s', animationDelay: '2s' }}></div>
        <div className="absolute bottom-1/3 left-1/5 w-28 h-28 bg-indigo-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '5s', animationDelay: '1s' }}></div>
      </div>

      {/* Perfectly Positioned Container */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-6">
        <div className={`w-full max-w-[350px] mx-auto transform transition-all duration-700 ease-out ${
          mounted ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-3 opacity-0 scale-95'
        }`}>
          
          {/* Compact Premium Login Card */}
          <div className="relative bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl border border-white/10 overflow-hidden w-full">
            {/* Multi-layer Shadow System */}
            <div className="absolute inset-0 bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl -z-10 transform translate-y-1 scale-[0.99] opacity-60"></div>
            <div className="absolute inset-0 bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg -z-20 transform translate-y-2 scale-[0.98] opacity-30"></div>
            
            {/* Compact Header Section */}
            <div className="relative px-6 pt-6 pb-2 w-full">
              {/* Subtle Top Accent */}
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-60"></div>
              
              <div className="text-center">
                {/* Company Logo */}
                <div className="mb-4 transform hover:scale-105 transition-transform duration-300">
                  <Logo size="large" className="drop-shadow-lg" />
                </div>
                
                {/* Compact Typography */}
                <h1 className="text-2xl font-bold mb-2 tracking-tight">
                  <span className="bg-gradient-to-r from-slate-800 via-blue-700 to-indigo-700 bg-clip-text text-transparent">
                    &lt;File&gt;
                  </span>
                </h1>
                
                <p className="text-slate-600 text-sm font-medium mb-2">
                  by Fifo - Fully Integrated, Fully Online
                </p>
                
                <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
                  <Shield className="w-3 h-3" />
                  <span>Award-Winning Technology</span>
                </div>
              </div>
            </div>

            {/* Compact Form Section */}
            <div className="px-6 py-5 w-full">
              <form onSubmit={handleSubmit} className="space-y-4 w-full">
                
                {/* Compact Email Field */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    Email Address
                  </label>
                  <div className="relative group">
                    <Mail className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 transition-all duration-200 ${
                      focusedField === 'email' 
                        ? 'text-blue-500' 
                        : 'text-slate-400 group-hover:text-slate-500'
                    }`} />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onFocus={() => setFocusedField('email')}
                      onBlur={() => setFocusedField('')}
                      className={`w-full pl-10 pr-10 py-2.5 border-2 rounded-lg transition-all duration-200 outline-none text-slate-800 font-medium text-sm placeholder:text-slate-400 ${
                        focusedField === 'email' 
                          ? 'border-blue-500 bg-blue-50/50 shadow-sm shadow-blue-500/10' 
                          : email && emailValid
                            ? 'border-emerald-400 bg-emerald-50/30'
                            : email && !emailValid
                              ? 'border-red-400 bg-red-50/30'
                              : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                      }`}
                      placeholder="your.email@company.com"
                      required
                    />
                    {email && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        {emailValid ? (
                          <CheckCircle className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-red-500" />
                        )}
                      </div>
                    )}
                  </div>
                  {email && !emailValid && (
                    <div className="flex items-center gap-1.5 text-red-600 text-xs font-medium mt-1.5">
                      <AlertCircle className="w-3 h-3" />
                      Please enter a valid email address
                    </div>
                  )}
                </div>

                {/* Compact Password Field */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    Password
                  </label>
                  <div className="relative group">
                    <Lock className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 transition-all duration-200 ${
                      focusedField === 'password' 
                        ? 'text-blue-500' 
                        : 'text-slate-400 group-hover:text-slate-500'
                    }`} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onFocus={() => setFocusedField('password')}
                      onBlur={() => setFocusedField('')}
                      className={`w-full pl-10 pr-10 py-2.5 border-2 rounded-lg transition-all duration-200 outline-none text-slate-800 font-medium text-sm placeholder:text-slate-400 ${
                        focusedField === 'password'
                          ? 'border-blue-500 bg-blue-50/50 shadow-sm shadow-blue-500/10'
                          : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                      }`}
                      placeholder="Enter your password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors duration-200"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  
                  {/* Compact Password Strength */}
                  {password && (
                    <div className="space-y-1.5 mt-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-600 font-medium">Strength</span>
                        <span 
                          className="font-semibold text-xs px-1.5 py-0.5 rounded"
                          style={{ 
                            color: getPasswordStrengthColor(),
                            backgroundColor: getPasswordStrengthColor() + '15'
                          }}
                        >
                          {getPasswordStrengthText()}
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-1 overflow-hidden">
                        <div 
                          className="h-1 rounded-full transition-all duration-300 ease-out"
                          style={{ 
                            width: `${passwordStrength}%`,
                            backgroundColor: getPasswordStrengthColor()
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Compact Error Display */}
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="font-semibold text-xs">Authentication Failed</p>
                        <p className="text-xs mt-0.5">{error}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Compact Submit Button */}
                <button
                  type="submit"
                  disabled={!isFormValid || loading}
                  className={`w-full py-2.5 px-4 rounded-lg font-semibold text-white text-sm transition-all duration-200 transform relative overflow-hidden ${
                    !isFormValid || loading
                      ? 'bg-slate-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 hover:shadow-lg hover:shadow-blue-500/25 active:scale-[0.98]'
                  }`}
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Authenticating...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <span>Access Dashboard</span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  )}
                </button>
              </form>
            </div>

            {/* Subtle Bottom Accent */}
            <div className="h-0.5 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-60"></div>
          </div>

          {/* Compact Bottom Tagline */}
          <div className="text-center mt-4">
            <p className="text-white/70 text-xs font-medium">
              Transforming workplace communication with dignity
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
