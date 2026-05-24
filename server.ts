import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Increase request size limits to handle image uploads for the custom CV preview/analysis
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Setup Gemini SDK with modern structure and Build header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// Defining the Indonesian Structured Career Simulator Schema
const careerSimulatorSchema = {
  type: Type.OBJECT,
  properties: {
    careerTitle: {
      type: Type.STRING,
      description: "Nama judul karier masa depan yang futuristik namun realistis, misal: 'AI-Powered UI/UX Designer', 'Full-Stack Smart Contract Engineer'.",
    },
    careerConcept: {
      type: Type.STRING,
      description: "Deskripsi singkat tentang apa konsep karier ini dan mengapa sangat cocok dengan minat serta bakat mereka.",
    },
    compatibilityRate: {
      type: Type.INTEGER,
      description: "Persentase kecocokan karier berdasarkan CV, skill, dan minat (nilai antara 0 hingga 100).",
    },
    successProbability: {
      type: Type.INTEGER,
      description: "Estimasi probabilitas keberhasilan di masa depan dalam skala persentase (nilai antara 0 hingga 100).",
    },
    summary: {
      type: Type.STRING,
      description: "Ringkasan inspiratif dan realistis. Gunakan bahasa yang memotivasi dan tidak kaku, contoh: 'Jika kamu mengembangkan skill UI/UX dan AI dalam 2 tahun ke depan, peluangmu bekerja di industri teknologi meningkat hingga 78%'.",
    },
    yearsTimeline: {
      type: Type.ARRAY,
      description: "Simulasi alur perjalanan hidup dan perkembangan karier dari Tahun ke-1 sampai Tahun ke-5.",
      items: {
        type: Type.OBJECT,
        properties: {
          year: {
            type: Type.INTEGER,
            description: "Tahun ke- (1, 2, 3, 4, atau 5)",
          },
          title: {
            type: Type.STRING,
            description: "Judul milestone tahun ini (misal: 'Menguasai Tools Dasar & Portofolio Awal', 'Magang di Tech Startup').",
          },
          description: {
            type: Type.STRING,
            description: "Penjelasan detail apa yang dikerjakan, rintangan yang dihadapi, skill baru yang didapat, atau situasi profesional.",
          },
          status: {
            type: Type.STRING,
            description: "Status peran (misal: 'Pelajar', 'Mulai Kuliah', 'Magang', 'Junior Frontend Developer', 'Co-Founder Startup').",
          },
        },
        required: ["year", "title", "description", "status"],
      },
    },
    requiredSkills: {
      type: Type.ARRAY,
      description: "Rekomendasi skill baru atau penajaman skill yang sangat penting dipelajari untuk mencapai karier ini.",
      items: {
        type: Type.OBJECT,
        properties: {
          name: {
            type: Type.STRING,
            description: "Nama skill, misal: 'Figma Auto-Layout & Design Tokens' atau 'Prompt Engineering'.",
          },
          importance: {
            type: Type.INTEGER,
            description: "Tingkat kepentingan skill dari 1 (rendah) sampai 5 (sangat penting).",
          },
          difficulty: {
            type: Type.STRING,
            description: "Tingkat kesulitan mempelajari skill: 'Mudah', 'Sedang', atau 'Sulit'.",
          },
          source: {
            type: Type.STRING,
            description: "Saran sumber belajar atau platform (misal: 'YouTube Tutorials & Figma Community', 'Coursera', 'Dokumentasi resmi React').",
          },
        },
        required: ["name", "importance", "difficulty", "source"],
      },
    },
    roadmap: {
      type: Type.ARRAY,
      description: "Rencana peta jalan langkah demi langkah yang dibagi menjadi 3 fase utama.",
      items: {
        type: Type.OBJECT,
        properties: {
          phase: {
            type: Type.STRING,
            description: "Fase (misal: 'Fase 1: Eksplorasi Fondasi', 'Fase 2: Portofolio & Proyek Nyata').",
          },
          duration: {
            type: Type.STRING,
            description: "Durasi fase ini (misal: 'Bulan 1-6', 'Tahun ke-2').",
          },
          milestones: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Daftar target pencapaian spesifik dalam fase ini (maksimal 3 item).",
          },
        },
        required: ["phase", "duration", "milestones"],
      },
    },
    lifeSimulation: {
      type: Type.STRING,
      description: "Penjelasan naratif, imersif, dan menarik tentang bagaimana kehidupan sehari-hari mereka dalam 5 tahun mendatang. Ceritakan tentang suasana pagi hari, proyek yang dikerjakan, suasana tempat bekerja secara santai tapi profesional.",
    },
    actionableNextSteps: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "3 langkah konkret, taktis, dan mendesak yang bisa langsung mereka lakukan HARI INI.",
    },
  },
  required: [
    "careerTitle",
    "careerConcept",
    "compatibilityRate",
    "successProbability",
    "summary",
    "yearsTimeline",
    "requiredSkills",
    "roadmap",
    "lifeSimulation",
    "actionableNextSteps"
  ],
};

// API endpoint for futuristic career simulation
app.post("/api/simulate", async (req, res) => {
  try {
    const { 
      jenjang, 
      skills, 
      minat, 
      cvImgBase64, 
      cvImgMime, 
      portfolioFileName 
    } = req.body;

    if (!jenjang) {
      return res.status(400).json({ error: "Jenjang pendidikan wajib dipilih!" });
    }
    if (!skills || !Array.isArray(skills) || skills.length === 0) {
      return res.status(400).json({ error: "Skill minimal harus diisi satu!" });
    }
    if (!minat || !Array.isArray(minat) || minat.length === 0) {
      return res.status(400).json({ error: "Minat minimal harus diisi satu!" });
    }

    // Construct prompt
    const promptText = `
Kamu adalah "AI Career Future Simulator" bernama Ghost CV, sebuah mentor masa depan AI yang inspiratif, futuristik, cerdas, dan memotivasi namun tetap realistis (tidak terlalu formal, bahasa santai, imersif, dan bersahabat untuk murid SMP, SMA, dan Mahasiswa).

Menganalisis masa depan pengguna dengan parameter berikut:
- Jenjang Pendidikan Saat Ini: ${jenjang}
- Skill Utama yang Dimiliki: ${skills.join(", ")}
- Bidang Minat Utama yang Disukai: ${minat.join(", ")}
${portfolioFileName ? `- Portofolio Terunggah: "${portfolioFileName}"` : ""}
${cvImgBase64 ? "- File CV Terunggah (opsional, dilampirkan sebagai data visual image)" : ""}

Tolong proyeksikan karier masa depan yang luar biasa, relevan, menarik, dan sesuai dengan tren karier digital global 5 tahun ke depan (2026-2031). 

PENTING: Seluruh tulisan, deskripsi, roadmap, dan timeline harus ditulis lengkap dalam Bahasa Indonesia yang segar dan modern. Pastikan menggunakan format responseSchema JSON yang kami sediakan untuk dipetakan ke dashboard visual futuristik dengan chart, timeline, dan progress bar.
`;

    const contents: any[] = [];

    // If a CV image base64 was sent, attach it as part
    if (cvImgBase64 && cvImgMime) {
      // Remove data representation prefix if present
      const cleanBase64 = cvImgBase64.replace(/^data:image\/\w+;base64,/, "");
      contents.push({
        inlineData: {
          mimeType: cvImgMime,
          data: cleanBase64
        }
      });
    }

    contents.push({ text: promptText });

    // Call Gemini API using 'gemini-3.5-flash' for basic text/json structuring
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contents,
      config: {
        systemInstruction: "Kamu adalah Ghost CV Simulator. Kamu adalah sistem kecerdasan buatan super canggih yang memproyeksikan masa depan karier seseorang (SMP, SMA, Kuliah) secara imersif, dengan bumbu masa depan cyberpunk yang bersih, optimis, dan terencana rapi.",
        responseMimeType: "application/json",
        responseSchema: careerSimulatorSchema,
        temperature: 1.0,
      }
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("AI returned empty result");
    }

    const simulationData = JSON.parse(resultText);
    res.json(simulationData);

  } catch (error: any) {
    console.error("Simulation error:", error);
    res.status(500).json({ 
      error: "Simulator gagal memproses data.",
      details: error.message || "Unknown error inside Gemini engine"
    });
  }
});

// Vite Middleware & Static Files serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Ghost CV server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
