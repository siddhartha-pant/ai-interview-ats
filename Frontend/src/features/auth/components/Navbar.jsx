import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../features/auth/hooks/useAuth";
import "./Navbar.css";

const Navbar = () => {
  const { user, handleLogout } = useAuth();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef();
  const navigate = useNavigate();

  // close dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const onLogout = async () => {
    await handleLogout();
    navigate("/login");
  };

  const initials = user?.username
    ? user.username.slice(0, 2).toUpperCase()
    : "?";

  return (
    <nav className="navbar">
      <div
        className="navbar__brand"
        onClick={() => navigate("/")}
        style={{ cursor: "pointer" }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
        </svg>
        <span>InterviewAI</span>
      </div>

      {user && (
        <div className="navbar__profile" ref={dropdownRef}>
          <button
            className="avatar"
            onClick={() => setOpen((o) => !o)}
            aria-label="User menu"
          >
            {initials}
          </button>

          {open && (
            <div className="dropdown">
              <div className="dropdown__info">
                <div className="dropdown__avatar">{initials}</div>
                <div>
                  <p className="dropdown__name">{user.username}</p>
                  <p className="dropdown__email">{user.email}</p>
                </div>
              </div>
              <div className="dropdown__divider" />
              <button className="dropdown__logout" onClick={onLogout}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                Logout
              </button>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
