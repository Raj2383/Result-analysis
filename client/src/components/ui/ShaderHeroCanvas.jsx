import { useEffect, useRef } from 'react';

const VERTEX_SHADER_SRC = `
attribute vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER_SRC = `
precision highp float;
uniform float u_time;
uniform vec2 u_resolution;
uniform vec2 u_mouse;

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution.xy;
  vec2 p = (gl_FragCoord.xy * 2.0 - u_resolution.xy) / min(u_resolution.x, u_resolution.y);

  // Smooth mouse influence
  vec2 m = (u_mouse - 0.5) * 0.4;
  p += m * (0.8 - length(p) * 0.3);

  float t = u_time * 0.28;

  // Domain warping with harmonic sinusoidal waves
  float w1 = sin(p.x * 2.2 + t) + cos(p.y * 1.8 - t * 0.7);
  float w2 = sin(p.y * 2.4 + t * 1.1 + w1 * 0.6) + cos(p.x * 1.9 - t * 0.5);
  float w3 = sin(length(p + vec2(w1, w2) * 0.35) * 2.8 - t * 1.3);

  // ResultLens Palette: Deep Navy, University Blue, Indigo, Cyan Accent, Purple Hint
  vec3 darkNavy = vec3(0.04, 0.08, 0.18);
  vec3 brandBlue = vec3(0.11, 0.27, 0.62);
  vec3 royalIndigo = vec3(0.24, 0.32, 0.82);
  vec3 cyanGlow = vec3(0.08, 0.68, 0.82);
  vec3 purpleAccent = vec3(0.48, 0.22, 0.75);

  float f1 = smoothstep(-1.4, 1.4, w1);
  float f2 = smoothstep(-1.3, 1.3, w2);
  float f3 = smoothstep(-0.9, 0.9, w3);

  vec3 color = mix(darkNavy, brandBlue, f1);
  color = mix(color, royalIndigo, f2 * 0.75);
  color = mix(color, cyanGlow, f3 * 0.38);
  color += purpleAccent * max(0.0, sin(uv.x * 3.14159 + t * 0.6) * 0.22);

  // Radial subtle vignette
  float vig = smoothstep(1.7, 0.35, length(uv - 0.5));
  color *= (0.75 + 0.25 * vig);

  gl_FragColor = vec4(color, 0.95);
}
`;

function createShader(gl, type, source) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function createProgram(gl, vsSrc, fsSrc) {
  const vs = createShader(gl, gl.VERTEX_SHADER, vsSrc);
  const fs = createShader(gl, gl.FRAGMENT_SHADER, fsSrc);
  if (!vs || !fs) return null;
  const program = gl.createProgram();
  if (!program) return null;
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program);
    return null;
  }
  return program;
}

export default function ShaderHeroCanvas({ className = '' }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return;

    const program = createProgram(gl, VERTEX_SHADER_SRC, FRAGMENT_SHADER_SRC);
    if (!program) return;

    const posBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    );

    const posAttr = gl.getAttribLocation(program, 'a_position');
    const uTime = gl.getUniformLocation(program, 'u_time');
    const uRes = gl.getUniformLocation(program, 'u_resolution');
    const uMouse = gl.getUniformLocation(program, 'u_mouse');

    let animId;
    let startTime = performance.now();
    let mouse = { x: 0.5, y: 0.5, targetX: 0.5, targetY: 0.5 };
    let isVisible = true;

    const handleResize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.floor(rect.width * dpr);
      const height = Math.floor(rect.height * dpr);
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        gl.viewport(0, 0, width, height);
      }
    };

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        mouse.targetX = (e.clientX - rect.left) / rect.width;
        mouse.targetY = 1.0 - (e.clientY - rect.top) / rect.height;
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    handleResize();

    const observer = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;
    });
    observer.observe(canvas);

    const render = (now) => {
      if (isVisible) {
        // Smooth mouse lerping
        mouse.x += (mouse.targetX - mouse.x) * 0.05;
        mouse.y += (mouse.targetY - mouse.y) * 0.05;

        gl.useProgram(program);
        gl.enableVertexAttribArray(posAttr);
        gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
        gl.vertexAttribPointer(posAttr, 2, gl.FLOAT, false, 0, 0);

        const elapsed = (now - startTime) / 1000.0;
        gl.uniform1f(uTime, elapsed);
        gl.uniform2f(uRes, canvas.width, canvas.height);
        gl.uniform2f(uMouse, mouse.x, mouse.y);

        gl.drawArrays(gl.TRIANGLES, 0, 6);
      }
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      observer.disconnect();
      if (posBuffer) gl.deleteBuffer(posBuffer);
      if (program) gl.deleteProgram(program);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full pointer-events-none rounded-2xl ${className}`}
      style={{ opacity: 0.95 }}
      aria-hidden="true"
    />
  );
}
