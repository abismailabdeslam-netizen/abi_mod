import { useState } from "react";
import { useParams, Link } from "react-router";
import { ShoppingCart, Check, Minus, Plus, ChevronRight, Truck, Star, Send, User } from "lucide-react";
import { useLangStore, useCartStore, useAppStore } from "@/lib/store";
import { t } from "@/lib/i18n";
import trpc from "@/lib/trpc";
import ProductCard from "@/components/ProductCard";

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { lang} = useLangStore();
  const addItem = useCartStore((s) => s.addItem);
  const setToast = useAppStore((s) => s.setToast);
  const [selectedColor, setSelectedColor] = useState<string | undefined>();
  const [selectedSize, setSelectedSize] = useState<string | undefined>();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [reviewName, setReviewName] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");

  const { data: product, isLoading } = trpc.product.getBySlug.useQuery(
    { slug: slug! },
    { enabled: !!slug }
  );

  const { data: related } = trpc.product.related.useQuery(
    { productId: product?.id ?? 0, limit: 8 },
    { enabled: !!product }
  );

  const { data: reviews } = trpc.review.list.useQuery(
    { productId: product?.id ?? 0 },
    { enabled: !!product }
  );

  const utils = trpc.useUtils();

  const createReview = trpc.review.create.useMutation({
    onSuccess: () => {
      setReviewName("");
      setReviewRating(5);
      setReviewComment("");
      utils.review.list.invalidate();
      setToast({
        message: lang === "ar" ? "شكراً لتقييمك!" : lang === "fr" ? "Merci pour votre avis!" : "Thank you for your review!",
        type: "success",
      });
    },
    onError: () => {
      setToast({
        message: lang === "ar" ? "حدث خطأ" : lang === "fr" ? "Une erreur s'est produite" : "Something went wrong",
        type: "error",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-10">
          <div className="aspect-[3/4] bg-gray-100 rounded-2xl animate-pulse" />
          <div className="space-y-4">
            <div className="h-6 bg-gray-100 rounded animate-pulse w-1/3" />
            <div className="h-8 bg-gray-100 rounded animate-pulse w-3/4" />
            <div className="h-4 bg-gray-100 rounded animate-pulse w-1/2" />
            <div className="h-20 bg-gray-100 rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h2 className="text-xl font-semibold text-gray-700">
          {lang === "ar" ? "المنتج غير موجود" : "Product not found"}
        </h2>
      </div>
    );
  }

  const name = lang === "ar" ? product.nameAr || product.nameEn : lang === "fr" ? product.nameFr || product.nameEn : product.nameEn;
  const description = lang === "ar" ? product.descriptionAr || product.descriptionEn : lang === "fr" ? product.descriptionFr || product.descriptionEn : product.descriptionEn;
  const images = (product.images as string[] | null) ?? [];
  const colors = (product.colors as string[] | null) ?? [];
  const sizes = (product.sizes as string[] | null) ?? [];
  const price = Number(product.price);
  const oldPrice = product.oldPrice ? Number(product.oldPrice) : null;
  const isOutOfStock = (product.stockQuantity ?? 0) <= 0;

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    addItem({
      productId: product.id,
      name: product.nameEn,
      price,
      image: images[0] || "",
      color: selectedColor,
      size: selectedSize,
      quantity,
    });
    setAdded(true);
    setToast({
      message: lang === "ar" ? "أضيف إلى السلة" : lang === "fr" ? "Ajouté au panier" : "Added to cart",
      type: "success",
    });
    setTimeout(() => setAdded(false), 1500);
  };

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewName.trim() || !product) return;
    createReview.mutate({
      productId: product.id,
      customerName: reviewName.trim(),
      rating: reviewRating,
      comment: reviewComment.trim() || undefined,
    });
  };

  // Calculate average rating
  const avgRating = reviews && reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : "0";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 pb-24">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link to="/" className="hover:text-[#0EA5B5]">{t("nav.home", lang)}</Link>
        <ChevronRight className="w-4 h-4" />
        <Link to="/products" className="hover:text-[#0EA5B5]">{t("nav.shop", lang)}</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-gray-700">{name}</span>
      </nav>

      <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Images */}
        <div className="space-y-4">
          <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-gray-50">
            {images[0] && (
              <img src={images[0]} alt={name} className="w-full h-full object-cover" />
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {images.map((img, i) => (
                <div key={i} className="w-20 h-20 rounded-lg overflow-hidden bg-gray-50 shrink-0 border-2 border-[#0EA5B5]">
                  <img src={img} alt={`${name} ${i + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          <span className="inline-block bg-[#E6F7F8] text-[#0EA5B5] text-xs font-semibold px-3 py-1 rounded-full mb-3">
            {product.categoryName || (lang === "ar" ? "ملابس" : "Clothing")}
          </span>

          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-3">
            {name}
          </h1>

          {/* Rating */}
          {reviews && reviews.length > 0 && (
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < Math.round(Number(avgRating))
                        ? "text-amber-400 fill-amber-400"
                        : "text-gray-200"
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm font-medium text-gray-700">{avgRating}</span>
              <span className="text-sm text-gray-400">({reviews.length} {t("product.reviews", lang)})</span>
            </div>
          )}

          <div className="flex items-center gap-3 mb-6">
            <span className="text-3xl font-bold text-gray-900">
              {price.toLocaleString()} {t("currency", lang)}
            </span>
            {oldPrice && (
              <span className="text-lg text-gray-400 line-through">
                {oldPrice.toLocaleString()}
              </span>
            )}
          </div>

          <p className="text-gray-600 leading-relaxed mb-6">{description}</p>

          {/* Colors */}
          {colors.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                {t("product.color", lang)}
              </h3>
              <div className="flex flex-wrap gap-2">
                {colors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`h-10 px-4 rounded-xl border-2 text-sm font-medium transition-colors ${
                      selectedColor === color
                        ? "border-[#0EA5B5] bg-[#E6F7F8] text-[#0EA5B5]"
                        : "border-gray-200 text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Sizes */}
          {sizes.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                {t("product.size", lang)}
              </h3>
              <div className="flex flex-wrap gap-2">
                {sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`w-12 h-12 rounded-xl border-2 text-sm font-medium transition-colors flex items-center justify-center ${
                      selectedSize === size
                        ? "border-[#0EA5B5] bg-[#E6F7F8] text-[#0EA5B5]"
                        : "border-gray-200 text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              {t("product.quantity", lang)}
            </h3>
            <div className="inline-flex items-center h-11 border border-gray-200 rounded-xl overflow-hidden">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-11 h-full flex items-center justify-center text-gray-600 hover:bg-gray-50"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-14 h-full flex items-center justify-center text-sm font-semibold border-x border-gray-200">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity((q) => Math.min(10, q + 1))}
                className="w-11 h-full flex items-center justify-center text-gray-600 hover:bg-gray-50"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Add to Cart */}
          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock || added}
            className={`w-full h-14 rounded-2xl font-semibold text-base flex items-center justify-center gap-2 transition-all ${
              added
                ? "bg-green-500 text-white"
                : isOutOfStock
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-[#0EA5B5] text-white hover:bg-[#0A7A86] shadow-lg shadow-[#0EA5B5]/20"
            }`}
          >
            {added ? (
              <>
                <Check className="w-5 h-5" />
                {lang === "ar" ? "أضيف" : "Added!"}
              </>
            ) : (
              <>
                <ShoppingCart className="w-5 h-5" />
                {isOutOfStock
                  ? t("product.outOfStock", lang)
                  : t("product.addToCart", lang)}
              </>
            )}
          </button>

          {/* Delivery Info */}
          <div className="mt-6 bg-gray-50 rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <Truck className="w-5 h-5 text-[#0EA5B5] shrink-0" />
              <span className="text-gray-600">
                {lang === "ar"
                  ? "شحن مجاني من 5000 د.ج"
                  : "Free delivery from 5000 DZD"}
              </span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Check className="w-5 h-5 text-[#0EA5B5] shrink-0" />
              <span className="text-gray-600">
                {lang === "ar"
                  ? "قطن عضوي 100%"
                  : "100% Organic Cotton"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="mt-16 border-t border-gray-100 pt-12">
        <h2 className="text-xl font-bold text-gray-900 mb-6">
          {t("product.reviews", lang)}
          {reviews && reviews.length > 0 && (
            <span className="text-sm font-normal text-gray-400 ml-2">({reviews.length})</span>
          )}
        </h2>

        {/* Existing Reviews */}
        {reviews && reviews.length > 0 ? (
          <div className="space-y-4 mb-10">
            {reviews.map((review) => (
              <div key={review.id} className="bg-white border border-gray-100 rounded-2xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-full bg-[#E6F7F8] flex items-center justify-center">
                    <User className="w-4 h-4 text-[#0EA5B5]" />
                  </div>
                  <div>
                    <p className="font-medium text-sm text-gray-900">{review.customerName}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(review.createdAt ?? new Date()).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="ml-auto flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < review.rating
                            ? "text-amber-400 fill-amber-400"
                            : "text-gray-200"
                        }`}
                      />
                    ))}
                  </div>
                </div>
                {review.comment && (
                  <p className="text-sm text-gray-600 leading-relaxed">{review.comment}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-sm mb-8">
            {lang === "ar" ? "لا توجد تقييمات بعد. كن الأول!" : lang === "fr" ? "Pas encore d'avis. Soyez le premier!" : "No reviews yet. Be the first!"}
          </p>
        )}

        {/* Submit Review */}
        <div className="bg-gray-50 rounded-2xl p-6">
          <h3 className="font-semibold text-gray-900 mb-4">
            {lang === "ar" ? "اكتب تقييماً" : lang === "fr" ? "Écrire un avis" : "Write a Review"}
          </h3>
          <form onSubmit={handleSubmitReview} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {lang === "ar" ? "اسمك" : lang === "fr" ? "Votre nom" : "Your Name"}
              </label>
              <input
                type="text"
                value={reviewName}
                onChange={(e) => setReviewName(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-[#0EA5B5] outline-none bg-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {lang === "ar" ? "التقييم" : lang === "fr" ? "Note" : "Rating"}
              </label>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setReviewRating(star)}
                    className="p-0.5"
                  >
                    <Star
                      className={`w-6 h-6 transition-colors ${
                        star <= reviewRating
                          ? "text-amber-400 fill-amber-400"
                          : "text-gray-200"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {lang === "ar" ? "تعليق (اختياري)" : lang === "fr" ? "Commentaire (optionnel)" : "Comment (optional)"}
              </label>
              <textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-[#0EA5B5] outline-none resize-none bg-white"
              />
            </div>
            <button
              type="submit"
              disabled={createReview.isPending || !reviewName.trim()}
              className="inline-flex items-center gap-2 h-11 px-6 bg-[#0EA5B5] text-white font-medium rounded-xl hover:bg-[#0A7A86] transition-colors disabled:opacity-50 text-sm"
            >
              <Send className="w-4 h-4" />
              {createReview.isPending
                ? lang === "ar" ? "جاري الإرسال..." : "Submitting..."
                : lang === "ar" ? "إرسال التقييم" : lang === "fr" ? "Envoyer" : "Submit Review"}
            </button>
            <p className="text-xs text-gray-400">
              {lang === "ar" ? "سيتم عرض تقييمك بعد الموافقة عليه" : lang === "fr" ? "Votre avis sera affiché après approbation" : "Your review will be shown after approval"}
            </p>
          </form>
        </div>
      </div>

      {/* Related Products */}
      {related && related.length > 0 && (
        <div className="mt-16">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            {t("product.related", lang)}
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {related.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
