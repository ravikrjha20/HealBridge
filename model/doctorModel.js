const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const doctorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    username: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, unique: true, index: true },
    password: { type: String, required: true, minlength: 8 },
    specialization: { type: String, required: true },
    qualifications: [
      {
        degree: { type: String },
        university: { type: String },
        year: { type: Number },
      },
    ],
    license: {
      number: { type: String, required: true, unique: true },
      state: { type: String, required: true },
      expiryDate: { type: Date },
    },
    experience: { type: Number, default: 0 }, // in years
    availability: [
      {
        day: {
          type: String,
          enum: [
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
            "Sunday",
          ],
        },
        slots: [
          {
            startTime: { type: String },
            endTime: { type: String },
          },
        ],
      },
    ],
    rating: {
      average: { type: Number, default: 0 },
      count: { type: Number, default: 0 },
    },
    reviews: [
      {
        patient: { type: mongoose.Schema.Types.ObjectId, ref: "Patient" },
        rating: { type: Number },
        comment: { type: String },
        date: { type: Date, default: Date.now },
      },
    ],
    avatar: { type: String, default: "default_avatar_url" },
    isVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

doctorSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

doctorSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("Doctor", doctorSchema);
