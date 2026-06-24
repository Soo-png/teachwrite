export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { password } = req.body;
  const correct = process.env.SITE_PASSWORD;

  if (!correct) {
    return res.status(500).json({ error: 'Password not configured on server.' });
  }

  if (password === correct) {
    return res.status(200).json({ ok: true });
  } else {
    return res.status(200).json({ ok: false });
  }
}
