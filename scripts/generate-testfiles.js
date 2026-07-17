/**
 * テスト用PDF生成スクリプト
 * 中綴じ冊子（8ページ）をADF両面スキャンした状態のPDFを生成します
 * 
 * 生成されるページ構成（右開き・回転なし）:
 *   Sheet 0 表: [ 1 | 8 ]
 *   Sheet 0 裏: [ 7 | 2 ]  (裏返すと左右が反転)
 *   Sheet 1 表: [ 3 | 6 ]
 *   Sheet 1 裏: [ 5 | 4 ]
 */

import { PDFDocument, rgb, degrees } from 'pdf-lib';
import { writeFileSync, mkdirSync, existsSync } from 'fs';

const WIDTH = 1190;   // A4横 × 2 (見開き)
const HEIGHT = 842;   // A4縦

// 各シートの [左ページ番号, 右ページ番号]
const SHEETS = [
  [1, 8],  // Sheet 0 表
  [7, 2],  // Sheet 0 裏
  [3, 6],  // Sheet 1 表
  [5, 4],  // Sheet 1 裏
];

async function createTestPdf(sheets, filename, rotationDeg = 0) {
  const doc = await PDFDocument.create();

  for (const [leftNum, rightNum] of sheets) {
    let page;
    if (rotationDeg === 90 || rotationDeg === 270) {
      page = doc.addPage([HEIGHT, WIDTH]); // 縦長
    } else {
      page = doc.addPage([WIDTH, HEIGHT]); // 横長
    }

    const { width, height } = page.getSize();
    const mid = width / 2;
    const fontSize = 120;

    // 中央の仕切り線
    page.drawLine({
      start: { x: mid, y: 0 },
      end: { x: mid, y: height },
      thickness: 2,
      color: rgb(0.7, 0.7, 0.7),
    });

    // 左側のページ番号
    page.drawText(String(leftNum), {
      x: mid / 2 - 35,
      y: height / 2 - 60,
      size: fontSize,
      color: rgb(0.2, 0.2, 0.8),
      rotate: degrees(rotationDeg),
    });

    // 右側のページ番号
    page.drawText(String(rightNum), {
      x: mid + mid / 2 - 35,
      y: height / 2 - 60,
      size: fontSize,
      color: rgb(0.8, 0.2, 0.2),
      rotate: degrees(rotationDeg),
    });

    // ページ番号の説明テキスト
    page.drawText(`Sheet: L=${leftNum} / R=${rightNum}`, {
      x: 20,
      y: 20,
      size: 18,
      color: rgb(0.5, 0.5, 0.5),
    });
  }

  return await doc.save();
}

async function main() {
  if (!existsSync('testfiles')) mkdirSync('testfiles');

  // パターン1: 回転なし・右開き
  const pdf1 = await createTestPdf(SHEETS, 'testfile_norotation.pdf', 0);
  writeFileSync('testfiles/testfile_norotation.pdf', pdf1);
  console.log('生成: testfiles/testfile_norotation.pdf (回転なし・右開き用)');

  // パターン2: 90度CW回転（ユーザーのtestfile1.pdfと同じ状態）
  const pdf2 = await createTestPdf(SHEETS, 'testfile_rotate90.pdf', 90);
  writeFileSync('testfiles/testfile_rotate90.pdf', pdf2);
  console.log('生成: testfiles/testfile_rotate90.pdf (90度回転・アプリで左に90度回転して使用)');

  console.log('\n完了！testfiles フォルダ内のPDFをアプリでテストしてください。');
  console.log('期待する出力: 1→2→3→4→5→6→7→8 の順に並んだ単ページPDF');
}

main().catch(console.error);
