import { createFileRoute } from "@tanstack/react-router";
import {
  MessageSquare,
  Search,
  MoreVertical,
  Send,
  User,
  Image as ImageIcon,
  Smile,
  Mic,
} from "lucide-react";

export const Route = createFileRoute("/instagram/inbox")({
  component: InstagramInbox,
});

function InstagramInbox() {
  const conversations = [
    { id: 1, name: "Worship Leader", message: "Great reel! Let's collab soon.", time: "2m", unread: true },
    { id: 2, name: "Sarah Grace", message: "When is the next live session?", time: "1h", unread: false },
    { id: 3, name: "Creative Team", message: "Files are ready for review.", time: "3h", unread: false },
    { id: 4, name: "Music Studio", message: "Check out the new master track.", time: "1d", unread: false },
  ];

  return (
    <div className="h-full flex overflow-hidden">
      {/* Conversation List */}
      <div className="w-80 border-r border-border bg-card/20 flex flex-col">
        <div className="p-6 border-b border-border space-y-4">
          <h1 className="font-display text-2xl">Inbox</h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              placeholder="Search messages..."
              className="w-full bg-background/50 border border-border rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-pink-500/50 transition-colors"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.map((chat) => (
            <button key={chat.id} className="w-full p-4 flex items-center gap-4 hover:bg-accent/30 transition-colors border-b border-border/50 text-left group">
              <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center flex-shrink-0 border border-border">
                <User className="w-6 h-6 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold group-hover:text-pink-500 transition-colors">{chat.name}</span>
                  <span className="text-[10px] text-muted-foreground">{chat.time}</span>
                </div>
                <p className={`text-xs truncate ${chat.unread ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                  {chat.message}
                </p>
              </div>
              {chat.unread && <div className="w-2 h-2 rounded-full bg-pink-600 flex-shrink-0 shadow-lg shadow-pink-500/20" />}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-background/50">
        <header className="p-4 border-b border-border bg-card/40 backdrop-blur-md flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center border border-border">
              <User className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <h2 className="text-sm font-semibold">Worship Leader</h2>
              <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">Online</p>
            </div>
          </div>
          <button className="p-2 rounded-lg hover:bg-accent transition">
            <MoreVertical className="w-4 h-4" />
          </button>
        </header>

        <div className="flex-1 p-6 overflow-y-auto space-y-6">
          {/* Message Bubbles Simulation */}
          <div className="flex flex-col space-y-4">
            <div className="max-w-[70%] p-4 rounded-2xl rounded-bl-none bg-accent/50 border border-border text-sm">
              Hey John! I just saw your latest worship reel. The production quality is incredible.
            </div>
            <div className="self-end max-w-[70%] p-4 rounded-2xl rounded-br-none bg-pink-600 text-white text-sm shadow-lg shadow-pink-500/20">
              Thanks! We put a lot of work into the audio-visual sync this time.
            </div>
            <div className="max-w-[70%] p-4 rounded-2xl rounded-bl-none bg-accent/50 border border-border text-sm">
              It definitely shows. Let's collab soon!
            </div>
          </div>
        </div>

        <div className="p-4 bg-card/40 border-t border-border">
          <div className="flex items-center gap-3 bg-background/50 border border-border rounded-xl px-4 py-2">
            <button className="p-2 text-muted-foreground hover:text-pink-500 transition">
              <Smile className="w-5 h-5" />
            </button>
            <input
              placeholder="Write a message..."
              className="flex-1 bg-transparent border-none focus:outline-none text-sm py-2"
            />
            <div className="flex items-center gap-1">
              <button className="p-2 text-muted-foreground hover:text-pink-500 transition">
                <ImageIcon className="w-5 h-5" />
              </button>
              <button className="p-2 text-muted-foreground hover:text-pink-500 transition">
                <Mic className="w-5 h-5" />
              </button>
              <button className="p-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition shadow-lg shadow-pink-500/20">
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
