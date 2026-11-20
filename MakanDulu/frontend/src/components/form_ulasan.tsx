import React, { useState } from 'react';

interface FormUlasanProps {
  orderNumber: string;
  restaurantName: string;
  onSubmitReview: (rating: number, tags: string[], comment: string) => void;
  onCancel?: () => void;
}

const FormUlasan: React.FC<FormUlasanProps> = ({
  orderNumber,
  restaurantName,
  onSubmitReview,
  onCancel
}) => {
  const [rating, setRating] = useState(5);
  const [selectedTags, setSelectedTags] = useState<string[]>(['Rasa Mantap', 'Masih Hangat', 'Pengemasan Rapi']);
  const [comment, setComment] = useState('Bebeknya renyah gurih banget, sambal mangganya mantap pedas!');

  const reviewTags = [
    'Rasa Mantap',
    'Masih Hangat',
    'Pengemasan Rapi',
    'Porsi Pas',
    'Sambal Juara',
    'Pelayanan Cepat'
  ];

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmitReview(rating, selectedTags, comment.trim());
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="flex items-center justify-between pb-3 border-b border-[#f0f3ff]">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-[#ffdbce] text-[#a33900] flex items-center justify-center font-bold">
            <span className="material-symbols-outlined text-xl">reviews</span>
          </div>
          <div>
            <h3 className="text-base font-extrabold text-[#111c2d]">Beri Ulasan Hidangan</h3>
            <p className="text-[11px] text-[#5a4138]">
              Pesanan #{orderNumber} • {restaurantName}
            </p>
          </div>
        </div>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="p-1 rounded-lg text-[#5a4138] hover:bg-[#f0f3ff]"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        )}
      </div>

      {/* Star Rating Selector */}
      <div className="text-center py-2 space-y-2">
        <span className="text-xs text-[#5a4138] font-bold uppercase tracking-wider block">
          Bagaimana rasa & kualitas makanan?
        </span>
        <div className="flex items-center justify-center gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              className="text-3xl sm:text-4xl transition-transform hover:scale-110 active:scale-95 focus:outline-none"
            >
              <span className={star <= rating ? 'text-amber-400' : 'text-gray-300'}>
                ★
              </span>
            </button>
          ))}
        </div>
        <span className="text-xs font-black text-[#a33900]">
          {rating === 5 && 'Luar Biasa Sempurna! (5/5)'}
          {rating === 4 && 'Sangat Enak & Puas (4/5)'}
          {rating === 3 && 'Cukup Baik (3/5)'}
          {rating === 2 && 'Kurang Memuaskan (2/5)'}
          {rating === 1 && 'Perlu Peningkatan Kualitas (1/5)'}
        </span>
      </div>

      {/* Review Tags */}
      <div>
        <label className="block text-xs font-bold text-[#111c2d] mb-2 uppercase tracking-wider">
          Pilih Kelebihan Menu:
        </label>
        <div className="flex flex-wrap gap-2">
          {reviewTags.map((tag) => {
            const active = selectedTags.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                  active
                    ? 'bg-[#006c49] text-white border-[#006c49] shadow-2xs'
                    : 'bg-white text-[#5a4138] border-[#dee8ff] hover:bg-[#f0f3ff]'
                }`}
              >
                {active && '✓ '}
                {tag}
              </button>
            );
          })}
        </div>
      </div>

      {/* Comment Field */}
      <div>
        <label className="block text-xs font-bold text-[#111c2d] mb-1.5 uppercase tracking-wider">
          Tulis Komentar atau Saran
        </label>
        <textarea
          rows={3}
          required
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Ceritakan pengalaman Anda menyantap hidangan ini..."
          className="w-full px-3.5 py-2.5 bg-[#f9f9ff] text-xs sm:text-sm rounded-xl border border-[#dee8ff] focus:outline-none focus:ring-2 focus:ring-[#a33900]"
        />
      </div>

      {/* Action Buttons */}
      <div className="pt-3 border-t border-[#f0f3ff] flex items-center justify-end gap-2.5">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 rounded-xl border border-[#dee8ff] text-xs font-bold text-[#5a4138] hover:bg-[#f0f3ff]"
          >
            Nanti Saja
          </button>
        )}
        <button
          type="submit"
          className="px-6 py-2.5 rounded-xl bg-[#a33900] hover:bg-[#cc4900] text-white text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
        >
          <span className="material-symbols-outlined text-base">send</span>
          <span>Kirim Ulasan & Selesaikan</span>
        </button>
      </div>
    </form>
  );
};

export default FormUlasan;
