import { describe, it, expect } from 'vitest';
import { calculatePageMapping } from './pdfProcessor.js';

describe('calculatePageMapping', () => {
  it('右開き(縦書き)の場合、正しいページマッピングが生成されること', () => {
    // 4枚のシート = 合計8ページ
    const mapping = calculatePageMapping(4, true);
    
    expect(mapping.length).toBe(8);
    
    // 1ページ目 (index 0) は シート0 の 右半分
    expect(mapping[0]).toEqual({ sheetIndex: 0, isLeftHalf: false });
    // 2ページ目 (index 1) は シート1 の 右半分
    expect(mapping[1]).toEqual({ sheetIndex: 1, isLeftHalf: false });
    // 3ページ目 (index 2) は シート2 の 右半分
    expect(mapping[2]).toEqual({ sheetIndex: 2, isLeftHalf: false });
    // 4ページ目 (index 3) は シート3 の 右半分
    expect(mapping[3]).toEqual({ sheetIndex: 3, isLeftHalf: false });
    
    // 5ページ目 (index 4) は シート3 の 左半分
    expect(mapping[4]).toEqual({ sheetIndex: 3, isLeftHalf: true });
    // 8ページ目 (index 7) は シート0 の 左半分
    expect(mapping[7]).toEqual({ sheetIndex: 0, isLeftHalf: true });
  });
  
  it('左開き(横書き)の場合、正しいページマッピングが生成されること', () => {
    const mapping = calculatePageMapping(4, false);
    
    expect(mapping.length).toBe(8);
    
    // 1ページ目 (index 0) は シート0 の 左半分
    expect(mapping[0]).toEqual({ sheetIndex: 0, isLeftHalf: true });
    // 2ページ目 (index 1) は シート1 の 左半分
    expect(mapping[1]).toEqual({ sheetIndex: 1, isLeftHalf: true });
    
    // 8ページ目 (index 7) は シート0 の 右半分
    expect(mapping[7]).toEqual({ sheetIndex: 0, isLeftHalf: false });
  });
});
