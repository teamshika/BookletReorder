import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export async function initViewer(pdfBytes, canvas, rotation) {
  // pdfjs-dist のワーカーがバッファを消費してしまうのを防ぐためスライス(コピー)を渡す
  const loadingTask = pdfjsLib.getDocument({ data: pdfBytes.slice(0) });
  const pdf = await loadingTask.promise;
  const page = await pdf.getPage(1);
  
  // ページの元々の回転角度 (page.rotate) に UIで追加指定された回転角度 (rotation) を加算
  const totalRotation = ((page.rotate || 0) + rotation) % 360;
  
  const viewport = page.getViewport({ scale: 1.0, rotation: totalRotation });
  
  // Scale down if it's too large for the screen
  const MAX_WIDTH = 600;
  let scale = 1.0;
  if (viewport.width > MAX_WIDTH) {
    scale = MAX_WIDTH / viewport.width;
  }
  
  const scaledViewport = page.getViewport({ scale: scale, rotation: totalRotation });
  
  const ctx = canvas.getContext('2d');
  canvas.width = scaledViewport.width;
  canvas.height = scaledViewport.height;
  
  const renderContext = {
    canvasContext: ctx,
    viewport: scaledViewport
  };
  
  await page.render(renderContext).promise;
}
