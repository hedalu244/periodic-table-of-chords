import { projectTorusPoint, TORUS_DEGREE, TorusViewState } from "./torus-utils";


const DIAGONAL_GRID_SLOPE = -0.25;
const VERTICAL_GRID_STEP_DEG = 30;
const DIAGONAL_GRID_STEP_DEG = 45;

export class TorusBackground {
	private readonly canvas: HTMLCanvasElement;
	private readonly ctx: CanvasRenderingContext2D;

	constructor(canvas: HTMLCanvasElement) {
		const contextOrNull = canvas.getContext("2d");
		if (contextOrNull === null) {
			throw new Error("failed to initialize grid canvas context");
		}
		this.canvas = canvas;
		this.ctx = contextOrNull;
	}

	render(viewState: TorusViewState): void {
		this.resizeCanvasToViewState(viewState);
		this.ctx.clearRect(0, 0, viewState.width, viewState.height);
		this.drawVerticalGridLines(viewState);
		this.drawDiagonalGridLines(viewState);
	}

	private resizeCanvasToViewState(viewState: TorusViewState): void {
		if (this.canvas.width !== viewState.width) {
			this.canvas.width = viewState.width;
		}
		if (this.canvas.height !== viewState.height) {
			this.canvas.height = viewState.height;
		}
	}

	private drawVerticalGridLines(viewState: TorusViewState): void {
		const visibleHalfXDeg = (viewState.width / viewState.scaleX) * TORUS_DEGREE / 2;
		const startStep = Math.floor((viewState.offsetXDeg - visibleHalfXDeg - TORUS_DEGREE) / VERTICAL_GRID_STEP_DEG);
		const endStep = Math.ceil((viewState.offsetXDeg + visibleHalfXDeg + TORUS_DEGREE) / VERTICAL_GRID_STEP_DEG);

		this.ctx.strokeStyle = "#b0b0b0";
		this.ctx.setLineDash([8, 8]);
		this.ctx.lineWidth = 1;

		for (let step = startStep; step <= endStep; step += 1) {
			const xDeg = step * VERTICAL_GRID_STEP_DEG;
			const x = viewState.width / 2 + ((xDeg - viewState.offsetXDeg) / TORUS_DEGREE) * viewState.scaleX;
			this.ctx.beginPath();
			this.ctx.moveTo(x, 0);
			this.ctx.lineTo(x, viewState.height);
			this.ctx.stroke();
		}
	}

	private drawDiagonalGridLines(viewState: TorusViewState): void {
		const visibleHalfXDeg = (viewState.width / viewState.scaleX) * TORUS_DEGREE / 2;
		const visibleHalfYDeg = (viewState.height / viewState.scaleY) * TORUS_DEGREE / 2;
		const xStart = viewState.offsetXDeg - visibleHalfXDeg - 2 * TORUS_DEGREE;
		const xEnd = viewState.offsetXDeg + visibleHalfXDeg + 2 * TORUS_DEGREE;
		const minC = viewState.offsetYDeg
			- visibleHalfYDeg
			- DIAGONAL_GRID_SLOPE * (viewState.offsetXDeg + visibleHalfXDeg)
			- TORUS_DEGREE;
		const maxC = viewState.offsetYDeg
			+ visibleHalfYDeg
			- DIAGONAL_GRID_SLOPE * (viewState.offsetXDeg - visibleHalfXDeg)
			+ TORUS_DEGREE;
		const startStep = Math.floor(minC / DIAGONAL_GRID_STEP_DEG);
		const endStep = Math.ceil(maxC / DIAGONAL_GRID_STEP_DEG);

		this.ctx.strokeStyle = "#a4a4a4";
		this.ctx.setLineDash([]);
		this.ctx.lineWidth = 1.25;

		for (let step = startStep; step <= endStep; step += 1) {
			const c = step * DIAGONAL_GRID_STEP_DEG;
			const y1 = DIAGONAL_GRID_SLOPE * xStart + c;
			const y2 = DIAGONAL_GRID_SLOPE * xEnd + c;
			const p1 = projectTorusPoint(xStart, y1, viewState);
			const p2 = projectTorusPoint(xEnd, y2, viewState);
			this.ctx.beginPath();
			this.ctx.moveTo(p1.x, p1.y);
			this.ctx.lineTo(p2.x, p2.y);
			this.ctx.stroke();
		}
	}
}
