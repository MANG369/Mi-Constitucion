import { GoogleGenAI } from "@google/genai";
import type { GenerateContentResponse } from "@google/genai";
import type { Articulo } from '../types';

// Singleton instance, lazily initialized.
let ai: GoogleGenAI | null = null;

/**
 * Initializes and returns the GoogleGenAI client instance.
 * Throws a user-friendly error if the API key is not available or initialization fails.
 */
function getAiClient(): GoogleGenAI {
  // Return the existing instance if it's already created
  if (ai) {
    return ai;
  }

  const API_KEY = process.env.API_KEY;

  if (!API_KEY) {
    console.error("API_KEY environment variable not set. Gemini API calls will fail.");
    throw new Error("La clave API de Gemini no está configurada o no es válida.");
  }

  try {
    // Create and cache the instance
    ai = new GoogleGenAI({ apiKey: API_KEY });
    return ai;
  } catch (error) {
    console.error("Failed to initialize GoogleGenAI client:", error);
    throw new Error("No se pudo inicializar el cliente de IA.");
  }
}

interface ArticleContext {
  tituloNombre: string | null;
  capituloNombre: string | null;
  seccionNombre: string | null;
}

export async function getInterpretation(articulo: Articulo, context: ArticleContext): Promise<string> {
  try {
    const client = getAiClient(); // Lazily initializes the client on first call

    const { numero: articleNumber, texto: articleText } = articulo;
    const { tituloNombre, capituloNombre, seccionNombre } = context;

    const contextString = [
        tituloNombre,
        capituloNombre,
        seccionNombre
    ].filter(Boolean).join(' / ');


    const prompt = `
      Eres un experto en derecho constitucional venezolano. Tu tarea es explicar el siguiente artículo de la Constitución de la República Bolivariana de Venezuela (1999) en un lenguaje claro, sencillo y accesible para un ciudadano promedio, sin conocimientos legales.

      **Contexto:** ${contextString}

      **Instrucciones:**
      1.  **Simplifica:** Evita la jerga legal compleja. Usa analogías o ejemplos si ayudan a clarificar.
      2.  **Contextualiza:** Explica brevemente el propósito del artículo y su importancia dentro del marco constitucional, tomando en cuenta su ubicación en el título y capítulo proporcionado.
      3.  **Desglosa:** Si el artículo es largo, divídelo en sus puntos clave y explícalos uno por uno.
      4.  **Enfoque:** Concéntrate en el significado práctico del artículo: ¿cómo afecta los derechos y deberes de los ciudadanos? ¿Qué rol le asigna al Estado?
      5.  **Formato:** Usa párrafos cortos y considera el uso de negritas (**texto en negrita**) para resaltar conceptos clave. No uses markdown de títulos (#). La respuesta debe ser solo texto y párrafos.

      **Artículo a interpretar:**
      **Artículo ${articleNumber}:** "${articleText}"

      Por favor, genera la explicación.
    `;

    const response: GenerateContentResponse = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    
    const text = response.text;
    if (!text) {
      throw new Error("La respuesta de la API no contiene texto.");
    }

    return text;
  } catch (error) {
    console.error("Error fetching interpretation from Gemini:", error);
    // Propagate the error to be handled by the UI component.
    // If it's a known error from getAiClient, it will be user-friendly.
    // Otherwise, create a generic one.
    if (error instanceof Error) {
        if (error.message.includes("API") || error.message.includes("cliente")) {
            throw error;
        }
    }
    throw new Error("No se pudo conectar con el servicio de IA. Por favor, inténtelo más tarde.");
  }
}
