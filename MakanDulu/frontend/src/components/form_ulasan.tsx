import React, { useState } from 'react';

export interface FormUlasanProps {
  orderNumber: string;
  restaurantName: string;
  onSubmitReview: (rating: number, tags: string[], comment: string, photoUrl?: string) => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
}

const FormUlasan: React.FC<FormUlasanProps> = ({
  orderNumber,
  restaurantName,
  onSubmitReview,
  onCancel,
  isSubmitting = false,
}) => {
  const [rating, setRating] = useState(5);
  const [selectedTags, setSelectedTags] = useState<string[]>(['Rasa Mantap', 'Masih Hangat', 'Pengemasan Rapi']);
  const [comment, setComment] = useState('Makanan lezat, bumbunya meresap sempurna, pengiriman tepat waktu!');
  const [fotoUrl, setFotoUrl] = useState<string>('');
  const [modeInputFoto, setModeInputFoto] = useState<'upload' | 'url'>('upload');

  const reviewTags = [
    'Rasa Mantap',
    'Masih Hangat',
    'Pengemasan Rapi',
    'Porsi Pas',
    'Sambal Juara',
    'Pelayanan Cepat'
  ];

  const contohFotoMakanan = [
    { label: 'Ayam Geprek', url: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=600&q=80' },
    { label: 'Nasi Goreng', url: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=600&q=80' },
    { label: 'Sate Ayam', url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=600&q=80' },
  ];

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFotoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmitReview(rating, selectedTags, comment.trim(), fotoUrl.trim() || undefined);
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
            disabled={isSubmitting}
            className="p-1 rounded-lg text-[#5a4138] hover:bg-[#f0f3ff]"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        )}
      </div>

      {/* Star Rating Selector (Bintang 1-5) */}
      <div className="text-center py-2 space-y-2 bg-[#f9f9ff] rounded-2xl p-4 border border-[#dee8ff]">
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

      {/* Comment Field (Ulasan Teks) */}
      <div>
        <label className="block text-xs font-bold text-[#111c2d] mb-1.5 uppercase tracking-wider">
          Tulis Ulasan atau Saran Makanan
        </label>
        <textarea
          rows={3}
          required
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Ceritakan pengalaman Anda menyantap hidangan ini (rasa bumbu, kelezatan, dsb)..."
          className="w-full px-3.5 py-2.5 bg-[#f9f9ff] text-xs sm:text-sm rounded-xl border border-[#dee8ff] focus:outline-none focus:ring-2 focus:ring-[#a33900]"
        />
      </div>

      {/* Food Photo Input (Foto Makanan) */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-bold text-[#111c2d] uppercase tracking-wider">
            Lampirkan Foto Makanan (Opsional)
          </label>
          <div className="flex items-center gap-1 text-[11px]">
            <button
              type="button"
              onClick={() => setModeInputFoto('upload')}
              className={`px-2 py-0.5 rounded ${modeInputFoto === 'upload' ? 'bg-[#ffdbce] text-[#a33900] font-bold' : 'text-[#5a4138]'}`}
            >
              Upload File
            </button>
            <span className="text-gray-300">|</span>
            <button
              type="button"
              onClick={() => setModeInputFoto('url')}
              className={`px-2 py-0.5 rounded ${modeInputFoto === 'url' ? 'bg-[#ffdbce] text-[#a33900] font-bold' : 'text-[#5a4138]'}`}
            >
              Link URL / Contoh
            </button>
          </div>
        </div>

        {modeInputFoto === 'upload' ? (
          <div className="flex items-center gap-3">
            <label className="flex-1 cursor-pointer flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-[#dee8ff] hover:border-[#a33900] bg-[#f9f9ff] transition-colors text-xs font-bold text-[#5a4138]">
              <span className="material-symbols-outlined text-lg text-[#a33900]">add_a_photo</span>
              <span>Pilih Foto dari Galeri / Kamera</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>
        ) : (
          <div className="space-y-2">
            <input
              type="url"
              value={fotoUrl}
              onChange={(e) => setFotoUrl(e.target.value)}
              placeholder="https://example.com/foto-makanan.jpg"
              className="w-full px-3.5 py-2 bg-[#f9f9ff] text-xs rounded-xl border border-[#dee8ff] focus:outline-none focus:ring-2 focus:ring-[#a33900]"
            />
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] text-[#5a4138]">Pilih cepat:</span>
              {contohFotoMakanan.map((c) => (
                <button
                  key={c.label}
                  type="button"
                  onClick={() => setFotoUrl(c.url)}
                  className="px-2 py-0.5 rounded-lg text-[10px] bg-[#f0f3ff] hover:bg-[#dee8ff] text-[#111c2d]"
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Thumbnail Preview Foto */}
        {fotoUrl && (
          <div className="mt-3 relative inline-block">
            <img
              src={fotoUrl}
              alt="Preview Ulasan Makanan"
              className="w-20 h-20 rounded-xl object-cover border border-[#dee8ff] shadow-xs"
            />
            <button
              type="button"
              onClick={() => setFotoUrl('')}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#ba1a1a] text-white flex items-center justify-center text-xs shadow"
              title="Hapus Foto"
            >
              ×
            </button>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="pt-3 border-t border-[#f0f3ff] flex items-center justify-end gap-2.5">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-4 py-2.5 rounded-xl border border-[#dee8ff] text-xs font-bold text-[#5a4138] hover:bg-[#f0f3ff] disabled:opacity-50"
          >
            Nanti Saja
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2.5 rounded-xl bg-[#a33900] hover:bg-[#cc4900] text-white text-xs font-bold shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50 active:scale-95"
        >
          {isSubmitting ? (
            <>
              <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>
              <span>Menyimpan Ulasan...</span>
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-base">send</span>
              <span>Kirim Ulasan</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default FormUlasan;
