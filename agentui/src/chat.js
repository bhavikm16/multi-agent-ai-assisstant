import { useEffect, useRef, useState } from "react";
import jsPDF from "jspdf";
import { FaGithubAlt, FaPen, FaRegFilePdf } from "react-icons/fa";
function Chat() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const [editIndex, setEditIndex] = useState(null);
  const [editText, setEditText] = useState("");

  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const buildHistory = (msgs) => {
    msgs.slice(-6).map((m) => ({
      role: m.role,
      content: m.content,
    }));
  };

  const apicall = async (topic, history) => {
    const res = await fetch("http://localhost:8000/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        topic,
        userId: localStorage.getItem("userId"),
        history,
      }),
    });

    const data = await res.json();
    return data;
  };

  const sendQuery = async () => {
    const text = input.trim();
    if (!text) return;

    const userMessage = { role: "user", content: text };
    const nextMessages = [...messages, userMessage];
    const history = buildHistory(nextMessages);

    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      const data = await apicall(userMessage.content, history);
      const aiMessage = {
        role: "ai",
        content: data.answer || data.error || "No response",
        confidence: data.confidence,
        forQuery: userMessage.content,
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "ai", content: " Unable to connect to server" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (index) => {
    setEditIndex(index);
    setEditText(messages[index].content);
  };

  const cancelEdit = () => {
    setEditIndex(null);
    setEditText("");
  };

  const EditSend = async () => {
    const newtext = editText.trim();
    if (!newtext || editIndex == null || loading) return;

    setLoading(true);
    try {
      let updated = [...messages];
      updated[editIndex] = { ...updated[editIndex], content: newtext };

      if (updated[editIndex + 1]?.role === "ai") {
        updated.splice(editIndex + 1, 1);
      }

      updated = updated.slice(0, editIndex + 1);
      setMessages(updated);

      const history = buildHistory(updated);
      const data = await apicall(newtext, history);
      const aiMessage = {
        role: "ai",
        content: data.answer || data.error || "No response",
        confidence: data.confidence,
        forQuery: newtext,
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "ai", content: " Unable to connect to server" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const downloadAsPDF = ({ query, response, confidence }, index) => {
    const doc = new jsPDF();

    doc.setFontSize(14);
    doc.text("AI Response", 10, 12);

    doc.setFontSize(11);

    const qLines = doc.splitTextToSize(`Query: ${query || "-"}`, 180);
    doc.text(qLines, 10, 22);

    let y = 22 + qLines.length * 7 + 6;

    if (confidence != null) {
      doc.text(`Confidence: ${confidence}/100`, 10, y);
      y += 10;
    }

    doc.text("Response:", 10, y);
    y += 8;

    const lines = doc.splitTextToSize(response || "", 180);

    lines.forEach((line) => {
      if (y > 280) {
        doc.addPage();
        y = 20;
      }
      doc.text(line, 10, y);
      y += 7;
    });

    doc.save(`ai-response-${index + 1}.pdf`);
  };

  return (
    <div className="min-h-[calc(100vh-140px)] bg-base-200 p-4">
      <div className="max-w-4xl mx-auto flex flex-col gap-4">
        <div className="card bg-base-100 shadow-xl flex-1">
          <div className="card-body">
            {messages.length === 0 && !loading && (
              <div className="alert">
                <FaGithubAlt /><span> Ask me anything to get started!</span>
              </div>
            )}

            <div className="space-y-3 overflow-y-auto max-h-[65vh] pr-1">
              {messages.map((msg, index) => {
                const isUser = msg.role === "user";
                const isEditing = editIndex === index;

                return (
                  <div
                    key={index}
                    className={`chat ${isUser ? "chat-end" : "chat-start"}`}
                  >
                    <div className="chat-header opacity-70">
                      {isUser ? "You" : "AI"}
                    </div>

                    <div
                      className={`chat-bubble ${
                        isUser ? "chat-bubble-primary" : ""
                      }`}
                    >
                      {isUser && isEditing ? (
                        <div className="space-y-2">
                          <textarea
                            className="textarea textarea-bordered w-full text-white"
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            rows={3}
                          />
                          <div className="flex justify-end gap-2">
                            <button
                              className="btn btn-xs btn-ghost"
                              onClick={cancelEdit}
                              disabled={loading}
                              type="button"
                            >
                              Cancel
                            </button>
                            <button
                              className="btn btn-xs btn-outline"
                              onClick={EditSend}
                              disabled={loading}
                              type="button"
                            >
                              Save & Resend
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="whitespace-pre-wrap">{msg.content}</p>

                          {isUser && (
                            <div className="mt-2 flex justify-end">
                              <button
                                className="btn btn-xs btn-ghost"
                                onClick={() => startEdit(index)}
                                disabled={loading}
                                type="button"
                                title="Edit this message"
                              >
                                <FaPen /> Edit
                              </button>
                            </div>
                          )}

                          {!isUser && (
                            <div className="mt-3 flex items-center justify-between gap-2">
                              {msg.confidence != null ? (
                                <span className="badge badge-outline">
                                  Confidence: {msg.confidence}/100
                                </span>
                              ) : (
                                <span className="text-xs opacity-60"> </span>
                              )}

                              <button
                                type="button"
                                className="btn btn-xs btn-outline"
                                onClick={() =>
                                  downloadAsPDF(
                                    {
                                      query: msg.forQuery,
                                      response: msg.content,
                                      confidence: msg.confidence,
                                    },
                                    index,
                                  )
                                }
                                title="Download as PDF"
                              >
                                <FaRegFilePdf /> PDF
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}

              {loading && (
                <div className="chat chat-start">
                  <div className="chat-header opacity-70">AI</div>
                  <div className="chat-bubble">
                    <span className="loading loading-dots loading-sm"></span>{" "}
                    Thinking...
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <div className="flex gap-2">
              <input
                className="input input-bordered w-full"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your question here..."
                onKeyDown={(e) => {
                  if (e.key === "Enter") sendQuery();
                }}
                disabled={loading}
              />

              <button
                className="btn btn-primary"
                onClick={sendQuery}
                disabled={loading}
                type="button"
              >
                {loading ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Send
                  </>
                ) : (
                  "Send"
                )}
              </button>
            </div>

            <div className="text-xs opacity-60 mt-2">
              Press <kbd className="kbd kbd-xs">Enter</kbd> to send
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Chat;
