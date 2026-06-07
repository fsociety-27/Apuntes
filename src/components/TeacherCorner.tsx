import React, { useState } from 'react';
import { 
  GraduationCap, ClipboardList, Plus, Trash2, 
  CheckCircle, HelpCircle, FileDown, BookOpen, AlertCircle
} from 'lucide-react';
import { QuizItem } from '../types';

interface TeacherCornerProps {
  quizItems: QuizItem[];
  onQuizItemsChange: (items: QuizItem[]) => void;
}

export default function TeacherCorner({
  quizItems,
  onQuizItemsChange
}: TeacherCornerProps) {
  const [activeMode, setActiveMode] = useState<'editor' | 'simulador'>('editor');
  
  // Quiz evaluation states
  const [examSubmitted, setExamSubmitted] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);

  // Authoring states
  const [question, setQuestion] = useState('');
  const [opt0, setOpt0] = useState('');
  const [opt1, setOpt1] = useState('');
  const [opt2, setOpt2] = useState('');
  const [opt3, setOpt3] = useState('');
  const [correctIdx, setCorrectIdx] = useState<number>(0);
  const [expl, setExpl] = useState('');

  // Course syllabus presets
  const EXAM_PRESETS = [
    {
      name: "Trigonometría Básica (Secundaria)",
      questions: [
        {
          id: "trig-1",
          question: "¿Cuál es el valor del seno de 90 grados (sin(90°))?",
          options: ["0", "0.5", "1", "Inconmensurable"],
          correctIndex: 2,
          explanation: "En la circunferencia trigonométrica, el seno representa la ordenada del punto. A los 90° el punto está en (0,1), por tanto el valor es 1."
        },
        {
          id: "trig-2",
          question: "Si el cateto opuesto de un triángulo mide 3cm y el adyacente 4cm, ¿cuál es la longitud de la hipotenusa según Pitágoras?",
          options: ["5cm", "6cm", "7cm", "25cm"],
          correctIndex: 0,
          explanation: "Por teorema de Pitágoras: a^2 + b^2 = c^2. Aquí: 3^2 + 4^2 = 9 + 16 = 25. La raíz cuadrada de 25 mide exactamente 5cm."
        }
      ]
    },
    {
      name: "Cálculo y Derivadas (Universidad)",
      questions: [
        {
          id: "calc-1",
          question: "¿Cuál es la derivada de f(x) = ln(x) con respecto a x?",
          options: ["e^x", "1/x", "x * ln(x)", "1"],
          correctIndex: 1,
          explanation: " f'(x) para f(x)=ln(x) es la clásica tasa recíproca, 1/x, definida para x > 0."
        },
        {
          id: "calc-2",
          question: "Encuentra el límite cuando x tiende a 0 de f(x) = sin(x) / x.",
          options: ["0", "Infinto", "No existe", "1"],
          correctIndex: 3,
          explanation: "El límite notable lim(x->0) sin(x)/x es igual a 1, demostrable por teorema del sándwich o la regla de L'Hôpital."
        }
      ]
    },
    {
      name: "Ecuaciones y Fracciones (Primaria)",
      questions: [
        {
          id: "elem-1",
          question: "Resuelve para x la siguiente igualdad lineal simple: 2x - 4 = 10.",
          options: ["x = 5", "x = 7", "x = 3", "x = 14"],
          correctIndex: 1,
          explanation: "Despejamos sumando 4 a ambos lados: 2x = 14. Luego dividimos por 2: x = 7."
        },
        {
          id: "elem-2",
          question: "¿A cuántas unidades equivale la fracción tres cuartos (3/4) expresada en decimal?",
          options: "0.25,0.50,0.75,0.34".split(','),
          correctIndex: 2,
          explanation: "La división exacta de 3 entre 4 nos proporciona 0.75 unidades."
        }
      ]
    }
  ];

  // Grade exam and count score
  const handleGradeExam = () => {
    let correctCount = 0;
    quizItems.forEach((q) => {
      if (q.selectedAnswerIndex === q.correctIndex) {
        correctCount++;
      }
    });

    const calculated = quizItems.length > 0 ? Math.round((correctCount / quizItems.length) * 100) : 0;
    setScore(calculated);
    setExamSubmitted(true);
  };

  // Set student answer choice
  const selectStudentAnswer = (questionId: string, answerIndex: number) => {
    onQuizItemsChange(
      quizItems.map(q => q.id === questionId ? { ...q, selectedAnswerIndex: answerIndex } : q)
    );
  };

  // Load a quick syllabus curriculum preset
  const loadPresetExam = (idx: number) => {
    const selected = EXAM_PRESETS[idx];
    onQuizItemsChange(
      selected.questions.map(q => ({
        ...q,
        selectedAnswerIndex: null
      }))
    );
    setExamSubmitted(false);
  };

  // Add individual author custom question
  const submitNewQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question || !opt0 || !opt1) {
      alert("Por favor rellena al menos la pregunta y las primeras dos opciones.");
      return;
    }

    const newItem: QuizItem = {
      id: Math.random().toString(36).substr(2, 9),
      question,
      options: [opt0, opt1, opt2 || 'Opción vacía', opt3 || 'Opción vacía'].filter(Boolean),
      correctIndex: correctIdx,
      selectedAnswerIndex: null,
      explanation: expl || "Explicación de refuerzo no detallada."
    };

    onQuizItemsChange([...quizItems, newItem]);
    
    // Clear author inputs
    setQuestion('');
    setOpt0('');
    setOpt1('');
    setOpt2('');
    setOpt3('');
    setExpl('');
    setCorrectIdx(0);
  };

  // Delete individual question
  const deleteQuestion = (id: string) => {
    onQuizItemsChange(quizItems.filter(q => q.id !== id));
  };

  return (
    <div className="bg-[#1A1D23] border border-[#2D3139] rounded-2xl p-5 shadow-xl space-y-4">
      {/* Header and Mode selection tab */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-[#2D3139] pb-3 gap-2">
        <div className="flex items-center space-x-2">
          <GraduationCap className="text-[#3B82F6]" size={20} />
          <div>
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white font-display">Creador de Exámenes e Interacción</h4>
            <p className="text-[10px] text-slate-500 font-mono">Diseña quizzes interactivos para tus clases de matemáticas.</p>
          </div>
        </div>
        
        {/* Toggle Mode */}
        <div className="flex bg-[#0F1115] p-1 rounded-xl text-[10px] uppercase font-bold tracking-wider gap-0.5">
          <button
            onClick={() => setActiveMode('editor')}
            className={`px-3 py-1.5 rounded-lg transition ${activeMode === 'editor' ? 'bg-[#3B82F6] text-white' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Modo Profesor (Diseñador)
          </button>
          <button
            onClick={() => setActiveMode('simulador')}
            className={`px-3 py-1.5 rounded-lg transition ${activeMode === 'simulador' ? 'bg-[#3B82F6] text-white' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Modo Estudiante (Simulación)
          </button>
        </div>
      </div>

      {/* Mode panels */}

      {activeMode === 'editor' ? (
        <div className="space-y-4 font-sans">
          {/* Quick preset loader */}
          <div className="bg-[#0F1115]/40 p-3 rounded-xl border border-[#2D3139] space-y-2">
            <label className="text-[10px] text-[#3B82F6] font-bold uppercase tracking-[0.16em] block">Cargar Examen Rápido de Prueba (Plantillas):</label>
            <div className="flex flex-wrap gap-2">
              {EXAM_PRESETS.map((p, i) => (
                <button
                  key={p.name}
                  onClick={() => loadPresetExam(i)}
                  className="px-3 py-1.5 bg-[#0F1115] hover:bg-slate-800 text-[9px] text-slate-300 rounded-lg border border-[#2D3139] transition font-bold uppercase tracking-wider"
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          {/* New Question Form */}
          <form onSubmit={submitNewQuestion} className="bg-[#0F1115]/20 p-4 border border-[#2D3139] rounded-xl space-y-3">
            <h5 className="text-xs font-bold text-slate-300 flex items-center gap-1.5 font-display uppercase tracking-wider">
              <Plus size={14} className="text-[#3B82F6]" /> Redactar Pregunta Matemática
            </h5>
            
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 font-mono italic">Pregunta (Soporta variables y LaTeX en texto)</label>
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ej: ¿Cuál es el límite notable cuando x tiende a 0 de sen(x)/x?"
                className="w-full bg-[#0F1115] border border-[#2D3139] rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-[#3B82F6]"
              />
            </div>

            {/* Alternativas */}
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={opt0}
                onChange={(e) => setOpt0(e.target.value)}
                placeholder="Alternativa A (Requerido)"
                className="bg-[#0F1115] border border-[#2D3139] rounded-lg px-2 py-1 text-xs text-slate-300 focus:outline-none focus:border-[#3B82F6]"
              />
              <input
                type="text"
                value={opt1}
                onChange={(e) => setOpt1(e.target.value)}
                placeholder="Alternativa B (Requerido)"
                className="bg-[#0F1115] border border-[#2D3139] rounded-lg px-2 py-1 text-xs text-slate-300 focus:outline-none focus:border-[#3B82F6]"
              />
              <input
                type="text"
                value={opt2}
                onChange={(e) => setOpt2(e.target.value)}
                placeholder="Alternativa C (Opcional)"
                className="bg-[#0F1115] border border-[#2D3139] rounded-lg px-2 py-1 text-xs text-slate-400 focus:outline-none focus:border-[#3B82F6]"
              />
              <input
                type="text"
                value={opt3}
                onChange={(e) => setOpt3(e.target.value)}
                placeholder="Alternativa D (Opcional)"
                className="bg-[#0F1115] border border-[#2D3139] rounded-lg px-2 py-1 text-xs text-slate-400 focus:outline-none focus:border-[#3B82F6]"
              />
            </div>

            {/* Selector de Correcta y Retroalimentación */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="flex items-center space-x-2">
                <span className="text-[10px] text-slate-500 font-mono font-bold uppercase">Alternativa correcta:</span>
                <select
                  value={correctIdx}
                  onChange={(e) => setCorrectIdx(parseInt(e.target.value))}
                  className="bg-[#0F1115] text-xs text-slate-300 border border-[#2D3139] rounded-lg py-1 px-2 focus:outline-none"
                >
                  <option value={0}>Alternativa A</option>
                  <option value={1}>Alternativa B</option>
                  <option value={2}>Alternativa C</option>
                  <option value={3}>Alternativa D</option>
                </select>
              </div>

              <input
                type="text"
                value={expl}
                onChange={(e) => setExpl(e.target.value)}
                placeholder="Explicación o resolución didáctica paso a paso"
                className="bg-[#0F1115] border border-[#2D3139] rounded-lg px-2.5 py-1 text-xs text-slate-300 focus:outline-none focus:border-[#3B82F6]"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-[#3B82F6] hover:bg-blue-600 text-white font-bold text-xs py-2.5 rounded-lg transition shadow uppercase tracking-wider"
            >
              Añadir al Examen Activo
            </button>
          </form>

          {/* List of currently authored questions */}
          <div className="space-y-2">
            <h5 className="font-bold text-[10px] uppercase tracking-wider text-slate-400 flex items-center justify-between font-display">
              <span>Banco de Reactivos Activo ({quizItems.length})</span>
              {quizItems.length > 0 && (
                <button 
                  onClick={() => onQuizItemsChange([])}
                  className="text-[10px] text-rose-400 font-bold hover:underline uppercase tracking-widest"
                >
                  Borrar Todo
                </button>
              )}
            </h5>
            
            {quizItems.length === 0 ? (
              <div className="text-center p-6 bg-[#0F1115]/20 border border-dashed border-[#2D3139] rounded-xl text-xs text-slate-500">
                Aún no hay reactivos. Diseña preguntas arriba o carga una plantilla escolar de prueba para experimentar.
              </div>
            ) : (
              <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                {quizItems.map((q, idx) => (
                  <div key={q.id} className="bg-[#0F1115]/60 p-2.5 border border-[#2D3139] rounded-xl flex items-center justify-between text-xs gap-3">
                    <div className="truncate flex-1">
                      <span className="font-bold text-[#3B82F6] mr-2 font-mono">{idx+1}.</span>
                      <span className="text-slate-200">{q.question}</span>
                      <div className="text-[10px] text-slate-500 mt-1">
                        Sugerencias de respuestas: {q.options.join(' | ')}
                      </div>
                    </div>
                    <button
                      onClick={() => deleteQuestion(q.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-450 rounded-lg hover:bg-slate-900 transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Simulador - Estudiante Mode */
        <div className="space-y-4">
          {quizItems.length === 0 ? (
            <div className="text-center p-10 bg-[#0F1115]/25 border border-dashed border-[#2D3139] rounded-xl text-xs text-slate-500 space-y-1">
              <AlertCircle className="mx-auto text-[#3B82F6]/80 mb-2" size={24} />
              <p>No hay preguntas redactadas para el examen en este momento.</p>
              <p className="text-[10px] font-mono">Cambia al Modo Diseñador para redactar o cargar plantillas didácticas de prueba.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Score indicators if submitted */}
              {examSubmitted && (
                <div className={`p-4 rounded-xl border flex items-center justify-between gap-3 ${score >= 70 ? 'bg-emerald-950/40 border-emerald-800 text-emerald-250' : 'bg-amber-950/30 border-amber-800 text-amber-250'}`}>
                  <div>
                    <h5 className="font-bold text-sm">Examen Calificado Exitosamente</h5>
                    <p className="text-xs opacity-85">Has completado esta evaluación interactiva de matemáticas.</p>
                  </div>
                  <div className="text-center bg-[#0F1115] px-4 py-2 border border-[#2D3139] rounded-xl">
                    <span className="text-[9px] block opacity-50 uppercase tracking-widest font-mono font-bold">Nota</span>
                    <span className="text-2xl font-black font-mono tracking-tighter">{score}%</span>
                  </div>
                </div>
              )}

              {/* Loop list of active test papers */}
              <div className="space-y-4.5 max-h-[380px] overflow-y-auto pr-1">
                {quizItems.map((q, idx) => {
                  const hasAnswered = q.selectedAnswerIndex !== null;
                  
                  return (
                    <div key={q.id} className="p-4 bg-[#0F1115]/45 border border-[#2D3139] rounded-xl space-y-2">
                      <div className="flex items-start gap-2">
                        <span className="bg-[#0F1115] border border-[#2D3139] text-xs px-2 py-0.5 rounded-md font-bold text-[#3B82F6] font-mono mt-0.5">{idx+1}</span>
                        <h5 className="text-xs font-semibold text-slate-200 leading-relaxed">{q.question}</h5>
                      </div>

                      {/* Options stack list */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-7">
                        {q.options.map((opt, oIdx) => {
                          const isSelected = q.selectedAnswerIndex === oIdx;
                          const isCorrect = q.correctIndex === oIdx;
                          
                          let optStyle = "bg-[#0F1115] text-[#9CA3AF] border-[#2D3139] hover:bg-slate-800/50 hover:text-white";
                          if (isSelected) optStyle = "bg-blue-950/40 border-[#3B82F6] text-blue-200 font-bold";
                          
                          if (examSubmitted) {
                            if (isCorrect) optStyle = "bg-emerald-950/40 border-emerald-600 text-emerald-300 font-bold";
                            else if (isSelected && !isCorrect) optStyle = "bg-rose-950/40 border-rose-850 text-rose-350";
                          }

                          return (
                            <button
                              key={oIdx}
                              disabled={examSubmitted}
                              onClick={() => selectStudentAnswer(q.id, oIdx)}
                              className={`w-full text-left px-3 py-2 text-xs border rounded-lg transition-all ${optStyle}`}
                            >
                              <span className="font-bold mr-2 uppercase text-[10px] text-slate-500">[{('abcd')[oIdx]}]:</span>
                              {opt}
                            </button>
                          );
                        })}
                      </div>

                      {/* Display reinforcement step resolution explanation */}
                      {examSubmitted && q.explanation && (
                        <div className="mt-2.5 ml-7 bg-[#0F1115] border-l-2 border-[#3B82F6] p-2.5 rounded-r-lg text-[11px] text-slate-400 space-y-1 italic">
                          <span className="font-sans font-bold text-[10px] uppercase text-[#3B82F6] not-italic block">Resolución didáctica:</span>
                          <p className="leading-relaxed">{q.explanation}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* grading CTA buttons */}
              <div className="flex justify-between items-center pt-2 border-t border-[#2D3139]">
                <button
                  onClick={() => {
                    setExamSubmitted(false);
                    // Reset selected Answers
                    onQuizItemsChange(quizItems.map(q => ({ ...q, selectedAnswerIndex: null })));
                  }}
                  className="px-4 py-2 bg-[#0F1115] hover:bg-slate-800 text-xs text-slate-300 border border-[#2D3139] rounded-lg transition uppercase font-bold tracking-wider"
                >
                  Volver a Empezar
                </button>

                {!examSubmitted ? (
                  <button
                    onClick={handleGradeExam}
                    className="px-5 py-2.5 bg-[#3B82F6] hover:bg-blue-600 text-white font-bold text-xs rounded-xl transition shadow uppercase tracking-wider"
                  >
                    Entregar y Calificar Examen
                  </button>
                ) : (
                  <span className="text-xs font-mono text-slate-400 flex items-center gap-1.5 uppercase font-bold tracking-wider">
                    <CheckCircle className="text-emerald-500" size={14} /> Evaluado correctamente
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
