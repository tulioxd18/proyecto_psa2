import express from 'express';
import fs from 'fs';
import path from 'path';
import CloudmersiveConvertApiClient from 'cloudmersive-convert-api-client';

const app = express();
app.use(express.json());

app.post('/api/convert', async (req, res) => {
    try {
        const originalFilename = req.body.filename || req.headers['x-filename'] || req.query.filename;
        if (!originalFilename) return res.status(400).send('No se pudo leer el archivo');
        const safeName = path.basename(originalFilename);
        const uploadsDir = path.join(process.cwd(), 'uploads');
        const filePath = path.join(uploadsDir, safeName);
        if (!fs.existsSync(filePath)) return res.status(404).send('Archivo no encontrado en uploads');
        const buffer = fs.readFileSync(filePath);
        const ext = safeName.split('.').pop().toLowerCase();
        if (!['doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx'].includes(ext)) return res.status(400).send('Solo se permiten archivos Word, PowerPoint o Excel');
        if (!process.env.CLOUDMERSIVE_API_KEY) return res.status(500).send('Falta CLOUDMERSIVE_API_KEY');

        const client = CloudmersiveConvertApiClient.ApiClient.instance;
        client.authentications['Apikey'].apiKey = process.env.CLOUDMERSIVE_API_KEY;
        const api = new CloudmersiveConvertApiClient.ConvertDocumentApi();

        let pdfBuffer;

        if (ext === 'docx') {
            pdfBuffer = await new Promise((resolve, reject) =>
                api.convertDocumentDocxToPdf(buffer, (err, data) => err ? reject(err) : resolve(Buffer.from(data, 'base64')))
            );
        } else if (ext === 'doc') {
            pdfBuffer = await new Promise((resolve, reject) =>
                api.convertDocumentDocToPdf(buffer, (err, data) => err ? reject(err) : resolve(Buffer.from(data, 'base64')))
            );
        } else if (ext === 'pptx') {
            pdfBuffer = await new Promise((resolve, reject) =>
                api.convertDocumentPptxToPdf(buffer, (err, data) => err ? reject(err) : resolve(Buffer.from(data, 'base64')))
            );
        } else if (ext === 'ppt') {
            pdfBuffer = await new Promise((resolve, reject) =>
                api.convertDocumentPptToPdf(buffer, (err, data) => err ? reject(err) : resolve(Buffer.from(data, 'base64')))
            );
        } else if (ext === 'xlsx') {
            pdfBuffer = await new Promise((resolve, reject) =>
                api.convertDocumentXlsxToPdf(buffer, (err, data) => err ? reject(err) : resolve(Buffer.from(data, 'base64')))
            );
        } else if (ext === 'xls') {
            pdfBuffer = await new Promise((resolve, reject) =>
                api.convertDocumentXlsToPdf(buffer, (err, data) => err ? reject(err) : resolve(Buffer.from(data, 'base64')))
            );
        }

        if (!pdfBuffer || pdfBuffer.length === 0) return res.status(500).send('No se pudo generar el PDF');

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${safeName.replace(/\.[^.]+$/, '.pdf')}"`);
        res.send(pdfBuffer);
    } catch (e) {
        console.error('Error al convertir archivo:', e);
        res.status(500).send('Error interno al convertir el archivo. Asegúrate de que el archivo sea válido y no muy pesado.');
    }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
});
