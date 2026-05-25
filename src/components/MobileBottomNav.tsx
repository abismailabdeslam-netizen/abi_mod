import { Link, useLocation } from "react-router";
import { Home, ShoppingBag, LayoutGrid, ShoppingCart } from "lucide-react";
import { useLangStore, useCartStore } from "@/lib/store";

export default function MobileBottomNav() {
  const { lang } = useLangStore();
  const location = useLocation();
  const cartCount = useCartStore((s) => s.totalItems());

  const isActive = (path: string) => location.pathname === path;

  const items = [
    { to: "/", icon: Home, label: lang === "ar" ? "\u0627\u0644\u0631\u0626\u064a\u0633\u064a\u0629" : "Home" },
    { to: "/products", icon: ShoppingBag, label: lang === "ar" ? "\u0627\u0644\u0645\u062a\u062c\u0631" : "Shop" },
    { to: "/products", icon: LayoutGrid, label: lang === "ar" ? "\u0627\u0644\u0623\u0642\u0633\u0627\u0645" : "Cats" },
    { to: "/cart", icon: ShoppingCart, label: lang === "ar" ? "\u0627\u0644\u0633\u0644\u0629" : "Cart", badge: cartCount },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-gray-100 pb-safe">
      <div className="flex items-center justify-around h-16">
        {items.map((item) => (
          <Link
            key={item.to + item.label}
            to={item.to}
            className={`flex flex-col items-center justify-center gap-0.5 w-16 h-full ${
              isActive(item.to)
                ? "text-[#0EA5B5]"
                : "text-gray-400"
            }`}
          >
            <div className="relative">
              <item.icon className="w-5 h-5" />
              {item.badge !== undefined && item.badge > 0 && (
                <span className="absolute -top-2 -right-2.5 bg-[#E863A8] text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {item.badge}
                </span>
              )}
            </div>
            <span className="text-[10px] font-medium">{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
