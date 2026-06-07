import React, { useState, useMemo } from 'react';
import { 
  Sliders, LineChart, ToggleLeft, ToggleRight, HelpCircle, 
  Sparkles, CheckCircle2, ChevronRight, RefreshCw, ZoomIn, ZoomOut
} from 'lucide-react';

interface InteractiveGraphProps {
  suggestedEquation?: string;
  suggestedTitle?: string;
  suggestedVariable?: string;
  suggestedMin?: number;
  suggestedMax?: number;
  suggestedDefault?: number;
}

export default function InteractiveGraph({
  suggestedEquation = "a * Math.sin(x)",
  suggestedTitle = "Onda Senoidal Ajustable",
  suggestedVariable = "a",
  suggestedMin = -5,
  suggestedMax = 5,
  suggestedDefault = 2
}: InteractiveGraphProps) {
  // Main equation editor state
  const [equationStr, setEquationStr] = useState<string>("a * x**2 + b");
  const [plotTitle, setPlotTitle] = useState<string>("Parábola Desplazable");
  
  // Interactive adjustment sliders
  const [paramA, setParamA] = useState<number>(1);
  const [paramB, setParamB] = useState<number>(0);
  const [paramC, setParamC] = useState<number>(1);

  // Layout parameters
  const [zoom, setZoom] = useState<number>(30); // pixels per math unit
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [hoverCoords, setHoverCoords] = useState<{ x: number; y: number; mathX: number; mathY: number } | null>(null);

  // Presets list reflecting standard curricula
  const PRESETS = [
    {
      name: "Función Cuadrática",
      formula: "a * x**2 + b * x + c",
      title: "Parábola General",
      a: 1, b: -2, c: -1,
      desc: "Estudia el vértice, foco, concavidades y traslación vertical/horizontal."
    },
    {
      name: "Onda Senoidal",
      formula: "a * Math.sin(b * x) + c",
      title: "Armónico de Oscilación",
      a: 2, b: 1, c: 0,
      desc: "Controla la amplitud con 'a', la frecuencia angular con 'b' y la altura con 'c'."
    },
    {
      name: "Función Racional / Límite",
      formula: "a / (x - b)",
      title: "Asíntota e Hipérbola",
      a: 2, b: 1, c: 0,
      desc: "Excelente para visualizar límites infinitos y discontinuidades asintóticas."
    },
    {
      name: "Distribución Normal (Gauss)",
      formula: "a * Math.exp(-((x - b)**2) / (2 * c**2 || 1))",
      title: "Campana de Gauss",
      a: 3, b: 0, c: 1.5,
      desc: "Grafica la densidad de probabilidad. Desplaza la media y ajusta la varianza."
    },
    {
      name: "Función Exponencial",
      formula: "Math.pow(a, x) - b",
      title: "Crecimiento Exponencial",
      a: 2, b: 1, c: 0,
      desc: "Estudia tasas de interés compuesto o propagaciones biológicas según la base 'a'."
    }
  ];

  // Apply suggested configuration from Gemini when it analyzes a sketch
  React.useEffect(() => {
    if (suggestedEquation) {
      // Basic sanitization
      let eqVal = suggestedEquation
        .replace(/Math\./g, "") // Make it simpler to read for humans
        .replace(/\*\*/g, "^");
      
      // Keep it internally formatted as JavaScript syntax
      const internalEq = suggestedEquation;
      setEquationStr(internalEq);
      setPlotTitle(suggestedTitle);
      
      if (suggestedVariable === 'a') setParamA(suggestedDefault);
      if (suggestedVariable === 'b') setParamB(suggestedDefault);
    }
  }, [suggestedEquation, suggestedTitle, suggestedVariable, suggestedDefault]);

  // Handle preset loading
  const loadPreset = (p: typeof PRESETS[number]) => {
    setEquationStr(p.formula);
    setPlotTitle(p.title);
    setParamA(p.a);
    setParamB(p.b);
    setParamC(p.c);
  };

  // Mathematical formula evaluator sandbox (Strictly scoped)
  const evalMath = (x: number): number => {
    try {
      // Re-add helper mappings
      let sanitized = equationStr
        .replace(/\^/g, '**')
        .replace(/Math\./g, '') // strip to avoid double Math
        .replace(/sin/g, 'Math.sin')
        .replace(/cos/g, 'Math.cos')
        .replace(/tan/g, 'Math.tan')
        .replace(/abs/g, 'Math.abs')
        .replace(/sqrt/g, 'Math.sqrt')
        .replace(/exp/g, 'Math.exp')
        .replace(/pi/g, 'Math.PI')
        .replace(/e/g, 'Math.E');

      // Create sandboxed mathematical executor scope
      const evalFn = new Function('x', 'a', 'b', 'c', `
        try {
          return ${sanitized};
        } catch(e) {
          return 0;
        }
      `);
      
      const res = evalFn(x, paramA, paramB, paramC);
      return isNaN(res) || !isFinite(res) ? 0 : res;
    } catch {
      return 0;
    }
  };

  // Vectorized coordinate calculations
  const [svgWidth, svgHeight] = [450, 300];
  const centerX = svgWidth / 2;
  const centerY = svgHeight / 2;

  // Generate math lines mapping coordinates
  const graphPoints = useMemo(() => {
    const points: [number, number][] = [];
    const step = 0.1; // mathematical resolution
    const limitRange = (svgWidth / 2) / zoom; // max math X units

    for (let mathX = -limitRange - 2; mathX <= limitRange + 2; mathX += step) {
      const mathY = evalMath(mathX);
      
      // Convert to SVG Pixel Coordinates
      const screenX = centerX + (mathX * zoom);
      const screenY = centerY - (mathY * zoom);
      
      points.push([screenX, screenY]);
    }
    return points;
  }, [equationStr, paramA, paramB, paramC, zoom]);

  // Construct coordinates svg polyline element string
  const polylinePathStr = useMemo(() => {
    return graphPoints
      .filter(([x, y]) => y >= -50 && y <= svgHeight + 50) // prevent overflows drawing artifacts
      .map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`)
      .join(' ');
  }, [graphPoints]);

  // Hover tracker coordinate translator
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Convert pixel to mathematical value
    const mathX = (x - centerX) / zoom;
    const mathY = evalMath(mathX);
    
    // Exact screen point for evaluated mathY
    const screenY = centerY - (mathY * zoom);

    setHoverCoords({
      x,
      y: screenY,
      mathX: Number(mathX.toFixed(2)),
      mathY: Number(mathY.toFixed(2))
    });
  };

  const cleanEquationLabel = (str: string) => {
    return str
      .replace(/Math\./g, '')
      .replace(/\*\*/g, '^')
      .replace(/\*/g, '·');
  };

  return (
    <div className="flex flex-col h-full bg-[#1A1D23] border border-[#2D3139] rounded-2xl overflow-hidden shadow-xl">
      {/* Title block */}
      <div className="flex items-center justify-between px-5 py-3.5 bg-[#15181E] border-b border-[#2D3139]">
        <div className="flex items-center space-x-2">
          <LineChart className="text-[#3B82F6]" size={18} />
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white font-display">{plotTitle}</h3>
        </div>
        <div className="flex items-center space-x-1">
          <button 
            onClick={() => setZoom(prev => Math.max(10, prev - 5))}
            className="p-1 text-slate-400 hover:text-slate-100 rounded hover:bg-[#2D3139]" 
            title="Suministrar zoom out"
          >
            <ZoomOut size={15} />
          </button>
          <span className="text-[9px] font-mono text-slate-500 px-1 uppercase tracking-wider">{zoom}px/u</span>
          <button 
            onClick={() => setZoom(prev => Math.min(80, prev + 5))}
            className="p-1 text-slate-400 hover:text-slate-100 rounded hover:bg-[#2D3139]"
            title="Suministrar zoom in"
          >
            <ZoomIn size={15} />
          </button>
          <span className="w-[1px] h-4 bg-[#2D3139] mx-1" />
          <button 
            onClick={() => setShowGrid(!showGrid)} 
            className="p-1 text-slate-400 hover:text-slate-100 rounded hover:bg-[#2D3139] transition"
            title={showGrid ? "Ocultar retícula" : "Mostrar retícula"}
          >
            <Sparkles size={15} className={showGrid ? 'text-emerald-400' : 'text-slate-500'} />
          </button>
        </div>
      </div>

      {/* SVG Canvas Plot area */}
      <div className="relative bg-[#0F1115] flex-1 min-h-[220px]">
        <svg 
          className="absolute inset-0 w-full h-full cursor-crosshair select-none"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoverCoords(null)}
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          preserveAspectRatio="xMidYMid meet"
        >
          {/* 1. Backdrop Grid */}
          {showGrid && (
            <>
              {/* Vertical grids */}
              {Array.from({ length: Math.ceil(svgWidth / zoom) + 2 }).map((_, i) => {
                const stepX = Math.floor(centerX / zoom);
                const valX = i - stepX;
                const pixX = centerX + (valX * zoom);
                if (valX === 0) return null;
                return (
                  <line 
                    key={`v-${i}`} 
                    x1={pixX} y1={0} x2={pixX} y2={svgHeight} 
                    stroke="rgba(74, 85, 104, 0.2)" 
                    strokeWidth={0.5} 
                  />
                );
              })}
              {/* Horizontal grids */}
              {Array.from({ length: Math.ceil(svgHeight / zoom) + 2 }).map((_, i) => {
                const stepY = Math.floor(centerY / zoom);
                const valY = stepY - i;
                const pixY = centerY - (valY * zoom);
                if (valY === 0) return null;
                return (
                  <line 
                    key={`h-${i}`} 
                    x1={0} y1={pixY} x2={svgWidth} y2={pixY} 
                    stroke="rgba(74, 85, 104, 0.2)" 
                    strokeWidth={0.5} 
                  />
                );
              })}
            </>
          )}

          {/* 2. Main Axes Cartesian Line */}
          <line x1={0} y1={centerY} x2={svgWidth} y2={centerY} stroke="#475569" strokeWidth={1.5} />
          <line x1={centerX} y1={0} x2={centerX} y2={svgHeight} stroke="#475569" strokeWidth={1.5} />

          {/* Axis Labels */}
          <text x={svgWidth - 15} y={centerY + 14} fill="#94a3b8" fontSize="10px" fontFamily="monospace">x</text>
          <text x={centerX + 8} y={15} fill="#94a3b8" fontSize="10px" fontFamily="monospace">y</text>

          {/* Scale Axis Numbers */}
          {showGrid && (
            <>
              {/* X numbers */}
              {[-4, -2, 2, 4].map((v) => {
                const pos = centerX + (v * zoom);
                if (pos < 10 || pos > svgWidth - 10) return null;
                return (
                  <g key={`num-x-${v}`}>
                    <line x1={pos} y1={centerY - 3} x2={pos} y2={centerY + 3} stroke="#64748b" />
                    <text x={pos - 4} y={centerY + 14} fill="#64748b" fontSize="8px" fontFamily="monospace">{v}</text>
                  </g>
                );
              })}
              {/* Y numbers */}
              {[-3, -1, 1, 3].map((v) => {
                const pos = centerY - (v * zoom);
                if (pos < 10 || pos > svgHeight - 10) return null;
                return (
                  <g key={`num-y-${v}`}>
                    <line x1={centerX - 3} y1={pos} x2={centerX + 3} y2={pos} stroke="#64748b" />
                    <text x={centerX - 12} y={pos + 3} fill="#64748b" fontSize="8px" fontFamily="monospace">{v}</text>
                  </g>
                );
              })}
            </>
          )}

          {/* 3. Plotted mathematical curves */}
          <polyline
            fill="none"
            stroke="#10b981"
            strokeWidth={2.5}
            strokeLinejoin="round"
            strokeLinecap="round"
            points={polylinePathStr}
          />

          {/* 4. Active interactive coordinates point tracer (Hover state) */}
          {hoverCoords && (
            <g>
              <circle cx={hoverCoords.x} cy={hoverCoords.y} r={5} fill="#38bdf8" stroke="#111827" strokeWidth={1.5} />
              <line x1={hoverCoords.x} y1={centerY} x2={hoverCoords.x} y2={hoverCoords.y} stroke="#38bdf8" strokeWidth={1} strokeDasharray="3,3" />
              <line x1={centerX} y1={hoverCoords.y} x2={hoverCoords.x} y2={hoverCoords.y} stroke="#38bdf8" strokeWidth={1} strokeDasharray="3,3" />
              
              {/* Interactive Info plate */}
              <rect 
                x={hoverCoords.x > centerX ? hoverCoords.x - 110 : hoverCoords.x + 10}
                y={hoverCoords.y > centerY ? hoverCoords.y - 45 : hoverCoords.y + 10}
                width={100}
                height={35}
                rx={6}
                fill="rgba(15, 23, 42, 0.9)"
                stroke="#334155"
              />
              <text 
                x={hoverCoords.x > centerX ? hoverCoords.x - 102 : hoverCoords.x + 18}
                y={hoverCoords.y > centerY ? hoverCoords.y - 32 : hoverCoords.y + 22}
                fill="#f1f5f9"
                fontSize="9px"
                fontFamily="monospace"
              >
                x = {hoverCoords.mathX}
              </text>
              <text 
                x={hoverCoords.x > centerX ? hoverCoords.x - 102 : hoverCoords.x + 18}
                y={hoverCoords.y > centerY ? hoverCoords.y - 20 : hoverCoords.y + 34}
                fill="#38bdf8"
                fontSize="9px"
                fontFamily="monospace"
              >
                f(x) = {hoverCoords.mathY}
              </text>
            </g>
          )}
        </svg>

        {/* Floating equation indicator label */}
        <div className="absolute bottom-3 left-4 bg-[#15181E]/95 backdrop-blur border border-[#2D3139] px-3 py-1.5 rounded-xl font-mono text-xs text-slate-300">
          <span className="text-[#3B82F6] font-semibold">f(x) =</span> {cleanEquationLabel(equationStr)}
        </div>
      </div>

      {/* Control panel: sliders and formulas configurer */}
      <div className="p-4 bg-[#15181E] border-t border-[#2D3139] space-y-3.5">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-display">Fórmula Activa:</span>
          <input 
            type="text" 
            value={equationStr}
            onChange={(e) => setEquationStr(e.target.value)}
            className="flex-1 bg-[#0F1115] border border-[#2D3139] rounded-lg px-2.5 py-1.5 text-xs text-blue-400 font-mono focus:outline-none focus:border-[#3B82F6]"
            placeholder="Introduce ecuación, ej: a * sin(x) + b"
          />
        </div>

        {/* Dynamic adjusters sliders */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* parameter A */}
          <div className="bg-[#0F1115]/60 p-2.5 rounded-xl border border-[#2D3139] flex flex-col space-y-1.5">
            <div className="flex justify-between items-center text-[10px] font-mono">
              <span className="text-slate-500 font-bold uppercase tracking-tight">Parámetro a</span>
              <span className="text-blue-400 font-bold">{paramA.toFixed(2)}</span>
            </div>
            <input 
              type="range"
              min="-10"
              max="10"
              step="0.05"
              value={paramA}
              onChange={(e) => setParamA(parseFloat(e.target.value))}
              className="accent-[#3B82F6] w-full h-1.5 bg-slate-800 rounded-lg cursor-pointer animate-none"
            />
          </div>

          {/* parameter B */}
          <div className="bg-[#0F1115]/60 p-2.5 rounded-xl border border-[#2D3139] flex flex-col space-y-1.5">
            <div className="flex justify-between items-center text-[10px] font-mono">
              <span className="text-slate-500 font-bold uppercase tracking-tight">Parámetro b</span>
              <span className="text-pink-400 font-bold">{paramB.toFixed(2)}</span>
            </div>
            <input 
              type="range"
              min="-10"
              max="10"
              step="0.05"
              value={paramB}
              onChange={(e) => setParamB(parseFloat(e.target.value))}
              className="accent-pink-500 w-full h-1.5 bg-slate-800 rounded-lg cursor-pointer animate-none"
            />
          </div>

          {/* parameter C */}
          <div className="bg-[#0F1115]/60 p-2.5 rounded-xl border border-[#2D3139] flex flex-col space-y-1.5">
            <div className="flex justify-between items-center text-[10px] font-mono">
              <span className="text-slate-500 font-bold uppercase tracking-tight">Parámetro c</span>
              <span className="text-amber-400 font-bold">{paramC.toFixed(2)}</span>
            </div>
            <input 
              type="range"
              min="-5"
              max="5"
              step="0.05"
              value={paramC}
              onChange={(e) => setParamC(parseFloat(e.target.value))}
              className="accent-amber-500 w-full h-1.5 bg-slate-800 rounded-lg cursor-pointer animate-none"
            />
          </div>
        </div>

        {/* Quick math curves presets shelf */}
        <div className="pt-2.5 border-t border-[#2D3139]/40">
          <div className="text-[10px] text-slate-400 font-black uppercase tracking-[0.16em] mb-2 flex items-center gap-1.5 font-display">
            <Sliders size={12} className="text-[#3B82F6]" /> Plantillas de Estudio Curricular:
          </div>
          <div className="flex flex-wrap gap-1.5 max-h-[85px] overflow-y-auto pr-1">
            {PRESETS.map((p) => (
              <button 
                key={p.name}
                onClick={() => loadPreset(p)}
                className="px-2.5 py-1 text-[9px] bg-[#0F1115] border border-[#2D3139] hover:border-[#3B82F6] hover:text-white text-[#9CA3AF] rounded-lg font-bold uppercase tracking-wider transition"
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
