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
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${cfAccount}/ai/run/@cf/meta/llama-3.1-8b-instruct`,
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
              content: 'You are an experienced teacher writing formal, warm, and constructive student report comments in English.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 600,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok || !data.success) {
      const errMsg = data.errors?.[0]?.message || 'Cloudflare AI error';
      return res.status(500).json({ error: errMsg });
    }

    const text = data.result?.response || '';
    return res.status(200).json({
      content: [{ type: 'text', text }]
    });

  } catch (err) {
    return res.status(500).json({ error: 'Server error: ' + err.message });
  }
}
