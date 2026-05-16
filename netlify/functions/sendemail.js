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

    if (!response.ok) {
      return {
        statusCode: 500,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ error: data.message || "E-Mail Fehler" })
      };
    }

    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ success: true })
    };

  } catch (err) {
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: err.message })
    };
  }

};
