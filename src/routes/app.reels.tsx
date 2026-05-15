import { createFileRoute } from "@tanstack/react-router";
import { Heart, MessageCircle, Share2, Music2, Cross } from "lucide-react";
import heroImg from "@/assets/hero-worship.jpg";

export const Route = createFileRoute("/app/reels")({ component: ReelsPage });

function ReelsPage() {
  return (
    <div className="relative h-[calc(100vh-92px)] overflow-hidden bg-black -mt-px">
      {/* Reel video */}
      <img src={heroImg} alt="" className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40" />

      {/* Top tabs */}
      <div className="absolute top-4 inset-x-0 flex items-center justify-center gap-6 text-sm z-20">
        <span className="text-muted-foreground">Following</span>
        <span className="text-foreground font-medium relative">
          For You
          <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[color:var(--gold)]" />
        </span>
      </div>

      {/* Right rail */}
      <div className="absolute right-3 bottom-32 z-20 flex flex-col items-center gap-5 text-white">
        <div className="flex flex-col items-center gap-1">
          <Heart className="w-7 h-7 text-[color:var(--gold)] fill-[color:var(--gold)]" />
          <span className="text-[10px]">28.4K</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <MessageCircle className="w-7 h-7" />
          <span className="text-[10px]">1.2K</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <Share2 className="w-7 h-7" />
          <span className="text-[10px]">Share</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <Cross className="w-7 h-7 text-[color:var(--gold)]" />
          <span className="text-[10px]">Pray</span>
        </div>
      </div>

      {/* Bottom info */}
      <div className="absolute bottom-6 left-4 right-20 z-20 text-white">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-gold-gradient" />
          <span className="text-sm font-medium">@enoshkumar</span>
          <button className="ml-1 text-[10px] px-3 py-1 rounded-full border border-white/40">Follow</button>
        </div>
        <p className="text-sm leading-snug">"Be still and know that I am God." — Psalm 46:10 🙌</p>
        <div className="flex items-center gap-1.5 mt-2 text-[11px] text-white/70">
          <Music2 className="w-3 h-3" /> Yesayya · Telugu Worship Collective
        </div>
      </div>
    </div>
  );
}
