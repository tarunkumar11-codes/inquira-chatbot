import { useState, useRef, useEffect } from "react";
import axios from "axios";

function App() {
  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState("");
  const [uploaded, setUploaded] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [filename, setFilename] = useState("");
  const [dragging, setDragging] = useState(false);
  const messagesEndRef = useRef(null);
  const dropRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const processFile = async (file) => {
    if (!file || !file.name.endsWith(".pdf")) {
      setMessages([{ sender: "bot", text: "Only PDF files are supported. Please upload a valid PDF." }]);
      return;
    }

    setUploading(true);
    setFilename(file.name);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/upload`, formData);
      setUploaded(true);
      setMessages([{ sender: "bot", text: "Document loaded successfully. Ask me anything about it." }]);
    } catch (error) {
      setMessages([{ sender: "bot", text: "Failed to upload PDF. Please try again." }]);
    } finally {
      setUploading(false);
    }
  };

  const handleUpload = (e) => processFile(e.target.files[0]);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    processFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => setDragging(false);

  const handleSend = async () => {
    if (!question.trim()) return;

    const userMessage = { sender: "user", text: question };
    setMessages((prev) => [...prev, userMessage]);
    setQuestion("");
    setLoading(true);

    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/chat`, { question });
      setMessages((prev) => [...prev, { sender: "bot", text: response.data.answer }]);
    } catch (error) {
      setMessages((prev) => [...prev, { sender: "bot", text: "Something went wrong. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) handleSend();
  };

  const handleNewPDF = () => {
    setUploaded(false);
    setMessages([]);
    setFilename("");
    document.getElementById("fileInput").click();
  };

  return (
    <div style={styles.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Inter:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #080810; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #2a2a3a; border-radius: 4px; }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1); }
        }
        @keyframes glow {
          0%, 100% { box-shadow: 0 0 20px rgba(139, 92, 246, 0.15); }
          50% { box-shadow: 0 0 40px rgba(139, 92, 246, 0.35); }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }

        .message { animation: fadeUp 0.35s ease forwards; }
        .dot { 
          animation: pulse 1.4s ease infinite; 
          display: inline-block; 
          width: 7px; height: 7px; 
          background: #8b5cf6; 
          border-radius: 50%; 
          margin: 0 3px; 
        }
        .dot:nth-child(2) { animation-delay: 0.2s; }
        .dot:nth-child(3) { animation-delay: 0.4s; }

        .send-btn { transition: all 0.2s ease; }
        .send-btn:hover:not(:disabled) { 
          background: linear-gradient(135deg, #a78bfa, #7c3aed) !important;
          transform: translateY(-1px);
          box-shadow: 0 4px 20px rgba(139, 92, 246, 0.5) !important;
        }
        .send-btn:disabled { opacity: 0.3; cursor: not-allowed; }

        .upload-btn { transition: all 0.25s ease; }
        .upload-btn:hover:not(:disabled) { 
          background: rgba(139, 92, 246, 0.15) !important;
          border-color: #a78bfa !important;
          transform: translateY(-1px);
        }

        .new-btn { transition: all 0.2s ease; }
        .new-btn:hover { background: #1e1e2e !important; border-color: #3a3a5c !important; }

        .chat-input { transition: border-color 0.2s ease; }
        .chat-input:focus { outline: none; border-color: #7c3aed !important; box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.15) !important; }

        .drop-zone { transition: all 0.25s ease; }
        .drop-zone.dragging { 
          border-color: #8b5cf6 !important; 
          background: rgba(139, 92, 246, 0.08) !important;
          animation: glow 1.5s ease infinite;
        }

        .logo-text {
          background: linear-gradient(135deg, #e2c4ff, #b78ef7, #7c3aed);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shimmer 4s linear infinite;
        }
      `}</style>

      <div style={styles.sidebar}>
        <div>
          <div className="logo-text" style={styles.logo}>Inquira</div>
          <div style={styles.logoSub}>AI Document Assistant</div>
        </div>

        <div style={styles.sidebarMiddle}>
          <input
            id="fileInput"
            type="file"
            accept=".pdf"
            onChange={handleUpload}
            style={{ display: "none" }}
          />

          <div
            ref={dropRef}
            className={`drop-zone ${dragging ? "dragging" : ""}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            style={styles.dropZone}
          >
            {!uploaded ? (
              <>
                <div style={styles.dropIcon}>
                  {dragging ? "📂" : "📄"}
                </div>
                <div style={styles.dropText}>
                  {dragging ? "Drop your PDF here" : "Drag & drop your PDF here"}
                </div>
                <div style={styles.dropOr}>or</div>
                <button
                  className="upload-btn"
                  style={styles.uploadBtn}
                  onClick={() => document.getElementById("fileInput").click()}
                  disabled={uploading}
                >
                  {uploading ? "Processing..." : "Browse File"}
                </button>
              </>
            ) : (
              <div style={styles.fileLoaded}>
                <div style={styles.fileIconLoaded}>✓</div>
                <div style={styles.fileNameLoaded}>{filename}</div>
                <button className="new-btn" style={styles.newBtn} onClick={handleNewPDF}>
                  Load New PDF
                </button>
              </div>
            )}
          </div>

          {uploaded && (
            <div style={styles.statusBadge}>
              <span style={styles.statusDot}></span>
              Ready to answer
            </div>
          )}
        </div>

        <div style={styles.sidebarFooter}>
          <div style={styles.footerDivider}></div>
          <div style={styles.footerText}>Powered by LLaMA 3.3 + RAG</div>
        </div>
      </div>

      <div style={styles.main}>
        <div style={styles.topBar}>
          <div style={styles.topBarTitle}>
            {uploaded ? `Chatting about: ${filename}` : "No document loaded"}
          </div>
        </div>

        <div style={styles.chatArea}>
          {messages.length === 0 && (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>💬</div>
              <div style={styles.emptyTitle}>Start a conversation</div>
              <div style={styles.emptySubtitle}>Upload a PDF from the sidebar and ask anything about it</div>
              <div style={styles.exampleQuestions}>
                <div style={styles.exampleLabel}>Try asking:</div>
                <div style={styles.exampleItem}>"What is this document about?"</div>
                <div style={styles.exampleItem}>"Summarize the key points"</div>
                <div style={styles.exampleItem}>"What are the main conclusions?"</div>
              </div>
            </div>
          )}

          {messages.map((msg, index) => (
            <div key={index} className="message" style={msg.sender === "user" ? styles.userRow : styles.botRow}>
              <div style={msg.sender === "user" ? styles.userBubble : styles.botBubble}>
                <div style={msg.sender === "user" ? styles.userSender : styles.botSender}>
                  {msg.sender === "user" ? "You" : "Inquira"}
                </div>
                <div style={styles.bubbleText}>{msg.text}</div>
              </div>
            </div>
          ))}

          {loading && (
            <div style={styles.botRow} className="message">
              <div style={styles.botBubble}>
                <div style={styles.botSender}>Inquira</div>
                <div style={{ paddingTop: "4px" }}>
                  <span className="dot"></span>
                  <span className="dot"></span>
                  <span className="dot"></span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div style={styles.inputArea}>
          <input
            className="chat-input"
            type="text"
            placeholder={uploaded ? "Ask anything about your document..." : "Upload a PDF to start chatting"}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={!uploaded || loading}
            style={styles.input}
          />
          <button
            className="send-btn"
            onClick={handleSend}
            disabled={!uploaded || loading || !question.trim()}
            style={styles.sendBtn}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    display: "flex",
    height: "100vh",
    fontFamily: "'Inter', sans-serif",
    background: "#080810",
    color: "#e2e0f0",
  },
  sidebar: {
    width: "280px",
    background: "#0d0d1a",
    borderRight: "1px solid #1a1a2e",
    padding: "32px 24px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    gap: "20px",
  },
  logo: {
    fontFamily: "'DM Serif Display', serif",
    fontSize: "32px",
    letterSpacing: "0.02em",
  },
  logoSub: {
    fontSize: "11px",
    color: "#4a4a6a",
    letterSpacing: "0.15em",
    textTransform: "uppercase",
    marginTop: "4px",
  },
  sidebarMiddle: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    gap: "16px",
  },
  dropZone: {
    border: "1.5px dashed #2a2a4a",
    borderRadius: "12px",
    padding: "28px 20px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "10px",
    cursor: "pointer",
    background: "#0a0a18",
  },
  dropIcon: {
    fontSize: "32px",
  },
  dropText: {
    fontSize: "13px",
    color: "#6060a0",
    textAlign: "center",
    lineHeight: "1.5",
  },
  dropOr: {
    fontSize: "11px",
    color: "#3a3a5a",
    textTransform: "uppercase",
    letterSpacing: "0.1em",
  },
  uploadBtn: {
    padding: "10px 24px",
    background: "transparent",
    border: "1px solid #4a4a8a",
    color: "#9090d0",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "13px",
    fontFamily: "'Inter', sans-serif",
    fontWeight: "500",
    letterSpacing: "0.03em",
  },
  fileLoaded: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "10px",
    width: "100%",
  },
  fileIconLoaded: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    background: "rgba(139, 92, 246, 0.15)",
    border: "1px solid #7c3aed",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "18px",
    color: "#a78bfa",
  },
  fileNameLoaded: {
    fontSize: "12px",
    color: "#7070b0",
    textAlign: "center",
    wordBreak: "break-all",
    lineHeight: "1.4",
  },
  newBtn: {
    padding: "8px 20px",
    background: "#0f0f20",
    border: "1px solid #2a2a4a",
    color: "#6060a0",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "12px",
    fontFamily: "'Inter', sans-serif",
    marginTop: "4px",
  },
  statusBadge: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px 14px",
    background: "rgba(139, 92, 246, 0.08)",
    border: "1px solid rgba(139, 92, 246, 0.2)",
    borderRadius: "20px",
    fontSize: "12px",
    color: "#a78bfa",
    justifyContent: "center",
  },
  statusDot: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    background: "#8b5cf6",
    boxShadow: "0 0 6px #8b5cf6",
    display: "inline-block",
  },
  sidebarFooter: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  footerDivider: {
    height: "1px",
    background: "linear-gradient(to right, transparent, #1a1a3a, transparent)",
  },
  footerText: {
    fontSize: "11px",
    color: "#2a2a4a",
    textAlign: "center",
    letterSpacing: "0.05em",
  },
  main: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    background: "#080810",
  },
  topBar: {
    padding: "16px 40px",
    borderBottom: "1px solid #0f0f20",
    background: "#0a0a15",
  },
  topBarTitle: {
    fontSize: "13px",
    color: "#3a3a6a",
    letterSpacing: "0.03em",
  },
  chatArea: {
    flex: 1,
    overflowY: "auto",
    padding: "40px",
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  emptyState: {
    margin: "auto",
    textAlign: "center",
    maxWidth: "400px",
  },
  emptyIcon: {
    fontSize: "48px",
    marginBottom: "16px",
    opacity: 0.3,
  },
  emptyTitle: {
    fontFamily: "'DM Serif Display', serif",
    fontSize: "26px",
    color: "#2a2a5a",
    marginBottom: "8px",
  },
  emptySubtitle: {
    fontSize: "14px",
    color: "#1e1e3a",
    lineHeight: "1.6",
    marginBottom: "24px",
  },
  exampleQuestions: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    alignItems: "center",
  },
  exampleLabel: {
    fontSize: "11px",
    color: "#2a2a4a",
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    marginBottom: "4px",
  },
  exampleItem: {
    padding: "8px 16px",
    background: "#0d0d1a",
    border: "1px solid #1a1a2e",
    borderRadius: "20px",
    fontSize: "13px",
    color: "#3a3a6a",
    fontStyle: "italic",
  },
  userRow: {
    display: "flex",
    justifyContent: "flex-end",
  },
  botRow: {
    display: "flex",
    justifyContent: "flex-start",
  },
  userBubble: {
    background: "linear-gradient(135deg, #1e1040, #160d35)",
    border: "1px solid #3b2080",
    borderRadius: "16px 16px 4px 16px",
    padding: "14px 18px",
    maxWidth: "65%",
    boxShadow: "0 4px 20px rgba(124, 58, 237, 0.1)",
  },
  botBubble: {
    background: "#0d0d1a",
    border: "1px solid #1a1a2e",
    borderRadius: "16px 16px 16px 4px",
    padding: "14px 18px",
    maxWidth: "65%",
  },
  userSender: {
    fontSize: "11px",
    fontWeight: "600",
    color: "#7c5cbf",
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    marginBottom: "6px",
  },
  botSender: {
    fontSize: "11px",
    fontWeight: "600",
    color: "#4a4a8a",
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    marginBottom: "6px",
  },
  bubbleText: {
    fontSize: "14px",
    lineHeight: "1.7",
    color: "#c0b8e8",
  },
  inputArea: {
    display: "flex",
    gap: "12px",
    padding: "20px 40px",
    borderTop: "1px solid #0f0f20",
    background: "#0a0a15",
  },
  input: {
    flex: 1,
    padding: "14px 18px",
    background: "#0d0d1a",
    border: "1px solid #1a1a2e",
    borderRadius: "10px",
    color: "#e2e0f0",
    fontSize: "14px",
    fontFamily: "'Inter', sans-serif",
  },
  sendBtn: {
    padding: "14px 28px",
    background: "linear-gradient(135deg, #7c3aed, #5b21b6)",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    fontSize: "14px",
    fontFamily: "'Inter', sans-serif",
    fontWeight: "600",
    letterSpacing: "0.05em",
    boxShadow: "0 4px 15px rgba(124, 58, 237, 0.3)",
  },
};

export default App;