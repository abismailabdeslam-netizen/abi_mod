import { Link } from "react-router";
import { ArrowRight, Leaf, MapPin, Truck, MessageCircle } from "lucide-react";
import { useLangStore } from "@/lib/store";
import { t } from "@/lib/i18n";
import trpc from "@/lib/trpc";
import ProductCard from "@/components/ProductCard";

export default function HomePage() {
  const { lang } = useLangStore();
  const { data: featured } = trpc.product.featured.useQuery();
  const { data: categories } = trpc.category.list.useQuery();
  const { data: newArrivals } = trpc.product.newArrivals.useQuery();

  return (
    <div>
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-[#E6F7F8] via-white to-[#FDE8F2] overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 lg:py-20">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div className="text-center lg:text-left order-2 lg:order-1">
              <span className="inline-block bg-[#E863A8]/10 text-[#E863A8] text-xs font-semibold px-4 py-1.5 rounded-full mb-6">
                {t("hero.newCollection", lang)}
              </span>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight mb-5">
                {t("hero.title", lang)}
              </h1>
              <p className="text-gray-600 text-base lg:text-lg mb-8 max-w-lg mx-auto lg:mx-0">
                {t("hero.subtitle", lang)}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                <Link
                  to="/products"
                  className="inline-flex items-center justify-center gap-2 h-12 px-8 bg-[#0EA5B5] text-white font-semibold rounded-2xl hover:bg-[#0A7A86] transition-colors shadow-lg shadow-[#0EA5B5]/20"
                >
                  {t("hero.shopNow", lang)}
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/products"
                  className="inline-flex items-center justify-center gap-2 h-12 px-8 border-2 border-[#0EA5B5] text-[#0EA5B5] font-semibold rounded-2xl hover:bg-[#E6F7F8] transition-colors"
                >
                  {t("hero.viewCategories", lang)}
                </Link>
              </div>
            </div>
            <div className="order-1 lg:order-2 flex justify-center">
              <img
                src="/images/hero-baby.jpg"
                alt="ABI MOD Baby"
                className="w-full max-w-md lg:max-w-lg rounded-3xl shadow-2xl object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-12 lg:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            {t("category.title", lang)}
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {categories?.map((cat) => (
              <Link
                key={cat.id}
                to={`/categories/${cat.slug}`}
                className="group relative aspect-square rounded-2xl overflow-hidden"
              >
                <img
                  src={cat.image || ""}
                  alt={cat.nameEn ?? ""}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <h3 className="text-white font-bold text-lg">
                    {lang === "ar"
                      ? cat.nameAr ?? cat.nameEn
                      : lang === "fr"
                        ? cat.nameFr ?? cat.nameEn
                        : cat.nameEn}
                  </h3>
                  <p className="text-white/80 text-sm">
                    {cat.productCount ?? 0}{" "}
                    {lang === "ar" ? "\u0645\u0646\u062a\u062c" : "products"}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-12 lg:py-16 bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-gray-900">
              {t("featured.title", lang)}
            </h2>
            <Link
              to="/products"
              className="text-sm font-medium text-[#0EA5B5] hover:text-[#0A7A86] flex items-center gap-1"
            >
              {t("featured.viewAll", lang)}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {featured?.slice(0, 8).map((product, i) => (
              <ProductCard key={product.id} product={product} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* Promo Banner */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="relative bg-gradient-to-r from-[#E6F7F8] to-[#FDE8F2] rounded-3xl p-8 lg:p-12 overflow-hidden">
            <div className="relative z-10 text-center">
              <h3 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
                {t("promo.title", lang)}
              </h3>
              <p className="text-gray-600 mb-6">{t("promo.subtitle", lang)}</p>
              <Link
                to="/products"
                className="inline-flex items-center gap-2 h-11 px-6 bg-[#0EA5B5] text-white font-semibold rounded-xl hover:bg-[#0A7A86] transition-colors"
              >
                {t("promo.shopSale", lang)}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* New Arrivals */}
      {newArrivals && newArrivals.length > 0 && (
        <section className="py-12 lg:py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">
              {lang === "ar" ? "\u0648\u0635\u0648\u0644 \u062c\u062f\u064a\u062f" : lang === "fr" ? "Nouveaut\u00e9s" : "New Arrivals"}
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
              {newArrivals.slice(0, 4).map((product, i) => (
                <ProductCard key={product.id} product={product} index={i} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Brand Values */}
      <section className="py-12 lg:py-16 bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-10 text-center">
            {t("values.title", lang)}
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Leaf,
                title: t("values.organic", lang),
                desc: t("values.organicDesc", lang),
              },
              {
                icon: MapPin,
                title: t("values.handcrafted", lang),
                desc: t("values.handcraftedDesc", lang),
              },
              {
                icon: Truck,
                title: t("values.delivery", lang),
                desc: t("values.deliveryDesc", lang),
              },
              {
                icon: MessageCircle,
                title: t("values.support", lang),
                desc: t("values.supportDesc", lang),
              },
            ].map((v, i) => (
              <div key={i} className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-[#E6F7F8] flex items-center justify-center mx-auto mb-4">
                  <v.icon className="w-6 h-6 text-[#0EA5B5]" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1.5 text-sm">
                  {v.title}
                </h3>
                <p className="text-xs text-gray-500 leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
