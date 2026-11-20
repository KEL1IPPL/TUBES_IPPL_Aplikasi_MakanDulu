import { useState } from 'react';
import { UserPreferences } from '../types';
import { simpanPreferensiMakanan } from '../services/apiClient';

export const usePreferensiMakanan = () => {
  const [isSaving, setIsSaving] = useState(false);

  const simpan = async (preferences: UserPreferences) => {
    setIsSaving(true);
    try {
      return await simpanPreferensiMakanan(preferences);
    } finally {
      setIsSaving(false);
    }
  };

  return { simpan, isSaving };
};
