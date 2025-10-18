import CloudmersiveConvertApiClient from 'cloudmersive-convert-api-client';

export const config = {
    api: { bodyParser: false }
};

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

    if (!process.env.CLOUDMERSIVE_API_KEY)
        return res.status(500).send('Falta CLOUDMERSIVE_API_KEY');

    try {
        const chunks = [];
        for await (const chunk of req) chunks.push(chunk);
        const buffer = Buffer.concat(chunks);

        const contentType = req.headers['content-type'] || '';
        const match = contentType.match(/filename="(.+)"/);
        if (!match) return res.status(400).send('No se pudo leer el archivo');

        const originalFilename = match[1];
        const ext = originalFilename.split('.').pop().toLowerCase();

        const allowedExt = ['docx', 'pptx', 'xlsx'];
        if (!allowedExt.includes(ext))
            return res.status(400).send('Solo se permiten archivos Word, PowerPoint o Excel');

        const defaultClient = CloudmersiveConvertApiClient.ApiClient.instance;
        defaultClient.authentications['Apikey'].apiKey = process.env.CLOUDMERSIVE_API_KEY;
        const api = new CloudmersiveConvertApiClient.ConvertDocumentApi();

        let pdfBuffer;
        if (ext === 'docx') {
            pdfBuffer = await new Promise((resolve, reject) => {
                api.convertDocumentDocxToPdf(buffer, (err, data) => {
                    if (err) reject(err);
                    else resolve(Buffer.from(data, 'base64'));
                });
            });
        } else if (ext === 'pptx') {
            pdfBuffer = await new Promise((resolve, reject) => {
                api.convertDocumentPptxToPdf(buffer, (err, data) => {
                    if (err) reject(err);
                    else resolve(Buffer.from(data, 'base64'));
                });
            });
        } else if (ext === 'xlsx') {
            pdfBuffer = await new Promise((resolve, reject) => {
                api.convertDocumentXlsxToPdf(buffer, (err, data) => {
                    if (err) reject(err);
                    else resolve(Buffer.from(data, 'base64'));
                });
            });
        }

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
            'Content-Disposition',
            `attachment; filename="${originalFilename.replace(/\.[^.]+$/, '.pdf')}"`
        );
        res.send(pdfBuffer);

    } catch (e) {
        console.error(e);
        res.status(500).send('Error al convertir el archivo');
    }
}
