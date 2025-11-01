import CloudmersiveConvertApiClient from 'cloudmersive-convert-api-client';

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Método no permitido');
    if (!process.env.CLOUDMERSIVE_API_KEY) return res.status(500).send('Falta CLOUDMERSIVE_API_KEY');

    try {
        const chunks = [];
        for await (const chunk of req) chunks.push(chunk);
        const buffer = Buffer.concat(chunks);

        const originalFilename = req.headers['x-filename'];
        if (!originalFilename) return res.status(400).send('No se pudo leer el archivo');

        const ext = originalFilename.split('.').pop().toLowerCase();

        const wordExts = ['doc', 'docx', 'dot', 'dotx', 'docm', 'dotm'];
        const pptExts = ['ppt', 'pptx', 'pps', 'ppsx', 'pptm', 'ppsm'];
        const excelExts = ['xls', 'xlsx', 'xlsm', 'xlsb', 'xlt', 'xltx', 'xltm'];

        const client = CloudmersiveConvertApiClient.ApiClient.instance;
        client.authentications['Apikey'].apiKey = process.env.CLOUDMERSIVE_API_KEY;
        const api = new CloudmersiveConvertApiClient.ConvertDocumentApi();

        let pdfBuffer;

        if (wordExts.includes(ext)) {
            pdfBuffer = await api.convertDocumentDocxToPdf(buffer);
        } else if (pptExts.includes(ext)) {
            pdfBuffer = await api.convertDocumentPptxToPdf(buffer);
        } else if (excelExts.includes(ext)) {
            pdfBuffer = await api.convertDocumentXlsxToPdf(buffer);
        } else {
            return res.status(400).send('Solo se permiten archivos de Word, PowerPoint o Excel');
        }

        if (!pdfBuffer || pdfBuffer.length === 0)
            return res.status(500).send('No se pudo generar el PDF');

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${originalFilename.replace(/\.[^.]+$/, '.pdf')}"`);
        res.send(pdfBuffer);

    } catch (e) {
        console.error('Error al convertir archivo:', e);
        res.status(500).send('Error interno al convertir el archivo.');
    }
}
