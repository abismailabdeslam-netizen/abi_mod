import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Menu, Search, ShoppingCart, X } from "lucide-react";
import { useLangStore, useCartStore } from "@/lib/store";
import { t } from "@/lib/i18n";
import trpc from "@/lib/trpc";

export default function Header() {
  const { lang, dir, setLang } = useLangStore();
  const cartCount = useCartStore((s) => s.totalItems());
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const { data: categories } = trpc.category.list.useQuery();

  const isRtl = dir === "rtl";

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
      setSearchOpen(false);
      setSearchQuery("");
    }
  };

  return (
    <>
      {/* Announcement Bar */}
      <div className="bg-[#0EA5B5] text-white text-center text-xs sm:text-sm py-2 px-4">
        <span className="font-medium">
          {lang === "ar"
            ? "\u0634\u062d\u0646 \u0645\u062c\u0627\u0646\u064a \u0639\u0644\u0649 \u0627\u0644\u0637\u0644\u0628\u0627\u062a \u0623\u0643\u062b\u0631 \u0645\u0646 5000 \u062f.\u062c"
            : lang === "fr"
              ? "Livraison gratuite d\u00e8s 5000 DZD"
              : "Free shipping on orders over 5000 DZD"}
        </span>
      </div>

      {/* Main Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setMenuOpen(true)}
              className="lg:hidden p-2 -ml-2 text-gray-700 hover:text-[#0EA5B5] transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>

            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 shrink-0">
              <img
                src="/images/logo.jpg"
                alt="ABI MOD"
                className="h-10 w-10 rounded-full object-cover"
              />
              <span className="text-xl font-bold text-[#0EA5B5] tracking-tight hidden sm:inline">
                ABI MOD
              </span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-8">
              <Link
                to="/"
                className="text-sm font-medium text-gray-700 hover:text-[#0EA5B5] transition-colors"
              >
                {t("nav.home", lang)}
              </Link>
              <Link
                to="/products"
                className="text-sm font-medium text-gray-700 hover:text-[#0EA5B5] transition-colors"
              >
                {t("nav.shop", lang)}
              </Link>
              <div className="relative group">
                <button className="text-sm font-medium text-gray-700 hover:text-[#0EA5B5] transition-colors">
                  {t("nav.categories", lang)}
                </button>
                <div className="absolute top-full left-0 w-56 bg-white rounded-xl shadow-lg border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 mt-1 py-2">
                  {categories?.map((cat) => (
                    <Link
                      key={cat.id}
                      to={`/categories/${cat.slug}`}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors"
                    >
                      {cat.image && (
                        <img
                          src={cat.image}
                          alt={cat.nameEn ?? ""}
                          className="w-8 h-8 rounded-lg object-cover"
                        />
                      )}
                      <span className="text-sm text-gray-700">
                        {lang === "ar"
                          ? cat.nameAr ?? cat.nameEn
                          : lang === "fr"
                            ? cat.nameFr ?? cat.nameEn
                            : cat.nameEn}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            </nav>

            {/* Right Actions */}
            <div className="flex items-center gap-1 sm:gap-3">
              {/* Language Switcher */}
              <div className="hidden sm:flex items-center gap-1 text-xs font-medium">
                {(["en", "fr", "ar"] as const).map((l) => (
                  <button
                    key={l}
                    onClick={() => setLang(l)}
                    className={`px-2 py-1 rounded-md transition-colors ${
                      lang === l
                        ? "bg-[#0EA5B5] text-white"
                        : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    {l === "ar" ? "\u0627\u0644\u0639\u0631\u0628\u064a\u0629" : l.toUpperCase()}
                  </button>
                ))}
              </div>

              {/* Search */}
              <button
                onClick={() => setSearchOpen(true)}
                className="p-2 text-gray-600 hover:text-[#0EA5B5] transition-colors"
              >
                <Search className="w-5 h-5" />
              </button>

              {/* Cart */}
              <Link
                to="/cart"
                className="relative p-2 text-gray-600 hover:text-[#0EA5B5] transition-colors"
              >
                <ShoppingCart className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-[#E863A8] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Drawer */}
      {menuOpen && (
        <div className="fixed inset-0 z-[60]">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setMenuOpen(false)}
          />
          <div
            className={`absolute top-0 ${isRtl ? "left-0" : "right-0"} w-80 max-w-[85vw] h-full bg-white shadow-2xl`}
          >
            <div className="flex items-center justify-between p-4 border-b">
              <span className="font-bold text-[#0EA5B5] text-lg">ABI MOD</span>
              <button
                onClick={() => setMenuOpen(false)}
                className="p-2 text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="p-4 space-y-1">
              {[
                { to: "/", label: t("nav.home", lang) },
                { to: "/products", label: t("nav.shop", lang) },
                ...(
                  categories?.map((c) => ({
                    to: `/categories/${c.slug}`,
                    label:
                      lang === "ar"
                        ? c.nameAr ?? c.nameEn
                        : lang === "fr"
                          ? c.nameFr ?? c.nameEn
                          : c.nameEn,
                  })) ?? []
                ),
                { to: "/cart", label: t("nav.cart", lang) },
              ].map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center px-3 py-3 rounded-lg text-gray-700 hover:bg-[#E6F7F8] hover:text-[#0EA5B5] transition-colors font-medium"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="p-4 border-t mt-auto">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                {(["en", "fr", "ar"] as const).map((l) => (
                  <button
                    key={l}
                    onClick={() => setLang(l)}
                    className={`px-3 py-1.5 rounded-lg transition-colors ${
                      lang === l
                        ? "bg-[#0EA5B5] text-white"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {l === "ar" ? "\u0627\u0644\u0639\u0631\u0628\u064a\u0629" : l.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search Overlay */}
      {searchOpen && (
        <div className="fixed inset-0 z-[60]">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setSearchOpen(false)}
          />
          <div className="absolute top-20 left-1/2 -translate-x-1/2 w-full max-w-lg px-4">
            <form onSubmit={handleSearch}>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t("search.placeholder", lang)}
                  className="w-full h-14 pl-12 pr-4 rounded-2xl bg-white shadow-xl border-0 text-gray-800 placeholder:text-gray-400 focus:ring-2 focus:ring-[#0EA5B5] focus:outline-none"
                  autoFocus
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <button
                  type="button"
                  onClick={() => setSearchOpen(false)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
