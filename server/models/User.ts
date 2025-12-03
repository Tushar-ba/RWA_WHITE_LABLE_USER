import mongoose, { Schema, Document } from 'mongoose';
import { User as UserInterface, AccountStatus } from '@shared/schema';

export interface IUser extends Omit<UserInterface, '_id'>, Document {
  _id: mongoose.Types.ObjectId;
}

const UserSchema = new Schema<IUser>({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password_hash: {
    type: String,
    required: true
  },
  username: {
    type: String,
    trim: true
  },
  partyId: {
    type: String,
    trim: true
  },
  first_name: {
    type: String,
    trim: true
  },
  last_name: {
    type: String,
    trim: true
  },
  phone_number: {
    type: String,
    trim: true
  },
  organization_name: {
    type: String,
    trim: true
  },
  country: {
    type: String,
    required: true,
    trim: true
  },
  state: {
    type: String,
    required: true,
    trim: true
  },
  account_status: {
    type: String,
    enum: ['unverified', 'verified', 'suspended'],
    default: 'unverified'
  },
  email_verified: {
    type: Boolean,
    default: false
  },
  email_verification_token: String,
  email_verification_expires: Date,
  otp_attempts: {
    type: Number,
    default: 0
  },
  password_reset_token: String,
  password_reset_expires: Date,
  last_otp_sent: Date,
  referral_code: String,
  terms_accepted: {
    type: Boolean,
    required: true
  },
  last_login: Date,
  two_factor_enabled: {
    type: Boolean,
    default: false
  },
  two_factor_token: String,
  two_factor_expires: Date,
  // Account Profile fields
  purpose_of_account: String,
  expected_transaction_activity: String,
  is_politically_exposed: Boolean,
  // FATCA/CRS fields (for individual accounts)
  is_fatca_crs: Boolean,
  tin: String,
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  collection: 'users'
});

// Indexes for performance
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ referral_code: 1 });
UserSchema.index({ created_at: -1 });

export const User = mongoose.model<IUser>('User', UserSchema);