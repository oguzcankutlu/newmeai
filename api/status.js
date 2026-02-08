import crypto from 'crypto';

export default async function handler(req, res) {
    const { taskId } = req.query;
    
    // API BİLGİLERİ
    const API_KEY = 'wmmxuwnx6lvh1bhvn4s9vck8boamwjnx';
    const API_SECRET = '1416f0aeaa653afd1135617cd72667991a212024397e16bd78b0f3931146934d';

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
