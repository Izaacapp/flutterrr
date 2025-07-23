import { safeStrictDateExtraction } from "../utils/dateStrict";
import { UploadResult } from '../../services/storage.service';

declare global {
  namespace Express {
    interface Request {
      user?: any;
      uploadedImages?: UploadResult[];
      uploadedVideos?: UploadResult[];
      uploadedAvatar?: UploadResult;
    }
  }
}