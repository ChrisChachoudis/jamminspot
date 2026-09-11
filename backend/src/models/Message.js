import mongoose from "mongoose";

// Note: no typing-indicator fields here on purpose — that system was
// removed from Jamminspot and should not be reintroduced without a
// deliberate product decision.
const messageSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, trim: true, maxlength: 2000 },
    readAt: { type: Date },
  },
  { timestamps: true }
);

messageSchema.index({ conversation: 1, createdAt: 1 });

export default mongoose.model("Message", messageSchema);
