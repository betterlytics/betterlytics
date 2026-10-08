'use client';

import { useEffect, useRef } from 'react';
import { useReducedMotion } from 'motion/react';
import { useInView } from '@/landing/hooks/useInView';

const MAX_DPR = 2;
const FPS = 15;

/* sRGB hex to a linear GLSL vec3 */
const lin = (hex: string) =>
  `vec3(${[1, 3, 5]
    .map((i) => {
      const v = parseInt(hex.slice(i, i + 2), 16) / 255;
      return (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4).toFixed(4);
    })
    .join(',')})`;
const BASE = lin('#1a2bd1');
const MID = lin('#3572ff');
const PEAK = lin('#a2d4ff');
const LINE = lin('#f2f5ff');

const VERT = `attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}`;

/* Card px, y down. The light sits on the bloom's box; the hatch matches .card::before (10px tiles at 315deg).
   The --glow-light images in voltCard.module.css are this light at t=0; regenerate them when it changes. */
const FRAG = `precision highp float;
uniform vec2 uRes;
uniform float uDpr;
uniform vec2 uSize;
uniform vec2 uCenter;
uniform vec2 uRadius;
uniform float uTime;
uniform float uCore;

float hash(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
float noise(float x){float i=floor(x);float f=fract(x);float u=f*f*(3.-2.*f);return mix(hash(vec2(i,1.)),hash(vec2(i+1.,1.)),u);}
float band(float u,float h){return clamp(min(u+h,1.)-max(u-h,0.),0.,2.*h)/(2.*h);}

void main(){
  vec2 p=vec2(gl_FragCoord.x,uRes.y-gl_FragCoord.y)/uDpr;
  vec2 q=(p-uCenter)/uRadius;
  float breathe=1.+.12*sin(uTime*.785);

  float a=atan(q.x,max(-q.y,.001));
  float rays=.82+.18*noise(a*7.+uTime*.15)*noise(a*13.-uTime*.1+3.);
  float up=max(-q.y,0.);

  float horizon=exp(-pow(q.x/(.55*breathe),2.)-pow(q.y/.28,2.));
  float halo=exp(-2.*dot(q*vec2(.9,1.15),q*vec2(.9,1.15)))*rays;
  float wash=exp(-.5*dot(q*vec2(.7,1.),q*vec2(.7,1.)));
  float beam=exp(-pow(a/.75,2.))*exp(-up*.9)*smoothstep(0.,.25,up)*rays;
  float L=breathe*(uCore*2.8*horizon+.9*halo+.05*wash+.2*beam);

  float u=fract(-(p.x+p.y)/10.)*7.0711;
  float h=.5/uDpr;
  float line=band(u,h)+band(u-7.0711,h);
  vec2 m=(p-uSize*vec2(.5,.95))/(uSize*1.05);
  float mask=(1.-smoothstep(.5,1.,length(m)))*smoothstep(0.,.09,p.x/uSize.x)*smoothstep(1.,.91,p.x/uSize.x);
  float lit=line*(.045*mask+.3*smoothstep(.15,1.8,L));

  float g=1.-exp(-L*1.15);
  vec3 c=mix(${BASE},${MID},smoothstep(0.,.55,g));
  c=mix(c,${PEAK},smoothstep(.45,1.,g));
  c=mix(c,${LINE},lit);
  c=mix(12.92*c,1.055*pow(c,vec3(1./2.4))-.055,step(.0031308,c));
  c+=(hash(gl_FragCoord.xy+fract(uTime))-.5)/255.;
  gl_FragColor=vec4(c,1.);
}`;

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const s = gl.createShader(type)!;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  return s;
}

export function VoltGlow({ className }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const onScreen = useInView(ref, 'onScreen');
  const reduced = useReducedMotion();
  const drawRef = useRef<FrameRequestCallback | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    const card = canvas?.parentElement;
    const bloom = card?.querySelector<HTMLElement>('[data-bloom]');
    const gl = canvas?.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'low-power' });
    if (!canvas || !card || !bloom || !gl) return;

    const prog = gl.createProgram()!;
    gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);

    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    const u = (name: string) => gl.getUniformLocation(prog, name);
    const [uRes, uDpr, uSize, uCenter, uRadius, uTime, uCore] = [
      'uRes',
      'uDpr',
      'uSize',
      'uCenter',
      'uRadius',
      'uTime',
      'uCore',
    ].map(u);

    const start = performance.now();
    const draw = (now: number) => {
      gl.uniform1f(uTime, (now - start) / 1000);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      canvas.dataset.ready = '';
    };
    drawRef.current = draw;

    const measure = () => {
      const dpr = Math.min(MAX_DPR, window.devicePixelRatio || 1);
      const c = card.getBoundingClientRect();
      const b = bloom.getBoundingClientRect();
      canvas.width = Math.round(c.width * dpr);
      canvas.height = Math.round(c.height * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uDpr, dpr);
      gl.uniform2f(uSize, c.width, c.height);
      gl.uniform2f(uCenter, b.left - c.left + b.width / 2, b.top - c.top + b.height / 2);
      gl.uniform2f(uRadius, b.width / 2, b.height / 2);
      gl.uniform1f(uCore, parseFloat(getComputedStyle(bloom).getPropertyValue('--glow-core')) || 1);
      draw(performance.now());
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(card);

    const lost = () => {
      drawRef.current = null;
      delete canvas.dataset.ready;
    };
    canvas.addEventListener('webglcontextlost', lost);
    return () => {
      drawRef.current = null;
      ro.disconnect();
      canvas.removeEventListener('webglcontextlost', lost);
    };
  }, []);

  useEffect(() => {
    if (!onScreen || reduced) return;
    let raf = 0;
    let last = 0;
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      if (now - last < 1000 / FPS) return;
      last = now;
      drawRef.current?.(now);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [onScreen, reduced]);

  return <canvas ref={ref} className={className} aria-hidden />;
}
