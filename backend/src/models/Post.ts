import { Schema, model } from 'mongoose';

export interface IImage {
  url: string;
  key: string;
  size: number;
  mimetype: string;
}

export interface IVideo {
  url: string;
  key: string;
  size: number;
  mimetype: string;
  duration?: number;
  thumbnail?: string;
  aspectRatio?: number;
  hasAudio?: boolean;
  views?: number;
}

export interface ILocation {
  name: string;
  address?: string;
  latitude?: number;
  longitude?: number;
}

export interface IPost {
  _id: Schema.Types.ObjectId;
  author: Schema.Types.ObjectId;
  content: string;
  images: IImage[];
  videos: IVideo[];
  likes: Schema.Types.ObjectId[];
  bookmarks: Schema.Types.ObjectId[];
  comments: {
    author: Schema.Types.ObjectId;
    content: string;
    createdAt: Date;
  }[];
  location?: ILocation;
  videoSettings?: {
    autoplay: boolean;
    loop: boolean;
    muted: boolean;
  };
  createdAt: Date;
}

const imageSchema = new Schema<IImage>({
  url: { type: String, required: true },
  key: { type: String, required: true },
  size: { type: Number, required: true },
  mimetype: { type: String, required: true },
});

const videoSchema = new Schema<IVideo>({
  url: { type: String, required: true },
  key: { type: String, required: true },
  size: { type: Number, required: true },
  mimetype: { type: String, required: true },
  duration: { type: Number },
  thumbnail: { type: String },
  aspectRatio: { type: Number },
  hasAudio: { type: Boolean },
  views: { type: Number, default: 0 },
});

const locationSchema = new Schema<ILocation>({
  name: { type: String, required: true },
  address: String,
  latitude: Number,
  longitude: Number,
});

const commentSchema = new Schema({
  author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const postSchema = new Schema<IPost>({
  author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, default: '' },
  images: { type: [imageSchema], default: [] },
  videos: { type: [videoSchema], default: [] },
  likes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  bookmarks: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  comments: { type: [commentSchema], default: [] },
  location: locationSchema,
  videoSettings: {
    autoplay: { type: Boolean, default: false },
    loop: { type: Boolean, default: true },
    muted: { type: Boolean, default: true }
  },
  createdAt: { type: Date, default: Date.now },
});

const Post = model<IPost>('Post', postSchema);
export { Post };
export default Post;