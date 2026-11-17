import "server-only";

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

// Same shell as the Supabase auth templates in supabase/templates/; keep the two in step.
function brandedHtml(heading: string, body: string) {
  return `<!doctype html>
<html>
<body style="margin:0;padding:0;background:#030b1d;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="#030b1d" style="background:#030b1d;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;">
<tr><td align="center">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;">
    <tr><td style="padding:0 0 20px;font-size:22px;font-weight:bold;color:#fafafa;">Thorax<span style="color:#51b6ff;">Scan</span></td></tr>
    <tr><td bgcolor="#010d2a" style="background:#010d2a;border:1px solid #33425c;border-radius:12px;padding:32px;">
      <h1 style="margin:0 0 12px;font-size:20px;color:#fafafa;">${heading}</h1>
      ${body}
    </td></tr>
  </table>
</td></tr>
</table>
</body>
</html>`;
}

/**
 * Tells an applicant the review result through Resend's HTTP API.
 * Returns false when it could not send; the review itself has already been saved.
 * Without RESEND_API_KEY/EMAIL_FROM (e.g. local dev) it sends nothing.
 */
export async function sendProfessorReviewEmail(to: string, name: string, decision: "approved" | "rejected", reason: string | null) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) return false;

  const loginUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/login`;
  const approved = decision === "approved";
  const safeName = escapeHtml(name);
  const text = approved
    ? `Hi ${name},\n\nYour ThoraxScan Professor application has been approved. You can now log in and create teaching workspaces:\n${loginUrl}\n\n— ThoraxScan`
    : `Hi ${name},\n\nYour ThoraxScan Professor application was not approved.${reason ? `\n\nReason: ${reason}` : ""}\n\nContact an administrator if your eligibility has changed.\n\n— ThoraxScan`;
  const html = approved
    ? brandedHtml(
        "Your Professor access is approved",
        `<p style="margin:0 0 24px;font-size:15px;line-height:22px;color:#c7d4e8;">Hi ${safeName}, an administrator approved your Professor application. You can now create and manage teaching workspaces.</p>
      <a href="${escapeHtml(loginUrl)}" style="display:inline-block;background:#0077ff;color:#ffffff;text-decoration:none;font-size:15px;font-weight:bold;padding:12px 24px;border-radius:8px;">Log in to ThoraxScan</a>`,
      )
    : brandedHtml(
        "Your Professor application was not approved",
        `<p style="margin:0 0 16px;font-size:15px;line-height:22px;color:#c7d4e8;">Hi ${safeName}, an administrator reviewed your Professor application and did not approve it.</p>
      ${reason ? `<p style="margin:0 0 16px;font-size:15px;line-height:22px;color:#c7d4e8;"><strong style="color:#fafafa;">Reason:</strong> ${escapeHtml(reason)}</p>` : ""}
      <p style="margin:0;font-size:13px;line-height:20px;color:#aebbd0;">Contact an administrator if your eligibility has changed.</p>`,
      );

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to,
        subject: approved ? "Your ThoraxScan Professor access is approved" : "Your ThoraxScan Professor application",
        html,
        text,
      }),
    });
    return response.ok;
  } catch {
    return false;
  }
}
