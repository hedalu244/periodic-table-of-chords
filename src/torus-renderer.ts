import { renderChordButton } from "./chord-button";
import { RAW_CHORD_TABLE, TorusChordRow } from "./chord-table";
import { Chord } from "./chord-utils";
import { TorusBackground } from "./torus-background";
import { TorusScrollController } from "./torus-scroll-controller";
import { normalizeDegree } from "./torus-utils";

export interface ChordMapControllerParams {
    stage: HTMLDivElement;
    chordLayer: HTMLDivElement;
    gridCanvas: HTMLCanvasElement;
    onChordSelected: (chord: Chord) => Promise<void>;
}

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
