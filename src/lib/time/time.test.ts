import { describe, expect, it } from 'vitest';

import {
  formatDuration,
  formatMinutesToTime,
  getDurationMinutes,
  isAlignedToInterval,
  isValidTimeRange,
  parseTimeToMinutes,
} from './time';

describe('time utilities', () => {
  it('HH:mm 문자열을 분 단위 정수로 변환합니다', () => {
    expect(parseTimeToMinutes('09:30')).toBe(570);
    expect(parseTimeToMinutes('20:00')).toBe(1200);
  });

  it('분 단위 정수를 HH:mm 문자열로 변환합니다', () => {
    expect(formatMinutesToTime(570)).toBe('09:30');
    expect(formatMinutesToTime(1200)).toBe('20:00');
  });

  it('유효한 시간 범위를 판정합니다', () => {
    expect(isValidTimeRange(540, 570)).toBe(true);
    expect(isValidTimeRange(570, 570)).toBe(false);
    expect(isValidTimeRange(600, 570)).toBe(false);
  });

  it('시간 간격과 duration을 계산합니다', () => {
    expect(isAlignedToInterval(570, 30)).toBe(true);
    expect(isAlignedToInterval(575, 30)).toBe(false);
    expect(getDurationMinutes(540, 630)).toBe(90);
  });

  it('총 시간을 읽기 쉬운 문자열로 포맷합니다', () => {
    expect(formatDuration(30)).toBe('30m');
    expect(formatDuration(120)).toBe('2h');
    expect(formatDuration(150)).toBe('2h 30m');
  });
});
