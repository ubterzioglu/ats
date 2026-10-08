import "server-only";

export interface SignupMailFacts {
  readonly email: string;
  readonly providerLabel: string;
  readonly timeLabel: string;
}

const BED = "#000000";
const SHEET = "#111113";
const LINE = "#27272a";
const INK = "#ffffff";
const MUTED = "#a1a1aa";
const MARK = "#ff7a1a";
const GOOD = "#a3e635";

const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

// The address comes from an external identity provider and lands inside markup,
// so every interpolated value goes through this.
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function row(label: string, value: string, last: boolean): string {
  const border = last ? "" : `border-bottom:1px solid ${LINE};`;
  return `<tr>
<td style="padding:14px 0;${border}font-family:${FONT};font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:${MUTED};width:110px;vertical-align:top;">${escapeHtml(label)}</td>
<td style="padding:14px 0;${border}font-family:${FONT};font-size:15px;color:${INK};vertical-align:top;word-break:break-all;">${value}</td>
</tr>`;
}

export function renderSignupHtml(facts: SignupMailFacts): string {
  const email = escapeHtml(facts.email);
  const emailCell = `<span style="color:${INK};font-weight:600;">${email}</span>`;
  const providerCell = `<span style="display:inline-block;padding:3px 10px;border-radius:999px;background:${BED};border:1px solid ${LINE};color:${GOOD};font-size:13px;">${escapeHtml(facts.providerLabel)}</span>`;
  const timeCell = escapeHtml(facts.timeLabel);

  return `<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="dark">
<title>Yeni kayıt</title>
</head>
<body style="margin:0;padding:0;background:${BED};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${email} kaydını onayladı.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${BED}" style="background:${BED};">
<tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;">
<tr><td style="padding:0 4px 16px;font-family:${FONT};font-size:13px;letter-spacing:0.12em;text-transform:uppercase;color:${MARK};font-weight:700;">ats readability</td></tr>
<tr><td bgcolor="${SHEET}" style="background:${SHEET};border:1px solid ${LINE};border-top:3px solid ${MARK};border-radius:12px;padding:28px 28px 20px;">
<h1 style="margin:0 0 6px;font-family:${FONT};font-size:22px;line-height:1.3;color:${INK};">Yeni bir kullanıcı katıldı</h1>
<p style="margin:0 0 20px;font-family:${FONT};font-size:14px;line-height:1.5;color:${MUTED};">Bir kullanıcı hesabını onayladı.</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid ${LINE};">
${row("E-posta", emailCell, false)}
${row("Sağlayıcı", providerCell, false)}
${row("Zaman", timeCell, true)}
</table>
</td></tr>
<tr><td style="padding:16px 4px 0;font-family:${FONT};font-size:12px;line-height:1.5;color:${MUTED};">Bu ileti, yeni bir hesap onaylandığında otomatik gönderilir.</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}
