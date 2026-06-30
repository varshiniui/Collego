import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import StudentLayout from "../../components/student/StudentLayout";
import api from "../../lib/api";
import ReactMarkdown from "react-markdown";
import { Send, Sparkles, AlertCircle } from "lucide-react";

const SUGGESTIONS = [
  "Which colleges suit my 12th percentage?",
  "What's the difference between JEE Main and Advanced?",
  "How do I improve my admission chances?",
  "What scholarships are available for engineering?",
];

export default function Chatbot() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [profileIncomplete, setProfileIncomplete] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    api.get("/student/profile").then(res => {
      const p = res.data || {};
      setProfileIncomplete(!p.twelfth_percentage || !p.twelfth_stream);
    });
  }, []);

  const send = async (text) => {
    const content = text || input;
    if (!content.trim() || loading) return;

    const newMessages = [...messages, { role: "user", content }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await api.post("/ai/chat", { messages: newMessages });
      setMessages([...newMessages, { role: "assistant", content: res.data.reply }]);
    } catch (err) {
      setMessages([...newMessages, { role: "assistant", content: "Sorry, I ran into an error. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <StudentLayout>
      <h1 className="font-display text-2xl font-bold text-gray-900 mb-1">Ask Collego AI</h1>
      <p className="text-sm text-gray-500 mb-6">Your personal AI admission counselor — knows your profile.</p>

      {profileIncomplete && (
        <div className="mb-4 bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
          <AlertCircle className="text-amber-500 shrink-0 mt-0.5" size={18} />
          <div className="flex-1">
            <p className="text-sm text-amber-700">
              Add your 12th percentage and stream to your profile so the AI can give you accurate, eligibility-based answers instead of generic ones.
            </p>
            <Link to="/student/profile" className="inline-block mt-1 text-sm font-semibold text-amber-800 underline">
              Complete profile →
            </Link>
          </div>
        </div>
      )}

      <div className="bg-white border border-gray-100 rounded-2xl flex flex-col h-[65vh]">
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center mb-4">
                <Sparkles size={22} />
              </div>
              <p className="text-sm text-gray-500 mb-5 max-w-sm">Ask me anything about colleges, courses, entrance exams, or admissions.</p>
              <div className="grid grid-cols-2 gap-2 max-w-md">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s} onClick={() => send(s)}
                    className="text-xs text-left px-3 py-2.5 rounded-lg border border-gray-200 text-gray-600 hover:border-primary-300 hover:bg-primary-50/50 transition"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                m.role === "user"
                  ? "bg-primary-600 text-white"
                  : "bg-gray-50 text-gray-800"
              }`}>
                {m.role === "assistant" ? (
                  <div className="prose prose-sm max-w-none [&>*]:my-1.5">
                    <ReactMarkdown>{m.content}</ReactMarkdown>
                  </div>
                ) : m.content}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-50 rounded-2xl px-4 py-3 flex gap-1">
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); send(); }}
          className="border-t border-gray-100 p-3 flex gap-2"
        >
          <input
            value={input} onChange={(e) => setInput(e.target.value)}
            placeholder="Type your question..."
            className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          <button
            type="submit" disabled={loading || !input.trim()}
            className="bg-primary-600 text-white px-4 py-2.5 rounded-lg hover:bg-primary-700 transition disabled:opacity-40"
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </StudentLayout>
  );
}
