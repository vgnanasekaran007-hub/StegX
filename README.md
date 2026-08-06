

<div align="center">

<img src="https://github.com/vgnanasekaran007-hub/StegX/raw/main/assets/cover.png" alt="StegX — hidden data, rendered in 3D" width="100%">

# STEGX
### *Where secrets learn to hide in plain sight.*

<em>A cinematic, AI-assisted steganography studio — encode, encrypt, and visualize hidden data across Image, Audio, Video, and Text in a single immersive 3D workspace.</em>

<br>

[![Live Demo](https://img.shields.io/badge/▶_LAUNCH_STUDIO-steg--x--qjt6.vercel.app-0A0A0A?style=for-the-badge&logo=vercel&logoColor=00FFC2)](https://steg-x-qjt6.vercel.app)

<img src="https://img.shields.io/badge/Three.js-3D_Engine-000000?style=flat-square&logo=three.js&logoColor=white">
<img src="https://img.shields.io/badge/FastAPI-Backend-009688?style=flat-square&logo=fastapi&logoColor=white">
<img src="https://img.shields.io/badge/Vite-Build-646CFF?style=flat-square&logo=vite&logoColor=white">
<img src="https://img.shields.io/badge/OpenCV-Vision-5C3EE8?style=flat-square&logo=opencv&logoColor=white">
<img src="https://img.shields.io/badge/Encryption-AES%20·%20RSA%20·%20ECC%20·%20ChaCha20-critical?style=flat-square">

</div>

<br>

---

## 🎯 The Idea

> Most steganography tools are command-line relics. **StegX treats hidden data as something worth *seeing*** — every embed, every byte, every quality score rendered as a living 3D scene instead of a terminal log.

---

## 🧬 What Makes It Different

<table>
<tr><td width="50%" valign="top">

**🗃️ One Studio, Four Carriers**
Images, audio, video, and text aren't separate tools bolted together — they share one encode/decode pipeline, one UI, one mental model.

**🔒 Encryption Before Embedding, Not After**
Payloads are sealed with real cryptography (AES-128/192/256, RSA, ECC, ChaCha20, Blowfish) *before* they ever touch a pixel or waveform.

</td><td width="50%" valign="top">

**📐 Quality You Can Measure, Not Guess**
Every embed returns PSNR and SSIM scores, so "is this detectable?" has a number attached, not a shrug.

**🌌 A UI That Matches the Subject**
Binary rain, particle fields, and neon glass aren't decoration — they're the visual language of data hiding itself.

</td></tr>
</table>

---

## 🔐 Steganography Engine — Method Matrix

| Carrier | Techniques Available | Best Suited For |
|---|---|---|
| 🖼️ **Image** | LSB · DCT · DWT | High-capacity, low-visibility payloads inside photos and graphics |
| 🔊 **Audio** | Phase Coding · Echo Hiding | Covert data inside voice/music without audible distortion |
| 🎞️ **Video** | Frame-based embedding | Large payloads split across motion frames |
| 📝 **Text** | Linguistic / whitespace encoding | Lightweight, transport-friendly hidden messages |

## 🛡️ Encryption Layer — Cipher Suite

| Cipher | Type | Typical Use Case in StegX |
|---|---|---|
| **AES-128 / 192 / 256** | Symmetric | Default, fast, industry-standard payload sealing |
| **ChaCha20** | Symmetric stream | Speed-optimized alternative to AES on constrained devices |
| **Blowfish** | Symmetric | Legacy/comparative benchmarking |
| **RSA** | Asymmetric | Key exchange & signature-style protection |
| **ECC** | Asymmetric | Smaller keys, equivalent strength, faster handshakes |

## 📊 Quality Scoring — What Gets Measured

| Metric | Measures | Read It As |
|---|---|---|
| **PSNR** *(Peak Signal-to-Noise Ratio)* | Pixel/sample-level distortion from embedding | Higher = closer to the original, harder to detect |
| **SSIM** *(Structural Similarity Index)* | Perceptual/structural similarity post-embed | Closer to 1.0 = visually/aurally indistinguishable |

---

## 🏗️ Architecture at a Glance

```
┌────────────────────────┐        HTTPS / JSON        ┌──────────────────────────┐
│   FRONTEND (Vercel)    │  ─────────────────────────▶ │    BACKEND (Render)     │
│   Vite · Three.js      │  ◀───────────────────────── │    FastAPI · Python     │
│   Chart.js · Glass UI  │      encode / decode /       │  OpenCV · PyCryptodome  │
│                        │      analyze / metrics       │  NumPy · SciPy · SQLite │
└────────────────────────┘                              └──────────────────────────┘
        3D scene, controls, live charts                  Steganography + crypto engine
```

```
StegX/
├── assets/       → showcase media (cover art, screenshots)
├── backend/      → FastAPI service: embedding engines, ciphers, metrics, DB
├── frontend/     → Vite + Three.js SPA: 3D scene, controls, dashboards
├── Procfile      → backend process definition (Render)
├── render.yaml   → backend deployment config (Render)
└── .gitignore
```

---

## ⚡ Quickstart

<table>
<tr><td valign="top" width="50%">

**Backend — FastAPI**
```bash
git clone https://github.com/vgnanasekaran007-hub/StegX.git
cd StegX/backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```
API docs → `http://127.0.0.1:8000/docs`

</td><td valign="top" width="50%">

**Frontend — Vite**
```bash
cd StegX/frontend
npm install
npm run dev
```
Point the API base URL at your backend, local or deployed.

</td></tr>
</table>

---

## ☁️ Shipping It Live

| Layer | Host | Config Source |
|---|---|---|
| Frontend SPA | **Vercel** | `frontend/` — deploy as a static Vite build |
| Backend API | **Render** | `render.yaml` + `Procfile` at repo root |

**→ [See it running now](https://steg-x-qjt6.vercel.app)**

---

## 🗺️ What's Next

- [ ] Public, versioned API reference with live examples
- [ ] PDF and DOCX added as carrier formats
- [ ] Batch encode/decode for multi-file workflows
- [ ] Exportable stego-quality reports (PDF)
- [ ] One-command Docker setup for local dev

---

## 🤝 Contributing

```bash
git checkout -b feature/your-idea
git commit -m "Add your idea"
git push origin feature/your-idea
```
Then open a Pull Request — issues and feature ideas are equally welcome.

---

<div align="center">

## ℹ️ About the Creator

**Gnanasekaran V** — designer & builder of StegX

[![Mail](https://img.shields.io/badge/Email-v.gnanasekaran007%40gmail.com-D14836?style=flat-square&logo=gmail&logoColor=white)](mailto:v.gnanasekaran007@gmail.com)
[![GitHub](https://img.shields.io/badge/GitHub-vgnanasekaran007--hub-181717?style=flat-square&logo=github&logoColor=white)](https://github.com/vgnanasekaran007-hub)

<sub>Licensed under MIT — add a `LICENSE` file to the repo root to make it official.</sub>

</div>
