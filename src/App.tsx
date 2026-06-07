import React, { useState, useEffect } from 'react';
import { 
  Square, Circle as CircleIcon, PenTool, Eraser, MoveRight, 
  Sparkles, CheckCircle2, ChevronRight, RefreshCw, ZoomIn, 
  ZoomOut, Award, BookOpen, GraduationCap, Users, LayoutDashboard, 
  Save, FolderOpen, Plus, Trash2, ArrowUpRight, HelpCircle, 
  Lightbulb, Check, FileDown, Eye, Moon, Sun, Wand2, Info
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

// Component Imports
import MathWacomCanvas from './components/MathWacomCanvas';
import InteractiveGraph from './components/InteractiveGraph';
import LaTeXHelper from './components/LaTeXHelper';
import TeacherCorner from './components/TeacherCorner';

// Types Imports
import { SavedNote, Stroke, GeometricShape, QuizItem, AIAnalysisResult } from './types';

// Pre-drawn Math Classroom Examples so anyone can test the Pen/Wacom features instantly
const EXAMPLE_NOTES: SavedNote[] = [
  {
    id: 'ex-pitagoras',
    title: 'Teorema de Pitágoras y Triángulos Rectángulos',
    category: 'secundaria',
    createdAt: new Date().toLocaleDateString('es-ES'),
    strokes: [
      // Simulated handwritten formulas / arrows
      {
        id: 'h1',
        type: 'freehand',
        color: '#f87171',
        thickness: 4,
        points: [
          { x: 120, y: 150 }, { x: 125, y: 152 }, { x: 130, y: 156 },
          { x: 140, y: 162 }, { x: 150, y: 168 }, { x: 160, y: 172 }
        ]
      },
      {
        id: 'h2',
        type: 'freehand',
        color: '#f87171',
        thickness: 4,
        points: [
          { x: 155, y: 160 }, { x: 160, y: 172 }, { x: 148, y: 174 }
        ]
      }
    ],
    shapes: [
      {
        id: 's-tri',
        type: 'triangle',
        startX: 50,
        startY: 50,
        endX: 200,
        endY: 200,
        color: '#60a5fa',
        thickness: 3,
        label: 'Hipotenusa (c)'
      },
      {
        id: 's-l1',
        type: 'line',
        startX: 50,
        startY: 200,
        endX: 200,
        endY: 200,
        color: '#34d399',
        thickness: 3,
        label: 'b = 4cm'
      },
      {
        id: 's-l2',
        type: 'line',
        startX: 50,
        startY: 50,
        endX: 50,
        endY: 200,
        color: '#fbbf24',
        thickness: 3,
        label: 'a = 3cm'
      }
    ],
    latexContent: 'a^2 + b^2 = c^2 \\implies c = \\sqrt{3^2 + 4^2} = 5\\text{cm}',
    gridType: 'grid',
    gridColor: '#475569',
    quizItems: [
      {
        id: 'pq-1',
        question: "En un triángulo rectángulo cuyos catetos miden a = 6 y b = 8, ¿cuánto vale la hipotenusa c?",
        options: ["10", "12", "14", "9.5"],
        correctIndex: 0,
        explanation: "Elevamos al cuadrado c^2 = 6^2 + 8^2 = 36 + 64 = 100. La raíz de 100 es exactamente 10."
      }
    ]
  },
  {
    id: 'ex-integral',
    title: 'Introducción a la Área Bajo la Curva (Parábola)',
    category: 'universidad',
    createdAt: new Date().toLocaleDateString('es-ES'),
    strokes: [
      {
        id: 'int-1',
        type: 'freehand',
        color: '#a78bfa',
        thickness: 3,
        points: [
          { x: 260, y: 120 }, { x: 262, y: 125 }, { x: 265, y: 135 },
          { x: 265, y: 155 }, { x: 262, y: 165 }, { x: 260, y: 170 }
        ]
      }
    ],
    shapes: [
      {
        id: 's-axis',
        type: 'axis',
        startX: 150,
        startY: 180,
        endX: 150,
        endY: 180,
        color: '#475569',
        thickness: 2,
        label: 'Gráfica de f(x) = x^2'
      }
    ],
    latexContent: '\\int_{0}^{2} x^2 \\, dx = \\left[ \\frac{x^3}{3} \\right]_0^2 = \\frac{8}{3} - 0 \\approx 2.67',
    gridType: 'millimeter',
    gridColor: '#475569',
    quizItems: [
      {
        id: 'pq-2',
        question: "¿Cuál es la antiderivada (integral indefinida) de f(x) = x^3?",
        options: ["3x^2 + C", "(x^4)/4 + C", "x^4 + C", "(x^3)/3 + C"],
        correctIndex: 1,
        explanation: "Siguiendo la regla de la potencia: la integral de x^n es x^(n+1)/(n+1). Para n=3, tenemos x^4 / 4 + C."
      }
    ]
  }
];

export default function App() {
  // Main state storage
  const [notes, setNotes] = useState<SavedNote[]>(() => {
    const cached = localStorage.getItem('SAVED_MATH_NOTES_WACOM_V1');
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch {
        return EXAMPLE_NOTES;
      }
    }
    return EXAMPLE_NOTES;
  });

  // Current working workspace note
  const [activeNoteId, setActiveNoteId] = useState<string>(EXAMPLE_NOTES[0].id);
  const [noteTitle, setNoteTitle] = useState<string>(EXAMPLE_NOTES[0].title);
  const [noteCategory, setNoteCategory] = useState<SavedNote['category']>('secundaria');
  const [strokes, setStrokes] = useState<Stroke[]>(EXAMPLE_NOTES[0].strokes);
  const [shapes, setShapes] = useState<GeometricShape[]>(EXAMPLE_NOTES[0].shapes);
  const [latexText, setLatexText] = useState<string>(EXAMPLE_NOTES[0].latexContent);
  const [gridType, setGridType] = useState<SavedNote['gridType']>('grid');
  const [quizItems, setQuizItems] = useState<QuizItem[]>(EXAMPLE_NOTES[0].quizItems || []);

  // UI Theme toggler
  const [boardTheme, setBoardTheme] = useState<'white' | 'dark'>('dark');

  // Gemini AI state
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState<string>('');
  
  // Interactive plotted graph output from Gemini
  const [aiGraphInfo, setAiGraphInfo] = useState<{
    ecuacion: string;
    titulo: string;
    variableAjuste: string;
    ecuacionConVariable: string;
    minVal: number;
    maxVal: number;
    defaultVal: number;
  } | null>({
    ecuacion: "x**2",
    titulo: "Gráfico Cuadrático Inicial",
    variableAjuste: "a",
    ecuacionConVariable: "a * x**2",
    minVal: -5,
    maxVal: 5,
    defaultVal: 1
  });

  // Nice notifications and custom dialog state instead of alert/confirm
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'info') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification((prev) => (prev?.message === message ? null : prev));
    }, 4000);
  };

  const [aiTextExplanation, setAiTextExplanation] = useState<string>(
    `### Hola, bienvenido a tus apuntes interactivos
Presiona el botón **"Analizar boceto con IA"** en la barra lateral para que Gemini escaneé las ecuaciones de tu pizarra Wacom, resuelva problemas y genere un panel interactivo.
    
**Cómo empezar:**
1. Selecciona herramientas de lápiz o figuras geométricas arriba.
2. Dibuja fórmulas o bosquejos con tu ratón o tableta digitalizadora.
3. Si no tienes tableta, carga uno de los bocetos de ejemplo arriba (*Ejemplo Pitágoras* o *Ejemplo Integral*) para ver la magia de la digitalización IA de inmediato.`
  );

  // Sync state when loading a saved note
  const loadNote = (note: SavedNote) => {
    setActiveNoteId(note.id);
    setNoteTitle(note.title);
    setNoteCategory(note.category);
    setStrokes(note.strokes);
    setShapes(note.shapes);
    setLatexText(note.latexContent);
    setGridType(note.gridType);
    setQuizItems(note.quizItems || []);
  };

  // Safe save changes to LocalStorage
  const saveCurrentNote = () => {
    const updated: SavedNote = {
      id: activeNoteId,
      title: noteTitle,
      category: noteCategory,
      createdAt: new Date().toLocaleDateString('es-ES'),
      strokes,
      shapes,
      latexContent: latexText,
      gridType,
      gridColor: '#475569',
      quizItems
    };

    const nextNotes = notes.map(n => n.id === activeNoteId ? updated : n);
    setNotes(nextNotes);
    localStorage.setItem('SAVED_MATH_NOTES_WACOM_V1', JSON.stringify(nextNotes));
    showToast('Cambios guardados de manera segura en el navegador.', 'success');
  };

  // Create a blank notepad
  const createNewNote = () => {
    const id = 'note-' + Math.random().toString(36).substr(2, 9);
    const newNote: SavedNote = {
      id,
      title: 'Nuevo Apunte Matemático ' + (notes.length + 1),
      category: 'general',
      createdAt: new Date().toLocaleDateString('es-ES'),
      strokes: [],
      shapes: [],
      latexContent: '',
      gridType: 'grid',
      gridColor: '#475569',
      quizItems: []
    };

    const next = [...notes, newNote];
    setNotes(next);
    localStorage.setItem('SAVED_MATH_NOTES_WACOM_V1', JSON.stringify(next));
    loadNote(newNote);
  };

  // Delete note from repository
  const deleteNote = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (notes.length <= 1) {
      showToast('Debes mantener al menos una nota en tu biblioteca.', 'error');
      return;
    }
    setDeleteConfirmId(id);
  };

  const handleConfirmDeleteNote = () => {
    if (!deleteConfirmId) return;
    const id = deleteConfirmId;
    const next = notes.filter(n => n.id !== id);
    setNotes(next);
    localStorage.setItem('SAVED_MATH_NOTES_WACOM_V1', JSON.stringify(next));
    if (activeNoteId === id) {
      loadNote(next[0]);
    }
    setDeleteConfirmId(null);
    showToast('El cuaderno de apuntes ha sido eliminado de la biblioteca.', 'info');
  };

  // Call server-side API to analyze the sketched notes using Gemini 3.5 Flash
  const analyzeWithGemini = async () => {
    const canvasElement = document.querySelector('canvas') as HTMLCanvasElement;
    if (!canvasElement) {
      showToast("No se ha podido capturar el lienzo del pizarrón de matemáticas.", 'error');
      return;
    }

    setIsAiLoading(true);
    setAiError(null);

    try {
      // 1. Export current mathematical canvas drawing to Base64 image
      const screenshotDataUrl = canvasElement.toDataURL('image/png');

      // 2. Fetch Express controller
      const response = await fetch('/api/gemini/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: screenshotDataUrl,
          prompt: customPrompt
        })
      });

      if (!response.ok) {
        const errorJson = await response.json();
        throw new Error(errorJson.error || "Fallo en la comunicación con el tutor Gemini.");
      }

      const info: AIAnalysisResult = await response.json();

      // 3. Populate received intelligence back to the UI
      if (info.latex) {
        setLatexText(info.latex);
      }
      if (info.titulo) {
        setNoteTitle(info.titulo);
      }
      if (info.explicacion) {
        setAiTextExplanation(info.explicacion);
      }
      if (info.graficaSugerida) {
        setAiGraphInfo({
          ecuacion: info.graficaSugerida.ecuacion,
          titulo: info.graficaSugerida.titulo,
          variableAjuste: info.graficaSugerida.variableAjuste,
          ecuacionConVariable: info.graficaSugerida.ecuacionConVariable,
          minVal: info.graficaSugerida.minVal,
          maxVal: info.graficaSugerida.maxVal,
          defaultVal: info.graficaSugerida.defaultVal
        });
      }

      // Add a cool default quiz item generated relative to what was solved
      if (info.titulo) {
        const generatedQuiz: QuizItem = {
          id: 'ai-q-' + Math.random().toString(36).substr(2, 9),
          question: `¿Cuál de las siguientes propuestas describe mejor el concepto de "${info.titulo}" analizado por Gemini?`,
          options: [
            "Es una relación puramente determinista sin variables continuas.",
            "Requiere un modelado geométrico y analítico de constantes dependientes.",
            "No permite representaciones gráficas de planos adyacentes.",
            "Es una fórmula estática de Obsidian antigua."
          ],
          correctIndex: 1,
          explanation: `El análisis interactivo demuestra que "${info.titulo}" integra ecuaciones algebraicas, geometría y trazo continuo de parámetros dinámicos.`
        };
        setQuizItems([generatedQuiz]);
      }

    } catch (e: any) {
      console.error(e);
      setAiError(e.message || "Lo sentimos, el tutor de Gemini está experimentando problemas de red. Por favor configura tu GEMINI_API_KEY en los secretos o inténtalo de nuevo.");
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 font-sans ${boardTheme === 'white' ? 'bg-[#F3F4F6] text-slate-800' : 'bg-[#0F1115] text-[#E0E2E6]'}`}>
      
      {/* Top Main Suite Navbar Header */}
      <header className={`border-b sticky top-0 z-50 backdrop-blur ${boardTheme === 'white' ? 'border-[#E5E7EB] bg-white/90 text-slate-900' : 'border-[#2D3139] bg-[#15181E]/95 text-white'}`}>
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#3B82F6] via-indigo-600 to-pink-600 flex items-center justify-center shadow-lg shadow-blue-500/15">
              <GraduationCap size={22} className="text-white" />
            </div>
            <div>
              <h1 className="font-display font-black text-lg tracking-tighter uppercase italic flex items-center gap-2">
                MathFlow
                <span className="bg-[#3B82F6]/10 border border-[#3B82F6]/30 text-[9px] text-[#3B82F6] font-mono font-bold px-2.5 py-0.5 rounded uppercase tracking-widest animate-pulse">Wacom Pro Active</span>
              </h1>
              <p className="text-[10px] text-slate-400 font-mono tracking-tight uppercase">Apuntes Matemáticos Wacom Pro Edition</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Whiteboard / Blackboard quick toggler */}
            <button
              onClick={() => setBoardTheme(boardTheme === 'white' ? 'dark' : 'white')}
              className={`flex items-center gap-1.5 px-3 py-1.5 border transition-all text-xs rounded-xl font-bold uppercase tracking-wider ${boardTheme === 'white' ? 'bg-white border-[#E5E7EB] hover:bg-slate-100 text-slate-800' : 'bg-[#2D3139] border-[#2D3139] hover:border-slate-500 hover:text-white text-slate-300'}`}
              title="Cambiar fondo de pizarra"
            >
              {boardTheme === 'white' ? (
                <>
                  <Moon size={14} className="text-indigo-400" /> Pizarra Negra
                </>
              ) : (
                <>
                  <Sun size={14} className="text-amber-400" /> Pizarra Blanca
                </>
              )}
            </button>

            {/* Notebook Creator Actions */}
            <button
              onClick={createNewNote}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#2D3139] hover:bg-[#3b424d] text-white text-xs font-bold rounded-lg uppercase tracking-wider border border-[#2D3139] transition-all"
            >
              <Plus size={14} /> Nueva Nota
            </button>

            <button
              onClick={saveCurrentNote}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#3B82F6] hover:bg-blue-600 text-white text-xs font-bold rounded-lg uppercase tracking-wider shadow-md hover:shadow-blue-500/10 transition-all"
            >
              <Save size={14} /> Guardar
            </button>
          </div>
        </div>
      </header>

      {/* Main Container Layout */}
      <main className="max-w-7xl mx-auto p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Sidepanel: Library of Math Notes & Gemini Command Center */}
        <section className="lg:col-span-3 space-y-6">
          
          {/* Notes Repository List */}
          <div className={`border rounded-2xl p-4.5 shadow-xl space-y-3 ${boardTheme === 'white' ? 'bg-white border-[#E5E7EB]' : 'bg-[#1A1D23] border-[#2D3139]'}`}>
            <h3 className="text-[10px] font-black uppercase text-[#3B82F6] tracking-[0.2em] flex items-center gap-2 font-display">
              <FolderOpen size={14} className="text-blue-400" /> Biblioteca de Apuntes
            </h3>
            
            <div className="space-y-1.5 max-h-[165px] overflow-y-auto pr-1">
              {notes.map((n) => (
                <div
                  key={n.id}
                  onClick={() => loadNote(n)}
                  className={`w-full text-left px-3 py-2.5 text-xs rounded-xl border transition-all flex items-center justify-between gap-2 group cursor-pointer ${activeNoteId === n.id ? (boardTheme === 'white' ? 'bg-blue-50 border-blue-200 text-[#3B82F6] font-bold shadow-sm' : 'bg-[#2D3139] border-[#3B82F6] text-white font-bold shadow-sm') : (boardTheme === 'white' ? 'bg-transparent border-transparent hover:bg-slate-100 text-slate-600' : 'bg-transparent border-transparent text-[#9CA3AF] hover:text-white hover:bg-[#2D3139]/40')}`}
                >
                  <div className="truncate flex-1">
                    <p className={`truncate font-semibold ${activeNoteId === n.id ? (boardTheme === 'white' ? 'text-blue-600' : 'text-white') : 'text-slate-400 group-hover:text-slate-200'}`}>{n.title}</p>
                    <span className="text-[9px] font-mono opacity-60 block mt-0.5 uppercase tracking-wider">{n.createdAt} • {n.category === 'secundaria' ? 'Secundaria' : n.category === 'universidad' ? 'Universidad' : n.category === 'primaria' ? 'Primaria' : 'General'}</span>
                  </div>
                  <button
                    onClick={(e) => deleteNote(n.id, e)}
                    className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-[#0F1115]/50 rounded-lg transition-all md:opacity-0 md:group-hover:opacity-100 opacity-70"
                    title="Eliminar cuaderno"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Gemini AI Math Coprocessor Portal */}
          <div className={`border rounded-2xl p-5 shadow-xl space-y-4 relative overflow-hidden ${boardTheme === 'white' ? 'bg-white border-[#E5E7EB]' : 'bg-gradient-to-br from-[#161920] to-[#1E2530] border-[#2D3139]'}`}>
            <div className="absolute -top-10 -right-10 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl" />
            <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-pink-500/10 rounded-full blur-2xl" />

            <div className="flex items-center space-x-2">
              <Wand2 className="text-[#3B82F6] animate-spin-slow" size={20} />
              <div>
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#3B82F6] font-display">Asistente Matemático IA</h3>
                <p className="text-[9px] font-mono tracking-wider text-slate-500 uppercase">Análisis analógico de pizarra</p>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Escribe ecuaciones, dibuja trazados o figuras geométricas de matemáticas con tu Wacom y presiona este botón. Gemini convertirá tus trazos analógicos en formulas LaTeX limpias e interactivos gráficos de análisis.
            </p>

            {/* Custom guidance prompt */}
            <div className="space-y-1">
              <label className="text-[10px] text-[#3B82F6] font-bold uppercase tracking-[0.2em] block">Instrucción para el Tutor:</label>
              <input
                type="text"
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="Ej: Explica cómo graficar y resolver"
                className={`w-full border rounded-xl px-2.5 py-1.5 text-xs font-sans focus:outline-none focus:border-[#3B82F6] ${boardTheme === 'white' ? 'bg-[#F3F4F6] border-[#E5E7EB] text-slate-800 placeholder-slate-400' : 'bg-[#0F1115] border-[#2D3139] text-slate-300 placeholder-slate-650'}`}
              />
            </div>

            {/* AI trigger CTA */}
            <button
              id="analyze-button"
              disabled={isAiLoading}
              onClick={analyzeWithGemini}
              className={`w-full py-2.5 rounded-xl font-bold text-xs text-white shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider ${isAiLoading ? 'bg-slate-800 border border-slate-700 cursor-not-allowed' : 'bg-[#3B82F6] hover:bg-blue-600 hover:scale-101 active:scale-98 shadow-blue-500/15'}`}
            >
              {isAiLoading ? (
                <>
                  <RefreshCw className="animate-spin text-white" size={15} /> Evaluando Pizarra...
                </>
              ) : (
                <>
                  <Sparkles size={14} className="text-amber-300 fill-amber-300" /> Analizar boceto con IA
                </>
              )}
            </button>

            {aiError && (
              <div className="p-3 bg-rose-950/40 border border-rose-900 rounded-xl text-[11px] text-rose-300 flex items-start gap-2 max-h-[140px] overflow-y-auto">
                <Info size={14} className="text-rose-400 shrink-0 mt-0.5" />
                <p>{aiError}</p>
              </div>
            )}
          </div>

          {/* Quick tips table */}
          <div className={`border rounded-2xl p-4.5 space-y-3 text-xs ${boardTheme === 'white' ? 'bg-white border-[#E5E7EB]' : 'bg-[#1A1D23] border-[#2D3139]'}`}>
            <h4 className={`font-display font-bold uppercase tracking-wider flex items-center gap-1.5 text-xs ${boardTheme === 'white' ? 'text-[#3B82F6]' : 'text-[#3B82F6]'}`}>
              <Lightbulb size={15} /> Consejos para el Aula Virtual
            </h4>
            <div className="space-y-2 text-[11px] text-slate-400 leading-relaxed">
              <p>📍 <strong>Pistas en Geometría:</strong> Activa el lápiz y traza con naturalidad. Si prefieres diagramas perfectos, selecciona las herramientas Rectángulo o Círculo.</p>
              <p>📍 <strong>Presión de Pluma:</strong> Las tabletas Wacom registran distintos grosores de línea automáticamente según la fuerza que apliques al stylus.</p>
            </div>
          </div>

        </section>

        {/* Right Main workspace boards container */}
        <section className="lg:col-span-9 space-y-6">
          
          {/* Active Note properties header card */}
          <div className={`border rounded-2xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 shadow-md ${boardTheme === 'white' ? 'bg-white border-[#E5E7EB]' : 'bg-[#1A1D23] border-[#2D3139]'}`}>
            <div className="space-y-1.5 flex-1 w-full">
              <div className="flex items-center space-x-2">
                <span className={`text-[9px] uppercase font-black tracking-widest px-2 py-0.5 rounded ${boardTheme === 'white' ? 'bg-slate-100 text-slate-700 border border-slate-200' : 'bg-[#0F1115] text-[#3B82F6] border border-[#2D3139]'}`}>
                  {noteCategory === 'primaria' ? 'Primaria' : noteCategory === 'secundaria' ? 'Secundaria' : noteCategory === 'universidad' ? 'Universidad' : 'General'}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">Doble click sobre figuras para asignar medidas</span>
              </div>
              <input
                type="text"
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
                className={`bg-transparent font-display font-black tracking-tight text-xl focus:outline-none focus:border-b focus:border-[#3B82F6] w-full ${boardTheme === 'white' ? 'text-slate-900' : 'text-white'}`}
                placeholder="Escribe el título de tus apuntes..."
              />
            </div>

            {/* Note category toggle tabs */}
            <div className={`p-1 rounded-xl text-xs font-semibold self-stretch md:self-auto gap-0.5 flex ${boardTheme === 'white' ? 'bg-[#F3F4F6]' : 'bg-[#0F1115]'}`}>
              {(['primaria', 'secundaria', 'universidad', 'general'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setNoteCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg transition capitalize font-bold text-[10px] uppercase tracking-wider ${noteCategory === cat ? (boardTheme === 'white' ? 'bg-white text-slate-900 shadow-sm' : 'bg-[#2D3139] text-white') : 'text-slate-500 hover:text-slate-300'}`}
                >
                  {cat === 'primaria' ? 'Primaria' : cat === 'secundaria' ? 'Secundaria' : cat === 'universidad' ? 'Universidad' : 'Otro'}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Bento Board Row: Drawing Canvas (Primary) alongside LaTeX editor */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            
            {/* Tablet Wacom Board Drawing area */}
            <div className="xl:col-span-8 flex flex-col">
              <MathWacomCanvas
                strokes={strokes}
                onStrokesChange={(s) => setStrokes(s)}
                shapes={shapes}
                onShapesChange={(sh) => setShapes(sh)}
                gridType={gridType}
                onGridTypeChange={(g) => setGridType(g)}
                theme={boardTheme}
              />
            </div>

            {/* Side visual formula builder */}
            <div className="xl:col-span-4 flex flex-col justify-between">
              <LaTeXHelper
                latexValue={latexText}
                onChange={(val) => setLatexText(val)}
                onClear={() => setLatexText('')}
              />
            </div>
          </div>

          {/* Advanced Sandbox modules: Live AI explanation alongside dynamic sliders curves plotter */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Box: AI generated math tutor solver log */}
            <div className={`lg:col-span-6 border rounded-2xl p-5 shadow-xl space-y-4 ${boardTheme === 'white' ? 'bg-white border-[#E5E7EB]' : 'bg-[#1A1D23] border-[#2D3139]'}`}>
              <h4 className={`text-[10px] font-black uppercase tracking-[0.18em] flex items-center gap-2 border-b pb-3 font-display ${boardTheme === 'white' ? 'border-slate-100 text-[#3B82F6]' : 'border-[#2D3139] text-[#3B82F6]'}`}>
                <BookOpen size={16} /> Tutor de Resolución Matemático (Paso a Paso)
              </h4>

              {/* Loader indicator */}
              {isAiLoading ? (
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
                  <RefreshCw className="animate-spin text-[#3B82F6]" size={32} />
                  <div>
                    <h5 className={`font-bold text-sm ${boardTheme === 'white' ? 'text-slate-800' : 'text-slate-200'}`}>El Asistente Gemini está evaluando tus apuntes...</h5>
                    <p className="text-xs text-slate-500 max-w-[280px] mx-auto mt-1 leading-relaxed">Analizando tus trazos analógicos de Wacom, detectando la sintaxis matemática y calculando derivaciones.</p>
                  </div>
                </div>
              ) : (
                <div className={`max-h-[360px] overflow-y-auto pr-1 leading-relaxed text-xs space-y-3 markdown-body ${boardTheme === 'white' ? 'prose text-slate-700' : 'prose prose-invert text-slate-300 font-sans'}`}>
                  <ReactMarkdown>{aiTextExplanation}</ReactMarkdown>
                </div>
              )}
            </div>

            {/* Right Box: Dynamic SVG curve plots with active sliders */}
            <div className="lg:col-span-6 flex flex-col">
              <InteractiveGraph
                suggestedEquation={aiGraphInfo?.ecuacionConVariable || "a * x**2 - b"}
                suggestedTitle={aiGraphInfo?.titulo || "Graficador de Funciones"}
                suggestedVariable={aiGraphInfo?.variableAjuste || "a"}
                suggestedMin={aiGraphInfo?.minVal !== undefined ? aiGraphInfo?.minVal : -10}
                suggestedMax={aiGraphInfo?.maxVal !== undefined ? aiGraphInfo?.maxVal : 10}
                suggestedDefault={aiGraphInfo?.defaultVal !== undefined ? aiGraphInfo?.defaultVal : 1}
              />
            </div>
          </div>

          {/* Evaluation Classroom Quizzes Section for Exam Authoring and Assessment */}
          <section className="mt-2">
            <TeacherCorner
              quizItems={quizItems}
              onQuizItemsChange={(q) => setQuizItems(q)}
            />
          </section>

        </section>
      </main>

      {/* Humble Footer containing licensing and literal labels */}
      <footer className={`mt-12 py-5 text-xs text-center border-t ${boardTheme === 'white' ? 'bg-white text-slate-400 border-[#E5E7EB]' : 'bg-[#1A1D23] text-[#4B5563] border-[#2D3139]'}`}>
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="font-mono text-[10px] uppercase tracking-widest">Apuntes de Matemáticas MathFlow • Wacom Pro Edition</p>
          <div className="flex items-center gap-3 text-slate-550 text-[10px] font-mono">
            <span>CPU: 12% | RAM: 1.2GB</span>
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          </div>
        </div>
      </footer>

      {/* Custom Toast Notifications */}
      {notification && (
        <div className="fixed bottom-5 right-5 z-[100] max-w-sm w-full bg-[#1F2937] text-white border border-[#374151] rounded-xl p-4 shadow-2xl flex items-center gap-3 animate-fade-in">
          <div className={`p-1.5 rounded-lg ${notification.type === 'success' ? 'bg-emerald-500/15 text-emerald-400' : notification.type === 'error' ? 'bg-rose-500/15 text-rose-400' : 'bg-[#3B82F6]/15 text-[#3B82F6]'}`}>
            <Info size={18} />
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold">{notification.message}</p>
          </div>
          <button 
            onClick={() => setNotification(null)}
            className="text-slate-400 hover:text-white transition-colors text-xs font-bold px-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Custom Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 flex items-center justify-center bg-slate-950/85 backdrop-blur-sm z-[100] p-4 animate-fade-in">
          <div className="bg-[#1A1D23] border border-[#2D3139] rounded-2xl p-6 shadow-2xl max-w-md w-full text-center space-y-4">
            <div className="mx-auto w-12 h-12 bg-rose-500/10 rounded-full flex items-center justify-center text-rose-400 mb-2">
              <Trash2 size={24} />
            </div>
            <div className="space-y-1.5">
              <h4 className="text-base font-bold text-white uppercase tracking-wide font-display">¿Eliminar este cuaderno de apuntes?</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Esta acción es irreversible y se perderán todos los trazos de Wacom, formas y reactivos diseñados en esta libreta.
              </p>
            </div>
            <div className="flex justify-center gap-3 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 bg-[#0F1115] text-slate-300 hover:text-white border border-[#2D3139] rounded-xl text-xs font-semibold transition"
              >
                No, cancelar
              </button>
              <button
                onClick={handleConfirmDeleteNote}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold font-sans uppercase tracking-wider transition shadow shadow-rose-950"
              >
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
