import crypto from 'crypto';

export const config = {
    api: {
        bodyParser: {
            sizeLimit: '10mb',
        },
    },
};

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    // API BİLGİLERİ
    const API_KEY = 'wmmxuwnx6lvh1bhvn4s9vck8boamwjnx';
    const API_SECRET = '1416f0aeaa653afd1135617cd72667991a212024397e16bd78b0f3931146934d';

    try {
        const { imageBase64, maskBase64, prompt } = req.body;

        if (!imageBase64 || !maskBase64) {
            return res.status(400).json({ error: 'Resim verisi eksik' });
        }

        // Base64 temizle ve Buffer yap
        const imgBuffer = Buffer.from(imageBase64.split(',')[1], 'base64');
        const maskBuffer = Buffer.from(maskBase64.split(',')[1], 'base64');

        // Multipart Body oluştur (Manuel, çünkü Vercel'de external lib kullanmak istemiyoruz)
        const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
        let bodyParts = [];

        // Input Image
        bodyParts.push(`--${boundary}\r\nContent-Disposition: form-data; name="inputImage"; filename="image.jpg"\r\nContent-Type: image/jpeg\r\n\r\n`);
        bodyParts.push(imgBuffer);
        bodyParts.push(`\r\n`);

        // Mask Image
        bodyParts.push(`--${boundary}\r\nContent-Disposition: form-data; name="maskImage"; filename="mask.png"\r\nContent-Type: image/png\r\n\r\n`);
        bodyParts.push(maskBuffer);
        bodyParts.push(`\r\n`);

        // Diğer Parametreler
        const params = {
            prompt: prompt,
            width: '1024',
            height: '1024',
            guidance: '25',
            steps: '25',
            outputFormat: 'png'
        };

        for (const [key, value] of Object.entries(params)) {
            bodyParts.push(`--${boundary}\r\nContent-Disposition: form-data; name="${key}"\r\n\r\n${value}\r\n`);
        }
        bodyParts.push(`--${boundary}--`);

        // Tüm parçaları birleştir
        const finalBody = Buffer.concat(bodyParts.map(part => (typeof part === 'string' ? Buffer.from(part) : part)));

        // İMZA OLUŞTURMA
        const nonce = Date.now().toString();
        const signature = crypto.createHmac('sha256', API_KEY).update(API_SECRET + nonce).digest('hex');

        // WIRO API İSTEĞİ
        const response = await fetch('https://api.wiro.ai/v1/Run/black-forest-labs/flux-1-fill-dev', {
            method: 'POST',
            headers: {
                'x-api-key': API_KEY,
                'x-nonce': nonce,
                'x-signature': signature,
                'Content-Type': `multipart/form-data; boundary=${boundary}`,
                'Content-Length': finalBody.length
            },
            body: finalBody
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("Wiro API Hatası:", data);
            return res.status(response.status).json({ error: data.message || 'API Hatası' });
        }

        res.status(200).json(data);

    } catch (error) {
        console.error("Server Hatası:", error);
        res.status(500).json({ error: error.message });
    }
}
