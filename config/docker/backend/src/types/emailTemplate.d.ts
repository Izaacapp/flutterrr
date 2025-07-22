import { strictDateExtraction } from "../utils/dateStrict";
import { safeStrictDateExtraction } from "../utils/dateStrict";
declare module '../mailtrap/emailTemplate.js' {
  export const VERIFICATION_EMAIL_TEMPLATE: string;
  export const WELCOME_EMAIL_TEMPLATE: string;
  export const PASSWORD_RESET_OTP_TEMPLATE: string;
  export const PASSWORD_RESET_SUCCESS_TEMPLATE: string;
  export const PASSWORD_RESET_REQUEST_TEMPLATE: string;
}