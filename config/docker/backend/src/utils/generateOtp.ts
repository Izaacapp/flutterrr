import { strictDateExtraction } from "../utils/dateStrict";
import { safeStrictDateExtraction } from "../utils/dateStrict";
const generateOtp = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export default generateOtp;