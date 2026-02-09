import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Signup() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("http://localhost:8000/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.detail || "Signup failed");
        return;
      }

      navigate("/login");
    } catch {
      setError("❌ Unable to connect to server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[calc(100dvh-64px)] bg-base-200 flex items-center justify-center p-4 overflow-hidden">
      <div className="card w-full max-w-md bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="text-3xl font-bold text-center">Signup</h2>

          {error && (
            <div className="alert alert-error mt-2">
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSignup} className="mt-4 space-y-4">
            <label className="form-control w-full">
              <div className="label">
                <span className="label-text">Email</span>
              </div>
              <input
                className="input input-bordered w-full"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>

            <label className="form-control w-full">
              <div className="label">
                <span className="label-text">Password</span>
              </div>
              <input
                className="input input-bordered w-full"
                type="password"
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>

            <button className={`btn btn-primary w-full ${loading ? "btn-disabled" : ""}`} disabled={loading}>
              {loading ? (
                <>
                  <span className="loading loading-spinner"></span>
                  Signing up...
                </>
              ) : (
                "Signup"
              )}
            </button>
          </form>

          <div className="divider my-6">Already have an account?</div>

          <button className="btn btn-ghost w-full" onClick={() => navigate("/login")}>
            Go to Login
          </button>
        </div>
      </div>
    </div>
  );
}

export default Signup;
