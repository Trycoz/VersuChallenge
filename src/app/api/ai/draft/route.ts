import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

interface DraftRequest {
  cliente_nombre: string;
  contacto_nombre: string;
  contacto_telefono?: string;
  contacto_email?: string;
  id_documento: string;
  monto: number;
  dias_mora: number;
  en_disputa: boolean;
  es_vip: boolean;
  canal: "whatsapp" | "email";
}

function getDeterministicFallback(data: DraftRequest): { draft: string; tone: string } {
  const montoFormatted = `$${Math.round(data.monto).toLocaleString("es-CL")}`;
  const contacto = data.contacto_nombre && data.contacto_nombre !== "Sin contacto" 
    ? data.contacto_nombre 
    : "Estimado cliente";

  if (data.en_disputa) {
    const tone = "Diplomático / Revisión de Factura (Disputa Comercial)";
    if (data.canal === "whatsapp") {
      return {
        tone,
        draft: `Hola ${contacto}, te saludamos del equipo de administración de Nortia Supply. Nos comunicamos respecto a la factura ${data.id_documento} por ${montoFormatted}. Tenemos registrado un reclamo/observación pendiente con su cuenta y queremos asegurarnos de revisarla juntos con el equipo comercial antes de cualquier gestión de pago. ¿Tienes 5 minutos para coordinar? Quedo atenta.`,
      };
    }
    return {
      tone,
      draft: `Estimado/a ${contacto},\n\nEsperando que se encuentre muy bien, le escribe el equipo de cobranzas de Nortia Supply.\n\nNos ponemos en contacto en relación con la factura ${data.id_documento} emitida a ${data.cliente_nombre} por un monto de ${montoFormatted}.\n\nTenemos constancia de que este documento presenta una observación o disputa en curso. Para nosotros su relación comercial es prioritaria y queremos asegurarnos de resolver cualquier diferencia antes de avanzar con el proceso regular de cobro. Nuestro equipo comercial ya está al tanto para coordinar una pronta solución.\n\nQuedo a su disposición para coordinar los detalles que estime pertinentes.\n\nAtentamente,\nEquipo de Administración y Cobranzas\nNortia Supply`,
    };
  }

  if (data.es_vip) {
    const tone = "Consultivo y Cordial (Cuenta Estratégica VIP)";
    if (data.canal === "whatsapp") {
      return {
        tone,
        draft: `Hola ${contacto}, gusto en saludarte. Te escribo de parte del equipo de cuentas de Nortia Supply. Quería hacer una consulta administrativa breve sobre la factura ${data.id_documento} por ${montoFormatted}, que venció hace ${data.dias_mora} días. Como ${data.cliente_nombre} es una de nuestras cuentas estratégicas, queríamos confirmar si necesitan que les reenviemos el documento o si ya tienen programada la fecha de transferencia. ¡Muchas gracias!`,
      };
    }
    return {
      tone,
      draft: `Estimado/a ${contacto},\n\nJunto con saludar cordialmente y agradecer la constante confianza depositada en Nortia Supply por parte de ${data.cliente_nombre}, le escribo para realizar una breve consulta administrativa.\n\nRevisando el estado de cuenta, registramos la factura ${data.id_documento} por un importe de ${montoFormatted}, la cual cumplió su fecha de vencimiento hace ${data.dias_mora} días.\n\nComprendemos que en ocasiones pueden existir desfases operativos o de validación interna. Le agradeceríamos nos confirme si requiere una copia del documento o la fecha estimada para su programación bancaria.\n\nQuedamos muy atentos a su respuesta.\n\nSaludos cordiales,\nDepartamento de Cobranzas\nNortia Supply`,
    };
  }

  // Regular Overdue
  const tone = data.dias_mora > 45 ? "Formal y Firme (Mora Prolongada)" : "Recordatorio Profesional";
  if (data.canal === "whatsapp") {
    return {
      tone,
      draft: `Estimado/a ${contacto}, le saluda el equipo de cobranzas de Nortia Supply. Nos comunicamos para solicitar la regularización de la factura vencida ${data.id_documento} por ${montoFormatted} (${data.dias_mora} días de atraso). Por favor enviar comprobante de transferencia a este número o indicarnos cuándo queda regularizado el saldo hoy. Saludos.`,
    };
  }

  return {
    tone,
    draft: `Estimado/a ${contacto},\n\nPor medio del presente correo le recordamos que la factura ${data.id_documento} emitida a ${data.cliente_nombre} por un saldo pendiente de ${montoFormatted} presenta un atraso de ${data.dias_mora} días respecto a su fecha de vencimiento.\n\nLe solicitamos gestionar el pago a la brevedad y remitir el comprobante de transferencia bancaria a este correo para imputar el saldo en el sistema.\n\nDatos de transferencia:\n• Banco: Banco de Chile\n• Cuenta Corriente: 00-123456-78\n• Titular: Nortia Supply SpA\n• RUT: 76.543.210-K\n\nSi ya realizó el pago en las últimas 24 horas, por favor desestime este mensaje.\n\nAtentamente,\nCobranzas Nortia Supply`,
  };
}

export async function POST(req: NextRequest) {
  try {
    const data: DraftRequest = await req.json();

    const apiKey = process.env.GEMINI_API_KEY;
    const isApiKeyConfigured = apiKey && apiKey !== "tu-api-key" && apiKey.trim().length > 15;

    // Ponytail fallback: if no valid API key, return deterministic fallback immediately with zero latency
    if (!isApiKeyConfigured) {
      const fallback = getDeterministicFallback(data);
      return NextResponse.json({
        draft: fallback.draft,
        tone: fallback.tone,
        source: "fallback",
        note: "Generado mediante reglas comerciales deterministas (sin API Key externa).",
      });
    }

    // Call Google Gemini API (gemini-3.5-flash-lite) via native fetch
    const prompt = `Eres el asistente de cobranzas de Nortia Supply, una distribuidora B2B. Redacta un mensaje de cobro breve y efectivo para ${data.canal === "whatsapp" ? "WhatsApp" : "Correo electrónico"}.

Información del cliente y factura:
- Razón Social: ${data.cliente_nombre}
- Contacto: ${data.contacto_nombre}
- Factura: ${data.id_documento}
- Saldo pendiente: $${Math.round(data.monto).toLocaleString("es-CL")}
- Días de mora: ${data.dias_mora} días
- ¿Está en disputa/reclamo?: ${data.en_disputa ? "SÍ (el cliente reclamó la factura por error)" : "NO"}
- ¿Es cliente VIP/Cuenta clave?: ${data.es_vip ? "SÍ (cuenta muy grande, riesgo de perderla si somos agresivos)" : "NO"}

Reglas de tono comercial:
1. Si está en disputa: Sé muy diplomático, empático y pide revisar el caso juntos antes de cobrar. Cero agresividad.
2. Si es cliente VIP: Tono consultivo y de servicio. Pregunta amablemente si necesitan reenviar la factura o la fecha de programación.
3. Si es cliente estándar con mora prolongada: Tono formal, claro y directo solicitando la regularización.

Entrega ÚNICAMENTE el texto final del mensaje, listo para enviar. Sin introducciones ni notas explicativas.`;

    // Lowest cost Gemini model: gemini-3.5-flash-lite ($0.075/1M tokens, lowest tier in Google catalog)
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${apiKey}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 9000); // 9s timeout

    const geminiRes = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 180, // Capped to minimize token cost
        },
      }),
      signal: controller.signal,
    }).finally(() => clearTimeout(timeout));

    if (!geminiRes.ok) {
      console.warn("Gemini Flash-Lite error or limit reached, activating $0 deterministic fallback:", geminiRes.status);
      const fallback = getDeterministicFallback(data);
      return NextResponse.json({
        draft: fallback.draft,
        tone: fallback.tone,
        source: "fallback",
      });
    }

    const geminiData = await geminiRes.json();
    const generatedText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!generatedText) {
      const fallback = getDeterministicFallback(data);
      return NextResponse.json({
        draft: fallback.draft,
        tone: fallback.tone,
        source: "fallback",
      });
    }

    const tone = data.en_disputa 
      ? "Diplomático / En Disputa" 
      : data.es_vip 
      ? "Consultivo VIP" 
      : data.dias_mora > 45 
      ? "Firme & Formal" 
      : "Recordatorio Estándar";

    return NextResponse.json({
      draft: generatedText.trim(),
      tone,
      source: "ai",
      model: "gemini-3.5-flash-lite",
    });
  } catch (err: any) {
    console.warn("Exception calling AI endpoint, returning deterministic fallback:", err.message);
    const safeFallbackData: DraftRequest = {
      cliente_nombre: "Cliente",
      contacto_nombre: "Estimado cliente",
      id_documento: "Factura",
      monto: 0,
      dias_mora: 30,
      en_disputa: false,
      es_vip: false,
      canal: "whatsapp",
    };
    const fallback = getDeterministicFallback(safeFallbackData);
    return NextResponse.json({
      draft: fallback.draft,
      tone: fallback.tone,
      source: "fallback",
    });
  }
}
