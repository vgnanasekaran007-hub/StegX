/**
 * StegX Particle System — Rewritten from Scratch
 * Creates floating particle cloud with cyberpunk glow.
 */
import * as THREE from 'three';

export class ParticleSystem {
  constructor(scene, count = 3000) {
    this.scene = scene;
    this.count = count;
    this.particles = null;
    this.velocities = [];
    this._init();
  }

  _init() {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(this.count * 3);
    const colors    = new Float32Array(this.count * 3);
    const sizes     = new Float32Array(this.count);

    const palette = [
      new THREE.Color(0x00e5ff),
      new THREE.Color(0x7b61ff),
      new THREE.Color(0x00ff88),
      new THREE.Color(0x00b8d4),
      new THREE.Color(0x6246ea),
    ];

    for (let i = 0; i < this.count; i++) {
      positions[i * 3]     = (Math.random() - 0.5) * 1200;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 800;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 600;

      const c = palette[Math.floor(Math.random() * palette.length)];
      colors[i * 3]     = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;

      sizes[i] = Math.random() * 3 + 0.5;

      this.velocities.push({
        x: (Math.random() - 0.5) * 0.3,
        y: (Math.random() - 0.5) * 0.3,
        z: (Math.random() - 0.5) * 0.15,
      });
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color',    new THREE.BufferAttribute(colors, 3));
    geo.setAttribute('size',     new THREE.BufferAttribute(sizes, 1));

    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uTime:       { value: 0 },
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
      },
      vertexShader: `
        attribute float size;
        attribute vec3 color;
        varying vec3  vColor;
        varying float vAlpha;
        uniform float uTime;
        uniform float uPixelRatio;

        void main() {
          vColor = color;
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          float dist = length(mv.xyz);
          vAlpha = smoothstep(800.0, 100.0, dist) * 0.8;
          gl_PointSize = size * uPixelRatio * (200.0 / -mv.z);
          gl_PointSize = clamp(gl_PointSize, 0.5, 8.0);
          gl_Position  = projectionMatrix * mv;
        }
      `,
      fragmentShader: `
        varying vec3  vColor;
        varying float vAlpha;

        void main() {
          float d = length(gl_PointCoord - vec2(0.5));
          if (d > 0.5) discard;
          float glow = 1.0 - smoothstep(0.0, 0.5, d);
          glow = pow(glow, 2.0);
          gl_FragColor = vec4(vColor, glow * vAlpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    this.particles = new THREE.Points(geo, mat);
    this.scene.add(this.particles);
  }

  update(time) {
    if (!this.particles) return;

    const pos = this.particles.geometry.attributes.position.array;
    this.particles.material.uniforms.uTime.value = time;

    for (let i = 0; i < this.count; i++) {
      pos[i * 3]     += this.velocities[i].x;
      pos[i * 3 + 1] += this.velocities[i].y;
      pos[i * 3 + 2] += this.velocities[i].z;

      // Wrap around
      if (pos[i * 3]     >  600) pos[i * 3]     = -600;
      if (pos[i * 3]     < -600) pos[i * 3]     =  600;
      if (pos[i * 3 + 1] >  400) pos[i * 3 + 1] = -400;
      if (pos[i * 3 + 1] < -400) pos[i * 3 + 1] =  400;
      if (pos[i * 3 + 2] >  300) pos[i * 3 + 2] = -300;
      if (pos[i * 3 + 2] < -300) pos[i * 3 + 2] =  300;
    }

    this.particles.geometry.attributes.position.needsUpdate = true;
    this.particles.rotation.y = time * 0.02;
  }

  dispose() {
    if (this.particles) {
      this.particles.geometry.dispose();
      this.particles.material.dispose();
      this.scene.remove(this.particles);
      this.particles = null;
    }
  }
}
