import { Pitch, PitchClass, Voicing } from "./chord-utils";
import { getColorScheme } from "./color-scheme";

type PianoKeyShape = {
    pitch: Pitch;
    pitchClass: PitchClass;
    x: number;
    y: number;
    width: number;
    height: number;
    isBlack: boolean;
};

type PianoLayout = {
    width: number;
    height: number;
    keyShapes: PianoKeyShape[];
};

const PITCHES_PER_OCTAVE = 12;
const WHITE_KEYS_PER_OCTAVE = 7;
const OCTAVE_PITCHES: PitchClass[] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const BLACK_PITCH_CLASSES: PitchClass[] = [1, 4, 6, 9, 11];
const offset1 = 0.1;
const offset2 = 0.1;
const KEY_CENTER_IN_WHITE_UNITS: number[] = [
    0,
    0.5 + offset1, // A#
    1,
    2,
    2.5 - offset2, // C#
    3,
    3.5 + offset2, // D#
    4,
    5,
    5.5 - offset1, // F#
    6,
    6.5 // G#
];

const BLACK_KEY_SET = new Set<PitchClass>(BLACK_PITCH_CLASSES);

function mod12(pitch: Pitch): PitchClass {
    return ((pitch % PITCHES_PER_OCTAVE) + PITCHES_PER_OCTAVE) % PITCHES_PER_OCTAVE;
}

function isBlackKey(pitchClass: PitchClass): boolean {
    return BLACK_KEY_SET.has(pitchClass);
}

function buildPianoLayout(startPitch: Pitch, octaveCount: number, width: number, height: number): PianoLayout {
    if (octaveCount <= 0) {
        throw new Error("octaveCount must be positive");
    }

    const whiteKeyCount = octaveCount * WHITE_KEYS_PER_OCTAVE;
    const whiteKeyWidth = width / whiteKeyCount;
    const blackKeyWidth = whiteKeyWidth * 0.62;
    const blackKeyHeight = height * 0.62;

    const whiteShapes: PianoKeyShape[] = [];
    const blackShapes: PianoKeyShape[] = [];

    for (let octave = 0; octave < octaveCount; octave += 1) {
        const octaveStartPitch = startPitch + octave * PITCHES_PER_OCTAVE;

        for (const pitchClass of OCTAVE_PITCHES) {
            const pitch = octaveStartPitch + pitchClass;
            const isBlack = isBlackKey(pitchClass);
            const centerInWhiteUnits = KEY_CENTER_IN_WHITE_UNITS[pitchClass];
            const centerX = (octave * WHITE_KEYS_PER_OCTAVE + centerInWhiteUnits) * whiteKeyWidth;
            const keyWidth = isBlack ? blackKeyWidth : whiteKeyWidth;
            const keyShape: PianoKeyShape = {
                pitch: pitch,
                pitchClass: pitchClass,
                x: centerX - keyWidth / 2,
                y: 0,
                width: keyWidth,
                height: isBlack ? blackKeyHeight : height,
                isBlack: isBlack,
            };

            if (isBlack) {
                blackShapes.push(keyShape);
                continue;
            }
            whiteShapes.push(keyShape);
        }
    }

    return {
        width: width,
        height: height,
        keyShapes: [...whiteShapes, ...blackShapes],
    };
}

function drawKeyShape(
    ctx: CanvasRenderingContext2D,
    keyShape: PianoKeyShape,
    hasActivePitch: boolean,
    hasActivePitchClass: boolean,
): void {
    const colorScheme = getColorScheme(keyShape.pitchClass, keyShape.isBlack);
    const fillColor = hasActivePitch
        ? colorScheme.activePitch
        : hasActivePitchClass
            ? colorScheme.activePitchClass
            : colorScheme.idle;

    ctx.beginPath();
    ctx.rect(keyShape.x, keyShape.y, keyShape.width, keyShape.height);
    ctx.fillStyle = fillColor;
    ctx.fill();

    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 1;
    ctx.stroke();
}

export class KeyboardCanvas {
    private readonly canvas: HTMLCanvasElement;
    private readonly ctx: CanvasRenderingContext2D;
    private readonly startPitch: Pitch;
    private readonly octaveCount: number;
    private currentVoicing: Voicing | null = null;
    private readonly resizeObserver: ResizeObserver;

    constructor(canvas: HTMLCanvasElement, startPitch: Pitch = 48, octaveCount: number = 3) {
        this.canvas = canvas;
        this.startPitch = startPitch;
        this.octaveCount = octaveCount;
        const context = canvas.getContext("2d");
        if (context === null) {
            throw new Error("failed to get 2d context for keyboard canvas");
        }
        this.ctx = context;
        this.resizeObserver = new ResizeObserver(() => {
            this.render();
        });
        this.resizeObserver.observe(this.canvas);
        this.render();
    }

    setVoicing(voicing: Voicing | null): void {
        this.currentVoicing = voicing;
        this.render();
    }

    dispose(): void {
        this.resizeObserver.disconnect();
    }

    private render(): void {
        const devicePixelRatio = window.devicePixelRatio || 1;
        const width = Math.max(1, Math.floor(this.canvas.clientWidth));
        const height = Math.max(1, Math.floor(this.canvas.clientHeight));

        this.canvas.width = Math.floor(width * devicePixelRatio);
        this.canvas.height = Math.floor(height * devicePixelRatio);

        this.ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
        this.ctx.clearRect(0, 0, width, height);

        const layout = buildPianoLayout(this.startPitch, this.octaveCount, width, height);
        const activePitches = new Set<number>((this.currentVoicing ?? []).map((pitch) => Math.round(pitch)));
        const activePitchClasses = new Set<PitchClass>((this.currentVoicing ?? []).map((pitch) => mod12(Math.round(pitch))));

        for (const keyShape of layout.keyShapes) {
            drawKeyShape(
                this.ctx,
                keyShape,
                activePitches.has(keyShape.pitch),
                activePitchClasses.has(keyShape.pitchClass),
            );
        }
    }
}