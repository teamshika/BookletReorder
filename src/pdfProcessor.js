import { PDFDocument, degrees } from 'pdf-lib';

export function calculatePageMapping(sheetCount, isRightToLeft) {
  const totalPages = sheetCount * 2;
  const mapping = [];
  
  for (let k = 0; k < totalPages; k++) {
    let sheetIndex;
    let isLeftHalf;
    
    if (k < sheetCount) {
      sheetIndex = k;
      isLeftHalf = isRightToLeft ? false : true;
    } else {
      sheetIndex = totalPages - 1 - k;
      isLeftHalf = isRightToLeft ? true : false;
    }
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
    
    let isRotated = rotationAngle === 90 || rotationAngle === 270;
    
    // The visual width of the full sheet after rotation
    const sheetWidth = isRotated ? originalHeight : originalWidth;
    const sheetHeight = isRotated ? originalWidth : originalHeight;
    
    // Final page is exactly half the sheet
    const pageWidth = sheetWidth / 2;
    const pageHeight = sheetHeight;
    
    const newPage = newDoc.addPage([pageWidth, pageHeight]);
    
    // We need to calculate drawing coordinates such that the correct half is visible
    // and the rotation is applied around the center.
    // For simplicity, pdf-lib's drawPage accepts rotation and x/y.
    // To crop the correct half, we position the embedded page appropriately.
    
    // Center point of the new page
    const centerX = pageWidth / 2;
    const centerY = pageHeight / 2;
    
    // X offset based on which half we want
    // If we want the left half of the sheet, the center of the sheet should be at (pageWidth, centerY)
    // If we want the right half, the center of the sheet should be at (0, centerY)
    const sheetCenterX = isLeftHalf ? pageWidth : 0;
    
    newPage.drawPage(embeddedPage, {
      x: sheetCenterX,
      y: centerY,
      xScale: 1,
      yScale: 1,
      rotate: degrees(rotationAngle),
      opacity: 1,
    });
  }
  
  return await newDoc.save();
}
