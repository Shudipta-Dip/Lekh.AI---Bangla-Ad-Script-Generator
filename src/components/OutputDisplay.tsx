import React, { useState } from "react";
import { Copy, FileText, Download, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import SkeletonLoader from "./SkeletonLoader";

export const MOCK_MARKDOWN = `# কনসেপ্ট: সীমানার ছাড়িয়ে (Beyond Boundaries)

**পটভূমি:** একটি পাহাড়ের ভিলেজের প্রাকৃতিক পরিবেশ। একজন তরুণ ফ্রিল্যান্সার তার ল্যাপটপ নিয়ে বসে আছে।

| Scene | Visual | Audio / Dialogue |
|-------|--------|-----------------|
| Scene 1 | **ওয়াইড শট:** অনিক তার ল্যাপটপে টাইপ করছে। সামনে জটিল কোড ও ডিজাইন ফ্রেমওয়ার্ক দেখা যাচ্ছে। ব্যাকগ্রাউন্ডে সাউন্ড অব নেচার। | **VO:** অনিক মানেই কি ক্রিয়েটিভিটি? মানেই কি একটা এক্সিজিমা? |
| Scene 2 | **ক্লোজ আপ:** ল্যাপটপের স্ক্রিন ডিজাইন। অনিক এক হাতে ল্যাপটপ ধরে উঠে দাঁড়িয়ে হাঁটা শুরু করে। | **VO:** যখন হাতের মুঠোয়, তখন পুরো পৃথিবীটাই আমার ওয়ার্কস্পেস। |
| Scene 3 | **ড্রোন শট:** পাহাড়ের উপর থেকে গ্রামের দৃশ্য। অনিক পাথরের উপর বসে কাজ করছে। | **SFX:** ইন্সপায়ারিং মিউজিক বিল্ড আপ। |
| Scene 4 | **মিড শট:** অনিক ভিডিও কলে ক্লায়েন্টকে প্রেজেন্টেশন দিচ্ছে, পেছনে পাহাড়। | **Dialogue:** "স্যার, আপনার ক্যাম্পেইনের ড্রাফট রেডি। দেখুন।" |
| Scene 5 | **প্যাকশট:** ব্র্যান্ড লোগো সুপার। ট্যাগলাইন আসে। | **VO:** সীমানার ছাড়িয়ে। আপনার গল্প, আপনার মতো। **Lekh.ai** |

---

**Duration:** 45 seconds (TVC) / 30 seconds (Digital Cut)
**Target:** Young professionals, creative freelancers
**CTA:** Visit lekh.ai — আপনার স্ক্রিপ্ট, আপনার ভাষায়।`;

function markdownToHtml(md: string): string {
  // Apply inline formatting first, but NOT \n\n yet
  let processed = md
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/^---$/gm, "<hr/>");

  const lines = processed.split("\n");
  let inTable = false;
  let isHeaderRow = true;
  let result = "";

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      // Skip separator rows like |---|---|---|
      if (trimmed.match(/^\|[\s\-:|]+\|$/)) continue;

      const cells = trimmed.split("|").filter(Boolean).map((c) => c.trim());
      if (cells.length === 0) continue;

      if (!inTable) {
        result += '<table class="script-table">';
        inTable = true;
        isHeaderRow = true;
      }

      if (isHeaderRow) {
        result += "<thead><tr>" + cells.map((c) => `<th>${c}</th>`).join("") + "</tr></thead><tbody>";
        isHeaderRow = false;
      } else {
        result += "<tr>" + cells.map((c) => `<td>${c}</td>`).join("") + "</tr>";
      }
    } else {
      if (inTable) {
        result += "</tbody></table>";
        inTable = false;
      }
      if (trimmed === "") {
        result += "<br/>";
      } else {
        result += line + "\n";
      }
    }
  }
  if (inTable) result += "</tbody></table>";
  return result;
}

interface OutputDisplayProps {
  content: string;
  isGenerating: boolean;
  displayedContent: string;
}

const OutputDisplay: React.FC<OutputDisplayProps> = ({ content, isGenerating, displayedContent }) => {
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const showSkeleton = isGenerating && !displayedContent;

  const handleCopy = async () => {
    const plainText = content.replace(/[#*|_\-]/g, "").replace(/\n{3,}/g, "\n\n");
    await navigator.clipboard.writeText(plainText);
    setCopiedType("copy");
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopiedType(null), 2000);
  };

  const handleCopyMarkdown = async () => {
    await navigator.clipboard.writeText(content);
    setCopiedType("markdown");
    toast.success("Copied as Markdown!");
    setTimeout(() => setCopiedType(null), 2000);
  };

  const handleDownloadWord = () => {
    const htmlContent = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head><meta charset='utf-8'><title>Lekh.ai Script</title>
<style>body{font-family:'Hind Siliguri',sans-serif;font-size:14px;line-height:1.6}table{border-collapse:collapse;width:100%}td,th{border:1px solid #ccc;padding:8px;text-align:left}th{background:#f4f4f4;font-weight:600}h1{font-size:20px}h2{font-size:16px}</style></head>
<body>${markdownToHtml(content)}</body></html>`;
    const blob = new Blob([htmlContent], { type: "application/msword" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "lekhai-script.doc";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Downloaded as Word document!");
  };

  if (!content && !isGenerating) return null;

  return (
    <div className="relative bg-card border border-border rounded-xl shadow-sm p-6 mt-6 animate-fade-in">
      {/* Action icons - top right */}
      {content && !isGenerating && (
        <div className="absolute top-4 right-4 flex gap-1.5">
          {[
            { action: handleCopy, type: "copy", icon: Copy, label: "Copy" },
            { action: handleCopyMarkdown, type: "markdown", icon: FileText, label: "Copy as Markdown" },
            { action: handleDownloadWord, type: "download", icon: Download, label: "Download as Word" },
          ].map(({ action, type, icon: Icon, label }) => (
            <button
              key={type}
              onClick={action}
              className="p-2 rounded-md hover:bg-accent transition-all duration-200 opacity-40 hover:opacity-100 hover:scale-110 group relative"
              title={label}
            >
              {copiedType === type ? (
                <CheckCircle2 className="w-4 h-4 text-success" strokeWidth={1.5} />
              ) : (
                <Icon className="w-4 h-4 text-foreground" strokeWidth={1.5} />
              )}
              <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                {label}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Skeleton loader */}
      {showSkeleton && <SkeletonLoader />}

      {/* Content area */}
      {displayedContent && (
        <div
          className="font-bengali text-base leading-relaxed prose prose-sm max-w-none
            [&_.script-table]:w-full [&_.script-table]:border-collapse [&_.script-table]:my-4
            [&_td]:border [&_td]:border-border [&_td]:px-3 [&_td]:py-2.5 [&_td]:text-sm [&_td]:align-top
            [&_th]:border [&_th]:border-border [&_th]:px-3 [&_th]:py-2.5 [&_th]:text-sm [&_th]:bg-muted [&_th]:font-semibold [&_th]:text-left
            [&_h1]:text-xl [&_h1]:font-bold [&_h1]:mb-3 [&_h1]:text-foreground
            [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:mb-2 [&_h2]:text-foreground
            [&_h3]:text-base [&_h3]:font-medium [&_h3]:mb-2 [&_h3]:text-foreground
            [&_strong]:font-semibold [&_strong]:text-foreground
            [&_hr]:my-4 [&_hr]:border-border
            [&_thead]:bg-muted
            [&_tr]:border-b [&_tr]:border-border"
          dangerouslySetInnerHTML={{ __html: markdownToHtml(displayedContent) }}
        />
      )}
      {isGenerating && displayedContent && (
        <span className="inline-block w-0.5 h-5 bg-primary animate-cursor ml-1 align-text-bottom" />
      )}
    </div>
  );
};

export default OutputDisplay;
