import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client.js";
import Avatar from "../components/Avatar.jsx";

export default function Friends() {
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/jams").then(({ data }) => {
      setFriends(data.jams);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <div className="p-10 text-center text-[var(--jm-text-dim)]">Loading friends…</div>;
  }

  if (!friends.length) {
    return (
      <div className="p-10 text-center text-[var(--jm-text-dim)]">
        No friends yet — accept a Jam request in the Jams tab, or Jam someone in Discover.
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Friends</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {friends.map((friend) => (
          <div
            key={friend.conversationId}
            onClick={() => navigate(`/profile/${friend.musician?.id}`)}
            className="cursor-pointer bg-[var(--jm-surface)] border border-[var(--jm-border)] rounded-xl p-4 hover:border-[var(--jm-jam)] transition-colors"
          >
            <div className="flex items-center gap-3">
              <Avatar
                media={friend.musician?.media}
                profilePhotoId={friend.musician?.profilePhotoId}
                name={friend.musician?.name}
                size={44}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-semibold truncate">{friend.musician?.name || "Musician"}</span>
                  {friend.compatibility && (
                    <span className="text-xs font-semibold text-[var(--jm-jam)] shrink-0 ml-2">
                      {friend.compatibility.score}%
                    </span>
                  )}
                </div>
                <p className="text-xs text-[var(--jm-text-dim)] truncate">
                  {friend.musician?.specialties?.join(", ")}
                </p>
              </div>
            </div>

            {friend.lastMessage?.text && (
              <p className="text-sm mt-3 line-clamp-2 text-[var(--jm-text-dim)]">
                {friend.lastMessage.text}
              </p>
            )}

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/messages?conversation=${friend.conversationId}`);
              }}
              className="mt-3 text-xs font-semibold text-[var(--jm-message)] hover:underline"
            >
              💬 Message
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
