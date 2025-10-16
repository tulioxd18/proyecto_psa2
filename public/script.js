const fileInput = document.getElementById('fileInput')
const pdfPreview = document.getElementById('pdfPreview')
const filenameEl = document.getElementById('filename')
const Descargarbtn = document.getElementById('Descargarbtn')
const Limpiarbtn = document.getElementById('Limpiarbtn')
let currentPdfUrl = ''

fileInput.addEventListener('change', async () => {
    const file = fileInput.files[0]
    if (!file) return
    const ext = file.name.split('.').pop().toLowerCase()
    if (!["docx", "pptx", "xlsx"].includes(ext)) {
        alert("Solo archivos Word, PowerPoint o Excel")
        fileInput.value = ''
        return
    }
    filenameEl.textContent = file.name
    Descargarbtn.disabled = true
    pdfPreview.style.display = 'none'
    pdfPreview.src = ''

    const formData = new FormData()
    formData.append('file', file)
    try {
        const res = await fetch('/convert', { method: 'POST', body: formData })
        if (!res.ok) {
            const txt = await res.text()
            return alert('Error: ' + txt)
        }
        const data = await res.json()
        currentPdfUrl = data.url
        pdfPreview.src = currentPdfUrl
        pdfPreview.style.display = 'block'
        Descargarbtn.disabled = false
    } catch {
        alert('Error al generar PDF')
    }
})

Descargarbtn.addEventListener('click', () => {
    if (!currentPdfUrl) return
    const a = document.createElement('a')
    a.href = currentPdfUrl
    a.download = filenameEl.textContent.replace(/\.(docx|pptx|xlsx)$/i, '.pdf')
    document.body.appendChild(a)
    a.click()
    a.remove()
})

Limpiarbtn.addEventListener('click', () => {
    fileInput.value = ''
    filenameEl.textContent = 'Ningún archivo seleccionado'
    pdfPreview.src = ''
    pdfPreview.style.display = 'none'
    Descargarbtn.disabled = true
    currentPdfUrl = ''
})
