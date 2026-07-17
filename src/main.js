import './style.css';
import { initViewer } from './pdfViewer.js';
import { processPdf } from './pdfProcessor.js';

let currentPdfBytes = null;
let rotation = 0;
let isRightToLeft = true;

document.querySelector('#app').innerHTML = `
  <header>
    <h1>Booklet Reorder</h1>
    <p class="subtitle">中綴じスキャンPDFを正しいページ順に再配置します</p>
  </header>
  <main>
    <div id="step1" class="dropzone">
      <div class="drop-icon">📄</div>
      <h2>PDFファイルをドロップ</h2>
      <p>またはクリックして選択</p>
      <input type="file" id="fileInput" accept="application/pdf" class="hidden" />
    </div>

    <div id="step2" class="preview-container hidden">
      <p>上下の向きと開き方向を指定してください</p>
      
      <div class="canvas-wrapper">
        <canvas id="pdfPreview"></canvas>
      </div>

      <div class="controls">
        <div class="control-group">
          <span class="control-label">回転</span>
          <button id="rotateBtn" class="toggle-btn" style="background: rgba(139, 92, 246, 0.3); color: white; border: 1px solid rgba(139, 92, 246, 0.6); box-shadow: 0 0 10px rgba(139, 92, 246, 0.2);">🔄 90° 回転</button>
        </div>

        <div class="control-group">
          <span class="control-label">1ページ目の位置 (開き方向)</span>
          <div class="button-group">
            <button id="rightBtn" class="toggle-btn active">右 (右開き)</button>
            <button id="leftBtn" class="toggle-btn">左 (左開き)</button>
          </div>
        </div>
      </div>

      <button id="processBtn" class="btn-primary">再配置してダウンロード</button>
      <button id="cancelBtn" class="toggle-btn" style="margin-top: 1rem;">キャンセル</button>
    </div>
  </main>
`;

const step1 = document.getElementById('step1');
const step2 = document.getElementById('step2');
const fileInput = document.getElementById('fileInput');
const rotateBtn = document.getElementById('rotateBtn');
const rightBtn = document.getElementById('rightBtn');
const leftBtn = document.getElementById('leftBtn');
const processBtn = document.getElementById('processBtn');
const cancelBtn = document.getElementById('cancelBtn');

step1.addEventListener('click', () => fileInput.click());
step1.addEventListener('dragover', (e) => { e.preventDefault(); step1.classList.add('dragover'); });
step1.addEventListener('dragleave', () => step1.classList.remove('dragover'));
step1.addEventListener('drop', async (e) => {
  e.preventDefault();
  step1.classList.remove('dragover');
  if (e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]);
});
fileInput.addEventListener('change', (e) => {
  if (e.target.files.length) handleFile(e.target.files[0]);
});

async function handleFile(file) {
  if (file.type !== 'application/pdf') {
    alert('PDFファイルを選択してください');
    return;
  }
  const arrayBuffer = await file.arrayBuffer();
  currentPdfBytes = new Uint8Array(arrayBuffer);
  
  step1.classList.add('hidden');
  step2.classList.remove('hidden');
  
  await initViewer(currentPdfBytes, document.getElementById('pdfPreview'), rotation);
}

rotateBtn.addEventListener('click', async () => {
  rotation = (rotation + 90) % 360;
  await initViewer(currentPdfBytes, document.getElementById('pdfPreview'), rotation);
});

rightBtn.addEventListener('click', () => {
  isRightToLeft = true;
  rightBtn.classList.add('active');
  leftBtn.classList.remove('active');
});

leftBtn.addEventListener('click', () => {
  isRightToLeft = false;
  leftBtn.classList.add('active');
  rightBtn.classList.remove('active');
});

cancelBtn.addEventListener('click', () => {
  currentPdfBytes = null;
  rotation = 0;
  isRightToLeft = true;
  rightBtn.classList.add('active');
  leftBtn.classList.remove('active');
  step2.classList.add('hidden');
  step1.classList.remove('hidden');
  fileInput.value = '';
});

processBtn.addEventListener('click', async () => {
  processBtn.disabled = true;
  processBtn.textContent = '処理中...';
  try {
    const finalPdfBytes = await processPdf(currentPdfBytes, rotation, isRightToLeft);
    
    // ダウンロード処理
    const blob = new Blob([finalPdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'reordered_booklet.pdf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
  } catch (error) {
    alert('エラーが発生しました: ' + error.message);
  } finally {
    processBtn.disabled = false;
    processBtn.textContent = '再配置してダウンロード';
  }
});
