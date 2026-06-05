import { createFileRoute, Link } from "@tanstack/react-router";
import {
  MessageSquare,
  Search,
  MoreVertical,
  Send,
  User,
  Image as ImageIcon,
  Smile,
  Mic,
  ArrowLeft,
  Heart,
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/instagram/inbox")({
  head: () => ({
    meta: [
      { title: "Inbox — Instagram Creator Studio" },
      { name: "description", content: "Manage direct messages and conversations" },
    ],
  }),
  component: InstagramInbox,
});

function InstagramInbox() {
  const [selectedConversation, setSelectedConversation] = useState(0);
  const [messageText, setMessageText] = useState("");

  const conversations = [
    { id: 1, name: "Worship Leader", message: "Great reel! Let's collab soon.", time: "2m", unread: true },
    { id: 2, name: "Sarah Grace", message: "When is the next live session?", time: "1h", unread: false },
    { id: 3, name: "John Doe", message: "Love your content!", time: "3h", unread: false },
  ];

  const messages = [
    { id: 1, sender: "Worship Leader", text: "Great reel! Let's collab soon.", time: "2m", isOwn: false },
    { id: 2, sender: "You", text: "Thanks! I'd love to collaborate", time: "1m", isOwn: true },
  ];

  return (
    <main className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/instagram" className="p-2 hover:bg-card rounded-lg transition">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="font-display text-2xl font-bold">Inbox</h1>
              <p className="text-xs text-muted-foreground">Manage direct messages</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
          {/* Conversations List */}
          <div className="border border-border rounded-xl bg-card/40 flex flex-col">
            <div className="p-4 border-b border-border">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background/50 focus:outline-none focus:border-[color:var(--gold)] text-sm"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 p-2">
              {conversations.map((conv, idx) => (
                <button
                  key={conv.id}
                  onClick={() => setSelectedConversation(idx)}
                  className={`w-full p-3 rounded-lg text-left transition ${
                    selectedConversation === idx
                      ? "bg-[color:var(--gold)]/20 border border-[color:var(--gold)]/50"
                      : "hover:bg-background/50"
                  }`}
                >
                  <div className="flex items-start justify-between mb-1">
                    <p className="font-medium text-sm">{conv.name}</p>
                    <span className="text-xs text-muted-foreground">{conv.time}</span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{conv.message}</p>
                  {conv.unread && <div className="w-2 h-2 rounded-full bg-[color:var(--gold)] mt-2" />}
                </button>
              ))}
            </div>
          </div>

          {/* Chat Area */}
          <div className="lg:col-span-2 border border-border rounded-xl bg-card/40 flex flex-col">
            {/* Chat Header */}
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[color:var(--gold)]/20 flex items-center justify-center">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-sm">{conversations[selectedConversation].name}</p>
                  <p className="text-xs text-muted-foreground">Active now</p>
                </div>
              </div>
              <button className="p-2 hover:bg-background rounded transition">
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.isOwn ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-xs px-4 py-2 rounded-lg ${
                    msg.isOwn
                      ? "bg-[color:var(--gold)] text-background"
                      : "bg-background/50 border border-border"
                  }`}>
                    <p className="text-sm">{msg.text}</p>
                    <p className={`text-xs mt-1 ${msg.isOwn ? "text-background/70" : "text-muted-foreground"}`}>
                      {msg.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-border space-y-3">
              <div className="flex gap-2">
                <button className="p-2 hover:bg-background rounded transition">
                  <ImageIcon className="w-5 h-5" />
                </button>
                <button className="p-2 hover:bg-background rounded transition">
                  <Smile className="w-5 h-5" />
                </button>
                <button className="p-2 hover:bg-background rounded transition">
                  <Mic className="w-5 h-5" />
                </button>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  className="flex-1 px-4 py-2 rounded-lg border border-border bg-background/50 focus:outline-none focus:border-[color:var(--gold)] text-sm"
                />
                <button className="px-4 py-2 rounded-lg bg-[color:var(--gold)] hover:bg-[color:var(--gold)]/90 text-background transition">
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
