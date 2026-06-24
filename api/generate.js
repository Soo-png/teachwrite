export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const cfToken = process.env.CF_API_TOKEN;
  const cfAccount = process.env.CF_ACCOUNT_ID;

  if (!cfToken || !cfAccount) {
    return res.status(500).json({ error: `Missing credentials. Token: ${cfToken ? 'OK' : 'MISSING'}, Account: ${cfAccount ? 'OK' : 'MISSING'}` });
  }

  const prompt = req.body?.messages?.[0]?.content || '';
  https://api.cloudflare.com/client/v4/accounts/${cfAccount}/ai/run/@cf/mistral/mistral-7b-instruct-v0.1;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${cfToken}`,
      },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: 'You are a teacher writing brief student report comments in English.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 300,
      }),
    });

    const raw = await response.text();

    let data;
    try { data = JSON.parse(raw); } catch(e) { data = { raw }; }

    if (!response.ok || !data.success) {
      return res.status(500).json({
        error: `CF Error ${response.status}: ${JSON.stringify(data.errors || data)}`,
        debug: { url, status: response.status }
      });
    }

    const text = data.result?.response || '';
    return res.status(200).json({ content: [{ type: 'text', text }] });

  } catch (err) {
    return res.status(500).json({ error: 'Fetch failed: ' + err.message });
  }
}
