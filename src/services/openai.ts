// La API key de OpenAI ya NO vive en el frontend.
// Todas las llamadas pasan por la Edge Function "openai-chat" que valida el JWT
// y usa OPENAI_API_KEY configurada como secret en Supabase.
import { supabase } from '@/lib/supabase';

interface OpenAIParams {
  messages: Array<{ role: string; content: string }>;
  temperature?: number;
  response_format?: { type: string };
}

async function callOpenAI(params: OpenAIParams): Promise<string> {
  const { data, error } = await supabase.functions.invoke('openai-chat', {
    body: params,
  });
  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);
  return data?.content ?? '';
}

export async function generateMonthlySummary(contextData: unknown): Promise<string> {
  const prompt = `
Analiza los datos financieros mensuales de este usuario de la aplicación Card Control.
Eres un asistente financiero experto.

Contexto numérico del usuario:
${JSON.stringify(contextData, null, 2)}

Instrucciones obligatorias:
1. Analiza cómo fue el mes en términos de gastos y suscripciones. Identifica cuál fue la carga general.
2. Menciona claramente 2 o 3 categorías donde más se gastó.
3. Evalúa el uso según el presupuesto disponible e infórmalo.
4. Finaliza con 3 consejos concretos, realistas y personalizados para ahorrar el próximo mes, basados en SUS datos, no genéricos.
5. Usa español natural de Argentina o neutro. Escribe en texto plano puro con saltos de línea, usa guiones para las listas. NO USES asteriscos (**) ni símbolos de markdown porque no tenemos renderizador de markdown. Usa emojis apropiados.
  `;

  return callOpenAI({
    messages: [
      { role: 'system', content: 'Eres un asesor financiero personal.' },
      { role: 'user', content: prompt },
    ],
    temperature: 0.7,
  });
}

export async function generateNextMonthPrediction(contextData: unknown): Promise<unknown> {
  const prompt = `
Eres un modelo predictivo integrado en Card Control.
Aquí tienes los gastos de los últimos 3 meses, cuotas activas, presupuestos de tarjetas y suscripciones:
${JSON.stringify(contextData, null, 2)}

Analiza estos patrones para predecir el próximo mes.
REGLA ESTRICTA: Devuelve EXCLUSIVAMENTE un JSON válido, sin formato \`\`\`json.
Estructura exacta:
{
  "totalGastosCategoria": [
    { "categoria": "Nombre", "monto": 999 }
  ],
  "riesgoTarjetas": [
    { "nombreTarjeta": "Visa", "mensaje": "Breve explicación del riesgo de excederse", "alertaCritica": true }
  ],
  "mensajeGeneral": "Cuerpo del mensaje general (ej. si superan 80% del límite total o cualquier insight)",
  "alertaPresupuestoGlobal": true/false
}
`;

  const content = await callOpenAI({
    messages: [
      { role: 'system', content: 'Eres una API que responde estrictamente en formato JSON válido.' },
      { role: 'user', content: prompt },
    ],
    temperature: 0.2,
    response_format: { type: 'json_object' },
  });

  return JSON.parse(content);
}

export async function chatWithFinanceAssistant(
  contextData: unknown,
  userMessage: string,
  history: { role: 'user' | 'assistant'; content: string }[],
): Promise<string> {
  const systemPrompt = `
Eres un asistente financiero personal integrado en la aplicación Card Control.
Tienes acceso al estado actual del usuario, incluyendo su salario mensual, ingresos registrados, gastos recientes, cuotas de tarjetas y suscripciones.

Contexto numérico del usuario de este mes:
${JSON.stringify(contextData, null, 2)}

Instrucciones:
- Responde en español directo y amigable.
- Si el usuario pregunta "cuánto puedo gastar", cálculalo restando los gastos fijos del mes del salario.
- Da consejos financieros basándote 100% en los números brindados en el contexto. No inventes gastos.
- Sé conciso y claro. NO uses lenguaje Markdown enriquecido como tablas, usa viñetas simples o texto plano con emojis.
- Si está gastando de más, diselo directamente pero con tacto.
  `;

  return callOpenAI({
    messages: [
      { role: 'system', content: systemPrompt },
      ...history.map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: userMessage },
    ],
    temperature: 0.7,
  });
}
