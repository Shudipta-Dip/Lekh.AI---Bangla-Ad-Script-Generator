import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import ToneSelector from "./ToneSelector";
import IndustrySelector from "./IndustrySelector";
import { Loader2, ArrowBigUpDash, FileText } from "lucide-react";

export function SubmitScriptModal() {
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form State
    const [script, setScript] = useState("");
    const [tones, setTones] = useState<string[]>([]);
    const [industry, setIndustry] = useState<string | null>(null);
    const [adType, setAdType] = useState<string>("TVC");
    const [duration, setDuration] = useState([60]); // Default 60s
    const [agency, setAgency] = useState("");

    const handleSubmit = async () => {
        // Validation
        if (!script.trim()) {
            toast.error("Please paste the script content.");
            return;
        }
        if (tones.length === 0) {
            toast.error("Please select at least one tone.");
            return;
        }
        if (!industry) {
            toast.error("Please select an industry.");
            return;
        }

        setIsSubmitting(true);

        try {
            const { error } = await supabase.from("community_scripts").insert({
                script_content: script,
                tones: tones,
                industry: industry,
                ad_type: adType,
                duration_seconds: duration[0],
                agency_name: agency || null,
                status: "pending",
            });

            if (error) throw error;

            toast.success("Script submitted successfully! Thank you for contributing.");
            setOpen(false);

            // Reset form
            setScript("");
            setTones([]);
            setIndustry(null);
            setAgency("");
            setDuration([60]);

        } catch (err: any) {
            console.error("Submission error:", err);
            toast.error(err.message || "Failed to submit script. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <DialogTrigger asChild>
                            <button
                                className="p-2 rounded-lg border border-border bg-card hover:bg-accent transition-all duration-200 hover:scale-105 group"
                                aria-label="Contribute script"
                            >
                                <ArrowBigUpDash className="w-4 h-4 text-foreground group-hover:text-primary transition-colors" strokeWidth={1.5} />
                            </button>
                        </DialogTrigger>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Contribute your script</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>

            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Submit a Script</DialogTitle>
                    <DialogDescription>
                        Contribute to the ever-growing crowdsourced Lekh.AI dataset. Your submission will help us propel the creative industry forward.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    {/* Script Content */}
                    <div className="space-y-2">
                        <Label htmlFor="script" className="text-right">
                            Script Content <span className="text-red-500">*</span>
                        </Label>
                        <Textarea
                            id="script"
                            placeholder="Paste the full ad script here..."
                            className="min-h-[200px] font-mono text-sm"
                            value={script}
                            onChange={(e) => setScript(e.target.value)}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Tone Selector */}
                        <div className="space-y-2">
                            <ToneSelector selected={tones} onChange={setTones} />
                        </div>

                        {/* Industry Selector */}
                        <div className="space-y-2">
                            <IndustrySelector selected={industry} onChange={setIndustry} />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Ad Type */}
                        <div className="space-y-2">
                            <Label>Ad Type <span className="text-red-500">*</span></Label>
                            <Select value={adType} onValueChange={setAdType}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="TVC">TVC (Television Commercial)</SelectItem>
                                    <SelectItem value="OVC">OVC (Online Video Commercial)</SelectItem>
                                    <SelectItem value="Dynamic">Dynamic / Social Media</SelectItem>
                                    <SelectItem value="Radio">Radio / Audio</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Duration Slider */}
                        <div className="space-y-4">
                            <div className="flex justify-between">
                                <Label>Duration</Label>
                                <span className="text-sm text-muted-foreground">{duration[0]} seconds</span>
                            </div>
                            <Slider
                                value={duration}
                                onValueChange={setDuration}
                                max={300}
                                step={5}
                                min={5}
                                className="py-2"
                            />
                            <div className="flex justify-between text-xs text-muted-foreground">
                                <span>5s</span>
                                <span>5 mins</span>
                            </div>
                        </div>
                    </div>

                    {/* Agency Name */}
                    <div className="space-y-2">
                        <Label htmlFor="agency">
                            Agency Name <span className="text-muted-foreground font-normal">(Optional, kept anonymous)</span>
                        </Label>
                        <Input
                            id="agency"
                            placeholder="e.g. Ogilvy, Havas, or Dentsu"
                            value={agency}
                            onChange={(e) => setAgency(e.target.value)}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={isSubmitting} className="gap-2">
                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                        Submit Script
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
