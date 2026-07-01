import { Sparkles, Check, X } from 'lucide-react';
import { useTaskContext } from '../context/TaskContext';
import { formatTime } from '../lib/utils';

interface PlanMyDayProps {
  date: string;
  onClose: () => void;
}

export function PlanMyDay({ date, onClose }: PlanMyDayProps) {
  const { state, planMyDay, applyPlan } = useTaskContext();
  const { planSuggestions, planSummary, darkMode, loading } = state;

  const handlePlan = async () => {
    await planMyDay(date);
  };

  const handleApply = async () => {
    await applyPlan();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden ${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-100'}`}>
        <div className={`flex items-center justify-between px-6 py-5 border-b ${darkMode ? 'border-gray-800' : 'border-gray-100'}`}>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <h2 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Plan My Day</h2>
          </div>
          <button onClick={onClose} className={darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400'}><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          {planSuggestions.length === 0 ? (
            <div className="text-center py-6">
              <p className={`text-sm mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                AI will distribute your tasks into time slots based on priority and free time.
              </p>
              <button onClick={handlePlan} disabled={loading} className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold text-sm hover:opacity-90 disabled:opacity-50">
                {loading ? 'Planning...' : 'Plan my day'}
              </button>
            </div>
          ) : (
            <>
              {planSummary && (
                <p className={`text-sm px-4 py-3 rounded-xl ${darkMode ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-50 text-blue-700'}`}>
                  {planSummary}
                </p>
              )}
              <div className="space-y-2">
                {planSuggestions.map((s) => (
                  <div key={s.task_id} className={`rounded-xl border p-3 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-100'}`}>
                    <div className="flex items-center justify-between">
                      <span className={`font-semibold text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>{s.title}</span>
                      <span className={`text-xs capitalize px-2 py-0.5 rounded-lg ${s.priority === 'high' ? 'bg-red-500/20 text-red-400' : s.priority === 'medium' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'}`}>{s.priority}</span>
                    </div>
                    <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {formatTime(s.suggested_start_time)} – {formatTime(s.suggested_end_time)}
                    </p>
                    <p className={`text-xs mt-0.5 italic ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{s.reason}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {planSuggestions.length > 0 && (
          <div className={`flex gap-3 px-6 py-5 border-t ${darkMode ? 'border-gray-800' : 'border-gray-100'}`}>
            <button onClick={handlePlan} className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border ${darkMode ? 'border-gray-700 text-gray-400' : 'border-gray-200 text-gray-500'}`}>Re-plan</button>
            <button onClick={handleApply} className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-blue-500 text-white hover:bg-blue-600 flex items-center justify-center gap-2">
              <Check className="w-4 h-4" />Apply schedule
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
