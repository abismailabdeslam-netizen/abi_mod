import { useState } from "react";
import {
  Search,
  Check,
  X,
  Trash2,
  Phone,
  MapPin,
  Package,
  Truck,
  Eye,
  AlertTriangle,
} from "lucide-react";
import trpc from "@/lib/trpc";

const statusColors: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700 border-amber-200",
  confirmed: "bg-blue-100 text-blue-700 border-blue-200",
  shipped: "bg-purple-100 text-purple-700 border-purple-200",
  delivered: "bg-green-100 text-green-700 border-green-200",
  cancelled: "bg-red-100 text-red-700 border-red-200",
  not_reached: "bg-orange-100 text-orange-700 border-orange-200",
};

const statusLabels: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  not_reached: "Not Reached",
};

const tabs = [
  { key: "", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "confirmed", label: "Confirmed" },
  { key: "shipped", label: "Shipped" },
  { key: "not_reached", label: "Not Reached" },
  { key: "cancelled", label: "Cancelled" },
];

export default function AdminOrders() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [page] = useState(1);
  const [detailOrderId, setDetailOrderId] = useState<number | null>(null);

  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.order.adminList.useQuery({
    page,
    limit: 20,
    search: search || undefined,
    status: (statusFilter as any) || undefined,
  });

  const { data: orderDetail } = trpc.order.getDetail.useQuery(
    { id: detailOrderId! },
    { enabled: detailOrderId !== null }
  );

  const updateStatus = trpc.order.updateStatus.useMutation({
    onSuccess: () => {
      utils.order.adminList.invalidate();
      utils.order.getDetail.invalidate();
      utils.analytics.dashboard.invalidate();
    },
  });

  const deleteOrder = trpc.order.delete.useMutation({
    onSuccess: () => {
      utils.order.adminList.invalidate();
      utils.analytics.dashboard.invalidate();
      setDetailOrderId(null);
    },
  });

  const handleConfirm = (id: number) => {
    updateStatus.mutate({ id, status: "confirmed" });
  };

  const handleCancel = (id: number) => {
    updateStatus.mutate({ id, status: "cancelled" });
  };

  const handleNotReached = (id: number) => {
    updateStatus.mutate({ id, status: "not_reached" });
  };

  const handleDelete = (id: number) => {
    if (confirm("Delete this order permanently?")) {
      deleteOrder.mutate({ id });
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Orders</h1>

      {/* Search and Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search orders..."
            className="w-full h-10 pl-9 pr-4 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-[#0EA5B5] outline-none"
          />
        </div>
      </div>

      {/* Status Tabs */}
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              statusFilter === tab.key
                ? "bg-[#0EA5B5] text-white"
                : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {tab.label}
            {tab.key === "" && data?.total !== undefined && (
              <span className="ml-1.5 text-xs opacity-70">({data.total})</span>
            )}
          </button>
        ))}
      </div>

      {/* Orders Grid - Card Layout */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse h-64"
            >
              <div className="h-4 bg-gray-100 rounded w-1/3 mb-4" />
              <div className="h-3 bg-gray-100 rounded w-2/3 mb-3" />
              <div className="h-3 bg-gray-100 rounded w-1/2 mb-6" />
              <div className="space-y-2">
                <div className="h-3 bg-gray-100 rounded" />
                <div className="h-3 bg-gray-100 rounded w-4/5" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {data?.orders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Card Header */}
              <div className="p-4 border-b border-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-gray-900 text-sm">
                    {order.orderNumber}
                  </span>
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                      statusColors[order.status]
                    }`}
                  >
                    {statusLabels[order.status]}
                  </span>
                </div>
                <p className="text-xs text-gray-400">
                  {new Date(order.createdAt ?? new Date()).toLocaleDateString(
                    "en-US",
                    {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    }
                  )}
                </p>
              </div>

              {/* Card Body */}
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-gray-400 shrink-0" />
                  <span className="text-sm text-gray-700">{order.fullName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                  <span className="text-sm text-gray-700">{order.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                  <span className="text-sm text-gray-700">
                    {order.wilaya} - {order.commune}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-gray-400 shrink-0" />
                  <span className="text-sm text-gray-700 capitalize">
                    {order.deliveryType} Delivery
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                  <span className="text-xs text-gray-500">Shipping</span>
                  <span className="text-sm font-medium">
                    {Number(order.shippingPrice).toLocaleString()} DZD
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Total</span>
                  <span className="text-lg font-bold text-[#0EA5B5]">
                    {Number(order.total).toLocaleString()} DZD
                  </span>
                </div>
              </div>

              {/* Card Actions */}
              <div className="p-3 border-t border-gray-50 bg-gray-50/50 flex items-center gap-2">
                {order.status === "pending" && (
                  <>
                    <button
                      onClick={() => handleConfirm(order.id)}
                      disabled={updateStatus.isPending}
                      className="flex-1 flex items-center justify-center gap-1.5 h-9 bg-green-500 text-white rounded-lg text-xs font-medium hover:bg-green-600 transition-colors disabled:opacity-50"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Confirm
                    </button>
                    <button
                      onClick={() => handleCancel(order.id)}
                      disabled={updateStatus.isPending}
                      className="flex-1 flex items-center justify-center gap-1.5 h-9 bg-red-500 text-white rounded-lg text-xs font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
                    >
                      <X className="w-3.5 h-3.5" />
                      Cancel
                    </button>
                  </>
                )}
                {order.status === "confirmed" && (
                  <>
                    <button
                      onClick={() => handleNotReached(order.id)}
                      disabled={updateStatus.isPending}
                      className="flex-1 flex items-center justify-center gap-1.5 h-9 bg-orange-500 text-white rounded-lg text-xs font-medium hover:bg-orange-600 transition-colors disabled:opacity-50"
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Not Reached
                    </button>
                    <button
                      onClick={() =>
                        updateStatus.mutate({ id: order.id, status: "shipped" })
                      }
                      disabled={updateStatus.isPending}
                      className="flex-1 flex items-center justify-center gap-1.5 h-9 bg-purple-500 text-white rounded-lg text-xs font-medium hover:bg-purple-600 transition-colors disabled:opacity-50"
                    >
                      <Truck className="w-3.5 h-3.5" />
                      Ship
                    </button>
                  </>
                )}
                <button
                  onClick={() => setDetailOrderId(order.id)}
                  className="flex items-center justify-center gap-1.5 h-9 px-3 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Details
                </button>
                <button
                  onClick={() => handleDelete(order.id)}
                  disabled={deleteOrder.isPending}
                  className="flex items-center justify-center h-9 w-9 bg-white border border-red-200 rounded-lg text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {data?.orders.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No orders found</p>
        </div>
      )}

      {/* Detail Modal */}
      {orderDetail && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setDetailOrderId(null)}
          />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-lg">
                  {orderDetail.orderNumber}
                </h2>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border mt-1 ${
                    statusColors[orderDetail.status]
                  }`}
                >
                  {statusLabels[orderDetail.status]}
                </span>
              </div>
              <button
                onClick={() => setDetailOrderId(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Customer</p>
                  <p className="font-medium text-sm">{orderDetail.fullName}</p>
                  <p className="text-sm text-gray-600">{orderDetail.phone}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Address</p>
                  <p className="text-sm">
                    {orderDetail.wilaya}, {orderDetail.commune}
                  </p>
                  <p className="text-sm text-gray-600 capitalize">
                    {orderDetail.deliveryType} Delivery
                  </p>
                </div>
              </div>

              {/* Products */}
              <div className="border-t pt-4">
                <p className="text-xs text-gray-500 mb-2 font-medium">
                  Products
                </p>
                {orderDetail.items?.map((item) => {
                  let image = "";
                  try {
                    const parsed = JSON.parse(item.productImage || "[]");
                    image = Array.isArray(parsed)
                      ? parsed[0] ?? ""
                      : item.productImage || "";
                  } catch {
                    image = item.productImage || "";
                  }
                  return (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0"
                    >
                      <img
                        src={image || ""}
                        alt={item.productName}
                        className="w-10 h-10 rounded-lg object-cover bg-gray-100"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {item.productName}
                        </p>
                        <p className="text-xs text-gray-500">
                          x{item.quantity}
                          {item.color && ` | ${item.color}`}
                          {item.size && ` | ${item.size}`}
                        </p>
                      </div>
                      <span className="text-sm font-medium">
                        {Number(item.price).toLocaleString()} DZD
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Price Breakdown */}
              <div className="border-t pt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Subtotal</span>
                  <span>
                    {Number(orderDetail.subtotal).toLocaleString()} DZD
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Shipping</span>
                  <span>
                    {Number(orderDetail.shippingPrice).toLocaleString()} DZD
                  </span>
                </div>
                <div className="flex justify-between font-bold text-base pt-2 border-t">
                  <span>Total</span>
                  <span className="text-[#0EA5B5]">
                    {Number(orderDetail.total).toLocaleString()} DZD
                  </span>
                </div>
              </div>

              {/* Status Update */}
              <div className="border-t pt-4">
                <p className="text-xs text-gray-500 mb-2 font-medium">
                  Update Status
                </p>
                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      "pending",
                      "confirmed",
                      "shipped",
                      "delivered",
                      "cancelled",
                      "not_reached",
                    ] as const
                  ).map((s) => (
                    <button
                      key={s}
                      onClick={() =>
                        updateStatus.mutate({ id: orderDetail.id, status: s })
                      }
                      disabled={
                        orderDetail.status === s || updateStatus.isPending
                      }
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                        orderDetail.status === s
                          ? statusColors[s] + " border-transparent"
                          : "border-gray-200 text-gray-600 hover:border-[#0EA5B5] hover:text-[#0EA5B5]"
                      }`}
                    >
                      {statusLabels[s]}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => handleDelete(orderDetail.id)}
                className="w-full h-10 flex items-center justify-center gap-2 text-red-500 border border-red-200 rounded-xl text-sm hover:bg-red-50 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Delete Order Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
