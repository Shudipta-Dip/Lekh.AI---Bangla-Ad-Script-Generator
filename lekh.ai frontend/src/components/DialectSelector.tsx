import React, { useState, useRef, useEffect } from "react";
import { Languages } from "lucide-react";

interface DialectSelectorProps {
    selected: string;
    onChange: (dialect: string) => void;
}

const DIALECTS = [
    { key: "standard", label: "শুদ্ধ বাংলা", sublabel: "Standard" },
    { key: "chatgaiya", label: "চাটগাঁইয়া", sublabel: "Chatgaiya" },
    { key: "sylhoti", label: "সিলটি", sublabel: "Sylhoti" },
    { key: "barishailla", label: "বরিশাইল্লা", sublabel: "Barishailla" },
];

const DialectSelector: React.FC<DialectSelectorProps> = ({ selected, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const popupRef = useRef<HTMLDivElement>(null);
    const btnRef = useRef<HTMLButtonElement>(null);

    // Close on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (
                popupRef.current && !popupRef.current.contains(e.target as Node) &&
                btnRef.current && !btnRef.current.contains(e.target as Node)
            ) {
                setIsOpen(false);
            }
        };
        if (isOpen) document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen]);

    const activeDialect = DIALECTS.find(d => d.key === selected) || DIALECTS[0];
    const isNonStandard = selected !== "standard";

    return (
        <div className="relative">
            <button
                ref={btnRef}
                onClick={() => setIsOpen(!isOpen)}
                className={`p-1.5 rounded-md transition-colors ${isNonStandard
                        ? "text-primary bg-primary/15 hover:bg-primary/25"
                        : "text-muted-foreground hover:text-primary hover:bg-primary/10"
                    }`}
                title={`Dialect: ${activeDialect.sublabel}`}
            >
                <Languages className="w-5 h-5" />
            </button>

            {isOpen && (
                <div
                    ref={popupRef}
                    className="absolute bottom-full right-0 mb-2 z-50 w-52 rounded-lg border border-border bg-popover shadow-xl p-1.5 animate-in fade-in-0 zoom-in-95"
                >
                    <div className="px-2 py-1.5 mb-1">
                        <p className="text-xs font-semibold text-foreground tracking-wide uppercase">Script Dialect</p>
                    </div>
                    {DIALECTS.map((d) => (
                        <button
                            key={d.key}
                            onClick={() => {
                                onChange(d.key);
                                setIsOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center justify-between ${selected === d.key
                                    ? "bg-primary/15 text-primary font-medium"
                                    : "text-foreground hover:bg-muted"
                                }`}
                        >
                            <span>
                                <span className="font-medium">{d.label}</span>
                                <span className="text-muted-foreground text-xs ml-1.5">({d.sublabel})</span>
                            </span>
                            {selected === d.key && (
                                <span className="text-primary text-xs">✓</span>
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default DialectSelector;
