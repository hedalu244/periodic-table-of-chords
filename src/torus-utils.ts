export const TORUS_DEGREE = 360;

export interface TorusViewState {
    width: number;
    height: number;
    scaleX: number;
    scaleY: number;
    offsetXDeg: number;
    offsetYDeg: number;
}

export interface ScreenPoint {
	x: number;
	y: number;
}

export function projectTorusPoint(
    xDeg: number,
    yDeg: number,
    viewState: TorusViewState,
): ScreenPoint {
    return {
        x: viewState.width / 2 + ((xDeg - viewState.offsetXDeg) / TORUS_DEGREE) * viewState.scaleX,
        y: viewState.height / 2 + ((yDeg - viewState.offsetYDeg) / TORUS_DEGREE) * viewState.scaleY,
    };
}

export function normalizeDegree(value: number): number {
    return mod(value, TORUS_DEGREE);
}

export function mod(a: number, b: number): number {
    return ((a % b) + b) % b;
}