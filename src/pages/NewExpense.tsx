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
  const [form, setForm] = useState({
    cardId: cards[0]?.id || '',
    desc: '',
    total: '',
    installments: '',
    date: new Date().toISOString().slice(0, 10),
    category: 'Tecnología',
  });

  const cuota = useMemo(() => {
    const t = Number(form.total);
    const i = Number(form.installments);
    return t > 0 && i > 0 ? Math.round(t / i) : 0;
  }, [form.total, form.installments]);

  const handleSubmit = () => {
    addExpense({
      cardId: form.cardId,
      desc: form.desc,
      total: Number(form.total),
      installments: Number(form.installments),
      current: 1,
      date: form.date,
      category: form.category,
    });
    setSaved(true);
    setTimeout(() => navigate('/'), 1500);
  };

  const valid = form.desc && Number(form.total) > 0 && Number(form.installments) > 0 && form.cardId;

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

        {cuota > 0 && (
          <div className="glass-card neon-border rounded-xl p-6 text-center shadow-[0_0_20px_hsl(var(--primary)/0.2)]">
            <p className="text-white/70 text-xs uppercase tracking-widest mb-2 font-bold">Valor estimado por cuota</p>
            <p className="text-4xl font-black tracking-display text-primary drop-shadow-[0_0_10px_hsl(var(--primary)/0.4)]">{formatCurrency(cuota)}</p>
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

        <Button className="w-full" size="lg" disabled={!valid} onClick={handleSubmit}>
          Registrar Gasto
        </Button>
      </div>
    </div>
  );
}
