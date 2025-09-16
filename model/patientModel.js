const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const patientSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    username: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, unique: true, index: true },
    password: { type: String, required: true, minlength: 8 },
    dateOfBirth: { type: Date },
    gender: {
      type: String,
      enum: ["Male", "Female", "Other", "Prefer not to say"],
    },
    contact: {
      phone: { type: String },
      address: {
        street: { type: String },
        city: { type: String },
        state: { type: String },
        zipCode: { type: String },
      },
    },
    emergencyContact: {
      name: { type: String },
      phone: { type: String },
      relationship: { type: String },
    },
    medicalHistory: {
      conditions: [{ type: String }],
      allergies: [{ type: String }],
      medications: [
        {
          name: { type: String },
          dosage: { type: String },
          frequency: { type: String },
        },
      ],
    },
    insurance: {
      provider: { type: String },
      policyNumber: { type: String },
    },
    preferences: {
      preferredLanguage: { type: String, default: "English" },
      communicationMode: { type: String, enum: ["email", "phone", "sms"] },
    },
    avatar: { type: String, default: "default_avatar_url" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

patientSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

patientSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("Patient", patientSchema);
