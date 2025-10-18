const CloudmersiveConvertApiClient = require('cloudmersive-convert-api-client');
const formidable = require('formidable');
const fs = require('fs');

module.exports = async (req, res) => {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

    const form = new formidable.IncomingForm();
    form.parse(req, async (err, fields, files) => {
        if (err || !files.file) return res.status(400).send('No file uploaded');

        const defaultClient = CloudmersiveConvertApiClient.ApiClient.instance;
        const Apikey = defaultClient.authentications['Apikey'];
        Apikey.apiKey = "TU_API_KEY_AQUI";

        const api = new CloudmersiveConvertApiClient.ConvertDocumentApi();
        const inputFile = fs.readFileSync(files.file.filepath);

        try {
            const pdfBuffer = await new Promise((resolve, reject) => {
                api.convertDocumentDocxToPdf(inputFile, (error, data, response) => {
                    if (error) reject(error);
                    else resolve(Buffer.from(data, 'base64'));
                });
            });

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'attachment; filename="documento.pdf"');
            res.send(pdfBuffer);
        } catch (e) {
            console.error(e);
            res.status(500).send('Error converting file');
        }
    });
};