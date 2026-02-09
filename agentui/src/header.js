import {
  FaBrain,
  FaHistory,
  FaCog,
  FaSignOutAlt,
  FaUserPlus,
  FaSignInAlt,
  FaComments,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

function Header({ isLoggedIn, setIsLoggedIn }) {
  const navigate = useNavigate();
  const isAdmin = localStorage.getItem("userId") === "admin";

  const handleLogout = () => {
    localStorage.clear();
    setIsLoggedIn(false);
    navigate("/login");
  };

  return (
  <div className="navbar h-16 bg-base-100/90 backdrop-blur border-b border-base-300 px-4 sticky top-0 z-50">
      {/* Left: Brand */}
      <div className="flex-1">
        <button
          className="btn btn-ghost text-xl gap-2"
          onClick={() => navigate(isLoggedIn ? "/chat" : "/login")}
        >
          <FaBrain className="text-lg" />
          <span className="font-semibold">AI Assistant</span>
        </button>
      </div>

      {/* Right: Actions */}
      <div className="flex-none">
        <div className="flex items-center gap-2">
          {isLoggedIn ? (
            isAdmin ? (
              // 🔐 ADMIN: only logout
              <button className="btn btn-outline btn-error gap-2" onClick={handleLogout}>
                <FaSignOutAlt />
                <span className="hidden sm:inline">Logout</span>
              </button>
            ) : (
              // 👤 NORMAL USER
              <>
                <button className="btn btn-ghost gap-2" onClick={() => navigate("/chat")}>
                  <FaComments />
                  <span className="hidden sm:inline">Chat</span>
                </button>

                <button className="btn btn-ghost gap-2" onClick={() => navigate("/history")}>
                  <FaHistory />
                  <span className="hidden sm:inline">History</span>
                </button>

                <button className="btn btn-ghost gap-2" onClick={() => navigate("/settings")}>
                  <FaCog />
                  <span className="hidden sm:inline">Settings</span>
                </button>

                <button className="btn btn-outline btn-error gap-2" onClick={handleLogout}>
                  <FaSignOutAlt />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </>
            )
          ) : (
            // 🚪 NOT LOGGED IN
            <>
              <button className="btn btn-ghost gap-2" onClick={() => navigate("/signup")}>
                <FaUserPlus />
                <span className="hidden sm:inline">Signup</span>
              </button>

              <button className="btn btn-primary gap-2" onClick={() => navigate("/login")}>
                <FaSignInAlt />
                <span className="hidden sm:inline">Login</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Header;
