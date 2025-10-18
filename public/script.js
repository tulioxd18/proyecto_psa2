const fileInput = document.getElementById('fileInput')
const descargarBtn = document.getElementById('Descargarbtn')
const limpiarBtn = document.getElementById('Limpiarbtn')
const filenameEl = document.getElementById('filename')
const pdfPreview = document.getElementById('pdfPreview')
const messageEl = document.getElementById('message')  // nuevo párrafo para mensajes al usuario

let pdfUrl = ''
let createdObjectUrl = null

const allowedExt = ['.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx']

function getFilenameFromDisposition(disposition) {
    if (!disposition) return ''
    const match = disposition.match(/filename\*?=(?:UTF-8'')?["']?([^;"']+)["']?/)
    return match ? decodeURIComponent(match[1]) : ''
}

fileInput.addEventListener('change', async () => {
    messageEl.textContent = ''
    const file = fileInput.files[0]
    if (!file) {
        descargarBtn.disabled = true
        filenameEl.textContent = 'Ningún archivo seleccionado'
        pdfPreview.style.display = 'none'
        pdfPreview.src = ''
        pdfUrl = ''
        if (createdObjectUrl) URL.revokeObjectURL(createdObjectUrl)
        createdObjectUrl = null
        return
    }

    const ext = '.' + file.name.split('.').pop().toLowerCase()
    if (!allowedExt.includes(ext)) {
        messageEl.textContent = `Formato no permitido. Suba Word (.doc o .docx), PowerPoint (.ppt o .pptx) o Excel (.xls o .xlsx).`
        fileInput.value = ''
        return
    }

    filenameEl.textContent = file.name
    descargarBtn.disabled = true
    pdfPreview.style.display = 'none'
    pdfPreview.src = ''
    pdfUrl = ''
    if (createdObjectUrl) URL.revokeObjectURL(createdObjectUrl)
    createdObjectUrl = null

    const formData = new FormData()
    formData.append('file', file)

    try {
        const res = await fetch('/api/convert', { method: 'POST', body: formData })
        if (!res.ok) {
            const txt = await res.text()
            messageEl.textContent = txt || 'Error al convertir el archivo'
            return
        }

        const blob = await res.blob()
        createdObjectUrl = URL.createObjectURL(blob)
        pdfUrl = createdObjectUrl
        const dispo = res.headers.get('content-disposition') || ''
        const name = getFilenameFromDisposition(dispo) || file.name.replace(/\.[^/.]+$/, '') + '.pdf'
        descargarBtn.dataset.filename = name
        pdfPreview.src = pdfUrl
        pdfPreview.style.display = 'block'
        descargarBtn.disabled = false
        messageEl.textContent = 'Archivo convertido correctamente. Puede previsualizarlo o descargarlo.'
    } catch (e) {
        messageEl.textContent = 'Error al convertir el archivo. Intente de nuevo.'
        if (createdObjectUrl) URL.revokeObjectURL(createdObjectUrl)
        createdObjectUrl = null
        pdfUrl = ''
        pdfPreview.style.display = 'none'
        pdfPreview.src = ''
        descargarBtn.disabled = true
    }
})

descargarBtn.addEventListener('click', () => {
    if (!pdfUrl) return alert('No hay PDF para descargar')
    const link = document.createElement('a')
    link.href = pdfUrl
    const name = descargarBtn.dataset.filename || ''
    if (name) link.download = name
    document.body.appendChild(link)
    link.click()
    link.remove()
})

limpiarBtn.addEventListener('click', () => {
    fileInput.value = ''
    filenameEl.textContent = 'Ningún archivo seleccionado'
    pdfPreview.src = ''
    pdfPreview.style.display = 'none'
    descargarBtn.disabled = true
    pdfUrl = ''
    messageEl.textContent = ''
    if (createdObjectUrl) URL.revokeObjectURL(createdObjectUrl)
    createdObjectUrl = null
})
