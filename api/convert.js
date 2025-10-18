import parseMultipart from 'parse-multipart';
import FormData from 'form-data';
import fetch from 'node-fetch';

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Solo POST permitido');

    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const bodyBuffer = Buffer.concat(chunks);

    const contentType = req.headers['content-type'];
    if (!contentType || !contentType.includes('multipart/form-data'))
        return res.status(400).send('Archivo inválido');

    const boundaryMatch = contentType.match(/boundary=(.+)$/);
    const boundary = boundaryMatch[1];
    const parts = parseMultipart.Parse(bodyBuffer, boundary);
    const filePart = parts.find(p => p.filename);
    if (!filePart) return res.status(400).send('No se recibió ningún archivo');

    const ext = filePart.filename.split('.').pop().toLowerCase();
    const allowed = ['doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx'];
    if (!allowed.includes(ext))
        return res.status(400).send('Formato no permitido. Suba Word (.doc/.docx), PowerPoint (.ppt/.pptx) o Excel (.xls/.xlsx).');

    const apiKey = process.env.CLOUDMERSIVE_API_KEY;
    if (!apiKey) return res.status(500).send('Falta la API Key');

    let url = 'https://api.cloudmersive.com/convert/docx/to/pdf';
    if (ext === 'doc') url = 'https://api.cloudmersive.com/convert/docx/to/pdf';
    if (ext === 'ppt' || ext === 'pptx') url = 'https://api.cloudmersive.com/convert/pptx/to/pdf';
    if (ext === 'xls' || ext === 'xlsx') url = 'https://api.cloudmersive.com/convert/xlsx/to/pdf';

    try {
        const form = new FormData();
        form.append('file', filePart.data, { filename: filePart.filename });

        const resp = await fetch(url, { method: 'POST', headers: { Apikey: apiKey }, body: form });
        if (!resp.ok) {
            const txt = await resp.text().catch(() => '');
            return res.status(resp.status).send(txt || 'Error al convertir el archivo');
        }

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filePart.filename.replace(/\.[^/.]+$/, '')}.pdf"`);
        resp.body.pipe(res);
    } catch (err) {
        res.status(500).send('Error interno al convertir el archivo');
    }
}
