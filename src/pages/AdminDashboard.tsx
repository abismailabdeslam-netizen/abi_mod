import { Link } from "react-router";
import {
  ShoppingCart,
  Package,
  Banknote,
  Clock,
  Star,
  TrendingUp,
  Eye,
} from "lucide-react";
import trpc from "@/lib/trpc";

export default function AdminDashboard() {
  const { data, isLoading } = trpc.analytics.dashboard.useQuery();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-gray-100 p-6 animate-pulse"
            >
              <div className="h-12 w-12 bg-gray-100 rounded-xl mb-4" />
              <div className="h-8 bg-gray-100 rounded mb-2" />
              <div className="h-4 w-20 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const stats = [
    {
      label: "Total Orders",
      value: data?.totalOrders ?? 0,
      icon: ShoppingCart,
      bg: "bg-blue-50",
      text: "text-blue-600",
    },
    {
      label: "Financial Revenue",
      value: `${(data?.totalRevenue ?? 0).toLocaleString()} DZD`,
      icon: Banknote,
      bg: "bg-green-50",
      text: "text-green-600",
    },
    {
      label: "Products",
      value: data?.totalProducts ?? 0,
      icon: Package,
      bg: "bg-purple-50",
      text: "text-purple-600",
    },
    {
      label: "Pending Orders",
      value: data?.pendingOrders ?? 0,
      icon: Clock,
      bg: "bg-amber-50",
      text: "text-amber-600",
    },
    {
      label: "Avg Rating",
      value: `${data?.avgRating ?? 0} / 5`,
      icon: Star,
      bg: "bg-rose-50",
      text: "text-rose-600",
    },
  ];

  // Order status counts
  const statusCounts = data?.ordersByStatus ?? [];
  const statusColors: Record<string, string> = {
    pending: "bg-amber-100 text-amber-700",
    confirmed: "bg-blue-100 text-blue-700",
    shipped: "bg-purple-100 text-purple-700",
    delivered: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-700",
    not_reached: "bg-orange-100 text-orange-700",
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-md transition-shadow"
          >
            <div
              className={`w-12 h-12 rounded-xl ${stat.bg} flex items-center justify-center mb-4`}
            >
              <stat.icon className={`w-6 h-6 ${stat.text}`} />
            </div>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Order Status Summary */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="font-semibold text-lg mb-4">Orders by Status</h2>
        <div className="flex flex-wrap gap-3">
          {statusCounts.map((s) => (
            <div
              key={s.status}
              className={`px-4 py-3 rounded-xl ${statusColors[s.status] ?? "bg-gray-100 text-gray-700"}`}
            >
              <p className="text-2xl font-bold">{s.count}</p>
              <p className="text-xs font-medium capitalize">{s.status}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-lg">Recent Orders</h2>
          <Link
            to="/admin/orders"
            className="text-sm text-[#0EA5B5] hover:text-[#0A7A86] font-medium"
          >
            View All
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50/50 text-gray-500 text-xs uppercase">
                <th className="text-left px-5 py-3 font-semibold">Order #</th>
                <th className="text-left px-5 py-3 font-semibold">Customer</th>
                <th className="text-left px-5 py-3 font-semibold">Total</th>
                <th className="text-left px-5 py-3 font-semibold">Status</th>
                <th className="text-left px-5 py-3 font-semibold">Date</th>
              </tr>
            </thead>
            <tbody>
              {data?.recentOrders?.slice(0, 10).map((order) => (
                <tr
                  key={order.id}
                  className="border-t border-gray-50 hover:bg-gray-50/50 transition-colors"
                >
                  <td className="px-5 py-3 font-medium text-gray-900">
                    {order.orderNumber}
                  </td>
                  <td className="px-5 py-3 text-gray-600">{order.fullName}</td>
                  <td className="px-5 py-3 font-medium">
                    {Number(order.total).toLocaleString()} DZD
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        statusColors[order.status] ?? "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-500 text-xs">
                    {new Date(order.createdAt ?? new Date()).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {(!data?.recentOrders || data.recentOrders.length === 0) && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-8 text-center text-gray-400"
                  >
                    No orders yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top Products */}
      {data?.topProducts && data.topProducts.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <h2 className="font-semibold text-lg">Top Products</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50/50 text-gray-500 text-xs uppercase">
                  <th className="text-left px-5 py-3 font-semibold">Product</th>
                  <th className="text-left px-5 py-3 font-semibold">Sold</th>
                  <th className="text-left px-5 py-3 font-semibold">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {data.topProducts.map((p, i) => (
                  <tr key={i} className="border-t border-gray-50">
                    <td className="px-5 py-3 font-medium text-gray-900">
                      {p.name}
                    </td>
                    <td className="px-5 py-3 text-gray-600">{p.sold}</td>
                    <td className="px-5 py-3 font-medium">
                      {p.revenue.toLocaleString()} DZD
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
