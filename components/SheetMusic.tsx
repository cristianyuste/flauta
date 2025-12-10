import React, { useRef, useEffect, useMemo } from 'react';
import { MidiData } from '../types';

interface SheetMusicProps {
  midiData: MidiData;
  currentTime: number;
  isPlaying: boolean;
}

const SheetMusic: React.FC<SheetMusicProps> = ({ midiData, currentTime, isPlaying }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Visual constants
  const PIXELS_PER_SECOND = 100; // Speed of scrolling/spacing
  const STAFF_LINE_HEIGHT = 10; // Space between lines
  const STAFF_TOP_Y = 60; // Y position of the top line of the staff
  const NOTE_RADIUS_X = 6;
  const NOTE_RADIUS_Y = 5;

  // Calculate total width based on song duration
  const totalWidth = Math.max(800, midiData.duration * PIXELS_PER_SECOND + 200);

  // Helper: Map MIDI pitch to Y position on the staff
  // Treble Clef Reference:
  // F5 (Top Line) = MIDI 77
  // E5 (Space) = MIDI 76
  // ...
  // G4 (2nd Line from bottom) = MIDI 67 (Treble clef curl centers here)
  // ...
  // E4 (Bottom Line) = MIDI 64
  // C4 (Middle C) = MIDI 60 (Line below staff)
  const getNoteY = (midiNote: number) => {
    // We calculate how many "steps" away from the Top Line (F5 = 77) the note is.
    // Each step is half a space (STAFF_LINE_HEIGHT / 2).
    
    // Mapping specific MIDI notes to diatonic staff positions (ignoring accidentals for Y pos)
    // This is a simplified C-Major mapping for the staff visual.
    // A real engraver is complex; this is a robust heuristic for simple songs.
    const referenceNote = 77; // F5
    const staffSteps = [0, 2, 4, 5, 7, 9, 11]; // Semitones in a Major scale pattern
    
    // Simple chromatic map to visual steps (High to Low)
    // 77 (F5) -> 0 steps
    // 76 (E5) -> 1 step
    // 75 (Eb) -> 1 step (with accidental, handled separately in logic, here just pos) -> 1
    // Let's use a manual map for the common recorder range (C4 to D6)
    const map: Record<number, number> = {
      86: -4.5, // D6
      84: -3.5, // C6 (Line above)
      83: -3,   // B5
      81: -2,   // A5 (Line above)
      79: -1,   // G5
      77: 0,    // F5 (Top Line)
      76: 0.5,  // E5
      74: 1,    // D5 (Line)
      72: 1.5,  // C5
      71: 2,    // B4 (Line)
      69: 2.5,  // A4
      67: 3,    // G4 (Line)
      65: 3.5,  // F4
      64: 4,    // E4 (Bottom Line)
      62: 4.5,  // D4
      60: 5,    // C4 (Line below)
      59: 5.5,  // B3
    };

    // Default calculation if not in map (approximate)
    let visualStep = map[midiNote];
    if (visualStep === undefined) {
       // Fallback for out of range
       visualStep = (77 - midiNote) * 0.5; 
    }
    
    return STAFF_TOP_Y + (visualStep * STAFF_LINE_HEIGHT);
  };

  // Flatten notes for rendering
  const notes = useMemo(() => {
    return midiData.tracks.flatMap(t => t.notes).sort((a, b) => a.time - b.time);
  }, [midiData]);

  // Auto-scroll functionality
  useEffect(() => {
    if (isPlaying && containerRef.current) {
      const scrollPos = (currentTime * PIXELS_PER_SECOND) - (containerRef.current.clientWidth / 2) + 100;
      containerRef.current.scrollTo({
        left: Math.max(0, scrollPos),
        behavior: 'smooth'
      });
    }
  }, [currentTime, isPlaying]);

  return (
    <div 
      ref={containerRef}
      className="w-full h-64 overflow-x-auto overflow-y-hidden bg-white border border-stone-200 rounded-xl shadow-inner relative sheet-scroll"
    >
      <div style={{ width: totalWidth, height: '100%', position: 'relative' }}>
        <svg width="100%" height="100%">
          
          {/* Paper Background */}
          <rect width="100%" height="100%" fill="#fffbf0" />

          {/* Bar Lines / Measure Markers (Every 2 seconds approx for 120bpm) */}
          {Array.from({ length: Math.ceil(midiData.duration / 2) + 1 }).map((_, i) => (
            <line 
              key={`bar-${i}`}
              x1={100 + (i * 2 * PIXELS_PER_SECOND)} 
              y1={STAFF_TOP_Y} 
              y2={STAFF_TOP_Y + (4 * STAFF_LINE_HEIGHT)} 
              stroke="#cbd5e1" 
              strokeWidth="1"
            />
          ))}

          {/* Staff Lines (Pentagrama) */}
          {[0, 1, 2, 3, 4].map((i) => (
            <line 
              key={`line-${i}`}
              x1={20} 
              x2={totalWidth - 20} 
              y1={STAFF_TOP_Y + (i * STAFF_LINE_HEIGHT)} 
              y2={STAFF_TOP_Y + (i * STAFF_LINE_HEIGHT)} 
              stroke="#334155" 
              strokeWidth="1" 
            />
          ))}

          {/* Clef (Clave de Sol) - Simple Path Representation */}
          <g transform={`translate(30, ${STAFF_TOP_Y - 15}) scale(1.5)`}>
            <path 
              d="M9,25 C5,25 5,18 9,15 C12,12 14,14 14,18 C14,24 8,28 4,22 C2,19 4,15 6,12 L10,2 L11,2 L8,10 C10,9 15,10 16,18 C17,26 10,30 9,25 Z" 
              fill="none" 
              stroke="#1e293b" 
              strokeWidth="1.2"
            />
          </g>

          {/* Notes */}
          {notes.map((note, idx) => {
            const x = 100 + (note.time * PIXELS_PER_SECOND);
            const y = getNoteY(note.midi);
            const isActive = currentTime >= note.time && currentTime < (note.time + note.duration);
            
            // Stem direction: B4 (71) and above go down, below goes up
            const stemDirection = note.midi >= 71 ? 'down' : 'up';
            const stemLength = 28;

            return (
              <g key={`note-${idx}`} className="transition-all duration-75">
                
                {/* Ledger Lines (Middle C etc) */}
                {note.midi === 60 && (
                  <line 
                    x1={x - 8} x2={x + 8} 
                    y1={getNoteY(60)} y2={getNoteY(60)} 
                    stroke="#334155" strokeWidth="1" 
                  />
                )}
                 {note.midi === 81 && (
                  <line 
                    x1={x - 8} x2={x + 8} 
                    y1={getNoteY(81)} y2={getNoteY(81)} 
                    stroke="#334155" strokeWidth="1" 
                  />
                )}

                {/* Stem */}
                <line 
                  x1={stemDirection === 'up' ? x + NOTE_RADIUS_X - 1 : x - NOTE_RADIUS_X + 1} 
                  x2={stemDirection === 'up' ? x + NOTE_RADIUS_X - 1 : x - NOTE_RADIUS_X + 1} 
                  y1={y} 
                  y2={stemDirection === 'up' ? y - stemLength : y + stemLength} 
                  stroke={isActive ? '#16a34a' : '#1e293b'} 
                  strokeWidth="1.5"
                />

                {/* Note Head */}
                <ellipse 
                  cx={x} 
                  cy={y} 
                  rx={NOTE_RADIUS_X} 
                  ry={NOTE_RADIUS_Y} 
                  fill={isActive ? '#22c55e' : '#1e293b'}
                  transform={`rotate(-15 ${x} ${y})`}
                />
                
                {/* Note Name Label (Optional educational aid) */}
                <text 
                  x={x} 
                  y={stemDirection === 'up' ? y + 20 : y - 10} 
                  fontSize="9" 
                  textAnchor="middle" 
                  fill={isActive ? '#16a34a' : '#94a3b8'}
                  fontWeight="bold"
                >
                  {note.name.replace(/\d/, '')}
                </text>
              </g>
            );
          })}

          {/* Playhead Line */}
          <line 
            x1={100 + (currentTime * PIXELS_PER_SECOND)}
            x2={100 + (currentTime * PIXELS_PER_SECOND)}
            y1={0}
            y2="100%"
            stroke="#ef4444"
            strokeWidth="2"
            opacity="0.5"
          />

        </svg>
      </div>
    </div>
  );
};

export default SheetMusic;
