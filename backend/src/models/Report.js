import mongoose from "mongoose";

export const REPORT_REASONS = [
  "spam",
  "fake_profile",
  "harassment",
  "inappropriate_content",
  "scam",
  "underage",
  "other",
];

const reportSchema = new mongoose.Schema(
  {
    reporter: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    reported: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    reason: { type: String, enum: REPORT_REASONS, required: true },
    details: { type: String, trim: true, maxlength: 1000, default: "" },
    status: { type: String, enum: ["open", "reviewed", "actioned"], default: "open" },
  },
  { timestamps: true }
);

export default mongoose.model("Report", reportSchema);
