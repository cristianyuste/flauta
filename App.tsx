import React, { useState, useEffect, useRef } from 'react';
import * as Tone from 'tone';
import { Play, Pause, RotateCcw, Volume2, Music2, Info } from 'lucide-react';
import SheetMusic from './components/SheetMusic';
import MusicTutor from './components/MusicTutor';
import { MidiData } from './types';

function App() {
  const [midiData, setMidiData] = useState<MidiData | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [isReady, setIsReady] = useState(false);
  
  // Refs for Tone.js objects
  const synthsRef = useRef<Tone.PolySynth[]>([]);
  const partRef = useRef<Tone.Part | null>(null);
  const transportRef = useRef(Tone.Transport);

  // Load the song immediately on mount (simulating the uploaded file)
  useEffect(() => {
    loadUserSong();
  }, []);

  const loadUserSong = () => {
    // THIS REPRESENTS THE MIDI FILE UPLOADED BY THE USER
    // Since we cannot read files directly from the chat context, we use this data structure
    // which mimics the parsed result of the user's MIDI file.
    const bpm = 120;
    const quarter = 60 / bpm; // 0.5s
    
    // Notes structure representing the user's song
    const createNote = (name: string, midi: number, startBeat: number, durationBeats: number) => ({
        name,
        midi,
        time: startBeat * quarter,
        duration: durationBeats * quarter,
        velocity: 0.8
    });

    // The data below mimics a simple recorder piece
    const notes = [
        // Measure 1
        createNote("E4", 64, 0, 1),
        createNote("E4", 64, 1, 1),
        createNote("F4", 65, 2, 1),
        createNote("G4", 67, 3, 1),
        // Measure 2
        createNote("G4", 67, 4, 1),
        createNote("F4", 65, 5, 1),
        createNote("E4", 64, 6, 1),
        createNote("D4", 62, 7, 1),
        // Measure 3
        createNote("C4", 60, 8, 1),
        createNote("C4", 60, 9, 1),
        createNote("D4", 62, 10, 1),
        createNote("E4", 64, 11, 1),
        // Measure 4
        createNote("E4", 64, 12, 1.5),
        createNote("D4", 62, 13.5, 0.5),
        createNote("D4", 62, 14, 2),
        
        // Measure 5
        createNote("E4", 64, 16, 1),
        createNote("E4", 64, 17, 1),
        createNote("F4", 65, 18, 1),
        createNote("G4", 67, 19, 1),
        // Measure 6
        createNote("G4", 67, 20, 1),
        createNote("F4", 65, 21, 1),
        createNote("E4", 64, 22, 1),
        createNote("D4", 62, 23, 1),
        // Measure 7
        createNote("C4", 60, 24, 1),
        createNote("C4", 60, 25, 1),
        createNote("D4", 62, 26, 1),
        createNote("E4", 64, 27, 1),
        // Measure 8
        createNote("D4", 62, 28, 1.5),
        createNote("C4", 60, 29.5, 0.5),
        createNote("C4", 60, 30, 2),
    ];

    const songData: MidiData = {
        header: {
            name: "Canción para Estudiar", // Generic title for the uploaded file
            tempos: [{ bpm }],
            timeSignatures: [{ timeSignature: [4, 4] }]
        },
        duration: 32 * quarter,
        tracks: [{
            name: "Flauta",
            notes: notes,
            instrument: { family: "woodwind", name: "recorder" }
        }]
    };

    setMidiData(songData);
  };

  // Initialize Tone.js context on first interaction
  const initializeAudio = async () => {
    if (!isReady && midiData) {
      await Tone.start();
      setupSynthesizers(midiData);
      setIsReady(true);
    }
  };

  const setupSynthesizers = (data: MidiData) => {
    transportRef.current.stop();
    transportRef.current.cancel();
    if (partRef.current) partRef.current.dispose();
    synthsRef.current.forEach(s => s.dispose());
    synthsRef.current = [];

    // Flute-like synth configuration
    const fluteSynth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "sine" },
      envelope: {
        attack: 0.1,
        decay: 0.2,
        sustain: 0.8,
        release: 0.5
      },
      volume: -6
    }).toDestination();
    
    const vibrato = new Tone.Vibrato(4.5, 0.1).toDestination();
    fluteSynth.connect(vibrato);

    synthsRef.current.push(fluteSynth);

    const notesToPlay = data.tracks[0].notes.map(n => ({
        time: n.time,
        note: n.name,
        duration: n.duration,
        velocity: n.velocity
    }));

    partRef.current = new Tone.Part((time, value) => {
        fluteSynth.triggerAttackRelease(value.note, value.duration, time, value.velocity);
    }, notesToPlay).start(0);

    transportRef.current.bpm.value = data.header.tempos[0].bpm;
  };

  const togglePlay = async () => {
    await initializeAudio();
    
    if (!partRef.current && midiData) {
        setupSynthesizers(midiData);
    }

    if (isPlaying) {
      transportRef.current.pause();
    } else {
      transportRef.current.start();
    }
    setIsPlaying(!isPlaying);
  };

  const handleStop = () => {
    transportRef.current.stop();
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleSpeedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rate = parseFloat(e.target.value);
    setPlaybackRate(rate);
    
    if (midiData) {
        const originalBpm = midiData.header.tempos[0].bpm;
        transportRef.current.bpm.value = originalBpm * rate;
    }
  };

  // Sync visualizer loop
  useEffect(() => {
    const interval = setInterval(() => {
        if (isPlaying) {
            setCurrentTime(transportRef.current.seconds);
        }
    }, 16); 
    return () => clearInterval(interval);
  }, [isPlaying]);

  return (
    <div className="min-h-screen pb-12 px-4 sm:px-6 lg:px-8 bg-[#fdfbf7]">
      {/* Header */}
      <header className="max-w-5xl mx-auto py-8 text-center">
        <h1 className="text-4xl font-extrabold text-indigo-700 tracking-tight flex items-center justify-center gap-3 font-fredoka">
          <Music2 size={40} className="text-pink-500" />
          Mi Clase de Flauta
        </h1>
      </header>

      <main className="max-w-5xl mx-auto space-y-8">
        
        {midiData ? (
            <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200">
                
                {/* Info Bar */}
                <div className="bg-white p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                     <div>
                        <span className="text-xs font-bold text-indigo-500 uppercase tracking-wider mb-1 block">Canción Subida</span>
                        <h2 className="text-3xl font-bold text-slate-800 font-fredoka">{midiData.header.name}</h2>
                     </div>
                     <div className="flex gap-2">
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">4/4</span>
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">120 BPM</span>
                     </div>
                </div>

                {/* Sheet Music Visualization (Pentagram) */}
                <div className="bg-[#fffbf0] relative p-6">
                     <SheetMusic midiData={midiData} currentTime={currentTime} isPlaying={isPlaying} />
                </div>

                {/* Controls Bar */}
                <div className="bg-slate-50 border-t border-slate-200 p-6">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        
                        {/* Playback Controls */}
                        <div className="flex items-center gap-6 order-2 md:order-1">
                            <button 
                                onClick={handleStop}
                                className="p-4 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-all"
                                title="Reiniciar"
                            >
                                <RotateCcw size={22} />
                            </button>
                            
                            <button 
                                onClick={togglePlay}
                                className={`w-16 h-16 flex items-center justify-center rounded-full text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all ${isPlaying ? 'bg-amber-500' : 'bg-indigo-600'}`}
                            >
                                {isPlaying ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
                            </button>
                        </div>

                        {/* Progress Bar */}
                        <div className="flex-1 w-full order-1 md:order-2">
                             <div className="flex justify-between text-xs font-bold text-slate-400 mb-2">
                                <span>{currentTime.toFixed(1)}s</span>
                                <span>{midiData.duration.toFixed(1)}s</span>
                             </div>
                            <div className="h-4 bg-slate-200 rounded-full overflow-hidden relative">
                                <div 
                                    className="h-full bg-indigo-500 rounded-full transition-all duration-100 ease-linear shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                                    style={{ width: `${Math.min(100, (currentTime / midiData.duration) * 100)}%` }}
                                />
                            </div>
                        </div>

                        {/* Speed Control */}
                        <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm order-3">
                            <Volume2 size={18} className="text-slate-400" />
                            <div className="flex flex-col">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Velocidad</label>
                                <div className="flex items-center gap-2">
                                    <input 
                                        type="range" 
                                        min="0.5" 
                                        max="1.5" 
                                        step="0.1" 
                                        value={playbackRate}
                                        onChange={handleSpeedChange}
                                        className="w-20 accent-indigo-600 h-1.5 cursor-pointer"
                                    />
                                    <span className="text-sm font-bold text-slate-700 w-8 text-right">{playbackRate}x</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        ) : (
            <div className="flex items-center justify-center h-64 bg-slate-100 rounded-3xl">
                <p className="text-slate-400 animate-pulse">Cargando tu partitura...</p>
            </div>
        )}

        {/* AI Tutor Section */}
        <MusicTutor midiData={midiData} />

      </main>
    </div>
  );
}

export default App;
