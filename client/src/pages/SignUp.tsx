import { useState, FormEvent } from 'react';
import { Link, useLocation } from 'wouter';
import { ArrowRight, Eye, EyeOff, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { ApiError } from '../lib/api/client';

export default function SignUp() {
  const { signUp } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const [showPassword, setShowPassword] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('female');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const name = `${firstName.trim()} ${lastName.trim()}`.trim();
    if (!name || !email || !password) {
      setError('Please complete all fields.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setSubmitting(true);
    try {
      const user = await signUp({ name, email, password, gender });
      toast(`Welcome to ReWearX, ${user.name.split(' ')[0]}!`, 'success');
      navigate('/home');
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Sign up failed.';
      setError(message);
      toast(message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 sm:pt-28 md:pt-32 pb-10 sm:pb-12 flex items-center justify-center bg-background">
      <div className="max-w-6xl w-full mx-auto px-4 sm:px-6 md:px-8 grid lg:grid-cols-2 gap-10 lg:gap-20 xl:gap-24 items-center">

        {/* Form Column */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="w-full max-w-md mx-auto lg:mx-0 lg:order-2"
        >
          <div className="mb-7 sm:mb-8 text-center lg:text-left">
            <h1 className="font-headings text-3xl sm:text-4xl lg:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-br from-primary to-primary/70 mb-3 sm:mb-4 leading-tight">
              Join the movement.
            </h1>
            <p className="text-muted-foreground font-medium text-sm sm:text-base">
              Create your account to start swapping premium pieces.
            </p>
          </div>

          <form className="space-y-4 sm:space-y-5" onSubmit={onSubmit} noValidate>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[11px] sm:text-sm font-bold uppercase tracking-wider text-primary/80" htmlFor="firstName">
                  First Name
                </label>
                <input
                  id="firstName"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Jane"
                  autoComplete="given-name"
                  className="w-full px-4 sm:px-5 py-3 sm:py-3.5 bg-muted/20 border border-border/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-300 placeholder:text-muted-foreground/50 text-sm sm:text-base"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] sm:text-sm font-bold uppercase tracking-wider text-primary/80" htmlFor="lastName">
                  Last Name
                </label>
                <input
                  id="lastName"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Doe"
                  autoComplete="family-name"
                  className="w-full px-4 sm:px-5 py-3 sm:py-3.5 bg-muted/20 border border-border/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-300 placeholder:text-muted-foreground/50 text-sm sm:text-base"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] sm:text-sm font-bold uppercase tracking-wider text-primary/80" htmlFor="email">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                className="w-full px-4 sm:px-5 py-3 sm:py-3.5 bg-muted/20 border border-border/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-300 placeholder:text-muted-foreground/50 text-sm sm:text-base"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] sm:text-sm font-bold uppercase tracking-wider text-primary/80" htmlFor="gender">
                Gender
              </label>
              <select
                id="gender"
                value={gender}
                onChange={(e) => setGender(e.target.value as 'male' | 'female' | 'other')}
                className="w-full px-4 sm:px-5 py-3 sm:py-3.5 bg-muted/20 border border-border/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-300 text-sm sm:text-base"
              >
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="other">Other / Prefer not to say</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] sm:text-sm font-bold uppercase tracking-wider text-primary/80" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 8 characters with letters & digits"
                  autoComplete="new-password"
                  className="w-full pl-4 sm:pl-5 pr-12 py-3 sm:py-3.5 bg-muted/20 border border-border/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-300 placeholder:text-muted-foreground/50 text-sm sm:text-base"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-primary/40 hover:text-primary transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="text-xs font-semibold text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full group mt-5 sm:mt-6 bg-primary hover:bg-primary/95 text-white py-3.5 sm:py-4 rounded-xl font-bold uppercase tracking-widest text-xs sm:text-sm transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Creating account…</span>
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 sm:mt-8 text-center text-xs sm:text-sm font-medium text-muted-foreground leading-relaxed px-2">
            By joining, you agree to our <a href="#" className="underline hover:text-primary">Terms of Service</a> and{' '}
            <a href="#" className="underline hover:text-primary">Privacy Policy</a>
          </div>

          <div className="mt-6 sm:mt-8 text-center border-t border-border/60 pt-6 sm:pt-8">
            <p className="text-muted-foreground text-sm font-medium">
              Already have an account?{' '}
              <Link href="/login" className="text-primary font-bold hover:underline underline-offset-4 decoration-accent decoration-2">
                Log in
              </Link>
            </p>
          </div>
        </motion.div>

        {/* Editorial Image */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
          className="hidden lg:block relative h-[650px] w-full rounded-3xl overflow-hidden shadow-2xl lg:order-1"
        >
          <img
            src="https://images.unsplash.com/photo-1512413912196-18967b5e94b0?auto=format&fit=crop&q=80&w=1600"
            alt="Editorial fashion lifestyle"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/30 to-transparent flex flex-col justify-end p-10 xl:p-12">
            <span className="w-12 h-1 bg-accent mb-5 rounded-full inline-block" />
            <h2 className="text-white font-headings text-3xl xl:text-4xl font-bold mb-4 drop-shadow-md leading-tight">
              Refresh your style.<br />Without the waste.
            </h2>
            <ul className="text-white/90 space-y-2 mt-4 font-medium flex flex-col gap-2 text-sm xl:text-base">
              <li className="flex items-center gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                Access thousands of premium pieces
              </li>
              <li className="flex items-center gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                Connect with verified fashion lovers
              </li>
              <li className="flex items-center gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                Contribute to circular sustainability
              </li>
            </ul>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
