document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('fileInput');
    const descargarBtn = document.getElementById('Descargarbtn');
    const limpiarBtn = document.getElementById('Limpiarbtn');
    const filenameEl = document.getElementById('filename');
    const messageEl = document.getElementById('message');
    const pdfPreview = document.getElementById('pdfPreview');
    let pdfUrl = '';

    fileInput.addEventListener('change', async () => {
        const file = fileInput.files[0];
        if (!file) {
            descargarBtn.disabled = true;
            filenameEl.textContent = 'Ningún archivo seleccionado';
            pdfPreview.style.display = 'none';
            pdfPreview.src = '';
            pdfUrl = '';
            return;
        }

        const ext = file.name.split('.').pop().toLowerCase();
        if (!['doc','docx','ppt','pptx','xls','xlsx','xlsb'].includes(ext)) {
            alert('Solo se permiten Word, Excel o PowerPoint');
            fileInput.value = '';
            return;
        }

        filenameEl.textContent = file.name;
        descargarBtn.disabled = true;
        pdfPreview.style.display = 'none';
        pdfPreview.src = '';
        pdfUrl = '';

        try {
            messageEl.textContent = 'Convirtiendo archivo...';
            const arrayBuffer = await file.arrayBuffer();

            const res = await fetch('/api/convert', {
                method: 'POST',
                headers: { 'X-Filename': file.name },
                body: arrayBuffer
            });

            if (res.status === 405) {
                alert('Método no permitido. No accedas a la URL directamente.');
                messageEl.textContent = '';
                return;
            }

            if (!res.ok) {
                const txt = await res.text();
                alert(txt || 'Error al convertir el archivo. Revisa que sea un archivo válido.');
                messageEl.textContent = '';
                return;
            }

            const blob = await res.blob();
            pdfUrl = URL.createObjectURL(blob);
            pdfPreview.src = pdfUrl;
            pdfPreview.style.display = 'block';
            descargarBtn.disabled = false;
            messageEl.textContent = 'Archivo listo';
        } catch (e) {
            console.error(e);
            alert('Error al convertir el archivo. Puede ser inválido o contener elementos no soportados.');
            messageEl.textContent = '';
        }
    });

    descargarBtn.addEventListener('click', () => {
        if (!pdfUrl) return alert('No hay PDF para descargar');
        const link = document.createElement('a');
        link.href = pdfUrl;
        link.download = filenameEl.textContent.replace(/\.[^.]+$/, '.pdf');
        document.body.appendChild(link);
        link.click();
        link.remove();
    });

    limpiarBtn.addEventListener('click', () => {
        fileInput.value = '';
        filenameEl.textContent = 'Ningún archivo seleccionado';
        messageEl.textContent = '';
        pdfPreview.src = '';
        pdfPreview.style.display = 'none';
        descargarBtn.disabled = true;
        pdfUrl = '';
    });
    // ===== Carrusel de desarrolladores =====
(() => {
  const track = document.getElementById("devTrack");
  if (!track) return;

  const prev = document.querySelector(".carousel-btn.prev");
  const next = document.querySelector(".carousel-btn.next");

  const gap = 14;
  const cardWidth = () => {
    const card = track.querySelector(".dev-card");
    return card ? card.getBoundingClientRect().width + gap : 220;
    };

  const scrollByCard = (dir = 1) =>
    track.scrollBy({ left: dir * cardWidth(), behavior: "smooth" });

  prev?.addEventListener("click", () => scrollByCard(-1));
  next?.addEventListener("click", () => scrollByCard(1));

  // Auto-avance cada 4s; pausa al interactuar
  let timer = setInterval(() => scrollByCard(1), 4000);
  const pause = () => { clearInterval(timer); timer = null; };
  const resume = () => { if (!timer) timer = setInterval(() => scrollByCard(1), 4000); };

  ["mouseenter","touchstart","pointerdown","focusin"].forEach(ev => track.addEventListener(ev, pause));
  ["mouseleave","touchend","pointerup","focusout"].forEach(ev => track.addEventListener(ev, resume));

  // Teclado accesible (flechas cuando el track tiene foco)
  track.setAttribute("tabindex","0");
  track.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") { e.preventDefault(); scrollByCard(1); }
    if (e.key === "ArrowLeft")  { e.preventDefault(); scrollByCard(-1); }
  });
})();

});
