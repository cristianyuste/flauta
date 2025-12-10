import React, { useRef, useEffect } from 'react';
import { MidiData } from '../types';

interface PianoRollProps {
  midiData: MidiData | null;
  currentTime: number;
  isPlaying: boolean;
}

const PianoRoll: React.FC<PianoRollProps> = ({ midiData, currentTime, isPlaying }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Constants for rendering
  const PIXELS_PER_SECOND = 100;
  const NOTE_HEIGHT = 20;
  const KEY_WIDTH = 60;
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !midiData) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 1. Calculate note range to fit canvas vertically
    let minMidi = 127;
    let maxMidi = 0;
    
    // Combine notes from all tracks that have notes
    const allNotes = midiData.tracks.flatMap(t => t.notes);
    
    if (allNotes.length === 0) return;

    allNotes.forEach(n => {
      if (n.midi < minMidi) minMidi = n.midi;
      if (n.midi > maxMidi) maxMidi = n.midi;
    });

    // Add some padding notes
    minMidi = Math.max(0, minMidi - 2);
    maxMidi = Math.min(127, maxMidi + 2);
    const noteRange = maxMidi - minMidi + 1;

    // Resize canvas
    const parent = canvas.parentElement;
    if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = Math.max(300, noteRange * NOTE_HEIGHT);
    }

    const render = () => {
      if (!ctx || !canvas) return;
      
      // Clear
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Fill Background
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Current Time Offset (Center the playhead or keep it left)
      // Let's keep playhead at 20% of width
      const playheadX = KEY_WIDTH + 50; 
      const scrollOffset = currentTime * PIXELS_PER_SECOND;

      // Draw Rows (Notes background)
      for (let i = 0; i < noteRange; i++) {
        const midiNote = maxMidi - i;
        const y = i * NOTE_HEIGHT;
        
        // Horizontal grid line
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();

        // Note Label (Left sidebar)
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, y, KEY_WIDTH, NOTE_HEIGHT);
        ctx.fillStyle = '#64748b';
        ctx.font = '10px Inter';
        ctx.textBaseline = 'middle';
        
        // Convert Midi to Note Name (Simple implementation)
        const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const noteName = noteNames[midiNote % 12];
        const octave = Math.floor(midiNote / 12) - 1;
        
        ctx.fillText(`${noteName}${octave}`, 5, y + NOTE_HEIGHT / 2);
        
        // Divider
        ctx.strokeStyle = '#cbd5e1';
        ctx.beginPath();
        ctx.moveTo(KEY_WIDTH, 0);
        ctx.lineTo(KEY_WIDTH, canvas.height);
        ctx.stroke();
      }

      // Draw Playhead Line
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(playheadX, 0);
      ctx.lineTo(playheadX, canvas.height);
      ctx.stroke();

      // Draw Notes
      allNotes.forEach(note => {
        // Calculate Y
        const rowIndex = maxMidi - note.midi;
        const y = rowIndex * NOTE_HEIGHT + 2; // +2 for padding inside row
        const h = NOTE_HEIGHT - 4;

        // Calculate X based on time and scroll
        const startX = playheadX + (note.time * PIXELS_PER_SECOND) - scrollOffset;
        const width = note.duration * PIXELS_PER_SECOND;

        // Optimization: Don't draw if off screen
        if (startX + width < 0 || startX > canvas.width) return;

        // Check if currently playing (intersects playhead)
        const isPlayingNote = (currentTime >= note.time && currentTime < (note.time + note.duration));

        // Draw Rect
        ctx.fillStyle = isPlayingNote ? '#22c55e' : '#3b82f6'; // Green if active, Blue otherwise
        
        // Rounded rect logic simplified
        ctx.beginPath();
        ctx.roundRect(startX, y, Math.max(width, 4), h, 4);
        ctx.fill();
        
        // Border
        ctx.strokeStyle = isPlayingNote ? '#15803d' : '#1d4ed8';
        ctx.lineWidth = 1;
        ctx.stroke();
      });
    };

    render();

    // Animation loop if playing
    let animationFrameId: number;
    if (isPlaying) {
        const loop = () => {
            render();
            animationFrameId = requestAnimationFrame(loop);
        }
        loop();
    }

    return () => {
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [midiData, currentTime, isPlaying]);

  return (
    <div className="w-full overflow-hidden border border-slate-200 rounded-lg bg-slate-50 relative shadow-inner">
        <canvas ref={canvasRef} className="block w-full" />
        {!midiData && (
             <div className="absolute inset-0 flex items-center justify-center text-slate-400">
                <p>Sube un archivo MIDI para ver las notas aquí</p>
             </div>
        )}
    </div>
  );
};

export default PianoRoll;