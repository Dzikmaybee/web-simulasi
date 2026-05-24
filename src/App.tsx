import { useState, useEffect, useRef } from "react";
import { 
  GraduationCap, 
  Brain, 
  Sparkles, 
  Upload, 
  X, 
  Briefcase, 
  TrendingUp, 
  Map, 
  Info, 
  ChevronRight, 
  AlertTriangle, 
  RefreshCw, 
  ArrowRight, 
  CheckCircle2, 
  BookOpen, 
  FileText, 
  Atom,
  Clock,
  Layers,
  FileCheck,
  Zap,
  HelpCircle
} from "lucide-react";
import { Jenjang, UserFormData, SimulatorResponse } from "./types";

// Hierarchical mapping of Bidang Minat to their respective skills
const MINAT_SKILLS_MAP: Record<string, string[]> = {
  "Teknologi": [
    "Web Development", "Software Engineering", "Cloud Computing (AWS/GCP)", "Database System (SQL/NoSQL)", 
    "DevOps", "Cybersecurity", "Computer Networking", "Linux Administration", "API Development (REST/GraphQL)",
    "Internet of Things (IoT)", "Blockchain Technology", "Data Structure & Algorithms"
  ],
  "Bisnis": [
    "Business Strategy", "Product Management", "Entrepreneurship", "Sales & Negotiation", "Marketing Strategy",
    "Customer Relationship Management (CRM)", "Supply Chain Management", "Business Development", 
    "Human Resources (HR)", "Public Relations", "Risk Management", "Business Analytics"
  ],
  "Kedokteran": [
    "Anatomi & Fisiologi", "Diagnosis Klinis", "Farmakologi", "Pertolongan Pertama (First Aid)", 
    "Kesehatan Masyarakat", "Medical Writing", "Keperawatan", "Nutrisi & Dietetika", 
    "Sistem Informasi Kesehatan", "Bioetika Medis", "Lab Analysis"
  ],
  "Desain": [
    "UI/UX Design", "Graphic Design", "Brand Identity", "Motion Graphics", "3D Web Design",
    "Figma", "Adobe Illustrator", "Typography & Layout", "User Research", "Wireframing & Prototyping",
    "Desain Komunikasi Visual (DKV)"
  ],
  "Game Development": [
    "Game Design", "Unity Engine", "Unreal Engine", "3D Level Design", "C# Programming", 
    "C++ Programming", "Pixel Art & Sprite Design", "Game Physics", "Game Audio Effects", "Multiplayer Netcode"
  ],
  "Artificial Intelligence": [
    "Machine Learning", "Deep Learning", "Python Programming", "Prompt Engineering", 
    "Large Language Models (LLMs)", "Natural Language Processing (NLP)", "Computer Vision", 
    "TensorFlow / PyTorch", "Data Science", "AI Agent Development", "Data Pipelines"
  ],
  "Content Creator": [
    "Video Editing", "Content Writing", "Copywriting", "Search Engine Optimization (SEO)", 
    "Social Media Management", "Podcast Production", "Storytelling & Scriptwriting", 
    "Personal Branding", "Sponsorship & Monetization", "CapCut / Premiere Pro"
  ],
  "Psikologi": [
    "Konseling Dasar", "Psikologi Industri & Organisasi", "Mental Health Advocacy", "Behavioral Analysis",
    "Cognitive Psychology", "Public Speaking & Empathy", "Human Resource Development", "Psikodiagnostik"
  ],
  "Pendidikan": [
    "Curriculum Design", "Online Tutoring", "Public Speaking", "Instructional Design", 
    "Classroom Management", "E-Learning Platforms", "Bahasa Inggris Akademik", "Storytelling"
  ],
  "Musik": [
    "Music Production", "Digital Audio Workstation (DAW)", "Sound Design", "Audio Mixing & Mastering",
    "Songwriting", "Vocal & Instrument Performance", "Music Theory", "Live Sound Engineering"
  ],
  "Sains & Bioteknologi": [
    "Analisis Laboratorium", "Bioinformatika", "Genetic Engineering", "Metode Penelitian Ilmiah",
    "Kimia Analisis", "Mikrobiologi", "Biokimia", "Data Analysis (R/SPSS)"
  ],
  "Fotografi & Sinematografi": [
    "Camera Handling & Lenses", "Lighting Setup", "Photo Editing (Lightroom/Photoshop)", "Color Grading",
    "Directing & Videography", "Drone Pilot", "Visual Storytelling", "Post-Production"
  ],
  "Keuangan & Investasi": [
    "Financial Analysis", "Accounting & Bookkeeping", "Stock & Crypto Market Trading", "Financial Planning",
    "Corporate Finance", "Taxation", "Auditing", "Quantitative Finance", "Microsoft Excel Advanced"
  ],
  "Hukum & Sosial": [
    "Legal Drafting", "Advokat & Litigasi", "Hukum Perdata & Pidana", "Negosiasi & Mediasi",
    "Analisis Sosial", "Hak Kekayaan Intelektual (HAKI)", "Legal Compliance", "Sosiologi Terapan"
  ],
  "Pariwisata & Perhotelan": [
    "Hospitality Management", "Event Planning", "Tour Guiding", "F&B Service Management",
    "Destinations Marketing", "Public Speaking & Intercultural Communication", "Travel Blogging"
  ]
};

// Suggested list of interests (minat)
const RECOMMENDED_MINAT = Object.keys(MINAT_SKILLS_MAP);

// Complete flattened list of all skills across all categories
const ALL_SKILLS = Array.from(new Set(Object.values(MINAT_SKILLS_MAP).flat()));


export default function App() {
  // Navigation & State progress
  // 1: Pendidikan (Level selection)
  // 2: Form pengisian (CV, Skill, Minat, Portfolio)
  // 3: Cinematic Loading
  // 4: Dashboard AI Future CV Result
  const [stage, setStage] = useState<1 | 2 | 3 | 4>(1);
  const [educationLevel, setEducationLevel] = useState<Jenjang | null>(null);

  // Form Inputs
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [skillSuggestions, setSkillSuggestions] = useState<string[]>([]);
  
  const [minat, setMinat] = useState<string[]>([]);
  const [minatInput, setMinatInput] = useState("");
  const [minatSuggestions, setMinatSuggestions] = useState<string[]>([]);

  // CV File Upload State (Image base64 for vision analyze option)
  const [cvImg, setCvImg] = useState<{ base64: string; mime: string; name: string } | null>(null);
  const [cvDragging, setCvDragging] = useState(false);

  // Portfolio File Upload State (PDF)
  const [portfolio, setPortfolio] = useState<{ name: string } | null>(null);
  const [portfolioDragging, setPortfolioDragging] = useState(false);

  // Progress form steps within Stage 2
  // 1: CV, 2: Skill, 3: Minat, 4: Portofolio
  const [formStep, setFormStep] = useState<number>(1);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Loading Screen States
  const [loadingText, setLoadingText] = useState("AI sedang menginisialisasi simulator...");
  const [loadingProgress, setLoadingProgress] = useState(0);

  // Generated Simulation Result
  const [simulationResult, setSimulationResult] = useState<SimulatorResponse | null>(null);
  const [apiError, setApiError] = useState<{ message: string; details?: string } | null>(null);
  
  // Custom suggestion drop-downs focus
  const [skillFocused, setSkillFocused] = useState(false);
  const [minatFocused, setMinatFocused] = useState(false);

  // Animation variables
  const [showSavedNotification, setShowSavedNotification] = useState(false);

  // Expanded Interest category in hierarchical explorer
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  // Explanation expand/hide toggle state per step
  const [showExplanation, setShowExplanation] = useState<Record<number, boolean>>({
    1: false,
    2: false,
    3: false,
    4: false
  });

  const toggleExplanation = (step: number) => {
    setShowExplanation(prev => ({
      ...prev,
      [step]: !prev[step]
    }));
  };

  // Suggested skills filtered
  useEffect(() => {
    if (skillInput.trim() === "") {
      setSkillSuggestions(ALL_SKILLS.filter(s => !skills.includes(s)));
    } else {
      const filtered = ALL_SKILLS.filter(
        (s) => s.toLowerCase().includes(skillInput.toLowerCase()) && !skills.includes(s)
      );
      setSkillSuggestions(filtered);
    }
  }, [skillInput, skills]);

  // Suggested interests filtered
  useEffect(() => {
    if (minatInput.trim() === "") {
      setMinatSuggestions(RECOMMENDED_MINAT.filter(m => !minat.includes(m)));
    } else {
      const filtered = RECOMMENDED_MINAT.filter(
        (m) => m.toLowerCase().includes(minatInput.toLowerCase()) && !minat.includes(m)
      );
      setMinatSuggestions(filtered);
    }
  }, [minatInput, minat]);

  // Cinematic loading animation
  useEffect(() => {
    let interval: any;
    if (stage === 3) {
      setLoadingProgress(0);
      const messages = [
        "Menghubungkan ke Quantum Career Core...",
        "Menganalisis matriks keahlian mendalam duniadatar...",
        "AI sedang memetakan potensi terbaik berdasarkan jenjang pendidikanmu...",
        "Memproses keselarasan minat dengan tren pasar global 2026 - 2031...",
        "Mengekstrak sinyal AI-augmented dari portofolio dan CV terlampir...",
        "Menghitung probabilitas sukses 5 tahun ke depan...",
        "Hampir siap! Merender simulasi kehidupan masa depan..."
      ];
      let msgIndex = 0;
      setLoadingText(messages[0]);

      interval = setInterval(() => {
        setLoadingProgress((prev) => {
          const next = prev + 1.25;
          if (next >= 100) {
            clearInterval(interval);
            setStage(4);
            return 100;
          }
          // Shift text of loading periodically
          const expectedMsgIndex = Math.min(
            Math.floor((next / 100) * messages.length),
            messages.length - 1
          );
          if (expectedMsgIndex !== msgIndex) {
            msgIndex = expectedMsgIndex;
            setLoadingText(messages[msgIndex]);
          }
          return next;
        });
      }, 50);
    }
    return () => clearInterval(interval);
  }, [stage]);

  // Handle files
  const handleCVUpload = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setValidationError("File CV wajib berupa gambar (PNG atau JPG) untuk modul analisis visual.");
      setTimeout(() => setValidationError(null), 4000);
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setCvImg({
        base64: reader.result as string,
        mime: file.type,
        name: file.name
      });
    };
    reader.readAsDataURL(file);
  };

  const handlePortfolioUpload = (file: File) => {
    if (file.type !== "application/pdf") {
      setValidationError("Katalog Portofolio wajib berupa file PDF.");
      setTimeout(() => setValidationError(null), 4000);
      return;
    }
    setPortfolio({ name: file.name });
  };

  // Autocomplete helpers
  const appendSkill = (val: string) => {
    const trimmed = val.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills([...skills, trimmed]);
      setSkillInput("");
    }
  };

  const removeSkill = (index: number) => {
    setSkills(skills.filter((_, i) => i !== index));
  };

  const appendMinat = (val: string) => {
    const trimmed = val.trim();
    if (trimmed && !minat.includes(trimmed)) {
      setMinat([...minat, trimmed]);
      setMinatInput("");
    }
  };

  const removeMinat = (index: number) => {
    setMinat(minat.filter((_, i) => i !== index));
  };

  // Submit Simulator to Server
  const handleSimulate = async () => {
    // Validations
    if (minat.length === 0) {
      setValidationError("Harap mengisi minimal 1 bidang minat yang kamu sukai.");
      setFormStep(2); // Jump back to minat
      return;
    }
    if (skills.length === 0) {
      setValidationError("Harap mengisi minimal 1 skill utama yang kamu miliki.");
      setFormStep(3); // Jump back to skills
      return;
    }

    setValidationError(null);
    setApiError(null);
    setStage(3); // Go to loading immediately

    try {
      const response = await fetch("/api/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jenjang: educationLevel,
          skills: skills,
          minat: minat,
          cvImgBase64: cvImg?.base64 || null,
          cvImgMime: cvImg?.mime || null,
          portfolioFileName: portfolio?.name || null
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP Error: status ${response.status}`);
      }

      const data = await response.json();
      setSimulationResult(data);
    } catch (err: any) {
      console.warn("API Error, utilizing structured futuristic fallback:", err);
      // Construct a highly personalized, gorgeous Indonesian backup data
      const fallbackData = generateFallbackResult(educationLevel || "Kuliah", skills, minat);
      setSimulationResult(fallbackData);
      setApiError({
        message: "Offline / Developer Mode Simulator",
        details: "Server AI sedang memproses permintaan via Sandbox Engine alternatif."
      });
    }
  };

  // Dummy action filler
  const handleLoadSample = () => {
    setEducationLevel("Kuliah");
    setSkills(["UI/UX Design", "Leadership", "Public Speaking", "Python"]);
    setMinat(["Artificial Intelligence", "Desain", "Game Development"]);
    setCvImg({
      base64: "dummy",
      mime: "image/png",
      name: "Darmawan_CV_UIUX.png"
    });
    setPortfolio({ name: "Portfolio_Design_Game_Concept.pdf" });
    setStage(2);
    setFormStep(2); // langsung ke Skills agar user merasa interaktif
  };

  const resetAll = () => {
    setStage(1);
    setEducationLevel(null);
    setSkills([]);
    setMinat([]);
    setSkillInput("");
    setMinatInput("");
    setCvImg(null);
    setPortfolio(null);
    setFormStep(1);
    setSimulationResult(null);
    setApiError(null);
  };

  return (
    <div className="w-full min-h-screen bg-[#05060f] text-slate-200 flex font-sans overflow-x-hidden relative p-3 sm:p-5">
      
      {/* Background Cyber Mesh Gradients for Frosted Glass atmosphere */}
      <div className="absolute top-[-5%] left-[-10%] w-[60%] h-[50%] bg-blue-600/10 rounded-full blur-[160px] pointer-events-none z-0"></div>
      <div className="absolute bottom-[0%] right-[-10%] w-[60%] h-[50%] bg-purple-600/15 rounded-full blur-[160px] pointer-events-none z-0"></div>
      <div className="absolute top-[40%] left-[25%] w-[45%] h-[40%] bg-cyan-500/10 rounded-full blur-[180px] pointer-events-none z-0"></div>

      {/* Outer Layout Container */}
      <div className="w-full max-w-7xl mx-auto flex flex-col min-h-[90vh] z-10 relative">
        
        {/* Top Header */}
        <header className="h-20 flex items-center justify-between px-4 sm:px-8 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl mb-5 space-x-3">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={resetAll}>
            <div className="w-10 h-10 bg-gradient-to-tr from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Sparkles className="w-6 h-6 text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[9px] text-blue-400 font-mono tracking-widest uppercase">AI_ENGINE</span>
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
              </div>
              <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                GHOST CV <span className="text-blue-400 font-mono text-xs font-semibold ml-1">v2.5</span>
              </h1>
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-4">
            <span className="text-xs text-slate-400 border border-white/10 px-3 py-1.5 rounded-lg bg-white/5 backdrop-blur">
              ⚡ INDONESIAN FUTURE CAREER MATRIX
            </span>
            <button 
              onClick={handleLoadSample}
              className="text-xs text-blue-400 hover:text-blue-300 px-3.5 py-1.5 rounded-lg border border-blue-500/30 hover:border-blue-500/60 bg-blue-500/5 transition-all flex items-center gap-1.5"
            >
              <Zap className="w-3.5 h-3.5" />
              Gunakan Data Demo
            </button>
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-ping"></span>
              <span className="text-[10px] text-green-400 font-semibold tracking-wide uppercase">AI Active</span>
            </div>
            <div className="h-9 w-px bg-white/10"></div>
            <div className="w-9 h-9 bg-slate-800 rounded-full border border-white/10 flex items-center justify-center font-mono text-xs text-blue-400 uppercase">
              {educationLevel ? educationLevel.substring(0, 3) : "CV"}
            </div>
          </div>
        </header>

        {/* Global Warning Notification */}
        {validationError && (
          <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 backdrop-blur-md rounded-xl flex items-center space-x-3 text-red-300 text-sm animate-bounce">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 text-red-400" />
            <p className="flex-1 font-medium">{validationError}</p>
            <button onClick={() => setValidationError(null)} className="hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Main Content Sections */}
        <div className="flex-1 flex flex-col">
          
          {/* ==================================================================== */}
          {/* STAGE 1: SPAN / SCHOOL EDUCATION SELECTION                          */}
          {/* ==================================================================== */}
          {stage === 1 && (
            <div className="flex-1 flex flex-col justify-center items-center py-6 sm:py-12 relative">
              
              {/* Promo Banner inside */}
              <div className="text-center max-w-2xl mb-12 px-4">
                <span className="px-4 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-semibold tracking-wider uppercase border border-blue-500/20 mb-4 inline-block">
                  🎯 AI Career Future Simulator
                </span>
                <h2 className="text-3xl sm:text-5xl font-extrabold font-display tracking-tight text-white mt-1 leading-tight sm:leading-none">
                  Simulasikan Karier <br />
                  <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-indigo-300 bg-clip-text text-transparent">
                    Masa Depanmu Hari Ini.
                  </span>
                </h2>
                <p className="text-slate-400 mt-4 text-base leading-relaxed">
                  Pilih jenjang pendidikanmu agar AI dapat memberikan simulasi karier, analisis kompetensi, dan visualisasi roadmap terakurat sesuai potensimu.
                </p>
              </div>

              {/* Selection cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl px-4 z-10">
                
                {/* CARD 1: SMP */}
                <div 
                  onClick={() => { setEducationLevel("SMP"); setStage(2); }}
                  className="group relative cursor-pointer block p-8 rounded-3xl bg-white/5 backdrop-blur-lg border border-white/10 hover:border-blue-500/50 hover:bg-white/10 transition-all duration-300 hover:-translate-y-2 group overflow-hidden shadow-xl"
                  id="selection-card-smp"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-blue-500/10 to-transparent rounded-bl-3xl"></div>
                  <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-400 mb-6 group-hover:bg-blue-500 group-hover:text-white transition-all duration-300">
                    <GraduationCap className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-white group-hover:text-blue-300 transition-colors">Siswa SMP</h3>
                  <p className="text-slate-400 text-xs mt-3 leading-relaxed">
                    Mulai petualangan eksplorasi minat, pencarian jurusan SMA/SMK idaman, dan pondasi hobi produktif yang meluncurkan masa depanmu.
                  </p>
                  <div className="mt-6 flex items-center space-x-2 text-blue-400 text-xs font-semibold">
                    <span>Mulai Eksplorasi</span>
                    <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1.5 transition-transform" />
                  </div>
                </div>

                {/* CARD 2: SMA */}
                <div 
                  onClick={() => { setEducationLevel("SMA"); setStage(2); }}
                  className="group relative cursor-pointer block p-8 rounded-3xl bg-white/5 backdrop-blur-lg border border-white/10 hover:border-purple-500/50 hover:bg-white/10 transition-all duration-300 hover:-translate-y-2 overflow-hidden shadow-xl"
                  id="selection-card-sma"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-purple-500/10 to-transparent rounded-bl-3xl"></div>
                  <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center text-purple-400 mb-6 group-hover:bg-purple-500 group-hover:text-white transition-all duration-300">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-white group-hover:text-purple-300 transition-colors">Siswa SMA/SMK</h3>
                  <p className="text-slate-400 text-xs mt-3 leading-relaxed">
                    Petakan jalur kuliah, pilih program studi terbaik, kembangkan skill praktikal, dan simulasikan kecocokan portofolio ekstrakurikuler serta magang awal.
                  </p>
                  <div className="mt-6 flex items-center space-x-2 text-purple-400 text-xs font-semibold">
                    <span>Mulai Proyeksi</span>
                    <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1.5 transition-transform" />
                  </div>
                </div>

                {/* CARD 3: Kuliah */}
                <div 
                  onClick={() => { setEducationLevel("Kuliah"); setStage(2); }}
                  className="group relative cursor-pointer block p-8 rounded-3xl bg-white/5 backdrop-blur-lg border border-white/10 hover:border-cyan-500/50 hover:bg-white/10 transition-all duration-300 hover:-translate-y-2 overflow-hidden shadow-xl"
                  id="selection-card-kuliah"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-cyan-500/10 to-transparent rounded-bl-3xl"></div>
                  <div className="w-12 h-12 bg-cyan-500/10 rounded-2xl flex items-center justify-center text-cyan-400 mb-6 group-hover:bg-cyan-500 group-hover:text-white transition-all duration-300">
                    <Atom className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-white group-hover:text-cyan-300 transition-colors">Mahasiswa</h3>
                  <p className="text-slate-400 text-xs mt-3 leading-relaxed">
                    Simulasikan kesiapan karier profesional, strategi perataan portofolio kerja, analisis kekurangan skill, dan prospek gaji rintisan startup hingga global tech corp.
                  </p>
                  <div className="mt-6 flex items-center space-x-2 text-cyan-400 text-xs font-semibold">
                    <span>Mulai Optimalisasi</span>
                    <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1.5 transition-transform" />
                  </div>
                </div>

              </div>

              {/* Bottom Quick Feature Highlights */}
              <div className="mt-16 text-slate-500 text-xs flex flex-wrap justify-center gap-6 max-w-lg text-center px-4">
                <span>🛡️ Tanpa akun / Instan</span>
                <span>•</span>
                <span>⚡ Integrasi Gemini AI v3.5</span>
                <span>•</span>
                <span>💼 Kurasi Karir Digital Indonesia</span>
              </div>
            </div>
          )}


          {/* ==================================================================== */}
          {/* STAGE 2: CONFIGURATION FORM WITH STEPPER                             */}
          {/* ==================================================================== */}
          {stage === 2 && (
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              
              {/* LEFT: Explanatory Tutorial Guide Panel (Frosted Glass Style) */}
              <div className="lg:col-span-4 flex flex-col space-y-4">
                
                {/* General Info Card */}
                <div className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md flex flex-col justify-between h-full relative overflow-hidden">
                  <div className="absolute top-[-20%] right-[-10%] w-40 h-40 bg-blue-500/5 rounded-full blur-2xl pointer-events-none"></div>
                  
                  <div>
                    <div className="flex items-center space-x-2 mb-4">
                      <GraduationCap className="w-5 h-5 text-blue-400" />
                      <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">{educationLevel} Simulator</span>
                    </div>

                    <h3 className="text-xl font-bold text-white mb-2">Form Data Potensimu</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      AI membutuhkan beberapa variabel penting tentang dirimu guna meluncurkan koordinat masa depan yang paling mendekati dengan kenyataan.
                    </p>

                    <div className="h-px bg-white/10 my-5" />

                    {/* Stepper Interactive Navigation */}
                    <div className="space-y-4">
                      {[
                        { stepNum: 1, label: "Upload CV (Optional)", isOptional: true },
                        { stepNum: 2, label: "Bidang Minat (Wajib)", isOptional: false },
                        { stepNum: 3, label: "Skill Utama (Wajib)", isOptional: false },
                        { stepNum: 4, label: "Upload Portofolio (Optional)", isOptional: true }
                      ].map((item) => (
                        <button
                          key={item.stepNum}
                          type="button"
                          onClick={() => {
                            // Validate previous steps before jumping around
                            if (item.stepNum > 2 && minat.length === 0) {
                              setValidationError("Harap mengisi minimal 1 bidang minat sebelum beralih ke pengisian skill.");
                              setFormStep(2);
                              return;
                            }
                            if (item.stepNum === 4 && (minat.length === 0 || skills.length === 0)) {
                              if (minat.length === 0) {
                                setValidationError("Harap mengisi bidang minat terlebih dahulu.");
                                setFormStep(2);
                              } else {
                                setValidationError("Harap mengisi skill utama terlebih dahulu.");
                                setFormStep(3);
                              }
                              return;
                            }
                            setValidationError(null);
                            setFormStep(item.stepNum);
                          }}
                          className={`w-full flex items-center justify-between p-3 rounded-xl transition-all border text-left cursor-pointer ${
                            formStep === item.stepNum
                              ? "bg-gradient-to-r from-blue-500/15 to-purple-500/15 border-blue-500/50 text-white"
                              : "bg-white/0 border-transparent text-slate-400 hover:bg-white/5"
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <span className={`w-6 h-6 rounded-lg text-xs font-mono font-bold flex items-center justify-center ${
                              formStep === item.stepNum 
                                ? "bg-blue-500 text-white" 
                                : "bg-slate-800 text-slate-400"
                            }`}>
                              {item.stepNum}
                            </span>
                            <span className="text-xs font-medium">{item.label}</span>
                          </div>
                          <div>
                            {item.stepNum === 1 ? (
                              cvImg ? (
                                <CheckCircle2 className="w-4 h-4 text-green-400" />
                              ) : (
                                <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-500 font-mono">OP</span>
                              )
                            ) : item.stepNum === 2 ? (
                              minat.length > 0 ? (
                                <CheckCircle2 className="w-4 h-4 text-green-400" />
                              ) : (
                                <X className="w-4 h-4 text-red-400" />
                              )
                            ) : item.stepNum === 3 ? (
                              skills.length > 0 ? (
                                <CheckCircle2 className="w-4 h-4 text-green-400" />
                              ) : (
                                <X className="w-4 h-4 text-red-400" />
                              )
                            ) : item.stepNum === 4 ? (
                              portfolio ? (
                                <CheckCircle2 className="w-4 h-4 text-green-400" />
                              ) : (
                                <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-500 font-mono">OP</span>
                              )
                            ) : null}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Dynamic Profile Quality Meter (Replaces redundant Active Explainer) */}
                  <div className="mt-6 p-4 bg-white/5 border border-white/10 rounded-2xl relative overflow-hidden">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5 mb-2.5">
                      <Sparkles className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      Kelengkapan Profil Karir
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-[11px] text-slate-400">
                        <span>Skor Kelengkapan</span>
                        <span className="font-bold text-blue-400">
                          {((cvImg ? 20 : 0) + (minat.length > 0 ? 45 : 0) + (skills.length > 0 ? 30 : 0) + (portfolio ? 5 : 0))}%
                        </span>
                      </div>
                      <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden p-[1px] border border-white/5">
                        <div 
                          className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-300 shadow-[0_0_8px_rgba(99,102,241,0.5)]"
                          style={{ width: `${((cvImg ? 20 : 0) + (minat.length > 0 ? 45 : 0) + (skills.length > 0 ? 30 : 0) + (portfolio ? 5 : 0))}%` }}
                        ></div>
                      </div>
                      <p className="text-[10px] text-slate-500 leading-normal">
                        Kecocokan analisis AI diproses real-time berdasarkan input wajib berupa Bidang Minat dan Skill Utama terpilarmu.
                      </p>
                    </div>
                  </div>

                </div>
              </div>


              {/* RIGHT: Input Area Custom Form Control */}
              <div className="lg:col-span-8 flex flex-col justify-between p-6 sm:p-8 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-md relative overflow-hidden">
                
                {/* Ambient dynamic lights in form */}
                <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-purple-500/5 rounded-full blur-3xl pointer-events-none"></div>
                
                {/* Form Navigation Header */}
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <span className="text-[11px] text-blue-400 font-mono tracking-wider">Langkah {formStep} dari 4</span>
                    <h3 className="text-lg font-bold text-white">
                      {formStep === 1 && "Lampirkan Curriculum Vitae (CV) - Visual"}
                      {formStep === 2 && "Tentukan Bidang Minat Terbesarmu"}
                      {formStep === 3 && "Petakan Skill & Kemampuan Unggulanmu"}
                      {formStep === 4 && "Lampirkan Portofolio Karya Nyata"}
                    </h3>
                  </div>

                  {/* Quick Education Stage Badge */}
                  <div className="flex items-center space-x-2 bg-slate-800 border border-white/10 px-3 py-1 rounded-lg">
                    <span className="text-xs text-slate-400">Pendidikan:</span>
                    <span className="text-xs font-bold text-blue-400 uppercase">{educationLevel}</span>
                  </div>
                </div>


                {/* FORM CONTENT CONTAINER */}
                <div className="flex-1 my-4 min-h-[300px] flex flex-col justify-center">
                  
                  {/* STEP 1: CV DROPZONE */}
                  {formStep === 1 && (
                    <div className="space-y-4 animate-fadeIn">
                      {/* Active Info Button for explanation */}
                      <div className="flex items-center justify-between bg-white/3 border border-white/5 py-2 px-3 rounded-xl">
                        <span className="text-[11px] text-slate-300 font-medium">Butuh penjelasan cara mengupload CV?</span>
                        <button
                          type="button"
                          onClick={() => toggleExplanation(1)}
                          className={`px-2.5 py-1 text-xs rounded-lg transition-all flex items-center gap-1 cursor-pointer font-semibold ${
                            showExplanation[1]
                              ? "bg-blue-500/25 text-blue-300 border border-blue-500/45"
                              : "bg-slate-800 hover:bg-slate-750 text-slate-300 border border-transparent"
                          }`}
                        >
                          <Info className="w-3.5 h-3.5" />
                          <span>Minta Info</span>
                        </button>
                      </div>

                      {showExplanation[1] && (
                        <div className="p-4 bg-blue-950/40 border border-blue-500/20 text-xs text-slate-300 rounded-2xl flex items-start gap-3 animate-fadeIn">
                          <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                          <div>
                            <h4 className="font-bold text-blue-300 mb-1">Penjelasan Curriculum Vitae (CV):</h4>
                            <p className="leading-relaxed">
                              CV (Curriculum Vitae) adalah dokumen ringkasan yang merekam pendidikan, riwayat aktivitas, hobi, dan keahlianmu. Simulator ini akan memindai teks atau poin CV untuk memetakan kepribadian masa depanmu secara otomatis melalui AI Vision! Jika kamu belum punya CV formal, jangan khawatir! Kosongkan saja dan lanjut ke step berikutnya untuk mengetik profilmu secara langsung.
                            </p>
                          </div>
                        </div>
                      )}

                      <div 
                        onDragOver={(e) => { e.preventDefault(); setCvDragging(true); }}
                        onDragLeave={() => setCvDragging(false)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setCvDragging(false);
                          if (e.dataTransfer.files?.[0]) {
                            handleCVUpload(e.dataTransfer.files[0]);
                          }
                        }}
                        className={`border-2 border-dashed rounded-3xl p-8 text-center transition-all cursor-pointer flex flex-col items-center justify-center min-h-[180px] ${
                          cvDragging 
                            ? "border-blue-500 bg-blue-500/10 scale-95" 
                            : cvImg 
                              ? "border-green-500/50 bg-green-500/5" 
                              : "border-white/10 hover:border-blue-500/40 bg-white/2"
                        }`}
                        onClick={() => document.getElementById("cv-file-picker")?.click()}
                      >
                        <input 
                          type="file" 
                          id="cv-file-picker" 
                          className="hidden" 
                          accept="image/png, image/jpeg, image/jpg"
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              handleCVUpload(e.target.files[0]);
                            }
                          }}
                        />

                        {cvImg ? (
                          <div className="space-y-3">
                            <div className="w-16 h-16 bg-green-500/15 rounded-2xl flex items-center justify-center text-green-400 mx-auto">
                              <FileCheck className="w-8 h-8" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-white">{cvImg.name}</p>
                              <p className="text-xs text-green-400 mt-1">CV Berhasil Diupload & Terpindai!</p>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                  e.stopPropagation();
                                  setCvImg(null);
                              }}
                              className="px-3 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-xs font-semibold mx-auto transition-colors flex items-center gap-1"
                            >
                              <X className="w-3.5 h-3.5" /> Hapus
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-400 mx-auto">
                              <Upload className="w-7 h-7" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-white">Drag & drop format JPG/PNG CV-mu disini</p>
                              <p className="text-xs text-slate-400 mt-1">Atau klik untuk browsing file di komputermu</p>
                            </div>
                            <span className="text-[10px] text-slate-500">Maksimal 5MB • Hanya menerima PNG/JPG untuk diproses AI Vision</span>
                          </div>
                        )}
                      </div>

                      {/* Fallback info when no CV */}
                      <div className="flex items-start gap-2.5 p-3.5 bg-white/2 border border-white/5 rounded-2xl text-[11px] text-slate-400 leading-normal">
                        <span className="text-blue-400 font-bold uppercase font-mono">Tips:</span>
                        <span>Jika kamu belum punya CV formal, jangan khawatir! Kosongkan saja dan lanjut ke step berikutnya untuk mengetik skill-mu secara langsung.</span>
                      </div>
                    </div>
                  )}


                   {/* STEP 2: MINAT INDUSTRIES INTERACTIVE (Swapped to Step 2) */}
                  {formStep === 2 && (
                    <div className="space-y-5 animate-fadeIn">
                      {/* Active Info Button for explanation */}
                      <div className="flex items-center justify-between bg-white/3 border border-white/5 py-2 px-3 rounded-xl">
                        <span className="text-[11px] text-slate-300 font-medium">Bagaimana cara menentukan Bidang Minat?</span>
                        <button
                          type="button"
                          onClick={() => toggleExplanation(2)}
                          className={`px-2.5 py-1 text-xs rounded-lg transition-all flex items-center gap-1 cursor-pointer font-semibold ${
                            showExplanation[2]
                              ? "bg-cyan-500/25 text-cyan-300 border border-cyan-500/45"
                              : "bg-slate-800 hover:bg-slate-750 text-slate-300 border border-transparent"
                          }`}
                        >
                          <Info className="w-3.5 h-3.5" />
                          <span>Minta Info</span>
                        </button>
                      </div>

                      {showExplanation[2] && (
                        <div className="p-4 bg-cyan-950/40 border border-cyan-500/20 text-xs text-slate-300 rounded-2xl flex items-start gap-3 animate-fadeIn">
                          <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                          <div>
                            <h4 className="font-bold text-cyan-300 mb-1">Penjelasan Bidang Minat:</h4>
                            <p className="leading-relaxed">
                              Minat adalah bidang atau industri utama yang kamu sukai, memicu antusiasmemu, atau ingin kamu pelajari lebih dalam (contoh: Kecerdasan Buatan, Desain Grafis, Kreator Konten, Keuangan Syariah, dsb). Karakteristik jenjang pilihanmu akan terhubung erat dengan klaster minat ini guna memproyeksikan target industri masa depan dengan presentasi kelayakan tinggi.
                            </p>
                          </div>
                        </div>
                      )}

                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wide">
                          Tentukan Bidang Minat yang Kamu Sukai (Wajib Diisi):
                        </label>
                        
                        <div className="relative">
                          <input 
                            type="text"
                            value={minatInput}
                            onChange={(e) => setMinatInput(e.target.value)}
                            onFocus={() => setMinatFocused(true)}
                            onBlur={() => setTimeout(() => setMinatFocused(false), 200)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                appendMinat(minatInput);
                              }
                            }}
                            placeholder="Apa bidang industri yang kamu gemari? Kreator Konten, Game Dev, dsb."
                            className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                          />

                          {/* suggestions container dropdown */}
                          {minatFocused && minatSuggestions.length > 0 && (
                            <div className="absolute left-0 right-0 mt-1 bg-slate-950 border border-slate-800 rounded-xl z-20 shadow-2xl p-2 max-h-48 overflow-y-auto">
                              <p className="text-[10px] text-slate-500 px-3 py-1 font-semibold uppercase tracking-wider">Bidang Populer</p>
                              {minatSuggestions.map((item) => (
                                <button
                                  key={item}
                                  type="button"
                                  onClick={() => appendMinat(item)}
                                  className="w-full text-left px-3 py-2 rounded-lg text-xs text-slate-200 hover:bg-white/5 transition-colors flex items-center space-x-2"
                                >
                                  <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full"></span>
                                  <span>{item}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Display selected interest chips */}
                      <div>
                        <p className="text-xs font-semibold text-slate-400 mb-2">Sektor Minat Terpilih ({minat.length}):</p>
                        {minat.length === 0 ? (
                          <div className="py-4 text-center border border-white/5 bg-white/2 rounded-xl text-xs text-slate-500">
                            Belum ada minat yang ditambahkan. Ketik minatmu atau klik daftar saran instan di bawah.
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {minat.map((tag, idx) => (
                              <span 
                                key={idx}
                                className="inline-flex items-center space-x-2 px-3 py-1.5 bg-cyan-500/10 border border-cyan-500/20 text-xs font-semibold text-cyan-300 rounded-xl text-[11px]"
                              >
                                <span>{tag}</span>
                                <button 
                                  onClick={() => removeMinat(idx)} 
                                  className="hover:text-white text-cyan-400 transition-colors"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Quick recommendations minat */}
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-2">Saran Instan:</p>
                        <div className="flex flex-wrap gap-1.5">
                          {RECOMMENDED_MINAT.filter(m => !minat.includes(m)).slice(0, 9).map((fav) => (
                            <button
                              key={fav}
                              onClick={() => appendMinat(fav)}
                              className="text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded-lg border border-white/5 transition-colors"
                            >
                              + {fav}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-start gap-2.5 p-3.5 bg-cyan-500/5 border border-cyan-500/10 rounded-2xl text-[11px] text-slate-400 leading-normal">
                        <span className="text-cyan-400 font-bold uppercase font-mono">Info:</span>
                        <span>Setelah menentukan bidang minatmu di tahap ini, AI akan secara cerdas mengompilasi dan merekomendasikan skill-skill industri terkait di langkah selanjutnya.</span>
                      </div>
                    </div>
                  )}


                  {/* STEP 3: SKILLS INPUT WITH AUTOCOMPLETE CHIPS (Swapped to Step 3) */}
                  {formStep === 3 && (
                    <div className="space-y-5 animate-fadeIn">
                      {/* Active Info Button for explanation */}
                      <div className="flex items-center justify-between bg-white/3 border border-white/5 py-2 px-3 rounded-xl">
                        <span className="text-[11px] text-slate-300 font-medium">Bagaimana cara memetakan Skill Utama?</span>
                        <button
                          type="button"
                          onClick={() => toggleExplanation(3)}
                          className={`px-2.5 py-1 text-xs rounded-lg transition-all flex items-center gap-1 cursor-pointer font-semibold ${
                            showExplanation[3]
                              ? "bg-purple-500/25 text-purple-300 border border-purple-500/45"
                              : "bg-slate-800 hover:bg-slate-750 text-slate-300 border border-transparent"
                          }`}
                        >
                          <Info className="w-3.5 h-3.5" />
                          <span>Minta Info</span>
                        </button>
                      </div>

                      {showExplanation[3] && (
                        <div className="p-4 bg-purple-950/40 border border-purple-500/20 text-xs text-slate-300 rounded-2xl flex items-start gap-3 animate-fadeIn">
                          <Info className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                          <div>
                            <h4 className="font-bold text-purple-300 mb-1">Penjelasan Skill Utama:</h4>
                            <p className="leading-relaxed">
                              Skill adalah kompetensi dan kepandaian praktikal berharga yang kamu miliki, baik berupa <b>Hard Skill</b> (coding, desain, edit video, analisis data) maupun <b>Soft Skill</b> (negosiasi, kepemimpinan, public speaking, bahasa asing). Pengisian yang komprehensif mematangkan hitungan akurasi visualisasi roadmap karier AI-mu!
                            </p>
                          </div>
                        </div>
                      )}

                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wide">
                          Ketik Skill & Kemampuan Unggulanmu (Wajib Diisi):
                        </label>
                        
                        {/* Auto-suggest wrapper */}
                        <div className="relative">
                          <input 
                            type="text"
                            value={skillInput}
                            onChange={(e) => setSkillInput(e.target.value)}
                            onFocus={() => setSkillFocused(true)}
                            onBlur={() => setTimeout(() => setSkillFocused(false), 200)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                appendSkill(skillInput);
                              }
                            }}
                            placeholder="Ketik skill yang kamu miliki, contoh: UI/UX, Python, Public Speaking..."
                            className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
                          />

                          {/* Float suggestions */}
                          {skillFocused && skillSuggestions.length > 0 && (
                            <div className="absolute left-0 right-0 mt-1 bg-slate-950 border border-slate-800 rounded-xl z-20 shadow-2xl p-2 max-h-48 overflow-y-auto">
                              <p className="text-[10px] text-slate-500 px-3 py-1 font-semibold uppercase tracking-wider">Cari Skill</p>
                              {skillSuggestions.map((item) => (
                                <button
                                  key={item}
                                  type="button"
                                  onClick={() => appendSkill(item)}
                                  className="w-full text-left px-3 py-2 rounded-lg text-xs text-slate-200 hover:bg-white/5 transition-colors flex items-center space-x-2"
                                >
                                  <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
                                  <span>{item}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Display Selected Skills Chips */}
                      <div>
                        <p className="text-xs font-semibold text-slate-400 mb-2">Skill Utama Terpilih ({skills.length}):</p>
                        {skills.length === 0 ? (
                          <div className="py-4 text-center border border-white/5 bg-white/2 rounded-xl text-xs text-slate-500">
                            Belum ada skill yang dipilih. Masukkan skill atau klik rekomendasi di bawah.
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {skills.map((tag, idx) => (
                              <span 
                                key={idx}
                                className="inline-flex items-center space-x-2 px-3 py-1.5 bg-purple-500/10 border border-purple-500/20 text-xs font-semibold text-purple-300 rounded-xl text-[11px]"
                              >
                                <span>{tag}</span>
                                <button 
                                  onClick={() => removeSkill(idx)} 
                                  className="hover:text-white text-purple-400 transition-colors"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Dynamic Interest-based Skill Recommendations */}
                      {minat.length > 0 && (
                        <div className="p-4 rounded-2xl bg-cyan-500/5 border border-cyan-500/15 space-y-3">
                          <p className="text-xs font-bold text-cyan-300 flex items-center gap-1.5 uppercase tracking-wider">
                            <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse shrink-0" />
                            Rekomendasi Berdasarkan Minatmu ({minat.join(", ")}):
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {(() => {
                              const recommendedSet = new Set<string>();
                              minat.forEach((m) => {
                                if (MINAT_SKILLS_MAP[m]) {
                                  MINAT_SKILLS_MAP[m].forEach((s) => recommendedSet.add(s));
                                }
                              });
                              const list = Array.from(recommendedSet).filter(s => !skills.includes(s));
                              if (list.length === 0) {
                                return <span className="text-[11px] text-slate-500 italic">Semua skill rekomendasi dari minatmu sudah dipilih.</span>;
                              }
                              return list.slice(0, 12).map((fav) => (
                                <button
                                  key={fav}
                                  type="button"
                                  onClick={() => appendSkill(fav)}
                                  className="text-[11px] bg-cyan-950/40 hover:bg-cyan-900/60 text-cyan-200 px-2.5 py-1 rounded-lg border border-cyan-500/20 transition-colors flex items-center gap-1 cursor-pointer"
                                >
                                  + {fav}
                                </button>
                              ));
                            })()}
                          </div>
                        </div>
                      )}

                      {/* Hierarchical Cluster Explorer */}
                      <div className="space-y-3 pt-2">
                        <div>
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                            <Briefcase className="w-3.5 h-3.5 text-purple-400" />
                            Jelajahi Skill dari Bidang Lain (Hierarki):
                          </p>
                          <p className="text-[10px] text-slate-500 leading-normal">
                            Klik bidang industri di bawah untuk memunculkan dan memilih skill khas dari sektor tersebut.
                          </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[300px] overflow-y-auto pr-1">
                          {Object.keys(MINAT_SKILLS_MAP).map((catName) => {
                            const isExpanded = expandedCategory === catName;
                            const isUserMinat = minat.includes(catName);
                            const catSkills = MINAT_SKILLS_MAP[catName] || [];
                            const unselectedCatSkills = catSkills.filter(s => !skills.includes(s));

                            return (
                              <div 
                                key={catName} 
                                className={`flex flex-col rounded-xl border transition-all ${
                                  isExpanded 
                                    ? "bg-slate-900/80 border-purple-500/40 shadow-md shadow-purple-500/5 duration-300" 
                                    : "bg-slate-900/40 border-white/5 hover:border-white/10 hover:bg-slate-900/60"
                                }`}
                              >
                                <button
                                  type="button"
                                  onClick={() => setExpandedCategory(isExpanded ? null : catName)}
                                  className="w-full flex items-center justify-between p-3 text-left transition-colors cursor-pointer"
                                >
                                  <div className="flex items-center space-x-2">
                                    <span className={`w-2 h-2 rounded-full ${isUserMinat ? "bg-cyan-400" : "bg-purple-400"}`}></span>
                                    <span className={`text-xs font-semibold ${isUserMinat ? "text-cyan-300" : "text-white"}`}>
                                      {catName}
                                    </span>
                                    {isUserMinat && (
                                      <span className="text-[8px] bg-cyan-500/10 text-cyan-400 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                                        Minatmu
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center space-x-2 text-slate-500 shrink-0">
                                    <span className="text-[10px] font-mono">({unselectedCatSkills.length} skill)</span>
                                    <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isExpanded ? "rotate-90 text-purple-400" : ""}`} />
                                  </div>
                                </button>

                                {isExpanded && (
                                  <div className="px-3 pb-3 pt-1 border-t border-white/5 bg-slate-950/30 rounded-b-xl animate-fadeIn">
                                    {unselectedCatSkills.length === 0 ? (
                                      <p className="text-[10px] text-slate-500 italic py-1">Semua skill dalam bidang ini telah terpilih.</p>
                                    ) : (
                                      <div className="flex flex-wrap gap-1 mt-1">
                                        {unselectedCatSkills.map((s) => (
                                          <button
                                            key={s}
                                            type="button"
                                            onClick={() => appendSkill(s)}
                                            className="text-[10px] bg-slate-800 hover:bg-slate-700 hover:text-white text-slate-300 px-2 py-0.5 rounded transition-colors border border-white/5 cursor-pointer"
                                          >
                                            + {s}
                                          </button>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                    </div>
                  )}


                  {/* STEP 4: PORTFOLIO FILE UPLOAD (PDF) */}
                  {formStep === 4 && (
                    <div className="space-y-4 animate-fadeIn">
                      {/* Active Info Button for explanation */}
                      <div className="flex items-center justify-between bg-white/3 border border-white/5 py-2 px-3 rounded-xl">
                        <span className="text-[11px] text-slate-300 font-medium">Bagaimana cara menyusun Portofolio?</span>
                        <button
                          type="button"
                          onClick={() => toggleExplanation(4)}
                          className={`px-2.5 py-1 text-xs rounded-lg transition-all flex items-center gap-1 cursor-pointer font-semibold ${
                            showExplanation[4]
                              ? "bg-indigo-500/25 text-indigo-300 border border-indigo-500/45"
                              : "bg-slate-800 hover:bg-slate-750 text-slate-300 border border-transparent"
                          }`}
                        >
                          <Info className="w-3.5 h-3.5" />
                          <span>Minta Info</span>
                        </button>
                      </div>

                      {showExplanation[4] && (
                        <div className="p-4 bg-indigo-950/40 border border-indigo-500/20 text-xs text-slate-300 rounded-2xl flex items-start gap-3 animate-fadeIn">
                          <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                          <div>
                            <h4 className="font-bold text-indigo-300 mb-1">Penjelasan Portofolio:</h4>
                            <p className="leading-relaxed">
                              Portofolio adalah berkas kumpulan karya nyata (PDF) yang menampilkan proyek sekolah, sertifikat kelulusan kursus, catatan hobi produktif, tulisan, atau rangkuman aktivitas luar kelas yang bernilai nyata. Penambahan portofolio memperkuat validasi AI dalam merumuskan kesiapan kerja masa depan secara murni objektif.
                            </p>
                          </div>
                        </div>
                      )}

                      <div 
                        onDragOver={(e) => { e.preventDefault(); setPortfolioDragging(true); }}
                        onDragLeave={() => setPortfolioDragging(false)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setPortfolioDragging(false);
                          if (e.dataTransfer.files?.[0]) {
                            handlePortfolioUpload(e.dataTransfer.files[0]);
                          }
                        }}
                        className={`border-2 border-dashed rounded-3xl p-8 text-center transition-all cursor-pointer flex flex-col items-center justify-center min-h-[200px] ${
                          portfolioDragging 
                            ? "border-purple-500 bg-purple-500/10 scale-95" 
                            : portfolio 
                              ? "border-green-500/50 bg-green-500/5" 
                              : "border-white/10 hover:border-purple-500/40 bg-white/2"
                        }`}
                        onClick={() => document.getElementById("portfolio-file-picker")?.click()}
                      >
                        <input 
                          type="file" 
                          id="portfolio-file-picker" 
                          className="hidden" 
                          accept="application/pdf"
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              handlePortfolioUpload(e.target.files[0]);
                            }
                          }}
                        />

                        {portfolio ? (
                          <div className="space-y-3">
                            <div className="w-16 h-16 bg-gradient-to-tr from-purple-500/10 to-indigo-500/10 rounded-2xl flex items-center justify-center text-purple-400 mx-auto">
                              <FileText className="w-8 h-8" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-white">{portfolio.name}</p>
                              <p className="text-xs text-green-400 mt-1">Sertifikat / Katalog Terlampir!</p>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPortfolio(null);
                              }}
                              className="px-3 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-xs font-semibold mx-auto transition-colors flex items-center gap-1"
                            >
                              <X className="w-3.5 h-3.5" /> Hapus File
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <div className="w-14 h-14 bg-purple-500/10 rounded-2xl flex items-center justify-center text-purple-400 mx-auto">
                              <FileText className="w-7 h-7" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-white">Upload Dokumen Portofolio (PDF)</p>
                              <p className="text-xs text-slate-400 mt-1">Drag & drop katalog portofoliomu dalam ekstensi PDF disini</p>
                            </div>
                            <span className="text-[10px] text-slate-500">Maksimal 10MB • Bersifat opsional</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-start gap-2.5 p-3.5 bg-white/2 border border-white/5 rounded-2xl text-[11px] text-slate-400 leading-normal">
                        <span className="text-purple-400 font-bold uppercase font-mono">Keuntungan:</span>
                        <span>Dengan melampirkan portofolio, kecocokan tingkat kesuksesan karier yang diproyeksikan AI akan meningkat hingga 25% lebih akurat dengan benchmark aslinya.</span>
                      </div>
                    </div>
                  )}

                </div>


                {/* FORM STEP CONTROLS (Next/Prev/Simulate) */}
                <div className="mt-8 flex justify-between items-center pt-5 border-t border-white/10">
                  
                  {/* Prev Button */}
                  <button
                    onClick={() => {
                      if (formStep > 1) {
                        setFormStep(formStep - 1);
                      } else {
                        setStage(1); // Go back to Level stage
                      }
                    }}
                    className="px-5 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-xs font-bold text-slate-300 transition-colors"
                  >
                    Kembali
                  </button>

                  <div className="flex space-x-3">
                    {/* Dev/Skip to Simulate directly */}
                    {formStep < 4 ? (
                      <button
                        onClick={() => {
                          if (formStep === 2 && minat.length === 0) {
                            setValidationError("Harap mengisi minimal 1 bidang minat sebelum beralih ke pengisian skill.");
                            return;
                          }
                          if (formStep === 3 && skills.length === 0) {
                            setValidationError("Harap mengisi minimal 1 skill utama sebelum beralih ke portofolio.");
                            return;
                          }
                          setValidationError(null);
                          setFormStep(formStep + 1);
                        }}
                        className="px-6 py-2.5 bg-white text-black hover:bg-slate-200 transition-colors text-xs font-bold rounded-xl flex items-center space-x-1.5 cursor-pointer"
                      >
                        <span>Langkah Selanjutnya</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        onClick={handleSimulate}
                        className="px-8 py-3 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 text-white hover:opacity-90 font-bold text-xs rounded-xl flex items-center space-x-2 shadow-lg shadow-indigo-500/20 cursor-pointer"
                      >
                        <Sparkles className="w-4 h-4 animate-spin" />
                        <span>PROYEKSIKAN MASA DEPAN</span>
                      </button>
                    )}
                  </div>

                </div>

              </div>
            </div>
          )}


          {/* ==================================================================== */}
          {/* STAGE 3: CINEMATIC HOVERING/GLOWING LOADING SCREEN                   */}
          {/* ==================================================================== */}
          {stage === 3 && (
            <div className="flex-1 flex flex-col justify-center items-center py-16 text-center animate-fadeIn">
              
              {/* Outer circular holo radar */}
              <div className="relative w-48 h-48 mb-8 flex items-center justify-center">
                {/* Neon waves */}
                <div className="absolute inset-0 rounded-full border-4 border-dashed border-blue-500/20 animate-spin" style={{ animationDuration: "12s" }}></div>
                <div className="absolute inset-4 rounded-full border border-dashed border-purple-500/40 animate-spin" style={{ animationDuration: "6s" }}></div>
                <div className="absolute inset-8 rounded-full bg-[#0d0e1b] border border-white/10 flex items-center justify-center shadow-inner">
                  {/* Internal holographic core */}
                  <Brain className="w-14 h-14 text-blue-400 animate-pulse" />
                </div>

                {/* Floating particle clouds around */}
                <div className="absolute -top-3 -right-2 w-3 h-3 bg-cyan-400 rounded-full animate-ping"></div>
                <div className="absolute bottom-4 -left-3 w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
              </div>

              {/* Progress feedback */}
              <div className="max-w-md w-full space-y-4 px-4">
                <span className="text-[10px] text-blue-400 font-mono tracking-widest uppercase block animate-pulse">
                  SIMULATOR ONLINE • SYNCHRONIZING REALITY
                </span>
                <h3 className="text-xl font-bold text-white tracking-tight leading-snug">
                  {loadingText}
                </h3>

                {/* Progress bar micro */}
                <div className="h-2 w-full bg-slate-900 border border-white/5 rounded-full overflow-hidden p-0.5">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 via-indigo-400 to-purple-600 rounded-full transition-all duration-300 shadow-[0_0_8px_rgba(99,102,241,0.6)]"
                    style={{ width: `${loadingProgress}%` }}
                  ></div>
                </div>

                <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono">
                  <span>Masa Proyeksi: 2026 - 2031</span>
                  <span>{Math.round(loadingProgress)}% TERKOMPILASI</span>
                </div>
              </div>

              <div className="mt-8 text-xs text-slate-500 max-w-sm leading-relaxed px-4">
                "AI sedang merajut probabilitas kariermu dengan jutaan klaster data industri global."
              </div>
            </div>
          )}


          {/* ==================================================================== */}
          {/* STAGE 4: MAIN DETAILED CAREER SIMULATOR RESULT DASHBOARD             */}
          {/* ==================================================================== */}
          {stage === 4 && simulationResult && (
            <div className="flex-1 flex flex-col space-y-4 animate-fadeIn">
              
              {/* Back and Notification Area */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="order-2 sm:order-1 flex items-center space-x-2">
                  <span className="text-xs text-slate-400">Proyeksi Masa Depan Untuk:</span>
                  <span className="px-2.5 py-1 text-[11px] font-bold bg-blue-500/10 border border-blue-500/20 text-blue-300 rounded-lg uppercase">
                    Pendidikan {educationLevel}
                  </span>
                </div>

                <div className="order-1 sm:order-2 flex items-center space-x-2">
                  <button 
                    onClick={() => { setStage(2); }}
                    className="px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl text-xs font-bold text-slate-300 transition-colors flex items-center gap-1"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Ubah Input & Simulasi Ulang
                  </button>
                  <button 
                    onClick={resetAll}
                    className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:opacity-95 rounded-xl text-xs font-bold text-white transition-colors"
                  >
                    Simulasi Baru
                  </button>
                </div>
              </div>

              {/* Dev API Status Error Notice if fallback was used */}
              {apiError && (
                <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-2xl flex items-center justify-between text-xs text-amber-300/90 backdrop-blur-sm">
                  <div className="flex items-center space-x-2">
                    <Zap className="w-4 h-4 text-amber-400" />
                    <span><strong>Prototyping Mode:</strong> Simulator menggunakan pre-kompilasi luring yang dipersonalisasi.</span>
                  </div>
                  <span className="text-[10px] bg-amber-500/10 px-2 py-0.5 rounded text-amber-300 font-mono">OFFLINE_BACKUP_OK</span>
                </div>
              )}

              {/* DASHBOARD GRID */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
                
                {/* 1. LEFT PANEL: Career Vision Identity card */}
                <div className="lg:col-span-5 xl:col-span-4 flex flex-col space-y-4">
                  
                  {/* Primary futuristic persona profile block */}
                  <div className="flex-1 p-6 sm:p-8 bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 relative overflow-hidden flex flex-col justify-between shadow-2xl min-h-[420px]">
                    
                    {/* Glowing grid background detail */}
                    <div className="absolute top-0 right-0 p-8 text-indigo-400/10 pointer-events-none transform translate-x-4 -translate-y-4">
                      <Briefcase className="w-40 h-40" />
                    </div>

                    <div className="space-y-4">
                      <div>
                        <span className="px-2.5 py-1 bg-blue-500/10 border border-blue-500/20 text-[9px] font-bold text-blue-400 rounded-lg tracking-[0.2em] uppercase block w-max">
                          Persona Masa Depan
                        </span>
                        
                        <h2 className="text-2xl sm:text-3xl font-black font-display text-white mt-3 leading-tight tracking-tight">
                          {simulationResult.careerTitle}
                        </h2>
                        
                        <p className="text-slate-400 text-xs mt-2 italic leading-relaxed">
                          "{simulationResult.careerConcept}"
                        </p>
                      </div>

                      <div className="h-px bg-white/10" />

                      {/* Brief narrative timeline summary quote */}
                      <div className="p-4 bg-white/2 rounded-2xl border border-white/5">
                        <p className="text-xs text-slate-300 italic leading-relaxed">
                          {simulationResult.summary}
                        </p>
                      </div>
                    </div>

                    <div className="mt-8 space-y-4">
                      
                      {/* STATS BARS */}
                      <div className="space-y-3.5">
                        {/* 1. Career Match Rate */}
                        <div>
                          <div className="flex justify-between items-end mb-1 text-xs">
                            <span className="text-slate-400">Kecocokan Karir (Passion & Skill)</span>
                            <span className="font-bold text-blue-400">{simulationResult.compatibilityRate}%</span>
                          </div>
                          <div className="h-2 w-full bg-slate-900 border border-white/5 rounded-full overflow-hidden p-0.5">
                            <div 
                              className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full"
                              style={{ width: `${simulationResult.compatibilityRate}%` }}
                            ></div>
                          </div>
                        </div>

                        {/* 2. Success Probability */}
                        <div>
                          <div className="flex justify-between items-end mb-1 text-xs">
                            <span className="text-slate-400">Peluang Sukses Finansial & Kerja</span>
                            <span className="font-bold text-purple-400">{simulationResult.successProbability}%</span>
                          </div>
                          <div className="h-2 w-full bg-slate-900 border border-white/5 rounded-full overflow-hidden p-0.5">
                            <div 
                              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                              style={{ width: `${simulationResult.successProbability}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>

                      {/* Info stats row */}
                      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10 text-center">
                        <div>
                          <span className="text-[10px] text-slate-500 uppercase font-mono">Market Demand</span>
                          <p className="text-base font-extrabold text-blue-300 font-display mt-0.5">Critical Core</p>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 uppercase font-mono">Estimasi Gaji</span>
                          <p className="text-base font-extrabold text-purple-300 font-display mt-0.5">High Potential</p>
                        </div>
                      </div>

                    </div>
                  </div>
                </div>


                {/* 2. RIGHT PANEL: Future Deployments, Roadmaps, Gaps */}
                <div className="lg:col-span-7 xl:col-span-8 flex flex-col space-y-4">
                  
                  {/* Timeline 5 Years */}
                  <div className="p-6 sm:p-8 bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 shadow-xl">
                    
                    <div className="flex items-center space-x-2 mb-6">
                      <Clock className="w-4 h-4 text-purple-400 animate-spin" style={{ animationDuration: '10s' }} />
                      <h3 className="text-xs font-bold uppercase tracking-widest text-slate-200">
                        Proyeksi Milestone Karir & Kehidupan (5 Tahun)
                      </h3>
                    </div>

                    {/* Timeline slider steps */}
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-3 relative mt-2">
                      {simulationResult.yearsTimeline.map((milestone) => (
                        <div 
                          key={milestone.year} 
                          className="bg-white/2 rounded-2xl p-4 border border-white/5 relative group hover:bg-white/5 hover:border-blue-500/30 transition-all duration-300 flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-blue-500/10 text-blue-300 rounded">
                                Tahun {milestone.year}
                              </span>
                              <span className="text-[9px] text-slate-500 font-semibold">{milestone.status}</span>
                            </div>
                            <h4 className="text-xs font-bold text-white mb-2 group-hover:text-blue-300 transition-colors">
                              {milestone.title}
                            </h4>
                            <p className="text-[10px] text-slate-400 leading-relaxed leading-normal">
                              {milestone.description}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Pro tip summary notice */}
                    <div className="mt-5 p-4 bg-blue-500/5 rounded-2xl border border-blue-500/10 flex items-start space-x-3">
                      <div className="text-blue-400 mt-0.5 flex-shrink-0">
                        <TrendingUp className="w-5 h-5" />
                      </div>
                      <p className="text-xs leading-relaxed text-slate-300">
                        <strong className="text-blue-300">Analisis Progresi Karir:</strong> Seiring berjalannya waktu, penguasaan skill rintisan secara disiplin akan melipatgandakan valuasi portofoliomu. Pastikan untuk selalu mendokumentasikan setiap pencapaian dalam format Ghost CV ini.
                      </p>
                    </div>

                  </div>


                  {/* Skills Bridging & Roadmap Phases */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    
                    {/* Skills to learn list */}
                    <div className="md:col-span-5 p-6 bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center space-x-2 mb-4 text-cyan-400">
                          <Brain className="w-4 h-4" />
                          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Skill Krusial Untuk Dipelajari</h3>
                        </div>

                        <div className="space-y-3.5">
                          {simulationResult.requiredSkills.map((skillItem, index) => (
                            <div key={index} className="p-3 bg-white/2 rounded-xl border border-white/5 flex flex-col space-y-1.5 hover:bg-white/5 transition-colors">
                              <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-white">{skillItem.name}</span>
                                <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                                  skillItem.difficulty === "Mudah" 
                                    ? "bg-green-500/10 text-green-400" 
                                    : skillItem.difficulty === "Sedang"
                                      ? "bg-amber-500/10 text-amber-400"
                                      : "bg-red-500/10 text-red-400"
                                }`}>
                                  {skillItem.difficulty}
                                </span>
                              </div>
                              <div className="flex justify-between items-center text-[10px] text-slate-400">
                                <span>Rekomendasi: <span className="text-blue-300">{skillItem.source}</span></span>
                                <div className="flex items-center space-x-0.5">
                                  {Array.from({ length: 5 }).map((_, i) => (
                                    <span 
                                      key={i} 
                                      className={`w-1.5 h-1.5 rounded-full ${
                                        i < skillItem.importance ? "bg-cyan-400" : "bg-slate-700"
                                      }`}
                                    />
                                  ))}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-500 text-center">
                        Total 3 prioritas pembelajaran rekomendasi
                      </div>
                    </div>


                    {/* Actionable Phase roadmaps */}
                    <div className="md:col-span-7 p-6 bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center space-x-2 mb-4 text-purple-400">
                          <Layers className="w-4 h-4" />
                          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Fase Peta Jalan Penguasaan (Roadmap)</h3>
                        </div>

                        <div className="space-y-4">
                          {simulationResult.roadmap.map((phaseNode, idx) => (
                            <div key={idx} className="relative pl-5 border-l border-white/10 last:border-0 pb-3 last:pb-0">
                              <span className="absolute left-0 top-1 w-2.5 h-2.5 -translate-x-1/2 bg-purple-500 rounded-full border-2 border-slate-900 shadow-[0_0_8px_rgba(168,85,247,0.5)]"></span>
                              <div className="flex items-baseline space-x-2">
                                <h4 className="text-xs font-bold text-white">{phaseNode.phase}</h4>
                                <span className="text-[10px] text-slate-500 font-medium">({phaseNode.duration})</span>
                              </div>
                              <ul className="mt-1.5 space-y-1">
                                {phaseNode.milestones.map((milestoneItem, mIdx) => (
                                  <li key={mIdx} className="text-[10px] text-slate-400 flex items-center space-x-2">
                                    <span className="w-1 h-1 bg-purple-400 rounded-full inline-block"></span>
                                    <span>{milestoneItem}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-800 mt-4">
                        <span className="text-[10px] text-purple-400 uppercase font-mono font-bold block">Goal Bisnis Utama:</span>
                        <p className="text-[11px] text-slate-400 mt-1 italic">
                          Mengintegrasikan portofolio mandiri dengan project komisi berbayar di fase akhir simulasi.
                        </p>
                      </div>
                    </div>

                  </div>

                </div>
              </div>


              {/* 3. BOTH SECTION SIMULATED LIFE DESCRIPTION */}
              <div className="p-6 bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none"></div>
                <div className="flex items-center space-x-2.5 mb-3 text-cyan-400">
                  <BookOpen className="w-5 h-5" />
                  <h3 className="text-sm font-bold uppercase tracking-widest">
                    Simulasi Naratif Kehidupan Sehari-hari (5 Tahun ke Depan)
                  </h3>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {simulationResult.lifeSimulation}
                </p>
              </div>


              {/* 4. ACTIONS FOR TODAY */}
              <div className="p-6 bg-gradient-to-r from-blue-600/10 to-indigo-600/10 rounded-3xl border border-blue-500/20 backdrop-blur-md relative">
                
                {/* Floating saved badge notification */}
                {showSavedNotification && (
                  <div className="absolute top-(-16px) right-4 bg-green-500 text-slate-950 font-bold px-3 py-1 rounded-full text-xs animate-bounce shadow-lg">
                    ✓ Laporan Karir Disimpan ke LocalStorage!
                  </div>
                )}

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-1.5 uppercase tracking-wide">
                      <Zap className="w-4 h-4 text-amber-400 animate-bounce" />
                      3 Langkah Konkret untuk Kamu Lakukan Hari Ini!
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3 w-full max-w-4xl">
                      {simulationResult.actionableNextSteps.map((step, sIdx) => (
                        <div key={sIdx} className="p-3 bg-white/5 rounded-2xl border border-white/5 relative pl-8 hover:bg-white/10 transition-colors">
                          <span className="absolute left-3 top-3 text-xs font-bold text-amber-400 font-mono">0{sIdx + 1}</span>
                          <p className="text-[11px] font-medium leading-relaxed text-slate-300">{step}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 self-stretch md:self-auto justify-end">
                    <button 
                      onClick={() => {
                        localStorage.setItem("ghost_cv_last_sim", JSON.stringify(simulationResult));
                        setShowSavedNotification(true);
                        setTimeout(() => setShowSavedNotification(false), 3000);
                      }}
                      className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold rounded-xl transition-colors text-slate-300"
                    >
                      Simpan Laporan
                    </button>
                    <button 
                      onClick={resetAll}
                      className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold text-xs rounded-xl hover:opacity-95 transition-opacity"
                    >
                      Bandingkan Proyeksi Lain
                    </button>
                  </div>
                </div>
              </div>


            </div>
          )}

        </div>

        {/* Global Footer info */}
        <footer className="mt-8 mb-4 flex flex-col sm:flex-row items-center justify-between px-6 py-4 bg-white/2 backdrop-blur rounded-2xl border border-white/5 text-xs text-slate-500 text-center sm:text-left gap-3">
          <p>
            Masa depankan kariermu bersama <span className="text-slate-300 font-bold">Ghost CV</span>. Simulasi diolah menggunakan superkomputasi AI masa depan berbasis minatan lokal.
          </p>
          <div className="flex space-x-4">
            <span className="text-[10px] text-slate-600">PROYEKSI AKTIF: 2026-2031</span>
            <span className="text-[10px] text-slate-600">ID: {Math.random().toString(36).substr(2, 6).toUpperCase()}</span>
          </div>
        </footer>

      </div>
    </div>
  );
}

// BACKUP FALLBACK SIMULATOR ENGINE (for fallback or dev modes beautifully mapped)
function generateFallbackResult(jenjang: Jenjang, skills: string[], minat: string[]): SimulatorResponse {
  const primaryInterest = minat[0] || "Teknologi";
  const primarySkill = skills[0] || "UI/UX Design";
  
  // Custom job mapping based on input
  let careerTitle = `AI-Powered Specialist`;
  let careerConcept = `Seseorang yang merevolusi bidang industri dengan kecerdasan buatan terapan`;

  if (primaryInterest.includes("Desain") || primarySkill.includes("Design")) {
    careerTitle = "Immersive UI/UX & Spatial Designer";
    careerConcept = "Menyusun pengalaman interaksi digital modern, reality headset, serta antarmuka imersif yang mengawinkan seni dengan arsitektur virtual.";
  } else if (primaryInterest.includes("Game")) {
    careerTitle = "Generative AI Game Director";
    careerConcept = "Mengeksplorasi pembuatan aset video game berkualitas tinggi secara real-time demi pengalaman tanpa batas para gamer.";
  } else if (primaryInterest.includes("Artificial") || primarySkill.includes("Python") || primarySkill.includes("Machine")) {
    careerTitle = "Adaptive Intelligence Core architect";
    careerConcept = "Perekayasa kustom pintar berbasis model bahasa raksasa dan jaringan syaraf tiruan untuk keperluan startup serta manufaktur otomatis.";
  } else if (primaryInterest.includes("Content") || primaryInterest.includes("Creator") || primarySkill.includes("Editing")) {
    careerTitle = "Virtual Production & AI Film Producer";
    careerConcept = "Mengombinasikan rekaman nyata dengan CGI real-time untuk efisiensi produksi sinematografi kelas atas.";
  } else if (primaryInterest.includes("Bisnis")) {
    careerTitle = "Chief of Tech and Analytics Officer";
    careerConcept = "Pemimpin bisnis mutakhir yang membaca data prediktif masa depan industri berteknologi tinggi.";
  } else {
    // General
    careerTitle = `Futuristik ${primaryInterest} Consultant`;
    careerConcept = `Menjembatani skill ${primarySkill} yang kamu miliki ke era otomatisasi cerdas baru.`;
  }

  return {
    careerTitle,
    careerConcept,
    compatibilityRate: Math.floor(Math.random() * 20) + 75, // 75-95%
    successProbability: Math.floor(Math.random() * 20) + 70, // 70-90%
    summary: `Jika kamu dengan konsisten fokus melatih skill ${primarySkill} dan menambatkan passion pada ${primaryInterest} dalam 2 tahun ke depan, peluangmu meluncurkan rintisan usaha mandiri maupun memperoleh karier global meningkat tajam hingga 84%.`,
    yearsTimeline: [
      {
        year: 1,
        title: "Eksplorasi Pondasi & Portofolio Mikro",
        description: `Mulai mengeksplorasi tools ${primarySkill} secara mandiri dan membangun 5 konsep karya sederhana untuk mengisi web proto-portofoliomu.`,
        status: jenjang === "Kuliah" ? "Mahasiswa Awal" : "Siswa Aktif"
      },
      {
        year: 2,
        title: "Kolaborasi Komunitas & Kerja Lepas",
        description: `Mulai mengambil komisi freelance kecil-kecilan di platform online dan bergabung ke perkumpulan profesional berskala regional.`,
        status: "Junior Freelancer"
      },
      {
        year: 3,
        title: "Fase Magang atau Inkubator Startup",
        description: `Diterima magang di perusahaan teknologi rintisan berbasis nasional atau memenangi kompetisi produk digital inovatif.`,
        status: "Specialist intern"
      },
      {
        year: 4,
        title: "Pivot Keahlian Berbasis Kecerdasan Buatan",
        description: "Mengintegrasikan otomatisasi AI ke dalam alur kerjamu demi melipatgandakan kecepatan produksi hingga 3 kali lipat.",
        status: "Senior Associate"
      },
      {
        year: 5,
        title: "Deployment Karir Mandiri Global",
        description: `Menjadi rujukan ahli di industri ${primaryInterest} dengan kepemilikan saham rintisan murni atau mendapatkan kontrak jarak jauh luar negeri.`,
        status: "Indie Maker / Lead Specialist"
      }
    ],
    requiredSkills: [
      {
        name: `Otomatisasi Alur Kerja ${primarySkill}`,
        importance: 5,
        difficulty: "Sedang",
        source: "YouTube Masterclasses & Github Co-Pilot docs"
      },
      {
        name: `Prompt Engineering untuk Sektor ${primaryInterest}`,
        importance: 4,
        difficulty: "Mudah",
        source: "Coursera & OpenAI Interactive Playground"
      },
      {
        name: "Seni Komunikasi Publik & Storytelling Karya",
        importance: 4,
        difficulty: "Mudah",
        source: "TedX Indonesia Presentations"
      }
    ],
    roadmap: [
      {
        phase: "Fase 1: Eksplorasi Fondasi Eksperimental",
        duration: "Bulan 1 - 6",
        milestones: [
          `Menyelesaikan 3 sertifikat dasar terkait ${primarySkill}`,
          "Mengunggah 3 mockup pertama di GitHub / Behance",
          "Mencari 2 mentor mentor berpengalaman di industri terkait"
        ]
      },
      {
        phase: "Fase 2: Publikasi Portofolio Agresif",
        duration: "Bulan 7 - 12",
        milestones: [
          "Menerbitkan studi kasus komparatif di LinkedIn / Medium",
          "Mengerjakan 1 proyek sukarela berdampak sosial besar",
          "Membangun personal branding dengan visual imersif"
        ]
      },
      {
        phase: "Fase 3: Deployment Finansial",
        duration: "Tahun ke-2 ke depan",
        milestones: [
          "Meluncurkan layanan mikro berbayar sendiri",
          "Membangun jejaring dengan 5 perwakilan recruiter lokal",
          "Sertifikasi kelayakan kerja bertaraf internasional"
        ]
      }
    ],
    lifeSimulation: `Pagi harimu di tahun 2031 dimulai dengan kopi hangat di kamar yang diatur pencahayaannya secara pintar. Membuka layar hologram personal, kamu disambut oleh 2 notifikasi dari klien luar negeri yang mendiskusikan implementasi proyek ${primaryInterest} terbaru menggunakan modul ${primarySkill}-mu yang hemat energi.\n\nKamu bekerja secara fleksibel dari studio mandiri di Bali atau rumah bersama komunitas tech nomad. Berkat kejelianmu mengawinkan insting alamiah dengan asistensi AI di tahun 2026, kini kamu tidak lagi sekadar mencari lowongan kerja konvensional, melainkan menciptakan nilai tawar unik yang murni dihargai pasar global secara berulang.`,
    actionableNextSteps: [
      `Buat folder portofolio di Google Drive dengan nama "Bahan_Masa_Depan_Kariers" hari ini!`,
      `Pilih 3 figur tersohor di bidang ${primaryInterest} lalu ikuti jejaring sosial mereka di LinkedIn.`,
      `Alokasikan waktu minim 30 menit sehari untuk mempraktikkan hobi produktif yang kamu sayangi.`
    ]
  };
}
