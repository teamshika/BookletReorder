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
    
    const [embeddedPage] = await newDoc.embedPdf(doc, [sheetIndex]);
    
    const W = embeddedPage.width;
    const H = embeddedPage.height;
    
    // pdf.js（プレビュー）は時計回り(CW)、pdf-lib は反時計回り(CCW) なので変換
    const ccwAngle = (360 - rotationAngle) % 360;
    
    // スキャンページは常に「左右に分割」する。
    // 回転は出力ページの向きを決めるだけで、分割軸は変わらない。
    const halfW = W / 2;
    
    // 出力ページのサイズ（回転後の1ページ分）
    let outW, outH;
    if (ccwAngle === 90 || ccwAngle === 270) {
      outW = H;       // 回転後の幅 = 元の高さ
      outH = halfW;   // 回転後の高さ = 元の半幅
    } else {
      outW = halfW;
      outH = H;
    }
    
    const newPage = newDoc.addPage([outW, outH]);
    
    // 埋め込みページの描画位置を計算
    // 各角度で、左半分・右半分が出力ページ内に収まる (x, y) を求める
    // 回転変換: CCW=0°: (px,py)→(px,py)
    //           CCW=90°: (px,py)→(x-py, y+px)
    //           CCW=180°: (px,py)→(x-px, y-py)
    //           CCW=270°: (px,py)→(x+py, y-px)
    let xOff, yOff;
    
    if (ccwAngle === 0) {
      // 左半分: px∈[0,W/2] → target_x=px∈[0,W/2] ✓
      // 右半分: px∈[W/2,W] → shift by -W/2
      xOff = 0;
      yOff = 0;
      if (!isLeftHalf) xOff = -halfW;
      
    } else if (ccwAngle === 90) {
      // target_x = x - py, target_y = y + px
      // 左半分: y=0 で target_y=px∈[0,W/2]✓, x=H で target_x=H-py∈[0,H]✓
      // 右半分: y=-W/2 で target_y=px-W/2∈[0,W/2]✓
      xOff = H;
      yOff = 0;
      if (!isLeftHalf) yOff = -halfW;
      
    } else if (ccwAngle === 180) {
      // target_x = x - px, target_y = y - py
      // 左半分: x=W/2 で target_x=W/2-px∈[0,W/2]✓, y=H で target_y=H-py∈[0,H]✓
      // 右半分: x=W で target_x=W-px∈[0,W/2] (px∈[W/2,W]) ✓
      xOff = halfW;
      yOff = H;
      if (!isLeftHalf) xOff = W;
      
    } else { // ccwAngle === 270
      // target_x = x + py, target_y = y - px
      // 左半分: y=W/2 で target_y=W/2-px∈[0,W/2]✓, x=0 で target_x=py∈[0,H]✓
      // 右半分: y=W で target_y=W-px∈[0,W/2] (px∈[W/2,W]) ✓
      xOff = 0;
      yOff = halfW;
      if (!isLeftHalf) yOff = W;
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
