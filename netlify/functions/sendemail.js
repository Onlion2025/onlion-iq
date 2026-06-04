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

  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: "Brevo API key not configured" })
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

  var email    = body.email    || "";
  var name     = body.name     || "dort";
  var firma    = body.firma    || "";
  var branche  = body.branche  || "";
  var score    = body.score    || 0;
  var potential = 100 - score;
  var bereiche = body.bereiche || "";

  // Adresse, an die deine Lead-Benachrichtigungen gehen
  var LEAD_EMPFAENGER = "onlion-@outlook.de";

  var htmlContent = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<style>
body { background: #0a0a0a; color: #f0f0f0; font-family: system-ui, -apple-system, sans-serif; margin: 0; padding: 0; }
.container { max-width: 580px; margin: 0 auto; padding: 40px 24px; }
.logo { font-size: 22px; font-weight: 800; letter-spacing: 4px; color: #fff; margin-bottom: 32px; }
.logo span { color: #7AC800; }
.hero { background: #081200; border: 1px solid rgba(122,200,0,0.3); border-radius: 12px; padding: 24px; margin-bottom: 24px; }
.score-big { font-size: 48px; font-weight: 700; color: #7AC800; }
.label { font-size: 11px; color: rgba(122,200,0,0.7); letter-spacing: 2px; text-transform: uppercase; margin-bottom: 4px; }
.text { font-size: 14px; color: #888; line-height: 1.8; margin-bottom: 16px; }
.highlight { color: #f0f0f0; font-weight: 500; }
.cta { display: block; background: #7AC800; color: #000; text-decoration: none; text-align: center; padding: 14px 24px; border-radius: 8px; font-weight: 700; font-size: 14px; letter-spacing: 1px; margin: 24px 0; }
.footer { border-top: 1px solid #1e1e1e; padding-top: 20px; font-size: 11px; color: #444; }
.divider { height: 1px; background: #1e1e1e; margin: 20px 0; }
</style>
</head>
<body>
<div class="container">
  <div class="logo">ON<span>L</span>ION <span>IQ</span></div>

  <p class="text">Hallo <span class="highlight">${name}</span>,</p>
  <p class="text">vielen Dank für die Teilnahme am ONLION IQ Check 🚀</p>

  <div class="hero">
    <div class="label">Erkanntes KI-Potenzial</div>
    <div class="score-big">${potential}%</div>
    <p style="font-size:13px;color:#888;margin:8px 0 0">
      ${firma ? `<strong style="color:#f0f0f0">${firma}</strong> · ` : ""}${branche}
    </p>
  </div>

  <p class="text">
    Besonders spannend ist das erkannte Potenzial von <span class="highlight">${potential}%</span>.
    Das zeigt, dass bei <span class="highlight">${firma || "Ihrem Unternehmen"}</span> noch enormes Potenzial
    in den Bereichen KI, Automatisierung und digitale Prozesse steckt.
  </p>

  <p class="text">
    Gerade Themen wie <span class="highlight">${bereiche}</span> können heute bereits mit einfachen Lösungen
    Zeit sparen, Prozesse vereinfachen und langfristig Kosten reduzieren. 🤖
  </p>

  <div class="divider"></div>

  <p class="text">
    Ich denke, es wäre spannend, wenn wir uns dazu einmal persönlich austauschen und gemeinsam anschauen,
    welche konkreten Möglichkeiten es für <span class="highlight">${firma || "Ihr Unternehmen"}</span> gibt
    und welche Maßnahmen schnell und sinnvoll umsetzbar wären.
  </p>

  <p class="text">👉 Hier können Sie sich direkt einen unverbindlichen Termin sichern:</p>

  <a href="https://calendly.com/ridge-linear5958-eagereverest/30min" class="cta">
    📅 Kostenlosen Termin buchen
  </a>

  <p class="text">
    Vielleicht steckt genau in den <span class="highlight">${potential}%</span> Potenzial die Möglichkeit,
    zukünftig deutlich effizienter zu arbeiten und gleichzeitig Geld zu sparen. 💪
  </p>

  <div class="footer">
    <p>Mit freundlichen Grüßen</p>
    <p style="color:#7AC800;font-weight:600;margin-top:4px">Adam Cebulla · ONLION</p>
    <p style="margin-top:4px">onlion-@outlook.de · onlion-iq.netlify.app</p>
    <div class="divider"></div>
    <p>ONLION · Loher Hauptstrasse 81a · 90427 Nürnberg</p>
    <p style="margin-top:4px"><a href="https://onlion-iq.netlify.app" style="color:#444">Impressum & Datenschutz</a></p>
  </div>
</div>
</body>
</html>`;

  // Lead-Benachrichtigung an ONLION (intern)
  var leadHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"/></head>
<body style="font-family:system-ui,-apple-system,sans-serif;background:#f4f4f4;padding:20px;color:#111">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:10px;padding:28px;border:1px solid #e0e0e0">
    <h2 style="margin:0 0 4px;font-size:20px;color:#111">🎯 Neuer ONLION IQ Lead</h2>
    <p style="margin:0 0 20px;font-size:13px;color:#777">Eine neue Analyse wurde abgeschlossen.</p>
    <table style="width:100%;border-collapse:collapse;font-size:14px">
      <tr><td style="padding:8px 0;color:#777;width:140px">Firma</td><td style="padding:8px 0;font-weight:600">${firma || "(nicht angegeben)"}</td></tr>
      <tr><td style="padding:8px 0;color:#777">Branche</td><td style="padding:8px 0">${branche || "-"}</td></tr>
      <tr><td style="padding:8px 0;color:#777">IQ-Score</td><td style="padding:8px 0">${score}%</td></tr>
      <tr><td style="padding:8px 0;color:#777">KI-Potenzial</td><td style="padding:8px 0;font-weight:600;color:#5a9500">${potential}%</td></tr>
      <tr><td style="padding:8px 0;color:#777">Schwache Bereiche</td><td style="padding:8px 0">${bereiche || "-"}</td></tr>
      <tr><td style="padding:8px 0;color:#777">E-Mail Kunde</td><td style="padding:8px 0"><a href="mailto:${email}" style="color:#5a9500;font-weight:600">${email}</a></td></tr>
    </table>
    <a href="mailto:${email}" style="display:inline-block;margin-top:20px;background:#7AC800;color:#000;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:600;font-size:14px">✉️ Lead direkt antworten</a>
  </div>
</body>
</html>`;

  // 1) Kunden-Mail senden (wichtigste Mail - zuerst)
  var kundeOk = false;
  var kundeFehler = "";
  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": apiKey
      },
      body: JSON.stringify({
        sender: { name: "OnlionIQ", email: "crux.pecan7583@eagereverest.com" },
        to: [{ email: email, name: name }],
        replyTo: { email: "onlion-@outlook.de", name: "Adam Cebulla · ONLION" },
        subject: `Ihr ONLION IQ Ergebnis: ${potential}% KI-Potenzial erkannt 🚀`,
        htmlContent: htmlContent
      })
    });
    const data = await response.json();
    if (response.ok) {
      kundeOk = true;
    } else {
      kundeFehler = data.message || "E-Mail Fehler";
    }
  } catch (err) {
    kundeFehler = err.message;
  }

  // 2) Lead-Benachrichtigung an ONLION senden (unabhaengig - blockiert die Kunden-Mail nicht)
  try {
    await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": apiKey
      },
      body: JSON.stringify({
        sender: { name: "ONLION IQ Leads", email: "crux.pecan7583@eagereverest.com" },
        to: [{ email: LEAD_EMPFAENGER, name: "Adam Cebulla" }],
        replyTo: { email: email, name: firma || name },
        subject: `🎯 Neuer Lead: ${firma || branche || "Unbekannt"} (${potential}% Potenzial)`,
        htmlContent: leadHtml
      })
    });
  } catch (err) {
    // Fehler bei der Lead-Mail wird ignoriert, damit die Kunden-Mail davon unberuehrt bleibt
  }

  // Antwort richtet sich nach der Kunden-Mail
  if (!kundeOk) {
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: kundeFehler })
    };
  }

  return {
    statusCode: 200,
    headers: { "Access-Control-Allow-Origin": "*" },
    body: JSON.stringify({ success: true })
  };

};
