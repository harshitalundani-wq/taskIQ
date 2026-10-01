import mongoose from 'mongoose';

const signupOTPSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true,
  },
  otpHash: {
    type: String,
    required: true,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
  verified: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 900, // Document expires and auto-removes after 15 minutes
  },
});

const SignupOTP = mongoose.model('SignupOTP', signupOTPSchema);

export default SignupOTP;
