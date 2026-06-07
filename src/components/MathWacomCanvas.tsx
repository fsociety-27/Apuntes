import React, { useRef, useState, useEffect } from 'react';
import { 
  Square, Circle as CircleIcon, PenTool, Eraser, MoveRight, 
  RefreshCw, RotateCcw, RotateCw, Grid3X3, Trash2, Maximize, 
  Plus, Minus, Hash, Milestone, Eye, EyeOff, Layout, Type
} from 'lucide-react';
import { Point, Stroke, GeometricShape, ShapeType } from '../types';

interface MathWacomCanvasProps {
  strokes: Stroke[];
  onStrokesChange: (strokes: Stroke[]) => void;
  shapes: GeometricShape[];
  onShapesChange: (shapes: GeometricShape[]) => void;
  gridType: 'grid' | 'dots' | 'millimeter' | 'isometric' | 'none';
  onGridTypeChange: (type: 'grid' | 'dots' | 'millimeter' | 'isometric' | 'none') => void;
  theme: 'white' | 'dark';
}

export default function MathWacomCanvas({
  strokes,
  onStrokesChange,
  shapes,
  onShapesChange,
  gridType,
  onGridTypeChange,
  theme
}: MathWacomCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Canvas drawing states
  const [tool, setTool] = useState<ShapeType>('freehand');
  const [isEraser, setIsEraser] = useState(false);
  const [thickness, setThickness] = useState<number>(3);
  const [color, setColor] = useState<string>('#3b82f6'); // Dynamic blue preset
  const [gridOpacity, setGridOpacity] = useState<number>(0.15);
  const [gridSize, setGridSize] = useState<number>(40);
  
  // History logs for perfect undo/redo action
  const [historyStrokes, setHistoryStrokes] = useState<Stroke[][]>([]);
  const [historyShapes, setHistoryShapes] = useState<GeometricShape[][]>([]);
  const [redoStrokes, setRedoStrokes] = useState<Stroke[][]>([]);
  const [redoShapes, setRedoShapes] = useState<GeometricShape[][]>([]);

  // Drawing internals
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPoints, setCurrentPoints] = useState<Point[]>([]);
  const [startPoint, setStartPoint] = useState<Point | null>(null);
  const [previewShape, setPreviewShape] = useState<GeometricShape | null>(null);

  // Available interactive sketch colors based on board theme
  const strokeColors = theme === 'white' 
    ? ['#0f172a', '#2563eb', '#dc2626', '#16a34a', '#d97706', '#9333ea'] 
    : ['#f8fafc', '#60a5fa', '#f87171', '#4ade80', '#fbbf24', '#c084fc'];

  // Add customized shape label dialog
  const [isAddingLabel, setIsAddingLabel] = useState(false);
  const [labelInput, setLabelInput] = useState('');
  const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null);

  useEffect(() => {
    if (strokes.length === 0 && strokes.length === 0) {
      setColor(theme === 'white' ? '#2563eb' : '#60a5fa');
    }
  }, [theme]);

  // Handle Resize beautifully using ResizeObserver
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const resizeObserver = new ResizeObserver(() => {
      // Set relative sizes
      const dpr = window.devicePixelRatio || 1;
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
        drawCanvas();
      }
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, [strokes, shapes, gridType, gridOpacity, gridSize, theme, color, previewShape]);

  // Main high-performance renderer
  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width / (window.devicePixelRatio || 1);
    const height = canvas.height / (window.devicePixelRatio || 1);

    // Clear board background
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = theme === 'white' ? '#fcfbf7' : '#111827';
    ctx.fillRect(0, 0, width, height);

    // 1. Draw mathematical grid
    drawGrid(ctx, width, height);

    // 2. Render all freehand strokes
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    strokes.forEach((stroke) => {
      if (stroke.points.length < 1) return;
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.thickness;
      ctx.beginPath();

      if (stroke.points.length === 1) {
        ctx.arc(stroke.points[0].x, stroke.points[0].y, stroke.thickness / 2, 0, Math.PI * 2);
        ctx.fillStyle = stroke.color;
        ctx.fill();
      } else {
        ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
        for (let i = 1; i < stroke.points.length; i++) {
          const xc = (stroke.points[i - 1].x + stroke.points[i].x) / 2;
          const yc = (stroke.points[i - 1].y + stroke.points[i].y) / 2;
          ctx.quadraticCurveTo(stroke.points[i - 1].x, stroke.points[i - 1].y, xc, yc);
        }
        ctx.lineTo(stroke.points[stroke.points.length - 1].x, stroke.points[stroke.points.length - 1].y);
        ctx.stroke();
      }
    });

    // 3. Render current active stroke drawing
    if (currentPoints.length > 0) {
      ctx.strokeStyle = isEraser ? (theme === 'white' ? '#fcfbf7' : '#111827') : color;
      ctx.lineWidth = isEraser ? 24 : thickness;
      ctx.beginPath();
      ctx.moveTo(currentPoints[0].x, currentPoints[0].y);
      for (let i = 1; i < currentPoints.length; i++) {
        const xc = (currentPoints[i - 1].x + currentPoints[i].x) / 2;
        const yc = (currentPoints[i - 1].y + currentPoints[i].y) / 2;
        ctx.quadraticCurveTo(currentPoints[i - 1].x, currentPoints[i - 1].y, xc, yc);
      }
      ctx.stroke();
    }

    // 4. Render Geometric shapes
    const renderShapeObj = (shape: GeometricShape) => {
      ctx.strokeStyle = shape.color;
      ctx.lineWidth = shape.thickness;
      ctx.fillStyle = 'transparent';
      
      const w = shape.endX - shape.startX;
      const h = shape.endY - shape.startY;

      ctx.beginPath();
      if (shape.type === 'line') {
        ctx.moveTo(shape.startX, shape.startY);
        ctx.lineTo(shape.endX, shape.endY);
        ctx.stroke();
        
        // Add coordinates distance guides for university level
        ctx.save();
        ctx.strokeStyle = shape.color + '66';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(shape.startX, shape.startY);
        ctx.lineTo(shape.endX, shape.startY);
        ctx.lineTo(shape.endX, shape.endY);
        ctx.stroke();
        ctx.restore();
      } else if (shape.type === 'rect') {
        ctx.strokeRect(shape.startX, shape.startY, w, h);
      } else if (shape.type === 'circle') {
        const radius = Math.sqrt(w * w + h * h);
        ctx.arc(shape.startX, shape.startY, radius, 0, Math.PI * 2);
        ctx.stroke();
        
        // Dynamic radius guide
        ctx.save();
        ctx.strokeStyle = shape.color + '88';
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(shape.startX, shape.startY);
        ctx.lineTo(shape.startX + radius, shape.startY);
        ctx.stroke();
        ctx.restore();
      } else if (shape.type === 'triangle') {
        ctx.moveTo(shape.startX + w / 2, shape.startY);
        ctx.lineTo(shape.endX, shape.endY);
        ctx.lineTo(shape.startX, shape.endY);
        ctx.closePath();
        ctx.stroke();
      } else if (shape.type === 'axis') {
        // Draw primary grid axis
        const originX = shape.startX;
        const originY = shape.startY;
        
        // X-axis
        ctx.moveTo(originX - 150, originY);
        ctx.lineTo(originX + 150, originY);
        // X arrow
        ctx.lineTo(originX + 145, originY - 5);
        ctx.moveTo(originX + 150, originY);
        ctx.lineTo(originX + 145, originY + 5);

        // Y-axis
        ctx.moveTo(originX, originY + 150);
        ctx.lineTo(originX, originY - 150);
        // Y arrow
        ctx.lineTo(originX - 5, originY - 145);
        ctx.moveTo(originX, originY - 150);
        ctx.lineTo(originX + 5, originY - 145);
        
        ctx.stroke();

        // Standard dynamic scale markings (every 30px)
        ctx.save();
        ctx.fillStyle = shape.color;
        ctx.font = '10px font-mono';
        ctx.lineWidth = 1.2;
        for (let i = -120; i <= 120; i += 30) {
          if (i === 0) continue;
          // X ticks
          ctx.beginPath();
          ctx.moveTo(originX + i, originY - 4);
          ctx.lineTo(originX + i, originY + 4);
          ctx.stroke();
          ctx.fillText((i / 30).toString(), originX + i - 4, originY + 18);

          // Y ticks
          ctx.beginPath();
          ctx.moveTo(originX - 4, originY - i);
          ctx.lineTo(originX + 4, originY - i);
          ctx.stroke();
          ctx.fillText((i / 30).toString(), originX - 18, originY - i + 4);
        }
        ctx.restore();
      }

      // Draw custom Labels for geometry / Wacom classroom instruction
      if (shape.label) {
        ctx.save();
        ctx.fillStyle = shape.color;
        ctx.font = 'bold 13px sans-serif';
        const placementX = shape.type === 'rect' ? shape.startX + 8 : (shape.startX + shape.endX) / 2 + 10;
        const placementY = shape.type === 'rect' ? shape.startY - 6 : (shape.startY + shape.endY) / 2 - 10;
        
        // Render neat visual outline box for label readability
        ctx.fillStyle = theme === 'white' ? 'rgba(252,251,247,0.85)' : 'rgba(17,24,39,0.85)';
        const textWidth = ctx.measureText(shape.label).width;
        ctx.fillRect(placementX - 4, placementY - 12, textWidth + 8, 16);
        ctx.strokeRect(placementX - 4, placementY - 12, textWidth + 8, 16);

        ctx.fillStyle = shape.color;
        ctx.fillText(shape.label, placementX, placementY);
        ctx.restore();
      }
    };

    shapes.forEach(renderShapeObj);

    if (previewShape) {
      renderShapeObj(previewShape);
    }
  };

  // Helper drawing grid background
  const drawGrid = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    if (gridType === 'none') return;

    ctx.save();
    ctx.strokeStyle = theme === 'white' ? '#0f172a' : '#94a3b8';
    ctx.fillStyle = theme === 'white' ? '#0f172a' : '#94a3b8';
    ctx.globalAlpha = gridOpacity;
    ctx.lineWidth = 0.5;

    if (gridType === 'grid') {
      // General math grid lines
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
    } else if (gridType === 'millimeter') {
      // Fine engineering grid lines
      const micro = gridSize / 5;
      for (let x = 0; x < width; x += micro) {
        ctx.beginPath();
        ctx.lineWidth = x % gridSize === 0 ? 0.8 : 0.4;
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += micro) {
        ctx.beginPath();
        ctx.lineWidth = y % gridSize === 0 ? 0.8 : 0.4;
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
    } else if (gridType === 'dots') {
      // Dotted bullet grid
      for (let x = gridSize; x < width; x += gridSize) {
        for (let y = gridSize; y < height; y += gridSize) {
          ctx.beginPath();
          ctx.arc(x, y, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    } else if (gridType === 'isometric') {
      // 3D Isometric guideline
      const isoGrid = gridSize * 0.866; // cos(30deg)
      for (let x = -width; x < width * 2; x += gridSize) {
        // Angled positive slant /
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x + height, height);
        ctx.stroke();
        
        // Angled negative slant \
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x - height, height);
        ctx.stroke();
      }
    }

    ctx.restore();
  };

  // Capture mouse & tablet pressure styling
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Direct pointer coordinates adjusted
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const p: Point = { x, y, pressure: e.pressure || 0.5 };

    setIsDrawing(true);
    setStartPoint(p);

    if (tool === 'freehand') {
      setCurrentPoints([p]);
    } else {
      // Start of shape guide
      setPreviewShape({
        id: 'preview',
        type: tool as any,
        startX: p.x,
        startY: p.y,
        endX: p.x,
        endY: p.y,
        color: color,
        thickness: thickness
      });
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !startPoint) return;
    e.preventDefault();

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const p: Point = { x, y, pressure: e.pressure || 0.5 };

    if (tool === 'freehand') {
      if (isEraser) {
        // Erase strokes intersecting coordinate box
        const radius = 18;
        const filteredStrokes = strokes.filter(stroke => {
          return !stroke.points.some(pt => {
            const dx = pt.x - x;
            const dy = pt.y - y;
            return Math.sqrt(dx * dx + dy * dy) < radius;
          });
        });
        const filteredShapes = shapes.filter(sh => {
          const dx = ((sh.startX + sh.endX) / 2) - x;
          const dy = ((sh.startY + sh.endY) / 2) - y;
          return Math.sqrt(dx * dx + dy * dy) > radius * 1.5;
        });

        if (filteredStrokes.length !== strokes.length || filteredShapes.length !== shapes.length) {
          pushToHistory();
          onStrokesChange(filteredStrokes);
          onShapesChange(filteredShapes);
        }
      } else {
        setCurrentPoints(prev => [...prev, p]);
      }
    } else {
      // Resize shape blueprint
      setPreviewShape(prev => {
        if (!prev) return null;
        return {
          ...prev,
          endX: p.x,
          endY: p.y
        };
      });
    }
    
    drawCanvas();
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();
    setIsDrawing(false);

    pushToHistory();

    if (tool === 'freehand') {
      if (currentPoints.length > 0 && !isEraser) {
        const newStroke: Stroke = {
          id: Math.random().toString(36).substr(2, 9),
          points: currentPoints,
          color: color,
          thickness: thickness,
          type: 'freehand'
        };
        onStrokesChange([...strokes, newStroke]);
      }
      setCurrentPoints([]);
    } else if (previewShape && startPoint) {
      const canvas = canvasRef.current;
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Skip adding transparent microscopic clicks
        const dx = Math.abs(x - startPoint.x);
        const dy = Math.abs(y - startPoint.y);
        if (dx > 4 || dy > 4 || tool === 'axis') {
          const finalShape: GeometricShape = {
            id: Math.random().toString(36).substr(2, 9),
            type: tool as any,
            startX: startPoint.x,
            startY: startPoint.y,
            endX: x,
            endY: y,
            color: color,
            thickness: thickness
          };
          onShapesChange([...shapes, finalShape]);
          // Prompt to add label context optionally
          setSelectedShapeId(finalShape.id);
        }
      }
      setPreviewShape(null);
    }
    
    setStartPoint(null);
    setRedoStrokes([]);
    setRedoShapes([]);
    setTimeout(() => drawCanvas(), 50);
  };

  // Undo redos state pipelines
  const pushToHistory = () => {
    setHistoryStrokes(prev => [...prev, [...strokes]]);
    setHistoryShapes(prev => [...prev, [...shapes]]);
  };

  const handleUndo = () => {
    if (historyStrokes.length === 0) return;
    
    const prevStrokes = historyStrokes[historyStrokes.length - 1];
    const prevShapes = historyShapes[historyShapes.length - 1];

    setRedoStrokes(prev => [...prev, [...strokes]]);
    setRedoShapes(prev => [...prev, [...shapes]]);

    setHistoryStrokes(prev => prev.slice(0, -1));
    setHistoryShapes(prev => prev.slice(0, -1));

    onStrokesChange(prevStrokes);
    onShapesChange(prevShapes);
  };

  const handleRedo = () => {
    if (redoStrokes.length === 0) return;
    
    const nextStrokes = redoStrokes[redoStrokes.length - 1];
    const nextShapes = redoShapes[redoShapes.length - 1];

    setHistoryStrokes(prev => [...prev, [...strokes]]);
    setHistoryShapes(prev => [...prev, [...shapes]]);

    setRedoStrokes(prev => prev.slice(0, -1));
    setRedoShapes(prev => prev.slice(0, -1));

    onStrokesChange(nextStrokes);
    onShapesChange(nextShapes);
  };

  const handleClear = () => {
    if (strokes.length === 0 && shapes.length === 0) return;
    if (window.confirm('¿Deseas limpiar todo el lienzo actual? Se borrarán tus bocetos.')) {
      pushToHistory();
      onStrokesChange([]);
      onShapesChange([]);
      setRedoStrokes([]);
      setRedoShapes([]);
    }
  };

  const addLabelToShape = () => {
    if (!selectedShapeId) return;
    onShapesChange(
      shapes.map(s => s.id === selectedShapeId ? { ...s, label: labelInput } : s)
    );
    setIsAddingLabel(false);
    setLabelInput('');
    setSelectedShapeId(null);
  };

  return (
    <div className="flex flex-col h-full bg-[#1A1D23] border border-[#2D3139] rounded-2xl overflow-hidden shadow-2xl">
      {/* Upper toolbar */}
      <div className="flex flex-wrap items-center justify-between px-4 py-2 bg-[#15181E] border-b border-[#2D3139] text-slate-200 gap-2">
        {/* Core stylus tools */}
        <div className="flex items-center space-x-1 bg-[#0F1115]/60 p-1 rounded-xl border border-[#2D3139]/50">
          <button 
            id="tool-pencil"
            onClick={() => { setTool('freehand'); setIsEraser(false); }}
            className={`p-2 rounded-lg transition-all ${tool === 'freehand' && !isEraser ? 'bg-[#3B82F6] text-white shadow' : 'hover:bg-slate-700/50 text-slate-450'}`}
            title="Lápiz de Geometría / Wacom Pen"
          >
            <PenTool size={18} />
          </button>
          
          <button 
            id="tool-eraser"
            onClick={() => { setIsEraser(true); setTool('freehand'); }}
            className={`p-2 rounded-lg transition-all ${isEraser ? 'bg-amber-600 text-white shadow' : 'hover:bg-slate-700/50 text-slate-450'}`}
            title="Borrador de trazos"
          >
            <Eraser size={18} />
          </button>

          <span className="w-[1px] h-6 bg-[#2D3139] mx-1" />

          {/* Geometry shapes selection */}
          <button 
            id="tool-line"
            onClick={() => { setTool('line'); setIsEraser(false); }}
            className={`p-2 rounded-lg transition-all ${tool === 'line' ? 'bg-[#3B82F6] text-white shadow' : 'hover:bg-slate-700/50 text-slate-450'}`}
            title="Línea recta"
          >
            <MoveRight size={18} />
          </button>
          <button 
            id="tool-rect"
            onClick={() => { setTool('rect'); setIsEraser(false); }}
            className={`p-2 rounded-lg transition-all ${tool === 'rect' ? 'bg-[#3B82F6] text-white shadow' : 'hover:bg-slate-700/50 text-slate-450'}`}
            title="Rectángulo"
          >
            <Square size={18} />
          </button>
          <button 
            id="tool-circle"
            onClick={() => { setTool('circle'); setIsEraser(false); }}
            className={`p-2 rounded-lg transition-all ${tool === 'circle' ? 'bg-[#3B82F6] text-white shadow' : 'hover:bg-slate-700/50 text-slate-450'}`}
            title="Círculo"
          >
            <CircleIcon size={18} />
          </button>
          <button 
            id="tool-triangle"
            onClick={() => { setTool('triangle'); setIsEraser(false); }}
            className={`p-2 rounded-lg transition-all ${tool === 'triangle' ? 'bg-[#3B82F6] text-white shadow' : 'hover:bg-slate-700/50 text-slate-450'}`}
            title="Triángulo"
          >
            <Layout size={18} className="rotate-180" />
          </button>
          <button 
            id="tool-axis"
            onClick={() => { setTool('axis'); setIsEraser(false); }}
            className={`p-2 rounded-lg transition-all ${tool === 'axis' ? 'bg-[#3B82F6] text-white shadow' : 'hover:bg-slate-700/50 text-slate-450'}`}
            title="Convertir a eje cartesiano"
          >
            <Hash size={18} />
          </button>
        </div>

        {/* Dynamic color picker palette */}
        {!isEraser && (
          <div className="flex items-center space-x-1.5 bg-[#0F1115]/60 px-2 py-1 rounded-xl border border-[#2D3139]/50">
            {strokeColors.map(c => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`w-6 h-6 rounded-full border-2 transition-transform scale-95 ${color === c ? 'border-white scale-110 shadow-lg' : 'border-transparent hover:scale-105'}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        )}

        {/* Thickness configurer */}
        <div className="flex items-center space-x-2 bg-[#0F1115]/60 px-3 py-1 rounded-xl border border-[#2D3139]/50">
          <span className="text-xs text-slate-400 font-mono">Grosor: {thickness}px</span>
          <input 
            type="range" 
            min="1" 
            max="12" 
            value={thickness}
            onChange={(e) => setThickness(parseInt(e.target.value))}
            className="w-16 accent-[#3B82F6] cursor-pointer h-1.5 bg-slate-800 rounded-lg"
          />
        </div>

        {/* History actions and clean commands */}
        <div className="flex items-center space-x-1">
          <button 
            onClick={handleUndo}
            disabled={historyStrokes.length === 0}
            className="p-2 rounded-lg hover:bg-[#2D3139] text-slate-400 disabled:opacity-35 disabled:hover:bg-transparent transition-colors"
            title="Deshacer (Ctrl+Z)"
          >
            <RotateCcw size={16} />
          </button>
          <button 
            onClick={handleRedo}
            disabled={redoStrokes.length === 0}
            className="p-2 rounded-lg hover:bg-[#2D3139] text-slate-400 disabled:opacity-35 disabled:hover:bg-transparent transition-colors"
            title="Rehacer (Ctrl+Y)"
          >
            <RotateCw size={16} />
          </button>
          <button 
            onClick={handleClear}
            className="p-2 rounded-lg hover:bg-rose-950 hover:text-rose-400 text-slate-450 transition-all ml-1"
            title="Borrar lienzo"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Grid configuration bottom toolrail */}
      <div className="flex flex-wrap items-center justify-between px-4 py-2 bg-[#15181E]/90 border-b border-[#2D3139] gap-2">
        <div className="flex items-center space-x-1">
          <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider mr-1.5 flex items-center gap-1">
            <Grid3X3 size={14} className="text-[#3B82F6]" /> Cuadrícula:
          </span>
          {(['grid', 'millimeter', 'dots', 'isometric', 'none'] as const).map((g) => (
            <button
              key={g}
              onClick={() => onGridTypeChange(g)}
              className={`px-2.5 py-1 text-[10px] uppercase font-bold tracking-wider rounded-lg transition-all border ${gridType === g ? 'bg-[#0F1115] border-[#2D3139] text-[#3B82F6] shadow-sm' : 'border-transparent text-slate-450 hover:text-slate-200'}`}
            >
              {g === 'grid' ? 'Estándar' : g === 'millimeter' ? 'Milimetrado' : g === 'dots' ? 'Puntos' : g === 'isometric' ? 'Isométrica' : 'Ninguna'}
            </button>
          ))}
        </div>

        <div className="flex items-center space-x-4">
          {gridType !== 'none' && (
            <>
              {/* Grid Opacity Slider */}
              <div className="flex items-center space-x-1.5">
                <span className="text-xs text-slate-400 font-mono">Opacidad: {Math.round(gridOpacity * 100)}%</span>
                <input 
                  type="range"
                  min="0.05"
                  max="0.4"
                  step="0.05"
                  value={gridOpacity}
                  onChange={(e) => setGridOpacity(parseFloat(e.target.value))}
                  className="w-16 accent-[#3B82F6] cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
              </div>

              {/* Grid Size controls */}
              <div className="flex items-center bg-[#0F1115] px-1.5 py-0.5 rounded-lg border border-[#2D3139] text-slate-400 gap-1">
                <button 
                  onClick={() => setGridSize(prev => Math.max(20, prev - 5))}
                  className="p-1 hover:text-white"
                  title="Aumentar densidad de cuadrícula"
                >
                  <Minus size={12} />
                </button>
                <span className="text-[10px] font-mono px-1 select-none">{gridSize}px</span>
                <button 
                  onClick={() => setGridSize(prev => Math.min(100, prev + 5))}
                  className="p-1 hover:text-white"
                  title="Disminuir densidad de cuadrícula"
                >
                  <Plus size={12} />
                </button>
              </div>
            </>
          )}

          {/* Quick interactive geometry tag launcher */}
          {shapes.length > 0 && (
            <button
              onClick={() => {
                const lastShape = shapes[shapes.length - 1];
                setSelectedShapeId(lastShape.id);
                setLabelInput(lastShape.label || '');
                setIsAddingLabel(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1 bg-[#0F1115] border border-[#2D3139] text-[#3B82F6] rounded-lg hover:border-slate-500 transition-all text-[10px] font-bold uppercase tracking-wider"
            >
              <Type size={12} /> Etiquetar forma
            </button>
          )}
        </div>
      </div>

      {/* Main Canvas Area */}
      <div 
        ref={containerRef} 
        className="relative flex-1 cursor-crosshair overflow-hidden touch-none"
        style={{ height: '380px' }}
      >
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="absolute inset-0 block w-full h-full transition-shadow duration-300 pointer-events-auto"
          style={{ touchAction: 'none' }}
        />

        {/* Custom stylus/mouse float guides helper */}
        <div className="absolute top-4 right-4 pointer-events-none bg-[#0F1115]/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-[#2D3139] text-[11px] font-mono text-slate-350 flex items-center gap-2">
          <div className="flex items-center gap-1">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#3B82F6] animate-pulse" />
            <span className="capitalize">{tool === 'freehand' ? (isEraser ? 'Borrador' : 'Lápiz') : tool}</span>
          </div>
          <div>•</div>
          <div>DPI: {window.devicePixelRatio || 1}x</div>
        </div>

        {/* Modal dialog for adding customizable shape values / formula variables */}
        {isAddingLabel && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm z-50 p-4">
            <div className="bg-[#1A1D23] border border-[#2D3139] rounded-2xl p-5 shadow-2xl max-w-sm w-full">
              <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2 uppercase tracking-wide font-display">
                <Milestone size={16} className="text-[#3B82F6]" /> Etiquetar Figura de Geometría
              </h4>
              <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                Asigna una etiqueta o parámetro de medida a la figura dibujada (ej. <code className="text-amber-400 font-mono">r = 10cm</code>, <code className="text-amber-400 font-mono">A = 45°</code>, <code className="text-amber-400 font-mono">Hipotenusa</code>).
              </p>
              <input
                type="text"
                placeholder="Escribe etiqueta, ej: x = 5"
                value={labelInput}
                onChange={(e) => setLabelInput(e.target.value)}
                className="w-full bg-[#0F1115] text-white border border-[#2D3139] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#3B82F6] mb-4 font-mono placeholder-slate-500"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && addLabelToShape()}
              />
              <div className="flex justify-end space-x-2 text-xs">
                <button
                  onClick={() => { setIsAddingLabel(false); setSelectedShapeId(null); }}
                  className="px-3.5 py-1.5 bg-[#0F1115] text-slate-400 hover:text-white rounded-lg border border-[#2D3139]"
                >
                  Omitir
                </button>
                <button
                  onClick={addLabelToShape}
                  className="px-3.5 py-1.5 bg-[#3B82F6] hover:bg-blue-600 text-white font-bold rounded-lg shadow uppercase tracking-wider text-[10px]"
                >
                  Asignar Etiqueta
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
