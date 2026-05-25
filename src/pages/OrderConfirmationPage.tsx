import { Link, useSearchParams } from "react-router";
import { CheckCircle, ShoppingBag } from "lucide-react";
import { useLangStore } from "@/lib/store";
import { t } from "@/lib/i18n";
import trpc from "@/lib/trpc";

export default function OrderConfirmationPage() {
  const { lang } = useLangStore();
  const [searchParams] = useSearchParams();
  const orderId = Number(searchParams.get("id"));

  const { data: order } = trpc.order.getById.useQuery(
    { id: orderId },
    { enabled: orderId > 0 }
  );

  const { data: settings } = trpc.settings.getAll.useQuery();

  return (
    <div className="max-w-md mx-auto px-4 py-16 text-center">
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <CheckCircle className="w-10 h-10 text-green-500" />
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-3">
        {t("order.success", lang)}
      </h1>
      <p className="text-gray-600 mb-8">{t("order.thanks", lang)}</p>

      {order && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-8">
          <p className="text-sm text-gray-500 mb-1">{t("order.orderNumber", lang)}</p>
          <p className="text-xl font-bold text-[#0EA5B5] mb-4">{order.orderNumber}</p>

          <div className="border-t pt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">{t("cart.subtotal", lang)}</span>
              <span className="font-medium">{Number(order.subtotal).toLocaleString()} {t("currency", lang)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">{t("cart.shipping", lang)}</span>
              <span className="font-medium">{Number(order.shippingPrice).toLocaleString()} {t("currency", lang)}</span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="font-semibold">{t("cart.total", lang)}</span>
              <span className="font-bold text-[#0EA5B5]">{Number(order.total).toLocaleString()} {t("currency", lang)}</span>
            </div>
          </div>
        </div>
      )}

      {settings?.whatsappNumber && (
        <a
          href={`https://wa.me/${settings.whatsappNumber}?text=${encodeURIComponent(`Order ${order?.orderNumber ?? ""} - Question`)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full h-12 bg-[#25D366] text-white font-semibold rounded-2xl hover:bg-[#128C7E] transition-colors flex items-center justify-center gap-2 mb-3"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
          {t("order.whatsapp", lang)}
        </a>
      )}

      <Link
        to="/products"
        className="block w-full h-12 text-[#0EA5B5] font-semibold border-2 border-[#0EA5B5] rounded-2xl hover:bg-[#E6F7F8] transition-colors flex items-center justify-center gap-2"
      >
        <ShoppingBag className="w-4 h-4" />
        {t("cart.continue", lang)}
      </Link>
    </div>
  );
}
