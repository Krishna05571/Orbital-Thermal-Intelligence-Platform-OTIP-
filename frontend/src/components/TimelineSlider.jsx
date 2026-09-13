import React, { useEffect, useState, useRef, useCallback } from 'react';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  ChevronLeft, 
  ChevronRight, 
  Calendar, 
  GripVertical, 
  Minimize2, 
  Maximize2,
  Sparkles
} from 'lucide-react';

export function TimelineSlider({
  dates = [],
  currentIndex = 0,
  onChangeIndex,
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1); // 1x | 2x | 4x
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Dragging state
  const [position, setPosition] = useState(null); // { x: number, y: number }
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef(null);
  const dragDataRef = useRef({ startX: 0, startY: 0, initialLeft: 0, initialTop: 0 });

  // Playback timer
  useEffect(() => {
    let interval = null;
    if (isPlaying && dates.length > 0) {
      const baseDelay = 1200;
      const delay = Math.max(300, baseDelay / speed);

      interval = setInterval(() => {
        onChangeIndex((prev) => {
          if (prev >= dates.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, delay);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, speed, dates.length, onChangeIndex]);

  // Drag handlers
  const handlePointerDown = useCallback((e) => {
    // Only drag on left click and ignore inputs/buttons
    if (e.button !== 0) return;
    if (['INPUT', 'BUTTON', 'A'].includes(e.target.tagName)) return;

    const panel = dragRef.current;
    if (!panel) return;

    const rect = panel.getBoundingClientRect();
    dragDataRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialLeft: rect.left,
      initialTop: rect.top,
    };

    setIsDragging(true);
    e.preventDefault();
  }, []);

  useEffect(() => {
    if (!isDragging) return;

    const handlePointerMove = (e) => {
      const dx = e.clientX - dragDataRef.current.startX;
      const dy = e.clientY - dragDataRef.current.startY;

      let newLeft = dragDataRef.current.initialLeft + dx;
      let newTop = dragDataRef.current.initialTop + dy;

      // Bounds clamping within viewport
      const panel = dragRef.current;
      const width = panel ? panel.offsetWidth : 400;
      const height = panel ? panel.offsetHeight : 80;

      const minLeft = 10;
      const maxLeft = Math.max(10, window.innerWidth - width - 10);
      const minTop = 60; // Below top navbar
      const maxTop = Math.max(60, window.innerHeight - height - 10);

      newLeft = Math.min(Math.max(minLeft, newLeft), maxLeft);
      newTop = Math.min(Math.max(minTop, newTop), maxTop);

      setPosition({ x: newLeft, y: newTop });
    };

    const handlePointerUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isDragging]);

  if (!dates || dates.length === 0) return null;

  const currentDate = dates[currentIndex] || dates[dates.length - 1];

  const handleStepBack = () => {
    setIsPlaying(false);
    onChangeIndex(Math.max(0, currentIndex - 1));
  };

  const handleStepForward = () => {
    setIsPlaying(false);
    onChangeIndex(Math.min(dates.length - 1, currentIndex + 1));
  };

  const cycleSpeed = () => {
    if (speed === 1) setSpeed(2);
    else if (speed === 2) setSpeed(4);
    else setSpeed(1);
  };

  // Inline positioning style
  const panelStyle = position
    ? {
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: 'none',
        zIndex: 1050,
      }
    : {
        position: 'absolute',
        bottom: '24px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1050,
      };

  // 1. Collapsed Mode Pill (Ultra-compact, draggable floating pill)
  if (isCollapsed) {
    return (
      <div
        ref={dragRef}
        style={panelStyle}
        onPointerDown={handlePointerDown}
        className={`bg-dark-950/95 border border-orange-500/40 rounded-2xl p-2 shadow-2xl backdrop-blur-xl flex items-center gap-2.5 text-slate-200 select-none shadow-black/90 cursor-grab active:cursor-grabbing transition-shadow ${
          isDragging ? 'ring-2 ring-orange-500 shadow-orange-500/20' : ''
        }`}
        title="Drag anywhere to reposition"
      >
        {/* Grip Handle */}
        <div className="text-slate-500 hover:text-slate-300 cursor-grab">
          <GripVertical className="w-4 h-4" />
        </div>

        {/* Mini Play / Pause */}
        <button
          type="button"
          onClick={() => setIsPlaying(!isPlaying)}
          className={`p-1.5 rounded-lg text-white shadow-md transition-all cursor-pointer ${
            isPlaying
              ? 'bg-gradient-to-r from-amber-500 to-orange-600 shadow-orange-500/30'
              : 'bg-gradient-to-r from-sky-500 to-cyan-600 shadow-sky-500/30 hover:scale-105'
          }`}
          title={isPlaying ? 'Pause Timeline' : 'Play Timeline'}
        >
          {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
        </button>

        {/* Date Display */}
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3 h-3 text-orange-400" />
          <span className="font-mono font-bold text-xs text-orange-300">
            {currentDate}
          </span>
        </div>

        <span className="text-[10px] font-mono text-slate-500 border-l border-dark-800 pl-2">
          {currentIndex + 1}/{dates.length}
        </span>

        {/* Expand Button */}
        <button
          type="button"
          onClick={() => setIsCollapsed(false)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-dark-850 border border-transparent hover:border-dark-700 transition-all cursor-pointer ml-1"
          title="Expand Timeline Controls"
        >
          <Maximize2 className="w-3.5 h-3.5 text-sky-400" />
        </button>
      </div>
    );
  }

  // 2. Full Expanded Draggable Scrubber HUD
  return (
    <div
      ref={dragRef}
      style={panelStyle}
      onPointerDown={handlePointerDown}
      className={`bg-dark-950/95 border border-dark-800/90 rounded-2xl p-3 shadow-2xl backdrop-blur-xl flex flex-col sm:flex-row items-center gap-3 w-full max-w-2xl text-slate-200 select-none shadow-black/90 transition-shadow ${
        isDragging ? 'ring-2 ring-orange-500/80 shadow-orange-500/20' : ''
      }`}
    >
      {/* Drag Grip Handle */}
      <div
        className="hidden sm:flex items-center justify-center text-slate-500 hover:text-slate-300 cursor-grab active:cursor-grabbing p-1"
        title="Drag to reposition anywhere on the screen"
      >
        <GripVertical className="w-4 h-4" />
      </div>

      {/* Playback Controls & Frame Steppers */}
      <div className="flex items-center gap-1.5 shrink-0">
        {/* Reset / Day 1 */}
        <button
          type="button"
          onClick={() => {
            setIsPlaying(false);
            onChangeIndex(0);
          }}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-dark-850 border border-transparent hover:border-dark-700 transition-all cursor-pointer"
          title="Reset to Oldest Ingestion Frame"
        >
          <SkipBack className="w-4 h-4" />
        </button>

        {/* Step 1 Day Backward */}
        <button
          type="button"
          onClick={handleStepBack}
          disabled={currentIndex <= 0}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-dark-850 border border-transparent hover:border-dark-700 transition-all disabled:opacity-30 cursor-pointer"
          title="Step 1 Frame Backward"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Main Play / Pause Button */}
        <button
          type="button"
          onClick={() => setIsPlaying(!isPlaying)}
          className={`p-2 rounded-xl text-white shadow-lg transition-all transform active:scale-95 cursor-pointer ${
            isPlaying
              ? 'bg-gradient-to-r from-amber-500 to-orange-600 shadow-orange-500/30'
              : 'bg-gradient-to-r from-sky-500 to-cyan-600 shadow-sky-500/30 hover:scale-105'
          }`}
          title={isPlaying ? 'Pause Historical Playback' : 'Play Historical Progression'}
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </button>

        {/* Step 1 Day Forward */}
        <button
          type="button"
          onClick={handleStepForward}
          disabled={currentIndex >= dates.length - 1}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-dark-850 border border-transparent hover:border-dark-700 transition-all disabled:opacity-30 cursor-pointer"
          title="Step 1 Frame Forward"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Fast Forward to Latest */}
        <button
          type="button"
          onClick={() => {
            setIsPlaying(false);
            onChangeIndex(dates.length - 1);
          }}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-dark-850 border border-transparent hover:border-dark-700 transition-all cursor-pointer"
          title="Fast-forward to Latest Ingestion Frame"
        >
          <SkipForward className="w-4 h-4" />
        </button>

        {/* Speed Multiplier Pill */}
        <button
          type="button"
          onClick={cycleSpeed}
          className="px-2 py-1 rounded-md text-[10px] font-mono font-bold bg-dark-900 hover:bg-dark-850 border border-dark-800 text-sky-400 transition-all cursor-pointer"
          title="Change playback speed"
        >
          {speed}x
        </button>
      </div>

      {/* Slider Track & HUD Date Readouts */}
      <div className="flex-1 w-full space-y-1.5">
        <div className="flex justify-between items-center text-xs">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Calendar className="w-3.5 h-3.5 text-orange-400" />
            <span className="text-[11px] font-medium tracking-tight">Temporal Playback:</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-slate-500">
              FRAME {currentIndex + 1} OF {dates.length}
            </span>
            <span className="font-mono font-bold text-xs text-orange-300 bg-orange-500/10 border border-orange-500/30 px-2.5 py-0.5 rounded-md shadow-sm">
              {currentDate}
            </span>
          </div>
        </div>

        {/* Custom Range Track */}
        <div className="relative flex items-center">
          <input
            type="range"
            min="0"
            max={dates.length - 1}
            value={currentIndex}
            onChange={(e) => {
              setIsPlaying(false);
              onChangeIndex(Number(e.target.value));
            }}
            className="w-full h-2 bg-dark-900 rounded-lg cursor-pointer appearance-none accent-orange-500 focus:outline-none border border-dark-800"
          />
        </div>

        <div className="flex justify-between text-[9px] text-slate-500 font-mono">
          <span>{dates[0]} (T-Initial)</span>
          <span>{dates[dates.length - 1]} (Latest NRT)</span>
        </div>
      </div>

      {/* Minimize / Collapse Button */}
      <div className="shrink-0 flex items-center">
        <button
          type="button"
          onClick={() => setIsCollapsed(true)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-dark-850 border border-transparent hover:border-dark-700 transition-all cursor-pointer"
          title="Minimize Timeline Bar"
        >
          <Minimize2 className="w-4 h-4 text-slate-400 hover:text-sky-400" />
        </button>
      </div>

    </div>
  );
}


