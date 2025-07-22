import { Schema, model, Document } from 'mongoose';

export enum NotificationType {
  LIKE = 'like',
  COMMENT = 'comment',
  FOLLOW = 'follow',
  POST_MENTION = 'post_mention',
  COMMENT_MENTION = 'comment_mention'
}

export interface INotification extends Document {
  _id: Schema.Types.ObjectId;
  recipient: Schema.Types.ObjectId;
  sender: Schema.Types.ObjectId;
  type: NotificationType;
  message: string;
  relatedPost?: Schema.Types.ObjectId;
  relatedComment?: string;
  isRead: boolean;
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
    enum: Object.values(NotificationType),
    required: true
  },
  message: {
    type: String,
    required: true,
    maxlength: 200
  },
  relatedPost: {
    type: Schema.Types.ObjectId,
    ref: 'Post',
    required: false
  },
  relatedComment: {
    type: String,
    required: false
  },
  isRead: {
    type: Boolean,
    default: false,
    index: true
  }
}, {
  timestamps: true
});

// Compound index for efficient querying
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, isRead: 1 });

const Notification = model<INotification>('Notification', notificationSchema);

export default Notification;