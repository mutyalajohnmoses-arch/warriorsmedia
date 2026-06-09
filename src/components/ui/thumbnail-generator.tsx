import { useState } from "react";
import { Image, Upload, Sparkles, AlertTriangle, Eye, Loader2, Gift } from "lucide-react";
import { toast } from "sonner";

export function ThumbnailGenerator() {
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [openaiKey, setOpenaiKey] = useState("");
  const [showKeyInput, setShowKeyInput] = useState(false);

  // 1. Manual File Upload Handler
  const handleManualUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setThumbnailUrl(url);
      toast.success("Thumbnail uploaded manually!");
    }
  };

  // 2. Paid OpenAI (DALL-E 3) Generator with Error Handling
  const generateOpenAIThumbnail = async () => {
    if (!prompt) {
      toast.error("Please enter a prompt first!");
      return;
    }
    if (!openaiKey) {
      setShowKeyInput(true);
      toast.error("OpenAI API Key required! Enter key to proceed.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: "dall-e-3",
          prompt: prompt,
          n: 1,
          size: "1024x1024",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Checking for Payment or Quota Issues
        if (data.error?.code === "insufficient_quota" || data.error?.message?.includes("billing")) {
          throw new Error("OpenAI Payment Error: Your API account has insufficient funds. Please add payment/billing to your OpenAI dashboard.");
        }
        throw new Error(data.error?.message || "Failed to generate AI thumbnail.");
      }

      const generatedUrl = data.data[0].url;
      setThumbnailUrl(generatedUrl);
      toast.success("Premium OpenAI Thumbnail Generated!");
    } catch (error: any) {
      console.error(error);
      // Beautiful Custom Alert via Alert Box
      toast.error(error.message, { duration: 6000 });
      alert(`⚠️ API Error:\n\n${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Free AI Thumbnail Generator (Pollinations Engine - No Key Required!)
  const generateFreeAIThumbnail = () => {
    if (!prompt) {
      toast.error("Please enter a prompt first!");
      return;
    }
    setIsLoading(true);
    try {
      // Dynamic deterministic generation using encoded prompt parameters
      const cleanPrompt = encodeURIComponent(prompt);
      const seed = Math.floor(Math.random() * 100000);
      const freeImageUrl = `https://image.pollinations.ai/p/${cleanPrompt}?width=1280&height=720&seed=${seed}&nologo=true`;
      
      setThumbnailUrl(freeImageUrl);
      toast.success("Free AI Thumbnail Generated Successfully!");
    } catch (err) {
      toast.error("Free generation server timed out.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4 bg-zinc-900/40 p-4 rounded-xl border border-zinc-800/80 mt-4">
      <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block flex items-center gap-1.5">
        <Image className="w-3.5 h-3.5 text-purple-400" /> Stream Thumbnail Context
      </label>

      {/* Thumbnail Display Screen */}
      <div className="relative aspect-video w-full rounded-lg bg-zinc-950 border border-dashed border-zinc-800 flex flex-col items-center justify-center overflow-hidden group">
        {thumbnailUrl ? (
          <>
            <img src={thumbnailUrl} alt="Stream Thumbnail" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <label className="cursor-pointer bg-zinc-900 text-xs px-3 py-1.5 rounded-md border border-zinc-700 flex items-center gap-1 hover:bg-zinc-800 text-zinc-200">
                <Upload className="w-3 h-3" /> Change Image
                <input type="file" accept="image/*" className="hidden" onChange={handleManualUpload} />
              </label>
            </div>
          </>
        ) : (
          <div className="text-center p-4">
            <Upload className="w-6 h-6 text-zinc-600 mx-auto mb-2" />
            <p className="text-xs text-zinc-500">No thumbnail selected</p>
            <label className="mt-2 inline-block text-[11px] font-medium text-purple-400 cursor-pointer hover:underline">
              Browse Files Manually
              <input type="file" accept="image/*" className="hidden" onChange={handleManualUpload} />
            </label>
          </div>
        )}
      </div>

      {/* AI Generation Box */}
      <div className="space-y-2.5">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe your thumbnail prompt (e.g., Cinematic church worship background with soft neon glow...)"
          className="w-full h-16 rounded-lg bg-zinc-950 border border-zinc-800 p-2.5 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-purple-500/50 resize-none"
        />

        {/* OpenAI Key Drawer Toggle */}
        <div className="flex justify-between items-center">
          <button 
            type="button" 
            onClick={() => setShowKeyInput(!showKeyInput)}
            className="text-[10px] text-zinc-500 hover:text-zinc-400 underline"
          >
            {showKeyInput ? "Hide OpenAI Config" : "Setup OpenAI Key (Paid)"}
          </button>
        </div>

        {showKeyInput && (
          <input
            type="password"
            value={openaiKey}
            onChange={(e) => setOpenaiKey(e.target.value)}
            placeholder="sk-or-your-openai-api-key"
            className="w-full rounded-md bg-zinc-950 border border-zinc-800 p-2 text-xs font-mono text-zinc-300"
          />
        )}

        {/* Action Trigger Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            disabled={isLoading}
            onClick={generateFreeAIThumbnail}
            className="flex items-center justify-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-zinc-200 text-xs font-medium py-2 px-3 rounded-lg border border-zinc-700 transition"
          >
            <Gift className="w-3.5 h-3.5 text-green-400" />
            Generate Free AI
          </button>

          <button
            type="button"
            disabled={isLoading}
            onClick={generateOpenAIThumbnail}
            className="flex items-center justify-center gap-1.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-medium py-2 px-3 rounded-lg transition shadow-md shadow-purple-900/20"
          >
            {isLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            )}
            OpenAI DALL-E (Paid)
          </button>
        </div>
      </div>
    </div>
  );
}
