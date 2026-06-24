export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const cfToken = process.env.CF_API_TOKEN;
  const cfAccount = process.env.CF_ACCOUNT_ID;

  if (!cfToken || !cfAccount) {
    return res.status(500).json({ error: 'API credentials not configured on server.' });
  }

  const prompt = req.body?.messages?.[0]?.content || '';

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${cfAccount}/ai/run/@cf/google/gemma-3-12b-it`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${cfToken}`,
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: 'You are an experienced teacher writing formal, warm, and constructive student report comments in English. Be concise.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 400,
        }),
        signal: controller.signal,
      }
    );

    clearTimeout(timeout);

    const data = await response.json();

    if (!response.ok || !data.success) {
      const errMsg = data.errors?.[0]?.message || JSON.stringify(data.errors) || 'Cloudflare AI error';
      return res.status(500).json({ error: errMsg });
    }

    const text = data.result?.response || '';
    return res.status(200).json({
      content: [{ type: 'text', text }]
    });

  } catch (err) {
    if (err.name === 'AbortError') {
      return res.status(500).json({ error: 'Request timed out. Please try again.' });
    }
    return res.status(500).json({ error: 'Server error: ' + err.message });
  }
}
