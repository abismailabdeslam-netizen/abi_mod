import { Link, useNavigate } from "react-router";
import { Minus, Plus, Trash2, ShoppingCart, ArrowRight } from "lucide-react";
import { useLangStore, useCartStore } from "@/lib/store";
import { t } from "@/lib/i18n";

export default function CartPage() {
  const { lang } = useLangStore();
  const { items, updateQuantity, removeItem, totalPrice, totalItems } = useCartStore();
  const navigate = useNavigate();
  const subtotal = totalPrice();

  if (items.length === 0) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShoppingCart className="w-12 h-12 text-gray-300" />
        </div>
        <h2 className="text-xl font-semibold text-gray-700 mb-2">
          {t("cart.empty", lang)}
        </h2>
        <p className="text-gray-500 mb-6">{t("cart.emptyDesc", lang)}</p>
        <Link
          to="/products"
          className="inline-flex items-center gap-2 h-12 px-8 bg-[#0EA5B5] text-white font-semibold rounded-2xl hover:bg-[#0A7A86] transition-colors"
        >
          {t("cart.continue", lang)}
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 pb-24">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        {t("cart.title", lang)} ({totalItems()})
      </h1>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div
              key={`${item.productId}-${item.color}-${item.size}`}
              className="flex gap-4 bg-white rounded-2xl p-4 border border-gray-100"
            >
              <Link to={`/products/${item.productId}`} className="shrink-0">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-20 h-20 rounded-xl object-cover bg-gray-50"
                />
              </Link>
              <div className="flex-1 min-w-0">
                <Link
                  to={`/products/${item.productId}`}
                  className="text-sm font-medium text-gray-800 line-clamp-1 hover:text-[#0EA5B5] transition-colors"
                >
                  {item.name}
                </Link>
                <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                  {item.color && <span>Color: {item.color}</span>}
                  {item.size && <span>Size: {item.size}</span>}
                </div>
                <div className="flex items-center justify-between mt-3">
                  <div className="inline-flex items-center h-9 border border-gray-200 rounded-lg overflow-hidden">
                    <button
                      onClick={() =>
                        updateQuantity(
                          item.productId,
                          item.color,
                          item.size,
                          item.quantity - 1
                        )
                      }
                      className="w-9 h-full flex items-center justify-center text-gray-600 hover:bg-gray-50"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-10 h-full flex items-center justify-center text-sm font-semibold border-x border-gray-200">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() =>
                        updateQuantity(
                          item.productId,
                          item.color,
                          item.size,
                          item.quantity + 1
                        )
                      }
                      className="w-9 h-full flex items-center justify-center text-gray-600 hover:bg-gray-50"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-gray-900">
                      {(item.price * item.quantity).toLocaleString()} {t("currency", lang)}
                    </span>
                    <button
                      onClick={() =>
                        removeItem(item.productId, item.color, item.size)
                      }
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="font-semibold text-lg mb-4">{t("cart.subtotal", lang)}</h2>
            <div className="space-y-3 text-sm mb-6">
              <div className="flex justify-between text-gray-600">
                <span>
                  {totalItems()} {lang === "ar" ? "\u0639\u0646\u0635\u0631" : "items"}
                </span>
                <span>{subtotal.toLocaleString()} {t("currency", lang)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>{t("cart.shipping", lang)}</span>
                <span className="text-gray-400">
                  {lang === "ar" ? "\u0641\u064a \u0627\u0644\u062f\u0641\u0639" : "At checkout"}
                </span>
              </div>
              <div className="border-t pt-3 flex justify-between font-bold text-base">
                <span>{t("cart.total", lang)}</span>
                <span>{subtotal.toLocaleString()} {t("currency", lang)}</span>
              </div>
            </div>
            <button
              onClick={() => navigate("/checkout")}
              className="w-full h-13 bg-[#0EA5B5] text-white font-semibold rounded-2xl hover:bg-[#0A7A86] transition-colors flex items-center justify-center gap-2 py-3"
            >
              {t("cart.checkout", lang)}
              <ArrowRight className="w-4 h-4" />
            </button>
            <Link
              to="/products"
              className="block w-full h-12 mt-3 text-center text-sm font-medium text-[#0EA5B5] border border-[#0EA5B5] rounded-2xl hover:bg-[#E6F7F8] transition-colors flex items-center justify-center"
            >
              {t("cart.continue", lang)}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
