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
      className={`relative overflow-hidden rounded-2xl p-6 h-48 bg-gradient-to-br ${card.gradient} shadow-xl flex flex-col justify-between group interactive-press ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
        <CreditCardIcon size={120} />
      </div>
      <div className="flex justify-between items-start relative z-10">
        <div>
          <p className="text-primary-foreground/70 text-xs font-medium uppercase tracking-widest">{card.bank}</p>
          <h3 className="text-primary-foreground font-bold text-lg">{card.name}</h3>
        </div>
        <div className="w-10 h-7 bg-yellow-500/30 rounded-md border border-yellow-200/20 backdrop-blur-sm" />
      </div>
      <div className="relative z-10">
        <p className="text-primary-foreground/60 text-[10px] mb-1 uppercase tracking-wider">Próximo Vencimiento</p>
        <p className="text-primary-foreground text-2xl font-bold tracking-display">{formatCurrency(projected)}</p>
        <div className="mt-3 w-full bg-black/20 h-1.5 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(usage, 100)}%` }}
            transition={{ duration: 0.8, ease: [0.2, 0.8, 0.2, 1] }}
            className={`h-full rounded-full ${usage > 90 ? 'bg-red-400' : 'bg-white/90'}`}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-primary-foreground/50 text-[10px]">•••• {card.lastDigits}</span>
          <span className="text-primary-foreground/50 text-[10px]">{Math.round(usage)}% usado</span>
        </div>
      </div>
    </div>
  );
}
