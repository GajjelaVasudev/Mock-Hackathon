function otpEmail(username, otp) {
    return `
    <div style="background-color:#F6F7F1; padding:40px 20px; font-family: Arial, sans-serif;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:420px; margin:0 auto; background-color:#ffffff; border-radius:14px; overflow:hidden; box-shadow:0 4px 16px rgba(30,36,32,0.12);">
        <tr>
          <td style="background-color:#3F6B4E; padding:22px 28px;">
            <span style="color:#ffffff; font-size:18px; font-weight:bold;">🌿 Trailhead</span>
          </td>
        </tr>
        <tr>
          <td style="padding:32px 28px;">
            <h2 style="margin:0 0 14px; color:#1E2420; font-size:19px;">Verify your email</h2>
            <p style="margin:0 0 6px; color:#4B564E; font-size:14px;">Hello ${username},</p>
            <p style="margin:0 0 22px; color:#4B564E; font-size:14px;">Use the code below to verify your account.</p>
            <div style="background-color:#E3EEE2; border-radius:10px; padding:22px; text-align:center; margin-bottom:22px;">
              <span style="font-size:34px; font-weight:bold; letter-spacing:10px; color:#3F6B4E;">${otp}</span>
            </div>
            <p style="margin:0 0 6px; color:#586255; font-size:13px;">This code expires in <b>5 minutes</b>.</p>
            <p style="margin:0; color:#9AA894; font-size:12px;">Didn't request this? You can safely ignore this email.</p>
          </td>
        </tr>
      </table>
    </div>
    `;
}

module.exports = otpEmail;