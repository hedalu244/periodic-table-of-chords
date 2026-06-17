import { renderChordButton } from "./chord-button";
import { Chord } from "./ChordPlayer";
import { TorusBackground } from "./torus-background";
import { TorusScrollController } from "./torus-scroll-controller";
import { normalizeDegree } from "./torus-util";

export interface TorusChordRow {
    id: string;
    xDeg: number;
    yDeg: number;
    label: string;
    chord: Chord;
}

export interface ChordMapControllerParams {
    stage: HTMLDivElement;
    chordLayer: HTMLDivElement;
    gridCanvas: HTMLCanvasElement;
    onChordSelected: (chord: Chord) => Promise<void>;
}

const RAW_CHORD_TABLE: TorusChordRow[] = [
    { id: "cmaj7", xDeg: 0, yDeg: 0, label: "Cmaj7", chord: [0, 4, 7, 11] },
    { id: "dm7", xDeg: 60, yDeg: 30, label: "Dm7", chord: [2, 5, 9, 0] },
    { id: "em7", xDeg: 120, yDeg: 60, label: "Em7", chord: [4, 7, 11, 2] },
    { id: "fmaj7", xDeg: 180, yDeg: 90, label: "Fmaj7", chord: [5, 9, 0, 4] },
    { id: "g7", xDeg: 240, yDeg: 120, label: "G7", chord: [7, 11, 2, 5] },
    { id: "am7", xDeg: 300, yDeg: 150, label: "Am7", chord: [9, 0, 4, 7] },
    { id: "bm7b5", xDeg: 330, yDeg: 180, label: "Bm7♭5", chord: [11, 2, 5, 9] },
    { id: "f7", xDeg: -60, yDeg: 60, label: "F7", chord: [5, 9, 0, 3] },
    { id: "bb7", xDeg: 0, yDeg: 120, label: "B♭7", chord: [10, 2, 5, 8] },
    { id: "eb7", xDeg: 60, yDeg: 180, label: "E♭7", chord: [3, 7, 10, 1] },
    { id: "ab7", xDeg: 120, yDeg: 240, label: "A♭7", chord: [8, 0, 3, 6] },
    { id: "db7", xDeg: 180, yDeg: 300, label: "D♭7", chord: [1, 5, 8, 11] },
    { id: "gb7", xDeg: 240, yDeg: 360, label: "G♭7", chord: [6, 10, 1, 4] },
];

function normalizeChordTable(table: TorusChordRow[]): TorusChordRow[] {
    return table.map((row) => ({
        ...row,
        xDeg: normalizeDegree(row.xDeg),
        yDeg: normalizeDegree(row.yDeg),
        chord: row.chord,
    }));
}

function buildChordMap(chordTable: TorusChordRow[]): Map<string, TorusChordRow> {
    const chordById = new Map<string, TorusChordRow>();
    for (const row of chordTable) {
        if (chordById.has(row.id)) {
            throw new Error(`duplicate chord id: ${row.id}`);
        }
        chordById.set(row.id, row);
    }
    return chordById;
}

export class TorusRenderer {
    private readonly chordLayer: HTMLDivElement;
    private readonly onChordSelected: (chord: Chord) => Promise<void>;
    private readonly torusScrollController: TorusScrollController;
    private readonly torusBackground: TorusBackground;
    private readonly chordTable: TorusChordRow[];
    private readonly chordById: Map<string, TorusChordRow>;
    private activeChordId: string | null = null;

    constructor(params: ChordMapControllerParams) {
        this.chordLayer = params.chordLayer;
        this.onChordSelected = params.onChordSelected;
        this.torusBackground = new TorusBackground(params.gridCanvas);
        this.chordTable = normalizeChordTable(RAW_CHORD_TABLE);
        this.chordById = buildChordMap(this.chordTable);
        this.torusScrollController = new TorusScrollController({
            stage: params.stage,
            interactionLayer: params.chordLayer,
            onViewStateChange: () => {
                this.renderScene();
            },
        });
    }

    clearActiveChord(): void {
        this.activeChordId = null;
        this.renderScene();
    }

    dispose(): void {
        this.torusScrollController.dispose();
    }

    renderScene(): void {
        const viewState = this.torusScrollController.getViewState();
        this.torusBackground.render(viewState);

        const fragment = document.createDocumentFragment();

        for (const row of this.chordTable) {
            renderChordButton({
                chordRow: row,
                viewState: viewState,
                activeChordId: this.activeChordId,
                onChordClick: this.onChordClick,
                fragment: fragment,
            });
        }

        this.chordLayer.replaceChildren(fragment);
    }

    private readonly onChordClick = async (chordId: string): Promise<void> => {
        const row = this.chordById.get(chordId);
        if (row === undefined) {
            throw new Error(`unknown chord id: ${chordId}`);
        }
        this.activeChordId = chordId;
        this.renderScene();
        await this.onChordSelected(row.chord);
    };
}
