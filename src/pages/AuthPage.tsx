import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  BookOpen, 
  Mail, 
  Lock, 
  User, 
  Phone, 
  Eye, 
  EyeOff,
  ArrowRight,
  ArrowLeft,
  Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

type AuthMode = "login" | "signup" | "forgot";

const AuthPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isSignup = location.pathname.includes("signup");
  
  const [mode, setMode] = useState<AuthMode>(isSignup ? "signup" : "login");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    if (mode === "login") {
      toast({
        title: "Welcome back!",
        description: "You have successfully logged in.",
      });
      navigate("/");
    } else if (mode === "signup") {
      toast({
        title: "Account created!",
        description: "Please check your email to verify your account.",
      });
      setMode("login");
    } else {
      toast({
        title: "Reset link sent!",
        description: "Check your email for password reset instructions.",
      });
      setMode("login");
    }

    setIsLoading(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen flex">
      {/* Left - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow">
              <BookOpen className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-heading font-bold text-xl">
              Library<span className="text-gradient">Book</span>
            </span>
          </Link>

          {/* Header */}
          <div className="mb-8">
            <h1 className="font-heading text-3xl font-bold mb-2">
              {mode === "login" && "Welcome back"}
              {mode === "signup" && "Create account"}
              {mode === "forgot" && "Reset password"}
            </h1>
            <p className="text-muted-foreground">
              {mode === "login" && "Enter your credentials to access your account"}
              {mode === "signup" && "Fill in your details to get started"}
              {mode === "forgot" && "Enter your email to receive reset instructions"}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div>
                <label className="text-sm font-medium mb-2 block">Full Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="John Doe"
                    required
                    className="input-premium pl-12"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-sm font-medium mb-2 block">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  required
                  className="input-premium pl-12"
                />
              </div>
            </div>

            {mode === "signup" && (
              <div>
                <label className="text-sm font-medium mb-2 block">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+91 98765 43210"
                    required
                    className="input-premium pl-12"
                  />
                </div>
              </div>
            )}

            {mode !== "forgot" && (
              <div>
                <label className="text-sm font-medium mb-2 block">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    required
                    className="input-premium pl-12 pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            )}

            {mode === "signup" && (
              <div>
                <label className="text-sm font-medium mb-2 block">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="••••••••"
                    required
                    className="input-premium pl-12"
                  />
                </div>
              </div>
            )}

            {mode === "login" && (
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="rounded border-border" />
                  <span className="text-sm text-muted-foreground">Remember me</span>
                </label>
                <button
                  type="button"
                  onClick={() => setMode("forgot")}
                  className="text-sm text-primary hover:underline"
                >
                  Forgot password?
                </button>
              </div>
            )}

            <Button
              type="submit"
              className="w-full btn-primary h-12 text-base"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              ) : (
                <>
                  {mode === "login" && "Sign In"}
                  {mode === "signup" && "Create Account"}
                  {mode === "forgot" && "Send Reset Link"}
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </Button>
          </form>

          {/* Divider */}
          {mode !== "forgot" && (
            <>
              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                </div>
              </div>

              {/* Social Login */}
              <div className="grid grid-cols-2 gap-4">
                <Button variant="outline" className="h-12">
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Google
                </Button>
                <Button variant="outline" className="h-12">
                  <Phone className="w-5 h-5 mr-2" />
                  Phone OTP
                </Button>
              </div>
            </>
          )}

          {/* Switch Mode */}
          <div className="mt-8 text-center">
            {mode === "login" && (
              <p className="text-muted-foreground">
                Don't have an account?{" "}
                <button
                  onClick={() => setMode("signup")}
                  className="text-primary font-semibold hover:underline"
                >
                  Sign up
                </button>
              </p>
            )}
            {mode === "signup" && (
              <p className="text-muted-foreground">
                Already have an account?{" "}
                <button
                  onClick={() => setMode("login")}
                  className="text-primary font-semibold hover:underline"
                >
                  Sign in
                </button>
              </p>
            )}
            {mode === "forgot" && (
              <button
                onClick={() => setMode("login")}
                className="flex items-center gap-2 text-primary font-semibold hover:underline mx-auto"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to login
              </button>
            )}
          </div>
        </motion.div>
      </div>

      {/* Right - Image/Branding */}
      <div className="hidden lg:flex lg:flex-1 relative bg-gradient-primary">
        {/* Decorative Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 180, 360],
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute top-1/4 -left-32 w-64 h-64 bg-white/10 rounded-full blur-3xl"
          />
          <motion.div
            animate={{
              scale: [1, 1.3, 1],
              rotate: [360, 180, 0],
            }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            className="absolute bottom-1/4 -right-32 w-80 h-80 bg-secondary/30 rounded-full blur-3xl"
          />
        </div>

        <div className="relative z-10 flex flex-col items-center justify-center p-12 text-white">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-center max-w-lg"
          >
            <div className="w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center mx-auto mb-8">
              <BookOpen className="w-10 h-10" />
            </div>
            
            <h2 className="font-heading text-3xl font-bold mb-4">
              Your Perfect Study Space Awaits
            </h2>
            <p className="text-white/80 mb-8">
              Join thousands of students who have found their ideal study environment through LibraryBook.
            </p>

            <div className="space-y-4">
              <div className="flex items-center gap-3 bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                <div className="w-10 h-10 rounded-full bg-success flex items-center justify-center flex-shrink-0">
                  <Check className="w-5 h-5" />
                </div>
                <p className="text-left text-sm">500+ verified libraries across 100+ cities</p>
              </div>
              <div className="flex items-center gap-3 bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                <div className="w-10 h-10 rounded-full bg-success flex items-center justify-center flex-shrink-0">
                  <Check className="w-5 h-5" />
                </div>
                <p className="text-left text-sm">Instant seat booking with real-time availability</p>
              </div>
              <div className="flex items-center gap-3 bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                <div className="w-10 h-10 rounded-full bg-success flex items-center justify-center flex-shrink-0">
                  <Check className="w-5 h-5" />
                </div>
                <p className="text-left text-sm">Secure UPI payments with transparent pricing</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
