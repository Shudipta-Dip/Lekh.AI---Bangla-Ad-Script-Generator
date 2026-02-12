import React, { useState, useCallback, useRef, useEffect } from "react";
import { Loader2, Sparkles } from "lucide-react";
import ToneSelector from "@/components/ToneSelector";
import IndustrySelector from "@/components/IndustrySelector";
import OutputDisplay, { MOCK_MARKDOWN } from "@/components/OutputDisplay";

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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-primary-foreground text-primary">
              <Sparkles className="w-4 h-4 bg-primary text-primary-foreground" strokeWidth={1.5} />
            </div>
            <h1 className="text-xl font-bold tracking-tight font-mono bg-primary text-primary-foreground">Lekh.ai</h1>
          </div>
          <p className="text-sm hidden sm:block font-sans text-primary-foreground">
            Agency-grade Bengali ad scripts in seconds
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Hero text */}
        <div className="mb-8 max-w-2xl">
          <h2 className="text-3xl font-bold text-foreground tracking-tight mb-3 font-mono sm:text-3xl">
            Write scripts that <span className="text-primary">feel</span> Bangladeshi.
          </h2>
          <p className="text-muted-foreground text-base leading-relaxed font-sans font-light">
            Enter your prompt, configure your tone and industry, and let the hybrid structural engine generate storyboard-ready scripts.
          </p>
        </div>

        {/* Input Section */}
        <div className="bg-card border border-border rounded-xl shadow-sm p-4 sm:p-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Prompt textarea */}
            <div className="lg:col-span-6">
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Campaign Brief / Prompt
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="e.g. Write a 45-second TVC script for a mobile financial service targeting rural youth..."
                className="w-full h-28 sm:h-32 resize-none rounded-md border border-input bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-all" />

            </div>

            {/* Dropdowns */}
            <div className="lg:col-span-4 flex flex-col gap-4">
              <ToneSelector selected={tones} onChange={setTones} />
              <IndustrySelector selected={industry} onChange={setIndustry} />
            </div>

            {/* Generate button */}
            <div className="lg:col-span-2 flex items-end">
              <button
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim()}
                className={`w-full rounded-md px-4 py-2.5 text-sm font-semibold transition-all
                  ${isGenerating ?
                "bg-primary/80 text-primary-foreground animate-pulse-generate cursor-wait" :
                "bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"}
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