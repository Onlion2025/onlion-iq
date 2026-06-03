// netlify/functions/analyzeurl.js
// Analysiert eine Webseite und erstellt eine Unternehmensbeschreibung

exports.handler = async (event) => {
  // CORS Headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Preflight OPTIONS
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { url } = JSON.parse(event.body || '{}');

    if (!url) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'URL fehlt' })
      };
    }

    // URL normalisieren - https:// hinzufuegen falls nicht vorhanden
    let normalizedUrl = url.trim();
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      normalizedUrl = 'https://' + normalizedUrl;
    }

    // URL validieren
    let parsedUrl;
    try {
      parsedUrl = new URL(normalizedUrl);
    } catch (e) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Ungueltige URL. Bitte vollstaendige Webadresse eingeben.' })
      };
    }

    // Webseite abrufen
    let html;
    try {
      const response = await fetch(normalizedUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; ONLION-IQ-Bot/1.0)',
          'Accept': 'text/html,application/xhtml+xml',
          'Accept-Language': 'de-DE,de;q=0.9,en;q=0.8'
        },
        timeout: 10000
      });

      if (!response.ok) {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            error: 'Webseite nicht erreichbar (Status ' + response.status + '). Bitte beschreibe dein Unternehmen manuell.'
          })
        };
      }

      html = await response.text();
    } catch (fetchError) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          error: 'Webseite konnte nicht geladen werden. Bitte beschreibe dein Unternehmen manuell.'
        })
      };
    }

    // HTML zu Text konvertieren (einfache Methode ohne externe Bibliothek)
    const cleanText = extractTextFromHtml(html);

    if (cleanText.length < 100) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          error: 'Webseite enthielt zu wenig Inhalt. Bitte beschreibe dein Unternehmen manuell.'
        })
      };
    }

    // Auf max 5000 Zeichen kuerzen
    const textForAi = cleanText.substring(0, 5000);

    // Claude API aufrufen
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Server-Konfiguration fehlerhaft' })
      };
    }

    const prompt = `Analysiere diese Webseite und erstelle eine praezise Unternehmensbeschreibung in 3-5 Saetzen auf Deutsch.

Fokussiere dich auf:
- Branche und Hauptdienstleistungen
- Geschaetzte Unternehmensgroesse (Mitarbeiter wenn erkennbar)
- Digitalisierungsstand (Online-Termine, automatisierte Prozesse, etc.)
- Aktuelle Prozesse die noch manuell wirken
- Zielgruppe und Region

Wichtig: Schreibe NUR die Beschreibung, ohne Einleitung wie "Hier ist die Beschreibung" oder "Diese Webseite zeigt".
Starte direkt mit der inhaltlichen Beschreibung des Unternehmens.

URL: ${normalizedUrl}

Webseiten-Inhalt:
${textForAi}`;

    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5',
        max_tokens: 500,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!claudeResponse.ok) {
      const errorText = await claudeResponse.text();
      console.error('Claude API Error:', errorText);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'KI-Analyse fehlgeschlagen. Bitte beschreibe dein Unternehmen manuell.' })
      };
    }

    const data = await claudeResponse.json();
    const beschreibung = data.content && data.content[0] ? data.content[0].text.trim() : '';

    if (!beschreibung) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          error: 'KI konnte keine Beschreibung erstellen. Bitte beschreibe dein Unternehmen manuell.'
        })
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        beschreibung: beschreibung,
        url: normalizedUrl
      })
    };

  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Unerwarteter Fehler: ' + error.message })
    };
  }
};

// Helper: HTML zu Text konvertieren
function extractTextFromHtml(html) {
  // Wichtige Bereiche zuerst extrahieren (Title, Meta-Description, H1, H2)
  const importantParts = [];

  // Title extrahieren
  const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  if (titleMatch) importantParts.push('TITEL: ' + titleMatch[1].trim());

  // Meta Description
  const descMatch = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']*)["']/i)
    || html.match(/<meta\s+content=["']([^"']*)["']\s+name=["']description["']/i);
  if (descMatch) importantParts.push('BESCHREIBUNG: ' + descMatch[1].trim());

  // Meta Keywords
  const keyMatch = html.match(/<meta\s+name=["']keywords["']\s+content=["']([^"']*)["']/i);
  if (keyMatch) importantParts.push('KEYWORDS: ' + keyMatch[1].trim());

  // Open Graph Title
  const ogTitleMatch = html.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']*)["']/i);
  if (ogTitleMatch) importantParts.push('OG-TITEL: ' + ogTitleMatch[1].trim());

  // Open Graph Description
  const ogDescMatch = html.match(/<meta\s+property=["']og:description["']\s+content=["']([^"']*)["']/i);
  if (ogDescMatch) importantParts.push('OG-BESCHREIBUNG: ' + ogDescMatch[1].trim());

  // Alle H1, H2, H3 extrahieren
  const headings = [];
  const headingRegex = /<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/gi;
  let match;
  while ((match = headingRegex.exec(html)) !== null && headings.length < 30) {
    const text = stripTags(match[1]).trim();
    if (text.length > 2 && text.length < 200) headings.push(text);
  }
  if (headings.length > 0) {
    importantParts.push('UEBERSCHRIFTEN: ' + headings.join(' | '));
  }

  // Body-Text extrahieren (vereinfacht)
  // Erst Scripts und Styles entfernen
  let cleaned = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ');

  // Body extrahieren
  const bodyMatch = cleaned.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (bodyMatch) cleaned = bodyMatch[1];

  // HTML-Tags entfernen
  cleaned = stripTags(cleaned);

  // Whitespace normalisieren
  cleaned = cleaned
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();

  // Wichtige Teile + Body-Text zusammenfuehren
  const result = importantParts.join('\n') + '\n\nHAUPTINHALT: ' + cleaned;
  return result;
}

function stripTags(html) {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}
