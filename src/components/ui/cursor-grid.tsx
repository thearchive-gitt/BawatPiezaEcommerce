"use client";

import { useEffect, useRef } from "react";
import type { CSSProperties } from "react";
import "./cursor-grid.css";

type GridStyle = "lines" | "dashed" | "dots" | "crosses";
type Falloff = "smooth" | "linear" | "sharp";
type Highlight = "area" | "cell";

type CursorGridProps = {
  cellSize?: number;
  color?: string;
  gridColor?: string;
  radius?: number;
  falloff?: Falloff;
  highlight?: Highlight;
  holdTime?: number;
  fadeDuration?: number;
  lineWidth?: number;
  maxOpacity?: number;
  fillOpacity?: number;
  gridOpacity?: number;
  gridStyle?: GridStyle;
  cellRadius?: number;
  cellGap?: number;
  spotlight?: number;
  clickPulse?: boolean;
  pulseSpeed?: number;
  ambient?: number;
  edgeFade?: number;
  intro?: boolean;
  lightMode?: boolean;
  dpr?: number;
  className?: string;
  style?: CSSProperties;
};

const INTRO_SECONDS = 1.4;
const GRID_STYLES: Record<GridStyle, number> = {
  lines: 0,
  dashed: 1,
  dots: 2,
  crosses: 3,
};
const FALL_OFFS: Record<Falloff, (value: number) => number> = {
  linear: (value) => value,
  smooth: (value) => value * value * (3 - 2 * value),
  sharp: (value) => value * value * value,
};

const VERTEX_SHADER = `#version 300 es
void main() {
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;

const FRAGMENT_SHADER = `#version 300 es
precision highp float;
precision highp int;
uniform vec2 uResolution;
uniform vec2 uOffset;
uniform float uCellSize;
uniform sampler2D uState;
uniform ivec2 uCells;
uniform vec3 uColor;
uniform vec3 uGridColor;
uniform float uLineWidth;
uniform float uMaxOpacity;
uniform float uFillOpacity;
uniform float uGridOpacity;
uniform int uGridStyle;
uniform vec2 uMouse;
uniform float uRadius;
uniform float uSpotlight;
uniform float uPresence;
uniform float uEdgeFade;
uniform float uReveal;
out vec4 outColor;

float level(vec2 cell) {
  if (cell.x < 0.0 || cell.y < 0.0 || cell.x >= float(uCells.x) || cell.y >= float(uCells.y)) return 0.0;
  float v = texelFetch(uState, ivec2(cell), 0).r;
  return v * v * (3.0 - 2.0 * v);
}
float line(float d, float width) {
  float w = max(width, 1.0);
  return clamp(w * 0.5 + 0.5 - d, 0.0, 1.0) * (width / w);
}
void main() {
  vec2 pos = vec2(gl_FragCoord.x, uResolution.y - gl_FragCoord.y);
  vec2 g = (pos - uOffset) / uCellSize;
  vec2 cell = floor(g);
  vec2 f = g - cell;
  vec2 edge = min(f, 1.0 - f) * uCellSize;
  float vx = line(edge.x, uLineWidth);
  float vy = line(edge.y, uLineWidth);
  if (uGridStyle == 1) {
    float dash = uCellSize / 6.0;
    vx *= step(0.5, fract((pos.y - uOffset.y) / dash + 0.25));
    vy *= step(0.5, fract((pos.x - uOffset.x) / dash + 0.25));
  } else if (uGridStyle == 2) {
    float r = max(uLineWidth * 1.25, 1.2);
    vx = clamp(r + 0.5 - length(edge), 0.0, 1.0);
    vy = 0.0;
  } else if (uGridStyle == 3) {
    float arm = uCellSize * 0.1 + uLineWidth;
    vx *= step(edge.y, arm);
    vy *= step(edge.x, arm);
  }
  float mark = max(vx, vy);
  vec2 toMouse = pos - uMouse;
  float spot = exp(-dot(toMouse, toMouse) / max(uRadius * uRadius, 1.0) * 1.6) * uSpotlight * uPresence;
  vec2 center = uResolution * 0.5;
  float reach = length(center);
  float shown = 0.0;
  if (uReveal > 0.0) {
    shown = smoothstep(uReveal * (reach + uCellSize * 2.0), uReveal * (reach + uCellSize * 2.0) - uCellSize * 2.0, length(pos - center));
  }
  shown = uReveal >= 1.0 ? 1.0 : shown;
  float fade = 1.0;
  if (uEdgeFade > 0.0) {
    vec2 norm = pos / uResolution;
    vec2 a = clamp(norm / uEdgeFade, 0.0, 1.0);
    vec2 b = clamp((1.0 - norm) / uEdgeFade, 0.0, 1.0);
    vec2 sa = a * a * a * (a * (a * 6.0 - 15.0) + 10.0);
    vec2 sb = b * b * b * (b * (b * 6.0 - 15.0) + 10.0);
    fade = sa.x * sa.y * sb.x * sb.y;
  }
  float own = level(cell);
  float gridAlpha = mark * min(uGridOpacity + spot * 0.45, 1.0) * fade * shown;
  float litAlpha = 0.0;
  float fillAlpha = 0.0;
  vec2 side = step(0.5, f) * 2.0 - 1.0;
  float nx = level(cell + vec2(side.x, 0.0));
  float ny = level(cell + vec2(0.0, side.y));
  float nc = level(cell + side);
  float ex = max(own, nx);
  float ey = max(own, ny);
  float joint = max(max(ex, ey), nc);
  float lit = max(vx * (edge.y < uLineWidth ? joint : ex), vy * (edge.x < uLineWidth ? joint : ey));
  if (uGridStyle == 2) lit = vx * joint;
  litAlpha = lit * uMaxOpacity * fade;
  fillAlpha = own * uFillOpacity * fade;
  float cellAlpha = clamp(max(litAlpha, fillAlpha), 0.0, 1.0);
  float alpha = cellAlpha + gridAlpha * (1.0 - cellAlpha);
  vec3 premul = uColor * cellAlpha + uGridColor * gridAlpha * (1.0 - cellAlpha);
  outColor = vec4(premul, alpha);
}`;

type GridSettings = {
  cellSize: number;
  color: string;
  gridColor: string;
  radius: number;
  falloff: Falloff;
  highlight: Highlight;
  holdTime: number;
  fadeDuration: number;
  lineWidth: number;
  maxOpacity: number;
  fillOpacity: number;
  gridOpacity: number;
  gridStyle: number;
  spotlight: number;
  clickPulse: boolean;
  pulseSpeed: number;
  ambient: number;
  edgeFade: number;
  intro: boolean;
  dpr?: number;
};

type ShaderProgram = {
  program: WebGLProgram;
  uniforms: Record<string, WebGLUniformLocation | null>;
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function colorToRgb(color: string): [number, number, number] {
  let hex = color.trim().replace(/^#/, "");
  if (hex.length === 3) hex = hex.split("").map((part) => part + part).join("");
  const parsed = Number.parseInt(hex.slice(0, 6), 16);
  if (!Number.isFinite(parsed)) return [1, 1, 1];
  return [((parsed >> 16) & 255) / 255, ((parsed >> 8) & 255) / 255, (parsed & 255) / 255];
}

function compileShader(gl: WebGL2RenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader;
  gl.deleteShader(shader);
  return null;
}

function createProgram(gl: WebGL2RenderingContext): ShaderProgram | null {
  const vertex = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
  const fragment = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
  const program = gl.createProgram();
  if (!vertex || !fragment || !program) return null;
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program);
    return null;
  }
  const uniforms: ShaderProgram["uniforms"] = {};
  const count = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS) as number;
  for (let index = 0; index < count; index += 1) {
    const info = gl.getActiveUniform(program, index);
    if (info) uniforms[info.name] = gl.getUniformLocation(program, info.name);
  }
  return { program, uniforms };
}

export default function CursorGrid({
  cellSize = 60,
  color,
  gridColor,
  radius = 140,
  falloff = "smooth",
  highlight = "area",
  holdTime = 400,
  fadeDuration = 800,
  lineWidth = 1,
  maxOpacity = 1,
  fillOpacity = 0.06,
  gridOpacity = 0.08,
  gridStyle = "lines",
  spotlight = 0.6,
  clickPulse = true,
  pulseSpeed = 600,
  ambient = 0,
  edgeFade = 0.2,
  intro = true,
  lightMode = false,
  dpr,
  className = "",
  style,
}: CursorGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wakeRef = useRef<(() => void) | null>(null);
  const settingsRef = useRef<GridSettings>({
    cellSize: Math.max(8, cellSize),
    color: color ?? (lightMode ? "#18181b" : "#ffffff"),
    gridColor: gridColor ?? (lightMode ? "#18181b" : "#ffffff"),
    radius: Math.max(1, radius),
    falloff,
    highlight,
    holdTime: Math.max(0, holdTime),
    fadeDuration: Math.max(16, fadeDuration),
    lineWidth: Math.max(0.25, lineWidth),
    maxOpacity: clamp(maxOpacity, 0, 1),
    fillOpacity: clamp(fillOpacity, 0, 1),
    gridOpacity: clamp(gridOpacity, 0, 1),
    gridStyle: GRID_STYLES[gridStyle],
    spotlight: clamp(spotlight, 0, 1),
    clickPulse,
    pulseSpeed: Math.max(1, pulseSpeed),
    ambient: clamp(ambient, 0, 1),
    edgeFade: clamp(edgeFade, 0, 0.5),
    intro,
    dpr,
  });
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;
    const gl = canvas.getContext("webgl2", {
      alpha: true,
      premultipliedAlpha: true,
      antialias: false,
      depth: false,
      stencil: false,
    });
    if (!gl) return;
    const shader = createProgram(gl);
    if (!shader) return;
    const { program, uniforms: u } = shader;
    const vao = gl.createVertexArray();
    const stateTexture = gl.createTexture();
    if (!vao || !stateTexture) {
      gl.deleteProgram(program);
      return;
    }

    gl.bindTexture(gl.TEXTURE_2D, stateTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const view = { width: 1, height: 1, ratio: 1, cellSize: 0 };
    const grid = { cols: 0, rows: 0, offsetX: 0, offsetY: 0 };
    const pointer = { x: 0, y: 0, inside: false };
    const mouse = { x: 0, y: 0 };
    const pulses: Array<{ x: number; y: number; started: number }> = [];
    let levels = new Float32Array(0);
    let targets = new Float32Array(0);
    let touched = new Float32Array(0);
    let pixels = new Uint8Array(0);
    let presence = 0;
    let clock = 0;
    let reveal = settingsRef.current.intro && !reducedMotion ? 0 : 1;
    let frameId = 0;
    let lastFrame = 0;
    let visible = true;
    let dirty = true;

    const lightCell = (index: number, value: number) => {
      if (value > targets[index]) targets[index] = value;
      touched[index] = clock;
    };

    const energize = (x: number, y: number) => {
      const settings = settingsRef.current;
      const size = settings.cellSize;
      if (settings.highlight === "cell") {
        const col = Math.floor((x - grid.offsetX) / size);
        const row = Math.floor((y - grid.offsetY) / size);
        if (col >= 0 && row >= 0 && col < grid.cols && row < grid.rows) {
          lightCell(row * grid.cols + col, 1);
        }
        return;
      }
      const minCol = Math.max(0, Math.floor((x - settings.radius - grid.offsetX) / size));
      const maxCol = Math.min(grid.cols - 1, Math.floor((x + settings.radius - grid.offsetX) / size));
      const minRow = Math.max(0, Math.floor((y - settings.radius - grid.offsetY) / size));
      const maxRow = Math.min(grid.rows - 1, Math.floor((y + settings.radius - grid.offsetY) / size));
      const curve = FALL_OFFS[settings.falloff];
      for (let row = minRow; row <= maxRow; row += 1) {
        for (let col = minCol; col <= maxCol; col += 1) {
          const centerX = grid.offsetX + col * size + size / 2;
          const centerY = grid.offsetY + row * size + size / 2;
          const distance = Math.hypot(centerX - x, centerY - y);
          if (distance <= settings.radius) {
            lightCell(row * grid.cols + col, curve(1 - distance / settings.radius));
          }
        }
      }
    };

    const rebuild = () => {
      const settings = settingsRef.current;
      view.width = Math.max(1, container.clientWidth);
      view.height = Math.max(1, container.clientHeight);
      view.ratio = Math.min(settings.dpr ?? window.devicePixelRatio ?? 1, 1.5);
      canvas.width = Math.max(1, Math.round(view.width * view.ratio));
      canvas.height = Math.max(1, Math.round(view.height * view.ratio));
      const cols = Math.ceil(view.width / settings.cellSize) + 1;
      const rows = Math.ceil(view.height / settings.cellSize) + 1;
      const resized = cols !== grid.cols || rows !== grid.rows || settings.cellSize !== view.cellSize;
      grid.cols = cols;
      grid.rows = rows;
      grid.offsetX = (view.width - cols * settings.cellSize) / 2;
      grid.offsetY = (view.height - rows * settings.cellSize) / 2;
      view.cellSize = settings.cellSize;
      if (resized) {
        const count = cols * rows;
        levels = new Float32Array(count);
        targets = new Float32Array(count);
        touched = new Float32Array(count).fill(-1e9);
        pixels = new Uint8Array(count);
        gl.bindTexture(gl.TEXTURE_2D, stateTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8, cols, rows, 0, gl.RED, gl.UNSIGNED_BYTE, pixels);
      }
      dirty = true;
    };

    const draw = () => {
      const settings = settingsRef.current;
      const ratio = view.ratio;
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(program);
      gl.bindVertexArray(vao);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, stateTexture);
      if (dirty) {
        for (let index = 0; index < levels.length; index += 1) {
          pixels[index] = Math.round(clamp(levels[index], 0, 1) * 255);
        }
        gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, grid.cols, grid.rows, gl.RED, gl.UNSIGNED_BYTE, pixels);
        dirty = false;
      }
      gl.uniform1i(u.uState, 0);
      gl.uniform2f(u.uResolution, canvas.width, canvas.height);
      gl.uniform2f(u.uOffset, grid.offsetX * ratio, grid.offsetY * ratio);
      gl.uniform1f(u.uCellSize, settings.cellSize * ratio);
      gl.uniform2i(u.uCells, grid.cols, grid.rows);
      gl.uniform3fv(u.uColor, colorToRgb(settings.color));
      gl.uniform3fv(u.uGridColor, colorToRgb(settings.gridColor));
      gl.uniform1f(u.uLineWidth, settings.lineWidth * ratio);
      gl.uniform1f(u.uMaxOpacity, settings.maxOpacity);
      gl.uniform1f(u.uFillOpacity, settings.fillOpacity);
      gl.uniform1f(u.uGridOpacity, settings.gridOpacity);
      gl.uniform1i(u.uGridStyle, GRID_STYLES[gridStyle]);
      gl.uniform2f(u.uMouse, mouse.x * ratio, mouse.y * ratio);
      gl.uniform1f(u.uRadius, settings.radius * ratio);
      gl.uniform1f(u.uSpotlight, settings.spotlight);
      gl.uniform1f(u.uPresence, presence);
      gl.uniform1f(u.uEdgeFade, settings.edgeFade);
      gl.uniform1f(u.uReveal, reveal >= 1 ? 1 : 1 - (1 - reveal) ** 2.2);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.bindVertexArray(null);
    };

    const wake = () => {
      if (!frameId && visible && !document.hidden) {
        lastFrame = 0;
        frameId = requestAnimationFrame(animate);
      }
    };

    const animate = (now: number) => {
      frameId = 0;
      if (!visible || document.hidden) return;
      const settings = settingsRef.current;
      const delta = lastFrame ? clamp((now - lastFrame) / 1000, 0, 1 / 20) : 1 / 60;
      lastFrame = now;
      clock += delta;
      if (reveal < 1) reveal = Math.min(1, reveal + delta / INTRO_SECONDS);
      const follow = 1 - Math.exp(-delta / 0.07);
      mouse.x += (pointer.x - mouse.x) * follow;
      mouse.y += (pointer.y - mouse.y) * follow;
      const presenceTarget = pointer.inside ? 1 : 0;
      presence += (presenceTarget - presence) * (1 - Math.exp(-delta / 0.25));

      const size = settings.cellSize;
      const far = Math.hypot(view.width, view.height);
      for (let pulseIndex = pulses.length - 1; pulseIndex >= 0; pulseIndex -= 1) {
        const pulse = pulses[pulseIndex];
        const ringRadius = (clock - pulse.started) * settings.pulseSpeed;
        if (ringRadius > far + size * 4) {
          pulses.splice(pulseIndex, 1);
          continue;
        }
        const outer = ringRadius + size;
        const minCol = Math.max(0, Math.floor((pulse.x - outer - grid.offsetX) / size));
        const maxCol = Math.min(grid.cols - 1, Math.floor((pulse.x + outer - grid.offsetX) / size));
        const minRow = Math.max(0, Math.floor((pulse.y - outer - grid.offsetY) / size));
        const maxRow = Math.min(grid.rows - 1, Math.floor((pulse.y + outer - grid.offsetY) / size));
        for (let row = minRow; row <= maxRow; row += 1) {
          for (let col = minCol; col <= maxCol; col += 1) {
            const cx = grid.offsetX + col * size + size / 2;
            const cy = grid.offsetY + row * size + size / 2;
            const distance = Math.abs(Math.hypot(cx - pulse.x, cy - pulse.y) - ringRadius);
            if (distance < size * 1.5) {
              const strength = Math.exp(-((distance / size) ** 2)) * clamp(1 - ringRadius / (far + size), 0, 1);
              lightCell(row * grid.cols + col, strength);
            }
          }
        }
      }
      if (settings.ambient > 0 && !reducedMotion && levels.length) {
        const spawnCount = settings.ambient * delta * levels.length * 0.04;
        const spawns = Math.floor(spawnCount) + (Math.random() < spawnCount % 1 ? 1 : 0);
        for (let index = 0; index < spawns; index += 1) {
          lightCell(Math.floor(Math.random() * levels.length), 0.25 + Math.random() * 0.45);
        }
      }

      const hold = settings.holdTime / 1000;
      const fade = delta / (settings.fadeDuration / 1000);
      const attack = 1 - Math.exp(-delta / 0.045);
      let active = pulses.length > 0 || reveal < 1 || Math.abs(presence - presenceTarget) > 0.002;
      for (let index = 0; index < levels.length; index += 1) {
        let target = targets[index];
        if (target <= 0 && levels[index] <= 0) continue;
        if (clock - touched[index] > hold) target = Math.max(0, target - fade);
        targets[index] = target;
        const previous = levels[index];
        levels[index] = target > previous ? previous + (target - previous) * attack : target;
        if (levels[index] < 0.002) levels[index] = 0;
        if (levels[index] !== previous) dirty = true;
        if (levels[index] > 0 || target > 0) active = true;
      }
      if (Math.abs(mouse.x - pointer.x) + Math.abs(mouse.y - pointer.y) > 0.05 && presence > 0.002) active = true;
      if (settings.ambient > 0 && !reducedMotion) active = true;
      draw();
      if (active) frameId = requestAnimationFrame(animate);
    };

    const locate = (event: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
        inside:
          event.clientX >= rect.left &&
          event.clientX <= rect.right &&
          event.clientY >= rect.top &&
          event.clientY <= rect.bottom,
      };
    };
    const onPointerMove = (event: PointerEvent) => {
      const location = locate(event);
      const wasInside = pointer.inside;
      pointer.inside = location.inside;
      if (!location.inside) {
        if (wasInside) wake();
        return;
      }
      pointer.x = location.x;
      pointer.y = location.y;
      if (!wasInside) {
        mouse.x = location.x;
        mouse.y = location.y;
      }
      energize(location.x, location.y);
      dirty = true;
      wake();
    };
    const onPointerDown = (event: PointerEvent) => {
      if (!settingsRef.current.clickPulse || reducedMotion) return;
      const location = locate(event);
      if (!location.inside) return;
      pulses.push({ x: location.x, y: location.y, started: clock });
      wake();
    };
    const onPointerLeave = () => {
      pointer.inside = false;
      wake();
    };
    const onVisibilityChange = () => wake();
    const resizeObserver = new ResizeObserver(() => {
      rebuild();
      draw();
      wake();
    });
    const intersectionObserver = new IntersectionObserver((entries) => {
      visible = entries.some((entry) => entry.isIntersecting);
      if (visible) wake();
      else if (frameId) {
        cancelAnimationFrame(frameId);
        frameId = 0;
      }
    });

    resizeObserver.observe(container);
    intersectionObserver.observe(container);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerdown", onPointerDown, { passive: true });
    document.documentElement.addEventListener("pointerleave", onPointerLeave);
    document.addEventListener("visibilitychange", onVisibilityChange);
    rebuild();
    draw();
    wakeRef.current = wake;
    wake();

    return () => {
      if (frameId) cancelAnimationFrame(frameId);
      wakeRef.current = null;
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerdown", onPointerDown);
      document.documentElement.removeEventListener("pointerleave", onPointerLeave);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      gl.deleteTexture(stateTexture);
      gl.deleteVertexArray(vao);
      gl.deleteProgram(program);
    };
  }, [gridStyle]);

  useEffect(() => {
    settingsRef.current = {
      cellSize: Math.max(8, cellSize),
      color: color ?? (lightMode ? "#18181b" : "#ffffff"),
      gridColor: gridColor ?? (lightMode ? "#18181b" : "#ffffff"),
      radius: Math.max(1, radius),
      falloff,
      highlight,
      holdTime: Math.max(0, holdTime),
      fadeDuration: Math.max(16, fadeDuration),
      lineWidth: Math.max(0.25, lineWidth),
      maxOpacity: clamp(maxOpacity, 0, 1),
      fillOpacity: clamp(fillOpacity, 0, 1),
      gridOpacity: clamp(gridOpacity, 0, 1),
      gridStyle: GRID_STYLES[gridStyle],
      spotlight: clamp(spotlight, 0, 1),
      clickPulse,
      pulseSpeed: Math.max(1, pulseSpeed),
      ambient: clamp(ambient, 0, 1),
      edgeFade: clamp(edgeFade, 0, 0.5),
      intro,
      dpr,
    };
    wakeRef.current?.();
  }, [
    cellSize,
    color,
    gridColor,
    radius,
    falloff,
    highlight,
    holdTime,
    fadeDuration,
    lineWidth,
    maxOpacity,
    fillOpacity,
    gridOpacity,
    gridStyle,
    spotlight,
    clickPulse,
    pulseSpeed,
    ambient,
    edgeFade,
    intro,
    lightMode,
    dpr,
  ]);

  return (
    <div
      ref={containerRef}
      className={`cursor-grid${className ? ` ${className}` : ""}`}
      style={style}
      aria-hidden="true"
    >
      <canvas ref={canvasRef} className="cursor-grid__canvas" />
    </div>
  );
}
