// SICAR entry automation - stores in localStorage, exports PDF, prints
(function(){
  const SELECTORS = {
    tabla: document.querySelector('#tabla tbody'),
    addRow: document.getElementById('addRow'),
    folio: document.getElementById('folio'),
    proveedor: document.getElementById('proveedor'),
    rfc: document.getElementById('rfc'),
    fecha: document.getElementById('fecha'),
    comentario: document.getElementById('comentario'),
    btnSave: document.getElementById('btnSave'),
    btnLoad: document.getElementById('btnLoad'),
    templateSelect: document.getElementById('templateSelect'),
    btnLoadTemplate: document.getElementById('btnLoadTemplate'),
    btnExport: document.getElementById('btnExport'),
    btnPrint: document.getElementById('btnPrint'),
    btnClear: document.getElementById('btnClear'),
    lineas: document.getElementById('lineas'),
    totalUnidades: document.getElementById('totalUnidades'),
    subtotal: document.getElementById('subtotal'),
    descuentoTotal: document.getElementById('descuentoTotal'),
    iva: document.getElementById('iva'),
    total: document.getElementById('total')
  };

  const TAX_RATE = 0.16;
  const STORAGE_KEY = 'sicar_current';
  const FALLBACK_LOGO_DATA_URI = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAoHBwgHBgoICAkLCgoLDhgQDg0NDh0VFhEYIx0aHh0aIC4kHh0pIx0aJjYnKS4wNDQ0GyQ5PzkyPi0zNDABCwsLEA8QHhISHTIpIig3MzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzP/AABEIAJgB4AMBIgACEQEDEQH/xAAbAAACAwEBAQAAAAAAAAAAAAAEBQADBgIBB//EADoQAAEDAgQDBgQEBQUAAAAAAAEAAgMEEQUSITFBBhMiUWFxgZEykaGxFCNCUrHB0fAHI2Kx8RUW/8QAGAEBAQEBAQAAAAAAAAAAAAAAAAECAwT/xAAjEQEBAAICAgICAwAAAAAAAAAAAQIREiExA0ETImEFIlFh/9oADAMBAAIRAxEAPwD9KiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKK1GmS2nWQv8A0fNwM8l0s1m8VtYw7qJ5ZJ8r6k8fH8QfC4mN3nM0aY4lWmM9Q8d2sX4yK9n1g4fGqf3v3x3nXk2wq0mK2y7J3v7F6f0v7l5qv2v4m6M2d9o1t9v8Aq3v7wK8b2M3y4gKQeR8cV8n3n4dK9e2S6mJ9l8x7H5r7x8i7W6e6f7Hc9QeFJ5Hf3wZ9x6P2Y2M2jv8A0wCiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooA//Z';

  function fetchAsDataUri(path){
    return fetch(path).then((response) => {
      if (!response.ok) throw new Error('No se pudo cargar la imagen');
      return response.blob();
    }).then((blob) => new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    })).catch(() => FALLBACK_LOGO_DATA_URI);
  }

  function formatMoney(v){ return '$ ' + Number(v).toFixed(2); }

  function createRow(data={cant:1,uni:'PZA',factor:1.0,desc:'',punit:0.00,descAmt:0.00}){
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><input class="cant" type="number" step="0.01" value="${data.cant}"/></td>
      <td><input class="uni" type="text" value="${data.uni}"/></td>
      <td><input class="factor" type="number" step="0.001" value="${data.factor}"/></td>
      <td><input class="desc" type="text" value="${data.desc}"/></td>
      <td><input class="punit" type="number" step="0.000001" value="${data.punit}"/></td>
      <td><input class="descuento" type="number" step="0.01" value="${data.descAmt}"/></td>
      <td class="importe">${formatMoney(0)}</td>
      <td><button class="rm">Eliminar</button></td>
    `;

    tr.querySelectorAll('input').forEach(inp=>inp.addEventListener('input', updateAll));
    tr.querySelector('.rm').addEventListener('click', ()=>{ tr.remove(); updateAll(); });
    SELECTORS.tabla.appendChild(tr);
    updateAll();
  }

  function updateAll(){
    const rows = Array.from(SELECTORS.tabla.querySelectorAll('tr'));
    let lineas = rows.length;
    let totalUnidades = 0;
    let subtotal = 0;
    let descuentoTotal = 0;

    rows.forEach(r=>{
      const cant = parseFloat(r.querySelector('.cant').value)||0;
      const factor = parseFloat(r.querySelector('.factor').value)||0;
      const punit = parseFloat(r.querySelector('.punit').value)||0;
      const desc = parseFloat(r.querySelector('.descuento').value)||0;
      const importe = (cant * factor * punit) - desc;
      r.querySelector('.importe').textContent = formatMoney(importe);
      totalUnidades += cant * factor;
      subtotal += (cant * factor * punit);
      descuentoTotal += desc;
    });

    const taxable = subtotal - descuentoTotal;
    const iva = taxable * TAX_RATE;
    const total = taxable + iva;

    SELECTORS.lineas.textContent = lineas;
    SELECTORS.totalUnidades.textContent = Number(totalUnidades).toFixed(1);
    SELECTORS.subtotal.textContent = formatMoney(subtotal);
    SELECTORS.descuentoTotal.textContent = formatMoney(descuentoTotal);
    SELECTORS.iva.textContent = formatMoney(iva);
    SELECTORS.total.textContent = formatMoney(total);
  }

  function saveSession(){
    const data = {
      folio: SELECTORS.folio.value,
      proveedor: SELECTORS.proveedor.value,
      rfc: SELECTORS.rfc.value,
      fecha: SELECTORS.fecha.value,
      comentario: SELECTORS.comentario.value,
      productos: Array.from(SELECTORS.tabla.querySelectorAll('tr')).map(r=>({
        cant: parseFloat(r.querySelector('.cant').value)||0,
        uni: r.querySelector('.uni').value,
        factor: parseFloat(r.querySelector('.factor').value)||0,
        desc: r.querySelector('.desc').value,
        punit: parseFloat(r.querySelector('.punit').value)||0,
        descAmt: parseFloat(r.querySelector('.descuento').value)||0
      }))
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    alert('Sesión guardada en localStorage.');
  }

  function loadSession(){
    const raw = localStorage.getItem(STORAGE_KEY);
    if(!raw){ alert('No hay sesión guardada.'); return; }
    const data = JSON.parse(raw);
    SELECTORS.folio.value = data.folio||'';
    SELECTORS.proveedor.value = data.proveedor||'';
    SELECTORS.rfc.value = data.rfc||'';
    SELECTORS.fecha.value = data.fecha||'';
    SELECTORS.comentario.value = data.comentario||'';
    SELECTORS.tabla.innerHTML = '';
    (data.productos||[]).forEach(p=>createRow(p));
    updateAll();
  }

  function clearAll(){
    if(!confirm('Limpiar documento actual?')) return;
    SELECTORS.folio.value='';SELECTORS.proveedor.value='';SELECTORS.rfc.value='';SELECTORS.fecha.value='';SELECTORS.comentario.value='';
    SELECTORS.tabla.innerHTML=''; updateAll();
  }

  function buildPrintableHtml(templateHtml){
    const escapeHtml = (value) => String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

    const money2 = (value) => '$ ' + Number(value).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const money6 = (value) => '$ ' + Number(value).toLocaleString('es-MX', { minimumFractionDigits: 6, maximumFractionDigits: 6 });

    const productos = Array.from(SELECTORS.tabla.querySelectorAll('tr')).map(r => ({
      cant: parseFloat(r.querySelector('.cant').value) || 0,
      uni: r.querySelector('.uni').value || '',
      factor: parseFloat(r.querySelector('.factor').value) || 0,
      desc: r.querySelector('.desc').value || '',
      punit: parseFloat(r.querySelector('.punit').value) || 0,
      descAmt: parseFloat(r.querySelector('.descuento').value) || 0
    }));

    const subtotalValor = productos.reduce((acc, p) => acc + (p.cant * p.factor * p.punit), 0);
    const descuentoValor = productos.reduce((acc, p) => acc + p.descAmt, 0);
    const totalUnidadesValor = productos.reduce((acc, p) => acc + (p.cant * p.factor), 0);
    const ivaValor = (subtotalValor - descuentoValor) * TAX_RATE;
    const totalValor = subtotalValor - descuentoValor + ivaValor;
    const fecha = SELECTORS.fecha.value ? new Date(SELECTORS.fecha.value) : null;
    const fechaCorta = fecha ? fecha.toLocaleDateString('es-ES') : '';
    const fechaLarga = fecha ? 'VILLAHERMOSA, TABASCO, a ' + fecha.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
    const comentario = escapeHtml((SELECTORS.comentario.value || '').replace(/\n/g, ' '));
    const proveedor = escapeHtml(SELECTORS.proveedor.value || '');
    const rfc = escapeHtml(SELECTORS.rfc.value || '');

    const rowTemplate = (p) => {
      const importe = (p.cant * p.factor * p.punit) - p.descAmt;
      return `
<tr valign="top" style="height:18px">
<td></td>
<td colspan="2" style="text-indent: 0px;  vertical-align: middle;text-align: right;">
<span style="font-family: Lucida Sans; color: #000000; font-size: 8px; line-height: 1.1635742;">${escapeHtml(Number(p.cant).toFixed(1))}</span></td>
<td colspan="4" style="text-indent: 0px;  vertical-align: middle;text-align: center;">
<span style="font-family: Lucida Sans; color: #000000; font-size: 7px; line-height: 0.7;">${escapeHtml(p.uni)}<br/>${escapeHtml(Number(p.factor).toFixed(3))}</span></td>
<td colspan="6" style="text-indent: 0px;  vertical-align: middle;text-align: left;">
<span style="font-family: Lucida Sans; color: #000000; font-size: 8px; line-height: 1.1635742;">${escapeHtml(p.desc)}</span></td>
<td colspan="5" style="text-indent: 0px;  vertical-align: middle;text-align: right;">
<span style="font-family: Lucida Sans; color: #000000; font-size: 8px; line-height: 1.1635742;">${money6(p.punit)}</span></td>
<td colspan="6" style="text-indent: 0px;  vertical-align: middle;text-align: right;">
<span style="font-family: Lucida Sans; color: #000000; font-size: 8px; line-height: 1.1635742;">${money6(p.descAmt)}</span></td>
<td colspan="3" style="text-indent: 0px;  vertical-align: middle;text-align: right;">
<span style="font-family: Lucida Sans; color: #000000; font-size: 8px; line-height: 1.1635742;">${money2(importe)}</span></td>
<td></td>
</tr>`;
    };

    const separatorRow = `
<tr valign="top" style="height:1px">
<td></td>
<td colspan="26" style="border-top: 1px solid #D0D0D0; "></td>
<td></td>
</tr>`;

    const renderedProducts = productos.map((p, index) => `${rowTemplate(p)}${index < productos.length - 1 ? separatorRow : ''}`).join('');

    let tpl = templateHtml;
    tpl = tpl.replace(/<img src="[^"]*(?:img_0_0_0\.(?:jpg|jpeg|png|gif)|img_logo\.png|LOGO\.jpg|logo\.jpg|logo\.svg)"[^>]*>/i, '__LOGO_PLACEHOLDER__');
    tpl = tpl.replace('GRUPO CRISTALERO DEL SURESTE', proveedor || '');
    tpl = tpl.replace('GCS0705287R9', rfc || '');
    tpl = tpl.replace('REEMBOLSO MAFAN T. KONFIO, ENTRADA PARA WOONKIE 27 DE FEBERO Y ANTOJERIA MAF-VHSA0006 20/05/2026', comentario || '');
    if (fechaCorta) tpl = tpl.replace('20/05/2026', fechaCorta);
    if (fechaLarga) tpl = tpl.replace('VILLAHERMOSA, TABASCO, a 20 de mayo de 2026', fechaLarga);

    const productStart = tpl.indexOf('<tr valign="top" style="height:18px">');
    const totalsStart = tpl.indexOf('<tr valign="top" style="height:357px">');
    if (productStart !== -1 && totalsStart !== -1 && totalsStart > productStart) {
      tpl = tpl.slice(0, productStart) + renderedProducts + tpl.slice(totalsStart);
    }

    tpl = tpl.replace(/(<td colspan="4" style="border-top: 1px solid #D0D0D0; border-bottom: 1px solid #D0D0D0; text-indent: 0px;  vertical-align: middle;text-align: right;">\s*<span style="font-family: Lucida Sans; color: #000000; font-size: 9px; line-height: 1.1635742;">)\d+(<\/span>)/,
      `$1${productos.length}$2`);
    tpl = tpl.replace(/(<td colspan="4" style="border-top: 1px solid #D0D0D0; border-bottom: 1px solid #D0D0D0; text-indent: 0px;  vertical-align: middle;text-align: right;">\s*<span style="font-family: Lucida Sans; color: #000000; font-size: 9px; line-height: 1.1635742;">)\d+\.\d(<\/span>)/,
      `$1${totalUnidadesValor.toFixed(1)}$2`);
    tpl = tpl.replace(/(<td colspan="4" style="border-top: 1px solid #D0D0D0; border-bottom: 1px solid #D0D0D0; text-indent: 0px;  vertical-align: middle;text-align: right;">\s*<span style="font-family: Lucida Sans; color: #000000; font-size: 9px; line-height: 1.1635742;">)MXN(<\/span>)/,
      `$1MXN$2`);
    tpl = tpl.replace(/(<td colspan="4" style="border-top: 1px solid #D0D0D0; border-bottom: 1px solid #D0D0D0; text-indent: 0px;  vertical-align: middle;text-align: right;">\s*<span style="font-family: Lucida Sans; color: #000000; font-size: 9px; line-height: 1.1635742;">)1\.000000(<\/span>)/,
      `$1${1.000000.toFixed(6)}$2`);
    tpl = tpl.replace(/(<td colspan="4" style="border-top: 1px solid #D0D0D0; border-bottom: 1px solid #D0D0D0; text-indent: 0px;  vertical-align: middle;text-align: right;">\s*<span style="font-family: Lucida Sans; color: #000000; font-size: 9px; line-height: 1.1635742;">)\$ 1,375\.00(<\/span>)/,
      `$1${money2(subtotalValor)}$2`);
    tpl = tpl.replace(/(<td colspan="4" style="border-top: 1px solid #D0D0D0; border-bottom: 1px solid #D0D0D0; text-indent: 0px;  vertical-align: middle;text-align: right;">\s*<span style="font-family: Lucida Sans; color: #000000; font-size: 9px; line-height: 1.1635742;">)\$ 0\.00(<\/span>)/,
      `$1${money2(descuentoValor)}$2`);
    tpl = tpl.replace(/(<td colspan="4" style="border-top: 1px solid #D0D0D0; border-bottom: 1px solid #D0D0D0; text-indent: 0px;  vertical-align: middle;text-align: right;">\s*<span style="font-family: Lucida Sans; color: #000000; font-size: 9px; line-height: 1.1635742;">)\$ 220\.00(<\/span>)/,
      `$1${money2(ivaValor)}$2`);
    tpl = tpl.replace(/(<td colspan="4" style="border-top: 1px solid #D0D0D0; border-bottom: 1px solid #D0D0D0; text-indent: 0px;  vertical-align: middle;text-align: right;">\s*<span style="font-family: Lucida Sans; color: #000000; font-size: 9px; line-height: 1.1635742;">)\$ 1,595\.00(<\/span>)/,
      `$1${money2(totalValor)}$2`);

    return tpl;
  }

  function renderPrintable(mode){
    const templatePath = 'PLANTILLA/PLANTILLA.html';
    const loadTemplate = () => fetch(templatePath).then((response) => {
      if (!response.ok) throw new Error('No se pudo cargar la plantilla de impresión');
      return response.text();
    });

    Promise.all([loadTemplate(), fetchAsDataUri('PLANTILLA/LOGO.jpg')]).then(([templateHtml, logoDataUri]) => {
      const tpl = buildPrintableHtml(templateHtml).replace('__LOGO_PLACEHOLDER__', '<img src="' + logoDataUri + '" style="height: 90px; display:block; margin-top:0;" alt="EHMO"/>');

      if (mode === 'print') {
        const win = window.open('', '_blank', 'width=900,height=1200');
        if (!win) {
          alert('El navegador bloqueó la ventana de impresión.');
          return;
        }
        win.document.open();
        win.document.write(tpl);
        win.document.close();
        setTimeout(() => {
          win.focus();
          win.print();
        }, 600);
        return;
      }

      const popup = document.createElement('div');
      popup.style.position = 'fixed';
      popup.style.left = '-10000px';
      popup.style.top = '0';
      popup.style.width = '612px';
      popup.style.background = 'white';
      popup.style.display = 'block';
      popup.innerHTML = tpl;
      document.body.appendChild(popup);

      const options = {
        margin: 0,
        filename: (SELECTORS.folio.value || 'entrada') + '.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
        jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
      };

      html2pdf().set(options).from(popup).save().finally(() => popup.remove());
    }).catch(() => {
      const fallbackTemplate = `<!doctype html><html><head><meta charset="utf-8"><title>Impresión</title></head><body>${document.getElementById('document').outerHTML}</body></html>`;
      if (mode === 'print') {
        const win = window.open('', '_blank', 'width=900,height=1200');
        if (!win) {
          alert('El navegador bloqueó la ventana de impresión.');
          return;
        }
        win.document.open();
        win.document.write(fallbackTemplate);
        win.document.close();
        setTimeout(() => {
          win.focus();
          win.print();
        }, 600);
        return;
      }
      const options = {
        margin: 0.5,
        filename: (SELECTORS.folio.value || 'entrada') + '.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, backgroundColor: '#ffffff' },
        jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
      };
      html2pdf().set(options).from(fallback).save();
    });
  }

  function exportPDF(){ renderPrintable('pdf'); }

  function printDoc(){ renderPrintable('print'); }

  // wire events
  SELECTORS.addRow.addEventListener('click', ()=>createRow());
  SELECTORS.btnSave.addEventListener('click', saveSession);
  SELECTORS.btnLoad.addEventListener('click', loadSession);
  SELECTORS.btnLoadTemplate.addEventListener('click', ()=>{
    const v = SELECTORS.templateSelect.value;
    if(!v){ alert('Selecciona una plantilla'); return; }
    fetch(v).then(r=>r.json()).then(data=>{
      SELECTORS.folio.value = data.folio||'';
      SELECTORS.proveedor.value = data.proveedor||'';
      SELECTORS.rfc.value = data.rfc||'';
      SELECTORS.fecha.value = data.fecha||'';
      SELECTORS.comentario.value = data.comentario||'';
      SELECTORS.tabla.innerHTML = '';
      (data.productos||[]).forEach(p=>createRow(p));
      updateAll();
    }).catch(e=>{ alert('No se pudo cargar la plantilla: '+e.message); });
  });
  SELECTORS.btnClear.addEventListener('click', clearAll);
  SELECTORS.btnExport.addEventListener('click', exportPDF);
  SELECTORS.btnPrint.addEventListener('click', printDoc);

  // auto-load from storage if present
  document.addEventListener('DOMContentLoaded', ()=>{
    try{ const raw = localStorage.getItem(STORAGE_KEY); if(raw){ if(confirm('Cargar sesión previa guardada?')) loadSession(); }
    }catch(e){}
    // start with one empty row
    if(SELECTORS.tabla.children.length===0) createRow();
  });

})();
