import { useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import Avatar from "./Avatar.jsx";

const desktopLinkClass = ({ isActive }) =>
  `px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
    isActive
      ? "bg-[var(--jm-jam)] text-white"
      : "text-[var(--jm-text-dim)] hover:text-[var(--jm-text)]"
  }`;

const mobileTabClass = ({ isActive }) =>
  `flex flex-col items-center justify-center gap-0.5 flex-1 py-2 text-[10px] font-semibold ${
    isActive ? "text-[var(--jm-jam)]" : "text-[var(--jm-text-dim)]"
  }`;

const Icon = ({ children }) => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {children}
  </svg>
);

const icons = {
  discover: (
    <Icon>
      <path d="M12 21s-7-4.6-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 5.4-7 10-7 10z" />
    </Icon>
  ),
  music: (
    <Icon>
      <path d="M9 18V5l11-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="17" cy="16" r="3" />
    </Icon>
  ),
  market: (
    <Icon>
      <path d="M3 9l1.5-5h15L21 9" />
      <path d="M4 9v11h16V9" />
      <path d="M9 20v-6h6v6" />
    </Icon>
  ),
  messages: (
    <Icon>
      <path d="M21 12a8 8 0 0 1-11.7 7L4 20l1.1-4.6A8 8 0 1 1 21 12z" />
    </Icon>
  ),
  more: (
    <Icon>
      <circle cx="5" cy="12" r="1.2" />
      <circle cx="12" cy="12" r="1.2" />
      <circle cx="19" cy="12" r="1.2" />
    </Icon>
  ),
};

// Secondary destinations — reachable from the "More" sheet on phones
// (the bottom bar only has room for the five most-used tabs).
const MORE_LINKS = [
  { to: "/near-me", label: "Near Me" },
  { to: "/jams", label: "Jam requests" },
  { to: "/friends", label: "Friends" },
  { to: "/me", label: "My profile" },
  { to: "/settings", label: "Settings" },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);

  const moreActive = MORE_LINKS.some((l) => location.pathname.startsWith(l.to));

  return (
    <div className="min-h-dvh flex flex-col">
      <header className="flex items-center justify-between gap-2 px-4 md:px-6 py-3 border-b border-[var(--jm-border)] bg-[var(--jm-surface)] sticky top-0 z-30">
        <span className="font-[var(--jm-font-brand)] text-[var(--jm-jam)] text-xl">Jamminspot</span>

        <nav className="hidden md:flex gap-2">
          <NavLink to="/discover" className={desktopLinkClass}>
            Discover
          </NavLink>
          <NavLink to="/music" className={desktopLinkClass}>
            Music
          </NavLink>
          <NavLink to="/near-me" className={desktopLinkClass}>
            Near Me
          </NavLink>
          <NavLink to="/jams" className={desktopLinkClass}>
            Jams
          </NavLink>
          <NavLink to="/friends" className={desktopLinkClass}>
            Friends
          </NavLink>
          <NavLink to="/market" className={desktopLinkClass}>
            Market
          </NavLink>
          <NavLink to="/messages" className={desktopLinkClass}>
            Messages
          </NavLink>
        </nav>

        <div className="flex items-center gap-3">
          <button className="hidden sm:block px-4 py-2 rounded-full text-sm font-semibold bg-[var(--jm-rewind)] text-[#2e1c02]">
            Go Premium
          </button>
          <button onClick={() => navigate("/me")} title={user?.name || "Me"}>
            <Avatar media={user?.media} profilePhotoId={user?.profilePhotoId} name={user?.name} size={36} />
          </button>
          <button
            onClick={() => navigate("/settings")}
            className="hidden md:block text-xs text-[var(--jm-text-dim)] hover:text-[var(--jm-text)]"
          >
            Settings
          </button>
          <button
            onClick={() => {
              logout();
              navigate("/login");
            }}
            className="hidden md:block text-xs text-[var(--jm-text-dim)] hover:text-[var(--jm-skip)]"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="flex-1 bg-[var(--jm-bg)] pb-20 md:pb-0">
        <Outlet />
      </main>

      {/* Phone bottom tab bar */}
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-30 flex bg-[var(--jm-surface)] border-t border-[var(--jm-border)]"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <NavLink to="/discover" className={mobileTabClass}>
          {icons.discover}
          Discover
        </NavLink>
        <NavLink to="/music" className={mobileTabClass}>
          {icons.music}
          Music
        </NavLink>
        <NavLink to="/market" className={mobileTabClass}>
          {icons.market}
          Market
        </NavLink>
        <NavLink to="/messages" className={mobileTabClass}>
          {icons.messages}
          Messages
        </NavLink>
        <button
          type="button"
          onClick={() => setMoreOpen(true)}
          className={mobileTabClass({ isActive: moreActive })}
        >
          {icons.more}
          More
        </button>
      </nav>

      {moreOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/60" onClick={() => setMoreOpen(false)}>
          <div
            className="absolute bottom-0 inset-x-0 bg-[var(--jm-surface)] border-t border-[var(--jm-border)] rounded-t-2xl p-4"
            style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom))" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 rounded-full bg-[var(--jm-border)] mx-auto mb-3" />
            {MORE_LINKS.map((l) => (
              <button
                key={l.to}
                type="button"
                onClick={() => {
                  setMoreOpen(false);
                  navigate(l.to);
                }}
                className="block w-full text-left px-3 py-3.5 text-base font-medium rounded-xl hover:bg-[var(--jm-surface-2)]"
              >
                {l.label}
              </button>
            ))}
            <button
              type="button"
              className="block w-full text-left px-3 py-3.5 text-base font-medium rounded-xl text-[var(--jm-rewind)] hover:bg-[var(--jm-surface-2)]"
            >
              Go Premium
            </button>
            <button
              type="button"
              onClick={() => {
                setMoreOpen(false);
                logout();
                navigate("/login");
              }}
              className="block w-full text-left px-3 py-3.5 text-base font-medium rounded-xl text-[var(--jm-skip)] hover:bg-[var(--jm-surface-2)]"
            >
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
