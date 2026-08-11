/**
 * StegX Binary Rain Effect — v2.0 Enhanced Rewrite
 *
 * Features:
 *  - Intensity variation based on active operations
 *  - Color shift effects (green ↔ cyan transition)
 *  - Density adjustment based on performance mode
 *  - Smoother digit flicker animation
 *  - Trail fade effect for falling digits
 */
import * as THREE from 'three';

export class BinaryRain {
  constructor(scene, columns = 40, quality = 'high') {
    this.scene = scene;
    this.baseColumns = columns;
    // Adjust density based on quality
    this.columns = quality === 'low' ? Math.floor(columns * 0.3) :
                   quality === 'medium' ? Math.floor(columns * 0.5) : columns;
    this.drops = [];
    this.mesh = null;
    this.count = 0;
    this._intensity = 1.0;
    this._colorShift = 0.0; // 0 = green, 1 = cyan
    this._init();
  }

  _init() {
    // Create canvas texture with 0 and 1
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, 64, 64);
    ctx.font = 'bold 48px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#00FF88';
    ctx.fillText('0', 16, 32);
    ctx.fillText('1', 48, 32);

    const texture = new THREE.CanvasTexture(canvas);
    texture.repeat.set(0.5, 1);

    // Create rain drops
    this.count = this.columns * 20;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(this.count * 3);
    const uvOffsets = new Float32Array(this.count);
    const opacities = new Float32Array(this.count);

    const spreadX = 800;
    const spreadY = 600;
    const spreadZ = 400;

    for (let i = 0; i < this.count; i++) {
      positions[i * 3]     = (Math.random() - 0.5) * spreadX;
      positions[i * 3 + 1] = (Math.random() - 0.5) * spreadY;
      positions[i * 3 + 2] = (Math.random() - 0.5) * spreadZ - 200;

      uvOffsets[i] = Math.random() > 0.5 ? 0.5 : 0.0;
      opacities[i] = Math.random() * 0.5 + 0.1;

      this.drops.push({
        speed: Math.random() * 1.5 + 0.5,
        baseSpeed: Math.random() * 1.5 + 0.5,
        resetY: 300 + Math.random() * 200,
        flickerRate: Math.random() * 0.005 + 0.001,
        trailAlpha: Math.random() * 0.3 + 0.7,
      });
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('uvOffset', new THREE.BufferAttribute(uvOffsets, 1));
    geo.setAttribute('opacity',  new THREE.BufferAttribute(opacities, 1));

    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uTexture:    { value: texture },
        uTime:       { value: 0 },
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
        uIntensity:  { value: 1.0 },
        uColorShift: { value: 0.0 },
      },
      vertexShader: `
        attribute float uvOffset;
        attribute float opacity;
        varying float vUvOffset;
        varying float vOpacity;
        varying float vDist;
        uniform float uTime;
        uniform float uPixelRatio;

        void main() {
          vUvOffset = uvOffset;
          vOpacity  = opacity;
          vec4 mv   = modelViewMatrix * vec4(position, 1.0);
          vDist     = -mv.z;
          gl_PointSize = 12.0 * uPixelRatio * (200.0 / -mv.z);
          gl_PointSize = clamp(gl_PointSize, 2.0, 16.0);
          gl_Position  = projectionMatrix * mv;
        }
      `,
      fragmentShader: `
        uniform sampler2D uTexture;
        uniform float uIntensity;
        uniform float uColorShift;
        varying float vUvOffset;
        varying float vOpacity;
        varying float vDist;

        void main() {
          vec2 uv = gl_PointCoord;
          uv.x = uv.x * 0.5 + vUvOffset;
          vec4 texColor = texture2D(uTexture, uv);

          float fade  = smoothstep(800.0, 200.0, vDist);
          float alpha = texColor.g * vOpacity * fade * uIntensity;

          // Color shift: green (0) → cyan (1)
          vec3 greenColor = vec3(0.0, 0.9, 0.53);
          vec3 cyanColor  = vec3(0.0, 0.9, 1.0);
          vec3 color = mix(greenColor, cyanColor, uColorShift + vDist / 1200.0);

          gl_FragColor = vec4(color, alpha * 0.6);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    this.mesh = new THREE.Points(geo, mat);
    this.scene.add(this.mesh);
  }

  /**
   * Set rain intensity (0.0 to 2.0).
   * Higher intensity = faster, brighter rain.
   */
  setIntensity(value) {
    this._intensity = Math.max(0, Math.min(2, value));
  }

  /**
   * Set color shift (0 = green, 1 = cyan).
   */
  setColorShift(value) {
    this._colorShift = Math.max(0, Math.min(1, value));
  }

  update(time) {
    if (!this.mesh) return;

    const pos  = this.mesh.geometry.attributes.position.array;
    const opac = this.mesh.geometry.attributes.opacity.array;
    const uvs  = this.mesh.geometry.attributes.uvOffset.array;

    this.mesh.material.uniforms.uTime.value = time;
    this.mesh.material.uniforms.uIntensity.value = this._intensity;
    this.mesh.material.uniforms.uColorShift.value = this._colorShift;

    for (let i = 0; i < this.count; i++) {
      // Speed influenced by intensity
      const speed = this.drops[i].baseSpeed * this._intensity;
      pos[i * 3 + 1] -= speed;

      // Trail fade: particles get dimmer as they fall lower
      const yNorm = (pos[i * 3 + 1] + 300) / 600; // 0 at bottom, 1 at top
      opac[i] = this.drops[i].trailAlpha * Math.max(0.1, yNorm);

      // Reset when below screen
      if (pos[i * 3 + 1] < -300) {
        pos[i * 3 + 1] = this.drops[i].resetY;
        opac[i] = Math.random() * 0.5 + 0.1;
        this.drops[i].trailAlpha = Math.random() * 0.3 + 0.7;
      }

      // Random digit flicker (rate influenced by intensity)
      if (Math.random() < this.drops[i].flickerRate * this._intensity) {
        uvs[i] = uvs[i] === 0 ? 0.5 : 0;
      }
    }

    this.mesh.geometry.attributes.position.needsUpdate = true;
    this.mesh.geometry.attributes.opacity.needsUpdate  = true;
    this.mesh.geometry.attributes.uvOffset.needsUpdate  = true;
  }

  dispose() {
    if (this.mesh) {
      this.mesh.geometry.dispose();
      this.mesh.material.dispose();
      if (this.mesh.material.uniforms.uTexture.value) {
        this.mesh.material.uniforms.uTexture.value.dispose();
      }
      this.scene.remove(this.mesh);
      this.mesh = null;
    }
  }
}
