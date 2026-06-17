export interface AudioNoteOnRequest {
    pitch: number;
    velocity: number;
    channel: number;
    delaySec?: number;
}

export interface AudioNoteOffRequest {
    voiceId: number;
    delaySec?: number;
}

// ---- implementation ----

interface ActiveVoice {
    oscillator: OscillatorNode;
    gain: GainNode;
}

const MIN_MIDI_NOTE = 0;
const MAX_MIDI_NOTE = 127;
const MIN_MIDI_VELOCITY = 0;
const MAX_MIDI_VELOCITY = 127;
const ATTACK_SEC = 0.005;
const RELEASE_SEC = 0.03;
const INVALID_VOICE_ID = -1;

function clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
}

function midiPitchToFrequency(pitch: number): number {
    const clippedPitch = clamp(pitch, MIN_MIDI_NOTE, MAX_MIDI_NOTE);
    return 440 * Math.pow(2, (clippedPitch - 69) / 12);
}

function velocityToGain(velocity: number): number {
    const clippedVelocity = clamp(velocity, MIN_MIDI_VELOCITY, MAX_MIDI_VELOCITY);
    const normalized = clippedVelocity / MAX_MIDI_VELOCITY;
    return normalized * normalized;
}


function sanitizeDelay(delaySec?: number): number {
    if (typeof delaySec !== "number" || !Number.isFinite(delaySec) || delaySec < 0) {
        return 0;
    }
    return delaySec;
}

export class AudioBackend {
    private audioContext: AudioContext | null = null;
    private masterGain: GainNode | null = null;
    private nextVoiceId = 1;
    private voices = new Map<number, ActiveVoice>();
    private hasWarnedNotInitialized = false;

    get isInitialized(): boolean {
        return this.audioContext !== null && this.masterGain !== null;
    }

    private warnNotInitialized(methodName: string): void {
        if (this.hasWarnedNotInitialized) {
            return;
        }

        this.hasWarnedNotInitialized = true;
        console.warn(
            "[AudioBackend] " + methodName + " called before initialize(). This call is ignored."
        );
    }

    async initialize(sampleRate?: number): Promise<void> {
        if (this.audioContext) {
            return;
        }

        const context = sampleRate
            ? new AudioContext({ sampleRate: sampleRate })
            : new AudioContext();
        const gain = context.createGain();
        gain.gain.value = 0.2;
        gain.connect(context.destination);

        this.audioContext = context;
        this.masterGain = gain;
    }

    async resume(): Promise<void> {
        if (!this.isInitialized) {
            this.warnNotInitialized("resume");
            return;
        }
        await this.audioContext!.resume();
    }

    async suspend(): Promise<void> {
        if (!this.isInitialized) {
            this.warnNotInitialized("suspend");
            return;
        }
        await this.audioContext!.suspend();
    }

    noteOn(request: AudioNoteOnRequest): number { // 戻り値は発音した音のID。noteOffする際に必要
        if (!this.isInitialized) {
            this.warnNotInitialized("noteOn");
            return INVALID_VOICE_ID;
        }
        const context = this.audioContext!;

        const oscillator = context.createOscillator();
        const gain = context.createGain();

        oscillator.type = "triangle";
        oscillator.frequency.setValueAtTime(
            midiPitchToFrequency(request.pitch),
            context.currentTime
        );

        const startAt = context.currentTime + sanitizeDelay(request.delaySec);
        const targetGain = velocityToGain(request.velocity);
        gain.gain.setValueAtTime(0, startAt);
        gain.gain.linearRampToValueAtTime(targetGain, startAt + ATTACK_SEC);

        oscillator.connect(gain);
        gain.connect(this.masterGain!);

        const voiceId = this.nextVoiceId++;
        this.voices.set(voiceId, {
            oscillator: oscillator,
            gain: gain,
        });

        oscillator.onended = () => {
            this.voices.delete(voiceId);
            oscillator.disconnect();
            gain.disconnect();
        };

        oscillator.start(startAt);
        return voiceId;
    }

    noteOff(request: AudioNoteOffRequest): void {
        if (!this.isInitialized) {
            this.warnNotInitialized("noteOff");
            return;
        }

        const voice = this.voices.get(request.voiceId);
        if (!voice) {
            return;
        }

        const context = this.audioContext!;
        const stopAt = context.currentTime + sanitizeDelay(request.delaySec);

        voice.gain.gain.cancelScheduledValues(stopAt);
        voice.gain.gain.setValueAtTime(0, stopAt);
        voice.oscillator.stop(stopAt + RELEASE_SEC);

        this.voices.delete(request.voiceId);
    }

    allNotesOff(delaySec?: number): void {
        if (!this.isInitialized) {
            this.warnNotInitialized("allNotesOff");
            return;
        }

        for (const voiceId of this.voices.keys()) {
            this.noteOff({ voiceId: voiceId, delaySec: delaySec });
        }
    }

    async dispose(): Promise<void> {
        if (!this.audioContext) {
            return;
        }

        this.allNotesOff(0);
        await this.audioContext.close();

        this.voices = new Map<number, ActiveVoice>();
        this.masterGain = null;
        this.audioContext = null;
        this.nextVoiceId = 1;
    }
}
