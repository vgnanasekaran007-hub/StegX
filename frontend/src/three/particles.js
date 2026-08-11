/**
 * StegX Particle System — v2.0 Enhanced Rewrite
 *
 * Features:
 *  - Connection lines between nearby particles
 *  - Mouse interaction (particles react to cursor proximity)
 *  - Color transitions synced with page context
 *  - Performance-based particle count adjustment
 *  - Improved shader with time-based glow pulsing
 */
import * as THREE from 'three';

export class ParticleSystem {
  constructor(scene, count = 3000, quality = 'high') {
    this.scene = scene;
    this.baseCount = count;
    // Adjust particle count based on quality
    this.count = quality === 'low' ? Math.floor(count * 0.3) :
                 quality === 'medium' ? Math.floor(count * 0.6) : count;
    this.particles = null;
    this.connections = null;
    this.velocities = [];
    this.mouse3D = new THREE.Vector3(0, 0, 200);
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
        origX: 0, origY: 0, origZ: 0,
      });
      // Store original positions for mouse repulsion reset
      this.velocities[i].origX = positions[i * 3];
      this.velocities[i].origY = positions[i * 3 + 1];
      this.velocities[i].origZ = positions[i * 3 + 2];
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
          vAlpha = smoothstep(800.0, 100.0, dist) * (0.6 + 0.2 * sin(uTime * 0.5 + position.x * 0.01));
          gl_PointSize = size * uPixelRatio * (200.0 / -mv.z);
          gl_PointSize = clamp(gl_PointSize, 0.5, 10.0);
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

    // Connection lines (only for high quality)
    if (this.count <= 1500) {
      this._initConnections();
    }
  }

  _initConnections() {
    const maxConnections = 200;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(maxConnections * 2 * 3);
    const colors = new Float32Array(maxConnections * 2 * 3);
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.setDrawRange(0, 0);

    const mat = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.15,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.connections = new THREE.LineSegments(geo, mat);
    this.scene.add(this.connections);
  }

  /**
   * Update mouse position for particle interaction.
   */
  setMouse(x, y) {
    this.mouse3D.x = x * 400;
    this.mouse3D.y = -y * 300;
  }

  update(time) {
    if (!this.particles) return;

    const pos = this.particles.geometry.attributes.position.array;
    this.particles.material.uniforms.uTime.value = time;

    const mouseInfluenceRadius = 150;
    const mouseRepelForce = 0.8;

    for (let i = 0; i < this.count; i++) {
      const ix = i * 3;
      const iy = i * 3 + 1;
      const iz = i * 3 + 2;

      // Base movement
      pos[ix]  += this.velocities[i].x;
      pos[iy]  += this.velocities[i].y;
      pos[iz]  += this.velocities[i].z;

      // Mouse repulsion effect
      const dx = pos[ix] - this.mouse3D.x;
      const dy = pos[iy] - this.mouse3D.y;
      const dz = pos[iz] - this.mouse3D.z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

      if (dist < mouseInfluenceRadius && dist > 0) {
        const force = (1 - dist / mouseInfluenceRadius) * mouseRepelForce;
        pos[ix] += (dx / dist) * force;
        pos[iy] += (dy / dist) * force;
        pos[iz] += (dz / dist) * force;
      }

      // Wrap around boundaries
      if (pos[ix]  >  600) pos[ix]  = -600;
      if (pos[ix]  < -600) pos[ix]  =  600;
      if (pos[iy]  >  400) pos[iy]  = -400;
      if (pos[iy]  < -400) pos[iy]  =  400;
      if (pos[iz]  >  300) pos[iz]  = -300;
      if (pos[iz]  < -300) pos[iz]  =  300;
    }

    this.particles.geometry.attributes.position.needsUpdate = true;
    this.particles.rotation.y = time * 0.02;

    // Update connection lines
    if (this.connections) {
      this._updateConnections(pos);
    }
  }

  _updateConnections(pos) {
    const connPos = this.connections.geometry.attributes.position.array;
    const connCol = this.connections.geometry.attributes.color.array;
    const maxDist = 80;
    let lineIdx = 0;
    const maxLines = connPos.length / 6;

    // Only check a subset for performance
    const step = Math.max(1, Math.floor(this.count / 200));

    for (let i = 0; i < this.count && lineIdx < maxLines; i += step) {
      for (let j = i + step; j < this.count && lineIdx < maxLines; j += step) {
        const dx = pos[i * 3] - pos[j * 3];
        const dy = pos[i * 3 + 1] - pos[j * 3 + 1];
        const dz = pos[i * 3 + 2] - pos[j * 3 + 2];
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (dist < maxDist) {
          const alpha = 1 - dist / maxDist;
          const ci = lineIdx * 6;

          connPos[ci]     = pos[i * 3];
          connPos[ci + 1] = pos[i * 3 + 1];
          connPos[ci + 2] = pos[i * 3 + 2];
          connPos[ci + 3] = pos[j * 3];
          connPos[ci + 4] = pos[j * 3 + 1];
          connPos[ci + 5] = pos[j * 3 + 2];

          connCol[ci]     = 0;   connCol[ci + 1] = 0.9 * alpha;  connCol[ci + 2] = 1 * alpha;
          connCol[ci + 3] = 0;   connCol[ci + 4] = 0.9 * alpha;  connCol[ci + 5] = 1 * alpha;

          lineIdx++;
        }
      }
    }

    this.connections.geometry.setDrawRange(0, lineIdx * 2);
    this.connections.geometry.attributes.position.needsUpdate = true;
    this.connections.geometry.attributes.color.needsUpdate = true;
  }

  dispose() {
    if (this.particles) {
      this.particles.geometry.dispose();
      this.particles.material.dispose();
      this.scene.remove(this.particles);
      this.particles = null;
    }
    if (this.connections) {
      this.connections.geometry.dispose();
      this.connections.material.dispose();
      this.scene.remove(this.connections);
      this.connections = null;
    }
  }
}
