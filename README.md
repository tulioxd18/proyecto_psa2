# office-to-pdf

office-to-pdf convierte documentos de Microsoft Office (.doc, .docx, .ppt, .pptx, .xls, .xlsx) a PDF mediante la API de Cloudmersive. La aplicación ofrece una interfaz web simple para subir un archivo y descargar el PDF resultante.

Qué hace
- Convierte un único archivo Office a PDF por cada petición.
- Proporciona una interfaz web (public/) donde el usuario selecciona un archivo y recibe el PDF.
- Expone un endpoint HTTP POST `/api/convert` que acepta multipart/form-data (campo `file`) y devuelve el PDF generado.

Qué se necesita
- Node.js y npm instalados.
- Instalar dependencias del proyecto:
  ```
  npm install
  ```
- Definir la variable de entorno `CLOUDMERSIVE_API_KEY` con una API key válida de Cloudmersive.
- Ejecutar la aplicación:
  ```
  node server.js
  ```
  y abrir `http://localhost:3000` en el navegador.

Notas
- Actualmente no hay soporte nativo para convertir carpetas completas en una sola operación; para lotes se puede usar un script que suba archivos uno a uno al endpoint `/api/convert`.
- Ten en cuenta límites y cuotas de la API de Cloudmersive al automatizar conversiones masivas.
