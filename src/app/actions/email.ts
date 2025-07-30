
"use server";

import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendWelcomeEmail(email: string, username: string) {
  try {
    const { data, error } = await resend.emails.send({
      from: "ENVO-EARN <onboarding@resend.dev>",
      to: [email],
      subject: "Welcome to ENVO EARN - Your Account is Ready!",
      html: `
        <!DOCTYPE html>
        <html lang="en" style="font-family: Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 0;">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
          <title>Welcome to ENVO EARN</title>
        </head>
        <body style="background-color:#f5f5f5; margin:0; padding:0;">
          <table align="center" width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 10px; overflow: hidden;">
            <tr>
              <td style="background-color: #004d4d; padding: 20px; text-align:center;">
                <h1 style="color:#ffffff; margin:10px 0;">Welcome to ENVO EARN</h1>
              </td>
            </tr>
            <tr>
              <td style="padding: 30px; text-align: center; color: #333333;">
                <h2 style="margin-bottom: 10px;">🎉 Congratulations, Your Account is Ready!</h2>
                <p style="font-size: 16px; line-height: 1.6;">
                  Hi <strong>${username}</strong>, <br/><br/>
                  Your ENVO EARN account is now *active* and your daily earning of <strong>200 PKR</strong> has started.  
                  Check your dashboard to view your investment and earnings.
                </p>
                <a href="https://envo-investment.vercel.app/dashboard" style="display:inline-block; margin-top:20px; background-color:#004d4d; color:#ffffff; text-decoration:none; padding:12px 24px; border-radius:6px; font-weight:bold;">
                  Go to Dashboard
                </a>
                <p style="margin-top:30px; font-size: 14px; color: #777777;">
                  Thank you for trusting ENVO EARN. Earn Smart, Earn Daily! 💰
                </p>
              </td>
            </tr>
            <tr>
              <td style="background-color: #eeeeee; text-align:center; padding: 15px; font-size: 12px; color:#777777;">
                © 2025 ENVO EARN. All rights reserved.
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error("Resend error:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error: unknown) {
    console.error("Failed to send email:", error);
    if (error instanceof Error) {
        return { success: false, error: error.message };
    }
    return { success: false, error: "An unexpected error occurred during email sending." };
  }
}
