import { GoogleGenAI, Type } from "@google/genai";
import { MidiData } from "../types";

const initGenAI = () => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing");
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const analyzeMidiForStudents = async (midiData: MidiData): Promise<{ difficulty: string, tips: string[], description: string }> => {
  try {
    const ai = initGenAI();
    
    // Extract relevant data for the prompt
    const track = midiData.tracks[0]; // Assume melody is on track 0 or the one with most notes
    if (!track) throw new Error("No tracks found");

    const notes = track.notes.map(n => n.name);
    const uniqueNotes = Array.from(new Set(notes)).sort();
    const tempo = midiData.header.tempos[0]?.bpm || 120;
    const duration = midiData.duration.toFixed(2);
    
    // Construct prompt
    const prompt = `
      Actúa como un profesor experto de música para niños que aprenden Flauta Dulce (Recorder).
      Analiza los siguientes datos de una canción MIDI:
      - Notas usadas: ${uniqueNotes.join(', ')}
      - Tempo original: ${tempo} BPM
      - Duración: ${duration} segundos
      
      Provee una respuesta estructurada en JSON con:
      1. 'difficulty': Nivel de dificultad (Fácil, Intermedio, Avanzado) basado en las notas (ej. si usa sostenidos difíciles o notas muy agudas).
      2. 'tips': Un array de 3 consejos breves y prácticos para tocar esta pieza en flauta dulce (ej. digitación de notas específicas, control de aire).
      3. 'description': Una descripción muy breve y animada de qué parece ser la canción (basado en ritmo/notas) o simplemente palabras de ánimo.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            difficulty: { type: Type.STRING },
            tips: { 
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            description: { type: Type.STRING }
          }
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    return JSON.parse(text);

  } catch (error) {
    console.error("Error generating analysis:", error);
    return {
      difficulty: "Desconocida",
      tips: ["Practica despacio al principio.", "Asegúrate de tapar bien los agujeros.", "Disfruta la música."],
      description: "No pudimos conectar con el profesor virtual, ¡pero tú puedes hacerlo!"
    };
  }
};