# Automatizador de Entradas (SICAR)

Pequeña aplicación cliente para crear entradas de reembolso (extraídas de SICAR), guardarlas en localStorage, exportarlas a PDF e imprimir.

Cómo usar
- Abre [index.html](index.html) en tu navegador (puedes usar Live Server o abrir el archivo directamente).
- Rellena `Folio`, `Proveedor`, `RFC`, `Fecha` y `Comentario`.
- Agrega productos con "Agregar producto" y completa `CANT`, `UNI`, `FACTOR`, `DESCRIPCIÓN`, `P. UNIT.`, `DESCUENTO`.
- Pulsa `Guardar sesión` para guardar en el almacenamiento local del navegador; `Cargar sesión` para recuperarla.
- Usa `Exportar PDF` para descargar un PDF o `Imprimir` para imprimir.

Notas
- La sesión y las plantillas se almacenan localmente en el navegador (localStorage). No se requiere base de datos.
- Hay 3 plantillas de ejemplo en la carpeta `PLANTILLA`.
