import { useState } from 'react';
import { Camera, FileUp, Check, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useApp } from '@/lib/store';
import { formatCurrency } from '@/lib/data';
import { useNavigate } from 'react-router-dom';

const MOCK_DETECTED = [
  { desc: 'FRÁVEGA SACI', installments: 12, current: 2, total: 542400, category: 'Tecnología' },
  { desc: 'MERCADOLIBRE', installments: 6, current: 1, total: 74400, category: 'Hogar' },
  { desc: 'DESPEGAR.COM', installments: 9, current: 1, total: 405000, category: 'Viajes' },
];

export default function ImportExpenses() {
  const [tab, setTab] = useState<'photo' | 'file'>('photo');
  const [detected, setDetected] = useState(false);
  const [saved, setSaved] = useState(false);
  const { cards, addExpense } = useApp();
  const navigate = useNavigate();

  const handleSimulateDetection = () => setDetected(true);

  const handleSaveAll = () => {
    MOCK_DETECTED.forEach(item => {
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
        <p className="text-xl font-bold text-foreground">¡{MOCK_DETECTED.length} gastos importados!</p>
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
      <div
        onClick={handleSimulateDetection}
        className="p-12 border-2 border-dashed border-border rounded-3xl bg-card/30 hover:bg-card/50 transition-all cursor-pointer flex flex-col items-center justify-center gap-4 group interactive-press"
      >
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
          {tab === 'photo' ? <Camera size={32} /> : <FileUp size={32} />}
        </div>
        <div className="text-center">
          <p className="text-foreground font-bold">
            {tab === 'photo' ? 'Escanear Foto del Resumen' : 'Subir Archivo PDF o CSV'}
          </p>
          <p className="text-muted-foreground text-xs mt-1">
            {tab === 'photo' ? 'Tocá para simular el escaneo' : 'Tocá para simular la carga'}
          </p>
        </div>
      </div>

      {/* Detected expenses */}
      {detected && (
        <div className="surface-elevated rounded-2xl overflow-hidden animate-fade-in">
          <div className="p-4 bg-secondary flex justify-between items-center">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Gastos Detectados</span>
            <span className="text-[10px] bg-success/20 text-success px-2 py-1 rounded border border-success/20">
              {MOCK_DETECTED.length} detectados
            </span>
          </div>
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="text-muted-foreground text-[10px] uppercase tracking-widest border-b border-border">
                <th className="px-6 py-3">Descripción</th>
                <th className="px-6 py-3">Cuotas</th>
                <th className="px-6 py-3">Categoría</th>
                <th className="px-6 py-3 text-right">Monto Cuota</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {MOCK_DETECTED.map((item, i) => (
                <tr key={i} className="hover:bg-secondary/50 transition-colors">
                  <td className="px-6 py-4 text-foreground font-medium">{item.desc}</td>
                  <td className="px-6 py-4 text-muted-foreground">{item.current}/{item.installments}</td>
                  <td className="px-6 py-4 text-muted-foreground">{item.category}</td>
                  <td className="px-6 py-4 text-right font-mono text-foreground">{formatCurrency(Math.round(item.total / item.installments))}</td>
                  <td className="px-6 py-4">
                    <Pencil size={14} className="text-muted-foreground hover:text-foreground cursor-pointer" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="p-4 border-t border-border flex justify-end">
            <Button onClick={handleSaveAll} className="gap-2">
              <Check size={16} /> Confirmar e Importar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
