import { useState, useEffect } from 'react';
import { Camera, FileUp, Check, Pencil, Loader2, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useApp } from '@/lib/store';
import { formatCurrency } from '@/lib/data';
import { useNavigate } from 'react-router-dom';

const MOCK_DETECTED = [
  { id: 1, desc: 'FRÁVEGA SACI', installments: 12, current: 2, total: 542400, category: 'Tecnología' },
  { id: 2, desc: 'MERCADOLIBRE', installments: 6, current: 1, total: 74400, category: 'Hogar' },
  { id: 3, desc: 'DESPEGAR.COM', installments: 9, current: 1, total: 405000, category: 'Viajes' },
];

export default function ImportExpenses() {
  const [tab, setTab] = useState<'photo' | 'file'>('photo');
  const [loading, setLoading] = useState(false);
  const [detected, setDetected] = useState(false);
  const [saved, setSaved] = useState(false);
  const [items, setItems] = useState(MOCK_DETECTED);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<typeof MOCK_DETECTED[0] | null>(null);
  
  const { cards, addExpense } = useApp();
  const navigate = useNavigate();

  const handleSimulateDetection = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setDetected(true);
    }, 2500);
  };

  const handleEditClick = (item: typeof MOCK_DETECTED[0]) => {
    setEditingId(item.id);
    setEditForm({ ...item });
  };

  const saveInlineEdit = () => {
    if (editForm) {
      setItems(prev => prev.map(i => i.id === editForm.id ? editForm : i));
    }
    setEditingId(null);
  };

  const handleSaveAll = () => {
    items.forEach(item => {
      addExpense({
        cardId: cards[0]?.id || 'c1',
        desc: item.desc,
        total: item.total,
        installments: item.installments,
        current: item.current,
        date: new Date().toISOString().slice(0, 10),
        category: item.category,
      });
    });
    setSaved(true);
    setTimeout(() => navigate('/'), 1500);
  };

  if (saved) {
    return (
      <div className="flex flex-col items-center justify-center h-96 animate-fade-in">
        <Check size={64} className="text-success mb-4" />
        <p className="text-xl font-bold text-foreground">¡{items.length} gastos importados!</p>
        <p className="text-muted-foreground text-sm">Redirigiendo al dashboard...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-foreground">Importar Resumen</h2>
        <p className="text-muted-foreground">Sincronizá tus gastos automáticamente analizando tu resumen.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 justify-center">
        <Button variant={tab === 'photo' ? 'default' : 'outline'} onClick={() => setTab('photo')} className="gap-2">
          <Camera size={16} /> Foto
        </Button>
        <Button variant={tab === 'file' ? 'default' : 'outline'} onClick={() => setTab('file')} className="gap-2">
          <FileUp size={16} /> PDF / CSV
        </Button>
      </div>

      {/* Upload area */}
      {!detected && (
        <div
          onClick={loading ? undefined : handleSimulateDetection}
          className={`p-12 border-2 border-dashed border-border rounded-3xl transition-all cursor-pointer flex flex-col items-center justify-center gap-4 group ${loading ? 'bg-secondary/20 pointer-events-none' : 'bg-card/30 hover:bg-card/50 interactive-press'}`}
        >
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
            {loading ? <Loader2 size={32} className="animate-spin" /> : tab === 'photo' ? <Camera size={32} /> : <FileUp size={32} />}
          </div>
          <div className="text-center">
            <p className="text-foreground font-bold text-lg">
              {loading 
                ? tab === 'photo' ? 'Analizando imagen OCR...' : 'Procesando archivo...'
                : tab === 'photo' ? 'Escanear Foto del Resumen' : 'Subir Archivo PDF o CSV'}
            </p>
            <p className="text-muted-foreground text-sm mt-1">
              {loading ? 'Por favor esperaba unos segundos' : tab === 'photo' ? 'Tocá para simular el escaneo' : 'Tocá para simular la carga'}
            </p>
          </div>
        </div>
      )}

      {/* Detected expenses */}
      {detected && (
        <div className="surface-elevated rounded-2xl overflow-hidden animate-fade-in">
          <div className="p-4 bg-secondary flex justify-between items-center">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Gastos Detectados</span>
            <span className="text-[10px] bg-success/20 text-success px-2 py-1 rounded border border-success/20">
              {items.length} detectados
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="text-muted-foreground text-[10px] uppercase tracking-widest border-b border-border bg-card/50">
                  <th className="px-6 py-4">Descripción</th>
                  <th className="px-6 py-4">Cuotas (Actual/Total)</th>
                  <th className="px-6 py-4">Categoría</th>
                  <th className="px-6 py-4 text-right">Monto Total</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-secondary/50 transition-colors">
                    {editingId === item.id && editForm ? (
                      <>
                        <td className="px-6 py-3">
                          <input className="w-full bg-background border border-border rounded p-1 text-xs" value={editForm.desc} onChange={e => setEditForm({...editForm, desc: e.target.value})} />
                        </td>
                        <td className="px-6 py-3 flex items-center gap-1">
                          <input type="number" className="w-12 bg-background border border-border rounded p-1 text-xs text-center" value={editForm.current} onChange={e => setEditForm({...editForm, current: Number(e.target.value)})} />
                          <span className="text-muted-foreground">/</span>
                          <input type="number" className="w-12 bg-background border border-border rounded p-1 text-xs text-center" value={editForm.installments} onChange={e => setEditForm({...editForm, installments: Number(e.target.value)})} />
                        </td>
                        <td className="px-6 py-3">
                           <input className="w-full bg-background border border-border rounded p-1 text-xs" value={editForm.category} onChange={e => setEditForm({...editForm, category: e.target.value})} />
                        </td>
                        <td className="px-6 py-3">
                           <input type="number" className="w-full bg-background border border-border rounded p-1 text-xs text-right" value={editForm.total} onChange={e => setEditForm({...editForm, total: Number(e.target.value)})} />
                        </td>
                        <td className="px-6 py-3 flex justify-end gap-2">
                          <button onClick={saveInlineEdit} className="p-1 rounded bg-primary/20 text-primary hover:bg-primary/30"><Save size={14}/></button>
                          <button onClick={() => setEditingId(null)} className="p-1 rounded bg-destructive/20 text-destructive hover:bg-destructive/30"><X size={14}/></button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-6 py-4 text-foreground font-medium">{item.desc}</td>
                        <td className="px-6 py-4 text-muted-foreground">{item.current} / {item.installments}</td>
                        <td className="px-6 py-4 text-muted-foreground">{item.category}</td>
                        <td className="px-6 py-4 text-right font-mono text-foreground font-bold">{formatCurrency(item.total)}</td>
                        <td className="px-6 py-4 text-right">
                          <Pencil size={16} className="text-muted-foreground hover:text-primary cursor-pointer inline-block transition-colors" onClick={() => handleEditClick(item)} />
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-4 border-t border-border flex justify-end bg-card/30">
            <Button onClick={handleSaveAll} className="gap-2 bg-success text-success-foreground hover:bg-success/90 shadow-lg shadow-success/20">
              <Check size={16} /> Confirmar e Importar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
