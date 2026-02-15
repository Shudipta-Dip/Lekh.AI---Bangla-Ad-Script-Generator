import React, { useState, useCallback, useRef, useEffect } from "react";
import { Loader2, Sparkles, Paperclip } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@supabase/supabase-js";
import ToneSelector from "@/components/ToneSelector";
import IndustrySelector from "@/components/IndustrySelector";
import OutputDisplay from "@/components/OutputDisplay";
import ThemeToggle from "@/components/ThemeToggle";
import RotatingWord from "@/components/RotatingWord";
import { useTheme } from "@/components/ThemeProvider";
import BrandAnalyzer, { AnalysisResult } from "@/components/BrandAnalyzer";
import DialectSelector from "@/components/DialectSelector";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

// Initialize Supabase client
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_PROJECT_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const Index = () => {
  const { theme } = useTheme();
  const [prompt, setPrompt] = useState("");
  const [tones, setTones] = useState<string[]>([]);
  const [industry, setIndustry] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [generatedContent, setGeneratedContent] = useState("");
  const [displayedContent, setDisplayedContent] = useState("");
  const [scriptId, setScriptId] = useState<string | null>(null);
  const [dialect, setDialect] = useState("standard");

  /* AI Loading State Steps */
  const LOADING_STEPS = [
    "Analyzing prompt & industry context...",
    "Retrieving successful ad structures...",
    "Injecting brand parameters...",
    "Gemini 2.5 is drafting valid Bangla...",
    "Finalizing script format..."
  ];

  const [loadingStep, setLoadingStep] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleApplyDNA = (dna: AnalysisResult) => {
    // 1. Set Tone
    setTones([dna.tone]);

    // 2. Append Detailed Context
    const dnaContext = `

[Brand DNA]
Tone: ${dna.tone}
${dna.tone_explanation}

Keywords: ${dna.keywords.join(", ")}
${dna.keywords_explanation}

Structure:
- Sentence Length: ${dna.structure.sentence_length}
- Emoji Usage: ${dna.structure.emoji_usage}
- Hashtags: ${dna.structure.hashtag_style}
${dna.structure_explanation}

Language: ${dna.banglish_vs_bangla}
${dna.banglish_explanation}

Hook Style: ${dna.hook_style}
`;
    setPrompt((prev) => prev + dnaContext);

    // 3. Toast
    toast.success(`Applied ${dna.tone} tone and brand context!`);
  };

  // Typing animation effect relative to generatedContent
  useEffect(() => {
    if (isGenerating && generatedContent) {
      let idx = 0;
      setDisplayedContent("");
      intervalRef.current = setInterval(() => {
        idx += 3;
        if (idx >= generatedContent.length) {
          setDisplayedContent(generatedContent);
          setIsGenerating(false);
          if (intervalRef.current) clearInterval(intervalRef.current);
        } else {
          setDisplayedContent(generatedContent.slice(0, idx));
        }
      }, 15);
      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    }
  }, [isGenerating, generatedContent]);

  // Loading Step Cycle
  useEffect(() => {
    let stepInterval: ReturnType<typeof setInterval>;
    if (isGenerating && !generatedContent) {
      setLoadingStep(0);
      stepInterval = setInterval(() => {
        setLoadingStep((prev) => (prev + 1) % LOADING_STEPS.length);
      }, 2500);
    }
    return () => clearInterval(stepInterval);
  }, [isGenerating, generatedContent]);

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setGeneratedContent("");
    setDisplayedContent("");
    setScriptId(null);

    try {
      const response = await fetch(`${API_URL}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt,
          product_name: null,
          industry: industry || null,
          tones: tones.length > 0 ? tones : null,
          duration: "45 seconds",
          ad_type: "TVC",
          turbo: true,
          dialect: dialect !== "standard" ? dialect : null
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || `Server error (${response.status})`);
      }

      const data = await response.json();

      // Handle Quota Warnings
      if (data.warning === "CRITICAL_QUOTA_EXHAUSTED") {
        toast.error("AI quota exhausted for the day. Please come back later.");
      } else if (data.warning) {
        toast.warning(data.warning);
      }

      const script = data.script || data.result || "No script was generated. Please try again.";
      setGeneratedContent(script);
      if (data.db_id) setScriptId(data.db_id);

    } catch (err: any) {
      setIsGenerating(false);
      toast.error(err.message || "Failed to connect to backend. Is the server running?");
    }
  }, [prompt, tones, industry, dialect]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(file.type)) {
      toast.error("Only PDF and DOCX files are allowed.");
      return;
    }

    setIsUploading(true);
    try {
      // 1. Upload to Supabase
      const fileName = `${Date.now()}_${file.name}`;
      const { data, error } = await supabase.storage
        .from('uploaded_briefs')
        .upload(fileName, file);

      if (error) throw error;

      // 2. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('uploaded_briefs')
        .getPublicUrl(fileName);

      // 3. Call Backend to Parse
      const response = await fetch(`${API_URL}/parse-document`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ file_url: publicUrl }),
      });

      if (!response.ok) throw new Error("Failed to parse document");

      const { text } = await response.json();

      // 4. Append to Prompt
      setPrompt(prev => prev + `\n\n[Attached Context from ${file.name}]:\n${text}`);
      toast.success("Document attached and parsed successfully!");

    } catch (err: any) {
      console.error("Upload failed:", err);
      toast.error(err.message || "Failed to upload/parse document.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = ""; // Reset input
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleGenerate();
    }
  };

  return (
    <div className="min-h-screen gradient-bg">
      {/* Header */}
      <header className="border-b border-border glass-header bg-primary text-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center">
              <img
                src="/lekhai_dark.png"
                alt="Lekh.ai Logo"
                className="w-6 h-6"
              />
            </div>
            <h1 className="text-xl font-bold tracking-tight font-mono text-primary-foreground">Lekh.ai</h1>
          </div>
          <div className="flex items-center gap-4">
            <p className="text-sm hidden sm:block font-sans text-primary-foreground/80">
              Agency-grade Bengali ad scripts in seconds
            </p>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Hero text */}
        <div className="mb-8 max-w-2xl">
          <h2 className="text-3xl font-bold text-foreground tracking-tight mb-3 font-mono sm:text-3xl">
            Write scripts that <RotatingWord />{" "}Bangladeshi.
          </h2>
          <p className="text-muted-foreground text-base leading-relaxed font-sans font-light">
            Enter your prompt, configure your tone and industry, and let the hybrid structural engine generate storyboard-ready scripts.
          </p>
        </div>

        {/* Input Section */}
        <div className="glass rounded-xl shadow-sm p-4 sm:p-6 border-2 border-primary/30 hover:border-primary/60 transition-all duration-300 hover:shadow-lg relative z-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Prompt textarea */}
            <div className="lg:col-span-7 relative flex flex-col">
              <label className="block text-sm font-medium text-foreground mb-1.5 font-mono">
                Campaign Brief / Prompt
              </label>
              <div className="relative flex-1">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="e.g. Write a 45-second TVC script for a mobile financial service targeting rural youth..."
                  className="w-full h-full min-h-[160px] resize-none rounded-md border border-input bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-primary/50 transition-all duration-200 pr-10"
                />

                {/* Bottom-right action buttons */}
                <div className="absolute bottom-3 right-3 flex items-center gap-1">
                  <DialectSelector selected={dialect} onChange={setDialect} />
                  <BrandAnalyzer onApplyDNA={handleApplyDNA} />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading || isGenerating}
                    className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors disabled:opacity-50"
                    title="Attach Context (PDF/DOCX)"
                  >
                    {isUploading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Paperclip className="w-5 h-5" />
                    )}
                  </button>
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                  accept=".pdf,.docx"
                />
              </div>
            </div>

            {/* Dropdowns + button in a stacked column */}
            <div className="lg:col-span-5 flex flex-col gap-3">
              <ToneSelector selected={tones} onChange={setTones} />
              <IndustrySelector selected={industry} onChange={setIndustry} />
              <button
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim()}
                className={`w-full rounded-md px-4 py-2.5 text-sm font-semibold transition-all duration-200
                  ${isGenerating ?
                    "bg-primary/80 text-primary-foreground animate-pulse-generate cursor-wait" :
                    "bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-md hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none"}
                  focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2`
                }>

                {isGenerating ?
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" strokeWidth={1.5} />
                    {LOADING_STEPS[loadingStep]}
                  </span> :

                  "Generate Script"
                }
              </button>
            </div>
          </div>
        </div>

        {/* Output Section */}
        <OutputDisplay
          content={generatedContent}
          isGenerating={isGenerating}
          displayedContent={displayedContent}
          scriptId={scriptId}
        />

      </main>
    </div>
  );
};

export default Index;
// Force HMR Update: Super Glass Mode Enabled