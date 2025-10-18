import fetch from 'node-fetch';
import FormData from 'form-data';

export const config = {
  api: {
    bodyParser: false
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const bodyBuffer = Buffer.concat(chunks);

  const contentType = req.headers['content-type'];
  if (!contentType || !contentType.includes('multipart/form-data')) {
    return res.status(400).send('No se envió multipart/form-data');
  }

  const boundaryMatch = contentType.match(/boundary=(.+)$/);
  if (!boundaryMatch) return res.status(400).send('No se encontró boundary en multipart/form-data');
  const boundary = boundaryMatch[1];

  const parseMultipart = require('parse-multipart');
  const parts = parseMultipart.Parse(bodyBuffer, boundary);
  const filePart = parts.find(p => p.filename);
  if (!filePart) return res.status(400).send('No se recibió archivo');

  const apiKey = process.env.CLOUDMERSIVE_API_KEY;
  if (!apiKey) return res.status(500).send('Falta CLOUDMERSIVE_API_KEY');

  let url = 'https://api.cloudmersive.com/convert/docx/to/pdf';
  const ext = filePart.filename.split('.').pop().toLowerCase();
  if (ext === 'pptx') url = 'https://api.cloudmersive.com/convert/pptx/to/pdf';
  if (ext === 'xlsx') url = 'https://api.cloudmersive.com/convert/xlsx/to/pdf';

  try {
    const form = new FormData();
    form.append('file', filePart.data, { filename: filePart.filename });

    const resp = await fetch(url, { method: 'POST', headers: { Apikey: apiKey }, body: form });
    if (!resp.ok) {
      const txt = await resp.text().catch(() => '');
      return res.status(resp.status).send(txt || 'Error en Cloudmersive');
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filePart.filename.replace(/\.[^/.]+$/, '')}.pdf"`);
    resp.body.pipe(res);
  } catch (err) {
    res.status(500).send('Error interno');
  }
}
