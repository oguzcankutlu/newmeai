import crypto from 'crypto';

function getEnvOrThrow(res) {
    const API_KEY = process.env.WIRO_API_KEY;
    const API_SECRET = process.env.WIRO_API_SECRET;
    if (!API_KEY || !API_SECRET) {
        res.status(500).json({
            error: 'Server misconfigured: missing WIRO_API_KEY/WIRO_API_SECRET environment variables'
        });
        return null;
    }
    return { API_KEY, API_SECRET };
}

export default async function handler(req, res) {
    const { taskId } = req.query;
    
    const creds = getEnvOrThrow(res);
    if (!creds) return;
    const { API_KEY, API_SECRET } = creds;

    if (!taskId) return res.status(400).json({ error: 'Task ID gerekli' });

    try {
        const nonce = Date.now().toString();
        const signature = crypto.createHmac('sha256', API_KEY).update(API_SECRET + nonce).digest('hex');

        const response = await fetch(`https://api.wiro.ai/v1/task/${taskId}`, {
            headers: {
                'x-api-key': API_KEY,
                'x-nonce': nonce,
                'x-signature': signature
            }
        });

        const data = await response.json();
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
