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

  var email    = body.email    || "";
  var telefon  = body.telefon  || "";
  var firma    = body.firma    || "";
  var branche  = body.branche  || "";
  var score    = body.score    || 0;
  var potential = 100 - score;
  var bereiche = body.bereiche || "";

  // ===========================================================
  // SPRACHE
  // -----------------------------------------------------------
  // Die App sendet idealerweise body.lang = "de" | "en" | "pl".
  // Fehlt der Wert oder ist er unbekannt, wird auf "de"
  // zurueckgefallen. Damit funktioniert die Funktion in jedem
  // Fall, auch wenn das Frontend den Parameter noch nicht sendet.
  // ===========================================================
  var lang = (body.lang || "de").toLowerCase();
  if (lang !== "de" && lang !== "en" && lang !== "pl") {
    lang = "de";
  }

  // ===========================================================
  // ABSENDER-EINSTELLUNGEN
  // -----------------------------------------------------------
  // onlionapp.de ist in Resend verifiziert -> echter Absender.
  // ===========================================================
  var ABSENDER = "ONLION IQ <info@onlionapp.de>";
  var ABSENDER_LEADS = "ONLION IQ Leads <info@onlionapp.de>";

  // Adresse, an die deine Lead-Benachrichtigungen gehen
  var LEAD_EMPFAENGER = "onlion-@outlook.de";

  // Antwort-Adresse fuer Kunden
  var REPLY_TO = "onlion-@outlook.de";

  // Calendly-Link
  var CALENDLY = "https://calendly.com/ridge-linear5958-eagereverest/30min";

  // ===========================================================
  // UEBERSETZUNGEN
  // -----------------------------------------------------------
  // Pro Sprache: Anrede-Fallbackname, Betreff, Textbausteine.
  // {name}, {firma}, {potential}, {bereiche} werden ersetzt.
  // ===========================================================
  var TXT = {
    de: {
      htmlLang: "de",
      defaultName: "dort",
      firmaFallback: "deinem Unternehmen",
      subject: "Dein ONLION IQ Ergebnis: " + potential + "% KI-Potenzial",
      greeting: "Hallo {name},",
      intro: "danke, dass du den ONLION IQ Check gemacht hast. Hier ist dein Ergebnis.",
      potentialLabel: "Erkanntes KI-Potenzial",
      bodyMain: "Dein Check zeigt ein KI-Potenzial von <strong style=\"color:#111111;\">{potential}%</strong>. Das bedeutet: Bei {firma} steckt noch deutliches Potenzial in den Bereichen KI, Automatisierung und digitale Prozesse.",
      bodyBereiche: "Besonders bei Themen wie <strong style=\"color:#111111;\">{bereiche}</strong> lassen sich schon mit einfachen Loesungen Zeit sparen, Ablaeufe vereinfachen und langfristig Kosten senken.",
      cta: "Am besten schauen wir uns das gemeinsam an: In einem kurzen, unverbindlichen Gespraech zeige ich dir, welche konkreten Moeglichkeiten es fuer {firma} gibt und was sich schnell umsetzen laesst.",
      ctaButton: "Kostenlosen Termin buchen",
      regards: "Viele Gruesse",
      impressum: "Impressum",
      datenschutz: "Datenschutz"
    },
    en: {
      htmlLang: "en",
      defaultName: "there",
      firmaFallback: "your company",
      subject: "Your ONLION IQ result: " + potential + "% AI potential",
      greeting: "Hello {name},",
      intro: "thank you for completing the ONLION IQ check. Here is your result.",
      potentialLabel: "Identified AI potential",
      bodyMain: "Your check shows an AI potential of <strong style=\"color:#111111;\">{potential}%</strong>. This means there is significant untapped potential at {firma} in the areas of AI, automation and digital processes.",
      bodyBereiche: "Especially in areas such as <strong style=\"color:#111111;\">{bereiche}</strong>, even simple solutions can save time, streamline workflows and cut costs over the long term.",
      cta: "The best next step is to look at this together: in a short, no-obligation call I will show you the concrete opportunities for {firma} and what can be implemented quickly.",
      ctaButton: "Book a free appointment",
      regards: "Best regards",
      impressum: "Imprint",
      datenschutz: "Privacy Policy"
    },
    pl: {
      htmlLang: "pl",
      defaultName: "",
      firmaFallback: "Twojej firmie",
      subject: "Twoj wynik ONLION IQ: " + potential + "% potencjalu AI",
      greeting: "Dzien dobry {name},",
      intro: "dziekujemy za wykonanie testu ONLION IQ. Oto Twoj wynik.",
      potentialLabel: "Rozpoznany potencjal AI",
      bodyMain: "Twoj test pokazuje potencjal AI na poziomie <strong style=\"color:#111111;\">{potential}%</strong>. Oznacza to, ze w {firma} drzemie znaczny potencjal w obszarach AI, automatyzacji i procesow cyfrowych.",
      bodyBereiche: "Zwlaszcza w obszarach takich jak <strong style=\"color:#111111;\">{bereiche}</strong> nawet proste rozwiazania pozwalaja zaoszczedzic czas, uproscic procesy i obnizyc koszty w dluzszej perspektywie.",
      cta: "Najlepiej przyjrzyjmy sie temu wspolnie: podczas krotkiej, niezobowiazujacej rozmowy pokaze Ci konkretne mozliwosci dla {firma} i to, co mozna szybko wdrozyc.",
      ctaButton: "Zarezerwuj bezplatny termin",
      regards: "Pozdrawiam",
      impressum: "Impressum",
      datenschutz: "Polityka prywatnosci"
    }
  };

  var L = TXT[lang];

  // Name-Fallback sprachabhaengig
  var name = body.name || L.defaultName;

  // Sichtbare Werte vorbereiten (Fallbacks)
  var firmaText = firma || L.firmaFallback;
  var brancheZeile = (firma ? firma : "") + (firma && branche ? " &middot; " : "") + (branche ? branche : "");

  // Helfer: Platzhalter ersetzen
  function fill(str) {
    return str
      .split("{name}").join(name)
      .split("{firma}").join(firmaText)
      .split("{potential}").join(potential)
      .split("{bereiche}").join(bereiche);
  }

  // Polnische Anrede ohne Name sauber halten (kein haengendes Komma)
  var greetingText = fill(L.greeting);
  if (lang === "pl" && !body.name) {
    greetingText = "Dzien dobry,";
  }

  var htmlContent = `<!DOCTYPE html>
<html lang="${L.htmlLang}">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
</head>
<body style="margin:0; padding:0; background-color:#f4f5f2;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f5f2; padding:32px 0;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px; background-color:#ffffff; border-radius:14px; overflow:hidden; font-family:Arial, Helvetica, sans-serif;">

  <tr><td style="padding:36px 36px 0 36px;">
    <div style="font-size:20px; font-weight:bold; letter-spacing:3px; color:#111111;">ON<span style="color:#5a9500;">L</span>ION&nbsp;<span style="color:#5a9500;">IQ</span></div>
  </td></tr>

  <tr><td style="padding:28px 36px 0 36px;">
    <p style="margin:0 0 14px 0; font-size:15px; line-height:1.7; color:#333333;">${greetingText}</p>
    <p style="margin:0; font-size:15px; line-height:1.7; color:#333333;">${fill(L.intro)}</p>
  </td></tr>

  <tr><td style="padding:24px 36px 0 36px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f3f9e8; border:1px solid #cfe6a3; border-radius:12px;">
      <tr><td style="padding:24px;">
        <div style="font-size:11px; letter-spacing:2px; text-transform:uppercase; color:#5a9500; font-weight:bold;">${L.potentialLabel}</div>
        <div style="font-size:46px; font-weight:bold; color:#5a9500; line-height:1.1; margin-top:6px;">${potential}%</div>
        ${brancheZeile ? `<div style="font-size:13px; color:#777777; margin-top:8px;">${brancheZeile}</div>` : ""}
      </td></tr>
    </table>
  </td></tr>

  <tr><td style="padding:24px 36px 0 36px;">
    <p style="margin:0 0 16px 0; font-size:15px; line-height:1.7; color:#333333;">
      ${fill(L.bodyMain)}
    </p>
    ${bereiche ? `<p style="margin:0 0 16px 0; font-size:15px; line-height:1.7; color:#333333;">
      ${fill(L.bodyBereiche)}
    </p>` : ""}
  </td></tr>

  <tr><td style="padding:8px 36px 0 36px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="border-top:1px solid #e6e6e6; font-size:0; line-height:0;">&nbsp;</td></tr></table>
  </td></tr>

  <tr><td style="padding:20px 36px 0 36px;">
    <p style="margin:0 0 20px 0; font-size:15px; line-height:1.7; color:#333333;">
      ${fill(L.cta)}
    </p>
  </td></tr>

  <tr><td style="padding:0 36px;">
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
      <tr><td style="background-color:#7AC800; border-radius:8px;">
        <a href="${CALENDLY}" style="display:inline-block; padding:15px 34px; font-size:15px; font-weight:bold; color:#000000; text-decoration:none; letter-spacing:0.5px;">${L.ctaButton}</a>
      </td></tr>
    </table>
  </td></tr>

  <tr><td style="padding:28px 36px 36px 36px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="border-top:1px solid #e6e6e6; padding-top:20px;">
      <p style="margin:0; font-size:14px; line-height:1.6; color:#333333;">${L.regards}</p>
      <p style="margin:4px 0 0 0; font-size:14px; font-weight:bold; color:#5a9500;">ONLION</p>
      <p style="margin:10px 0 0 0; font-size:12px; color:#999999;">info@onlionapp.de &middot; onlionapp.de</p>
      <p style="margin:8px 0 0 0; font-size:12px;"><a href="https://onlionapp.de/impressum.html" style="color:#999999; text-decoration:underline;">${L.impressum}</a> &nbsp;|&nbsp; <a href="https://onlionapp.de/datenschutz.html" style="color:#999999; text-decoration:underline;">${L.datenschutz}</a></p>
    </td></tr></table>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;

  // Lead-Benachrichtigung an ONLION (intern, immer Deutsch)
  var leadHtml = `<!DOCTYPE html>
<html lang="de">
<head><meta charset="UTF-8"/></head>
<body style="margin:0; padding:0; background-color:#f4f4f4;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f4; padding:24px 0;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px; background-color:#ffffff; border-radius:10px; border:1px solid #e0e0e0; font-family:Arial, Helvetica, sans-serif;">
  <tr><td style="padding:28px;">
    <h2 style="margin:0 0 4px 0; font-size:20px; color:#111111;">Neuer ONLION IQ Lead</h2>
    <p style="margin:0 0 20px 0; font-size:13px; color:#777777;">Eine neue Analyse wurde abgeschlossen. Sprache: ${lang.toUpperCase()}</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;">
      <tr><td style="padding:8px 0; color:#777777; width:140px;">Firma</td><td style="padding:8px 0; font-weight:bold; color:#111111;">${firma || "(nicht angegeben)"}</td></tr>
      <tr><td style="padding:8px 0; color:#777777;">Branche</td><td style="padding:8px 0; color:#111111;">${branche || "-"}</td></tr>
      <tr><td style="padding:8px 0; color:#777777;">IQ-Score</td><td style="padding:8px 0; color:#111111;">${score}%</td></tr>
      <tr><td style="padding:8px 0; color:#777777;">KI-Potenzial</td><td style="padding:8px 0; font-weight:bold; color:#5a9500;">${potential}%</td></tr>
      <tr><td style="padding:8px 0; color:#777777;">Schwache Bereiche</td><td style="padding:8px 0; color:#111111;">${bereiche || "-"}</td></tr>
      <tr><td style="padding:8px 0; color:#777777;">E-Mail Kunde</td><td style="padding:8px 0;"><a href="mailto:${email}" style="color:#5a9500; font-weight:bold;">${email}</a></td></tr>
      <tr><td style="padding:8px 0; color:#777777;">Telefon</td><td style="padding:8px 0;"><a href="tel:${telefon}" style="color:#5a9500; font-weight:bold;">${telefon || "(nicht angegeben)"}</a></td></tr>
    </table>
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:20px;"><tr><td style="background-color:#7AC800; border-radius:8px;">
      <a href="mailto:${email}" style="display:inline-block; padding:12px 22px; font-size:14px; font-weight:bold; color:#000000; text-decoration:none;">Lead direkt antworten</a>
    </td></tr></table>
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;

  // 1) Kunden-Mail senden (wichtigste Mail - zuerst)
  var kundeOk = false;
  var kundeFehler = "";
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + apiKey
      },
      body: JSON.stringify({
        from: ABSENDER,
        to: [email],
        reply_to: REPLY_TO,
        subject: L.subject,
        html: htmlContent
      })
    });
    const data = await response.json();
    if (response.ok) {
      kundeOk = true;
    } else {
      kundeFehler = (data && data.message) ? data.message : "E-Mail Fehler";
    }
  } catch (err) {
    kundeFehler = err.message;
  }

  // 2) Lead-Benachrichtigung an ONLION senden (unabhaengig)
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + apiKey
      },
      body: JSON.stringify({
        from: ABSENDER_LEADS,
        to: [LEAD_EMPFAENGER],
        reply_to: email,
        subject: `Neuer Lead: ${firma || branche || "Unbekannt"} (${potential}% Potenzial)`,
        html: leadHtml
      })
    });
  } catch (err) {
    // Fehler bei der Lead-Mail wird ignoriert
  }

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
