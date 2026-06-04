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
    return { statusCode: 405, headers: { "Access-Control-Allow-Origin": "*" }, body: JSON.stringify({ error: "Method Not Allowed" }) };
  }
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { statusCode: 500, headers: { "Access-Control-Allow-Origin": "*" }, body: JSON.stringify({ error: "API key not configured" }) };
  }
  let body;
  try { body = JSON.parse(event.body || "{}"); }
  catch (e) { return { statusCode: 400, headers: { "Access-Control-Allow-Origin": "*" }, body: JSON.stringify({ error: "Invalid request: " + e.message }) }; }
  const messages = [];
  if (body.messages && Array.isArray(body.messages)) {
    for (var i = 0; i < body.messages.length; i++) {
      var msg = body.messages[i];
      messages.push({ role: msg.role || "user", content: typeof msg.content === "string" ? msg.content : "" });
    }
  }
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model: body.model || "claude-haiku-4-5-20251001", max_tokens: body.max_tokens || 800, messages: messages })
    });
    const text = await response.text();
    let data;
    try { data = JSON.parse(text); }
    catch (e) { return { statusCode: 500, headers: { "Access-Control-Allow-Origin": "*" }, body: JSON.stringify({ error: "API parse error", raw: text.slice(0, 200) }) }; }
    if (!response.ok) {
      return { statusCode: response.status, headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" }, body: JSON.stringify({ error: (data && data.error && data.error.message) ? data.error.message : ("API error " + response.status), details: data }) };
    }
    return { statusCode: 200, headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" }, body: JSON.stringify(data) };
  } catch (err) {
    return { statusCode: 500, headers: { "Access-Control-Allow-Origin": "*" }, body: JSON.stringify({ error: err.message }) };
  }
};
