// src/pages/LoginPage.jsx
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axiosClient";
import { FaSignInAlt, FaSpinner } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";
console.log("VITE_GOOGLE_CLIENT_ID =", import.meta.env.VITE_GOOGLE_CLIENT_ID);

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Load Google Identity Services script
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) {
      console.warn(
        "VITE_GOOGLE_CLIENT_ID is not set. Google login will be disabled."
      );
      return;
    }

    const existingScript = document.querySelector(
      'script[src="https://accounts.google.com/gsi/client"]'
    );
    if (existingScript) return;

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await api.post("/api/auth/login", { email, password });
      const { token, user } = res.data || {};

      if (!token || !user) {
        toast.error("Login succeeded but server sent no token/user");
        return;
      }

      login({ token, user });

      toast.success("Login successful!", { autoClose: 1500 });

      setTimeout(() => {
        if (user.role === "admin") navigate("/admin");
        else navigate("/");
      }, 1500);
    } catch (err) {
      const backendMsg = err?.response?.data?.message;
      toast.error(backendMsg || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (!GOOGLE_CLIENT_ID) {
      toast.error("Google login is not configured.");
      return;
    }

    if (!window.google || !window.google.accounts || !window.google.accounts.id) {
      toast.error("Google services not loaded yet. Please try again.");
      return;
    }

    setGoogleLoading(true);

    try {
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async (response) => {
          const idToken = response.credential;
          if (!idToken) {
            toast.error("Google login failed: no credential received.");
            setGoogleLoading(false);
            return;
          }

          try {
            const res = await api.post("/api/auth/google", { idToken });
            const { token, user } = res.data || {};

            if (!token || !user) {
              toast.error("Google login succeeded but no token/user returned.");
              setGoogleLoading(false);
              return;
            }

            login({ token, user });

            toast.success("Logged in with Google!", { autoClose: 1500 });

            setTimeout(() => {
              if (user.role === "admin") navigate("/admin");
              else navigate("/");
            }, 1500);
          } catch (err) {
            const backendMsg = err?.response?.data?.message;
            toast.error(backendMsg || "Google login failed. Please try again.");
          } finally {
            setGoogleLoading(false);
          }
        },
      });

      // Show Google One Tap or account chooser
      window.google.accounts.id.prompt((notification) => {
        const notDisplayed = notification.isNotDisplayed?.();
        const skipped = notification.isSkippedMoment?.();
        if (notDisplayed || skipped) {
          // User closed / blocked / not shown
          setGoogleLoading(false);
        }
      });
    } catch (err) {
      console.error("Error during Google login:", err);
      toast.error("Google login failed. Please try again.");
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <ToastContainer />

      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 space-y-6 border border-gray-200">
        <div className="text-center">
          <FaSignInAlt className="w-8 h-8 mx-auto mb-2 text-blue-600" />
          <h1 className="text-3xl font-extrabold text-gray-900">Sign In</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6" autoComplete="off">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email address
            </label>
            <input
              type="email"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow duration-200"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Enter your email"
              autoComplete="email"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow duration-200"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter your password"
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="cursor-pointer w-full bg-blue-600 text-white py-2.5 rounded-lg font-semibold shadow-md hover:bg-blue-700 active:scale-[0.98] transition duration-150 flex items-center justify-center space-x-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <FaSpinner className="animate-spin w-4 h-4" />
                <span>Logging in...</span>
              </>
            ) : (
              <span>Login</span>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-gray-200" />
          <span className="text-xs text-gray-400">OR</span>
          <div className="h-px flex-1 bg-gray-200" />
        </div>

        {/* Google Login Button */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={googleLoading || loading}
          className="cursor-pointer w-full border border-gray-300 bg-white text-gray-800 py-2.5 rounded-lg font-semibold shadow-sm hover:bg-gray-50 active:scale-[0.98] transition duration-150 flex items-center justify-center space-x-2 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {googleLoading ? (
            <>
              <FaSpinner className="animate-spin w-4 h-4" />
              <span>Connecting to Google...</span>
            </>
          ) : (
            <>
              <FcGoogle className="w-5 h-5" />
              <span>Continue with Google</span>
            </>
          )}
        </button>

        <div className="flex justify-between text-xs pt-2">
          <Link
            to="/register"
            className="text-blue-600 font-medium hover:underline cursor-pointer transition-colors duration-150"
          >
            Register
          </Link>

          <Link
            to="/forgot-password"
            className="text-blue-600 font-medium hover:underline cursor-pointer transition-colors duration-150"
          >
            Forgot password?
          </Link>
        </div>
      </div>
    </div>
  );
}