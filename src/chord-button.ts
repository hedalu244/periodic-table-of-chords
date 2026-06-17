import { TorusChordRow } from "./torus-renderer";
import { projectTorusPoint, TORUS_DEGREE, TorusViewState } from "./torus-utils";

interface RenderChordButtonParams {
    fragment: DocumentFragment;
    chordRow: TorusChordRow;
    viewState: TorusViewState;
    activeChordId: string | null;
    onChordClick: (chordId: string) => Promise<void>;
}

const TILE_DEGREE_OFFSETS = [-TORUS_DEGREE, 0, TORUS_DEGREE];
const CHORD_BUTTON_WIDTH_PX = 52;
const CHORD_BUTTON_HEIGHT_PX = 28;

function isChordButtonVisible(point: { x: number; y: number; }, viewState: TorusViewState): boolean {
    const halfWidth = CHORD_BUTTON_WIDTH_PX / 2;
    const halfHeight = CHORD_BUTTON_HEIGHT_PX / 2;
    return !(
        point.x + halfWidth < 0
        || point.x - halfWidth > viewState.width
        || point.y + halfHeight < 0
        || point.y - halfHeight > viewState.height
    );
}

function createChordButton(
    chord: TorusChordRow,
    x: number,
    y: number,
    activeChordId: string | null,
    onChordClick: (chordId: string) => Promise<void>,
): HTMLButtonElement {
    const button = document.createElement("button");
    button.type = "button";
    button.className = activeChordId === chord.id ? "torus-chord active" : "torus-chord";
    button.style.left = `${x}px`;
    button.style.top = `${y}px`;
    button.textContent = chord.label;
    button.dataset.chordId = chord.id;
    button.addEventListener("click", () => {
        void onChordClick(chord.id);
    });
    return button;
}

export function renderChordButton(params: RenderChordButtonParams): void {
    const chord = params.chordRow;

    for (const tileOffsetX of TILE_DEGREE_OFFSETS) {
        for (const tileOffsetY of TILE_DEGREE_OFFSETS) {
            const point = projectTorusPoint(
                chord.xDeg + tileOffsetX,
                chord.yDeg + tileOffsetY,
                params.viewState,
            );
            if (!isChordButtonVisible(point, params.viewState)) {
                continue;
            }
            params.fragment.appendChild(
                createChordButton(chord, point.x, point.y, params.activeChordId, params.onChordClick)
            );
        }
    }
}
