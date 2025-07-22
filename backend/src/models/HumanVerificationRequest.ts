import mongoose, { Document, Schema } from 'mongoose';

export interface IHumanVerificationRequest extends Document {
  userId: mongoose.Types.ObjectId;
  imageUrl: string;
  missingFields: string[];
  extractedData: any;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  priority: number;
  submittedAt: Date;
  completedAt?: Date;
  completedData?: any;
  reviewer?: mongoose.Types.ObjectId;
  notes?: string;
}

const humanVerificationRequestSchema = new Schema<IHumanVerificationRequest>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  imageUrl: {
    type: String,
    required: true
  },
  missingFields: [{
    type: String,
    required: true
  }],
  extractedData: {
    type: Schema.Types.Mixed,
    default: {}
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'failed'],
    default: 'pending'
  },
  priority: {
    type: Number,
    default: 0
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: Date,
  completedData: Schema.Types.Mixed,
  reviewer: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  notes: String
}, {
  timestamps: true
});

// Indexes for efficient queries
humanVerificationRequestSchema.index({ status: 1, priority: -1, submittedAt: 1 });
humanVerificationRequestSchema.index({ userId: 1, status: 1 });

const HumanVerificationRequest = mongoose.model<IHumanVerificationRequest>('HumanVerificationRequest', humanVerificationRequestSchema);

export default HumanVerificationRequest;