import React, { useState } from 'react';
import { 
  Keyboard, Sigma, AlignCenter, Copy, ArrowRightLeft, 
  Sparkles, Check, Bookmark, BookOpen, Trash
} from 'lucide-react';

interface LaTeXHelperProps {
  latexValue: string;
  onChange: (val: string) => void;
  onClear?: () => void;
}

export default function LaTeXHelper({
  latexValue,
  onChange,
  onClear
}: LaTeXHelperProps) {
  const [activeTab, setActiveTab] = useState<'operadores' | 'griegas' | 'algebra' | 'guia'>('operadores');
  const [copied, setCopied] = useState(false);

  // Symbol sets categorized by curricular fields
  const SYMBOL_GROUPS = {
    operadores: [
      { label: 'Integral', code: '\\int_{a}^{b} x \\, dx', desc: 'Integral definida' },
      { label: 'Sumatoria', code: '\\sum_{i=1}^{n} i', desc: 'Sumas de Riemann / Series' },
      { label: 'Límite', code: '\\lim_{x \\to \\infty} f(x)', desc: 'Límite infinito' },
      { label: 'Raíz', code: '\\sqrt[2]{x}', desc: 'Raíz cuadrada n' },
      { label: 'Fracción', code: '\\frac{a}{b}', desc: 'Fracción común' },
      { label: 'Derivada', code: '\\frac{dy}{dx}', desc: 'Diferenciación' },
      { label: 'Derivada Parcial', code: '\\frac{\\partial y}{\\partial x}', desc: 'Cálculo multivariable' },
      { label: 'Integral Doble', code: '\\iint_{D} f(x, y) \\, dA', desc: 'Integral múltiple' },
    ],
    griegas: [
      { label: 'Alfa α', code: '\\alpha', desc: 'Ángulos o constantes' },
      { label: 'Beta β', code: '\\beta', desc: 'Ángulos o constantes' },
      { label: 'Theta θ', code: '\\theta', desc: 'Ángulos polares / trigonometría' },
      { label: 'Pi π', code: '\\pi', desc: 'Constante geométrica circular' },
      { label: 'Lambda λ', code: '\\lambda', desc: 'Longitud de onda / valores propios' },
      { label: 'Sigma Σ', code: '\\sigma', desc: 'Sumatorias o desviación estándar' },
      { label: 'Delta Δ', code: '\\Delta', desc: 'Variación o incremento' },
      { label: 'Omega Ω', code: '\\omega', desc: 'Frecuencia angular' },
    ],
    algebra: [
      { label: 'Matriz 2x2', code: '\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}', desc: 'Matriz bidimensional' },
      { label: 'Vectores', code: '\\vec{v} = a\\hat{i} + b\\hat{j}', desc: 'Álgebra lineal vector' },
      { label: 'Producto Cruz', code: '\\vec{u} \\times \\vec{v}', desc: 'Producto vectorial' },
      { label: 'Infinito', code: '\\infty', desc: 'Límites o extremos de rango' },
      { label: 'Seno sin(θ)', code: '\\sin(\\theta)', desc: 'Función trigonométrica' },
      { label: 'Coseno cos(θ)', code: '\\cos(\\theta)', desc: 'Función trigonométrica' },
      { label: 'Sistemas', code: '\\begin{cases} x + y = 2 \\\\ x - y = 0 \\end{cases}', desc: 'Sistemas de ecuaciones' },
      { label: 'Combinatoria', code: '\\binom{n}{k}', desc: 'Coeficiente binomial' },
    ],
    guia: [
      { tip: "Ecuaciones en línea", syntax: "$x^2 + y^2 = r^2$", usage: "Para incrustar fórmulas dentro de un párrafo." },
      { tip: "Ecuaciones destacadas", syntax: "$$f(x) = \\int g(x) \\, dx$$", usage: "Para colocar la fórmula centrada en su propia línea." },
      { tip: "Subíndices", syntax: "x_{n+1}", usage: "Utiliza un guión bajo para índices." },
      { tip: "Exponentes", syntax: "y^{2x}", usage: "Utiliza un acento circunflejo para potencias." },
    ]
  };

  const handleInsert = (symbolCode: string) => {
    // Append or insert at cursor
    onChange(latexValue + ' ' + symbolCode);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(latexValue);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col bg-[#1A1D23] border border-[#2D3139] rounded-2xl p-4.5 space-y-4 shadow-xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Keyboard className="text-[#3B82F6]" size={18} />
          <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white font-display">Editor e Inserto de Fórmulas LaTeX</h4>
        </div>
        {onClear && latexValue && (
          <button 
            onClick={onClear}
            className="text-[10px] text-rose-400 font-bold uppercase tracking-wider hover:text-rose-300 flex items-center gap-1 transition"
          >
            <Trash size={12} /> Limpiar Editor
          </button>
        )}
      </div>

      {/* Editor text area */}
      <div className="relative">
        <textarea
          id="latex-textarea"
          value={latexValue}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Escribe o haz clic en las plantillas de abajo para estructurar tu nota..."
          className="w-full bg-[#0F1115] border border-[#2D3139] hover:border-slate-600 rounded-xl px-4 py-3 text-xs text-blue-200 font-mono focus:outline-none focus:border-[#3B82F6] h-[100px] leading-relaxed resize-none shadow-inner"
        />
        
        {/* Floating controls */}
        {latexValue && (
          <button
            onClick={copyToClipboard}
            className="absolute bottom-3 right-3 text-[10px] bg-slate-800 border border-slate-700 hover:bg-slate-750 hover:text-white px-2 py-1.5 rounded-lg text-slate-300 transition-all flex items-center gap-1.5"
            title="Copiar código LaTeX"
          >
            {copied ? (
              <>
                <Check size={12} className="text-emerald-400" /> ¡Copiado!
              </>
            ) : (
              <>
                <Copy size={12} /> Copiar
              </>
            )}
          </button>
        )}
      </div>

      {/* Symbol Tabs Selectors */}
      <div className="flex border-b border-[#2D3139] p-0.5 bg-[#0F1115]/60 rounded-xl">
        {(['operadores', 'griegas', 'algebra', 'guia'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-1.5 text-[10px] text-center rounded-lg transition capitalize font-bold uppercase tracking-wider ${activeTab === tab ? 'bg-[#3B82F6] text-white shadow-sm' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'}`}
          >
            {tab === 'operadores' ? 'Cálculo' : tab === 'griegas' ? 'Grígolas α' : tab === 'algebra' ? 'Álgebra/Trigo' : 'Guía de Sintáxis'}
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      <div className="bg-[#0F1115]/30 p-2 border border-[#2D3139]/60 rounded-xl min-h-[145px] max-h-[195px] overflow-y-auto">
        {activeTab !== 'guia' ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {SYMBOL_GROUPS[activeTab].map((sym) => (
              <button
                key={sym.label}
                onClick={() => handleInsert(sym.code)}
                className="group relative flex flex-col items-center justify-center p-2.5 bg-[#0F1115] border border-[#2D3139] hover:border-[#3B82F6] rounded-xl hover:bg-slate-850/30 transition text-center"
                title={sym.desc}
              >
                <span className="text-[9px] text-slate-450 font-bold uppercase tracking-wider group-hover:text-slate-300 transition-colors mb-1">{sym.label}</span>
                <code className="text-xs text-blue-400 font-mono break-all truncate max-w-full">{sym.code}</code>
                
                {/* Micro tooltip descriptions */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 bg-slate-950 border border-slate-700 text-[10px] text-slate-300 px-2 py-1 rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none mb-1 text-center whitespace-nowrap z-10">
                  {sym.desc}
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-2.5">
            {SYMBOL_GROUPS.guia.map((g, idx) => (
              <div key={idx} className="bg-[#0F1115]/80 p-2.5 border border-[#2D3139]/40 rounded-xl space-y-1">
                <div className="flex justify-between text-xs text-slate-300 font-semibold font-sans">
                  <span>{g.tip}</span>
                  <code className="text-[10px] text-[#3B82F6] bg-slate-950 px-1.5 py-0.5 rounded font-mono font-bold tracking-tight">{g.syntax}</code>
                </div>
                <p className="text-[11px] text-slate-400 font-sans leading-relaxed">{g.usage}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Visual Live LaTeX formula demonstration block */}
      {latexValue && (
        <div className="mt-2 bg-gradient-to-br from-[#15181E] to-[#0F1115] border border-[#2D3139] p-4 rounded-xl flex flex-col items-center justify-center text-center">
          <div className="text-[9px] uppercase tracking-[0.2em] text-[#3B82F6] font-black mb-2 flex items-center gap-1">
            <AlignCenter size={10} /> Previsualización Simbolizada
          </div>
          
          {/* We replace the code visually with centered big display elements */}
          <div className="text-slate-100 text-sm py-1 font-serif overflow-x-auto max-w-full select-none" id="latex-visual-formula">
            <div className="bg-[#0F1115] border border-[#2D3139] rounded-lg px-6 py-4 inline-block font-mono text-blue-400">
              {latexValue.trim() || "Formula..."}
            </div>
          </div>
          
          <p className="text-[10px] text-slate-400 mt-2 italic font-sans">
            Inserta esta sintaxis matemática en tu nota para que se compile y visualice en cualquier lector compatible o para imprimir.
          </p>
        </div>
      )}
    </div>
  );
}
