import { useState, useEffect } from "react";
import {
  Save,
  Bell,
  Sun,
  Moon,
  Facebook,
  Instagram,
  Phone,
  Globe,
  Store,
} from "lucide-react";
import trpc from "@/lib/trpc";

// TikTok icon component
function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15.2a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.78a8.28 8.28 0 0 0 4.83 1.54V6.83a4.85 4.85 0 0 1-1.07-.14z" />
    </svg>
  );
}

export default function AdminSettings() {
  const { data: settings, isLoading } = trpc.settings.getAll.useQuery();
  const utils = trpc.useUtils();

  const [storeName, setStoreName] = useState("");
  const [storeEmail, setStoreEmail] = useState("");
  const [storePhone, setStorePhone] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [whatsappMessage, setWhatsappMessage] = useState("");
  const [facebookUrl, setFacebookUrl] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [tiktokUrl, setTiktokUrl] = useState("");
  const [darkMode, setDarkMode] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  useEffect(() => {
    if (settings) {
      setStoreName(settings.storeName ?? "");
      setStoreEmail(settings.storeEmail ?? "");
      setStorePhone(settings.storePhone ?? "");
      setWhatsappNumber(settings.whatsappNumber ?? "");
      setWhatsappMessage(settings.whatsappMessage ?? "");
      setFacebookUrl(settings.facebookUrl ?? "");
      setInstagramUrl(settings.instagramUrl ?? "");
      setTiktokUrl(settings.tiktokUrl ?? "");
      const dm = settings.darkMode === "true";
      setDarkMode(dm);
      // Apply dark mode to document
      if (dm) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  }, [settings]);

  const updateSettings = trpc.settings.update.useMutation({
    onSuccess: () => {
      utils.settings.getAll.invalidate();
    },
  });

  const handleSave = () => {
    updateSettings.mutate({
      storeName: storeName || null,
      storeEmail: storeEmail || null,
      storePhone: storePhone || null,
      whatsappNumber: whatsappNumber || null,
      whatsappMessage: whatsappMessage || null,
      facebookUrl: facebookUrl || null,
      instagramUrl: instagramUrl || null,
      tiktokUrl: tiktokUrl || null,
      darkMode: String(darkMode),
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-6 h-6 border-2 border-[#0EA5B5] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>

      {/* Store Information */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center gap-2">
          <Store className="w-5 h-5 text-[#0EA5B5]" />
          <div>
            <h2 className="font-semibold">Store Information</h2>
            <p className="text-xs text-gray-400">تظهر في الفوتر وصفحة التواصل والفواتير</p>
          </div>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Store Name
            </label>
            <input
              type="text"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-[#0EA5B5] outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={storeEmail}
              onChange={(e) => setStoreEmail(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-[#0EA5B5] outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone
            </label>
            <input
              type="text"
              value={storePhone}
              onChange={(e) => setStorePhone(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-[#0EA5B5] outline-none"
            />
          </div>
        </div>
      </div>

      {/* WhatsApp */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center gap-2">
          <Phone className="w-5 h-5 text-green-500" />
          <h2 className="font-semibold">WhatsApp</h2>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              WhatsApp Number (with country code)
            </label>
            <input
              type="text"
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
              placeholder="213XXXXXXXXX"
              className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-[#0EA5B5] outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Default Message
            </label>
            <textarea
              value={whatsappMessage}
              onChange={(e) => setWhatsappMessage(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-[#0EA5B5] outline-none resize-none"
            />
          </div>
        </div>
      </div>

      {/* Social Media */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center gap-2">
          <Globe className="w-5 h-5 text-blue-500" />
          <h2 className="font-semibold">Social Media Links</h2>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
              <Facebook className="w-4 h-4 text-blue-600" />
              Facebook URL
            </label>
            <input
              type="url"
              value={facebookUrl}
              onChange={(e) => setFacebookUrl(e.target.value)}
              placeholder="https://facebook.com/..."
              className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-[#0EA5B5] outline-none"
            />
          </div>
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
              <Instagram className="w-4 h-4 text-pink-600" />
              Instagram URL
            </label>
            <input
              type="url"
              value={instagramUrl}
              onChange={(e) => setInstagramUrl(e.target.value)}
              placeholder="https://instagram.com/..."
              className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-[#0EA5B5] outline-none"
            />
          </div>
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
              <TikTokIcon className="w-4 h-4" />
              TikTok URL
            </label>
            <input
              type="url"
              value={tiktokUrl}
              onChange={(e) => setTiktokUrl(e.target.value)}
              placeholder="https://tiktok.com/@..."
              className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-[#0EA5B5] outline-none"
            />
          </div>
        </div>
      </div>

      {/* Appearance */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center gap-2">
          {darkMode ? (
            <Moon className="w-5 h-5 text-purple-500" />
          ) : (
            <Sun className="w-5 h-5 text-amber-500" />
          )}
          <h2 className="font-semibold">Appearance</h2>
        </div>
        <div className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Dark Mode</p>
              <p className="text-xs text-gray-500">
                Enable dark theme for admin panel
              </p>
            </div>
            <button
              onClick={() => {
                const newDark = !darkMode;
                setDarkMode(newDark);
                if (newDark) {
                  document.documentElement.classList.add("dark");
                } else {
                  document.documentElement.classList.remove("dark");
                }
              }}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                darkMode ? "bg-[#0EA5B5]" : "bg-gray-200"
              }`}
            >
              <span
                className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${
                  darkMode ? "translate-x-6" : ""
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center gap-2">
          <Bell className="w-5 h-5 text-amber-500" />
          <h2 className="font-semibold">Notifications</h2>
        </div>
        <div className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">
                New Order Notifications
              </p>
              <p className="text-xs text-gray-500">
                Get notified when a new order is placed
              </p>
            </div>
            <button
              onClick={() => setNotificationsEnabled(!notificationsEnabled)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                notificationsEnabled ? "bg-[#0EA5B5]" : "bg-gray-200"
              }`}
            >
              <span
                className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${
                  notificationsEnabled ? "translate-x-6" : ""
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleSave}
          disabled={updateSettings.isPending}
          className="inline-flex items-center gap-2 h-11 px-6 bg-[#0EA5B5] text-white font-medium rounded-xl hover:bg-[#0A7A86] transition-colors disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {updateSettings.isPending ? "Saving..." : "Save Changes"}
        </button>
        {updateSettings.isSuccess && (
          <p className="text-sm text-green-600">Settings saved successfully!</p>
        )}
      </div>
    </div>
  );
}
