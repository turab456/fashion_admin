import React, { useState, useEffect } from "react";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { api } from "./services/api";
import Sidebar from "./components/Sidebar";
import Dashboard from "./views/Dashboard";
import Products from "./views/Products";
import Orders from "./views/Orders";
import Reviews from "./views/Reviews";
import Masters from "./views/Masters";
import Coupons from "./views/Coupons";
import Marketing from "./views/Marketing";
import CMS from "./views/CMS";
import Customers from "./views/Customers";
import Traffic from "./views/Traffic";
import Button from "./components/ui/Button";
import Input from "./components/ui/Input";
import Card from "./components/ui/Card";

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [adminToken, setAdminToken] = useState(null);
  const [adminUser, setAdminUser] = useState(null);
  const [loadingSession, setLoadingSession] = useState(true);

  // Login form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [submittingLogin, setSubmittingLogin] = useState(false);

  // Sync token from localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    const userJson = localStorage.getItem("admin_user");
    if (token && userJson) {
      setAdminToken(token);
      setAdminUser(JSON.parse(userJson));
    }
    setLoadingSession(false);

    // Global listener for auth errors
    const handleUnauthorized = () => {
      setAdminToken(null);
      setAdminUser(null);
      setLoginError("Session expired. Please sign in again.");
    };

    window.addEventListener("admin-unauthorized", handleUnauthorized);
    return () => {
      window.removeEventListener("admin-unauthorized", handleUnauthorized);
    };
  }, []);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError("");
    setSubmittingLogin(true);

    try {
      const res = await api.auth.login({ email, password });
      
      // Security role check: only allow admins
      const user = res.data?.user || res.data;
      const token = res.data?.accessToken || res.data?.token || res.token;

      if (!token) {
        throw new Error("Invalid response from server: Missing authorization token.");
      }

      if (user.role !== "super_admin" && user.role !== "admin") {
        throw new Error("Access Denied: You do not possess administrator rights.");
      }

      localStorage.setItem("admin_token", token);
      localStorage.setItem("admin_user", JSON.stringify(user));
      setAdminToken(token);
      setAdminUser(user);
      setActiveTab("dashboard");
    } catch (err) {
      console.error("Login failure:", err);
      setLoginError(err.message || "Invalid authentication credentials.");
    } finally {
      setSubmittingLogin(false);
    }
  };

  const handleLogout = async () => {
    try {
      await api.auth.logout();
    } catch (_) {}
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_user");
    setAdminToken(null);
    setAdminUser(null);
  };

  const renderViewContent = () => {
    switch (activeTab) {
      case "dashboard": return <Dashboard />;
      case "products":  return <Products />;
      case "orders":    return <Orders />;
      case "reviews":   return <Reviews />;
      case "masters":   return <Masters />;
      case "coupons":   return <Coupons />;
      case "marketing": return <Marketing />;
      case "cms":       return <CMS />;
      case "customers": return <Customers />;
      case "traffic":   return <Traffic />;
      default:          return <Dashboard />;
    }
  };

  if (loadingSession) {
    return (
      <div style={{ minHeight: "100vh", background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", color: "#6b7280", fontSize: "14px" }}>
        Loading...
      </div>
    );
  }

  // 1. Render Unauthorized Login view
  if (!adminToken) {
    return (
      <div className="min-h-screen bg-page flex items-center justify-center p-6">
        <Card className="w-full max-w-[380px] shadow-lg border-0">
          {/* Header */}
          <div className="mb-7 text-center">
            <div className="w-12 h-12 bg-accent rounded-xl flex items-center justify-center mx-auto mb-3.5 shadow-sm">
              <Lock size={20} color="#fff" />
            </div>
            <h1 className="text-xl font-bold text-text-primary">Admin Login</h1>
            <p className="text-[13px] text-text-secondary mt-1">AURA Fashion Admin Panel</p>
          </div>

          {/* Form */}
          <form onSubmit={handleLoginSubmit} className="flex flex-col gap-4">
            <Input
              label="Email Address"
              type="email"
              icon={Mail}
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@aurafashion.com"
            />

            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? "text" : "password"}
                icon={Lock}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-[34px] text-text-muted hover:text-text-primary transition-colors focus:outline-none"
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>

            {loginError && (
              <p className="text-[13px] text-danger bg-danger-light border border-red-200 rounded-md px-3 py-2.5">
                {loginError}
              </p>
            )}

            <Button
              type="submit"
              disabled={submittingLogin}
              loading={submittingLogin}
              className="w-full mt-1"
            >
              Sign In
            </Button>
          </form>
        </Card>
      </div>
    );
  }

  // 2. Render Authorized Main dashboard view
  return (
    <div className="admin-layout">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        adminUser={adminUser}
        onLogout={handleLogout}
      />

      {/* Main Panel Viewport */}
      <main className="main-content">
        {renderViewContent()}
      </main>
    </div>
  );
}
