import { beforeEach, describe, expect, it } from 'vitest';
import { getOrCreateSessionId } from './session';

describe('getOrCreateSessionId', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('localStorage boşsa yeni bir id üretip saklar', () => {
    const id = getOrCreateSessionId();
    expect(id).toBeTruthy();
    expect(localStorage.getItem('struva_session_id')).toBe(id);
  });

  it('var olan idyi tekrar üretmeden döner', () => {
    const first = getOrCreateSessionId();
    const second = getOrCreateSessionId();
    expect(second).toBe(first);
  });

  it('localStorage üzerindeki mevcut değeri korur', () => {
    localStorage.setItem('struva_session_id', 'onceden-var-olan-id');
    expect(getOrCreateSessionId()).toBe('onceden-var-olan-id');
  });
});
