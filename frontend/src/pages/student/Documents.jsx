import { useEffect, useRef, useState } from "react";
import StudentLayout from "../../components/student/StudentLayout";
import api from "../../lib/api";
import toast from "react-hot-toast";
import { FileText, Upload, Download, Trash2, Loader2 } from "lucide-react";

const DOC_TYPES = [
  "10th Marksheet", "12th Marksheet", "Transfer Certificate",
  "Entrance Scorecard", "Community Certificate", "Other"
];

export default function Documents() {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [docType, setDocType] = useState(DOC_TYPES[0]);
  const fileInputRef = useRef(null);

  const load = () => {
    setLoading(true);
    api.get("/student/documents").then(res => setDocs(res.data)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("document_type", docType);

    setUploading(true);
    try {
      await api.post("/student/documents", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      toast.success("Uploaded");
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || "Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleDownload = async (doc) => {
    try {
      const res = await api.get(`/student/documents/${doc.id}/download`);
      window.open(res.data.url, "_blank");
    } catch {
      toast.error("Could not generate download link");
    }
  };

  const handleDelete = async (docId) => {
    try {
      await api.delete(`/student/documents/${docId}`);
      setDocs(prev => prev.filter(d => d.id !== docId));
      toast.success("Deleted");
    } catch {
      toast.error("Something went wrong");
    }
  };

  return (
    <StudentLayout>
      <h1 className="font-display text-2xl font-bold text-gray-900 mb-1">Documents</h1>
      <p className="text-sm text-gray-500 mb-6">Upload your mark sheets and certificates.</p>

      <div className="bg-white border border-gray-100 rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-3">
          <select
            value={docType}
            onChange={(e) => setDocType(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm flex-1"
          >
            {DOC_TYPES.map(t => <option key={t}>{t}</option>)}
          </select>

          <label className="inline-flex items-center gap-2 bg-primary-600 text-white px-4 py-2.5 rounded-lg font-semibold text-sm hover:bg-primary-700 transition cursor-pointer shrink-0">
            {uploading ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
            {uploading ? "Uploading..." : "Upload file"}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileSelect}
              disabled={uploading}
              className="hidden"
            />
          </label>
        </div>
        <p className="text-xs text-gray-400 mt-2">PDF, JPG, or PNG. Max 10MB.</p>
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-white border border-gray-100 rounded-xl animate-pulse" />)}</div>
      ) : docs.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-2xl p-10 text-center">
          <FileText className="mx-auto text-primary-400 mb-3" size={28} />
          <h3 className="font-display font-bold text-gray-900 mb-1.5">No documents uploaded yet</h3>
          <p className="text-sm text-gray-500">Upload your mark sheets and certificates so counselors can verify your eligibility.</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-2xl divide-y divide-gray-50">
          {docs.map((doc) => (
            <div key={doc.id} className="px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center shrink-0">
                  <FileText size={16} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">{doc.document_type}</p>
                  <p className="text-xs text-gray-400">{doc.file_name} · {doc.file_size_kb} KB</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => handleDownload(doc)} className="text-gray-400 hover:text-primary-600 transition p-1.5">
                  <Download size={16} />
                </button>
                <button onClick={() => handleDelete(doc.id)} className="text-gray-300 hover:text-red-500 transition p-1.5">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </StudentLayout>
  );
}