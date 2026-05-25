import { useEffect } from "react";
import { CheckCircle, XCircle, Info, X } from "lucide-react";
import { useAppStore } from "@/lib/store";

export default function Toast() {
  const { toast, setToast } = useAppStore();

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast, setToast]);

  if (!toast) return null;

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-green-500" />,
    error: <XCircle className="w-5 h-5 text-red-500" />,
    info: <Info className="w-5 h-5 text-[#0EA5B5]" />,
  };

  const borders = {
    success: "border-l-green-500",
    error: "border-l-red-500",
    info: "border-l-[#0EA5B5]",
  };

  return (
    <div className="fixed top-4 right-4 z-[60] animate-in slide-in-from-top-2 fade-in duration-300">
      <div
        className={`bg-white rounded-xl shadow-lg border-l-4 ${borders[toast.type]} px-4 py-3 flex items-center gap-3 min-w-[280px]`}
      >
        {icons[toast.type]}
        <span className="text-sm text-gray-700 flex-1">{toast.message}</span>
        <button
          onClick={() => setToast(null)}
          className="text-gray-400 hover:text-gray-600"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
