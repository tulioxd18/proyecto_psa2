const express = require("express")
const fileUpload = require("express-fileupload")
const fs = require("fs")
const path = require("path")
const FormData = require("form-data")
const fetch = require("node-fetch")

const CLOUDMERSIVE_API_KEY = "8f9c56d4-8d02-42af-a7b2-a5be14b334c3"

const app = express()
app.use(express.static("public"))
app.use(fileUpload())

const allowedExt = [".docx", ".pptx", ".xlsx"]

app.post("/convert", async (req, res) => {
    if (!req.files || !req.files.file) return res.status(400).send("No file")
    const file = req.files.file
    const ext = path.extname(file.name).toLowerCase()
    if (!allowedExt.includes(ext)) return res.status(400).send("Solo se permiten archivos Word, PowerPoint o Excel")

    const uploadsDir = path.join(__dirname, "uploads")
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir)
    const uploadPath = path.join(uploadsDir, file.name)
    await file.mv(uploadPath)

    try {
        const form = new FormData()
        form.append("file", fs.createReadStream(uploadPath))
        const headers = Object.assign({ Apikey: CLOUDMERSIVE_API_KEY }, form.getHeaders())

        let url = "https://api.cloudmersive.com/convert/docx/to/pdf"
        if (ext === ".pptx") url = "https://api.cloudmersive.com/convert/pptx/to/pdf"
        if (ext === ".xlsx") url = "https://api.cloudmersive.com/convert/xlsx/to/pdf"

        const resp = await fetch(url, { method: "POST", headers, body: form })
        if (!resp.ok) {
            const txt = await resp.text()
            try { fs.unlinkSync(uploadPath) } catch { }
            return res.status(resp.status).send(txt || "Error en Cloudmersive")
        }
        const buffer = await resp.buffer()
        const pdfPath = path.join(uploadsDir, file.name.replace(ext, ".pdf"))
        fs.writeFileSync(pdfPath, buffer)
        res.json({ url: "/uploads/" + path.basename(pdfPath), filename: path.basename(pdfPath) })
    } catch {
        try { fs.unlinkSync(uploadPath) } catch { }
        res.status(500).send("Error interno")
    }
})

app.use("/uploads", express.static(path.join(__dirname, "uploads")))

app.listen(3000, () => console.log("Servidor corriendo en http://localhost:3000"))
