import React, { useState, useRef, useEffect } from "react";
import { Check, X } from "lucide-react";

interface ToneSelectorProps {
  selected: string[];
  onChange: (tones: string[]) => void;
}

const TONES = [
  "Empowering",
  "Professional",
  "Warm & Nostalgic",
  "Heartfelt",
  "Humorous",
  "Trendy/Gen-Z",
  "Dramatic",
  "Informative/Instructional",
  "Sophisticated/Luxurious",
];

const ToneSelector: React.FC<ToneSelectorProps> = ({ selected, onChange }) => {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggle = (tone: string) => {
    if (selected.includes(tone)) {
      onChange(selected.filter((t) => t !== tone));
      setError(false);
    } else if (selected.length < 2) {
      onChange([...selected, tone]);
      setError(false);
    } else {
      setError(true);
      setTimeout(() => setError(false), 1500);
    }
  };

  const remove = (tone: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selected.filter((t) => t !== tone));
  };

  return (
    <div ref={ref} className="relative w-full">
      <label className="block text-sm font-medium text-foreground mb-1.5">
        Tone <span className="text-muted-foreground font-normal">(Max 2, Optional)</span>
      </label>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center justify-between rounded-md border px-3 py-2.5 text-sm bg-card text-left transition-all
          ${error ? "border-destructive animate-shake" : "border-input"}
          focus:outline-none focus:ring-1 focus:ring-ring`}
      >
        <div className="flex flex-wrap gap-1.5 flex-1 min-h-[20px]">
          {selected.length === 0 && (
            <span className="text-muted-foreground">Select Tone...</span>
          )}
          {selected.map((t) => (
            <span
              key={t}
              className="inline-flex items-center gap-1 bg-primary/10 text-primary rounded px-2 py-0.5 text-xs font-medium"
            >
              {t}
              <X className="w-3 h-3 cursor-pointer" strokeWidth={1.5} onClick={(e) => remove(t, e)} />
            </span>
          ))}
        </div>
        <svg className={`w-4 h-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {error && (
        <p className="text-destructive text-xs mt-1 font-medium">Maximum of 2 tones can be selected.</p>
      )}
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-card border border-input rounded-md shadow-md max-h-56 overflow-y-auto">
          {TONES.map((tone) => {
            const isSelected = selected.includes(tone);
            return (
              <button
                key={tone}
                type="button"
                onClick={() => toggle(tone)}
                className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between hover:bg-accent transition-colors
                  ${isSelected ? "text-primary font-medium" : "text-foreground"}`}
              >
                {tone}
                {isSelected && <Check className="w-4 h-4 text-primary" strokeWidth={1.5} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ToneSelector;
