import React from 'react';
import { SubmitButton } from './FormControls';

interface Props {
  tastes: string[]; categories: string[]; dietary: string[]; loading: boolean;
  toggleTaste: (value: string) => void; toggleCategory: (value: string) => void; toggleDietary: (value: string) => void;
  onSubmit: () => void;
}

const groups = [
  { title: 'Cita Rasa Favorit', values: [['pedas', 'Pedas Nampol'], ['manis', 'Manis Legit'], ['gurih', 'Gurih Mantap'], ['asam', 'Asam Segar'], ['rempah', 'Rempah Kuat'], ['sehat', 'Rendah Kalori']] },
  { title: 'Kategori Makanan', values: [['ayam_bebek', 'Ayam & Bebek'], ['nasi_bakar', 'Nasi & Bakar'], ['mie', 'Mie & Pasta'], ['seafood', 'Seafood'], ['jajanan', 'Jajanan Pasar'], ['minuman', 'Minuman']] },
  { title: 'Preferensi Diet', values: [['aman_lambung', 'Aman untuk Lambung'], ['rendah_kalori', 'Rendah Kalori'], ['tanpa_minyak', 'Minim Minyak'], ['vegetarian', 'Vegetarian']] },
];

export const PreferencesForm = ({ tastes, categories, dietary, loading, toggleTaste, toggleCategory, toggleDietary, onSubmit }: Props) => {
  const selected = [tastes, categories, dietary];
  const toggles = [toggleTaste, toggleCategory, toggleDietary];
  return <div className="space-y-5">
    <div className="p-4 bg-[#f0f3ff] rounded-2xl border border-[#dee8ff]"><h3 className="text-xs font-bold">Preferensi Selera Kuliner Anda</h3><p className="text-[11px] text-[#5a4138]">Pilih rasa dan kategori makanan yang paling Anda sukai.</p></div>
    {groups.map((group, groupIndex) => <section key={group.title}><h3 className="text-xs font-bold mb-2">{group.title}</h3><div className="grid grid-cols-2 sm:grid-cols-3 gap-2">{group.values.map(([id, label]) => <button type="button" key={id} onClick={() => toggles[groupIndex](id)} className={`p-3 rounded-xl border text-left text-xs ${selected[groupIndex].includes(id) ? 'border-[#a33900] bg-[#ffdbce]' : 'border-[#dee8ff] bg-[#f0f3ff]'}`}>{label}</button>)}</div></section>)}
    <SubmitButton loading={loading} onClick={onSubmit} className="bg-[#a33900] hover:bg-[#cc4900]"><span>Simpan Preferensi & Masuk</span><span className="material-symbols-outlined text-base">arrow_forward</span></SubmitButton>
  </div>;
};
