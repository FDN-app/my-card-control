import React, { useState, useMemo } from 'react';
import { Wallet, TrendingUp, TrendingDown, DollarSign, Send, MessageSquare, Plus, Trash2, AlertCircle } from 'lucide-react';
import { useFinanzas } from '@/hooks/useFinanzas';
import { useApp } from '@/lib/store';
import { useSubscriptions } from '@/hooks/useSubscriptions';
import { chatWithFinanceAssistant } from '@/services/openai';
import { toast } from 'sonner';

const CATEGORIES = [
  'Supermercado', 'Servicios', 'Transporte', 'Comida', 'Entretenimiento', 'Salud', 'Educación', 'Ropa', 'Transferencia', 'Ahorro', 'Otros'
];

export default function Finanzas() {
  const [activeTab, setActiveTab] = useState<'presupuesto'|'gastos'|'chat'>('presupuesto');
  
  const { configuracion, ingresos, gastosDiarios, setSalario, addIngreso, addGastoDiario, deleteIngreso, deleteGastoDiario, loading } = useFinanzas();
  const { cards, getCardExpenses, nextMonthTotal } = useApp();
  const { subscriptions } = useSubscriptions();

  // State for forms
  const [salarioInput, setSalarioInput] = useState('');
  const [isEditingSalario, setIsEditingSalario] = useState(false);
  
  const [nuevoIngreso, setNuevoIngreso] = useState({ monto: '', descripcion: '' });
  const [nuevoGasto, setNuevoGasto] = useState({ monto: '', categoria: CATEGORIES[0], descripcion: '', medio_pago: 'efectivo' });

  // Chat state
  const [chatHistory, setChatHistory] = useState<{role: 'user'|'assistant', content: string}[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  // Calculations for current month
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  
  const ingresosDelMes = useMemo(() => {
    return ingresos.filter(i => new Date(i.fecha).getTime() >= startOfMonth && i.tipo === 'variable');
  }, [ingresos, startOfMonth]);

  const gastosDiariosDelMes = useMemo(() => {
    return gastosDiarios.filter(g => new Date(g.fecha).getTime() >= startOfMonth);
  }, [gastosDiarios, startOfMonth]);

  const totalSuscripciones = subscriptions.reduce((acc, sub) => acc + sub.monto, 0);
  
  // To get the card expenses of the current month exactly, we simplify by getting nextMonthTotal or similar logic
  // For budget, let's use the `nextMonthTotal` (which actually projects the upcoming total payments)
  // or calculate manually. For now, nextMonthTotal is a good approximation of "Cuotas de tarjeta"
  const totalTarjetas = Number(nextMonthTotal) || 0; 

  const salarioFijo = configuracion?.salario_mensual || 0;
  const totalIngresosVariables = ingresosDelMes.reduce((acc, i) => acc + i.monto, 0);
  const totalIngresado = salarioFijo + totalIngresosVariables;

  const totalGastosDiarios = gastosDiariosDelMes.reduce((acc, g) => acc + g.monto, 0);
  const totalGastado = totalGastosDiarios + totalTarjetas + totalSuscripciones;

  const saldoDisponible = totalIngresado - totalGastado;
  
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysRemaining = daysInMonth - now.getDate() + 1;
  const presupuestoDiario = saldoDisponible > 0 ? saldoDisponible / daysRemaining : 0;

  const porcentajeGastado = totalIngresado > 0 ? (totalGastado / totalIngresado) * 100 : 0;
  
  const formatter = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });

  // Handlers
  const handleSaveSalario = async () => {
    const val = Number(salarioInput);
    if (val >= 0) {
      await setSalario(val);
      setIsEditingSalario(false);
      toast.success("Salario guardado");
    }
  };

  const handleAddIngreso = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoIngreso.monto) return;
    try {
      await addIngreso({
        fecha: new Date().toISOString().split('T')[0],
        monto: Number(nuevoIngreso.monto),
        descripcion: nuevoIngreso.descripcion || null,
        tipo: 'variable'
      });
      setNuevoIngreso({ monto: '', descripcion: '' });
      toast.success("Ingreso registrado");
    } catch (err) {
      toast.error("Error al guardar");
    }
  };

  const handleAddGasto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoGasto.monto) return;
    try {
      await addGastoDiario({
        fecha: new Date().toISOString().split('T')[0],
        monto: Number(nuevoGasto.monto),
        categoria: nuevoGasto.categoria,
        descripcion: nuevoGasto.descripcion || null,
        medio_pago: nuevoGasto.medio_pago as any
      });
      setNuevoGasto({ ...nuevoGasto, monto: '', descripcion: '' });
      toast.success("Gasto registrado");
    } catch (err) {
      toast.error("Error al guardar");
    }
  };

  const handleSendMessage = async (msg: string) => {
    if (!msg.trim()) return;
    
    const newMsg = { role: 'user' as const, content: msg };
    setChatHistory(prev => [...prev, newMsg]);
    setChatInput('');
    setChatLoading(true);

    const contextData = {
      salarioFijo,
      ingresosVariablesMes: totalIngresosVariables,
      gastosDiariosMes: totalGastosDiarios,
      cuotasTarjetasMes: totalTarjetas,
      suscripcionesMes: totalSuscripciones,
      saldoDisponible,
      presupuestoSugeridoDiario: presupuestoDiario,
      diasRestantesDelMes: daysRemaining
    };

    try {
      const response = await chatWithFinanceAssistant(contextData, msg, chatHistory);
      setChatHistory(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (error) {
      toast.error("Error al contactar al asistente");
      setChatHistory(prev => prev.slice(0, -1)); // remove failed message or leave it?
    } finally {
      setChatLoading(false);
    }
  };

  if (loading && !configuracion) return <div className="p-8 text-center text-muted-foreground animate-pulse">Cargando módulos financieros...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 animate-fade-in">
      <div className="flex items-center gap-3 mb-8">
        <div className="bg-primary/20 p-3 rounded-2xl border border-primary/30">
          <Wallet className="text-primary" size={28} />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Mis Finanzas</h1>
          <p className="text-muted-foreground">Control total de ingresos y gastos diarios</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-secondary/50 p-1 rounded-xl">
        <button onClick={() => setActiveTab('presupuesto')} className={`flex-1 py-3 text-sm font-medium rounded-lg transition-all ${activeTab === 'presupuesto' ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:text-foreground'}`}>Presupuesto</button>
        <button onClick={() => setActiveTab('gastos')} className={`flex-1 py-3 text-sm font-medium rounded-lg transition-all ${activeTab === 'gastos' ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:text-foreground'}`}>Gastos del Día</button>
        <button onClick={() => setActiveTab('chat')} className={`flex-1 py-3 text-sm font-medium rounded-lg transition-all flex justify-center items-center gap-2 ${activeTab === 'chat' ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:text-foreground'}`}>
          <MessageSquare size={16} /> IA
        </button>
      </div>

      {/* TAB 1: PRESUPUESTO */}
      {activeTab === 'presupuesto' && (
        <div className="space-y-6 animate-fade-in">
          {/* Resumen Card */}
          <div className="glass-panel border-border p-6 relative overflow-hidden">
             {/* Progress Bar background hint */}
             <div className="absolute bottom-0 left-0 h-1 bg-border w-full">
                <div className={`h-full transition-all duration-1000 ${porcentajeGastado >= 90 ? 'bg-destructive' : porcentajeGastado >= 75 ? 'bg-orange-500' : 'bg-success'}`} style={{ width: `${Math.min(porcentajeGastado, 100)}%` }} />
             </div>
             
             <h2 className="text-xl font-bold mb-6 text-foreground flex items-center justify-between">
                Mes en Curso
                {porcentajeGastado >= 90 && <AlertCircle className="text-destructive animate-pulse" size={20} />}
             </h2>
             
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-secondary/30 p-4 rounded-xl border border-border/50">
                   <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Ingresado</p>
                   <p className="text-xl font-bold text-success">{formatter.format(totalIngresado)}</p>
                </div>
                <div className="bg-secondary/30 p-4 rounded-xl border border-border/50">
                   <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Gastado</p>
                   <p className="text-xl font-bold text-destructive">{formatter.format(totalGastado)}</p>
                </div>
                <div className="bg-secondary/30 p-4 rounded-xl border border-border/50">
                   <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Disponible</p>
                   <p className="text-xl font-bold text-primary">{formatter.format(saldoDisponible)}</p>
                </div>
                <div className="bg-secondary/30 p-4 rounded-xl border border-border/50">
                   <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Por Día</p>
                   <p className="text-xl font-bold text-foreground">{formatter.format(presupuestoDiario)}</p>
                   <p className="text-[10px] text-muted-foreground mt-1">por {daysRemaining} días</p>
                </div>
             </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="glass-panel border-border p-6">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-foreground"><DollarSign className="text-primary"/> Ingreso Fijo Mensual</h3>
              {isEditingSalario ? (
                 <div className="flex gap-2">
                    <input type="number" className="flex-1 bg-secondary/50 border border-border rounded-lg px-4 py-2 text-foreground" 
                           placeholder="Ej: 800000" value={salarioInput} onChange={e => setSalarioInput(e.target.value)} />
                    <button onClick={handleSaveSalario} className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium">Guardar</button>
                    <button onClick={() => setIsEditingSalario(false)} className="text-muted-foreground px-4">Cancelar</button>
                 </div>
              ) : (
                 <div className="flex justify-between items-center bg-secondary/30 p-4 border border-border/50 rounded-xl">
                    <div>
                      <p className="text-sm text-muted-foreground">Salario depositado</p>
                      <p className="text-2xl font-bold text-foreground">{formatter.format(salarioFijo)}</p>
                    </div>
                    <button onClick={() => { setSalarioInput(salarioFijo.toString()); setIsEditingSalario(true); }} className="text-primary hover:underline text-sm">Editar</button>
                 </div>
              )}
            </div>

            <div className="glass-panel border-border p-6">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-success"><TrendingUp className="text-success"/> Ingresos Extras Hoy</h3>
              <form onSubmit={handleAddIngreso} className="flex gap-2 mb-6">
                 <input type="number" placeholder="Monto" className="w-1/3 bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground" value={nuevoIngreso.monto} onChange={e => setNuevoIngreso({...nuevoIngreso, monto: e.target.value})} required />
                 <input type="text" placeholder="Ej: Venta, Uber..." className="flex-1 bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground" value={nuevoIngreso.descripcion} onChange={e => setNuevoIngreso({...nuevoIngreso, descripcion: e.target.value})} />
                 <button type="submit" className="bg-success text-success-foreground p-2 rounded-lg"><Plus size={20}/></button>
              </form>

              <div className="space-y-2 max-h-48 overflow-y-auto">
                {ingresosDelMes.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No hay ingresos extra este mes</p>
                ) : (
                  ingresosDelMes.map(ing => (
                    <div key={ing.id} className="flex justify-between items-center text-sm p-3 bg-card border border-border rounded-lg">
                       <div>
                         <p className="font-medium text-foreground">{formatter.format(ing.monto)}</p>
                         <p className="text-xs text-muted-foreground">{ing.descripcion || 'Sin descripción'} • {new Date(ing.fecha).toLocaleDateString()}</p>
                       </div>
                       <button onClick={() => deleteIngreso(ing.id)} className="text-muted-foreground hover:text-destructive"><Trash2 size={16}/></button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: GASTOS DIARIOS */}
      {activeTab === 'gastos' && (
        <div className="space-y-6 animate-fade-in">
           <div className="glass-panel border-border p-6">
              <h2 className="text-xl font-bold mb-6 text-foreground flex items-center gap-2"><TrendingDown className="text-destructive"/> Registrar Gasto</h2>
              <form onSubmit={handleAddGasto} className="space-y-4">
                 <div className="grid grid-cols-2 gap-4">
                   <div>
                     <label className="text-xs text-muted-foreground">Monto</label>
                     <input type="number" className="w-full bg-secondary/50 border border-border rounded-lg px-4 py-2 mt-1 text-foreground" placeholder="0" value={nuevoGasto.monto} onChange={e => setNuevoGasto({...nuevoGasto, monto: e.target.value})} required />
                   </div>
                   <div>
                     <label className="text-xs text-muted-foreground">Categoría</label>
                     <select className="w-full bg-secondary/50 border border-border rounded-lg px-4 py-2 mt-1 text-foreground" value={nuevoGasto.categoria} onChange={e => setNuevoGasto({...nuevoGasto, categoria: e.target.value})}>
                       {CATEGORIES.map(c => <option key={c} value={c} className="bg-card">{c}</option>)}
                     </select>
                   </div>
                 </div>
                 <div className="grid grid-cols-[1fr_auto] gap-4">
                   <div>
                     <label className="text-xs text-muted-foreground">Descripción (Opcional)</label>
                     <input type="text" className="w-full bg-secondary/50 border border-border rounded-lg px-4 py-2 mt-1 text-foreground" placeholder="Ej: Kiosco, Panadería..." value={nuevoGasto.descripcion} onChange={e => setNuevoGasto({...nuevoGasto, descripcion: e.target.value})} />
                   </div>
                   <div>
                     <label className="text-xs text-muted-foreground block mb-1">Medio</label>
                     <div className="flex gap-2">
                       <button type="button" onClick={() => setNuevoGasto({...nuevoGasto, medio_pago: 'efectivo'})} className={`px-4 py-2 rounded-lg text-sm transition-colors ${nuevoGasto.medio_pago === 'efectivo' ? 'bg-primary/20 text-primary border border-primary/50' : 'bg-secondary border border-border text-muted-foreground'}`}>Cash</button>
                       <button type="button" onClick={() => setNuevoGasto({...nuevoGasto, medio_pago: 'transferencia'})} className={`px-4 py-2 rounded-lg text-sm transition-colors ${nuevoGasto.medio_pago === 'transferencia' ? 'bg-primary/20 text-primary border border-primary/50' : 'bg-secondary border border-border text-muted-foreground'}`}>Transf</button>
                     </div>
                   </div>
                 </div>
                 <button type="submit" className="w-full bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive hover:text-white transition-colors py-3 rounded-lg font-medium mt-2">
                   Agregar Gasto
                 </button>
              </form>
           </div>

           <div className="glass-panel border-border p-6">
              <h3 className="text-lg font-bold mb-4 text-foreground">Gastos del Mes</h3>
              <div className="space-y-3">
                 {gastosDiariosDelMes.length === 0 ? (
                   <p className="text-center text-muted-foreground py-8">Aún no registraste gastos este mes</p>
                 ) : (
                   gastosDiariosDelMes.map(g => (
                     <div key={g.id} className="flex justify-between items-center p-3 bg-secondary/30 border border-border/50 rounded-xl hover:bg-secondary/50 transition-colors">
                        <div className="flex flex-col">
                           <span className="font-medium text-foreground">{g.categoria}</span>
                           <span className="text-xs text-muted-foreground">{g.descripcion || g.medio_pago} • {new Date(g.fecha).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-4">
                           <span className="font-bold text-destructive">{formatter.format(g.monto)}</span>
                           <button onClick={() => deleteGastoDiario(g.id)} className="text-muted-foreground hover:text-destructive"><Trash2 size={16}/></button>
                        </div>
                     </div>
                   ))
                 )}
              </div>
           </div>
        </div>
      )}

      {/* TAB 3: CHAT IA */}
      {activeTab === 'chat' && (
        <div className="glass-panel border-border p-4 flex flex-col h-[600px] animate-fade-in relative z-10 overflow-hidden">
           {/* Header & Quick actions */}
           <div className="mb-4 space-y-3 shrink-0">
             <div className="flex items-center gap-2 text-primary font-bold">
               <MessageSquare size={20} /> Asesor IA
             </div>
             <div className="flex flex-wrap gap-2">
               <button onClick={() => handleSendMessage("¿Cómo voy este mes?")} className="text-xs bg-secondary hover:bg-primary/20 text-foreground border border-border px-3 py-1.5 rounded-full transition-colors whitespace-nowrap">📊 ¿Cómo voy este mes?</button>
               <button onClick={() => handleSendMessage("¿En qué estoy gastando de más?")} className="text-xs bg-secondary hover:bg-primary/20 text-foreground border border-border px-3 py-1.5 rounded-full transition-colors whitespace-nowrap">💸 ¿En qué gasto de más?</button>
               <button onClick={() => handleSendMessage("¿Cuánto puedo gastar hoy?")} className="text-xs bg-secondary hover:bg-primary/20 text-foreground border border-border px-3 py-1.5 rounded-full transition-colors whitespace-nowrap">💰 Presupuesto de hoy</button>
               <button onClick={() => handleSendMessage("Dame consejos de ahorro")} className="text-xs bg-secondary hover:bg-primary/20 text-foreground border border-border px-3 py-1.5 rounded-full transition-colors whitespace-nowrap">💡 Consejos reales</button>
             </div>
           </div>

           {/* Chat Area */}
           <div className="flex-1 overflow-y-auto space-y-4 pr-2 mb-4 scrollbar-hide flex flex-col">
              {chatHistory.length === 0 && (
                 <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground opacity-50">
                    <MessageSquare size={48} className="mb-4" />
                    <p>Soy tu asesor financiero personal.</p>
                    <p className="text-sm">Tengo acceso a tus números. Preguntame lo que quieras.</p>
                 </div>
              )}
              {chatHistory.map((msg, i) => (
                 <div key={i} className={`flex max-w-[85%] ${msg.role === 'user' ? 'self-end bg-primary/20 border-primary/30 text-foreground ml-auto' : 'self-start bg-secondary/80 border-border text-foreground mr-auto'} border p-3 rounded-2xl ${msg.role === 'user' ? 'rounded-br-sm' : 'rounded-bl-sm'}`}>
                    <div className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</div>
                 </div>
              ))}
              {chatLoading && (
                 <div className="self-start bg-secondary/50 border border-border p-3 rounded-2xl rounded-bl-sm flex gap-2">
                   <div className="w-2 h-2 bg-primary animate-bounce rounded-full" style={{ animationDelay: '0ms' }} />
                   <div className="w-2 h-2 bg-primary animate-bounce rounded-full" style={{ animationDelay: '150ms' }} />
                   <div className="w-2 h-2 bg-primary animate-bounce rounded-full" style={{ animationDelay: '300ms' }} />
                 </div>
              )}
           </div>

           {/* Input */}
           <div className="shrink-0 pt-2 border-t border-border">
             <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(chatInput); }} className="flex gap-2">
               <input 
                 type="text" 
                 value={chatInput}
                 onChange={e => setChatInput(e.target.value)}
                 placeholder="Escribe tu pregunta..." 
                 className="flex-1 bg-secondary border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                 disabled={chatLoading}
               />
               <button type="submit" disabled={chatLoading || !chatInput.trim()} className="bg-primary hover:bg-primary/90 disabled:opacity-50 text-white p-3 rounded-xl transition-colors">
                 <Send size={20} className="ml-0.5" />
               </button>
             </form>
           </div>
        </div>
      )}

    </div>
  );
}
