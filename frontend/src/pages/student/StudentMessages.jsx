import { useEffect, useRef, useState } from "react";
import StudentLayout from "../../components/student/StudentLayout";
import api from "../../lib/api";
import { useAuth } from "../../hooks/useAuth";
import { Send, MessageSquare } from "lucide-react";

export default function StudentMessages() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const bottomRef = useRef(null);
  const pollRef = useRef(null);

  const load = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await api.get("/messages/thread");
      setMessages(res.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || "Could not load messages");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // Poll every 10s for new messages
    pollRef.current = setInterval(() => load(true), 10000);
    return () => clearInterval(pollRef.current);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    try {
      const res = await api.post("/messages/send", { body });
      setMessages(prev => [...prev, res.data]);
      setDraft("");
    } catch (err) {
      setError(err.response?.data?.error || "Could not send message");
    } finally {
      setSending(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <StudentLayout>
      <h1 className="font-display text-2xl font-bold text-gray-900 mb-1">Messages</h1>
      <p className="text-sm text-gray-500 mb-6">Chat with your assigned counselor.</p>

      {error ? (
        <div className="bg-white border border-gray-100 rounded-2xl p-10 text-center">
          <MessageSquare size={32} className="mx-auto text-gray-200 mb-3" />
          <p className="text-sm text-gray-500">{error}</p>
          {error.includes("assigned counselor") && (
            <p className="text-xs text-gray-400 mt-2">
              An admin needs to assign a counselor to your account first.
            </p>
          )}
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-2xl flex flex-col overflow-hidden" style={{ height: "calc(100vh - 200px)" }}>
          {/* Messages area */}
          <div className="flex-1 overflow-y-auto px-5 py-5 space-y-3">
            {loading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className={`flex ${i % 2 === 0 ? "justify-start" : "justify-end"}`}>
                    <div className="h-10 w-48 bg-gray-100 rounded-2xl animate-pulse" />
                  </div>
                ))}
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-10">
                <MessageSquare size={28} className="mx-auto text-gray-200 mb-3" />
                <p className="text-sm text-gray-400">No messages yet.</p>
                <p className="text-xs text-gray-300 mt-1">Send a message to start the conversation with your counselor.</p>
              </div>
            ) : (
              messages.map((msg) => {
                const isMine = String(msg.sender_id) === String(user?.id);
                return (
                  <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-xs lg:max-w-md px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      isMine
                        ? "bg-primary-600 text-white rounded-br-sm"
                        : "bg-gray-100 text-gray-800 rounded-bl-sm"
                    }`}>
                      <p>{msg.body}</p>
                      <p className={`text-[10px] mt-1 ${isMine ? "text-primary-200" : "text-gray-400"}`}>
                        {new Date(msg.created_at).toLocaleTimeString("en-IN", {
                          hour: "2-digit", minute: "2-digit"
                        })}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input area */}
          <div className="border-t border-gray-100 px-4 py-3 flex items-end gap-3">
            <textarea
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Type a message… (Enter to send)"
              rows={1}
              className="flex-1 resize-none text-sm text-gray-800 placeholder:text-gray-400 outline-none py-2 px-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-200 focus:border-transparent"
              style={{ maxHeight: "120px" }}
              onInput={e => {
                e.target.style.height = "auto";
                e.target.style.height = e.target.scrollHeight + "px";
              }}
            />
            <button
              onClick={send}
              disabled={!draft.trim() || sending}
              className="w-9 h-9 bg-primary-600 text-white rounded-xl flex items-center justify-center hover:bg-primary-700 transition disabled:opacity-40 shrink-0"
            >
              <Send size={15} />
            </button>
          </div>
        </div>
      )}
    </StudentLayout>
  );
}