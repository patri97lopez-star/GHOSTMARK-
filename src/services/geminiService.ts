import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface EnrichmentResult {
  companyName: string;
  contactEmail: string;
  linkedInUrl: string;
  sentimentScore: number;
  opportunityLoss: number;
  sector: string;
  proposal: string;
  keyMoment: string;
  targetProduct: 'Logo' | 'Newsletter' | 'Web Design' | 'CEO Branding';
}

export async function analyzeProspect(url: string, content: string): Promise<EnrichmentResult> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Analiza el contenido de este sitio web de negocios: ${content} (URL: ${url}). 
    Extrae la siguiente información en formato JSON:
    - companyName: string
    - contactEmail: string
    - linkedInUrl: string
    - sentimentScore: number (0-1)
    - opportunityLoss: number
    - sector: string
    - proposal: string (propuesta de marketing personalizada, en español)
    - keyMoment: string (una razón corta y atractiva de por qué AHORA es el momento de contactar, ej: "Rebranding reciente", "Mala experiencia móvil", "Alto volumen de reseñas negativas", en español)
    - targetProduct: string (elige estrictamente una de estas opciones basándote en lo que más necesita el cliente: 
        "Ideas de Market / Eslogan / Logo" si necesita identidad o ideas de mercado, 
        "Follet (Folleto) / Newsletter o Mailing" si necesita material informativo o retención, 
        "RRSS (Redes Sociales) / Banner" si necesita visibilidad en redes o publicidad gráfica)`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          companyName: { type: Type.STRING },
          contactEmail: { type: Type.STRING },
          linkedInUrl: { type: Type.STRING },
          sentimentScore: { type: Type.NUMBER },
          opportunityLoss: { type: Type.NUMBER },
          sector: { type: Type.STRING },
          proposal: { type: Type.STRING },
          keyMoment: { type: Type.STRING },
          targetProduct: { 
            type: Type.STRING, 
            enum: [
              "Ideas de Market / Eslogan / Logo", 
              "Follet (Folleto) / Newsletter o Mailing", 
              "RRSS (Redes Sociales) / Banner"
            ] 
          },
        },
        required: ["companyName", "contactEmail", "opportunityLoss", "keyMoment", "targetProduct"]
      }
    }
  });

  return JSON.parse(response.text.trim());
}

export async function generateNewsletter(prospect: any, brandVoice: string): Promise<{ subject: string, content: string, cta: string, productHighlight: string }> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Actúa como un experto en Email Marketing.
    Genera una Newsletter de alta conversión adaptada ESTRATÉGICAMENTE al producto objetivo: ${prospect.targetProduct}.
    
    Empresa: ${prospect.companyName}
    Sector: ${prospect.sector}
    Propuesta base: ${prospect.proposal}
    Punto clave: ${prospect.keyMoment}
    Voz de Marca: ${brandVoice}

    Estructura requerida (JSON):
    - subject: un asunto irresistible.
    - content: el cuerpo del mensaje centrado en cómo ${prospect.targetProduct} resuelve su problema.
    - productHighlight: una breve descripción técnica o beneficio clave del producto.
    - cta: el texto del botón de acción.

    Formato de salida:
    {
      "subject": "string",
      "content": "string (usa \n)",
      "productHighlight": "string",
      "cta": "string"
    }`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          subject: { type: Type.STRING },
          content: { type: Type.STRING },
          productHighlight: { type: Type.STRING },
          cta: { type: Type.STRING }
        },
        required: ["subject", "content", "productHighlight", "cta"]
      }
    }
  });

  return JSON.parse(response.text.trim());
}

export async function generateVideoScript(prospect: any, brandVoice: string): Promise<{ script: string, avatarInstructions: string }> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Genera un guion de 45 segundos para un Video-Pitch de IA (HeyGen/Synthesia).
    Empresa: ${prospect.companyName}
    Sector: ${prospect.sector}
    Voz de Marca: ${brandVoice}
    Punto de dolor: ${prospect.keyMoment}
    Propuesta: ${prospect.proposal}

    El guion debe ser ultra-personalizado y directo.
    Salida en JSON:
    {
      "script": "string (el guion literario en español)",
      "avatarInstructions": "string (instrucciones sobre cómo debe actuar el avatar: gestos, tono, fondo)"
    }`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          script: { type: Type.STRING },
          avatarInstructions: { type: Type.STRING }
        },
        required: ["script", "avatarInstructions"]
      }
    }
  });

  return JSON.parse(response.text.trim());
}

export async function analyzeCompetitors(companyName: string, sector: string): Promise<{ competitors: { name: string, weakness: string, url: string }[] }> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Simula una búsqueda en Google para: "competidores de ${companyName}" y "mejores empresas de ${sector}".
    Identifica de 5 a 10 competidores directos o alternativas relevantes.
    
    Salida obligatoria en JSON:
    {
      "competitors": [
        { 
          "name": "Nombre Real de la Empresa", 
          "weakness": "Carencia específica detectada (ej: No tiene reserva online, web lenta, mal SEO)",
          "url": "https://www.competidor.com" 
        }
      ]
    }`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          competitors: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                weakness: { type: Type.STRING },
                url: { type: Type.STRING }
              },
              required: ["name", "weakness", "url"]
            }
          }
        }
      }
    }
  });

  return JSON.parse(response.text.trim());
}

export async function generateSocialStrategy(prospect: any): Promise<{ platform: string, ideas: string[] }[]> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Genera una micro-estrategia de redes sociales para ${prospect.companyName}.
    Propuesta: ${prospect.proposal}
    Salida en JSON:
    [
      { "platform": "Instagram", "ideas": ["idea 1", "idea 2"] },
      { "platform": "LinkedIn", "ideas": ["idea 1", "idea 2"] }
    ]`,
    config: {
      responseMimeType: "application/json"
    }
  });

  return JSON.parse(response.text.trim());
}

export async function generateSEOAnalysis(prospect: any): Promise<{ keywords: string[], metaDescription: string }> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Genera 5 palabras clave de alta intención y una Meta Description ganadora para ${prospect.companyName} (${prospect.sector}).
    Salida en JSON:
    {
      "keywords": ["keyword1", "..."],
      "metaDescription": "string"
    }`,
    config: {
      responseMimeType: "application/json"
    }
  });

  return JSON.parse(response.text.trim());
}

export async function generateVisualHook(companyName: string, sector: string): Promise<string> {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-image",
    contents: `Un boceto de logo profesional y concepto visual de marca para una empresa de ${sector} llamada "${companyName}". 
    El estilo debe ser minimalista, moderno y orientado al marketing de alta conversión.`,
    config: {
      imageConfig: {
        aspectRatio: "1:1"
      }
    }
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  
  return "";
}

export async function analyzeSentiment(companyName: string, sector: string): Promise<{ score: number, label: string, summary: string }> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Analiza el sentimiento de marca para ${companyName} en el sector ${sector}.
    Calcula un score de 0 a 100 y proporciona un resumen de percepción de mercado.
    Salida en JSON:
    {
      "score": 85,
      "label": "Muy Positivo / Premium / Innovador",
      "summary": "Breve resumen de 2 líneas"
    }`,
    config: {
      responseMimeType: "application/json"
    }
  });

  return JSON.parse(response.text.trim());
}

export async function performScraping(query: string): Promise<{ name: string, url: string, sector: string, location: string, emails: string[], phone: string, description: string, socialLinks: {platform: string, url: string}[] }[]> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Simula una herramienta de Web Scraping (como Phantombuster o Google Maps API).
    Busca entidades reales o altamente realistas para esta entrada del usuario (búsqueda por nicho/localidad o exploración general):
    Búsqueda: "${query}"
    
    Identifica hasta 5-10 resultados. Devuélvelo en JSON. Usa herramientas si necesitas o simula si es genérico.
    Extrae o intuye correos electrónicos de contacto, teléfono, una descripción corta y enlaces a redes sociales.
    
    Estructura JSON (Obligatorio):
    {
      "results": [
        {
          "name": "string",
          "url": "string (URL completa tipo https://)",
          "sector": "string",
          "location": "string",
          "emails": ["email1@ejemplo.com"],
          "phone": "string",
          "description": "string",
          "socialLinks": [
             { "platform": "Instagram", "url": "https://..." }
          ]
        }
      ]
    }`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          results: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                url: { type: Type.STRING },
                sector: { type: Type.STRING },
                location: { type: Type.STRING },
                emails: { type: Type.ARRAY, items: { type: Type.STRING } },
                phone: { type: Type.STRING },
                description: { type: Type.STRING },
                socialLinks: { 
                  type: Type.ARRAY, 
                  items: { 
                    type: Type.OBJECT, 
                    properties: {
                      platform: { type: Type.STRING },
                      url: { type: Type.STRING }
                    } 
                  } 
                }
              },
              required: ["name", "url", "sector", "location", "emails", "phone", "description", "socialLinks"]
            }
          }
        }
      }
    }
  });

  const parsed = JSON.parse(response.text.trim());
  return parsed.results || [];
}
