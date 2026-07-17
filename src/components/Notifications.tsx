import { motion, AnimatePresence } from 'motion/react';
import { Bell } from 'lucide-react';
import type { Notification } from '../types';

export default function Notifications({ items }: { items: Notification[] }) {
  return (
    <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-3 pointer-events-none" role="status" aria-live="polite">
      <AnimatePresence>
        {items.map((n) => (
          <motion.div
            key={n.id}
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className={`p-4 rounded-2xl shadow-2xl border border-white/10 backdrop-blur-xl min-w-[250px] pointer-events-auto flex items-center gap-3 ${
              n.type === 'success'
                ? 'bg-emerald-500/20 text-emerald-400'
                : n.type === 'warning'
                ? 'bg-amber-500/20 text-amber-400'
                : 'bg-pink-300/20 text-pink-300'
            }`}
          >
            <Bell size={18} aria-hidden="true" />
            <span className="text-xs font-black uppercase tracking-wider">{n.message}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
