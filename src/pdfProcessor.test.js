import { describe, it, expect } from 'vitest';
import { calculatePageMapping } from './pdfProcessor.js';

describe('calculatePageMapping', () => {
  it('左開き(横書き)の場合、両面スキャンの正しいマッピングが生成されること', () => {
    // 4枚のシート = 合計8ページ, isRightToLeft = false
    const mapping = calculatePageMapping(4, false);
    expect(mapping.length).toBe(8);
    
    // Page 1: Sheet 0, Left
    expect(mapping[0]).toEqual({ sheetIndex: 0, isLeftHalf: true });
    // Page 2: Sheet 1, Right
    expect(mapping[1]).toEqual({ sheetIndex: 1, isLeftHalf: false });
    // Page 3: Sheet 2, Left
    expect(mapping[2]).toEqual({ sheetIndex: 2, isLeftHalf: true });
    // Page 4: Sheet 3, Right
    expect(mapping[3]).toEqual({ sheetIndex: 3, isLeftHalf: false });
    // Page 5: Sheet 3, Left
    expect(mapping[4]).toEqual({ sheetIndex: 3, isLeftHalf: true });
    // Page 8: Sheet 0, Right
    expect(mapping[7]).toEqual({ sheetIndex: 0, isLeftHalf: false });
  });

  it('右開き(縦書き)の場合、両面スキャンの正しいマッピングが生成されること', () => {
    // isRightToLeft = true
    const mapping = calculatePageMapping(4, true);
    
    // Page 1: Sheet 0, Right
    expect(mapping[0]).toEqual({ sheetIndex: 0, isLeftHalf: false });
    // Page 2: Sheet 1, Left
    expect(mapping[1]).toEqual({ sheetIndex: 1, isLeftHalf: true });
  });
});
