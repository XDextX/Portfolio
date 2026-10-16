import { vi } from 'vitest';

/** A sender that records every message and answers with the given status. */
export function recordingSender(status = 200) {
    const calls: { m: any; signal: AbortSignal }[] = [];
    const sender = async (m: any, signal: AbortSignal) => { calls.push({ m, signal }); return { status }; };
    return { sender, calls };
}

/** A sender that throws the given error. */
export function failingSender(error: unknown) {
    return async () => { throw error; };
}

/** A sender that never answers until its signal aborts, then rejects. */
export function hangingSender() {
    return (_m: any, signal: AbortSignal) => new Promise<{ status: number }>((_, reject) => {
        signal.addEventListener('abort', () => reject(new Error('aborted')));
    });
}

/**
 * A schedule the test fires by hand: `schedule(fn, ms)` stores `fn`, `fire()` runs it.
 * @returns the schedule, a fire switch and the delays it was asked for
 */
export function fakeSchedule() {
    const pending: (() => void)[] = [];
    const delays: number[] = [];
    const schedule = (fn: () => void, ms: number) => { pending.push(fn); delays.push(ms); return () => { pending.splice(pending.indexOf(fn), 1); }; };
    return { schedule, delays, fire: () => pending.splice(0).forEach((fn) => fn()) };
}

/**
 * Every console call while active, as one string per call.
 * @returns the captured lines and a restore switch
 */
export function captureConsole() {
    const lines: string[] = [];
    const spies = (['log', 'info', 'warn', 'error', 'debug'] as const).map((k) =>
        vi.spyOn(console, k).mockImplementation((...args: unknown[]) => { lines.push(args.map((a) => (a instanceof Error ? `${a.message} ${a.stack}` : typeof a === 'string' ? a : JSON.stringify(a))).join(' ')); }));
    return { lines, restore: () => spies.forEach((s) => s.mockRestore()) };
}
