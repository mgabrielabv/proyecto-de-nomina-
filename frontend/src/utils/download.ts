export interface ArchivoBase64 {
  nombreArchivo: string;
  contenidoBase64: string;
  mimeType?: string;
}

// El backend arma el archivo y lo entrega en base64 dentro del sobre de
// /execute; el navegador solo lo convierte a Blob y dispara la descarga. El
// object URL se libera al final para no retener memoria en descargas repetidas.
export function descargarArchivoBase64({
  nombreArchivo,
  contenidoBase64,
  mimeType = 'application/octet-stream',
}: ArchivoBase64): void {
  const binario = atob(contenidoBase64);
  const bytes = new Uint8Array(binario.length);
  for (let i = 0; i < binario.length; i += 1) {
    bytes[i] = binario.charCodeAt(i);
  }

  const blob = new Blob([bytes], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = nombreArchivo;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  URL.revokeObjectURL(url);
}

export function descargarPdfBase64(archivo: ArchivoBase64): void {
  descargarArchivoBase64({ ...archivo, mimeType: archivo.mimeType ?? 'application/pdf' });
}
