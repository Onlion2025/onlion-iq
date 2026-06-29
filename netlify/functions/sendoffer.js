// sendoffer.js – Personalisierte Angebots-E-Mail, keine externen Dependencies

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "Content-Type", "Access-Control-Allow-Methods": "POST, OPTIONS" }, body: "" };
  }
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers: { "Access-Control-Allow-Origin": "*" }, body: JSON.stringify({ error: "Method Not Allowed" }) };
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { statusCode: 500, headers: { "Access-Control-Allow-Origin": "*" }, body: JSON.stringify({ error: "No API key" }) };

  let body;
  try { body = JSON.parse(event.body || "{}"); } catch (e) { return { statusCode: 400, headers: { "Access-Control-Allow-Origin": "*" }, body: JSON.stringify({ error: "Invalid JSON" }) }; }

  const email   = body.email   || "";
  const firma   = body.firma   || "";
  const branche = body.branche || "";
  const score   = parseInt(body.score) || 0;
  const lang    = (body.lang || "de").toLowerCase();
  const bereiche = Array.isArray(body.bereiche) ? body.bereiche : [];

  if (!email) return { statusCode: 400, headers: { "Access-Control-Allow-Origin": "*" }, body: JSON.stringify({ error: "Missing email" }) };

  const ABSENDER     = "ONLION IQ <info@onlionapp.de>";
  const INTERN_EMAIL = "onlion-@outlook.de";
  const CALENDLY     = "https://calendly.com/ridge-linear5958-eagereverest/30min";
  const PDF_URL      = "https://onlionapp.de/onlion-angebotsmappe.pdf";
  const isDE = lang !== "en" && lang !== "pl";

  let paket, paketPreis, paketDauer, paketIcon, paketFeatures;
  if (score <= 35) {
    paket = "KI-Potenzialanalyse"; paketPreis = "ab 3.500 €"; paketDauer = "2–3 Wochen"; paketIcon = "🧭";
    paketFeatures = ["2 Workshop-Tage vor Ort", "Analyse Ihrer Prozesse & IT-Landschaft", "5–8 konkrete KI-Use-Cases", "Schriftliche KI-Roadmap (20–30 Seiten)", "Präsentation für die Geschäftsführung"];
  } else if (score <= 65) {
    paket = "Pilot-Agent"; paketPreis = "9.500 – 22.000 €"; paketDauer = "4–8 Wochen"; paketIcon = "⚡";
    paketFeatures = ["Entwicklung Ihres ersten KI-Agenten", "Integration in CRM, ERP & E-Mail", "Testing mit echten Daten", "Mitarbeiterschulung & Dokumentation", "30 Tage Hypercare nach Go-Live"];
  } else {
    paket = "Skalierung & Betrieb"; paketPreis = "ab 2.500 € / Monat"; paketDauer = "laufend"; paketIcon = "🚀";
    paketFeatures = ["Monatliche Roadmap-Sessions", "Entwicklung neuer KI-Agenten", "Monitoring & Optimierung", "Support mit garantierter Reaktionszeit", "Quartalsweise KI-Schulung"];
  }

  let interpretation = "";
  if (score <= 35)      interpretation = isDE ? `${firma || "Ihr Unternehmen"} steht am Anfang der KI-Reise. Gezielte Automatisierungen bringen schnell spürbare Effizienzgewinne.` : `${firma || "Your company"} is at the beginning of the AI journey. Targeted automation will quickly yield noticeable efficiency gains.`;
  else if (score <= 65) interpretation = isDE ? `${firma || "Ihr Unternehmen"} hat erste digitale Grundlagen. Jetzt ist der ideale Zeitpunkt für den ersten produktiven KI-Agenten.` : `${firma || "Your company"} has initial digital foundations. Now is the ideal time for the first productive AI agent.`;
  else                  interpretation = isDE ? `${firma || "Ihr Unternehmen"} ist digital stark aufgestellt. KI-Agenten sichern jetzt den nachhaltigen Wettbewerbsvorteil.` : `${firma || "Your company"} is digitally strong. AI agents now secure a lasting competitive advantage.`;

  const firmaText = firma || (isDE ? "Ihr Unternehmen" : "Your Company");
  const brancheZeile = [firma, branche].filter(Boolean).join(" · ");
  const bereicheHTML = bereiche.length > 0 ? bereiche.slice(0, 5).map(b =>
    `<tr><td style="padding:10px 16px;border-bottom:1px solid #eeeeee;font-size:13px;color:#333333;">
      <span style="color:#5a9500;font-weight:bold;margin-right:8px;">→</span>${b}
    </td></tr>`).join("") : "";

  const kundeSubject = isDE ? `Ihre persönliche ONLION IQ Angebotsmappe – ${firmaText}` : `Your personal ONLION IQ offer – ${firmaText}`;

  const kundeHtml = `<!DOCTYPE html>
<html lang="${isDE ? "de" : "en"}">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#f4f5f2;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5f2;padding:32px 0;"><tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;background:#ffffff;border-radius:14px;overflow:hidden;">

  <!-- HEADER -->
  <tr><td style="background:#0a0a0a;padding:30px 36px;">
    <div style="font-size:22px;font-weight:bold;letter-spacing:4px;color:#ffffff;">ON<span style="color:#7AC800;">L</span>ION <span style="color:#7AC800;">IQ</span></div>
    <div style="font-size:11px;color:#666;letter-spacing:2px;margin-top:6px;">${isDE ? "PERSÖNLICHE ANGEBOTSMAPPE" : "PERSONAL OFFER DOCUMENT"}</div>
  </td></tr>

  <!-- SCORE -->
  <tr><td style="background:#f3f9e8;border-bottom:3px solid #7AC800;padding:28px 36px;">
    <div style="font-size:11px;color:#5a9500;font-weight:bold;letter-spacing:2px;text-transform:uppercase;margin-bottom:10px;">${isDE ? "Ihr IQ-Score" : "Your IQ Score"}</div>
    <div style="display:inline-block;">
      <span style="font-size:58px;font-weight:bold;color:#5a9500;line-height:1;">${score}</span>
      <span style="font-size:20px;color:#5a9500;">/100</span>
    </div>
    ${brancheZeile ? `<div style="font-size:13px;color:#777;margin-top:8px;">${brancheZeile}</div>` : ""}
    <div style="font-size:14px;color:#444;margin-top:14px;line-height:1.6;">${interpretation}</div>
  </td></tr>

  ${bereicheHTML ? `<!-- BEREICHE -->
  <tr><td style="padding:24px 36px 0;">
    <div style="font-size:11px;font-weight:bold;color:#999;letter-spacing:2px;text-transform:uppercase;margin-bottom:12px;">${isDE ? "Ihre größten KI-Hebel" : "Your biggest AI levers"}</div>
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #eee;border-radius:8px;overflow:hidden;">
      ${bereicheHTML}
    </table>
  </td></tr>` : ""}

  <!-- EMPFOHLENES PAKET -->
  <tr><td style="padding:24px 36px 0;">
    <div style="font-size:11px;font-weight:bold;color:#999;letter-spacing:2px;text-transform:uppercase;margin-bottom:12px;">${isDE ? "Empfohlen für Sie" : "Recommended for you"}</div>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fff0;border:2px solid #7AC800;border-radius:10px;"><tr><td style="padding:20px 24px;">
      <div style="font-size:18px;font-weight:bold;color:#111;">${paketIcon} ${paket}</div>
      <div style="font-size:24px;font-weight:bold;color:#5a9500;margin-top:8px;">${paketPreis}</div>
      <div style="font-size:12px;color:#777;margin-top:4px;">${paketDauer} · zzgl. MwSt.</div>
      <table style="margin-top:16px;width:100%;" cellpadding="0" cellspacing="0">
        ${paketFeatures.map(f => `<tr><td style="padding:4px 0;font-size:13px;color:#333;">✓ &nbsp;${f}</td></tr>`).join("")}
      </table>
    </td></tr></table>
  </td></tr>

  <!-- PDF DOWNLOAD -->
  <tr><td style="padding:24px 36px 0;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#111;border-radius:10px;"><tr><td style="padding:20px 24px;text-align:center;">
      <div style="font-size:13px;color:#999;margin-bottom:14px;">${isDE ? "Vollständige Angebotsmappe als PDF:" : "Complete offer document as PDF:"}</div>
      <a href="${PDF_URL}" style="display:inline-block;background:#7AC800;color:#000;font-size:15px;font-weight:bold;padding:14px 30px;border-radius:8px;text-decoration:none;">📄 ${isDE ? "Angebotsmappe herunterladen" : "Download offer document"}</a>
    </td></tr></table>
  </td></tr>

  <!-- CTA -->
  <tr><td style="padding:24px 36px 0;text-align:center;">
    <p style="font-size:15px;color:#333;line-height:1.7;margin:0 0 18px 0;">${isDE ? "Gerne besprechen wir alles persönlich – kostenlos und unverbindlich." : "Let's discuss everything personally – free and no obligation."}</p>
    <a href="${CALENDLY}" style="display:inline-block;background:#7AC800;color:#000;font-size:15px;font-weight:bold;padding:15px 34px;border-radius:8px;text-decoration:none;">📅 ${isDE ? "Kostenlosen Termin buchen" : "Book a free appointment"}</a>
  </td></tr>

  <!-- FOOTER -->
  <tr><td style="padding:28px 36px 32px;border-top:1px solid #eee;margin-top:24px;">
    <p style="margin:0;font-size:14px;color:#333;">${isDE ? "Viele Grüße" : "Best regards"}</p>
    <p style="margin:4px 0 0;font-size:14px;font-weight:bold;color:#5a9500;">ONLION</p>
    <p style="margin:10px 0 0;font-size:12px;color:#999;">info@onlionapp.de · onlionapp.de</p>
    <p style="margin:8px 0 0;font-size:12px;">
      <a href="https://onlionapp.de/impressum.html" style="color:#999;text-decoration:underline;">${isDE ? "Impressum" : "Imprint"}</a> &nbsp;|&nbsp;
      <a href="https://onlionapp.de/datenschutz.html" style="color:#999;text-decoration:underline;">${isDE ? "Datenschutz" : "Privacy"}</a>
    </p>
  </td></tr>

</table>
</td></tr></table>
</body></html>`;

  const internHtml = `<div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:20px;">
<h2 style="color:#5a9500;margin:0 0 16px;">📋 Neues Angebot versendet</h2>
<table style="width:100%;font-size:14px;border-collapse:collapse;">
  <tr style="border-bottom:1px solid #eee;"><td style="padding:8px 0;color:#777;width:130px;">Firma</td><td style="padding:8px 0;font-weight:bold;">${firma || "(nicht angegeben)"}</td></tr>
  <tr style="border-bottom:1px solid #eee;"><td style="padding:8px 0;color:#777;">Branche</td><td style="padding:8px 0;">${branche || "-"}</td></tr>
  <tr style="border-bottom:1px solid #eee;"><td style="padding:8px 0;color:#777;">Score</td><td style="padding:8px 0;font-weight:bold;color:#5a9500;">${score}/100</td></tr>
  <tr style="border-bottom:1px solid #eee;"><td style="padding:8px 0;color:#777;">Paket</td><td style="padding:8px 0;">${paketIcon} ${paket} · ${paketPreis}</td></tr>
  <tr style="border-bottom:1px solid #eee;"><td style="padding:8px 0;color:#777;">Bereiche</td><td style="padding:8px 0;">${bereiche.slice(0,3).join(", ") || "-"}</td></tr>
  <tr><td style="padding:8px 0;color:#777;">E-Mail</td><td style="padding:8px 0;"><a href="mailto:${email}" style="color:#5a9500;font-weight:bold;">${email}</a></td></tr>
</table>
<div style="margin-top:20px;"><a href="mailto:${email}" style="display:inline-block;background:#7AC800;color:#000;font-weight:bold;padding:12px 20px;border-radius:8px;text-decoration:none;">Kunden direkt antworten</a></div>
</div>`;

  try {
    const [r1, r2] = await Promise.all([
      fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": "Bearer " + apiKey },
        body: JSON.stringify({ from: ABSENDER, to: [email], reply_to: INTERN_EMAIL, subject: kundeSubject, html: kundeHtml })
      }),
      fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": "Bearer " + apiKey },
        body: JSON.stringify({ from: ABSENDER, to: [INTERN_EMAIL], reply_to: email, subject: `📋 Angebot: ${firmaText} (${score}/100)`, html: internHtml })
      })
    ]);
    const d1 = await r1.json().catch(() => ({}));
    if (!r1.ok) console.error("Kunden-Mail Fehler:", d1);
    return { statusCode: 200, headers: { "Access-Control-Allow-Origin": "*" }, body: JSON.stringify({ success: true }) };
  } catch (e) {
    console.error("sendoffer Fehler:", e.message);
    return { statusCode: 500, headers: { "Access-Control-Allow-Origin": "*" }, body: JSON.stringify({ error: e.message }) };
  }
};
