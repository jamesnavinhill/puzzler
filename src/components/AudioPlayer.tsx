import React, { useState, useRef, useEffect } from 'react';
import { AudioTrack } from '../types';

const DEMO_TRACKS: AudioTrack[] = [
  {
    id: '1',
    title: 'Focus Flow',
    artist: 'PuzzleMaster',
    src: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112191.mp3', 
  },
  {
    id: '2',
    title: 'Calm Waves',
    artist: 'Nature Sounds',
    src: 'https://cdn.pixabay.com/download/audio/2022/02/07/audio_659020473e.mp3?filename=ambient-piano-amp-drone-10526.mp3',
  },
];

const AudioPlayer: React.FC = () => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [volume, setVolume] = useState(0.5);

  const currentTrack = DEMO_TRACKS[currentTrackIndex];

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(e => console.error("Audio play failed:", e));
      }
      setIsPlaying(!isPlaying);
    }
  };

  const nextTrack = () => {
    setCurrentTrackIndex((prev) => (prev + 1) % DEMO_TRACKS.length);
    setIsPlaying(true);
    setTimeout(() => audioRef.current?.play(), 100);
  };

  const prevTrack = () => {
    setCurrentTrackIndex(prev => (prev - 1 + DEMO_TRACKS.length) % DEMO_TRACKS.length);
    setIsPlaying(true);
    setTimeout(() => audioRef.current?.play(), 50);
  };

  return (
    <div className="inline-flex max-w-full items-center gap-3 md:gap-4 bg-slate-100 dark:bg-slate-800 rounded-full px-4 py-2 border border-slate-200 dark:border-slate-700">
      <audio
        className="hidden"
        ref={audioRef}
        src={currentTrack.src}
        onEnded={nextTrack}
        loop={false}
      />
      
      <div className="min-w-0 max-w-[10.5rem] hidden sm:block">
          <div className="text-sm font-bold leading-tight text-slate-800 dark:text-white truncate">{currentTrack.title}</div>
          <div className="text-xs leading-tight text-slate-500 dark:text-slate-400 truncate">{currentTrack.artist}</div>
      </div>

      <div className="flex items-center justify-center gap-1.5">
        <button onClick={prevTrack} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors" title="Previous">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>
        </button>

        <button 
            onClick={togglePlay}
            className="w-9 h-9 rounded-full bg-[hsl(var(--accent-hue),var(--accent-sat),var(--accent-light))] text-white shadow-sm hover:brightness-110 transition-transform active:scale-95 flex items-center justify-center"
            title={isPlaying ? 'Pause' : 'Play'}
        >
            {isPlaying ? (
               <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
            ) : (
               <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
            )}
        </button>

        <button onClick={nextTrack} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors" title="Next">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
        </button>
      </div>
      
      <div className="hidden md:flex items-center gap-2 w-28">
        <svg className="w-4 h-4 text-slate-500 dark:text-slate-400" fill="currentColor" viewBox="0 0 24 24">
          <path d="M14 3.23v17.54a1 1 0 01-1.64.77L6.73 17H3a1 1 0 01-1-1v-8a1 1 0 011-1h3.73l5.63-4.54A1 1 0 0114 3.23zM17.54 8.46a1 1 0 10-1.41 1.41 3 3 0 010 4.24 1 1 0 001.41 1.41 5 5 0 000-7.06z" />
        </svg>
        <input
            type="range"
            min="0" max="1" step="0.01"
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-slate-300 dark:bg-slate-600 rounded-lg appearance-none cursor-pointer accent-[hsl(var(--accent-hue),var(--accent-sat),var(--accent-light))]"
        />
      </div>
    </div>
  );
};

export default AudioPlayer;
