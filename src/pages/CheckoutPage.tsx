import { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import { ShoppingCart, CreditCard, ChevronDown } from "lucide-react";
import { useLangStore, useCartStore, useAppStore } from "@/lib/store";
import { t } from "@/lib/i18n";
import trpc from "@/lib/trpc";

const WILAYAS = [
  "Adrar", "Chlef", "Laghouat", "Oum El Bouaghi", "Batna", "Bejaia", "Biskra", "Bechar", "Blida", "Bouira",
  "Tamanrasset", "Tebessa", "Tlemcen", "Tiaret", "Tizi Ouzou", "Algiers", "Djelfa", "Jijel", "Setif", "Saida",
  "Skikda", "Sidi Bel Abbes", "Annaba", "Guelma", "Constantine", "Medea", "Mostaganem", "Msila", "Mascara", "Ouargla",
  "Oran", "El Bayadh", "Illizi", "Bordj Bou Arreridj", "Boumerdes", "El Tarf", "Tindouf", "Tissemsilt", "El Oued", "Khenchela",
  "Souk Ahras", "Tipaza", "Mila", "Ain Defla", "Naama", "Ain Temouchent", "Ghardaia", "Relizane", "Timimoun", "Bordj Badji Mokhtar",
  "Ouled Djellal", "Beni Abbes", "In Salah", "In Guezzam", "Touggourt", "Djanet", "El Mghair", "El Meniaa"
];

export default function CheckoutPage() {
  const { lang } = useLangStore();
  const { items, totalPrice, clearCart } = useCartStore();
  const setToast = useAppStore((s) => s.setToast);
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [wilaya, setWilaya] = useState("");
  const [commune, setCommune] = useState("");
  const [deliveryType, setDeliveryType] = useState<"home" | "office">("home");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const subtotal = totalPrice();

  // Get product shipping profiles
  const productIds = items.map((i) => i.productId);
  const { data: productsData } = trpc.product.list.useQuery(
    { page: 1, limit: 50 },
    { enabled: productIds.length > 0 }
  );

  // Find shipping profiles for cart items
  const cartItemsWithProfiles = useMemo(() => {
    if (!productsData?.products) return [];
    return items.map((item) => {
      const product = productsData.products.find((p) => p.id === item.productId);
      return { ...item, shippingProfileId: product?.shippingProfileId ?? null };
    });
  }, [items, productsData]);

  // Fetch shipping prices for each unique profile
  const uniqueProfileIds = useMemo(() => {
    const ids = new Set<number>();
    cartItemsWithProfiles.forEach((i) => {
      if (i.shippingProfileId) ids.add(i.shippingProfileId);
    });
    return Array.from(ids);
  }, [cartItemsWithProfiles]);

  // Fetch all shipping prices for selected wilaya
  const { data: shippingPrices } = trpc.shippingProfile.calculate.useQuery(
    { profileId: uniqueProfileIds[0] ?? 0, destinationWilaya: wilaya, deliveryType },
    { enabled: wilaya.length > 0 && uniqueProfileIds.length > 0 }
  );

  const shippingPrice = shippingPrices?.shippingPrice ?? 0;
  const total = subtotal + shippingPrice;

  // Get communes for selected wilaya
  const { data: communesList } = trpc.commune.list.useQuery(
    { wilaya },
    { enabled: wilaya.length > 0 }
  );

  const createOrder = trpc.order.create.useMutation({
    onSuccess: (data) => {
      clearCart();
      navigate(`/order-confirmation?id=${data.id}`);
    },
    onError: () => {
      setIsSubmitting(false);
      setToast({ message: lang === "ar" ? "حدث خطأ" : "An error occurred", type: "error" });
    },
  });

  const canSubmit = fullName.length >= 2 && phone.length >= 9 && wilaya && commune;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setIsSubmitting(true);

    createOrder.mutate({
      fullName,
      phone,
      wilaya,
      commune,
      deliveryType,
      shippingPrice,
      items: items.map((item) => ({
        productId: item.productId,
        name: item.name,
        image: item.image,
        price: item.price,
        quantity: item.quantity,
        color: item.color,
        size: item.size,
      })),
    });
  };

  if (items.length === 0) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-700">{t("cart.empty", lang)}</h2>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 pb-24">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        {lang === "ar" ? "إتمام الطلب" : lang === "fr" ? "Passer la commande" : "Checkout"}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Order Summary */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="p-4 border-b bg-gray-50/50">
            <h2 className="font-semibold text-sm">
              {lang === "ar" ? "ملخص الطلب" : lang === "fr" ? "Récapitulatif" : "Order Summary"}
            </h2>
          </div>
          <div className="p-4 space-y-3">
            {items.map((item) => (
              <div key={`${item.productId}-${item.color}-${item.size}`} className="flex items-center gap-3">
                <img src={item.image} alt={item.name} className="w-12 h-12 rounded-lg object-cover bg-gray-50" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{item.name}</p>
                  <p className="text-xs text-gray-500">x{item.quantity}</p>
                </div>
                <span className="text-sm font-medium">{(item.price * item.quantity).toLocaleString()} {t("currency", lang)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Customer Info */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="p-4 border-b bg-gray-50/50">
            <h2 className="font-semibold text-sm">
              {lang === "ar" ? "معلومات العميل" : lang === "fr" ? "Informations client" : "Customer Info"}
            </h2>
          </div>
          <div className="p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {lang === "ar" ? "الاسم الكامل" : lang === "fr" ? "Nom complet" : "Full Name"} *
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={lang === "ar" ? "أدخل اسمك الكامل" : "Enter your full name"}
                className="w-full h-12 px-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#0EA5B5] focus:border-transparent outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {lang === "ar" ? "رقم الهاتف" : lang === "fr" ? "Téléphone" : "Phone"} *
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="05XX XXX XXX"
                className="w-full h-12 px-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#0EA5B5] focus:border-transparent outline-none"
                required
              />
            </div>
          </div>
        </div>

        {/* Shipping Address */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="p-4 border-b bg-gray-50/50">
            <h2 className="font-semibold text-sm">
              {lang === "ar" ? "عنوان التوصيل" : lang === "fr" ? "Adresse de livraison" : "Shipping Address"}
            </h2>
          </div>
          <div className="p-4 space-y-4">
            {/* Wilaya */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {lang === "ar" ? "الولاية" : lang === "fr" ? "Wilaya" : "Wilaya"} *
              </label>
              <div className="relative">
                <select
                  value={wilaya}
                  onChange={(e) => { setWilaya(e.target.value); setCommune(""); }}
                  className="w-full h-12 px-4 pr-10 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#0EA5B5] focus:border-transparent outline-none appearance-none bg-white"
                  required
                >
                  <option value="">{lang === "ar" ? "اختر الولاية" : "Select Wilaya"}</option>
                  {WILAYAS.map((w) => (
                    <option key={w} value={w}>{w}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Commune */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {lang === "ar" ? "البلدية" : lang === "fr" ? "Commune" : "Commune"} *
              </label>
              <div className="relative">
                <select
                  value={commune}
                  onChange={(e) => setCommune(e.target.value)}
                  className="w-full h-12 px-4 pr-10 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#0EA5B5] focus:border-transparent outline-none appearance-none bg-white disabled:bg-gray-50"
                  required
                  disabled={!wilaya}
                >
                  <option value="">
                    {!wilaya 
                      ? (lang === "ar" ? "اختر الولاية أولاً" : "Select wilaya first")
                      : (lang === "ar" ? "اختر البلدية" : "Select Commune")
                    }
                  </option>
                  {communesList?.map((c) => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Delivery Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {lang === "ar" ? "نوع التوصيل" : lang === "fr" ? "Type de livraison" : "Delivery Type"}
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setDeliveryType("home")}
                  className={`h-12 rounded-xl border-2 text-sm font-medium transition-colors ${
                    deliveryType === "home"
                      ? "border-[#0EA5B5] bg-[#E6F7F8] text-[#0EA5B5]"
                      : "border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                >
                  {lang === "ar" ? "توصيل إلى باب المنزل" : lang === "fr" ? "Livraison à domicile" : "Home Delivery"}
                  {shippingPrice > 0 && deliveryType === "home" && (
                    <span className="block text-xs font-normal mt-0.5">{shippingPrice.toLocaleString()} {t("currency", lang)}</span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setDeliveryType("office")}
                  className={`h-12 rounded-xl border-2 text-sm font-medium transition-colors ${
                    deliveryType === "office"
                      ? "border-[#0EA5B5] bg-[#E6F7F8] text-[#0EA5B5]"
                      : "border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                >
                  {lang === "ar" ? "توصيل إلى المكتب" : lang === "fr" ? "Livraison au bureau" : "Office Delivery"}
                  {shippingPrice > 0 && deliveryType === "office" && (
                    <span className="block text-xs font-normal mt-0.5">{shippingPrice.toLocaleString()} {t("currency", lang)}</span>
                  )}
                </button>
              </div>
            </div>

            {/* Shipping cost display */}
            {wilaya && (
              <div className="flex justify-between items-center p-3 bg-[#E6F7F8] rounded-xl">
                <span className="text-sm text-gray-600">
                  {lang === "ar" ? "سعر التوصيل" : "Shipping"}
                </span>
                <span className="font-semibold text-[#0EA5B5]">
                  {shippingPrice > 0 ? `${shippingPrice.toLocaleString()} ${t("currency", lang)}` : (lang === "ar" ? "لم يتم تحديد السعر" : "Not set")}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Payment */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="p-4 border-b bg-gray-50/50">
            <h2 className="font-semibold text-sm">
              {lang === "ar" ? "طريقة الدفع" : "Payment"}
            </h2>
          </div>
          <div className="p-4">
            <div className="flex items-center gap-3 p-4 bg-[#E6F7F8] rounded-xl">
              <CreditCard className="w-5 h-5 text-[#0EA5B5]" />
              <div>
                <p className="font-medium text-sm text-gray-900">
                  {lang === "ar" ? "الدفع عند الاستلام" : "Cash on Delivery"}
                </p>
                <p className="text-xs text-gray-500">
                  {lang === "ar" ? "ادفع عند استلام طلبك" : "Pay when you receive your order"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Total */}
        <div className="bg-gray-50 rounded-2xl p-5">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm text-gray-600">{t("cart.subtotal", lang)}</span>
            <span className="font-medium">{subtotal.toLocaleString()} {t("currency", lang)}</span>
          </div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm text-gray-600">{t("cart.shipping", lang)}</span>
            <span className="font-medium">{shippingPrice.toLocaleString()} {t("currency", lang)}</span>
          </div>
          <div className="border-t mt-2 pt-2 flex justify-between items-center">
            <span className="font-bold text-lg">{t("cart.total", lang)}</span>
            <span className="font-bold text-lg text-[#0EA5B5]">{total.toLocaleString()} {t("currency", lang)}</span>
          </div>
        </div>

        <button
          type="submit"
          disabled={!canSubmit || isSubmitting}
          className="w-full h-14 bg-[#0EA5B5] text-white font-bold text-base rounded-2xl hover:bg-[#0A7A86] transition-colors shadow-lg shadow-[#0EA5B5]/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {isSubmitting ? (
            <span className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            lang === "ar" ? "اطلب الآن" : lang === "fr" ? "Commander" : "Place Order"
          )}
        </button>
      </form>
    </div>
  );
}
