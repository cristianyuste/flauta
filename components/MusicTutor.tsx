import React, { useState } from 'react';
import { Sparkles, GraduationCap, Music, AlertCircle } from 'lucide-react';
import { MidiData, AnalysisResult } from '../types';
import { analyzeMidiForStudents } from '../services/geminiService';

interface MusicTutorProps {
  midiData: MidiData | null;
}

const MusicTutor: React.FC<MusicTutorProps> = ({ midiData }) => {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!midiData) return;
    setLoading(true);
    setError(null);
    try {
      const result = await analyzeMidiForStudents(midiData);
      setAnalysis(result);
    } catch (err) {
      setError("Hubo un error al consultar al profesor virtual.");
    } finally {
      setLoading(false);
    }
  };

  if (!midiData) return null;

  return (
    <div className="bg-white p-6 rounded-2xl shadow-xl border border-indigo-100 mt-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-indigo-900 flex items-center gap-2">
          <GraduationCap className="text-indigo-600" />
          Profesor Virtual
        </h3>
        {!analysis && !loading && (
          <button
            onClick={handleAnalyze}
            className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-4 py-2 rounded-full font-semibold hover:from-indigo-600 hover:to-purple-600 transition-all shadow-md active:scale-95"
          >
            <Sparkles size={18} />
            Analizar Canción
          </button>
        )}
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-8 text-indigo-400 animate-pulse">
          <Sparkles className="animate-spin mb-2" size={32} />
          <p>Escuchando y analizando la partitura...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center gap-2">
            <AlertCircle size={20} />
            {error}
        </div>
      )}

      {analysis && (
        <div className="space-y-4 animate-fade-in">
          <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
            <h4 className="font-bold text-indigo-800 mb-1">Sobre esta canción:</h4>
            <p className="text-indigo-700 italic">"{analysis.description}"</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className={`p-4 rounded-xl border-l-4 ${
                analysis.difficulty === 'Fácil' ? 'bg-green-50 border-green-500' :
                analysis.difficulty === 'Intermedio' ? 'bg-yellow-50 border-yellow-500' :
                'bg-red-50 border-red-500'
            }`}>
              <span className="text-xs font-bold uppercase tracking-wider opacity-70">Dificultad</span>
              <p className="text-lg font-bold">{analysis.difficulty}</p>
            </div>
            
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Consejos de Práctica</span>
                <ul className="mt-2 space-y-2">
                    {analysis.tips.map((tip, i) => (
                        <li key={i} className="flex items-start gap-2 text-slate-700 text-sm">
                            <Music size={16} className="mt-1 text-pink-500 shrink-0" />
                            <span>{tip}</span>
                        </li>
                    ))}
                </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MusicTutor;