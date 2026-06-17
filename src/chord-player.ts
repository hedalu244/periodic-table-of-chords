import { AudioBackend } from "./audio-backend";
import { Voicing } from "./chord-utils";

export type ArpeggioType =
    | "up-once"
    | "down-once"
    | "up-loop"
    | "down-loop"
    | "none";

export interface ArpeggioParams {
    type: ArpeggioType;
    noteOffsetMs: number;
}

interface ActiveVoiceState {
    voiceId: number;
    timeoutId: number | null;
}

const DEFAULT_VELOCITY = 100;
const DEFAULT_CHANNEL = 0;
const LOOP_TICK_MS = 20;

function validateVoicing(voicing: Voicing): void {
    if (voicing.length === 0) {
        throw new Error("voicing must not be empty");
    }
    for (const pitch of voicing) {
        if (!Number.isFinite(pitch)) {
            throw new Error("voicing must contain finite pitches");
        }
    }
}

function getArpeggioOrder(type: ArpeggioType, voicing: Voicing): Voicing {
    if (type === "down-once" || type === "down-loop") {
        return [...voicing].reverse();
    }
    return [...voicing];
}

function isLoopArpeggio(type: ArpeggioType): boolean {
    return type === "up-loop" || type === "down-loop";
}

function isOnceArpeggio(type: ArpeggioType): boolean {
    return type === "up-once" || type === "down-once";
}

function validateArpeggio(arpeggio: ArpeggioParams): void {
    if (!Number.isFinite(arpeggio.noteOffsetMs) || arpeggio.noteOffsetMs < 0) {
        throw new Error("arpeggio.noteOffsetMs must be a non-negative finite number");
    }
}

export class ChordPlayer {
    private readonly backend: AudioBackend;
    private readonly activeVoices = new Map<number, ActiveVoiceState>();
    private timerId: number | null = null;
    private currentVoicing: Voicing | null = null;
    private arpeggio: ArpeggioParams = { type: "none", noteOffsetMs: 170 };
    private stepIndex = 0;
    private nextStepAtMs = 0;

    constructor(backend: AudioBackend) {
        this.backend = backend;
    }

    play(voicing: Voicing, arpeggio: ArpeggioParams): void {
        validateVoicing(voicing);
        validateArpeggio(arpeggio);
        this.stop();

        this.currentVoicing = [...voicing];
        this.arpeggio = arpeggio;

        if (arpeggio.type === "none") {
            this.playChord(voicing);
            return;
        }

        this.stepIndex = 0;
        this.nextStepAtMs = performance.now();
        this.timerId = window.setInterval(() => {
            this.tickArpeggio();
        }, LOOP_TICK_MS);
    }

    stop(): void {
        if (this.timerId !== null) {
            window.clearInterval(this.timerId);
            this.timerId = null;
        }

        for (const state of this.activeVoices.values()) {
            if (state.timeoutId !== null) {
                window.clearTimeout(state.timeoutId);
            }
            this.backend.noteOff({ voiceId: state.voiceId });
        }

        this.activeVoices.clear();
        this.currentVoicing = null;
        this.stepIndex = 0;
        this.nextStepAtMs = 0;
    }

    private playChord(voicing: Voicing): void {
        for (const pitch of voicing) {
            const voiceId = this.backend.noteOn({
                pitch: pitch,
                velocity: DEFAULT_VELOCITY,
                channel: DEFAULT_CHANNEL,
            });
            this.activeVoices.set(voiceId, { voiceId: voiceId, timeoutId: null });
        }
    }

    private tickArpeggio(): void {
        if (!this.currentVoicing) {
            return;
        }

        const nowMs = performance.now();
        if (nowMs < this.nextStepAtMs) {
            return;
        }
        this.nextStepAtMs += this.arpeggio.noteOffsetMs;

        const order = getArpeggioOrder(this.arpeggio.type, this.currentVoicing);
        const pitch = order[this.stepIndex];
        const shouldSustain = isOnceArpeggio(this.arpeggio.type);
        this.playArpeggioNote(pitch, shouldSustain, this.arpeggio.noteOffsetMs);

        this.stepIndex += 1;
        if (this.stepIndex < order.length) {
            return;
        }

        if (isLoopArpeggio(this.arpeggio.type)) {
            this.stepIndex = 0;
            return;
        }

        if (isOnceArpeggio(this.arpeggio.type) && this.timerId !== null) {
            window.clearInterval(this.timerId);
            this.timerId = null;
        }
    }

    private playArpeggioNote(pitch: number, shouldSustain: boolean, lengthMs: number): void {
        const voiceId = this.backend.noteOn({
            pitch: pitch,
            velocity: DEFAULT_VELOCITY,
            channel: DEFAULT_CHANNEL,
        });

        const timeoutId = shouldSustain ? null
            : window.setTimeout(() => {
                this.backend.noteOff({ voiceId: voiceId });
                this.activeVoices.delete(voiceId);
            }, lengthMs);

        this.activeVoices.set(voiceId, {
            voiceId: voiceId,
            timeoutId: timeoutId,
        });
    }
}
