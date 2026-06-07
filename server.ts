import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

// Initialize express app
const app = express();
const PORT = 3000;

// Set up JSON body sizes to handle high-resolution canvas drawings
app.use(express.json({ limit: "15mb" }));

// Lazy initializer for Gemini client to prevent startup crashes if API key is missing
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is not defined in Secrets.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// REST API endpoint for analyzing math sketch / notes
app.post("/api/gemini/analyze", async (req, res) => {
  try {
    const { image, prompt } = req.body;
    if (!image) {
      res.status(400).json({ error: "No image provided" });
      return;
    }

    // Capture base64 block
    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");

    // Prepare content parts
    const imagePart = {
      inlineData: {
        mimeType: "image/png",
        data: base64Data,
      },
    };

    const systemInstruction = `Eres un tutor de matemáticas y asistente de digitalización experto. Se te proporciona un boceto, gráfica, diagrama geométrico o fórmula matemática escrita a mano por un estudiante o profesor sobre un lienzo interactivo de pizarra.
Analiza la imagen cuidadosamente y responde con un JSON con la estructura exacta especificada. Es muy importante que generes código LaTeX perfecto para renderizar en KaTeX o MathJax.
Tu respuesta debe ser un objeto JSON con los siguientes campos:
1. "latex": Código LaTeX limpio para digitalizar las fórmulas o ecuaciones que identificaste en el plano/pizarra (ejemplo: "\\\\int_{0}^{5} x^2 \\\\, dx"). No incluyas delimitadores como $$ o \\[ \\] aquí, solo el código interno.
2. "titulo": Un título corto que describa la materia o problema identificado (ejemplo: "Integrales Definidas", "Suma de Fracciones", "Teorema de Pitágoras", "Función Senoidal").
3. "explicacion": Explicación matemática detallada y didáctica del problema o concepto, resuelto paso a paso en formato Markdown (en español). Agrega explicaciones con subtítulos claros.
4. "graficaSugerida": Un objeto con la ecuación matemática simple sugerida (en formato compatible con JavaScript, usando x como variable principal, ej: "x**2 - 2*x" o "Math.sin(x)" o "1/x") para que el estudiante grafique e interactúe.
   Debe contener:
   - "ecuacion": Ecuación en formato string JS (ej: "x**2" o "2*x + 3" o "Math.sin(x)")
   - "titulo": Título explicativo del gráfico
   - "variableAjuste": Nombre de una variable controlable (como 'a', 'b', 'c', 'k', o 'm') para cambiar el comportamiento con un slider (ej: "a") y su valor por defecto.
   - "ecuacionConVariable": Expresión JS usando 'x' y la variable de ajuste (ej: "a * x**2" o "Math.sin(a * x)") para trazar curvas dinámicas.
   - "minVal": Valor mínimo para el slider de la variable.
   - "maxVal": Valor máximo para el slider de la variable.
   - "defaultVal": Valor por defecto.

IMPORTANTE: Responde ÚNICAMENTE con el objeto JSON estructurado válido según el esquema esperado.`;

    const instructions = prompt 
      ? `Indicación adicional del usuario: ${prompt}.\nPor favor analiza el boceto acorde a esta especificación.` 
      : `Analiza este boceto matemático paso a paso y digitalízalo.`;

    const client = getGeminiClient();
    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [imagePart, { text: instructions }],
      config: {
        systemInstruction,
        responseMimeType: "application/json",
      },
    });

    const textOutput = response.text || "{}";
    const data = JSON.parse(textOutput);

    res.json(data);
  } catch (error: any) {
    console.error("Error calling Gemini API:", error);
    res.status(500).json({ 
      error: error.message || "Error al procesar el lienzo con IA de Gemini.",
      rawMessage: error.stack
    });
  }
});

// Serve frontend assets
async function initServer() {
  if (process.env.NODE_ENV !== "production") {
    // Development mode with Vite HM / client compiler injection
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production statics
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*all", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Fallback handler for all unexpected SPA queries
  app.get("*", (req, res, next) => {
    if (process.env.NODE_ENV === "production") {
      res.sendFile(path.join(process.cwd(), "dist", "index.html"));
    } else {
      next();
    }
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

initServer().catch((err) => {
  console.error("Failed to start full-stack server:", err);
});
