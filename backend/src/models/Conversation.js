import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
  {
    participants: [
      { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    ],
    // A conversation becomes a "Jam" once both participants have liked
    // each other; direct-message-only conversations stay isJam: false.
    isJam: { type: Boolean, default: false },
    jamAt: { type: Date },

    lastMessage: {
      text: { type: String },
      sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      sentAt: { type: Date },
    },
  },
  { timestamps: true }
);

conversationSchema.index({ participants: 1 });

export default mongoose.model("Conversation", conversationSchema);
