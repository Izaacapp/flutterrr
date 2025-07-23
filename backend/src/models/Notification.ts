import { Schema, model, Document } from 'mongoose';

export interface INotification extends Document {
  recipient: Schema.Types.ObjectId;
  sender: Schema.Types.ObjectId;
  type: 'follow' | 'like' | 'comment' | 'mention' | 'post';
  entityId?: Schema.Types.ObjectId;
  entityType?: 'post' | 'comment' | 'user';
  message: string;
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>({
  recipient: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  sender: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['follow', 'like', 'comment', 'mention', 'post'],
    required: true
  },
  entityId: {
    type: Schema.Types.ObjectId,
    refPath: 'entityType'
  },
  entityType: {
    type: String,
    enum: ['post', 'comment', 'user']
  },
  message: {
    type: String,
    required: true
  },
  read: {
    type: Boolean,
    default: false,
    index: true
  }
}, {
  timestamps: true
});

// Compound index for efficient queries
notificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, type: 1, createdAt: -1 });

const Notification = model<INotification>('Notification', notificationSchema);
export { Notification };
export default Notification;