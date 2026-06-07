import { useCurrency, type CurrencyCode } from '@/contexts/CurrencyContext';

const OPTIONS: { code: CurrencyCode; label: string }[] = [
  { code: 'ARS', label: '🇦🇷 ARS' },
  { code: 'USD', label: '🇺🇸 USD' },
  { code: 'EUR', label: '🇪🇺 EUR' },
];

export default function CurrencySelector() {
  const { currency, setCurrency } = useCurrency();

  return (
    <select
      value={currency}
      onChange={e => setCurrency(e.target.value as CurrencyCode)}
      className="bg-secondary/50 border border-border rounded-lg px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer"
    >
      {OPTIONS.map(o => (
        <option key={o.code} value={o.code} className="bg-card">{o.label}</option>
      ))}
    </select>
  );
}
