import React, { useState, useRef, useEffect } from "react";
import { Check } from "lucide-react";

interface IndustrySelectorProps {
  selected: string | null;
  onChange: (industry: string | null) => void;
}

const INDUSTRIES = [
  "FMCG",
  "Fashion & Apparel",
  "Consumer Electronics",
  "Real Estate & Construction",
  "Financial Services",
  "Healthcare & Pharma",
  "Education & EdTech",
  "E-commerce & Logistics",
  "Industrial & Manufacturing",
  "Travel & Hospitality",
];

const IndustrySelector: React.FC<IndustrySelectorProps> = ({ selected, onChange }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const select = (industry: string) => {
    onChange(selected === industry ? null : industry);
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative w-full">
      <label className="block text-sm font-medium text-foreground mb-1.5">
        Industry <span className="text-muted-foreground font-normal">(Optional)</span>
      </label>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between rounded-md border border-input px-3 py-2.5 text-sm bg-card text-left transition-all focus:outline-none focus:ring-1 focus:ring-ring"
      >
        <span className={selected ? "text-foreground" : "text-muted-foreground"}>
          {selected || "Select Industry..."}
        </span>
        <svg className={`w-4 h-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-card border border-input rounded-md shadow-md max-h-56 overflow-y-auto">
          {INDUSTRIES.map((ind) => (
            <button
              key={ind}
              type="button"
              onClick={() => select(ind)}
              className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between hover:bg-accent transition-colors
                ${selected === ind ? "text-primary font-medium" : "text-foreground"}`}
            >
              {ind}
              {selected === ind && <Check className="w-4 h-4 text-primary" strokeWidth={1.5} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default IndustrySelector;
