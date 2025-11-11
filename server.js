const express = require("express");
const fileUpload = require("express-fileupload");
const path = require("path");
const fs = require("fs");
const FormData = require("form-data");
const fetch = require("node-fetch");

const CLOUDMERSIVE_API_KEY = process.env.CLOUDMERSIVE_API_KEY || "8f9c56d4-8d02-42af-a7b2-a5be14b334c3";

const app = express();
app.use(express.static("public"));
app.use(fileUpload({ limits: { fileSize: 50 * 1024 * 1024 } }));

const allowedExt = [".doc", ".docx", ".ppt", ".pptx", ".xls", ".xlsx"];
const uploadsDir = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

app.post("/api/convert", async (req, res) => {
  if (!CLOUDMERSIVE_API_KEY) return res.status(500).send("Falta CLOUDMERSIVE_API_KEY");
  if (!req.files || !req.files.file) return res.status(400).send("No se recibió ningún archivo");

  const file = req.files.file;
  const ext = path.extname(file.name).toLowerCase();
  if (!allowedExt.includes(ext))
    return res.status(400).send("Formato no permitido. Suba Word, PowerPoint o Excel");

  const safeName = file.name.replace(/[^a-zA-Z0-9_\-\.]/g, "_");
  const filePath = path.join(uploadsDir, safeName);
  await file.mv(filePath);

  try {
    const form = new FormData();
    form.append("file", fs.createReadStream(filePath), { filename: safeName });
    const headers = Object.assign({ Apikey: CLOUDMERSIVE_API_KEY }, form.getHeaders());

    let url = "";
    if (ext === ".doc" || ext === ".docx") url = "https://api.cloudmersive.com/convert/docx/to/pdf";
    if (ext === ".ppt" || ext === ".pptx") url = "https://api.cloudmersive.com/convert/pptx/to/pdf";
    if (ext === ".xls" || ext === ".xlsx") url = "https://api.cloudmersive.com/convert/xlsx/to/pdf";

    const resp = await fetch(url, { method: "POST", headers, body: form });
    if (!resp.ok) {
      const txt = await resp.text();
      return res.status(resp.status).send(txt || "Error en Cloudmersive");
    }

    const arrayBuffer = await resp.arrayBuffer();
    const pdfBuffer = Buffer.from(arrayBuffer);

    const pdfName = path.basename(safeName, ext) + ".pdf";
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "inline; filename*=UTF-8''" + encodeURIComponent(pdfName));
    res.send(pdfBuffer);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error interno al convertir el archivo");
  } finally {
    fs.unlink(filePath, () => {});
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor corriendo en http://localhost:${PORT}`));
