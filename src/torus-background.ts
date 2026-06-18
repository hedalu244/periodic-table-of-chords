import { T_color, D_color, S_color } from "./color-scheme";
import { mod, projectTorusPoint, TORUS_DEGREE, TorusViewState } from "./torus-utils";

const GRID_COLOR = "#b0b0b0";
const VERTICAL_GRID_STEP_DEG = 60; // 30;

const HORIZONTAL_GRID_SLOPE = -0.25;
const HORIZONTAL_GRID_STEP_DEG = 45;

const DIAGONAL1_GRID_SLOPE = -1.75;
const DIAGONAL1_GRID_STEP_DEG = 90;

const DIAGONAL2_GRID_SLOPE = 1.25;
const DIAGONAL2_GRID_STEP_DEG = 90;

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

		this.ctx.strokeStyle = GRID_COLOR;
		this.ctx.setLineDash([]);
		this.ctx.lineWidth = 3;
		this.drawDiagonalGridLines(viewState, HORIZONTAL_GRID_SLOPE, HORIZONTAL_GRID_STEP_DEG);

		this.ctx.lineWidth = 0.75;
		this.ctx.setLineDash([4, 4]);
		this.drawDiagonalGridLines(viewState, DIAGONAL1_GRID_SLOPE, DIAGONAL1_GRID_STEP_DEG);

		this.ctx.lineWidth = 0.75;
		this.ctx.setLineDash([4, 4]);
		this.drawDiagonalGridLines(viewState, DIAGONAL2_GRID_SLOPE, DIAGONAL2_GRID_STEP_DEG);

		this.drawVerticalGridLines(viewState);
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

		for (let step = startStep; step <= endStep; step += 1) {
			const xDeg = step * VERTICAL_GRID_STEP_DEG;

			if (mod(xDeg, 180) === 0) {
				this.ctx.strokeStyle = T_color;
			}
			else if (mod(xDeg, 180) === 60) {
				this.ctx.strokeStyle = S_color;
			}
			else if (mod(xDeg, 180) === 120) {
				this.ctx.strokeStyle = D_color;
			}

			if (mod(xDeg, 120) === 0) {
				this.ctx.setLineDash([]);
				this.ctx.lineWidth = 2;
			}
			else if (mod(xDeg, 120) === 60) {
				this.ctx.setLineDash([8, 8]);
				this.ctx.lineWidth = 2;
			}
			else {
				this.ctx.strokeStyle = GRID_COLOR;
				this.ctx.setLineDash([4, 4]);
				this.ctx.lineWidth = 1;
			}

			const x = viewState.width / 2 + ((xDeg - viewState.offsetXDeg) / TORUS_DEGREE) * viewState.scaleX;
			this.ctx.beginPath();
			this.ctx.moveTo(x, 0);
			this.ctx.lineTo(x, viewState.height);
			this.ctx.stroke();
		}
	}

	private drawDiagonalGridLines(viewState: TorusViewState, slope: number, stepDeg: number): void {
		const visibleHalfXDeg = (viewState.width / viewState.scaleX) * TORUS_DEGREE / 2;
		const visibleHalfYDeg = (viewState.height / viewState.scaleY) * TORUS_DEGREE / 2;
		const xStart = viewState.offsetXDeg - visibleHalfXDeg - 2 * TORUS_DEGREE;
		const xEnd = viewState.offsetXDeg + visibleHalfXDeg + 2 * TORUS_DEGREE;
		const yStart = viewState.offsetYDeg - visibleHalfYDeg - TORUS_DEGREE;
		const yEnd = viewState.offsetYDeg + visibleHalfYDeg + TORUS_DEGREE;
		const c1 = yStart - slope * xStart;
		const c2 = yStart - slope * xEnd;
		const c3 = yEnd - slope * xStart;
		const c4 = yEnd - slope * xEnd;
		const minC = Math.min(c1, c2, c3, c4);
		const maxC = Math.max(c1, c2, c3, c4);
		const startStep = Math.floor(minC / stepDeg);
		const endStep = Math.ceil(maxC / stepDeg);

		for (let step = startStep; step <= endStep; step += 1) {
			const c = step * stepDeg;
			const y1 = slope * xStart + c;
			const y2 = slope * xEnd + c;
			const p1 = projectTorusPoint(xStart, y1, viewState);
			const p2 = projectTorusPoint(xEnd, y2, viewState);
			this.ctx.beginPath();
			this.ctx.moveTo(p1.x, p1.y);
			this.ctx.lineTo(p2.x, p2.y);
			this.ctx.stroke();
		}
	}
}
