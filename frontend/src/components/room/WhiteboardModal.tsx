'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useLocalParticipant, useRoomContext } from '@livekit/components-react';
import { RoomEvent } from 'livekit-client';
import { PenTool, Eraser, Trash2, Download, X } from 'lucide-react';

export interface StrokeSegment {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  color: string;
  size: number;
}

export function WhiteboardModal({
  isOpen,
  onClose,
  isHost = false,
}: {
  isOpen: boolean;
  onClose: () => void;
  isHost?: boolean;
}) {
  const room = useRoomContext();
  const { localParticipant } = useLocalParticipant();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const strokesRef = useRef<StrokeSegment[]>([]);
  const isDrawing = useRef(false);
  const [color, setColor] = useState('#3b82f6');
  const [lineWidth] = useState(4);
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen');

  const COLORS = ['#ffffff', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#a855f7'];

  const renderSegmentOnCanvas = useCallback((seg: StrokeSegment) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.beginPath();
    ctx.moveTo(seg.x0 * w, seg.y0 * h);
    ctx.lineTo(seg.x1 * w, seg.y1 * h);
    ctx.strokeStyle = seg.color;
    ctx.lineWidth = seg.size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.closePath();
  }, []);

  const redrawAllStrokes = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const seg of strokesRef.current) {
      renderSegmentOnCanvas(seg);
    }
  }, [renderSegmentOnCanvas]);

  const drawLine = useCallback(
    (x0: number, y0: number, x1: number, y1: number, strokeColor: string, size: number, emit = false) => {
      const canvas = canvasRef.current;
      if (!canvas || canvas.width === 0 || canvas.height === 0) return;

      const normSeg: StrokeSegment = {
        x0: x0 / canvas.width,
        y0: y0 / canvas.height,
        x1: x1 / canvas.width,
        y1: y1 / canvas.height,
        color: strokeColor,
        size,
      };

      strokesRef.current.push(normSeg);
      renderSegmentOnCanvas(normSeg);

      if (emit && localParticipant) {
        try {
          const payload = JSON.stringify({
            type: 'wb_draw',
            ...normSeg,
          });
          localParticipant.publishData(new TextEncoder().encode(payload), { reliable: true });
        } catch {}
      }
    },
    [localParticipant, renderSegmentOnCanvas]
  );

  const clearCanvas = useCallback(
    (emit = false) => {
      if (emit && !isHost) {
        if (!confirm('Hapus seluruh papan tulis untuk semua peserta?')) return;
      }
      strokesRef.current = [];
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
      }

      if (emit && localParticipant) {
        try {
          const payload = JSON.stringify({ type: 'wb_clear' });
          localParticipant.publishData(new TextEncoder().encode(payload), { reliable: true });
        } catch {}
      }
    },
    [localParticipant, isHost]
  );

  // Sync whiteboard strokes to newly connected participants (when Host is in room)
  useEffect(() => {
    if (!room || !isHost || !localParticipant) return;
    const handleParticipantConnected = () => {
      setTimeout(() => {
        try {
          if (strokesRef.current.length > 0) {
            // Send up to last 500 segments to avoid exceeding WebRTC data packet limits
            const recentStrokes = strokesRef.current.slice(-500);
            const payload = JSON.stringify({
              type: 'wb_sync',
              strokes: recentStrokes,
            });
            localParticipant.publishData(new TextEncoder().encode(payload), { reliable: true });
          }
        } catch {}
      }, 1400);
    };
    room.on(RoomEvent.ParticipantConnected, handleParticipantConnected);
    return () => {
      room.off(RoomEvent.ParticipantConnected, handleParticipantConnected);
    };
  }, [room, isHost, localParticipant]);

  // Handle incoming draw data (always active even when modal is closed so strokes are preserved)
  useEffect(() => {
    if (!room) return;
    const handleData = (payload: Uint8Array) => {
      try {
        const text = new TextDecoder().decode(payload);
        const data = JSON.parse(text);
        if (data.type === 'wb_draw') {
          const seg: StrokeSegment = {
            x0: data.x0,
            y0: data.y0,
            x1: data.x1,
            y1: data.y1,
            color: data.color,
            size: data.size,
          };
          strokesRef.current.push(seg);
          if (isOpen && canvasRef.current) {
            renderSegmentOnCanvas(seg);
          }
        } else if (data.type === 'wb_clear') {
          clearCanvas(false);
        } else if (data.type === 'wb_sync' && Array.isArray(data.strokes)) {
          if (strokesRef.current.length === 0) {
            strokesRef.current = data.strokes;
            if (isOpen && canvasRef.current) {
              redrawAllStrokes();
            }
          }
        }
      } catch {}
    };
    room.on(RoomEvent.DataReceived, handleData);
    return () => {
      room.off(RoomEvent.DataReceived, handleData);
    };
  }, [room, isOpen, renderSegmentOnCanvas, clearCanvas, redrawAllStrokes]);

  // Handle Canvas Resize & Redraw when opened
  useEffect(() => {
    if (!isOpen || !canvasRef.current) return;
    const updateSize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      redrawAllStrokes();
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [isOpen, redrawAllStrokes]);

  const lastPos = useRef({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    lastPos.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    isDrawing.current = true;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;
    const strokeColor = tool === 'eraser' ? '#0f172a' : color;
    const size = tool === 'eraser' ? lineWidth * 3 : lineWidth;

    drawLine(lastPos.current.x, lastPos.current.y, currentX, currentY, strokeColor, size, true);
    lastPos.current = { x: currentX, y: currentY };
  };

  const handleMouseUp = () => {
    isDrawing.current = false;
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || e.touches.length === 0) return;
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    lastPos.current = { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
    isDrawing.current = true;
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current || !canvasRef.current || e.touches.length === 0) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const currentX = touch.clientX - rect.left;
    const currentY = touch.clientY - rect.top;
    const strokeColor = tool === 'eraser' ? '#0f172a' : color;
    const size = tool === 'eraser' ? lineWidth * 3 : lineWidth;

    drawLine(lastPos.current.x, lastPos.current.y, currentX, currentY, strokeColor, size, true);
    lastPos.current = { x: currentX, y: currentY };
  };

  const handleTouchEnd = () => {
    isDrawing.current = false;
  };

  const downloadWhiteboard = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `Minizoom-Whiteboard-${Date.now()}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Whiteboard Header & Toolbar */}
        <div className="px-5 py-3 border-b border-slate-800 bg-slate-900/90 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <PenTool className="w-5 h-5 text-blue-400" />
            <h3 className="text-sm font-bold text-slate-100">Interactive Whiteboard</h3>
            <span className="text-[11px] px-2 py-0.5 bg-blue-500/10 text-blue-300 border border-blue-500/20 rounded-full font-mono">
              Live Sync
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Color Selectors */}
            <div className="flex items-center gap-1.5 bg-slate-950/60 p-1 rounded-xl border border-slate-800">
              {COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => {
                    setColor(c);
                    setTool('pen');
                  }}
                  className={`w-5 h-5 rounded-full transition-transform ${color === c && tool === 'pen' ? 'scale-125 ring-2 ring-blue-400' : 'hover:scale-110'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>

            {/* Tools */}
            <button
              onClick={() => setTool('pen')}
              className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1 border transition-colors ${tool === 'pen' ? 'bg-blue-600/20 border-blue-500 text-blue-400' : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'}`}
              title="Pen Tool"
            >
              <PenTool className="w-4 h-4" />
            </button>
            <button
              onClick={() => setTool('eraser')}
              className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1 border transition-colors ${tool === 'eraser' ? 'bg-blue-600/20 border-blue-500 text-blue-400' : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'}`}
              title="Eraser Tool"
            >
              <Eraser className="w-4 h-4" />
            </button>

            {/* Clear & Download */}
            <button
              onClick={() => clearCanvas(true)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-red-500/20 border border-slate-700 hover:border-red-500/40 text-slate-300 hover:text-red-400 transition-colors"
              title="Clear Canvas"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={downloadWhiteboard}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition-colors"
              title="Download PNG"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition-colors ml-2"
              title="Close Whiteboard"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 bg-slate-950 relative overflow-hidden cursor-crosshair">
          <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd}
            className="w-full h-full block touch-none"
          />
        </div>
      </div>
    </div>
  );
}

