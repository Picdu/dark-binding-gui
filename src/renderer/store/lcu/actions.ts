// Minimal action creators (replaced typesafe-actions 3.x, which is ESM-only in v5).

export const up = (payload: LCUState) => ({
  type: '@@lcu/up' as const,
  payload,
});

(up as any).getType = () => '@@lcu/up';

export const down = () => ({
  type: '@@lcu/down' as const,
});

(down as any).getType = () => '@@lcu/down';
