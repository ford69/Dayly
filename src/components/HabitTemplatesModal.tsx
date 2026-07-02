import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { HabitTemplateGroup } from '../lib/types';

interface HabitTemplatesModalProps {
  darkMode: boolean;
  fetchTemplates: () => Promise<HabitTemplateGroup[]>;
  onApply: (templateId: string) => Promise<void>;
  onClose: () => void;
}

export function HabitTemplatesModal({ darkMode, fetchTemplates, onApply, onClose }: HabitTemplatesModalProps) {
  const [templates, setTemplates] = useState<HabitTemplateGroup[]>([]);
  const [loading, setLoading] = useState<string | null>(null);

  useEffect(() => {
    void fetchTemplates().then(setTemplates);
  }, [fetchTemplates]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div
        className={`w-full max-w-lg rounded-2xl border shadow-2xl max-h-[85vh] overflow-hidden flex flex-col ${
          darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
        }`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-inherit">
          <h2 className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Habit templates</h2>
          <button onClick={onClose} className={darkMode ? 'text-gray-400' : 'text-gray-500'}>
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 overflow-y-auto space-y-3">
          {templates.map((t) => (
            <div
              key={t.id}
              className={`rounded-xl border p-4 ${darkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-100 bg-gray-50'}`}
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{t.name}</h3>
                  <p className={`text-xs mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    {t.habits.length} habits — {t.habits.map((h) => h.title).join(', ')}
                  </p>
                </div>
                <button
                  disabled={loading === t.id}
                  onClick={() => {
                    setLoading(t.id);
                    void onApply(t.id).then(onClose).finally(() => setLoading(null));
                  }}
                  className="px-3 py-1.5 rounded-lg bg-blue-500 text-white text-xs font-semibold hover:bg-blue-600 disabled:opacity-50"
                >
                  {loading === t.id ? 'Adding…' : 'Use template'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
