import { useState } from "react";
import { useNavigate } from "react-router";
import { LogIn, User, Lock } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    // Simple admin authentication
    // Default credentials: admin / admin123
    if (username === "admin" && password === "admin123") {
      // Store auth token
      localStorage.setItem("admin_auth", "true");
      localStorage.setItem("admin_user", JSON.stringify({
        name: "Admin",
        email: "admin@abimod.com",
        role: "admin",
        avatar: null,
      }));
      navigate("/admin/dashboard");
    } else {
      setError("Invalid username or password");
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E6F7F8] via-white to-[#FDE8F2] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <img
            src="/images/logo.jpg"
            alt="ABI MOD"
            className="w-16 h-16 rounded-full mx-auto mb-4 shadow-lg"
          />
          <h1 className="text-2xl font-bold text-[#0EA5B5]">ABI MOD</h1>
          <p className="text-sm text-gray-500 mt-1">Admin Login</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-3xl shadow-xl p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  className="w-full h-12 pl-11 pr-4 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-[#0EA5B5] focus:border-transparent outline-none"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="admin123"
                  className="w-full h-12 pl-11 pr-4 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-[#0EA5B5] focus:border-transparent outline-none"
                  required
                />
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="text-sm text-red-500 bg-red-50 rounded-lg p-3 text-center">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-gray-900 text-white font-semibold rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  Sign In
                </>
              )}
            </button>
          </form>

          {/* Default credentials hint */}
          <div className="mt-4 text-center text-xs text-gray-400">
            <p>Default: admin / admin123</p>
          </div>
        </div>

        {/* Back to store */}
        <div className="text-center mt-6">
          <a
            href="/"
            className="text-sm text-[#0EA5B5] hover:text-[#0A7A86] font-medium"
          >
            Back to Store
          </a>
        </div>
      </div>
    </div>
  );
}
