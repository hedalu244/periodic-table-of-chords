import { Pitch, PitchClass, Voicing } from "./chord-utils";
import { getColorScheme } from "./color-scheme";

type WhisqKeyShape = {
    pitch: Pitch;
    pitchClass: PitchClass;
    x: number;
    y: number;
    size: number;
};

type WhisqLayout = {
    keyShapes: WhisqKeyShape[];
};

const PITCHES_PER_OCTAVE = 12;
const FOURTH_INTERVAL = 5;
const WHOLE_TONE_INTERVAL = 2;

function mod12(pitch: Pitch): PitchClass {
    return ((pitch % PITCHES_PER_OCTAVE) + PITCHES_PER_OCTAVE) % PITCHES_PER_OCTAVE;
}

function buildWhisqLayout(
    gridSize: number,
    width: number,
    height: number,
    pitchOffset: Pitch,
): WhisqLayout {
    if (gridSize <= 0) {
        throw new Error("gridSize must be positive");
    }

    const keySize = Math.min(width, height) / gridSize;
    const offsetX = (width - keySize * gridSize) / 2;
    const offsetY = (height - keySize * gridSize) / 2;
    const keyShapes: WhisqKeyShape[] = [];

    for (let i = 0; i < gridSize; i += 1) {
        for (let j = 0; j < gridSize; j += 1) {
            const pitch = pitchOffset + i * FOURTH_INTERVAL + j * WHOLE_TONE_INTERVAL;
            const pitchClass = mod12(pitch);
            const x = offsetX + j * keySize;
            const y = offsetY + (gridSize - 1 - i) * keySize;

            keyShapes.push({
                pitch: pitch,
                pitchClass: pitchClass,
                x: x,
                y: y,
                size: keySize,
            });
        }
    }

    return {
        keyShapes: keyShapes,
    };
}

function drawKeyShape(
    ctx: CanvasRenderingContext2D,
    keyShape: WhisqKeyShape,
    hasActivePitch: boolean,
    hasActivePitchClass: boolean,
): void {
    const colorScheme = getColorScheme(keyShape.pitchClass, false);
    const fillColor = hasActivePitch
        ? colorScheme.activePitch
        : hasActivePitchClass
            ? colorScheme.activePitchClass
            : colorScheme.idle;

    ctx.beginPath();
    ctx.rect(keyShape.x, keyShape.y, keyShape.size, keyShape.size);
    ctx.fillStyle = fillColor;
    ctx.fill();

    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 1;
    ctx.stroke();
}

export class WhisqCanvas {
    private readonly canvas: HTMLCanvasElement;
    private readonly ctx: CanvasRenderingContext2D;
    private readonly gridSize: number;
    private readonly pitchOffset: Pitch;
    private currentVoicing: Voicing | null = null;
    private readonly resizeObserver: ResizeObserver;

    constructor(canvas: HTMLCanvasElement, pitchOffset: Pitch = 36, gridSize: number = 12) {
        this.canvas = canvas;
        this.gridSize = gridSize;
        this.pitchOffset = pitchOffset;
        const context = canvas.getContext("2d");
        if (context === null) {
            throw new Error("failed to get 2d context for whisq canvas");
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

        const layout = buildWhisqLayout(this.gridSize, width, height, this.pitchOffset);
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
