type EmailSection = { title: string; items: string[] };

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function buildReminderEmail(opts: {
  headline: string;
  message: string;
  ctaLabel?: string;
}): { html: string; text: string } {
  const headline = escapeHtml(opts.headline);
  const message = escapeHtml(opts.message);
  const text = `${opts.headline}\n\n${opts.message}\n\n— Dayly`;

  const html = `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:ui-sans-serif,system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
        <tr><td style="background:linear-gradient(135deg,#3b82f6,#8b5cf6);padding:28px 32px;">
          <p style="margin:0;color:rgba(255,255,255,0.85);font-size:12px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;">Dayly</p>
          <h1 style="margin:8px 0 0;color:#fff;font-size:22px;font-weight:700;">${headline}</h1>
        </td></tr>
        <tr><td style="padding:28px 32px;">
          <p style="margin:0 0 20px;color:#374151;font-size:16px;line-height:1.6;">${message}</p>
          <p style="margin:0;color:#9ca3af;font-size:13px;">Open Dayly to manage your schedule.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return { html, text };
}

export function buildDigestEmail(opts: {
  headline: string;
  intro: string;
  sections: EmailSection[];
}): { html: string; text: string } {
  const headline = escapeHtml(opts.headline);
  const intro = escapeHtml(opts.intro);

  const sectionHtml = opts.sections
    .filter((s) => s.items.length > 0)
    .map(
      (s) => `
        <div style="margin-bottom:20px;">
          <p style="margin:0 0 8px;font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:#6b7280;">${escapeHtml(s.title)}</p>
          <ul style="margin:0;padding:0;list-style:none;">
            ${s.items.map((item) => `<li style="padding:8px 12px;margin-bottom:6px;background:#f9fafb;border-radius:8px;color:#111827;font-size:14px;">${escapeHtml(item)}</li>`).join('')}
          </ul>
        </div>`
    )
    .join('');

  const textSections = opts.sections
    .filter((s) => s.items.length > 0)
    .map((s) => `${s.title}:\n${s.items.map((i) => `• ${i}`).join('\n')}`)
    .join('\n\n');

  const text = `${opts.headline}\n\n${opts.intro}\n\n${textSections}\n\n— Dayly`;

  const html = `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:ui-sans-serif,system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
        <tr><td style="background:linear-gradient(135deg,#3b82f6,#8b5cf6);padding:28px 32px;">
          <p style="margin:0;color:rgba(255,255,255,0.85);font-size:12px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;">Dayly</p>
          <h1 style="margin:8px 0 0;color:#fff;font-size:22px;font-weight:700;">${headline}</h1>
        </td></tr>
        <tr><td style="padding:28px 32px;">
          <p style="margin:0 0 24px;color:#374151;font-size:15px;line-height:1.6;">${intro}</p>
          ${sectionHtml}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return { html, text };
}

export function reminderSubject(kind: string, title: string): string {
  if (kind === 'daily_summary') return 'Your Dayly morning summary';
  if (kind === 'missed_tasks') return 'Catch up — missed items in Dayly';
  if (kind.startsWith('habit_')) return `Habit reminder: ${title}`;
  return `Reminder: ${title}`;
}
