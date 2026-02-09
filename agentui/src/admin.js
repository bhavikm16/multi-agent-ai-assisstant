import { useEffect, useState } from "react";

function Admin() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("http://localhost:8000/admin/blocked")
      .then((res) => res.json())
      .then((res) => {
        if (Array.isArray(res)) setData(res);
        else setError("Invalid response");
      })
      .catch(() => setError("Unable to fetch data"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-base-200 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <h2 className="text-2xl md:text-3xl font-bold">
                🚨 Blocked Queries (Admin)
              </h2>

              <div className="badge badge-outline">Total: {data.length}</div>
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

            {!loading && !error && data.length === 0 && (
              <div className="alert mt-4">
                <span>No blocked queries found.</span>
              </div>
            )}

            {!loading && !error && data.length > 0 && (
              <div className="overflow-x-auto mt-6">
                <table className="table table-zebra">
                  <thead>
                    <tr>
                      <th>Email</th>
                      <th>Blocked Query</th>
                      <th>Date</th>
                    </tr>
                  </thead>

                  <tbody>
                    {data.map((row, index) => (
                      <tr key={index}>
                        <td className="font-medium">{row.email || "—"}</td>

                        <td className="max-w-xl">
                          <span className="text-error font-semibold break-words">
                            {row.query || "—"}
                          </span>
                        </td>

                        <td className="whitespace-nowrap opacity-80">
                          {row.createdAt
                            ? new Date(row.createdAt).toLocaleString()
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* <div className="text-sm opacity-70 mt-3">
                  Tip: You can add pagination/search later if this list grows.
                </div> */}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Admin;
