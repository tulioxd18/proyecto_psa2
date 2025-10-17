const fileInput = document.getElementById('fileInput');
const descargarBtn = document.getElementById('Descargarbtn');
const limpiarBtn = document.getElementById('Limpiarbtn');
const filenameEl = document.getElementById('filename');
const pdfPreview = document.getElementById('pdfPreview');

fileInput.addEventListener('change', () => {
    const file = fileInput.files[0];
    if (!file) {
        descargarBtn.disabled = true;
        filenameEl.textContent = 'Ningún archivo seleccionado';
        pdfPreview.style.display = 'none';
        pdfPreview.src = '';
        return;
    }
    filenameEl.textContent = file.name;
    descargarBtn.disabled = false;
});

descargarBtn.addEventListener('click', async () => {
    if (!fileInput.files[0]) return;

    const formData = new FormData();
    formData.append('file', fileInput.files[0]);

    const res = await fetch('/api/convert', { method: 'POST', body: formData });
    if (!res.ok) return alert('Error al convertir el archivo');

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    pdfPreview.src = url;
    pdfPreview.style.display = 'block';

    const link = document.createElement('a');
    link.href = url;
    link.download = fileInput.files[0].name.replace(/\.\w+$/, '.pdf');
    link.click();
});

limpiarBtn.addEventListener('click', () => {
    fileInput.value = '';
    filenameEl.textContent = 'Ningún archivo seleccionado';
    pdfPreview.src = '';
    pdfPreview.style.display = 'none';
    descargarBtn.disabled = true;
});
