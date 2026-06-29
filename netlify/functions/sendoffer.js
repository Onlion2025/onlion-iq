// Netlify Function: sendoffer.js
// Sendet die ONLION Angebotsmappe (PDF) per Resend an Kunde + intern
// PDF wird als statische Datei von onlionapp.de geladen (kein base64)

exports.handler = async (event) => {

  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS"
      },
      body: ""
    };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: "Method Not Allowed" })
    };
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: "Resend API key not configured" })
    };
  }

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch (e) {
    return {
      statusCode: 400,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: "Invalid request" })
    };
  }

  const email    = body.email   || "";
  const firma    = body.firma   || "";
  const branche  = body.branche || "";
  const score    = parseInt(body.score) || 0;
  const lang     = (body.lang || "de").toLowerCase();

  if (!email) {
    return {
      statusCode: 400,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: "Missing email" })
    };
  }

  const ABSENDER     = "ONLION IQ <info@onlionapp.de>";
  const INTERN_EMAIL = "onlion-@outlook.de";
  const CALENDLY     = "https://calendly.com/ridge-linear5958-eagereverest/30min";
  const PDF_URL      = "https://onlionapp.de/onlion-angebotsmappe.pdf";
  const isDE = lang !== "en" && lang !== "pl";

  // Empfohlenes Paket
  let paket, paketPreis, paketDauer, paketIcon;
  if (score <= 35) {
    paket = "KI-Potenzialanalyse"; paketPreis = "ab 3.500 €"; paketDauer = "2–3 Wochen"; paketIcon = "🧭";
  } else if (score <= 65) {
    paket = "Pilot-Agent"; paketPreis = "9.500 – 22.000 €"; paketDauer = "4–8 Wochen"; paketIcon = "⚡";
  } else {
    paket = "Skalierung & Betrieb"; paketPreis = "ab 2.500 € / Monat"; paketDauer = "laufend"; paketIcon = "🚀";
  }

  const firmaText    = firma || (isDE ? "Ihrem Unternehmen" : "your company");
  const brancheZeile = [firma, branche].filter(Boolean).join(" · ");

  const kundeSubject = isDE
    ? `Ihre ONLION IQ Analyse & Angebotsmappe – ${firma || "ONLION IQ"}`
    : `Your ONLION IQ Analysis & Offer – ${firma || "ONLION IQ"}`;

  const kundeHtml = `<!DOCTYPE html>
<html lang="${isDE ? "de" : "en"}">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background-color:#f4f5f2;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f5f2;padding:32px 0;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:#ffffff;border-radius:14px;overflow:hidden;font-family:Arial,Helvetica,sans-serif;">
  <tr><td style="padding:36px 36px 0 36px;">
    <div style="font-size:20px;font-weight:bold;letter-spacing:3px;color:#111111;">ON<span style="color:#5a9500;">L</span>ION&nbsp;<span style="color:#5a9500;">IQ</span></div>
  </td></tr>
  <tr><td style="padding:28px 36px 0 36px;">
    <p style="margin:0 0 14px 0;font-size:15px;line-height:1.7;color:#333333;">${isDE ? `Guten Tag${firma ? " – " + firma : ""},` : `Hello${firma ? " – " + firma : "},`}</p>
    <p style="margin:0;font-size:15px;line-height:1.7;color:#333333;">${isDE ? "vielen Dank für Ihre ONLION IQ Analyse. Im Anhang finden Sie unsere Angebotsmappe mit allen Details zu unseren KI-Agenten-Paketen." : "thank you for your ONLION IQ analysis. Please find our offer document attached with all details about our AI agent packages."}</p>
  </td></tr>
  <tr><td style="padding:24px 36px 0 36px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f3f9e8;border:1px solid #cfe6a3;border-radius:12px;">
      <tr><td style="padding:24px;">
        <div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#5a9500;font-weight:bold;">${isDE ? "Ihr IQ-Score" : "Your IQ Score"}</div>
        <div style="font-size:46px;font-weight:bold;color:#5a9500;line-height:1.1;margin-top:6px;">${score}<span style="font-size:20px;">/100</span></div>
        ${brancheZeile ? `<div style="font-size:13px;color:#777777;margin-top:8px;">${brancheZeile}</div>` : ""}
      </td></tr>
    </table>
  </td></tr>
  <tr><td style="padding:20px 36px 0 36px;">
    <p style="margin:0 0 8px 0;font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#777777;font-weight:bold;">${isDE ? "Empfohlenes Paket" : "Recommended package"}</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fff0;border:1px solid #c8e880;border-radius:10px;">
      <tr><td style="padding:18px 20px;">
        <div style="font-size:16px;font-weight:bold;color:#111111;">${paketIcon} ${paket}</div>
        <div style="font-size:20px;font-weight:bold;color:#5a9500;margin-top:6px;">${paketPreis}</div>
        <div style="font-size:13px;color:#777777;margin-top:4px;">${paketDauer} · zzgl. MwSt.</div>
      </td></tr>
    </table>
  </td></tr>
  <tr><td style="padding:20px 36px 0 36px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #eeeeee;border-radius:10px;overflow:hidden;font-size:14px;">
      <tr><td style="padding:12px 16px;border-bottom:1px solid #eeeeee;color:#333333;">🧭 KI-Potenzialanalyse</td><td style="padding:12px 16px;border-bottom:1px solid #eeeeee;color:#111111;font-weight:bold;text-align:right;white-space:nowrap;">ab 3.500 €</td></tr>
      <tr><td style="padding:12px 16px;border-bottom:1px solid #eeeeee;color:#333333;">⚡ Pilot-Agent</td><td style="padding:12px 16px;border-bottom:1px solid #eeeeee;color:#111111;font-weight:bold;text-align:right;white-space:nowrap;">9.500 – 22.000 €</td></tr>
      <tr><td style="padding:12px 16px;color:#333333;">🚀 Skalierung & Betrieb</td><td style="padding:12px 16px;color:#111111;font-weight:bold;text-align:right;white-space:nowrap;">ab 2.500 € / Monat</td></tr>
    </table>
  </td></tr>
  <tr><td style="padding:20px 36px 0 36px;">
    <p style="margin:0 0 20px 0;font-size:15px;line-height:1.7;color:#333333;">${isDE ? "Die vollständige Angebotsmappe finden Sie im Anhang. Gerne besprechen wir die Details in einem kurzen, unverbindlichen Gespräch." : "Please find the complete offer document attached. We'd be happy to discuss the details in a short, no-obligation call."}</p>
  </td></tr>
  <tr><td style="padding:0 36px;">
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
      <tr><td style="background-color:#7AC800;border-radius:8px;">
        <a href="${CALENDLY}" style="display:inline-block;padding:15px 34px;font-size:15px;font-weight:bold;color:#000000;text-decoration:none;">${isDE ? "📅 Kostenlosen Termin buchen" : "📅 Book a free appointment"}</a>
      </td></tr>
    </table>
  </td></tr>
  <tr><td style="padding:28px 36px 36px 36px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="border-top:1px solid #e6e6e6;padding-top:20px;">
      <p style="margin:0;font-size:14px;line-height:1.6;color:#333333;">${isDE ? "Viele Grüße" : "Best regards"}</p>
      <p style="margin:4px 0 0 0;font-size:14px;font-weight:bold;color:#5a9500;">ONLION</p>
      <p style="margin:10px 0 0 0;font-size:12px;color:#999999;">info@onlionapp.de · onlionapp.de</p>
    </td></tr></table>
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;

  const internHtml = `<div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:20px">
<h2 style="color:#5a9500">📎 Angebotsmappe versendet</h2>
<table style="width:100%;font-size:14px;border-collapse:collapse">
  <tr><td style="padding:8px 0;color:#777;width:130px">Firma</td><td style="padding:8px 0;font-weight:bold">${firma || "(nicht angegeben)"}</td></tr>
  <tr><td style="padding:8px 0;color:#777">Branche</td><td style="padding:8px 0">${branche || "-"}</td></tr>
  <tr><td style="padding:8px 0;color:#777">Score</td><td style="padding:8px 0;font-weight:bold;color:#5a9500">${score}/100</td></tr>
  <tr><td style="padding:8px 0;color:#777">Paket</td><td style="padding:8px 0">${paketIcon} ${paket} · ${paketPreis}</td></tr>
  <tr><td style="padding:8px 0;color:#777">E-Mail</td><td style="padding:8px 0"><a href="mailto:${email}" style="color:#5a9500;font-weight:bold">${email}</a></td></tr>
</table>
</div>`;

  // PDF als URL-Referenz (kein base64 – kein Timeout)
  const attachment = [{ filename: "ONLION-Angebotsmappe-KI-Agenten.pdf", path: PDF_URL }];

  try {
    await Promise.all([
      // 1. An Kunden
      fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": "Bearer " + apiKey },
        body: JSON.stringify({ from: ABSENDER, to: [email], reply_to: INTERN_EMAIL, subject: kundeSubject, html: kundeHtml, attachments: attachment })
      }),
      // 2. Intern
      fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": "Bearer " + apiKey },
        body: JSON.stringify({ from: ABSENDER, to: [INTERN_EMAIL], reply_to: email, subject: `📎 Angebotsmappe: ${firma || "Neuer Lead"} (${score}/100)`, html: internHtml, attachments: attachment })
      })
    ]);

    return { statusCode: 200, headers: { "Access-Control-Allow-Origin": "*" }, body: JSON.stringify({ success: true }) };
  } catch (e) {
    return { statusCode: 500, headers: { "Access-Control-Allow-Origin": "*" }, body: JSON.stringify({ error: e.message }) };
  }
};
