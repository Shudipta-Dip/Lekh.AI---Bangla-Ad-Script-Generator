import React, { useState, useCallback, useRef, useEffect } from "react";
import { Loader2, Sparkles } from "lucide-react";
import ToneSelector from "@/components/ToneSelector";
import IndustrySelector from "@/components/IndustrySelector";
import OutputDisplay, { MOCK_MARKDOWN } from "@/components/OutputDisplay";
import ThemeToggle from "@/components/ThemeToggle";
import RotatingWord from "@/components/RotatingWord";

const Index = () => {
  const [prompt, setPrompt] = useState("");
  const [tones, setTones] = useState<string[]>([]);
  const [industry, setIndustry] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState("");
  const [displayedContent, setDisplayedContent] = useState("");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Simulate typing effect
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

  const handleGenerate = useCallback(() => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setGeneratedContent("");
    setDisplayedContent("");

    // Simulate backend delay, then start typing
    setTimeout(() => {
      setGeneratedContent(MOCK_MARKDOWN);
    }, 800);
  }, [prompt]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleGenerate();
    }
  };

  return (
    <div className="min-h-screen gradient-bg">
      {/* Header */}
      <header className="border-b border-border glass-header bg-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-primary-foreground text-primary">
              <Sparkles className="w-4 h-4 bg-primary text-primary-foreground" strokeWidth={1.5} />
            </div>
            <h1 className="text-xl font-bold tracking-tight font-mono bg-primary text-primary-foreground">Lekh.ai</h1>
          </div>
          <div className="flex items-center gap-4">
            <p className="text-sm hidden sm:block font-sans text-primary-foreground/80 bg-[#f1464f]">
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
        <div className="glass rounded-xl shadow-sm p-4 sm:p-6 border-2 border-primary/30 hover:border-primary/60 transition-all duration-300 hover:shadow-lg">
          {/* Desktop: side-by-side layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Prompt textarea */}
            <div className="lg:col-span-7">
              <label className="block text-sm font-medium text-foreground mb-1.5 font-mono">
                Campaign Brief / Prompt
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="e.g. Write a 45-second TVC script for a mobile financial service targeting rural youth..."
                className="w-full h-28 lg:h-[calc(100%-2rem)] lg:min-h-[120px] lg:max-h-[200px] resize-none rounded-md border border-input bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-primary/50 transition-all duration-200 my-[2px]" />

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
                    Generating...
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
          displayedContent={displayedContent} />

      </main>
    </div>);

};

export default Index;