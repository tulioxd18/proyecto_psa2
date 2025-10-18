const fileInput = document.getElementById('fileInput')
const descargarBtn = document.getElementById('Descargarbtn')
const limpiarBtn = document.getElementById('Limpiarbtn')
const filenameEl = document.getElementById('filename')
const pdfPreview = document.getElementById('pdfPreview')

let pdfUrl = ''

fileInput.addEventListener('change', async () => {
    const file = fileInput.files[0]
    if (!file) {
        descargarBtn.disabled = true
        filenameEl.textContent = 'Ningún archivo seleccionado'
        pdfPreview.style.display = 'none'
        pdfPreview.src = ''
        pdfUrl = ''
        return
    }
    filenameEl.textContent = file.name
    descargarBtn.disabled = true
    pdfPreview.style.display = 'none'
    pdfPreview.src = ''
    pdfUrl = ''
    const formData = new FormData()
    formData.append('file', file)
    try {
        const res = await fetch('/api/convert', { method: 'POST', body: formData })
        if (!res.ok) {
            const txt = await res.text()
            alert(txt || 'Error al convertir el archivo')
            return
        }
        const data = await res.json()
        if (!data || !data.url) {
            alert('Respuesta inválida del servidor')
            return
        }
        pdfUrl = data.url
        pdfPreview.src = pdfUrl
        pdfPreview.style.display = 'block'
        descargarBtn.disabled = false
    } catch (e) {
        alert('Error al convertir el archivo')
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
    link.download = ''
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
})
