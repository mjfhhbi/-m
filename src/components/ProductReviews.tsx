import React, { useState } from 'react';
import { Star, MessageSquare, CheckCircle2, User, Send, ShieldCheck } from 'lucide-react';
import { CustomerReview } from '../types';
import { getStoredReviews, saveStoredReview, sanitizeTextInput } from '../utils/storage';

interface ProductReviewsProps {
  productId: string;
  productTitle: string;
}

export const ProductReviews: React.FC<ProductReviewsProps> = ({
  productId,
  productTitle,
}) => {
  const [reviews, setReviews] = useState<CustomerReview[]>(() => getStoredReviews(productId));
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;

    const updated = saveStoredReview({
      productId,
      customerName: name.trim() || 'خریدار محترم',
      rating,
      comment: sanitizeTextInput(comment),
    });

    setReviews(updated.filter((r) => r.productId === productId || r.productId === 'all'));
    setSubmitted(true);
    setName('');
    setComment('');
    setTimeout(() => {
      setSubmitted(false);
      setShowForm(false);
    }, 2000);
  };

  const averageRating = reviews.length > 0
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : '5.0';

  return (
    <div className="space-y-4 pt-4 border-t border-zinc-800 text-right dir-rtl">
      {/* Header & Rating Summary */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-zinc-950/70 p-3.5 rounded-2xl border border-zinc-800/80">
        <div>
          <h4 className="text-xs font-black text-white flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-amber-400" />
            <span>نظرات و تجربیات خریداران ({reviews.length})</span>
          </h4>
          <div className="flex items-center gap-1.5 mt-1">
            <div className="flex items-center text-amber-400">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={`w-3.5 h-3.5 ${
                    s <= Math.round(Number(averageRating)) ? 'fill-amber-400' : 'text-zinc-600'
                  }`}
                />
              ))}
            </div>
            <span className="text-xs font-bold text-amber-400 font-mono">{averageRating}</span>
            <span className="text-[10px] text-zinc-500">از ۵ امتیاز رضایت مشتریان</span>
          </div>
        </div>

        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors shrink-0"
        >
          {showForm ? 'بستن فرم نظر' : '✍️ ثبت تجربه خرید'}
        </button>
      </div>

      {/* Review Submission Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-zinc-950 p-4 rounded-2xl border border-amber-500/30 space-y-3">
          <span className="text-xs font-bold text-white block">ثبت نظر برای {productTitle}</span>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-zinc-400 mb-1">نام و شهر شما (اختیاری):</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="مثلاً: علی از تهران"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-[11px] text-zinc-400 mb-1">امتیاز به کیفیت و فریم:</label>
              <div className="flex items-center gap-1.5 pt-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setRating(s)}
                    className="p-1 hover:scale-110 transition-transform"
                  >
                    <Star
                      className={`w-5 h-5 ${
                        s <= rating ? 'fill-amber-400 text-amber-400' : 'text-zinc-600'
                      }`}
                    />
                  </button>
                ))}
                <span className="text-xs text-amber-400 font-bold mr-2">({rating} ستاره)</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[11px] text-zinc-400 mb-1">متن نظر یا تجربه استفاده:</label>
            <textarea
              rows={2}
              required
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="نظرتان درباره وضوح عدسی، سبکی فریم، بسته‌بندی یا ارسال..."
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-[10px] text-zinc-500 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>نظرات پس از ثبت در سایت منتشر خواهند شد.</span>
            </span>

            <button
              type="submit"
              disabled={submitted}
              className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-extrabold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow-md"
            >
              {submitted ? 'با تشکر! ثبت شد' : 'ارسال نظر'}
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      )}

      {/* Reviews List */}
      <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
        {reviews.map((rev) => (
          <div
            key={rev.id}
            className="bg-zinc-950/60 border border-zinc-800/60 p-3 rounded-xl space-y-1.5"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-300 text-xs font-bold">
                  <User className="w-3.5 h-3.5 text-amber-400" />
                </span>
                <span className="text-xs font-bold text-zinc-200">{rev.customerName}</span>
                {rev.isVerifiedPurchase && (
                  <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.2 rounded-md">
                    <CheckCircle2 className="w-2.5 h-2.5" />
                    <span>خریدار تایید شده</span>
                  </span>
                )}
              </div>

              <div className="flex items-center text-amber-400">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`w-3 h-3 ${s <= rev.rating ? 'fill-amber-400' : 'text-zinc-700'}`}
                  />
                ))}
              </div>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed pt-0.5">
              {rev.comment}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
