import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Pencil, Trash2, X } from 'lucide-react';
import { useApp } from '@/lib/store';
import { formatCurrency } from '@/lib/data';
import { CreditCardVisual } from '@/components/CreditCardVisual';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { CreditCard } from '@/lib/data';

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

  const [form, setForm] = useState({ bank: '', name: '', gradient: GRADIENTS[0].value, budget: '', lastDigits: '' });

  const openNew = () => {
    setEditing(null);
    setForm({ bank: '', name: '', gradient: GRADIENTS[0].value, budget: '', lastDigits: '' });
    setOpen(true);
  };

  const openEdit = (card: CreditCard) => {
    setEditing(card);
    setForm({ bank: card.bank, name: card.name, gradient: card.gradient, budget: String(card.budget), lastDigits: card.lastDigits });
    setOpen(true);
  };

  const handleSave = () => {
    const data = { bank: form.bank, name: form.name, gradient: form.gradient, budget: Number(form.budget), lastDigits: form.lastDigits };
    if (editing) {
      updateCard({ ...data, id: editing.id });
    } else {
      addCard(data);
    }
    setOpen(false);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-muted-foreground text-sm mb-1">Gestión</p>
          <h2 className="text-3xl font-bold tracking-display text-foreground">Mis Tarjetas</h2>
        </div>
        <Button onClick={openNew} className="gap-2">
          <Plus size={18} /> Nueva Tarjeta
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
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">{editing ? 'Editar Tarjeta' : 'Nueva Tarjeta'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Banco</Label>
                <Input value={form.bank} onChange={e => setForm(f => ({ ...f, bank: e.target.value }))} placeholder="Galicia" />
              </div>
              <div>
                <Label>Nombre</Label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Visa Signature" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Presupuesto</Label>
                <Input type="number" value={form.budget} onChange={e => setForm(f => ({ ...f, budget: e.target.value }))} placeholder="450000" />
              </div>
              <div>
                <Label>Últimos 4 dígitos</Label>
                <Input maxLength={4} value={form.lastDigits} onChange={e => setForm(f => ({ ...f, lastDigits: e.target.value }))} placeholder="4492" />
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
            <Button className="w-full" onClick={handleSave} disabled={!form.bank || !form.name || !form.budget}>
              {editing ? 'Guardar Cambios' : 'Crear Tarjeta'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
