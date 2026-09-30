/**
 * 编辑器公共工具：撤销/重做钩子 + 内联图标集合。
 * v3.5：从 BlockEditor.tsx 拆出。
 */
import { useRef, useState } from 'react';

/* ================= 撤销/重做钩子 ================= */

export function useHistory<T>(initial: T) {
  const [state, setState] = useState<T>(initial);
  const past = useRef<T[]>([]);
  const future = useRef<T[]>([]);

  const set = (next: T | ((s: T) => T), record = true) => {
    setState((cur) => {
      const val = typeof next === 'function' ? (next as (s: T) => T)(cur) : next;
      if (record) {
        past.current = [...past.current.slice(-49), cur];
        future.current = [];
      }
      return val;
    });
  };

  const undo = () => {
    if (!past.current.length) return;
    const prev = past.current[past.current.length - 1];
    past.current = past.current.slice(0, -1);
    future.current = [...future.current, state];
    setState(prev);
  };

  const redo = () => {
    if (!future.current.length) return;
    const next = future.current[future.current.length - 1];
    future.current = future.current.slice(0, -1);
    past.current = [...past.current, state];
    setState(next);
  };

  const canUndo = past.current.length > 0;
  const canRedo = future.current.length > 0;
  return { state, setState, set, undo, redo, canUndo, canRedo };
}

/* ================= 图标（内联 SVG） ================= */

export const Icon = {
  back: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>,
  undo: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/></svg>,
  redo: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 14 5-5-5-5"/><path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H13"/></svg>,
  desktop: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="12" x="3" y="4" rx="2"/><path d="M12 16v4M8 20h8"/></svg>,
  tablet: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect width="16" height="20" x="4" y="2" rx="2"/><path d="M12 18h.01"/></svg>,
  phone: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect width="10" height="20" x="7" y="2" rx="2.5"/><path d="M11 18h2"/></svg>,
  eye: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>,
  eyeOff: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c6.5 0 10 8 10 8a13.2 13.2 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.5 13.5 0 0 0 2 12s3.5 8 10 8a9.7 9.7 0 0 0 5.39-1.61"/><path d="M14.12 14.12a3 3 0 1 1-4.24-4.24M2 2l20 20"/></svg>,
  copy: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>,
  trash: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>,
  grip: <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="6" r="1.4"/><circle cx="9" cy="12" r="1.4"/><circle cx="9" cy="18" r="1.4"/><circle cx="15" cy="6" r="1.4"/><circle cx="15" cy="12" r="1.4"/><circle cx="15" cy="18" r="1.4"/></svg>,
  up: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>,
  down: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>,
  plus: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5v14"/></svg>,
  check: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>,
};
