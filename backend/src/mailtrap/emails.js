const { PASSWORD_RESET_REQUEST_TEMPLATE, VERIFICATION_EMAIL_TEMPLATE, WELCOME_EMAIL_TEMPLATE, PASSWORD_RESET_SUCCESS_TEMPLATE, PASSWORD_RESET_OTP_TEMPLATE } = require("./emailTemplate.js");
const { mailtrapClient, sender } = require("./mailtrap.config.js");

const sendVerificationEmail = async (email, verificationToken, name) => {
    const recipient = [{ email }];

    try {
        const response = await mailtrapClient.send({
            from: sender,
            to: recipient,
            subject: "Verify Your Email",
            html: VERIFICATION_EMAIL_TEMPLATE
                .replace("{verificationCode}", verificationToken)
                .replace("{name}", name),
            category: "Email Verification"
        })
        console.log("Email sent successfully:", response);
    } catch (error) {
        console.error("Error sending verification email:", error);
        throw new Error(`Failed to send verification email: ${error}`);
    }
};

const sendPasswordResetOTP = async (email, otp, name) => {
    const recipient = [{ email }];

    try {
        const response = await mailtrapClient.send({
            from: sender,
            to: recipient,
            subject: "Password Reset Code",
            html: PASSWORD_RESET_OTP_TEMPLATE
                .replace("{verificationCode}", otp)
                .replace("{name}", name),
            category: "Password Reset OTP"
        });

        console.log("Password reset OTP email sent successfully", response);
    } catch (error) {
        console.error("Error sending password reset OTP email:", error);
        throw new Error(`Error sending password reset OTP email: ${error}`);
    }
};

const sendWelcomeEmail = async (email, name) => {
    const recipient = [{ email }];

    try {
        const response = await mailtrapClient.send({
            from: sender,
            to: recipient,
            subject: "Welcome to Passport Buddy!",
            html: WELCOME_EMAIL_TEMPLATE.replace("{name}", name),
            category: "Welcome Email"
        });

        console.log("Welcome email sent successfully", response);
    } catch (error) {
        console.error(`Error sending welcome email`, error);
        throw new Error(`Error sending welcome email: ${error}`);
    }
};

const sendPasswordResetSuccessEmail = async (email, name) => {
    const recipient = [{ email }];

    try {
        const response = await mailtrapClient.send({
            from: sender,
            to: recipient,
            subject: "Password Reset Successful",
            html: PASSWORD_RESET_SUCCESS_TEMPLATE.replace("{name}", name),
            category: "Password Reset Success"
        });

        console.log("Password reset success email sent successfully", response);
    } catch (error) {
        console.error(`Error sending password reset success email`, error);
        throw new Error(`Error sending password reset success email: ${error}`);
    }
};

module.exports = {
    sendVerificationEmail,
    sendPasswordResetOTP,  
    sendWelcomeEmail,
    sendPasswordResetSuccessEmail
};