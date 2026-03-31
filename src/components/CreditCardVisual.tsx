import { CreditCard as CreditCardIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatCurrency, type CreditCard } from '@/lib/data';

interface Props {
  card: CreditCard;
  projected: number;
  onClick?: () => void;
}

export function CreditCardVisual({ card, projected, onClick }: Props) {
  const usage = card.budget > 0 ? (projected / card.budget) * 100 : 0;

  return (
    <div
      onClick={onClick}
      className={`relative overflow-hidden rounded-3xl p-6 h-48 bg-gradient-to-br ${card.gradient} border border-white/20 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.7)] flex flex-col justify-between group interactive-press ${onClick ? 'cursor-pointer hover:shadow-[0_0_30px_rgba(255,255,255,0.2)]' : ''}`}
    >
      {/* Glass overlay */}
      <div className="absolute inset-0 bg-black/10 backdrop-blur-[2px] z-0" />
      
      <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:scale-110 transition-transform z-0">
        <CreditCardIcon size={140} className="text-white" />
      </div>
      <div className="flex justify-between items-start relative z-10">
        <div>
          <p className="text-white/80 text-xs font-bold uppercase tracking-widest drop-shadow-md">{card.bank}</p>
          <h3 className="text-white font-black text-xl drop-shadow-lg">{card.name}</h3>
        </div>
        <div className="w-12 h-8 bg-gradient-to-br from-yellow-300/40 to-yellow-600/40 rounded-md border border-yellow-200/30 backdrop-blur-md shadow-[0_0_15px_rgba(250,204,21,0.3)] relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
        </div>
      </div>
      <div className="relative z-10 mt-auto">
        <p className="text-white/70 text-[10px] mb-1 uppercase tracking-widest font-bold">Próximo Vencimiento</p>
        <p className="text-white text-3xl font-black tracking-display drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">{formatCurrency(projected)}</p>
        <div className="mt-4 w-full bg-black/40 h-2 rounded-full overflow-hidden backdrop-blur-md border border-white/10">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(usage, 100)}%` }}
            transition={{ duration: 1, ease: [0.2, 0.8, 0.2, 1] }}
            className={`h-full rounded-full relative overflow-hidden ${usage > 90 ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]' : 'bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]'}`}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent w-1/2 animate-[slide-in-right_2s_infinite]" />
          </motion.div>
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-white/80 font-medium text-[11px] tracking-widest">•••• {card.lastDigits}</span>
          <span className="text-white/80 font-bold text-[11px]">{Math.round(usage)}% usado</span>
        </div>
      </div>
    </div>
  );
}
