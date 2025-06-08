export const PRIORITY_CONFIG = {
  1: { name: 'Low', color: '#10B981', emoji: '⬇️' },
  2: { name: 'Medium', color: '#F59E0B', emoji: '➡️' },
  3: { name: 'High', color: '#EF4444', emoji: '⬆️' },
  4: { name: 'Critical', color: '#7C3AED', emoji: '🔥' }
} as const;

export type Priority = 1 | 2 | 3 | 4;
export type TaskStatus = 'todo' | 'in_progress' | 'done'; 