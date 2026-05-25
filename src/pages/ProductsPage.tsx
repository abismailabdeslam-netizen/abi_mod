import { useState, useEffect } from "react";
import { useSearchParams, useParams } from "react-router";
import { SlidersHorizontal, X } from "lucide-react";
import { useLangStore } from "@/lib/store";
import { t } from "@/lib/i18n";
import trpc from "@/lib/trpc";
import ProductCard from "@/components/ProductCard";

export default function ProductsPage() {
  const { lang } = useLangStore();
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get("search") || "";
  const categorySlug = slug || searchParams.get("category") || "";
  const sortParam = (searchParams.get("sort") as any) || "newest";

  const [page, setPage] = useState(1);
  const [sort, setSort] = useState(sortParam);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const { data, isLoading } = trpc.product.list.useQuery({
    page,
    limit: 12,
    category: categorySlug,
    sort,
    search: searchQuery || undefined,
    colors: selectedColors.length > 0 ? selectedColors : undefined,
    sizes: selectedSizes.length > 0 ? selectedSizes : undefined,
    minPrice: minPrice ? Number(minPrice) : undefined,
    maxPrice: maxPrice ? Number(maxPrice) : undefined,
  });

  const { data: filterData } = trpc.product.getFilters.useQuery();
  const { data: categories } = trpc.category.list.useQuery();

  const currentCategory = categories?.find((c) => c.slug === categorySlug);
  const title = searchQuery
    ? `${t("nav.search", lang)}: "${searchQuery}"`
    : currentCategory
      ? lang === "ar"
        ? currentCategory.nameAr ?? currentCategory.nameEn
        : lang === "fr"
          ? currentCategory.nameFr ?? currentCategory.nameEn
          : currentCategory.nameEn
      : t("nav.shop", lang);

  const toggleColor = (color: string) => {
    setSelectedColors((prev) =>
      prev.includes(color) ? prev.filter((c) => c !== color) : [...prev, color]
    );
    setPage(1);
  };

  const toggleSize = (size: string) => {
    setSelectedSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
    setPage(1);
  };

  const clearFilters = () => {
    setSelectedColors([]);
    setSelectedSizes([]);
    setMinPrice("");
    setMaxPrice("");
    setPage(1);
  };

  const hasFilters =
    selectedColors.length > 0 || selectedSizes.length > 0 || minPrice || maxPrice;

  useEffect(() => {
    setPage(1);
  }, [categorySlug, searchQuery, sort]);

  const filterPanel = (
    <div className="space-y-6">
      {/* Colors */}
      {filterData?.colors && filterData.colors.length > 0 && (
        <div>
          <h4 className="font-semibold text-sm mb-3">
            {t("product.color", lang)}
          </h4>
          <div className="flex flex-wrap gap-2">
            {filterData.colors.map((color) => (
              <button
                key={color}
                onClick={() => toggleColor(color)}
                className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                  selectedColors.includes(color)
                    ? "bg-[#0EA5B5] text-white border-[#0EA5B5]"
                    : "bg-white text-gray-600 border-gray-200 hover:border-[#0EA5B5]"
                }`}
              >
                {color}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Sizes */}
      {filterData?.sizes && filterData.sizes.length > 0 && (
        <div>
          <h4 className="font-semibold text-sm mb-3">
            {t("product.size", lang)}
          </h4>
          <div className="flex flex-wrap gap-2">
            {filterData.sizes.map((size) => (
              <button
                key={size}
                onClick={() => toggleSize(size)}
                className={`w-10 h-10 text-xs rounded-lg border transition-colors flex items-center justify-center ${
                  selectedSizes.includes(size)
                    ? "bg-[#0EA5B5] text-white border-[#0EA5B5]"
                    : "bg-white text-gray-600 border-gray-200 hover:border-[#0EA5B5]"
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Price */}
      <div>
        <h4 className="font-semibold text-sm mb-3">
          {t("filter.price", lang)}
        </h4>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Min"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-[#0EA5B5] focus:border-transparent"
          />
          <input
            type="number"
            placeholder="Max"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-[#0EA5B5] focus:border-transparent"
          />
        </div>
      </div>

      {hasFilters && (
        <button
          onClick={clearFilters}
          className="w-full h-10 text-sm font-medium text-[#0EA5B5] border border-[#0EA5B5] rounded-lg hover:bg-[#E6F7F8] transition-colors"
        >
          {t("btn.clear", lang)}
        </button>
      )}
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 pb-24">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        <p className="text-sm text-gray-500 mt-1">
          {data?.total ?? 0} {lang === "ar" ? "\u0645\u0646\u062a\u062c" : "products"}
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => setShowFilters(true)}
          className="flex items-center gap-2 h-10 px-4 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:border-[#0EA5B5] transition-colors"
        >
          <SlidersHorizontal className="w-4 h-4" />
          {t("filter.title", lang)}
          {hasFilters && (
            <span className="w-5 h-5 rounded-full bg-[#0EA5B5] text-white text-xs flex items-center justify-center">
              {selectedColors.length + selectedSizes.length + (minPrice || maxPrice ? 1 : 0)}
            </span>
          )}
        </button>

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="h-10 px-3 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#0EA5B5] focus:border-transparent"
        >
          <option value="newest">{t("sort.newest", lang)}</option>
          <option value="price_asc">{t("sort.priceAsc", lang)}</option>
          <option value="price_desc">{t("sort.priceDesc", lang)}</option>
          <option value="bestsellers">{t("sort.bestsellers", lang)}</option>
        </select>
      </div>

      <div className="flex gap-6">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-64 shrink-0">
          <div className="sticky top-24 bg-white rounded-2xl border border-gray-100 p-5">
            <h3 className="font-semibold mb-4">{t("filter.title", lang)}</h3>
            {filterPanel}
          </div>
        </aside>

        {/* Product Grid */}
        <div className="flex-1">
          {isLoading ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-sm">
                  <div className="aspect-[3/4] bg-gray-100 animate-pulse" />
                  <div className="p-4 space-y-2">
                    <div className="h-4 bg-gray-100 rounded animate-pulse" />
                    <div className="h-4 w-20 bg-gray-100 rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : data?.products.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <SlidersHorizontal className="w-8 h-8 text-gray-300" />
              </div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                {lang === "ar" ? "\u0644\u0627 \u062a\u0648\u062c\u062f \u0645\u0646\u062a\u062c\u0627\u062a" : "No products found"}
              </h3>
              <p className="text-gray-400 text-sm">
                {lang === "ar" ? "\u062c\u0631\u0628 \u062a\u063a\u064a\u064a\u0631 \u0627\u0644\u0641\u0644\u0627\u062a\u0631" : "Try adjusting your filters"}
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                {data?.products.map((product, i) => (
                  <ProductCard key={product.id} product={product} index={i} />
                ))}
              </div>

              {/* Pagination */}
              {data && data.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-10">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="w-10 h-10 rounded-lg border border-gray-200 flex items-center justify-center text-sm disabled:opacity-40 hover:border-[#0EA5B5] transition-colors"
                  >
                    &lt;
                  </button>
                  {Array.from({ length: Math.min(5, data.totalPages) }, (_, i) => {
                    const pageNum = i + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-medium transition-colors ${
                          page === pageNum
                            ? "bg-[#0EA5B5] text-white"
                            : "border border-gray-200 hover:border-[#0EA5B5]"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                    disabled={page === data.totalPages}
                    className="w-10 h-10 rounded-lg border border-gray-200 flex items-center justify-center text-sm disabled:opacity-40 hover:border-[#0EA5B5] transition-colors"
                  >
                    &gt;
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Mobile Filter Sheet */}
      {showFilters && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowFilters(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-semibold">{t("filter.title", lang)}</h3>
              <button onClick={() => setShowFilters(false)}>
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-4">{filterPanel}</div>
          </div>
        </div>
      )}
    </div>
  );
}
