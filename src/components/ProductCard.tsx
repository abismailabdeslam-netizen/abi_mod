import { Link } from "react-router";
import { ShoppingCart } from "lucide-react";
import { useLangStore, useCartStore, useAppStore } from "@/lib/store";
import { t } from "@/lib/i18n";
import type { Product } from "@db/schema";

interface Props {
  product: Product;
  index?: number;
}

export default function ProductCard({ product, index = 0 }: Props) {
  const { lang } = useLangStore();
  const addItem = useCartStore((s) => s.addItem);
  const setToast = useAppStore((s) => s.setToast);

  const name = lang === "ar" ? product.nameAr || product.nameEn : lang === "fr" ? product.nameFr || product.nameEn : product.nameEn;
  const images = (product.images as string[] | null) ?? [];
  const price = Number(product.price);
  const oldPrice = product.oldPrice ? Number(product.oldPrice) : null;
  const hasDiscount = oldPrice && oldPrice > price;
  const discountPercent = hasDiscount
    ? Math.round(((oldPrice! - price) / oldPrice!) * 100)
    : 0;
  const isOutOfStock = (product.stockQuantity ?? 0) <= 0;

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock) return;
    addItem({
      productId: product.id,
      name: product.nameEn,
      price,
      image: images[0] || "",
      quantity: 1,
    });
    setToast({
      message: lang === "ar" ? "\u0623\u0636\u064a\u0641 \u0625\u0644\u0649 \u0627\u0644\u0633\u0644\u0629" : lang === "fr" ? "Ajout\u00e9 au panier" : "Added to cart",
      type: "success",
    });
  };

  return (
    <Link
      to={`/products/${product.slug}`}
      className="group block bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* Image */}
      <div className="relative aspect-[3/4] overflow-hidden bg-gray-50">
        {images[0] ? (
          <img
            src={images[0]}
            alt={name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <ShoppingCart className="w-12 h-12" />
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {product.isNewArrival && (
            <span className="bg-[#0EA5B5] text-white text-[10px] font-semibold px-2.5 py-1 rounded-full uppercase">
              {lang === "ar" ? "\u062c\u062f\u064a\u062f" : "New"}
            </span>
          )}
          {hasDiscount && (
            <span className="bg-[#E863A8] text-white text-[10px] font-semibold px-2.5 py-1 rounded-full">
              -{discountPercent}%
            </span>
          )}
        </div>

        {/* Quick Add */}
        {!isOutOfStock && (
          <button
            onClick={handleQuickAdd}
            className="absolute bottom-3 right-3 w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 hover:bg-[#0EA5B5] hover:text-white text-gray-700"
          >
            <ShoppingCart className="w-4 h-4" />
          </button>
        )}

        {isOutOfStock && (
          <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
            <span className="bg-gray-800/80 text-white text-xs font-semibold px-3 py-1.5 rounded-full">
              {t("product.outOfStock", lang)}
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="text-sm font-medium text-gray-800 line-clamp-1 mb-1 group-hover:text-[#0EA5B5] transition-colors">
          {name}
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-base font-bold text-gray-900">
            {price.toLocaleString()} {t("currency", lang)}
          </span>
          {oldPrice && (
            <span className="text-sm text-gray-400 line-through">
              {oldPrice.toLocaleString()}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
