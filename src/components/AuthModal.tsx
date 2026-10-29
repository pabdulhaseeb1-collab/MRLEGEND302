import React, { useState } from 'react';
import {
  X,
  Eye,
  EyeOff,
  User,
  Hash,
  AtSign,
  Mail,
  Lock,
  Camera,
  LogIn,
  UserPlus,
  AlertCircle,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { api, setStoredToken } from '../utils/api';
import { sound } from '../utils/audio';
import { validateNumericId, validateUsername, validateEmail, validatePassword } from '../utils/rules';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'login' | 'register';
  onSuccess: (user: any, usage: any) => void;
  onOpenForgotPassword: () => void;
  initialIdentifier?: string;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  defaultMode = 'login',
  onSuccess,
  onOpenForgotPassword,
  initialIdentifier = '',
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(defaultMode);

  React.useEffect(() => {
    if (isOpen) {
      setMode(defaultMode);
      setErrorMsg(null);
      setSuccessMsg(null);
    }
  }, [defaultMode, isOpen]);

  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState(initialIdentifier);
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Register form state (All 7 required fields)
  const [firstName, setFirstName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80'
  );
  const [numericId, setNumericId] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);

  // Status & Feedback
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file (PNG, JPG, WEBP).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('Profile picture size must not exceed 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAvatarUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const data = await api.login({
        identifier: loginIdentifier.trim(),
        password: loginPassword,
      });

      setStoredToken(data.token);
      sound.playSuccessSound();
      setSuccessMsg('Welcome to MR LEGEND 302!');
      setTimeout(() => {
        onSuccess(data.user, data.usage);
        onClose();
      }, 500);
    } catch (err: any) {
      // Prompt requirements:
      // "If user enters incorrect username or ID, display: 'User ID or username not found.' Play short error voice/sound."
      // "If username exists but password incorrect, display: 'Incorrect password. Please try again.' Play different error sound."
      if (err.code === 'USER_NOT_FOUND') {
        setErrorMsg('User ID or username not found.');
        sound.playUserNotFoundError();
      } else if (err.code === 'INVALID_PASSWORD') {
        setErrorMsg('Incorrect password. Please try again.');
        sound.playIncorrectPasswordError();
      } else {
        setErrorMsg(err.message || 'Login failed.');
        sound.playUserNotFoundError();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Front validations
    if (!firstName.trim()) {
      setErrorMsg('First name is required.');
      return;
    }

    const numCheck = validateNumericId(numericId);
    if (!numCheck.valid) {
      setErrorMsg(numCheck.error!);
      return;
    }

    const userCheck = validateUsername(username);
    if (!userCheck.valid) {
      setErrorMsg(userCheck.error!);
      return;
    }

    const emailCheck = validateEmail(email);
    if (!emailCheck.valid) {
      setErrorMsg(emailCheck.error!);
      return;
    }

    const passCheck = validatePassword(registerPassword);
    if (!passCheck.valid) {
      setErrorMsg(passCheck.error!);
      return;
    }

    if (registerPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const data = await api.register({
        firstName: firstName.trim(),
        avatarUrl,
        numericId: numericId.trim(),
        username: username.trim(),
        email: email.trim(),
        password: registerPassword,
        confirmPassword,
      });

      setStoredToken(data.token);
      sound.playSuccessSound();
      setSuccessMsg('Registration successful! Welcome to MR LEGEND 302.');
      setTimeout(() => {
        onSuccess(data.user, data.usage);
        onClose();
      }, 700);
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed.');
      sound.playUserNotFoundError();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-lg bg-[#0f0521] border border-purple-500/30 rounded-3xl p-6 sm:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.8)] my-8">
        {/* Close Button */}
        <button
          onClick={() => {
            sound.playButtonClick();
            onClose();
          }}
          className="absolute top-5 right-5 p-2 rounded-xl text-purple-400 hover:text-white bg-purple-950/40 hover:bg-purple-900/50 transition cursor-pointer"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Tabs */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-950/80 border border-purple-500/30 text-amber-300 text-xs font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            MR LEGEND 302
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-['Cinzel'] tracking-wide">
            {mode === 'login' ? 'Account Login' : 'Create Account'}
          </h2>
          <p className="text-xs text-purple-300/70 mt-1">
            {mode === 'login'
              ? 'Enter your unique numeric ID or username to access your dashboard'
              : 'Join the luxury communication network. Choose your custom numeric ID'}
          </p>

          {/* Toggle buttons */}
          <div className="flex bg-[#070210] p-1 rounded-2xl border border-purple-800/40 mt-4">
            <button
              onClick={() => {
                sound.playButtonClick();
                setMode('login');
                setErrorMsg(null);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
                mode === 'login'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow'
                  : 'text-purple-400/80 hover:text-white'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Login</span>
            </button>
            <button
              onClick={() => {
                sound.playButtonClick();
                setMode('register');
                setErrorMsg(null);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
                mode === 'register'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow'
                  : 'text-purple-400/80 hover:text-white'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Register</span>
            </button>
          </div>
        </div>

        {/* Error / Success Banners */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-950/60 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2 animate-shake">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* LOGIN FORM */}
        {mode === 'login' ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-purple-300 mb-1">
                Numeric User ID or Username
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-purple-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  placeholder="e.g. 302 or legend302"
                  className="w-full bg-[#0a0314] border border-purple-800/60 rounded-2xl pl-10 pr-4 py-3 text-sm text-white placeholder-purple-400/40 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/30"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-purple-300 mb-1">
                Password
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-purple-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showLoginPassword ? 'text' : 'password'}
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full bg-[#0a0314] border border-purple-800/60 rounded-2xl pl-10 pr-10 py-3 text-sm text-white placeholder-purple-400/40 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/30"
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-purple-400 hover:text-white"
                  aria-label="Toggle password visibility"
                >
                  {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-purple-400/60">Protected by AES encryption</span>
              <button
                type="button"
                onClick={() => {
                  sound.playButtonClick();
                  onOpenForgotPassword();
                }}
                className="text-amber-300/90 hover:text-amber-200 font-semibold underline cursor-pointer"
              >
                Forgot Password?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-amber-500 hover:opacity-95 text-white font-extrabold text-sm shadow-[0_0_25px_rgba(168,85,247,0.4)] transition cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Sign In to MR LEGEND 302'}
            </button>
          </form>
        ) : (
          /* REGISTRATION FORM (All 7 required fields) */
          <form onSubmit={handleRegister} className="space-y-3.5 max-h-[60vh] overflow-y-auto pr-1">
            {/* Field 1 & 2: First Name & Profile Picture */}
            <div className="flex items-center gap-4 p-3 rounded-2xl bg-purple-950/30 border border-purple-900/40">
              <div className="relative">
                <img
                  src={avatarUrl}
                  alt="Avatar Preview"
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-amber-400/60 shadow"
                />
                <label className="absolute -bottom-1 -right-1 p-1.5 rounded-xl bg-purple-600 text-white cursor-pointer hover:bg-purple-500 shadow">
                  <Camera className="w-3.5 h-3.5" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                </label>
              </div>
              <div className="flex-1">
                <label className="block text-xs font-bold text-purple-300 mb-1">
                  1. First Name *
                </label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="e.g. Zayn"
                  className="w-full bg-[#0a0314] border border-purple-800/60 rounded-xl px-3 py-2 text-xs text-white placeholder-purple-400/40 focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            {/* Field 3: Numeric User ID */}
            <div>
              <label className="block text-xs font-bold text-purple-300 mb-1">
                3. Unique Numeric User ID * (Numbers only, e.g. 777302)
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-400">
                  <Hash className="w-3.5 h-3.5" />
                </div>
                <input
                  type="text"
                  required
                  pattern="\d*"
                  value={numericId}
                  onChange={(e) => setNumericId(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter unique numbers only (3-12 digits)"
                  className="w-full bg-[#0a0314] border border-purple-800/60 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-purple-400/40 focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            {/* Field 4: Username */}
            <div>
              <label className="block text-xs font-bold text-purple-300 mb-1">
                4. Unique Username *
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-400">
                  <AtSign className="w-3.5 h-3.5" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. zayn_legend"
                  className="w-full bg-[#0a0314] border border-purple-800/60 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-purple-400/40 focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            {/* Field 5: Email Address */}
            <div>
              <label className="block text-xs font-bold text-purple-300 mb-1">
                5. Email Address * (Required)
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-400">
                  <Mail className="w-3.5 h-3.5" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. zayn@example.com"
                  className="w-full bg-[#0a0314] border border-purple-800/60 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-purple-400/40 focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            {/* Field 6: Password */}
            <div>
              <label className="block text-xs font-bold text-purple-300 mb-1">
                6. Password * (Min. 6 characters)
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-400">
                  <Lock className="w-3.5 h-3.5" />
                </div>
                <input
                  type={showRegisterPassword ? 'text' : 'password'}
                  required
                  value={registerPassword}
                  onChange={(e) => setRegisterPassword(e.target.value)}
                  placeholder="Create secure password"
                  className="w-full bg-[#0a0314] border border-purple-800/60 rounded-xl pl-9 pr-9 py-2 text-xs text-white placeholder-purple-400/40 focus:outline-none focus:border-amber-400"
                />
                <button
                  type="button"
                  onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-400 hover:text-white"
                  aria-label="Toggle password visibility"
                >
                  {showRegisterPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Field 7: Confirm Password */}
            <div>
              <label className="block text-xs font-bold text-purple-300 mb-1">
                7. Confirm Password *
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-400">
                  <Lock className="w-3.5 h-3.5" />
                </div>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm password"
                  className="w-full bg-[#0a0314] border border-purple-800/60 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-purple-400/40 focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-amber-500 hover:opacity-95 text-white font-extrabold text-sm shadow-[0_0_25px_rgba(168,85,247,0.4)] transition cursor-pointer disabled:opacity-50 mt-2"
            >
              {loading ? 'Creating Luxury Account...' : 'Complete Registration'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
