import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Sparkles,
  Wand2,
  MessageSquare,
  Lightbulb,
  TrendingUp,
  Zap,
  ArrowLeft,
  Send,
  Copy,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/instagram/ai")({
  head: () => ({
    meta: [
      { title: "AI Assistant — Instagram Creator Studio" },
      { name: "description", content: "AI-powered content suggestions and optimization" },
    ],
  }),
  component: InstagramAIAssistant,
});

function InstagramAIAssistant() {
  const [prompt, setPrompt] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);

  const handleGenerate = () => {
    setSuggestions([
      {
        id: 1,
        type: "caption",
        title: "Engaging Caption",
        content:
          "Join us for an inspiring journey of faith and worship. Share your story with our community. 🙏✨ #Worship #Faith #Community",
      },
      {
        id: 2,
        type: "hashtags",
        title: "Trending Hashtags",
        content:
          "#Worship #ChristianCommunity #FaithJourney #SpiritualGrowth #Praise #BibleVerses #ChristianMusic #Inspiration",
      },
      {
        id: 3,
        type: "timing",
        title: "Best Time to Post",
        content:
          "Post on Tuesday at 7:30 PM for maximum engagement based on your audience activity.",
      },
    ]);
  };

  return (
    <main className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/instagram" className="p-2 hover:bg-card rounded-lg transition">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="font-display text-2xl font-bold">AI Assistant</h1>
              <p className="text-xs text-muted-foreground">AI-powered content suggestions</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* AI Input */}
            <div className="p-6 rounded-xl border border-border bg-card/40 space-y-4">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[color:var(--gold)]" />
                Content Generator
              </h3>
              <textarea
                placeholder="Describe your content... e.g., 'Morning worship session with inspiring music'"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={4}
                className="w-full px-4 py-2 rounded-lg border border-border bg-background/50 focus:outline-none focus:border-[color:var(--gold)] resize-none"
              />
              <button
                onClick={handleGenerate}
                className="w-full px-4 py-3 rounded-lg bg-[color:var(--gold)] hover:bg-[color:var(--gold)]/90 text-background font-bold transition flex items-center justify-center gap-2"
              >
                <Wand2 className="w-4 h-4" />
                Generate Suggestions
              </button>
            </div>

            {/* Suggestions */}
            {suggestions.length > 0 && (
              <div className="space-y-4">
                {suggestions.map((suggestion) => (
                  <div
                    key={suggestion.id}
                    className="p-6 rounded-xl border border-border bg-card/40 space-y-4"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-bold mb-2">{suggestion.title}</h4>
                        <p className="text-sm text-muted-foreground">{suggestion.content}</p>
                      </div>
                      <button className="p-2 hover:bg-background rounded transition">
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex gap-2 pt-2 border-t border-border">
                      <button className="flex-1 px-3 py-2 rounded-lg border border-border hover:bg-card transition text-sm font-medium flex items-center justify-center gap-2">
                        <ThumbsUp className="w-4 h-4" />
                        Helpful
                      </button>
                      <button className="flex-1 px-3 py-2 rounded-lg border border-border hover:bg-card transition text-sm font-medium flex items-center justify-center gap-2">
                        <ThumbsDown className="w-4 h-4" />
                        Not Helpful
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="p-4 rounded-xl border border-border bg-card/40 space-y-4">
              <h3 className="font-bold flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-[color:var(--gold)]" />
                Quick Tips
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex gap-2">
                  <span className="text-[color:var(--gold)]">•</span>
                  <span>Use specific keywords for better results</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-[color:var(--gold)]">•</span>
                  <span>Mention your target audience</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-[color:var(--gold)]">•</span>
                  <span>Include content type (video, reel, story)</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-[color:var(--gold)]">•</span>
                  <span>Describe the mood or tone you want</span>
                </li>
              </ul>
            </div>

            <div className="p-4 rounded-xl border border-border bg-card/40 space-y-4">
              <h3 className="font-bold flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[color:var(--gold)]" />
                Trending Topics
              </h3>
              <div className="space-y-2">
                {["#Worship", "#Faith", "#Community", "#Inspiration"].map((tag) => (
                  <button
                    key={tag}
                    className="w-full text-left px-3 py-2 rounded-lg border border-border hover:bg-card transition text-sm font-medium"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-xl border border-border bg-[color:var(--gold)]/10">
              <p className="text-xs font-medium mb-2">💡 Pro Tip</p>
              <p className="text-xs text-muted-foreground">
                The more details you provide, the better AI suggestions you'll get.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
