(() => {
  // src/torus-utils.ts
  var TORUS_DEGREE = 360;
  function projectTorusPoint(xDeg, yDeg, viewState) {
    return {
      x: viewState.width / 2 + (xDeg - viewState.offsetXDeg) / TORUS_DEGREE * viewState.scaleX,
      y: viewState.height / 2 + (yDeg - viewState.offsetYDeg) / TORUS_DEGREE * viewState.scaleY
    };
  }
  function normalizeDegree(value) {
    return (value % TORUS_DEGREE + TORUS_DEGREE) % TORUS_DEGREE;
  }

  // src/chord-button.ts
  var TILE_DEGREE_OFFSETS = [-TORUS_DEGREE, 0, TORUS_DEGREE];
  var CHORD_BUTTON_WIDTH_PX = 52;
  var CHORD_BUTTON_HEIGHT_PX = 28;
  function isChordButtonVisible(point, viewState) {
    const halfWidth = CHORD_BUTTON_WIDTH_PX / 2;
    const halfHeight = CHORD_BUTTON_HEIGHT_PX / 2;
    return !(point.x + halfWidth < 0 || point.x - halfWidth > viewState.width || point.y + halfHeight < 0 || point.y - halfHeight > viewState.height);
  }
  function createChordButton(chord, x, y, activeChordId, onChordClick) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = activeChordId === chord.id ? "torus-chord active" : "torus-chord";
    button.style.left = `${x}px`;
    button.style.top = `${y}px`;
    button.textContent = chord.name;
    button.dataset.chordId = chord.id;
    button.style.background = `linear-gradient(to right, ${chord.color1} ${chord.rate}%, ${chord.color2} ${chord.rate}%)`;
    button.addEventListener("click", () => {
      void onChordClick(chord.id);
    });
    return button;
  }
  function renderChordButton(params) {
    const chord = params.chordRow;
    for (const tileOffsetX of TILE_DEGREE_OFFSETS) {
      for (const tileOffsetY of TILE_DEGREE_OFFSETS) {
        const point = projectTorusPoint(
          chord.xDeg + tileOffsetX,
          chord.yDeg + tileOffsetY,
          params.viewState
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

  // src/chord-utils.ts
  function getNoteName(pitchClass) {
    const noteNames = ["A", "A#", "B", "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#"];
    return noteNames[pitchClass % 12];
  }
  function getPitchClass(noteName) {
    const noteNames = ["A", "A#", "B", "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#"];
    const index = noteNames.indexOf(noteName);
    if (index === -1) {
      throw new Error(`Invalid note name: ${noteName}`);
    }
    return index;
  }
  function transposeChord(chord, interval) {
    return chord.map((pitchClass) => pitchClass + interval);
  }
  function invertVoicing(voicing, direction) {
    if (direction === "up") {
      const newBass = voicing[0] + 12;
      const newVoicing = [...voicing.slice(1), newBass];
      return newVoicing;
    } else {
      const newTop = voicing[voicing.length - 1] - 12;
      const newVoicing = [newTop, ...voicing.slice(0, -1)];
      return newVoicing;
    }
  }
  function parseChordName(name) {
    const match = name.match(/^([A-G]#?)(.*)$/);
    if (!match) {
      throw new Error(`Invalid chord name: ${name}`);
    }
    return { root: match[1], quality: match[2] };
  }
  function generateBasicChord(name) {
    const { root, quality } = parseChordName(name);
    const rootPitchClass = getPitchClass(root);
    switch (quality) {
      case "":
      case "M":
        return transposeChord([0, 4, 7], rootPitchClass);
      // Major triad
      case "m":
        return transposeChord([0, 3, 7], rootPitchClass);
      // Minor triad
      case "7":
        return transposeChord([0, 4, 7, 10], rootPitchClass);
      // Dominant seventh
      case "m7":
        return transposeChord([0, 3, 7, 10], rootPitchClass);
      // Minor seventh
      case "dim7":
        return transposeChord([0, 3, 6, 9], rootPitchClass);
      // Diminished seventh
      case "m7-5":
        return transposeChord([0, 3, 6, 10], rootPitchClass);
      // Half-diminished seventh
      default:
        throw new Error(`Unsupported chord quality: ${quality}`);
    }
  }
  function nameChordWithInversion(basicName, voicing) {
    const { root } = parseChordName(basicName);
    const rootPitchClass = getPitchClass(root);
    const bassPitch = voicing[0];
    const bassPitchClass = bassPitch % 12;
    if (bassPitchClass !== rootPitchClass) {
      return `${basicName}/${getNoteName(bassPitchClass)}`;
    }
    return basicName;
  }

  // src/color-scheme.ts
  var T_color = "#13adb0";
  var D_color = "#6e3196";
  var S_color = "#d27700";
  var T_color_light = "#b8eff0";
  var D_color_light = "#e6c8f5";
  var S_color_light = "#eed5c1";
  function getColorScheme(pitchClass, isBlack) {
    const axis = pitchClass % 3;
    return {
      activePitch: [T_color, D_color, S_color][axis],
      activePitchClass: [T_color_light, D_color_light, S_color_light][axis],
      idle: isBlack ? "#cccccc" : "#efefef"
    };
  }

  // src/chord-table.ts
  var RAW_CHORD_TABLE = [
    ...generateDiminishedSeventhChords(),
    ...generateHalfdiminishedChords(),
    ...generateMinorTriads(),
    ...generateMinorSeventhChords(),
    ...generateMajorTriads(),
    ...generateDominantSeventhChords()
  ];
  function generateDiminishedSeventhChords() {
    const chordTable = [];
    for (let i = 0; i < 12; i += 1) {
      const chordName = `${getNoteName(i * 7)}dim7`;
      const chordId = chordName.toLowerCase();
      const chord = generateBasicChord(chordName);
      chordTable.push({
        id: chordId,
        xDeg: i * 120,
        yDeg: i * -30,
        name: chordName,
        chord,
        color1: [T_color, D_color, S_color][i % 3],
        color2: [T_color, D_color, S_color][i % 3],
        rate: 100
      });
    }
    return chordTable;
  }
  function generateHalfdiminishedChords() {
    const chordTable = [];
    for (let i = 0; i < 12; i += 1) {
      const chordName = `${getNoteName(i * 7)}m7-5`;
      const chordId = chordName.toLowerCase();
      const chord = generateBasicChord(chordName);
      chordTable.push({
        id: chordId,
        xDeg: i * 120 + 30,
        yDeg: i * -30 - 52.5,
        name: chordName,
        chord,
        color1: [T_color, D_color, S_color][i % 3],
        color2: [D_color, S_color, T_color][i % 3],
        rate: 75
      });
    }
    return chordTable;
  }
  function generateMinorTriads() {
    const chordTable = [];
    for (let i = 0; i < 12; i += 1) {
      const chordName = `${getNoteName(i * 7)}m`;
      const chordId = chordName.toLowerCase();
      const chord = generateBasicChord(chordName);
      chordTable.push({
        id: chordId,
        xDeg: i * 120 + 45,
        yDeg: i * -30 - 123.75,
        name: chordName,
        chord,
        color1: [T_color, D_color, S_color][i % 3],
        color2: [D_color, S_color, T_color][i % 3],
        rate: 67
      });
    }
    return chordTable;
  }
  function generateMinorSeventhChords() {
    const chordTable = [];
    for (let i = 0; i < 12; i += 1) {
      const chordName = `${getNoteName(i * 7)}m7`;
      const chordId = chordName.toLowerCase();
      const chord = generateBasicChord(chordName);
      chordTable.push({
        id: chordId,
        xDeg: i * 120 + 60,
        yDeg: i * -30 - 105,
        name: chordName,
        chord,
        color1: [T_color, D_color, S_color][i % 3],
        color2: [D_color, S_color, T_color][i % 3],
        rate: 50
      });
    }
    return chordTable;
  }
  function generateMajorTriads() {
    const chordTable = [];
    for (let i = 0; i < 12; i += 1) {
      const chordName = `${getNoteName(i * 7)}`;
      const chordId = chordName.toLowerCase();
      const chord = generateBasicChord(chordName);
      chordTable.push({
        id: chordId,
        xDeg: i * 120 + 75,
        yDeg: i * -30 - 176.25,
        name: chordName,
        chord,
        color1: [T_color, D_color, S_color][i % 3],
        color2: [D_color, S_color, T_color][i % 3],
        rate: 33
      });
    }
    return chordTable;
  }
  function generateDominantSeventhChords() {
    const chordTable = [];
    for (let i = 0; i < 12; i += 1) {
      const chordName = `${getNoteName(i * 7)}7`;
      const chordId = chordName.toLowerCase();
      const chord = generateBasicChord(chordName);
      chordTable.push({
        id: chordId,
        xDeg: i * 120 + 90,
        yDeg: i * -30 - 157.5,
        name: chordName,
        chord,
        color1: [T_color, D_color, S_color][i % 3],
        color2: [D_color, S_color, T_color][i % 3],
        rate: 25
      });
    }
    return chordTable;
  }

  // src/torus-background.ts
  var DIAGONAL_GRID_SLOPE = -0.25;
  var VERTICAL_GRID_STEP_DEG = 30;
  var DIAGONAL_GRID_STEP_DEG = 45;
  var TorusBackground = class {
    constructor(canvas) {
      const contextOrNull = canvas.getContext("2d");
      if (contextOrNull === null) {
        throw new Error("failed to initialize grid canvas context");
      }
      this.canvas = canvas;
      this.ctx = contextOrNull;
    }
    render(viewState) {
      this.resizeCanvasToViewState(viewState);
      this.ctx.clearRect(0, 0, viewState.width, viewState.height);
      this.drawVerticalGridLines(viewState);
      this.drawDiagonalGridLines(viewState);
    }
    resizeCanvasToViewState(viewState) {
      if (this.canvas.width !== viewState.width) {
        this.canvas.width = viewState.width;
      }
      if (this.canvas.height !== viewState.height) {
        this.canvas.height = viewState.height;
      }
    }
    drawVerticalGridLines(viewState) {
      const visibleHalfXDeg = viewState.width / viewState.scaleX * TORUS_DEGREE / 2;
      const startStep = Math.floor((viewState.offsetXDeg - visibleHalfXDeg - TORUS_DEGREE) / VERTICAL_GRID_STEP_DEG);
      const endStep = Math.ceil((viewState.offsetXDeg + visibleHalfXDeg + TORUS_DEGREE) / VERTICAL_GRID_STEP_DEG);
      this.ctx.strokeStyle = "#b0b0b0";
      this.ctx.setLineDash([8, 8]);
      this.ctx.lineWidth = 1;
      for (let step = startStep; step <= endStep; step += 1) {
        const xDeg = step * VERTICAL_GRID_STEP_DEG;
        const x = viewState.width / 2 + (xDeg - viewState.offsetXDeg) / TORUS_DEGREE * viewState.scaleX;
        this.ctx.beginPath();
        this.ctx.moveTo(x, 0);
        this.ctx.lineTo(x, viewState.height);
        this.ctx.stroke();
      }
    }
    drawDiagonalGridLines(viewState) {
      const visibleHalfXDeg = viewState.width / viewState.scaleX * TORUS_DEGREE / 2;
      const visibleHalfYDeg = viewState.height / viewState.scaleY * TORUS_DEGREE / 2;
      const xStart = viewState.offsetXDeg - visibleHalfXDeg - 2 * TORUS_DEGREE;
      const xEnd = viewState.offsetXDeg + visibleHalfXDeg + 2 * TORUS_DEGREE;
      const minC = viewState.offsetYDeg - visibleHalfYDeg - DIAGONAL_GRID_SLOPE * (viewState.offsetXDeg + visibleHalfXDeg) - TORUS_DEGREE;
      const maxC = viewState.offsetYDeg + visibleHalfYDeg - DIAGONAL_GRID_SLOPE * (viewState.offsetXDeg - visibleHalfXDeg) + TORUS_DEGREE;
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
  };

  // src/torus-scroll-controller.ts
  function createInitialViewState(stage) {
    const width = Math.max(1, stage.clientWidth);
    const height = Math.max(1, stage.clientHeight);
    return {
      width,
      height,
      scaleX: width * 0.92,
      scaleY: height * 0.92,
      offsetXDeg: 0,
      offsetYDeg: 0
    };
  }
  function cloneViewState(viewState) {
    return { ...viewState };
  }
  var TorusScrollController = class {
    constructor(params) {
      this.panState = null;
      this.onPointerDown = (event) => {
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
      this.onPointerMove = (event) => {
        if (this.panState === null || this.panState.pointerId !== event.pointerId) {
          return;
        }
        const deltaX = event.clientX - this.panState.lastClientX;
        const deltaY = event.clientY - this.panState.lastClientY;
        this.panState.lastClientX = event.clientX;
        this.panState.lastClientY = event.clientY;
        this.applyPanDeltaPx(deltaX, deltaY);
      };
      this.onPointerUp = (event) => {
        this.endPan(event.pointerId);
      };
      this.onPointerCancel = (event) => {
        this.endPan(event.pointerId);
      };
      this.onAuxClick = (event) => {
        if (event.button === 1) {
          event.preventDefault();
        }
      };
      this.onWheel = (event) => {
        event.preventDefault();
        this.applyPanDeltaPx(-event.deltaX, -event.deltaY);
      };
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
    getViewState() {
      return cloneViewState(this.viewState);
    }
    dispose() {
      this.resizeObserver.disconnect();
      this.stage.removeEventListener("pointerdown", this.onPointerDown);
      this.stage.removeEventListener("pointermove", this.onPointerMove);
      this.stage.removeEventListener("pointerup", this.onPointerUp);
      this.stage.removeEventListener("pointercancel", this.onPointerCancel);
      this.stage.removeEventListener("auxclick", this.onAuxClick);
      this.stage.removeEventListener("wheel", this.onWheel);
    }
    emitViewStateChange() {
      this.onViewStateChange(cloneViewState(this.viewState));
    }
    updateViewStateFromStage() {
      const width = Math.max(1, this.stage.clientWidth);
      const height = Math.max(1, this.stage.clientHeight);
      this.viewState = {
        ...this.viewState,
        width,
        height,
        scaleX: width * 0.92,
        scaleY: height * 0.92
      };
    }
    applyPanDeltaPx(deltaX, deltaY) {
      this.viewState = {
        ...this.viewState,
        offsetXDeg: normalizeDegree(
          this.viewState.offsetXDeg - deltaX * TORUS_DEGREE / this.viewState.scaleX
        ),
        offsetYDeg: normalizeDegree(
          this.viewState.offsetYDeg - deltaY * TORUS_DEGREE / this.viewState.scaleY
        )
      };
      this.emitViewStateChange();
    }
    beginPan(event) {
      this.panState = {
        pointerId: event.pointerId,
        lastClientX: event.clientX,
        lastClientY: event.clientY
      };
      this.stage.setPointerCapture(event.pointerId);
      this.stage.classList.add("dragging");
    }
    endPan(pointerId) {
      if (this.panState === null || this.panState.pointerId !== pointerId) {
        return;
      }
      this.panState = null;
      if (this.stage.hasPointerCapture(pointerId)) {
        this.stage.releasePointerCapture(pointerId);
      }
      this.stage.classList.remove("dragging");
    }
  };

  // src/torus-renderer.ts
  function normalizeChordTable(table) {
    return table.map((row) => ({
      ...row,
      xDeg: normalizeDegree(row.xDeg),
      yDeg: normalizeDegree(row.yDeg),
      chord: row.chord
    }));
  }
  function buildChordMap(chordTable) {
    const chordById = /* @__PURE__ */ new Map();
    for (const row of chordTable) {
      if (chordById.has(row.id)) {
        throw new Error(`duplicate chord id: ${row.id}`);
      }
      chordById.set(row.id, row);
    }
    return chordById;
  }
  var TorusRenderer = class {
    constructor(params) {
      this.activeChordId = null;
      this.onChordClick = async (chordId) => {
        const row = this.chordById.get(chordId);
        if (row === void 0) {
          throw new Error(`unknown chord id: ${chordId}`);
        }
        this.activeChordId = chordId;
        this.renderScene();
        await this.onChordSelected(row.name, row.chord);
      };
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
        }
      });
    }
    clearActiveChord() {
      this.activeChordId = null;
      this.renderScene();
    }
    dispose() {
      this.torusScrollController.dispose();
    }
    renderScene() {
      const viewState = this.torusScrollController.getViewState();
      this.torusBackground.render(viewState);
      const fragment = document.createDocumentFragment();
      for (const row of this.chordTable) {
        renderChordButton({
          chordRow: row,
          viewState,
          activeChordId: this.activeChordId,
          onChordClick: this.onChordClick,
          fragment
        });
      }
      this.chordLayer.replaceChildren(fragment);
    }
  };

  // src/dom.ts
  function getElementById(id, constructor) {
    const el = document.getElementById(id);
    if (el === null) {
      throw new Error(`Element with id "${id}" not found.`);
    }
    if (!(el instanceof constructor)) {
      throw new Error(`Element with id "${id}" is not a ${constructor.name}.`);
    }
    return el;
  }

  // src/arpeggio-controls.ts
  var ARPEGGIO_TYPES = [
    "none",
    "up-once",
    "down-once",
    "up-loop",
    "down-loop"
  ];
  function isArpeggioType(value) {
    return ARPEGGIO_TYPES.includes(value);
  }
  function getSelectedArpeggioType() {
    const typeElement = document.querySelector(
      'input[name="arpeggio-type"]:checked'
    );
    if (!typeElement) {
      throw new Error("arpeggio type is not selected");
    }
    const type = typeElement.value;
    if (!isArpeggioType(type)) {
      throw new Error("invalid arpeggio type: " + type);
    }
    return type;
  }
  function setupArpeggioControls(onChange) {
    const arpeggioTypeInputs = document.querySelectorAll('input[name="arpeggio-type"]');
    for (const typeInput of arpeggioTypeInputs) {
      typeInput.addEventListener("change", () => {
        onChange();
      });
    }
    const offsetInput = getElementById("input-arpeggio-offset-ms", HTMLInputElement);
    offsetInput.addEventListener("input", () => {
      onChange();
    });
  }
  function getArpeggioSettings() {
    const offsetInput = getElementById("input-arpeggio-offset-ms", HTMLInputElement);
    const noteOffsetMs = Number(offsetInput.value);
    if (!Number.isFinite(noteOffsetMs) || noteOffsetMs < 0) {
      throw new Error("arpeggio offset must be a non-negative number");
    }
    return {
      type: getSelectedArpeggioType(),
      noteOffsetMs
    };
  }

  // src/audio-backend.ts
  var MIN_MIDI_NOTE = 0;
  var MAX_MIDI_NOTE = 127;
  var MIN_MIDI_VELOCITY = 0;
  var MAX_MIDI_VELOCITY = 127;
  var ATTACK_SEC = 5e-3;
  var RELEASE_SEC = 0.03;
  var INVALID_VOICE_ID = -1;
  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }
  function midiPitchToFrequency(pitch) {
    const clippedPitch = clamp(pitch, MIN_MIDI_NOTE, MAX_MIDI_NOTE);
    return 440 * Math.pow(2, (clippedPitch - 69) / 12);
  }
  function velocityToGain(velocity) {
    const clippedVelocity = clamp(velocity, MIN_MIDI_VELOCITY, MAX_MIDI_VELOCITY);
    const normalized = clippedVelocity / MAX_MIDI_VELOCITY;
    return normalized * normalized;
  }
  function sanitizeDelay(delaySec) {
    if (typeof delaySec !== "number" || !Number.isFinite(delaySec) || delaySec < 0) {
      return 0;
    }
    return delaySec;
  }
  var AudioBackend = class {
    constructor() {
      this.audioContext = null;
      this.masterGain = null;
      this.nextVoiceId = 1;
      this.voices = /* @__PURE__ */ new Map();
      this.hasWarnedNotInitialized = false;
    }
    get isInitialized() {
      return this.audioContext !== null && this.masterGain !== null;
    }
    warnNotInitialized(methodName) {
      if (this.hasWarnedNotInitialized) {
        return;
      }
      this.hasWarnedNotInitialized = true;
      console.warn(
        "[AudioBackend] " + methodName + " called before initialize(). This call is ignored."
      );
    }
    async initialize(sampleRate) {
      if (this.audioContext) {
        return;
      }
      const context = sampleRate ? new AudioContext({ sampleRate }) : new AudioContext();
      const gain = context.createGain();
      gain.gain.value = 0.2;
      gain.connect(context.destination);
      this.audioContext = context;
      this.masterGain = gain;
    }
    async resume() {
      if (!this.isInitialized) {
        this.warnNotInitialized("resume");
        return;
      }
      await this.audioContext.resume();
    }
    async suspend() {
      if (!this.isInitialized) {
        this.warnNotInitialized("suspend");
        return;
      }
      await this.audioContext.suspend();
    }
    noteOn(request) {
      if (!this.isInitialized) {
        this.warnNotInitialized("noteOn");
        return INVALID_VOICE_ID;
      }
      const context = this.audioContext;
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
      gain.connect(this.masterGain);
      const voiceId = this.nextVoiceId++;
      this.voices.set(voiceId, {
        oscillator,
        gain
      });
      oscillator.onended = () => {
        this.voices.delete(voiceId);
        oscillator.disconnect();
        gain.disconnect();
      };
      oscillator.start(startAt);
      return voiceId;
    }
    noteOff(request) {
      if (!this.isInitialized) {
        this.warnNotInitialized("noteOff");
        return;
      }
      const voice = this.voices.get(request.voiceId);
      if (!voice) {
        return;
      }
      const context = this.audioContext;
      const stopAt = context.currentTime + sanitizeDelay(request.delaySec);
      voice.gain.gain.cancelScheduledValues(stopAt);
      voice.gain.gain.setValueAtTime(0, stopAt);
      voice.oscillator.stop(stopAt + RELEASE_SEC);
      this.voices.delete(request.voiceId);
    }
    allNotesOff(delaySec) {
      if (!this.isInitialized) {
        this.warnNotInitialized("allNotesOff");
        return;
      }
      for (const voiceId of this.voices.keys()) {
        this.noteOff({ voiceId, delaySec });
      }
    }
    async dispose() {
      if (!this.audioContext) {
        return;
      }
      this.allNotesOff(0);
      await this.audioContext.close();
      this.voices = /* @__PURE__ */ new Map();
      this.masterGain = null;
      this.audioContext = null;
      this.nextVoiceId = 1;
    }
  };

  // src/chord-player.ts
  var DEFAULT_VELOCITY = 100;
  var DEFAULT_CHANNEL = 0;
  var LOOP_TICK_MS = 20;
  function validateVoicing(voicing) {
    if (voicing.length === 0) {
      throw new Error("voicing must not be empty");
    }
    for (const pitch of voicing) {
      if (!Number.isFinite(pitch)) {
        throw new Error("voicing must contain finite pitches");
      }
    }
  }
  function getArpeggioOrder(type, voicing) {
    if (type === "down-once" || type === "down-loop") {
      return [...voicing].reverse();
    }
    return [...voicing];
  }
  function isLoopArpeggio(type) {
    return type === "up-loop" || type === "down-loop";
  }
  function isOnceArpeggio(type) {
    return type === "up-once" || type === "down-once";
  }
  function validateArpeggio(arpeggio) {
    if (!Number.isFinite(arpeggio.noteOffsetMs) || arpeggio.noteOffsetMs < 0) {
      throw new Error("arpeggio.noteOffsetMs must be a non-negative finite number");
    }
  }
  var ChordPlayer = class {
    constructor(backend) {
      this.activeVoices = /* @__PURE__ */ new Map();
      this.timerId = null;
      this.currentVoicing = null;
      this.arpeggio = { type: "none", noteOffsetMs: 170 };
      this.stepIndex = 0;
      this.nextStepAtMs = 0;
      this.backend = backend;
    }
    play(voicing, arpeggio) {
      validateVoicing(voicing);
      validateArpeggio(arpeggio);
      this.stop();
      this.currentVoicing = [...voicing];
      this.arpeggio = arpeggio;
      if (arpeggio.type === "none") {
        this.playChord(voicing);
        return;
      }
      this.stepIndex = 0;
      this.nextStepAtMs = performance.now();
      this.timerId = window.setInterval(() => {
        this.tickArpeggio();
      }, LOOP_TICK_MS);
    }
    stop() {
      if (this.timerId !== null) {
        window.clearInterval(this.timerId);
        this.timerId = null;
      }
      for (const state of this.activeVoices.values()) {
        if (state.timeoutId !== null) {
          window.clearTimeout(state.timeoutId);
        }
        this.backend.noteOff({ voiceId: state.voiceId });
      }
      this.activeVoices.clear();
      this.currentVoicing = null;
      this.stepIndex = 0;
      this.nextStepAtMs = 0;
    }
    playChord(voicing) {
      for (const pitch of voicing) {
        const voiceId = this.backend.noteOn({
          pitch,
          velocity: DEFAULT_VELOCITY,
          channel: DEFAULT_CHANNEL
        });
        this.activeVoices.set(voiceId, { voiceId, timeoutId: null });
      }
    }
    tickArpeggio() {
      if (!this.currentVoicing) {
        return;
      }
      const nowMs = performance.now();
      if (nowMs < this.nextStepAtMs) {
        return;
      }
      this.nextStepAtMs += this.arpeggio.noteOffsetMs;
      const order = getArpeggioOrder(this.arpeggio.type, this.currentVoicing);
      const pitch = order[this.stepIndex];
      const shouldSustain = isOnceArpeggio(this.arpeggio.type);
      this.playArpeggioNote(pitch, shouldSustain, this.arpeggio.noteOffsetMs);
      this.stepIndex += 1;
      if (this.stepIndex < order.length) {
        return;
      }
      if (isLoopArpeggio(this.arpeggio.type)) {
        this.stepIndex = 0;
        return;
      }
      if (isOnceArpeggio(this.arpeggio.type) && this.timerId !== null) {
        window.clearInterval(this.timerId);
        this.timerId = null;
      }
    }
    playArpeggioNote(pitch, shouldSustain, lengthMs) {
      const voiceId = this.backend.noteOn({
        pitch,
        velocity: DEFAULT_VELOCITY,
        channel: DEFAULT_CHANNEL
      });
      const timeoutId = shouldSustain ? null : window.setTimeout(() => {
        this.backend.noteOff({ voiceId });
        this.activeVoices.delete(voiceId);
      }, lengthMs);
      this.activeVoices.set(voiceId, {
        voiceId,
        timeoutId
      });
    }
  };

  // src/voicing.ts
  var DEFAULT_ROOT_OCTAVE = 5;
  function validateChord(chord) {
    if (chord.length === 0) {
      throw new Error("chord must not be empty");
    }
    for (const pitchClass of chord) {
      if (!Number.isFinite(pitchClass)) {
        throw new Error("chord must contain finite pitch classes");
      }
    }
  }
  function validateVoicing2(voicing) {
    if (voicing.length === 0) {
      throw new Error("voicing must not be empty");
    }
    for (const pitch of voicing) {
      if (!Number.isFinite(pitch)) {
        throw new Error("voicing must contain finite pitches");
      }
    }
  }
  function getMinPitch(voicing) {
    return Math.min(...voicing);
  }
  function getMaxPitch(voicing) {
    return Math.max(...voicing);
  }
  function getCycledPitchClasses(chord, inversionIndex) {
    return [...chord.slice(inversionIndex), ...chord.slice(0, inversionIndex)];
  }
  function getNearestBassOctaves(bassPitchClass, previousBass) {
    const octaveFloat = (previousBass - bassPitchClass) / 12;
    const lowerOctave = Math.floor(octaveFloat);
    const upperOctave = Math.ceil(octaveFloat);
    const lowerPitch = bassPitchClass + lowerOctave * 12;
    const upperPitch = bassPitchClass + upperOctave * 12;
    if (lowerPitch === upperPitch) {
      return [lowerPitch];
    }
    const lowerDistance = Math.abs(lowerPitch - previousBass);
    const upperDistance = Math.abs(upperPitch - previousBass);
    if (lowerDistance === upperDistance) {
      return [lowerPitch, upperPitch];
    }
    return lowerDistance < upperDistance ? [lowerPitch] : [upperPitch];
  }
  function buildClosePositionVoicing(chord, inversionIndex, bassPitch) {
    const cycledPitchClasses = getCycledPitchClasses(chord, inversionIndex);
    const bassPitchClass = cycledPitchClasses[0];
    const baseOctave = Math.floor((bassPitch - bassPitchClass) / 12);
    const voicing = [bassPitch];
    let previousPitch = bassPitch;
    for (const pitchClass of cycledPitchClasses.slice(1)) {
      let pitch = pitchClass + baseOctave * 12;
      while (pitch <= previousPitch) {
        pitch += 12;
      }
      voicing.push(pitch);
      previousPitch = pitch;
    }
    return voicing;
  }
  function scoreVoiceliading(candidate, previousVoicing) {
    return Math.abs(getMinPitch(candidate) - getMinPitch(previousVoicing)) + Math.abs(getMaxPitch(candidate) - getMaxPitch(previousVoicing));
  }
  function decideVoicing(chord, previousVoicing) {
    validateChord(chord);
    if (previousVoicing === void 0) {
      const rootPitch = chord[0] + DEFAULT_ROOT_OCTAVE * 12;
      return buildClosePositionVoicing(chord, 0, rootPitch);
    }
    validateVoicing2(previousVoicing);
    const previousBass = getMinPitch(previousVoicing);
    let best = null;
    let minscore = Number.POSITIVE_INFINITY;
    for (let inversionIndex = 0; inversionIndex < chord.length; inversionIndex += 1) {
      const bassPitchClass = chord[inversionIndex];
      const bassOptions = getNearestBassOctaves(bassPitchClass, previousBass);
      for (const bassPitch of bassOptions) {
        const candidateVoicing = buildClosePositionVoicing(chord, inversionIndex, bassPitch);
        const score = scoreVoiceliading(candidateVoicing, previousVoicing);
        if (score < minscore) {
          minscore = score;
          best = candidateVoicing;
        }
      }
    }
    if (best === null) {
      throw new Error("failed to decide voicing");
    }
    return best;
  }

  // src/voicing-manager.ts
  var VoicingManager = class {
    constructor(onVoicingChanged) {
      this.currentVoicing = null;
      this.isAudioReady = false;
      this.backend = new AudioBackend();
      this.player = new ChordPlayer(this.backend);
      this.onVoicingChanged = onVoicingChanged;
    }
    replayActiveVoicing() {
      if (this.currentVoicing === null) {
        return;
      }
      this.player.play(this.currentVoicing, getArpeggioSettings());
    }
    async shiftActiveVoicing(direction) {
      if (this.currentVoicing === null) {
        return;
      }
      await this.prepareAudio();
      const nextVoicing = invertVoicing(this.currentVoicing, direction);
      this.currentVoicing = nextVoicing;
      this.onVoicingChanged(nextVoicing);
      this.player.play(nextVoicing, getArpeggioSettings());
    }
    async playChord(chord) {
      await this.prepareAudio();
      const nextVoicing = decideVoicing(chord, this.currentVoicing ?? void 0);
      this.currentVoicing = nextVoicing;
      this.onVoicingChanged(nextVoicing);
      this.player.play(nextVoicing, getArpeggioSettings());
    }
    stopChord() {
      this.player.stop();
      this.currentVoicing = null;
      this.onVoicingChanged(null);
    }
    async prepareAudio() {
      if (this.isAudioReady) {
        await this.backend.resume();
        return;
      }
      await this.backend.initialize();
      await this.backend.resume();
      this.isAudioReady = true;
    }
  };

  // src/keyboard-canvas.ts
  var PITCHES_PER_OCTAVE = 12;
  var WHITE_KEYS_PER_OCTAVE = 7;
  var OCTAVE_PITCHES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  var BLACK_PITCH_CLASSES = [1, 4, 6, 9, 11];
  var offset1 = 0.1;
  var offset2 = 0.1;
  var KEY_CENTER_IN_WHITE_UNITS = [
    0,
    0.5 + offset1,
    // A#
    1,
    2,
    2.5 - offset2,
    // C#
    3,
    3.5 + offset2,
    // D#
    4,
    5,
    5.5 - offset1,
    // F#
    6,
    6.5
    // G#
  ];
  var BLACK_KEY_SET = new Set(BLACK_PITCH_CLASSES);
  function mod12(pitch) {
    return (pitch % PITCHES_PER_OCTAVE + PITCHES_PER_OCTAVE) % PITCHES_PER_OCTAVE;
  }
  function isBlackKey(pitchClass) {
    return BLACK_KEY_SET.has(pitchClass);
  }
  function buildPianoLayout(startPitch, octaveCount, width, height) {
    if (octaveCount <= 0) {
      throw new Error("octaveCount must be positive");
    }
    const whiteKeyCount = octaveCount * WHITE_KEYS_PER_OCTAVE;
    const whiteKeyWidth = width / whiteKeyCount;
    const blackKeyWidth = whiteKeyWidth * 0.62;
    const blackKeyHeight = height * 0.62;
    const whiteShapes = [];
    const blackShapes = [];
    for (let octave = 0; octave < octaveCount; octave += 1) {
      const octaveStartPitch = startPitch + octave * PITCHES_PER_OCTAVE;
      for (const pitchClass of OCTAVE_PITCHES) {
        const pitch = octaveStartPitch + pitchClass;
        const isBlack = isBlackKey(pitchClass);
        const centerInWhiteUnits = KEY_CENTER_IN_WHITE_UNITS[pitchClass];
        const centerX = (octave * WHITE_KEYS_PER_OCTAVE + centerInWhiteUnits) * whiteKeyWidth;
        const keyWidth = isBlack ? blackKeyWidth : whiteKeyWidth;
        const keyShape = {
          pitch,
          pitchClass,
          x: centerX - keyWidth / 2,
          y: 0,
          width: keyWidth,
          height: isBlack ? blackKeyHeight : height,
          isBlack
        };
        if (isBlack) {
          blackShapes.push(keyShape);
          continue;
        }
        whiteShapes.push(keyShape);
      }
    }
    return {
      width,
      height,
      keyShapes: [...whiteShapes, ...blackShapes]
    };
  }
  function drawKeyShape(ctx, keyShape, hasActivePitch, hasActivePitchClass) {
    const colorScheme = getColorScheme(keyShape.pitchClass, keyShape.isBlack);
    const fillColor = hasActivePitch ? colorScheme.activePitch : hasActivePitchClass ? colorScheme.activePitchClass : colorScheme.idle;
    ctx.beginPath();
    ctx.rect(keyShape.x, keyShape.y, keyShape.width, keyShape.height);
    ctx.fillStyle = fillColor;
    ctx.fill();
    ctx.strokeStyle = "#777777";
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  var KeyboardCanvas = class {
    constructor(canvas, startPitch = 48, octaveCount = 3) {
      this.currentVoicing = null;
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
    setVoicing(voicing) {
      this.currentVoicing = voicing;
      this.render();
    }
    dispose() {
      this.resizeObserver.disconnect();
    }
    render() {
      const devicePixelRatio = window.devicePixelRatio || 1;
      const width = Math.max(1, Math.floor(this.canvas.clientWidth));
      const height = Math.max(1, Math.floor(this.canvas.clientHeight));
      this.canvas.width = Math.floor(width * devicePixelRatio);
      this.canvas.height = Math.floor(height * devicePixelRatio);
      this.ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
      this.ctx.clearRect(0, 0, width, height);
      const layout = buildPianoLayout(this.startPitch, this.octaveCount, width, height);
      const activePitches = new Set((this.currentVoicing ?? []).map((pitch) => Math.round(pitch)));
      const activePitchClasses = new Set((this.currentVoicing ?? []).map((pitch) => mod12(Math.round(pitch))));
      for (const keyShape of layout.keyShapes) {
        drawKeyShape(
          this.ctx,
          keyShape,
          activePitches.has(keyShape.pitch),
          activePitchClasses.has(keyShape.pitchClass)
        );
      }
    }
  };

  // src/whisq-canvas.ts
  var PITCHES_PER_OCTAVE2 = 12;
  var FOURTH_INTERVAL = 5;
  var WHOLE_TONE_INTERVAL = 2;
  var MARGIN = 10;
  function mod122(pitch) {
    return (pitch % PITCHES_PER_OCTAVE2 + PITCHES_PER_OCTAVE2) % PITCHES_PER_OCTAVE2;
  }
  function buildWhisqLayout(gridSize, width, height, pitchOffset) {
    if (gridSize <= 0) {
      throw new Error("gridSize must be positive");
    }
    const keySize = (Math.min(width, height) - 2 * MARGIN) / gridSize;
    const offsetX = (width - keySize * gridSize) / 2;
    const offsetY = (height - keySize * gridSize) / 2;
    const keyShapes = [];
    for (let i = 0; i < gridSize; i += 1) {
      for (let j = 0; j < gridSize; j += 1) {
        const pitch = pitchOffset + i * FOURTH_INTERVAL + j * WHOLE_TONE_INTERVAL;
        const pitchClass = mod122(pitch);
        const x = offsetX + j * keySize;
        const y = offsetY + (gridSize - 1 - i) * keySize;
        keyShapes.push({
          pitch,
          pitchClass,
          x,
          y,
          size: keySize
        });
      }
    }
    return {
      keyShapes
    };
  }
  function drawKeyShape2(ctx, keyShape, hasActivePitch, hasActivePitchClass) {
    const colorScheme = getColorScheme(keyShape.pitchClass, false);
    const fillColor = hasActivePitch ? colorScheme.activePitch : hasActivePitchClass ? colorScheme.activePitchClass : colorScheme.idle;
    ctx.beginPath();
    ctx.rect(keyShape.x, keyShape.y, keyShape.size, keyShape.size);
    ctx.fillStyle = fillColor;
    ctx.fill();
    ctx.strokeStyle = "#777777";
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  var WhisqCanvas = class {
    constructor(canvas, pitchOffset = 36, gridSize = 12) {
      this.currentVoicing = null;
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
    setVoicing(voicing) {
      this.currentVoicing = voicing;
      this.render();
    }
    dispose() {
      this.resizeObserver.disconnect();
    }
    render() {
      const devicePixelRatio = window.devicePixelRatio || 1;
      const width = Math.max(1, Math.floor(this.canvas.clientWidth));
      const height = Math.max(1, Math.floor(this.canvas.clientHeight));
      this.canvas.width = Math.floor(width * devicePixelRatio);
      this.canvas.height = Math.floor(height * devicePixelRatio);
      this.ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
      this.ctx.clearRect(0, 0, width, height);
      const layout = buildWhisqLayout(this.gridSize, width, height, this.pitchOffset);
      const activePitches = new Set((this.currentVoicing ?? []).map((pitch) => Math.round(pitch)));
      const activePitchClasses = new Set((this.currentVoicing ?? []).map((pitch) => mod122(Math.round(pitch))));
      for (const keyShape of layout.keyShapes) {
        drawKeyShape2(
          this.ctx,
          keyShape,
          activePitches.has(keyShape.pitch),
          activePitchClasses.has(keyShape.pitchClass)
        );
      }
    }
  };

  // src/main.ts
  function renderCurrentChordName(chordLabelElement, selectedChordName, currentVoicing) {
    if (selectedChordName === null || currentVoicing === null) {
      chordLabelElement.textContent = "-";
      return;
    }
    chordLabelElement.textContent = nameChordWithInversion(selectedChordName, currentVoicing);
  }
  async function main() {
    const stage = getElementById("torus-stage", HTMLDivElement);
    const chordLayer = getElementById("torus-chord-layer", HTMLDivElement);
    const gridCanvas = getElementById("torus-grid", HTMLCanvasElement);
    const keyboardCanvasElement = getElementById("keyboard-canvas", HTMLCanvasElement);
    const whisqCanvasElement = getElementById("whisq-canvas", HTMLCanvasElement);
    const currentChordNameElement = getElementById("current-chord-name", HTMLParagraphElement);
    const keyboardCanvas = new KeyboardCanvas(keyboardCanvasElement);
    const whisqCanvas = new WhisqCanvas(whisqCanvasElement);
    let selectedChordName = null;
    let currentVoicing = null;
    const voicingManager = new VoicingManager((voicing) => {
      currentVoicing = voicing;
      keyboardCanvas.setVoicing(voicing);
      whisqCanvas.setVoicing(voicing);
      renderCurrentChordName(currentChordNameElement, selectedChordName, currentVoicing);
    });
    const torusRenderer = new TorusRenderer({
      stage,
      chordLayer,
      gridCanvas,
      onChordSelected: async (chordName, chord) => {
        selectedChordName = chordName;
        await voicingManager.playChord(chord);
        renderCurrentChordName(currentChordNameElement, selectedChordName, currentVoicing);
      }
    });
    setupArpeggioControls(() => {
      voicingManager.replayActiveVoicing();
    });
    const upButton = getElementById("btn-invert-up", HTMLButtonElement);
    upButton.addEventListener("click", () => {
      voicingManager.shiftActiveVoicing("up");
    });
    const downButton = getElementById("btn-invert-down", HTMLButtonElement);
    downButton.addEventListener("click", () => {
      voicingManager.shiftActiveVoicing("down");
    });
    const stopButton = getElementById("btn-stop", HTMLButtonElement);
    stopButton.addEventListener("click", () => {
      voicingManager.stopChord();
      selectedChordName = null;
      renderCurrentChordName(currentChordNameElement, selectedChordName, currentVoicing);
      torusRenderer.clearActiveChord();
    });
    window.addEventListener("beforeunload", () => {
      keyboardCanvas.dispose();
      whisqCanvas.dispose();
      torusRenderer.dispose();
    });
    torusRenderer.renderScene();
  }
  void main();
})();
//# sourceMappingURL=main.js.map
