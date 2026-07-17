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
    
    // Embed the page from the original document
    const [embeddedPage] = await newDoc.embedPdf(doc, [sheetIndex]);
    
    // Apply user rotation to calculate final half-page dimensions
    // When drawing, we rotate the embedded page content
    const originalWidth = embeddedPage.width;
    const originalHeight = embeddedPage.height;
    
    // pdf.js (プレビュー) の回転は時計回り(CW)。pdf-lib は反時計回り(CCW)。
    // プレビューと一致させるため、CWの角度をCCWに変換する
    const ccwAngle = (360 - rotationAngle) % 360;
    
    const isSideways = ccwAngle === 90 || ccwAngle === 270;
    const sheetWidth = isSideways ? originalHeight : originalWidth;
    const sheetHeight = isSideways ? originalWidth : originalHeight;
    
    const pageWidth = sheetWidth / 2;
    const pageHeight = sheetHeight;
    
    const newPage = newDoc.addPage([pageWidth, pageHeight]);
    
    let xOffset = 0;
    let yOffset = 0;

    if (ccwAngle === 0) {
      xOffset = 0;
      yOffset = 0;
    } else if (ccwAngle === 90) {
      xOffset = originalHeight;
      yOffset = 0;
    } else if (ccwAngle === 180) {
      xOffset = originalWidth;
      yOffset = originalHeight;
    } else if (ccwAngle === 270) {
      xOffset = 0;
      yOffset = originalWidth;
    }

    // 左半分のページを取得するか、右半分のページを取得するかでX座標をシフト
    if (!isLeftHalf) {
      xOffset -= pageWidth;
    }
    
    newPage.drawPage(embeddedPage, {
      x: xOffset,
      y: yOffset,
      xScale: 1,
      yScale: 1,
      rotate: degrees(ccwAngle),
      opacity: 1,
    });
  }
  
  return await newDoc.save();
}
