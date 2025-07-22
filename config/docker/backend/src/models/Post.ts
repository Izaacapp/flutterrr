import { strictDateExtraction } from "../utils/dateStrict";
import { safeStrictDateExtraction } from "../utils/dateStrict";
import { Schema, model } from 'mongoose';

export interface IImage {
  url: string;
  key: string;
  size: number;
  mimetype: string;
}

export interface IPost {
  _id: Schema.Types.ObjectId;
  author: Schema.Types.ObjectId;
  content: string;
  images: IImage[];
  likes: Schema.Types.ObjectId[];
  comments: {
    author: Schema.Types.ObjectId;
    content: string;
    createdAt: Date;
  }[];
  location?: {
    name: string;
    lat?: number;
    lng?: number;
  };
  createdAt: Date;
}

const imageSchema = new Schema<IImage>({
  url: { type: String, required: true },
  key: { type: String, required: true },
  size: { type: Number, required: true },
  mimetype: { type: String, required: true },
});

const commentSchema = new Schema({
  author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const postSchema = new Schema<IPost>({
  author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  images: { type: [imageSchema], default: [] },
  likes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  comments: { type: [commentSchema], default: [] },
  location: {
    name: String,
    lat: Number,
    lng: Number,
  },
  createdAt: { type: Date, default: Date.now },
});

const Post = model<IPost>('Post', postSchema);

export default Post;