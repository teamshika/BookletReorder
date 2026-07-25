import { PDFDocument, degrees } from 'pdf-lib';

export function calculatePageMapping(sheetCount, isRightToLeft) {
  const totalPages = sheetCount * 2;
  const mapping = [];
  
  for (let k = 0; k < totalPages; k++) {
    // 両面スキャン（ADF）の場合、裏返すたびに左右が逆転するため交互になる
    let sheetIndex = k < sheetCount ? k : totalPages - 1 - k;
    let isLeftHalf = (k % 2 === 0) ? !isRightToLeft : isRightToLeft;
    
    mapping.push({ sheetIndex, isLeftHalf });
  }
  
  return mapping;
}

export async function processPdf(pdfBytes, rotationAngle, isRightToLeft) {
  const doc = await PDFDocument.load(pdfBytes);
  const sheetCount = doc.getPageCount();
  const totalPages = sheetCount * 2;
  
  const newDoc = await PDFDocument.create();
  const mapping = calculatePageMapping(sheetCount, isRightToLeft);
  
  for (let k = 0; k < totalPages; k++) {
    const { sheetIndex, isLeftHalf } = mapping[k];
    
    const srcPage = doc.getPage(sheetIndex);
    const baseRotation = srcPage.getRotation().angle || 0; // PDF本来の回転角度 (0, 90, 180, 270)
    
    const [embeddedPage] = await newDoc.embedPdf(doc, [sheetIndex]);
    const W = embeddedPage.width;
    const H = embeddedPage.height;
    
    // 1. PDF本来の回転 (baseRotation) を適用した後の視覚的な見開き寸法
    const isBaseSideways = baseRotation === 90 || baseRotation === 270;
    const sheetVisW = isBaseSideways ? H : W;
    const sheetVisH = isBaseSideways ? W : H;
    
    // 2. 視覚的な1ページ分の寸法（見開き幅の半分）
    const pageVisW = sheetVisW / 2;
    const pageVisH = sheetVisH;
    
    // 3. ユーザーが画面で追加指定した回転 (rotationAngle: CW) を適用した最終出力寸法
    const isUserSideways = rotationAngle === 90 || rotationAngle === 270;
    const outW = isUserSideways ? pageVisH : pageVisW;
    const outH = isUserSideways ? pageVisW : pageVisH;
    
    const newPage = newDoc.addPage([outW, outH]);
    
    // 4. ベース回転に応じて、生データ (px, py) 上で抽出する範囲を決定
    let pxMin = 0, pxMax = W;
    let pyMin = 0, pyMax = H;
    
    if (baseRotation === 0) {
      if (isLeftHalf) { pxMin = 0; pxMax = W / 2; }
      else            { pxMin = W / 2; pxMax = W; }
    } else if (baseRotation === 90) {
      if (isLeftHalf) { pyMin = 0; pyMax = H / 2; }
      else            { pyMin = H / 2; pyMax = H; }
    } else if (baseRotation === 180) {
      if (isLeftHalf) { pxMin = W / 2; pxMax = W; }
      else            { pxMin = 0; pxMax = W / 2; }
    } else if (baseRotation === 270) {
      if (isLeftHalf) { pyMin = H / 2; pyMax = H; }
      else            { pyMin = 0; pyMax = H / 2; }
    }
    
    // 5. 合計回転角度 (CW) と pdf-lib 用の反時計回り角度 (CCW)
    const totalCwRotation = (baseRotation + rotationAngle) % 360;
    const ccwAngle = (360 - totalCwRotation) % 360;
    
    // 6. ccwAngle に応じて (pxMin..pxMax, pyMin..pyMax) が newPage (0..outW, 0..outH) に収まるオフセットを計算
    let xOff = 0, yOff = 0;
    if (ccwAngle === 0) {
      xOff = -pxMin;
      yOff = -pyMin;
    } else if (ccwAngle === 90) {
      xOff = pyMax;
      yOff = -pxMin;
    } else if (ccwAngle === 180) {
      xOff = pxMax;
      yOff = pyMax;
    } else if (ccwAngle === 270) {
      xOff = -pyMin;
      yOff = pxMax;
    }
    
    newPage.drawPage(embeddedPage, {
      x: xOff,
      y: yOff,
      xScale: 1,
      yScale: 1,
      rotate: degrees(ccwAngle),
      opacity: 1,
    });
  }
  
  return await newDoc.save();
}
