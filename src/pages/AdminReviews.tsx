import { useState } from "react";
import { Search, Check, X, Trash2, Star, User, Clock } from "lucide-react";
import trpc from "@/lib/trpc";

const tabs = [
  { key: "", label: "All" },
  { key: "pending", label: "Pending Approval" },
  { key: "approved", label: "Approved" },
];

export default function AdminReviews() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [productFilter, setProductFilter] = useState<number>(0);
  const [starFilter, setStarFilter] = useState<number>(0);
  const [page] = useState(1);

  const utils = trpc.useUtils();

  const { data, isLoading } = trpc.review.adminList.useQuery({
    page,
    limit: 20,
    isApproved: statusFilter === "approved" ? true : statusFilter === "pending" ? false : undefined,
  });

  const { data: productsData } = trpc.product.adminList.useQuery(
    { page: 1, limit: 100 },
    { enabled: true }
  );

  const approveReview = trpc.review.approve.useMutation({
    onSuccess: () => {
      utils.review.adminList.invalidate();
      utils.analytics.dashboard.invalidate();
    },
  });

  const deleteReview = trpc.review.delete.useMutation({
    onSuccess: () => {
      utils.review.adminList.invalidate();
    },
  });

  const getProductName = (productId: number) => {
    return productsData?.products.find((p) => p.id === productId)?.nameEn ?? `Product #${productId}`;
  };

  const filteredReviews = data?.reviews.filter((r) => {
    if (productFilter && r.productId !== productFilter) return false;
    if (starFilter && r.rating !== starFilter) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      r.customerName.toLowerCase().includes(q) ||
      r.comment?.toLowerCase().includes(q) ||
      getProductName(r.productId).toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reviews</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage customer product reviews
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search reviews..."
            className="w-full h-10 pl-9 pr-4 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-[#0EA5B5] outline-none"
          />
        </div>
        {/* Filter by Product */}
        <select
          value={productFilter}
          onChange={(e) => setProductFilter(Number(e.target.value))}
          className="h-10 px-3 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-[#0EA5B5] outline-none"
        >
          <option value={0}>All Products</option>
          {productsData?.products.map((p) => (
            <option key={p.id} value={p.id}>{p.nameEn}</option>
          ))}
        </select>
        {/* Filter by Stars */}
        <select
          value={starFilter}
          onChange={(e) => setStarFilter(Number(e.target.value))}
          className="h-10 px-3 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-[#0EA5B5] outline-none"
        >
          <option value={0}>All Stars</option>
          {[5,4,3,2,1].map((s) => <option key={s} value={s}>{"⭐".repeat(s)} ({s})</option>)}
        </select>
      </div>

      {/* Tabs */}
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

      {/* Reviews Grid - Card Layout */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse h-48"
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
          {filteredReviews?.map((review) => (
            <div
              key={review.id}
              className={`bg-white rounded-2xl border overflow-hidden hover:shadow-md transition-shadow ${
                !review.isApproved ? "border-amber-200" : "border-gray-100"
              }`}
            >
              {/* Card Header */}
              <div className="p-4 border-b border-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-[#E6F7F8] flex items-center justify-center">
                      <User className="w-4 h-4 text-[#0EA5B5]" />
                    </div>
                    <span className="font-semibold text-gray-900 text-sm">
                      {review.customerName}
                    </span>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      review.isApproved
                        ? "bg-green-100 text-green-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {review.isApproved ? "Approved" : "Pending"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${
                          i < review.rating
                            ? "text-amber-400 fill-amber-400"
                            : "text-gray-200"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-gray-400">
                    {review.rating}/5
                  </span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-4 space-y-3">
                {review.comment && (
                  <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">
                    "{review.comment}"
                  </p>
                )}
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <span className="font-medium text-gray-500">
                    Product:
                  </span>
                  <span>{getProductName(review.productId)}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                  <Clock className="w-3.5 h-3.5" />
                  {new Date(review.createdAt ?? new Date()).toLocaleDateString(
                    "en-US",
                    {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    }
                  )}
                </div>
              </div>

              {/* Card Actions */}
              <div className="p-3 border-t border-gray-50 bg-gray-50/50 flex items-center gap-2">
                {!review.isApproved && (
                  <button
                    onClick={() => approveReview.mutate({ id: review.id })}
                    disabled={approveReview.isPending}
                    className="flex-1 flex items-center justify-center gap-1.5 h-9 bg-green-500 text-white rounded-lg text-xs font-medium hover:bg-green-600 transition-colors disabled:opacity-50"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Approve
                  </button>
                )}
                <button
                  onClick={() => {
                    if (confirm("Delete this review permanently?")) {
                      deleteReview.mutate({ id: review.id });
                    }
                  }}
                  disabled={deleteReview.isPending}
                  className={`flex items-center justify-center gap-1.5 h-9 px-3 bg-white border border-red-200 text-red-500 rounded-lg text-xs font-medium hover:bg-red-50 transition-colors disabled:opacity-50 ${
                    review.isApproved ? "flex-1" : ""
                  }`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {filteredReviews?.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <Star className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No reviews found</p>
        </div>
      )}
    </div>
  );
}
