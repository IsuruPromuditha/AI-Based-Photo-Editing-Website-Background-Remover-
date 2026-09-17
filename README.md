# AI-Based Photo Editing & Background Remover

[![GitHub Repo](https://img.shields.io/badge/GitHub-AI--Based--Photo--Editing--Website--Background--Remover--blue?logo=github)](https://github.com/IsuruPromuditha/AI-Based-Photo-Editing-Website-Background-Remover-)

A modern, full-stack photo editing and background removal web application built with **React**, **TypeScript**, **Tailwind CSS**, and **Express**. It provides instant local edge-detection segmentation, magic wand color selection, Gemini AI-powered background removal, image transformations, and project management.

- **Repository**: [https://github.com/IsuruPromuditha/AI-Based-Photo-Editing-Website-Background-Remover-](https://github.com/IsuruPromuditha/AI-Based-Photo-Editing-Website-Background-Remover-)

---

## ✨ Features

- **Background Removal**:
  - **Auto Removal**: Intelligent client-side edge and color segmentation using Sobel gradient operators and color delta thresholds.
  - **Magic Wand Tool**: Click to sample and erase contiguous color regions with customizable tolerance.
  - **Brush & Eraser**: Manual precision touch-up tools with configurable brush size, softness, and opacity.
  - **AI Background Removal**: Server-side integration with Gemini API to intelligently extract foreground subjects.
- **Image Transformations & Effects**:
  - Crop (Freeform, 1:1 Square, 4:3, 16:9, 9:16).
  - Flip horizontally and vertically.
  - Rotate 90° clockwise or counter-clockwise.
  - Filters & adjustments: Brightness, Contrast, Saturation, Blur, and Defringe.
- **Background Replacement**:
  - Transparent PNG background.
  - Solid studio colors (White, Studio Gray, Charcoal, Blue, Mint, Lavender, etc.).
  - Custom gradient presets and custom backdrop colors.
- **Multi-Image & Project Management**:
  - Organize work into projects with persistent local storage.
  - Batch upload multiple photos with thumbnail previews.
  - Quick-switch between images in your project.
  - One-click deletion of individual images and entire projects.
- **Export Options**:
  - Download high-resolution PNG (transparent or with background).
  - JPEG export with quality selection.
  - Copy directly to clipboard as PNG.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Lucide Icons, Motion
- **Backend**: Node.js, Express, tsx
- **Build Tool**: Vite 6, esbuild
- **Canvas / Image Processing**: HTML5 Canvas API, Sobel Edge Filters, Flood Fill Segmentation
- **AI**: Google Gen AI SDK (`@google/genai`)

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: v18+ or v20+ LTS recommended
- **npm** or **yarn**

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/IsuruPromuditha/AI-Based-Photo-Editing-Website-Background-Remover-.git
   cd AI-Based-Photo-Editing-Website-Background-Remover-
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```
   > *Note for Windows users*: If you see `@rollup/rollup-win32-x64-msvc` missing, run:
   > ```bash
   > npm install -D @rollup/rollup-win32-x64-msvc
   > ```

3. **Configure Environment Variables**:
   Copy the example environment configuration:
   ```bash
   cp .env.example .env
   ```
   Add your Gemini API key (optional for remote AI features):
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. **Start Development Server**:
   ```bash
   npm run dev
   ```
   Open your browser and navigate to `http://localhost:3000`.

---

## 📦 Scripts

- `npm run dev` - Starts the full-stack Express + Vite development server on port 3000.
- `npm run build` - Builds the client assets with Vite and bundles the backend server with esbuild.
- `npm run start` - Runs the production server from `dist/server.cjs`.
- `npm run lint` - Runs TypeScript type checking without emitting files.

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
