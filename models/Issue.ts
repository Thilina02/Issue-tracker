import { Schema, model, models } from "mongoose";

const issueSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      minlength: 5,
    },
    status: {
      type: String,
      enum: ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"],
      default: "OPEN",
    },
    priority: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
      default: "MEDIUM",
    },
    severity: {
      type: String,
      enum: ["MINOR", "MAJOR", "BLOCKER"],
      default: "MINOR",
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

issueSchema.index({ title: "text", description: "text" });

const Issue = models.Issue || model("Issue", issueSchema);

export default Issue;
