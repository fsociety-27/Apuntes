/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ShapeType = 'freehand' | 'line' | 'rect' | 'circle' | 'triangle' | 'axis';

export interface Point {
  x: number;
  y: number;
  pressure?: number;
}

export interface Stroke {
  id: string;
  points: Point[];
  color: string;
  thickness: number;
  type: 'freehand';
}

export interface GeometricShape {
  id: string;
  type: Exclude<ShapeType, 'freehand'>;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  color: string;
  thickness: number;
  label?: string;
}

export interface SavedNote {
  id: string;
  title: string;
  category: 'primaria' | 'secundaria' | 'universidad' | 'examen' | 'general';
  createdAt: string;
  canvasImage?: string; // Cache screenshot of drawing
  strokes: Stroke[];
  shapes: GeometricShape[];
  latexContent: string;
  gridType: 'grid' | 'dots' | 'millimeter' | 'isometric' | 'none';
  gridColor: string;
  quizItems?: QuizItem[];
}

export interface QuizItem {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  selectedAnswerIndex?: number | null;
  explanation?: string;
}

export interface GraphParams {
  expression: string; // e.g. "Math.sin(a * x) + b"
  title: string;
  variableName: string; // e.g. "a"
  variableVal: number;
  minVal: number;
  maxVal: number;
  stepVal: number;
  constantB?: number; // secondary helper, like b
}

export interface AIAnalysisResult {
  latex: string;
  titulo: string;
  explicacion: string;
  graficaSugerida?: {
    ecuacion: string;
    titulo: string;
    variableAjuste: string;
    ecuacionConVariable: string;
    minVal: number;
    maxVal: number;
    defaultVal: number;
  };
}
