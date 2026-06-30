import { useEffect, useRef, useState } from "react";
import CounselorLayout from "../../components/counselor/CounselorLayout";
import api from "../../lib/api";
import { useAuth } from "../../hooks/useAuth";
import toast from "react-hot-toast";
import { Send, MessageSquare, ChevronLeft } from "lucide-react";

export default function CounselorMessages() {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [loadingThread, setLoadingThread] = useState(false);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);
  const pollRef = useRef(null);

  // Load assigned students for the sidebar
  useEffect(() => {
    api.get("/counselor/students")
      .then(res => setStudents(res.data || []))
      .catch(() => setStudents([]))
      .finally(() => setLoadingStudents(false));
  }, []);

  const loadThread = async (studentId, silent = false) => {
    if (!silent) setLoadingThread(true);
    try {
      const res = await api.get("/messages/thread", { params: { student_id: studentId } });
      setMessages(res.data);
    } catch {
      setMessages([]);
    } finally {
      setLoadingThread(false);
    }
  };

  const selectStudent = (studentId) => {
    setSelectedId(studentId);
    setDraft("");
    clearInterval(pollRef.current);
    loadThread(studentId);
    pollRef.current = setInterval(() => loadThread(studentId, true), 10000);
  };

  useEffect(() => () => clearInterval(pollRef.current), []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    const body = draft.trim();
    if (!body || sending || !selectedId) return;
    setSending(true);
    try {
      const res = await api.post("/messages/send", { body, student_id: selectedId });
      setMessages(prev => [...prev, res.data]);
      setDraft("");
    } catch (err) {
      toast.error(err.response?.data?.error || "Couldn't send message");
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

  const selectedStudent = students.find(s => s.student_id === selectedId);

  return (
    <CounselorLayout>
      <h1 className="font-display text-2xl font-bold text-gray-900 mb-1">Messages</h1>
      <p className="text-sm text-gray-500 mb-5">Respond to student queries.</p>

      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden flex" style={{ height: "calc(100vh - 200px)" }}>

        {/* Student list sidebar */}
        <div className="w-56 shrink-0 border-r border-gray-100 flex flex-col">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-4 py-3 border-b border-gray-50">
            Students
          </p>
          <div className="flex-1 overflow-y-auto">
            {loadingStudents ? (
              <div className="space-y-2 p-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-10 bg-gray-100 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : students.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-8 px-3">No students assigned yet.</p>
            ) : (
              students.map(s => (
                <button
                  key={s.student_id}
                  onClick={() => selectStudent(s.student_id)}
                  className={`w-full text-left px-4 py-3 border-b border-gray-50 transition ${
                    selectedId === s.student_id
                      ? "bg-primary-50 text-primary-700"
                      : "hover:bg-gray-50 text-gray-700"
                  }`}
                >
                  <p className="text-sm font-medium truncate">{s.users?.name}</p>
                  <p className="text-xs text-gray-400 truncate">{s.users?.email}</p>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Thread area */}
        <div className="flex-1 flex flex-col min-w-0">
          {!selectedId ? (
            <div className="flex-1 flex items-center justify-center text-center px-6">
              <div>
                <MessageSquare size={32} className="mx-auto text-gray-200 mb-3" />
                <p className="text-sm text-gray-400">Select a student to view the conversation.</p>
              </div>
            </div>
          ) : (
            <>
              {/* Thread header */}
              <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary-50 flex items-center justify-center font-bold text-sm text-primary-700 shrink-0">
                  {selectedStudent?.users?.name?.[0]?.toUpperCase() || "?"}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">{selectedStudent?.users?.name}</p>
                  <p className="text-xs text-gray-400">{selectedStudent?.users?.email}</p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                {loadingThread ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className={`flex ${i % 2 === 0 ? "justify-start" : "justify-end"}`}>
                        <div className="h-10 w-40 bg-gray-100 rounded-2xl animate-pulse" />
                      </div>
                    ))}
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-sm text-gray-400">No messages yet.</p>
                    <p className="text-xs text-gray-300 mt-1">Send a message to start the conversation.</p>
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

              {/* Input */}
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
            </>
          )}
        </div>
      </div>
    </CounselorLayout>
  );
}