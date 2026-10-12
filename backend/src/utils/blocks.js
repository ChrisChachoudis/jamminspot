import User from "../models/User.js";

// Everyone who should never see, or be seen by, this user: people they
// blocked and people who blocked them.
export async function getBlockedIds(userId) {
  const [me, blockedMe] = await Promise.all([
    User.findById(userId).select("blockedUsers"),
    User.find({ blockedUsers: userId }).select("_id"),
  ]);
  return new Set([
    ...(me?.blockedUsers || []).map((id) => id.toString()),
    ...blockedMe.map((u) => u._id.toString()),
  ]);
}
