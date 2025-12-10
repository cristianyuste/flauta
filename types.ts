// Define basic types for MIDI structure used in the app
// Note: We use @tonejs/midi structure loosely here for typing props

export interface Note {
  name: string;
  midi: number;
  time: number;
  duration: number;
  velocity: number;
}

export interface Track {
  name: string;
  notes: Note[];
  instrument: {
    family: string;
    name: string;
  };
}

export interface MidiData {
  header: {
    name: string;
    tempos: { bpm: number }[];
    timeSignatures: { timeSignature: number[] }[];
  };
  duration: number;
  tracks: Track[];
}

export interface AnalysisResult {
  difficulty: string;
  tips: string[];
  description: string;
}
