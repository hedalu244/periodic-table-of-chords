import { normalizeDegree, TORUS_DEGREE, TorusViewState } from "./torus-utils";

interface PanState {
    pointerId: number;
    lastClientX: number;
    lastClientY: number;
}

interface TorusControllerParams {
    stage: HTMLDivElement;
    interactionLayer: HTMLDivElement;
    onViewStateChange: (viewState: TorusViewState) => void;
}

function createInitialViewState(stage: HTMLDivElement): TorusViewState {
    const width = Math.max(1, stage.clientWidth);
    const height = Math.max(1, stage.clientHeight);
    return {
        width: width,
        height: height,
        scaleX: width * 0.92,
        scaleY: height * 0.92,
        offsetXDeg: 0,
        offsetYDeg: 0,
    };
}

function cloneViewState(viewState: TorusViewState): TorusViewState {
    return { ...viewState };
}

export class TorusScrollController {
    private readonly stage: HTMLDivElement;
    private readonly interactionLayer: HTMLDivElement;
    private readonly onViewStateChange: (viewState: TorusViewState) => void;

    private panState: PanState | null = null;
    private viewState: TorusViewState;
    private readonly resizeObserver: ResizeObserver;

    constructor(params: TorusControllerParams) {
        this.stage = params.stage;
        this.interactionLayer = params.interactionLayer;
        this.onViewStateChange = params.onViewStateChange;
        this.viewState = createInitialViewState(this.stage);

        this.resizeObserver = new ResizeObserver(() => {
            this.updateViewStateFromStage();
            this.emitViewStateChange();
        });
        this.resizeObserver.observe(this.stage);

        this.stage.addEventListener("pointerdown", this.onPointerDown);
        this.stage.addEventListener("pointermove", this.onPointerMove);
        this.stage.addEventListener("pointerup", this.onPointerUp);
        this.stage.addEventListener("pointercancel", this.onPointerCancel);
        this.stage.addEventListener("auxclick", this.onAuxClick);
        this.stage.addEventListener("wheel", this.onWheel, { passive: false });

        this.updateViewStateFromStage();
    }

    getViewState(): TorusViewState {
        return cloneViewState(this.viewState);
    }

    dispose(): void {
        this.resizeObserver.disconnect();
        this.stage.removeEventListener("pointerdown", this.onPointerDown);
        this.stage.removeEventListener("pointermove", this.onPointerMove);
        this.stage.removeEventListener("pointerup", this.onPointerUp);
        this.stage.removeEventListener("pointercancel", this.onPointerCancel);
        this.stage.removeEventListener("auxclick", this.onAuxClick);
        this.stage.removeEventListener("wheel", this.onWheel);
    }

    private emitViewStateChange(): void {
        this.onViewStateChange(cloneViewState(this.viewState));
    }

    private updateViewStateFromStage(): void {
        const width = Math.max(1, this.stage.clientWidth);
        const height = Math.max(1, this.stage.clientHeight);
        this.viewState = {
            ...this.viewState,
            width: width,
            height: height,
            scaleX: width * 0.92,
            scaleY: height * 0.92,
        };
    }

    private applyPanDeltaPx(deltaX: number, deltaY: number): void {
        this.viewState = {
            ...this.viewState,
            offsetXDeg: normalizeDegree(
                this.viewState.offsetXDeg - (deltaX * TORUS_DEGREE) / this.viewState.scaleX
            ),
            offsetYDeg: normalizeDegree(
                this.viewState.offsetYDeg - (deltaY * TORUS_DEGREE) / this.viewState.scaleY
            ),
        };
        this.emitViewStateChange();
    }

    private beginPan(event: PointerEvent): void {
        this.panState = {
            pointerId: event.pointerId,
            lastClientX: event.clientX,
            lastClientY: event.clientY,
        };
        this.stage.setPointerCapture(event.pointerId);
        this.stage.classList.add("dragging");
    }

    private endPan(pointerId: number): void {
        if (this.panState === null || this.panState.pointerId !== pointerId) {
            return;
        }
        this.panState = null;
        if (this.stage.hasPointerCapture(pointerId)) {
            this.stage.releasePointerCapture(pointerId);
        }
        this.stage.classList.remove("dragging");
    }

    private readonly onPointerDown = (event: PointerEvent): void => {
        if (event.button === 1) {
            event.preventDefault();
            this.beginPan(event);
            return;
        }
        const isBackgroundTarget = event.target === this.stage || event.target === this.interactionLayer;
        if (event.button === 0 && isBackgroundTarget) {
            event.preventDefault();
            this.beginPan(event);
        }
    };

    private readonly onPointerMove = (event: PointerEvent): void => {
        if (this.panState === null || this.panState.pointerId !== event.pointerId) {
            return;
        }
        const deltaX = event.clientX - this.panState.lastClientX;
        const deltaY = event.clientY - this.panState.lastClientY;
        this.panState.lastClientX = event.clientX;
        this.panState.lastClientY = event.clientY;
        this.applyPanDeltaPx(deltaX, deltaY);
    };

    private readonly onPointerUp = (event: PointerEvent): void => {
        this.endPan(event.pointerId);
    };

    private readonly onPointerCancel = (event: PointerEvent): void => {
        this.endPan(event.pointerId);
    };

    private readonly onAuxClick = (event: MouseEvent): void => {
        if (event.button === 1) {
            event.preventDefault();
        }
    };

    private readonly onWheel = (event: WheelEvent): void => {
        event.preventDefault();
        this.applyPanDeltaPx(-event.deltaX, -event.deltaY);
    };
}
