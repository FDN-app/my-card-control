import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useApp } from '@/lib/store';
import { formatCurrency, PAYMENT_TYPES } from '@/lib/data';
import { CreditCardVisual } from '@/components/CreditCardVisual';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { CreditCard } from '@/lib/data';
import { toast } from 'sonner';

const GRADIENTS = [
  { label: 'Azul', value: 'from-blue-600 to-indigo-700' },
  { label: 'Rojo', value: 'from-red-600 to-rose-700' },
  { label: 'Verde', value: 'from-emerald-600 to-teal-700' },
  { label: 'Violeta', value: 'from-violet-600 to-purple-700' },
  { label: 'Naranja', value: 'from-orange-500 to-amber-600' },
];

export default function Cards() {
  const { cards, addCard, updateCard, deleteCard, getCardProjected } = useApp();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CreditCard | null>(null);
  const [loading, setLoading] = useState(false);

  const emptyForm = {
    tipo: 'Tarjeta de crédito' as CreditCard['tipo'],
    bank: '',
    name: '',
    gradient: GRADIENTS[0].value,
    budget: '',
    limit: '',
    lastDigits: '',
    titularNombre: '',
    periodicidad: 'Mensual' as CreditCard['periodicidad'],
  };

  const [form, setForm] = useState(emptyForm);

  const openNew = () => {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const openEdit = (card: CreditCard) => {
    setEditing(card);
    setForm({
      tipo: card.tipo ?? 'Tarjeta de crédito',
      bank: card.bank,
      name: card.name,
      gradient: card.gradient,
      budget: String(card.budget),
      limit: card.limit ? String(card.limit) : '',
      lastDigits: card.lastDigits ?? '',
      titularNombre: card.titularNombre ?? '',
      periodicidad: card.periodicidad ?? 'Mensual',
    });
    setOpen(true);
  };

  const handleSave = async () => {
    setLoading(true);
    const data: Omit<CreditCard, 'id'> = {
      tipo: form.tipo,
      bank: form.bank,
      name: form.name,
      gradient: form.gradient,
      budget: Number(form.budget),
      limit: form.limit ? Number(form.limit) : undefined,
      lastDigits: form.lastDigits || undefined,
      titularNombre: form.tipo === 'Tarjeta de tercero' ? form.titularNombre || undefined : undefined,
      periodicidad: form.periodicidad,
    };
    try {
      if (editing) {
        await updateCard({ ...data, id: editing.id });
      } else {
        await addCard(data);
      }
      setOpen(false);
      setEditing(null);
      setForm(emptyForm);
    } catch(e) {
      console.error(e);
      toast.error('Error al guardar. Verifique su conexión y vuelva a intentar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-muted-foreground text-sm mb-1 uppercase tracking-widest pl-1">Gestión</p>
          <h2 className="text-4xl md:text-5xl font-black tracking-display bg-clip-text text-transparent bg-gradient-to-r from-primary via-accent to-primary animate-[textShine_4s_linear_infinite] [background-size:200%_auto]">Medios de Pago</h2>
        </div>
        <Button onClick={openNew} className="gap-2">
          <Plus size={18} /> Nuevo Medio
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {cards.map(card => {
          const projected = getCardProjected(card.id);
          return (
            <div key={card.id} className="space-y-3">
              <CreditCardVisual card={card} projected={projected} onClick={() => navigate(`/tarjetas/${card.id}`)} />
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1 gap-1" onClick={() => openEdit(card)}>
                  <Pencil size={14} /> Editar
                </Button>
                <Button variant="outline" size="sm" className="gap-1 text-destructive hover:text-destructive" onClick={() => deleteCard(card.id)}>
                  <Trash2 size={14} />
                </Button>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground px-1">
                <span>Presupuesto: {formatCurrency(card.budget)}</span>
                <span>Disponible: {formatCurrency(card.budget - projected)}</span>
              </div>
            </div>
          );
        })}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="glass-panel border-border sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground">{editing ? 'Editar Medio de Pago' : 'Nuevo Medio de Pago'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Tipo</Label>
              <Select value={form.tipo} onValueChange={v => setForm(f => ({ ...f, tipo: v as CreditCard['tipo'] }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PAYMENT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Banco / Entidad <span className="text-muted-foreground font-normal">(opcional)</span></Label>
                <Input value={form.bank} onChange={e => setForm(f => ({ ...f, bank: e.target.value }))} placeholder="Galicia, Naranja X..." />
              </div>
              <div>
                <Label>Nombre</Label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Mi Visa, Efectivo, etc." />
              </div>
            </div>

            {form.tipo === 'Tarjeta de tercero' && (
              <div>
                <Label>Nombre del titular <span className="text-muted-foreground font-normal">(opcional)</span></Label>
                <Input value={form.titularNombre} onChange={e => setForm(f => ({ ...f, titularNombre: e.target.value }))} placeholder="Juan Pérez" />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Límite ($)</Label>
                <Input type="number" value={form.limit} onChange={e => setForm(f => ({ ...f, limit: e.target.value }))} placeholder="500000" />
              </div>
              <div>
                <Label>Presupuesto propio ($)</Label>
                <Input type="number" value={form.budget} onChange={e => setForm(f => ({ ...f, budget: e.target.value }))} placeholder="400000" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Últimos 4 dígitos</Label>
                <Input maxLength={4} value={form.lastDigits} onChange={e => setForm(f => ({ ...f, lastDigits: e.target.value }))} placeholder="4492" />
              </div>
              <div>
                <Label>Periodicidad de pago</Label>
                <Select value={form.periodicidad} onValueChange={v => setForm(f => ({ ...f, periodicidad: v as CreditCard['periodicidad'] }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Semanal">Semanal</SelectItem>
                    <SelectItem value="Quincenal">Quincenal</SelectItem>
                    <SelectItem value="Mensual">Mensual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Color</Label>
              <div className="flex gap-2 mt-2">
                {GRADIENTS.map(g => (
                  <button
                    key={g.value}
                    onClick={() => setForm(f => ({ ...f, gradient: g.value }))}
                    className={`w-10 h-10 rounded-lg bg-gradient-to-br ${g.value} border-2 ${form.gradient === g.value ? 'border-primary' : 'border-transparent'}`}
                  />
                ))}
              </div>
            </div>

            <Button className="w-full" onClick={handleSave} disabled={!form.name || !form.budget || loading}>
              {loading ? 'Guardando...' : editing ? 'Guardar Cambios' : 'Crear Medio de Pago'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
