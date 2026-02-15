import React, { useState } from "react";
import { Dna, Check, Loader2, X } from "lucide-react";
import { toast } from "sonner";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";


export interface StructureInfo {
    emoji_usage: string;
    sentence_length: string;
    hashtag_style: string;
}

export interface AnalysisResult {
    tone: string;
    tone_explanation: string;
    keywords: string[];
    keywords_explanation: string;
    structure: StructureInfo;
    structure_explanation: string;
    banglish_vs_bangla: string;
    banglish_explanation: string;
    language_style: string;
    hook_style: string;
}

interface BrandAnalyzerProps {
    onApplyDNA: (dna: AnalysisResult) => void;
}

const BrandAnalyzer: React.FC<BrandAnalyzerProps> = ({ onApplyDNA }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [url, setUrl] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<AnalysisResult | null>(null);

    const handleAnalyze = async () => {
        if (!url.trim()) {
            toast.error("Please enter a valid Facebook Page URL");
            return;
        }

        setIsLoading(true);
        setResult(null);

        try {
            const response = await fetch(`${API_URL}/analyze-brand`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url }),
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.detail || "Analysis failed");
            }

            const data = await response.json();
            setResult(data);
            toast.success("Brand DNA extracted successfully!");
        } catch (err: any) {
            toast.error(err.message || "Failed to analyze brand");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleApply = () => {
        if (!result) return;
        onApplyDNA(result);
        toast.success("Brand Persona applied!");

        setIsOpen(false);
    };

    return (
        <>
            {/* Trigger Button — sits beside the Paperclip */}
            <button
                onClick={() => setIsOpen(true)}
                className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                title="Brand Voice DNA Analyzer"
                type="button"
            >
                <Dna className="w-5 h-5" />
            </button>

            {/* Popup Overlay */}
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Panel */}
                    <div className="relative z-10 w-full max-w-lg mx-auto bg-background border border-primary/30 rounded-xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
                        {/* Close Button */}
                        <button
                            onClick={() => setIsOpen(false)}
                            className="absolute top-3 right-3 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                            type="button"
                        >
                            <X className="w-4 h-4" />
                        </button>

                        {/* Header */}
                        <div className="flex items-center gap-2 mb-4">
                            <Dna className="w-5 h-5 text-primary" />
                            <h3 className="text-sm font-bold text-foreground">Brand Voice DNA Analyzer</h3>
                        </div>

                        {/* URL Input */}
                        <div className="flex gap-2 mb-4">
                            <input
                                type="text"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                placeholder="Paste Facebook Page URL..."
                                className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                            <button
                                onClick={handleAnalyze}
                                disabled={isLoading}
                                className="bg-primary text-primary-foreground px-3 py-2 rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center gap-1.5 transition-all whitespace-nowrap"
                                type="button"
                            >
                                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Dna className="w-4 h-4" />}
                                {isLoading ? "Analyzing..." : "Analyze"}
                            </button>
                        </div>

                        {/* Results */}
                        {result && (
                            <div className="space-y-3">
                                {/* Summary Badges */}
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div className="p-2 rounded bg-primary/5 border border-primary/10">
                                        <span className="text-muted-foreground text-xs block">Tone</span>
                                        <span className="font-medium text-primary text-xs">{result.tone}</span>
                                    </div>
                                    <div className="p-2 rounded bg-primary/5 border border-primary/10">
                                        <span className="text-muted-foreground text-xs block">Language</span>
                                        <span className="font-medium text-xs">{result.banglish_vs_bangla}</span>
                                    </div>
                                    <div className="p-2 rounded bg-primary/5 border border-primary/10">
                                        <span className="text-muted-foreground text-xs block">Hook Style</span>
                                        <span className="font-medium text-xs">{result.hook_style}</span>
                                    </div>
                                    <div className="p-2 rounded bg-primary/5 border border-primary/10">
                                        <span className="text-muted-foreground text-xs block">Emoji</span>
                                        <span className="font-medium text-xs">{result.structure.emoji_usage}</span>
                                    </div>
                                </div>

                                {/* Keywords */}
                                <div>
                                    <span className="text-muted-foreground text-xs block mb-1">Keywords</span>
                                    <div className="flex flex-wrap gap-1">
                                        {result.keywords.map((kw, i) => (
                                            <span
                                                key={i}
                                                className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs border border-primary/20"
                                            >
                                                {kw}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {/* Explanations */}
                                <div className="space-y-2 pt-2 border-t border-primary/10 text-xs">
                                    <div>
                                        <h4 className="font-semibold text-foreground mb-0.5">🎯 Tone</h4>
                                        <p className="text-muted-foreground leading-relaxed">{result.tone_explanation}</p>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-foreground mb-0.5">🔑 Keywords</h4>
                                        <p className="text-muted-foreground leading-relaxed">{result.keywords_explanation}</p>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-foreground mb-0.5">📐 Structure</h4>
                                        <div className="grid grid-cols-3 gap-1 mb-1 text-xs">
                                            <div>
                                                <span className="text-muted-foreground block">Sentences</span>
                                                <span className="font-medium">{result.structure.sentence_length}</span>
                                            </div>
                                            <div>
                                                <span className="text-muted-foreground block">Emoji</span>
                                                <span className="font-medium">{result.structure.emoji_usage}</span>
                                            </div>
                                            <div>
                                                <span className="text-muted-foreground block">Hashtags</span>
                                                <span className="font-medium">{result.structure.hashtag_style}</span>
                                            </div>
                                        </div>
                                        <p className="text-muted-foreground leading-relaxed">{result.structure_explanation}</p>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-foreground mb-0.5">
                                            🌐 Language: <span className="text-primary">{result.banglish_vs_bangla}</span>
                                        </h4>
                                        <p className="text-muted-foreground leading-relaxed">{result.banglish_explanation}</p>
                                    </div>
                                </div>

                                {/* Apply Button */}
                                <button
                                    onClick={handleApply}
                                    className="w-full mt-2 bg-primary hover:bg-primary/90 text-primary-foreground py-2 rounded-md text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                                    type="button"
                                >
                                    <Check className="w-4 h-4" /> Apply Persona
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
};

export default BrandAnalyzer;
