// Netlify Function: sendoffer.js
// Generiert eine personalisierte PDF-Angebotsmappe mit PDFKit
// und sendet sie per Resend als E-Mail-Anhang

const PDFDocument = require('pdfkit');

function generatePersonalizedPDF(data) {
  return new Promise((resolve) => {
    const doc = new PDFDocument({ size: 'A4', margin: 0, info: { Title: `ONLION IQ Analyse – ${data.firma}`, Author: 'ONLION Group' } });
    const chunks = [];
    doc.on('data', c => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));

    const W = 595.28, H = 841.89;
    const GREEN = '#5a9500', DARK = '#0a0a0a', WHITE = '#ffffff';
    const isDE = data.lang !== 'en' && data.lang !== 'pl';

    // ===== SEITE 1: DECKBLATT =====
    doc.rect(0, 0, W, H).fill(DARK);
    doc.rect(0, 0, 6, H).fill(GREEN);
    doc.rect(6, 0, W - 6, 5).fill(GREEN);

    // Logo
    doc.font('Helvetica-Bold').fontSize(13).fillColor(WHITE).text('ONLION ', 50, 55, { continued: true }).fillColor(GREEN).text('IQ');
    doc.font('Helvetica').fontSize(10).fillColor('#666666').characterSpacing(2).text(isDE ? 'PERSÖNLICHE KI-ANALYSE' : 'PERSONAL AI ANALYSIS', 50, 80).characterSpacing(0);

    // Firmenname groß
    const firmaText = data.firma || (isDE ? 'Ihr Unternehmen' : 'Your Company');
    doc.font('Helvetica-Bold').fontSize(38).fillColor(WHITE).text(firmaText, 50, 160, { width: W - 100 });
    if (data.branche) {
      doc.font('Helvetica').fontSize(15).fillColor('#777777').text(data.branche, 50, 210 + Math.min(firmaText.length / 20, 2) * 20);
    }

    // Score-Box
    const scoreY = 310;
    doc.rect(50, scoreY, 155, 130).fill('#141414');
    doc.rect(50, scoreY, 4, 130).fill(GREEN);
    doc.font('Helvetica').fontSize(9).fillColor(GREEN).characterSpacing(1.5).text(isDE ? 'IQ-SCORE' : 'IQ SCORE', 64, scoreY + 18).characterSpacing(0);
    doc.font('Helvetica-Bold').fontSize(62).fillColor(GREEN).text(String(data.score), 64, scoreY + 32);
    doc.font('Helvetica').fontSize(11).fillColor('#666666').text('/ 100', 64, scoreY + 100);

    // Paket-Badge
    const badgeY = scoreY + 150;
    doc.rect(50, badgeY, 260, 48).fill(GREEN);
    doc.font('Helvetica-Bold').fontSize(14).fillColor(DARK).text(`${data.paketIcon}  ${data.paket}`, 50, badgeY + 14, { width: 260, align: 'center' });

    // Preis
    doc.font('Helvetica').fontSize(13).fillColor(GREEN).text(data.paketPreis, 50, badgeY + 68);
    doc.font('Helvetica').fontSize(11).fillColor('#555555').text(`${data.paketDauer} · zzgl. MwSt.`, 50, badgeY + 90);

    // Datum & Footer
    const dateStr = new Date().toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' });
    doc.font('Helvetica').fontSize(10).fillColor('#444444').text(dateStr, 50, H - 80);
    doc.font('Helvetica').fontSize(10).fillColor('#444444').text('onlionapp.de  ·  info@onlionapp.de', 50, H - 58);

    // ===== SEITE 2: ANALYSE-ERGEBNIS =====
    doc.addPage({ margin: 0 });
    doc.rect(0, 0, W, H).fill(WHITE);
    doc.rect(0, 0, 6, H).fill(GREEN);
    doc.rect(0, 0, W, 75).fill('#f8f8f8');
    doc.font('Helvetica-Bold').fontSize(10).fillColor(GREEN).characterSpacing(1).text('ONLION IQ', 50, 28).characterSpacing(0);
    doc.font('Helvetica').fontSize(10).fillColor('#999999').text(isDE ? 'Analyse-Ergebnis' : 'Analysis Results', 50, 48);

    // Score-Visualisierung
    doc.font('Helvetica-Bold').fontSize(22).fillColor(DARK).text(isDE ? 'Ihr KI-Potenzial' : 'Your AI Potential', 50, 100);
    doc.rect(50, 135, W - 100, 88).fill('#f3f9e8').stroke('#cfe6a3');
    doc.font('Helvetica').fontSize(9).fillColor(GREEN).characterSpacing(1.5).text(isDE ? 'ERKANNTES KI-POTENZIAL' : 'IDENTIFIED AI POTENTIAL', 70, 153).characterSpacing(0);
    doc.font('Helvetica-Bold').fontSize(54).fillColor(GREEN).text(String(data.score), 70, 158);
    doc.font('Helvetica').fontSize(13).fillColor('#777777').text(isDE ? 'von 100 möglichen Punkten' : 'out of 100 possible points', 155, 190);

    // Interpretation
    let interpretation = '';
    if (data.score <= 35) {
      interpretation = isDE
        ? `${firmaText} steht am Anfang der KI-Reise. Das ist eine große Chance: Mit ersten gezielten Automatisierungen lassen sich schnell spürbare Effizienzgewinne erzielen.`
        : `${firmaText} is at the beginning of the AI journey. This is a great opportunity: Initial targeted automation can quickly yield noticeable efficiency gains.`;
    } else if (data.score <= 65) {
      interpretation = isDE
        ? `${firmaText} hat erste digitale Grundlagen. Jetzt ist der ideale Zeitpunkt, mit einem konkreten KI-Agenten den nächsten Schritt zu machen und echte Wettbewerbsvorteile zu sichern.`
        : `${firmaText} has initial digital foundations. Now is the ideal time to take the next step with a concrete AI agent and secure real competitive advantages.`;
    } else {
      interpretation = isDE
        ? `${firmaText} ist bereits stark digital aufgestellt. Durch KI-Agenten lässt sich diese Basis weiter ausbauen und ein nachhaltiger Wettbewerbsvorteil sichern.`
        : `${firmaText} is already strongly positioned digitally. AI agents can further expand this foundation and secure a lasting competitive advantage.`;
    }
    doc.font('Helvetica').fontSize(12).fillColor('#444444').lineGap(3).text(interpretation, 50, 245, { width: W - 100 });

    // Schwache Bereiche
    if (data.bereiche && data.bereiche.length > 0) {
      const areasY = 330;
      doc.font('Helvetica-Bold').fontSize(18).fillColor(DARK).text(isDE ? 'Ihre größten KI-Hebel' : 'Your biggest AI levers', 50, areasY);
      data.bereiche.slice(0, 5).forEach((area, i) => {
        const y = areasY + 38 + i * 52;
        doc.rect(50, y, W - 100, 42).fill(i % 2 === 0 ? '#f5f5f5' : '#fafafa');
        doc.rect(50, y, 4, 42).fill(GREEN);
        doc.font('Helvetica-Bold').fontSize(13).fillColor(DARK).text(area, 66, y + 7, { width: W - 130 });
        doc.font('Helvetica').fontSize(10).fillColor('#888888').text(isDE ? 'Automatisierungspotenzial identifiziert' : 'Automation potential identified', 66, y + 25);
      });
    }

    doc.font('Helvetica').fontSize(9).fillColor('#cccccc').text('ONLION Group · onlionapp.de', 50, H - 38, { width: W - 100, align: 'center' });

    // ===== SEITE 3: EMPFOHLENES PAKET =====
    doc.addPage({ margin: 0 });
    doc.rect(0, 0, W, H).fill(WHITE);
    doc.rect(0, 0, 6, H).fill(GREEN);
    doc.rect(0, 0, W, 75).fill('#f8f8f8');
    doc.font('Helvetica-Bold').fontSize(10).fillColor(GREEN).characterSpacing(1).text('ONLION IQ', 50, 28).characterSpacing(0);
    doc.font('Helvetica').fontSize(10).fillColor('#999999').text(isDE ? 'Ihre persönliche Empfehlung' : 'Your personal recommendation', 50, 48);

    doc.font('Helvetica').fontSize(9).fillColor(GREEN).characterSpacing(1.5).text(isDE ? 'EMPFOHLEN FÜR SIE' : 'RECOMMENDED FOR YOU', 50, 100).characterSpacing(0);
    doc.font('Helvetica-Bold').fontSize(30).fillColor(DARK).text(`${data.paketIcon}  ${data.paket}`, 50, 118);

    // Preis-Box
    doc.rect(50, 163, W - 100, 65).fill(GREEN);
    doc.font('Helvetica').fontSize(11).fillColor(DARK).text(isDE ? 'Ihre Investition' : 'Your investment', 70, 178);
    doc.font('Helvetica-Bold').fontSize(26).fillColor(DARK).text(data.paketPreis, 70, 195);
    doc.font('Helvetica').fontSize(11).fillColor('#1a3300').text(`${data.paketDauer} · zzgl. MwSt.`, W - 220, 205);

    // Features
    let features = [];
    if (data.score <= 35) {
      features = isDE
        ? ['2 Workshop-Tage bei Ihnen vor Ort mit Fachabteilungen', 'Analyse Ihrer Prozesse und IT-Landschaft', 'Identifikation von 5–8 konkreten KI-Use-Cases', 'Priorisierung nach ROI, Aufwand und strategischem Hebel', 'Schriftliche KI-Roadmap (20–30 Seiten)', 'Präsentation der Ergebnisse für die Geschäftsführung']
        : ['2 on-site workshop days with your departments', 'Analysis of your processes and IT landscape', 'Identification of 5–8 specific AI use cases', 'Prioritization by ROI, effort, and strategic impact', 'Written AI roadmap (20–30 pages)', 'Results presentation for management'];
    } else if (data.score <= 65) {
      features = isDE
        ? ['Technische Detailkonzeption inkl. Datenschutzkonzept', 'Entwicklung des KI-Agenten (LLM, RAG, Tools, Memory)', 'Integration in Ihre Systeme (CRM, ERP, E-Mail)', 'Testing mit echten Daten und Iteration', 'Schulung der Mitarbeiter und Dokumentation', '30 Tage Hypercare nach Go-Live']
        : ['Technical concept including data protection plan', 'Development of AI agent (LLM, RAG, Tools, Memory)', 'Integration into your systems (CRM, ERP, Email)', 'Testing with real data and iteration', 'Employee training and documentation', '30 days Hypercare after go-live'];
    } else {
      features = isDE
        ? ['Monatliche Roadmap-Sessions mit der Geschäftsführung', 'Entwicklung neuer Agenten nach vereinbartem Kontingent', 'Monitoring und Optimierung produktiver Agenten', 'Anpassung an neue LLM-Modelle und Frameworks', 'Support per Slack/Teams mit garantierter Reaktionszeit', 'Quartalsweise KI-Schulung für Ihr Team']
        : ['Monthly roadmap sessions with management', 'Development of new agents per agreed contingent', 'Monitoring and optimization of productive agents', 'Adaptation to new LLM models and frameworks', 'Support via Slack/Teams with guaranteed response time', 'Quarterly AI training for your team'];
    }

    doc.font('Helvetica-Bold').fontSize(15).fillColor(DARK).text(isDE ? 'Im Paket enthalten:' : 'Package includes:', 50, 248);
    features.forEach((feat, i) => {
      const y = 276 + i * 40;
      doc.rect(50, y + 4, 7, 7).fill(GREEN);
      doc.font('Helvetica').fontSize(12).fillColor('#333333').text(feat, 68, y + 2, { width: W - 125 });
    });

    // Ergebnis-Box
    doc.rect(50, H - 195, W - 100, 58).fill('#f3f9e8').stroke('#cfe6a3');
    doc.font('Helvetica-Bold').fontSize(12).fillColor(DARK).text(isDE ? 'Typisches Ergebnis:' : 'Typical result:', 70, H - 182);
    const ergebnis = data.score <= 35
      ? (isDE ? 'Klare Entscheidungsgrundlage in 2–3 Wochen' : 'Clear decision basis in 2–3 weeks')
      : data.score <= 65
      ? (isDE ? 'Erster produktiver KI-Agent in 4–8 Wochen' : 'First productive AI agent in 4–8 weeks')
      : (isDE ? 'Kontinuierlicher Ausbau Ihrer KI-Infrastruktur' : 'Continuous expansion of your AI infrastructure');
    doc.font('Helvetica').fontSize(12).fillColor('#444444').text(ergebnis, 70, H - 162);

    doc.font('Helvetica').fontSize(9).fillColor('#cccccc').text('ONLION Group · onlionapp.de', 50, H - 38, { width: W - 100, align: 'center' });

    // ===== SEITE 4: NÄCHSTE SCHRITTE =====
    doc.addPage({ margin: 0 });
    doc.rect(0, 0, W, H).fill(DARK);
    doc.rect(0, 0, 6, H).fill(GREEN);
    doc.rect(6, 0, W - 6, 4).fill(GREEN);

    doc.font('Helvetica-Bold').fontSize(10).fillColor(GREEN).characterSpacing(1).text('ONLION IQ', 50, 55).characterSpacing(0);
    doc.font('Helvetica-Bold').fontSize(32).fillColor(WHITE).text(isDE ? 'Nächste Schritte' : 'Next Steps', 50, 100);
    doc.font('Helvetica').fontSize(13).fillColor('#666666').text(isDE ? `Wie wir gemeinsam mit ${firmaText} starten:` : `How we start together with ${firmaText}:`, 50, 143);

    const steps = isDE ? [
      { num: '01', title: 'Kostenloses Gespräch', desc: 'In 30 Minuten zeigen wir Ihnen konkrete Möglichkeiten und beantworten alle Fragen.' },
      { num: '02', title: 'Individuelle Roadmap', desc: 'Wir entwickeln gemeinsam einen maßgeschneiderten Plan für Ihren ersten KI-Agenten.' },
      { num: '03', title: 'Umsetzung & Go-Live', desc: `${data.paket} – Ihr erster produktiver Einsatz innerhalb von ${data.paketDauer}.` },
    ] : [
      { num: '01', title: 'Free consultation', desc: 'In 30 minutes we show you concrete possibilities and answer all questions.' },
      { num: '02', title: 'Individual roadmap', desc: 'We develop a tailored plan together for your first AI agent.' },
      { num: '03', title: 'Implementation', desc: `${data.paket} – Your first productive deployment within ${data.paketDauer}.` },
    ];

    steps.forEach((step, i) => {
      const y = 195 + i * 115;
      doc.font('Helvetica-Bold').fontSize(32).fillColor('#2a2a2a').text(step.num, 50, y);
      doc.rect(110, y + 5, 1, 65).fill('#333333');
      doc.font('Helvetica-Bold').fontSize(16).fillColor(WHITE).text(step.title, 125, y + 4);
      doc.font('Helvetica').fontSize(12).fillColor('#777777').lineGap(2).text(step.desc, 125, y + 27, { width: W - 180 });
    });

    // CTA Box
    doc.rect(50, H - 215, W - 100, 78).fill(GREEN);
    doc.font('Helvetica-Bold').fontSize(17).fillColor(DARK).text(isDE ? 'Jetzt kostenloses Gespräch buchen' : 'Book your free consultation now', 70, H - 200, { width: W - 140, align: 'center' });
    doc.font('Helvetica').fontSize(11).fillColor('#1a3300').text('calendly.com/ridge-linear5958-eagereverest/30min', 70, H - 175, { width: W - 140, align: 'center' });

    doc.font('Helvetica').fontSize(11).fillColor('#555555').text('ONLION Group  ·  info@onlionapp.de  ·  onlionapp.de', 50, H - 95, { width: W - 100, align: 'center' });
    doc.font('Helvetica').fontSize(10).fillColor('#333333').text(`${isDE ? 'Erstellt für' : 'Prepared for'} ${firmaText}  ·  ${new Date().toLocaleDateString('de-DE')}`, 50, H - 72, { width: W - 100, align: 'center' });

    doc.end();
  });
}

// ==== HANDLER ====
exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' }, body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { statusCode: 500, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ error: 'Resend API key not configured' }) };

  let body;
  try { body = JSON.parse(event.body || '{}'); }
  catch (e) { return { statusCode: 400, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ error: 'Invalid request' }) }; }

  const email   = body.email   || '';
  const firma   = body.firma   || '';
  const branche = body.branche || '';
  const score   = parseInt(body.score) || 0;
  const lang    = (body.lang || 'de').toLowerCase();
  const bereiche = Array.isArray(body.bereiche) ? body.bereiche : (body.bereiche ? body.bereiche.split(',').map(s => s.trim()) : []);

  if (!email) return { statusCode: 400, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ error: 'Missing email' }) };

  const ABSENDER     = 'ONLION IQ <info@onlionapp.de>';
  const INTERN_EMAIL = 'onlion-@outlook.de';
  const CALENDLY     = 'https://calendly.com/ridge-linear5958-eagereverest/30min';
  const isDE = lang !== 'en' && lang !== 'pl';

  let paket, paketPreis, paketDauer, paketIcon;
  if (score <= 35)      { paket = 'KI-Potenzialanalyse'; paketPreis = 'ab 3.500 €';          paketDauer = '2–3 Wochen'; paketIcon = '🧭'; }
  else if (score <= 65) { paket = 'Pilot-Agent';          paketPreis = '9.500 – 22.000 €';   paketDauer = '4–8 Wochen'; paketIcon = '⚡'; }
  else                  { paket = 'Skalierung & Betrieb'; paketPreis = 'ab 2.500 € / Monat'; paketDauer = 'laufend';    paketIcon = '🚀'; }

  const kundeSubject = isDE
    ? `Ihre persönliche ONLION IQ Angebotsmappe – ${firma || 'ONLION IQ'}`
    : `Your personal ONLION IQ offer – ${firma || 'ONLION IQ'}`;

  const firmaText = firma || (isDE ? 'Ihr Unternehmen' : 'Your Company');
  const brancheZeile = [firma, branche].filter(Boolean).join(' · ');

  const kundeHtml = `<!DOCTYPE html>
<html lang="${isDE ? 'de' : 'en'}"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background-color:#f4f5f2;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f5f2;padding:32px 0;"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:#ffffff;border-radius:14px;overflow:hidden;font-family:Arial,Helvetica,sans-serif;">
  <tr><td style="padding:36px 36px 0 36px;"><div style="font-size:20px;font-weight:bold;letter-spacing:3px;color:#111111;">ON<span style="color:#5a9500;">L</span>ION&nbsp;<span style="color:#5a9500;">IQ</span></div></td></tr>
  <tr><td style="padding:28px 36px 0 36px;">
    <p style="margin:0 0 14px 0;font-size:15px;line-height:1.7;color:#333333;">${isDE ? `Guten Tag${firma ? ' – ' + firma : ''},` : `Hello${firma ? ' – ' + firma : ','}` }</p>
    <p style="margin:0;font-size:15px;line-height:1.7;color:#333333;">${isDE ? 'wir haben Ihre ONLION IQ Analyse ausgewertet und Ihre <strong>persönliche Angebotsmappe</strong> erstellt – individuell abgestimmt auf ' + firmaText + '.' : 'we have evaluated your ONLION IQ analysis and created your <strong>personal offer document</strong> – tailored to ' + firmaText + '.'}</p>
  </td></tr>
  <tr><td style="padding:24px 36px 0 36px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f3f9e8;border:1px solid #cfe6a3;border-radius:12px;"><tr><td style="padding:24px;">
      <div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#5a9500;font-weight:bold;">${isDE ? 'Ihr IQ-Score' : 'Your IQ Score'}</div>
      <div style="font-size:46px;font-weight:bold;color:#5a9500;line-height:1.1;margin-top:6px;">${score}<span style="font-size:20px;">/100</span></div>
      ${brancheZeile ? `<div style="font-size:13px;color:#777777;margin-top:8px;">${brancheZeile}</div>` : ''}
    </td></tr></table>
  </td></tr>
  <tr><td style="padding:20px 36px 0 36px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fff0;border:1px solid #c8e880;border-radius:10px;"><tr><td style="padding:18px 20px;">
      <div style="font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#5a9500;font-weight:bold;margin-bottom:8px;">${isDE ? 'Empfohlen für Sie' : 'Recommended for you'}</div>
      <div style="font-size:16px;font-weight:bold;color:#111111;">${paketIcon} ${paket}</div>
      <div style="font-size:20px;font-weight:bold;color:#5a9500;margin-top:6px;">${paketPreis}</div>
      <div style="font-size:13px;color:#777777;margin-top:4px;">${paketDauer} · zzgl. MwSt.</div>
    </td></tr></table>
  </td></tr>
  <tr><td style="padding:20px 36px 0 36px;"><p style="margin:0;font-size:14px;line-height:1.7;color:#555555;">${isDE ? '📎 Ihre persönliche Angebotsmappe (PDF) finden Sie im Anhang dieser E-Mail.' : '📎 Your personal offer document (PDF) is attached to this email.'}</p></td></tr>
  <tr><td style="padding:20px 36px 0 36px;"><p style="margin:0 0 20px 0;font-size:15px;line-height:1.7;color:#333333;">${isDE ? 'Gerne besprechen wir die Details in einem kurzen, unverbindlichen Gespräch.' : "We'd be happy to discuss the details in a short, no-obligation call."}</p></td></tr>
  <tr><td style="padding:0 36px;"><table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;"><tr><td style="background-color:#7AC800;border-radius:8px;">
    <a href="${CALENDLY}" style="display:inline-block;padding:15px 34px;font-size:15px;font-weight:bold;color:#000000;text-decoration:none;">${isDE ? '📅 Kostenlosen Termin buchen' : '📅 Book a free appointment'}</a>
  </td></tr></table></td></tr>
  <tr><td style="padding:28px 36px 36px 36px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="border-top:1px solid #e6e6e6;padding-top:20px;">
    <p style="margin:0;font-size:14px;color:#333333;">${isDE ? 'Viele Grüße' : 'Best regards'}</p>
    <p style="margin:4px 0 0 0;font-size:14px;font-weight:bold;color:#5a9500;">ONLION</p>
    <p style="margin:10px 0 0 0;font-size:12px;color:#999999;">info@onlionapp.de · onlionapp.de</p>
  </td></tr></table></td></tr>
</table></td></tr></table>
</body></html>`;

  const internHtml = `<div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:20px">
<h2 style="color:#5a9500">📄 Personalisierte Angebotsmappe versendet</h2>
<table style="width:100%;font-size:14px;border-collapse:collapse">
  <tr><td style="padding:8px 0;color:#777;width:130px">Firma</td><td style="padding:8px 0;font-weight:bold">${firma || '(nicht angegeben)'}</td></tr>
  <tr><td style="padding:8px 0;color:#777">Branche</td><td style="padding:8px 0">${branche || '-'}</td></tr>
  <tr><td style="padding:8px 0;color:#777">Score</td><td style="padding:8px 0;font-weight:bold;color:#5a9500">${score}/100</td></tr>
  <tr><td style="padding:8px 0;color:#777">Paket</td><td style="padding:8px 0">${paketIcon} ${paket} · ${paketPreis}</td></tr>
  <tr><td style="padding:8px 0;color:#777">Bereiche</td><td style="padding:8px 0">${bereiche.slice(0,3).join(', ') || '-'}</td></tr>
  <tr><td style="padding:8px 0;color:#777">E-Mail</td><td style="padding:8px 0"><a href="mailto:${email}" style="color:#5a9500;font-weight:bold">${email}</a></td></tr>
</table>
<div style="margin-top:16px"><a href="mailto:${email}" style="display:inline-block;background:#7AC800;color:#000;font-weight:bold;padding:12px 20px;border-radius:8px;text-decoration:none;">Kunden direkt antworten</a></div>
</div>`;

  try {
    // PDF generieren
    const pdfBuffer = await generatePersonalizedPDF({ firma, branche, score, bereiche, paket, paketPreis, paketDauer, paketIcon, lang, isDE });
    const pdfBase64 = pdfBuffer.toString('base64');
    const attachment = [{ filename: `ONLION-IQ-Analyse-${(firma || 'Angebot').replace(/[^a-zA-Z0-9]/g, '-')}.pdf`, content: pdfBase64 }];

    await Promise.all([
      fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + apiKey },
        body: JSON.stringify({ from: ABSENDER, to: [email], reply_to: INTERN_EMAIL, subject: kundeSubject, html: kundeHtml, attachments: attachment })
      }),
      fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + apiKey },
        body: JSON.stringify({ from: ABSENDER, to: [INTERN_EMAIL], reply_to: email, subject: `📄 Angebot für ${firma || 'Lead'} (${score}/100)`, html: internHtml, attachments: attachment })
      })
    ]);

    return { statusCode: 200, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ success: true }) };
  } catch (e) {
    console.error('sendoffer Fehler:', e);
    return { statusCode: 500, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ error: e.message }) };
  }
};
