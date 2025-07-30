
"use server";

import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendWelcomeEmail(email: string, username: string) {
  try {
    const { data, error } = await resend.emails.send({
      from: "ENVO-EARN <onboarding@resend.dev>",
      to: [email],
      subject: "Welcome to ENVO-EARN!",
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2>Welcome to ENVO-EARN, ${username}!</h2>
          <p>We are thrilled to have you on board. You have successfully created your account and your investment journey has begun.</p>
          <p>You can now log in to your dashboard to track your daily earnings and manage your account:</p>
          <a href="https://your-app-url/signin" style="background-color: #FFA500; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Go to Dashboard
          </a>
          <p>If you have any questions, feel free to contact our support team.</p>
          <p>Happy earning!</p>
          <p><strong>The ENVO-EARN Team</strong></p>
        </div>
      `,
    });

    if (error) {
      console.error("Resend error:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Failed to send email:", error);
    return { success: false, error: "An unexpected error occurred." };
  }
}
