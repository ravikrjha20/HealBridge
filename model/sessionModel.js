const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema(
  {
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
      index: true,
    },
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
      index: true,
    },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    sessionType: {
      type: String,
      enum: ["video", "audio", "chat"],
      default: "video",
    },
    aiReport: {
      moodAnalysis: { type: String },
      sentimentAnalysis: { type: String },
      keyTopics: [{ type: String }],
      summary: { type: String },
    },
    doctorNotes: { type: String, select: false }, // Hidden by default
    patientFeedback: {
      rating: { type: Number, min: 1, max: 5 },
      comment: { type: String },
    },
    status: {
      type: String,
      enum: ["scheduled", "completed", "cancelled"],
      default: "scheduled",
    },
    payment: {
      amount: { type: Number },
      status: {
        type: String,
        enum: ["pending", "paid", "failed"],
        default: "pending",
      },
      transactionId: { type: String },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Session", sessionSchema);
