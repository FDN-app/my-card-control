import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/lib/store';
import { formatCurrency, CATEGORIES } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle2 } from 'lucide-react';

export default function NewExpense() {
  const { cards, addExpense } = useApp();
  const navigate = useNavigate();
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    cardId: cards[0]?.id || '',
    desc: '',
    total: '',
    installments: '',
    installmentAmount: '',
    interestRate: '',
    date: new Date().toISOString().slice(0, 10),
    category: 'Tecnología',
  });

  const interestInfo = useMemo(() => {
    const t = Number(form.total);
    const i = Number(form.installments);
    const amt = Number(form.installmentAmount);
    if (t > 0 && i > 0 && amt > 0) {
      const totalPaid = amt * i;
      const intValue = totalPaid - t;
      const intPercentage = t > 0 ? (intValue / t) * 100 : 0;
      return { totalPaid, intValue, intPercentage: Math.max(0, parseFloat(intPercentage.toFixed(2))) };
    }
    return null;
  }, [form.total, form.installments, form.installmentAmount]);

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      await addExpense({
        cardId: form.cardId,
        desc: form.desc,
        total: Number(form.total),
        installments: Number(form.installments),
        installmentAmount: Number(form.installmentAmount) || Math.round(Number(form.total) / Number(form.installments)),
        current: 1,
        date: form.date,
        category: form.category,
      });
      setSaved(true);
      setTimeout(() => navigate('/'), 1500);
    } catch (e) {
      setError('Error al conectar con la base de datos.');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const valid = form.desc && Number(form.total) > 0 && Number(form.installments) > 0 && Number(form.installmentAmount) > 0 && form.cardId;

  if (saved) {
    return (
      <div className="flex flex-col items-center justify-center h-96 animate-fade-in">
        <CheckCircle2 size={64} className="text-success mb-4" />
        <p className="text-xl font-bold text-foreground">¡Gasto registrado!</p>
        <p className="text-muted-foreground text-sm">Redirigiendo al dashboard...</p>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-8 animate-fade-in">
      <div>
        <p className="text-muted-foreground text-sm mb-1 uppercase tracking-widest pl-1">Registrar</p>
        <h2 className="text-4xl md:text-5xl font-black tracking-display bg-clip-text text-transparent bg-gradient-to-r from-primary via-accent to-primary animate-[textShine_4s_linear_infinite] [background-size:200%_auto]">Nuevo Gasto</h2>
      </div>

      <div className="surface-elevated rounded-2xl p-6 space-y-5">
        <div>
          <Label>Tarjeta</Label>
          <Select value={form.cardId} onValueChange={v => setForm(f => ({ ...f, cardId: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {cards.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.bank} — {c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Descripción</Label>
          <Input value={form.desc} onChange={e => setForm(f => ({ ...f, desc: e.target.value }))} placeholder="iPhone 15 Pro" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Monto Total ($)</Label>
            <Input type="number" value={form.total} onChange={e => setForm(f => ({ ...f, total: e.target.value }))} placeholder="120000" />
          </div>
          <div>
            <Label>Cuotas</Label>
            <Input type="number" min={1} max={48} value={form.installments} onChange={e => setForm(f => ({ ...f, installments: e.target.value }))} placeholder="12" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Monto por Cuota ($)</Label>
            <Input type="number" value={form.installmentAmount} onChange={e => {
              setForm(f => ({ ...f, installmentAmount: e.target.value, interestRate: '' }));
            }} placeholder="15000" />
            <p className="text-xs text-muted-foreground mt-1">Ingreso manual requerido</p>
          </div>
          <div>
            <Label>Interés Opcional (%)</Label>
            <Input type="number" value={form.interestRate} onChange={e => {
              const rate = Number(e.target.value);
              setForm(f => {
                const t = Number(f.total);
                const i = Number(f.installments);
                if (t > 0 && i > 0 && rate >= 0) {
                   const calculated = Math.round((t * (1 + rate / 100)) / i);
                   return { ...f, interestRate: e.target.value, installmentAmount: String(calculated) };
                }
                return { ...f, interestRate: e.target.value };
              });
            }} placeholder="50" />
            <p className="text-xs text-muted-foreground mt-1">Autocalcula la cuota</p>
          </div>
        </div>

        {interestInfo && interestInfo.intValue > 0 && (
          <div className="glass-card neon-border rounded-xl p-4 text-center shadow-[0_0_20px_hsl(var(--primary)/0.1)]">
            <p className="text-muted-foreground text-sm uppercase tracking-widest font-bold">Interés Total Cobrado</p>
            <p className="text-2xl font-black text-warning drop-shadow-[0_0_10px_hsl(var(--warning)/0.2)]">+{formatCurrency(interestInfo.intValue)} <span className="text-sm">({interestInfo.intPercentage}%)</span></p>
            <p className="text-xs text-muted-foreground mt-1">Pagarás {formatCurrency(interestInfo.totalPaid)} en total al final.</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Fecha primera cuota</Label>
            <Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
          </div>
          <div>
            <Label>Categoría</Label>
            <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(c => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {error && <p className="text-red-500 text-sm text-center font-bold">{error}</p>}

        <Button className="w-full" size="lg" disabled={!valid || loading} onClick={handleSubmit}>
          {loading ? 'Guardando...' : 'Registrar Gasto'}
        </Button>
      </div>
    </div>
  );
}
