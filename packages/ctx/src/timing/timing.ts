/* Copyright 2021, Milkdown by Mirone. */
import { ClockMap, Timer } from './clock';

export type Timing = {
    (): Promise<void>;
    done: () => void;
};

export const createTimer = (name: string, timeout = 3000): Timer => {
    const id = Symbol('Timer');

    const timer = (store: ClockMap) => {
        let promise: Promise<void> | null = null;
        let listener: EventListener;

        const data = Symbol(name);

        const timing: Timing = () =>
            (promise ??= new Promise((resolve, reject) => {
                listener = (e: Event) => {
                    if (!(e instanceof CustomEvent)) {
                        return;
                    }
                    if (e.detail.id === data) {
                        resolve();
                    }
                };
                setTimeout(() => {
                    reject(`Timing ${name} timeout.`);
                    removeEventListener(name, listener);
                }, timeout);
                addEventListener(name, listener, { once: true });
            }));
        timing.done = () => {
            const event = new CustomEvent(name, { detail: { id: data } });
            dispatchEvent(event);
        };

        store.set(id, timing);

        return timing;
    };
    timer.id = id;

    return timer;
};
