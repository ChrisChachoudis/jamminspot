import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "../api/client.js";
import Avatar from "../components/Avatar.jsx";

export default function Messages() {
  const [searchParams] = useSearchParams();
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(searchParams.get("conversation"));
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [newTarget, setNewTarget] = useState(null);
  const [icebreakerLoading, setIcebreakerLoading] = useState(false);

  const targetUserId = searchParams.get("to");

  async function loadConversations() {
    const { data } = await api.get("/messages");
    setConversations(data.conversations);
  }

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (!activeId) return;
    api.get(`/messages/${activeId}`).then(({ data }) => setMessages(data.messages));
  }, [activeId]);

  useEffect(() => {
    if (activeId || !targetUserId) return;
    api.get(`/users/${targetUserId}`).then(({ data }) => setNewTarget(data.user));
  }, [activeId, targetUserId]);

  const active = conversations.find((c) => c.conversationId === activeId);
  const displayedMusician = active?.musician || newTarget;

  async function suggestOpener() {
    if (!targetUserId) return;
    setIcebreakerLoading(true);
    setError("");
    try {
      const { data } = await api.post("/ai/icebreaker", { targetUserId });
      setDraft(data.message);
    } catch (err) {
      setError(err.response?.data?.error || "Could not suggest an opener right now");
    } finally {
      setIcebreakerLoading(false);
    }
  }

  async function send() {
    if (!draft.trim()) return;
    setError("");
    try {
      if (activeId) {
        const { data } = await api.post(`/messages/${activeId}`, { text: draft });
        setMessages((m) => [...m, data.message]);
      } else {
        const targetUserId = searchParams.get("to");
        const { data } = await api.post("/messages/direct", { targetUserId, text: draft });
        setActiveId(data.conversationId);
        setMessages([data.message]);
        await loadConversations();
      }
      setDraft("");
    } catch (err) {
      setError(err.response?.data?.error || "Could not send message");
    }
  }

  return (
    <div className="grid grid-cols-[280px_1fr_280px] h-[calc(100vh-64px)]">
      <aside className="border-r border-[var(--jm-border)] overflow-y-auto">
        {conversations.map((c) => (
          <button
            key={c.conversationId}
            onClick={() => setActiveId(c.conversationId)}
            className={`w-full text-left px-4 py-3 border-b border-[var(--jm-border)] hover:bg-[var(--jm-surface)] ${
              c.conversationId === activeId ? "bg-[var(--jm-surface)]" : ""
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Avatar
                media={c.musician?.media}
                profilePhotoId={c.musician?.profilePhotoId}
                name={c.musician?.name}
                size={36}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm truncate">
                    {c.musician?.name || "Musician"}
                  </span>
                  {c.isJam && <span className="text-[10px] text-[var(--jm-jam)] shrink-0">JAM</span>}
                </div>
                <p className="text-xs text-[var(--jm-text-dim)] line-clamp-1">
                  {c.lastMessage?.text || "No messages yet"}
                </p>
              </div>
            </div>
          </button>
        ))}
        {!conversations.length && (
          <p className="p-4 text-sm text-[var(--jm-text-dim)]">No conversations yet.</p>
        )}
      </aside>

      <section className="flex flex-col">
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {messages.map((m) => (
            <div
              key={m._id}
              className={`max-w-[70%] px-3 py-2 rounded-xl text-sm ${
                m.sender === active?.musician?.id
                  ? "bg-[var(--jm-surface-2)] mr-auto"
                  : "bg-[var(--jm-jam)] text-white ml-auto"
              }`}
            >
              {m.text}
            </div>
          ))}
          {!messages.length && (
            <p className="text-sm text-[var(--jm-text-dim)]">Say hello 👋</p>
          )}
        </div>

        {error && <p className="form-error px-4">{error}</p>}

        {!activeId && targetUserId && (
          <div className="px-4 pb-2">
            <button
              type="button"
              onClick={suggestOpener}
              disabled={icebreakerLoading}
              className="px-4 py-2 rounded-full text-sm font-semibold bg-[var(--jm-surface-2)] border border-[var(--jm-jam)] text-[var(--jm-jam)] disabled:opacity-40"
            >
              {icebreakerLoading ? "Thinking…" : "✨ Suggest opener"}
            </button>
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
          className="flex gap-2 p-3 border-t border-[var(--jm-border)]"
        >
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Type a message…"
            className="flex-1 bg-[var(--jm-surface-2)] border border-[var(--jm-border)] rounded-full px-4 py-2 text-sm outline-none focus:border-[var(--jm-jam)]"
          />
          <button type="submit" className="btn-jam !mt-0 px-5">
            Send
          </button>
        </form>
      </section>

      <aside className="border-l border-[var(--jm-border)] p-4">
        {displayedMusician ? (
          <div>
            <Link to={`/profile/${displayedMusician.id}`} className="flex items-center gap-3 mb-3">
              <Avatar
                media={displayedMusician.media}
                profilePhotoId={displayedMusician.profilePhotoId}
                name={displayedMusician.name}
                size={48}
              />
              <div>
                <h3 className="font-semibold">{displayedMusician.name}</h3>
                <p className="text-xs text-[var(--jm-text-dim)]">{displayedMusician.city}</p>
              </div>
            </Link>
            <div className="flex flex-wrap gap-1.5">
              {displayedMusician.instruments?.map((i) => (
                <span
                  key={i}
                  className="text-xs px-2 py-1 rounded-full bg-[var(--jm-surface-2)] border border-[var(--jm-border)]"
                >
                  {i}
                </span>
              ))}
              {displayedMusician.genres?.map((g) => (
                <span
                  key={g}
                  className="text-xs px-2 py-1 rounded-full bg-[var(--jm-surface-2)] border border-[var(--jm-border)]"
                >
                  {g}
                </span>
              ))}
            </div>
            {displayedMusician.bio && (
              <p className="text-sm mt-3 text-[var(--jm-text-dim)]">{displayedMusician.bio}</p>
            )}
          </div>
        ) : (
          <p className="text-sm text-[var(--jm-text-dim)]">Select a conversation</p>
        )}
      </aside>
    </div>
  );
}
