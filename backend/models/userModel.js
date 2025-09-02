import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },

  rollNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },

  role: {
    type: String,
    enum: ["student", "alumni"],
    required: true
  },

  batch: {
    type: String,
    match: [/^\d{4}-\d{2}$/, "Batch must be in format YYYY-YY (e.g., 2022-26)"],
    required: true
  },

  password: {
    type: String,
    required: true
  },

  department: {
    type: String,
    required: true,
    trim: true
  },

  currentEmploymentStatus: {
    type: String,
    trim: true,
    required: function () {
      return this.role === "alumni";
    }
  },

  followers: [
    { type: mongoose.Schema.Types.ObjectId, ref: "User" }
  ],
  following: [
    { type: mongoose.Schema.Types.ObjectId, ref: "User" }
  ]

}, { timestamps: true });

const User = mongoose.model("User", userSchema);

export default User;
