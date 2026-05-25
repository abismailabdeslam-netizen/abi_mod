import { useState, useEffect } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Grid3X3,
  Settings,
  Truck,
  Menu,
  X,
  LogOut,
  Layers,
  Bell,
  Star,
  Tag,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import trpc from "@/lib/trpc";

const navItems = [
  { to: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/admin/products", icon: Package, label: "Products" },
  { to: "/admin/bundles", icon: Layers, label: "Bundles" },
  { to: "/admin/orders", icon: ShoppingCart, label: "Orders" },
  { to: "/admin/reviews", icon: Star, label: "Reviews" },
  { to: "/admin/categories", icon: Grid3X3, label: "Categories" },
  { to: "/admin/shipping", icon: Truck, label: "Shipping" },
  { to: "/admin/discounts", icon: Tag, label: "Discounts" },
  { to: "/admin/settings", icon: Settings, label: "Settings" },
];

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const auth = useAuth();

  // Poll for notifications
  const { data: notificationsData, refetch: refetchNotifications } =
    trpc.notification.list.useQuery(undefined, {
      refetchInterval: 30000, // Every 30 seconds
    });

  const utils = trpc.useUtils();

  const markAsRead = trpc.notification.markAsRead.useMutation({
    onSuccess: () => {
      utils.notification.list.invalidate();
    },
  });

  const markAllRead = trpc.notification.markAllRead.useMutation({
    onSuccess: () => {
      utils.notification.list.invalidate();
    },
  });

  useEffect(() => {
    setShowNotifications(false);
  }, [location.pathname]);

  if (auth.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#0EA5B5] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!auth.isLoggedIn) {
    navigate("/login");
    return null;
  }

  const unreadCount = notificationsData?.unreadCount ?? 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 h-14 bg-white border-b border-gray-100 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <img
            src="/images/logo.jpg"
            alt="ABI MOD"
            className="w-8 h-8 rounded-full"
          />
          <span className="font-bold text-[#0EA5B5]">ABI MOD</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Mobile Notifications */}
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2"
          >
            <Bell className="w-5 h-5 text-gray-600" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>
          <button onClick={() => setSidebarOpen(true)}>
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Mobile Notifications Dropdown */}
      {showNotifications && (
        <div className="lg:hidden fixed top-14 right-0 left-0 z-[55] bg-white border-b border-gray-100 shadow-lg max-h-64 overflow-y-auto">
          <div className="p-3 flex items-center justify-between border-b border-gray-100">
            <span className="font-medium text-sm">Notifications</span>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllRead.mutate()}
                className="text-xs text-[#0EA5B5] hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>
          {notificationsData?.items.length === 0 && (
            <p className="p-4 text-center text-sm text-gray-400">
              No notifications
            </p>
          )}
          {notificationsData?.items.map((n) => (
            <div
              key={n.id}
              onClick={() => {
                if (!n.isRead) markAsRead.mutate({ id: n.id });
                if (n.type === "new_order" && n.entityId) {
                  navigate(`/admin/orders`);
                }
                setShowNotifications(false);
              }}
              className={`p-3 border-b border-gray-50 cursor-pointer ${
                !n.isRead ? "bg-blue-50" : ""
              }`}
            >
              <p className="text-sm font-medium">{n.title}</p>
              {n.message && (
                <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="absolute top-0 left-0 w-64 h-full bg-gray-900 text-white">
            <div className="p-4 border-b border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img
                  src="/images/logo.jpg"
                  alt="ABI MOD"
                  className="w-8 h-8 rounded-full"
                />
                <span className="font-bold text-lg">ABI MOD</span>
              </div>
              <button onClick={() => setSidebarOpen(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="p-3 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                    location.pathname === item.to
                      ? "bg-[#0EA5B5]/10 text-[#0EA5B5] border-l-2 border-[#0EA5B5]"
                      : "text-gray-400 hover:text-white hover:bg-gray-800"
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </Link>
              ))}
              <button
                onClick={() => auth.logout()}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:text-red-400 hover:bg-gray-800 w-full transition-colors"
              >
                <LogOut className="w-5 h-5" />
                Logout
              </button>
            </nav>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden lg:block fixed top-0 left-0 w-64 h-full bg-gray-900 text-white z-40">
        <div className="p-4 border-b border-gray-800 flex items-center gap-2">
          <img
            src="/images/logo.jpg"
            alt="ABI MOD"
            className="w-9 h-9 rounded-full"
          />
          <span className="font-bold text-lg">ABI MOD</span>
        </div>
        <nav className="p-3 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                location.pathname === item.to
                  ? "bg-[#0EA5B5]/10 text-[#0EA5B5] border-l-2 border-[#0EA5B5]"
                  : "text-gray-400 hover:text-white hover:bg-gray-800"
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          ))}
          <button
            onClick={() => auth.logout()}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:text-red-400 hover:bg-gray-800 w-full transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </nav>
      </aside>

      {/* Desktop Top Bar with Notifications */}
      <div className="hidden lg:flex fixed top-0 right-0 left-64 h-14 bg-white border-b border-gray-100 items-center justify-end px-6 z-30">
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <Bell className="w-5 h-5 text-gray-600" />
            {unreadCount > 0 && (
              <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Desktop Notifications Dropdown */}
          {showNotifications && (
            <>
              <div
                className="fixed inset-0 z-[45]"
                onClick={() => setShowNotifications(false)}
              />
              <div className="absolute right-0 top-12 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-[50] max-h-80 overflow-y-auto">
                <div className="p-3 flex items-center justify-between border-b border-gray-100">
                  <span className="font-medium text-sm">Notifications</span>
                  {unreadCount > 0 && (
                    <button
                      onClick={() => markAllRead.mutate()}
                      className="text-xs text-[#0EA5B5] hover:underline"
                    >
                      Mark all read
                    </button>
                  )}
                </div>
                {notificationsData?.items.length === 0 && (
                  <p className="p-4 text-center text-sm text-gray-400">
                    No notifications
                  </p>
                )}
                {notificationsData?.items.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => {
                      if (!n.isRead) markAsRead.mutate({ id: n.id });
                      if (n.type === "new_order" && n.entityId) {
                        navigate(`/admin/orders`);
                      }
                      setShowNotifications(false);
                    }}
                    className={`p-3 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors ${
                      !n.isRead ? "bg-blue-50/50" : ""
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {!n.isRead && (
                        <span className="w-2 h-2 bg-[#0EA5B5] rounded-full shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {n.title}
                        </p>
                        {n.message && (
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                            {n.message}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:ml-64 pt-14 lg:pt-14 min-h-screen">
        <div className="p-6 lg:p-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
