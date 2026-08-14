import React from 'react';
import { isSupabaseConfigured } from '../../lib/supabase';

export const ConfigWarning: React.FC = () => {
  if (isSupabaseConfigured) return null;

  return (
    <div className="bg-amber-500/10 border-b border-amber-500/30 text-amber-900 px-4 py-3 text-sm">
      <div className="max-w-container-max mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-amber-600 text-lg">warning</span>
          <span>
            <strong>Supabase Setup Required:</strong> Please connect your Supabase project by adding your <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> to the <code>.env</code> file, and run <code>supabase/schema.sql</code> in your Supabase SQL Editor.
          </span>
        </div>
      </div>
    </div>
  );
};
