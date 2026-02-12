import React, { useState, useEffect, useCallback } from "react";

const WORDS = ["feel", "read", "sound"];
const TYPING_SPEED = 120;
const BACKSPACE_SPEED = 80;
const PAUSE_BEFORE_DELETE = 2000;
const PAUSE_BEFORE_TYPE = 400;

const RotatingWord: React.FC = () => {
  const [wordIndex, setWordIndex] = useState(0);
  const [displayed, setDisplayed] = useState("feel");
  const [phase, setPhase] = useState<"pause" | "deleting" | "waiting" | "typing">("pause");

  useEffect(() => {
    const word = WORDS[wordIndex];

    if (phase === "pause") {
      const t = setTimeout(() => setPhase("deleting"), PAUSE_BEFORE_DELETE);
      return () => clearTimeout(t);
    }

    if (phase === "deleting") {
      if (displayed.length === 0) {
        setPhase("waiting");
        return;
      }
      const t = setTimeout(() => setDisplayed((d) => d.slice(0, -1)), BACKSPACE_SPEED);
      return () => clearTimeout(t);
    }

    if (phase === "waiting") {
      const nextIdx = (wordIndex + 1) % WORDS.length;
      setWordIndex(nextIdx);
      const t = setTimeout(() => setPhase("typing"), PAUSE_BEFORE_TYPE);
      return () => clearTimeout(t);
    }

    if (phase === "typing") {
      if (displayed.length === word.length) {
        setPhase("pause");
        return;
      }
      const t = setTimeout(() => setDisplayed(word.slice(0, displayed.length + 1)), TYPING_SPEED);
      return () => clearTimeout(t);
    }
  }, [phase, displayed, wordIndex]);

  return (
    <span className="text-primary inline-flex items-baseline">
      <span className="min-w-[3ch]">{displayed}</span>
      <span className="inline-block w-[2px] h-[0.85em] bg-primary animate-cursor ml-0.5 translate-y-[1px]" />
    </span>
  );
};

export default RotatingWord;
