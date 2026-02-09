import { useEffect, useState } from "react";
import jsPDF from "jspdf";
import { FaRegFilePdf, FaReceipt } from "react-icons/fa";
function History() {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const userId = localStorage.getItem("userId");

    fetch(`http://localhost:8000/chats/${userId}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setChats(data);
        else setError("Invalid response");
      })
      .catch(() => setError("Unable to fetch chat history"))
      .finally(() => setLoading(false));
  }, []);

  const downloadAsPDF = (query, response, confidence, index) => {
    const doc = new jsPDF();

    doc.setFontSize(14);
    doc.text("AI Response", 10``, 12);

    doc.setFontSize(11);
    const qLines = doc.splitTextToSize(`Query: ${query}`, 180);
    doc.text(qLines, 10, 22);

    let y = 22 + qLines.length * 7 + 4;

    if (confidence != null) {
      doc.text(`Confidence: ${confidence}/100`, 10, y);
      y += 10;
    }

    const lines = doc.splitTextToSize(response || "", 180);
    lines.forEach((line) => {
      if (y > 280) {
        doc.addPage();
        y = 20;
      }
      doc.text(line, 10, y);
      y += 7;
    });

    doc.save(`history-response-${index + 1}.pdf`);
  };

  return (
    <div className="min-h-screen bg-base-200 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <h2 className="flex items-center gap-3 text-2xl md:text-3xl font-bold">
                <FaReceipt className="text-4xl" />
                Chat History
              </h2>

              <div className="badge badge-outline">Total: {chats.length}</div>
            </div>

            {loading && (
              <div className="flex items-center gap-3 mt-4">
                <span className="loading loading-spinner"></span>
                <span>Loading...</span>
              </div>
            )}

            {error && (
              <div className="alert alert-error mt-4">
                <span>{error}</span>
              </div>
            )}

            {!loading && !error && chats.length === 0 && (
              <div className="alert mt-4">
                <span>No chats found.</span>
              </div>
            )}

            {!loading && !error && chats.length > 0 && (
              <div className="mt-6 space-y-3">
                {chats.map((chat, index) => {
                  const blocked = chat.verdict === "BLOCKED";
                  const canDownload =
                    chat.verdict === "ALLOWED" && !!chat.response;

                  return (
                    <div
                      key={index}
                      className={`collapse collapse-arrow bg-base-200 border border-base-300 ${
                        blocked ? "border-error" : ""
                      }`}
                    >
                      <input type="checkbox" />

                      <div className="collapse-title flex items-center gap-2">
                        {blocked && (
                          <span className="badge badge-error">BLOCKED</span>
                        )}
                        <span
                          className={`font-medium ${blocked ? "text-error" : ""}`}
                        >
                          {chat.query}
                        </span>
                      </div>

                      <div className="collapse-content">
                        {canDownload && (
                          <div className="flex justify-end mb-3">
                            <button
                              type="button"
                              className="btn btn-xs btn-outline"
                              onClick={() =>
                                downloadAsPDF(
                                  chat.query,
                                  chat.response,
                                  chat.confidence,
                                  index,
                                )
                              }
                              title="Download response as PDF"
                            >
                              <FaRegFilePdf /> PDF
                            </button>
                          </div>
                        )}

                        <div className="text-sm opacity-80 whitespace-pre-wrap">
                          {chat.response ? chat.response : "No response saved."}
                        </div>

                        {chat.confidence != null &&
                          chat.verdict === "ALLOWED" && (
                            <div className="mt-3">
                              <span className="badge badge-outline">
                                Confidence: {chat.confidence}/100
                              </span>
                            </div>
                          )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default History;
