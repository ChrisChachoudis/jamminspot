import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import Avatar from "./Avatar.jsx";

const navLinkClass = ({ isActive }) =>
  `px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
    isActive
      ? "bg-[var(--jm-jam)] text-white"
      : "text-[var(--jm-text-dim)] hover:text-[var(--jm-text)]"
  }`;

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="flex items-center justify-between px-6 py-3 border-b border-[var(--jm-border)] bg-[var(--jm-surface)]">
        <span className="font-[var(--jm-font-brand)] text-[var(--jm-jam)] text-xl">
          Jamminspot
        </span>

        <nav className="flex gap-2">
          <NavLink to="/discover" className={navLinkClass}>
            Discover
          </NavLink>
          <NavLink to="/music" className={navLinkClass}>
            Music
          </NavLink>
          <NavLink to="/jams" className={navLinkClass}>
            Jams
          </NavLink>
          <NavLink to="/friends" className={navLinkClass}>
            Friends
          </NavLink>
          <NavLink to="/messages" className={navLinkClass}>
            Messages
          </NavLink>
        </nav>

        <div className="flex items-center gap-3">
          <button className="px-4 py-2 rounded-full text-sm font-semibold bg-[var(--jm-rewind)] text-[#2e1c02]">
            Go Premium
          </button>
          <button onClick={() => navigate("/me")} title={user?.name || "Me"}>
            <Avatar media={user?.media} profilePhotoId={user?.profilePhotoId} name={user?.name} size={36} />
          </button>
          <button
            onClick={() => {
              logout();
              navigate("/login");
            }}
            className="text-xs text-[var(--jm-text-dim)] hover:text-[var(--jm-skip)]"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="flex-1 bg-[var(--jm-bg)]">
        <Outlet />
      </main>
    </div>
  );
}
