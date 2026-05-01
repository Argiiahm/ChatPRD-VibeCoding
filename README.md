# 🚀 ChatPRD — AI-Powered PRD Generator

ChatPRD adalah aplikasi web modern yang membantu Product Manager dan Developer membuat **Product Requirement Document (PRD)** secara instan menggunakan kekuatan AI (Google Gemini). Aplikasi ini tidak hanya menghasilkan teks PRD yang terstruktur, tetapi juga membuat diagram flowchart otomatis menggunakan Mermaid.js.

## ✨ Fitur Utama

- **🤖 AI PRD Generation**: Hasilkan PRD lengkap (Objective, Features, User Flow, Database Schema) hanya dari satu baris ide produk.
- **📊 Auto-Flowchart**: Menghasilkan diagram alur proses secara otomatis menggunakan Mermaid.js (v11).
- **🔄 Revision System**: Lakukan revisi pada PRD yang sudah dibuat (maksimal 2 revisi per proyek) melalui interface chat yang simpel.
- **📂 Persistent History**: Semua proyek Anda tersimpan secara otomatis di browser (`localStorage`) dan tidak akan hilang saat halaman di-refresh.
- **📱 Fully Responsive**: Tampilan premium yang nyaman digunakan di Desktop maupun HP.
- **📥 Export Markdown**: Unduh hasil PRD dalam format `.md` yang siap dipindahkan ke GitHub, Notion, atau Jira.
- **🎨 Modern UI/UX**: Desain minimalis dengan Dark Mode, Glassmorphism, dan animasi halus menggunakan Framer Motion.

## 🛠️ Tech Stack

- **Framework**: [React](https://reactjs.org/) + [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **AI Engine**: [Google Gemini AI SDK](https://ai.google.dev/)
- **Diagrams**: [Mermaid.js](https://mermaid.js.org/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)

## 🚀 Cara Install

Ikuti langkah-langkah di bawah ini untuk menjalankan project di komputer lokal Anda:

### 1. Clone Repository
```bash
git clone https://github.com/username/chat-prd.git
cd chat-prd
```

### 2. Install Dependensi
Pastikan Anda sudah menginstal [Node.js](https://nodejs.org/).
```bash
npm install
```

### 3. Jalankan Aplikasi
```bash
npm run dev
```
Aplikasi akan berjalan di `http://localhost:5173`.

### 4. Konfigurasi API Key
1. Buka aplikasi di browser.
2. Klik ikon **Settings** (⚙️) di pojok kiri bawah (atau tombol Menu di HP).
3. Masukkan **Gemini API Key** Anda.
   > Anda bisa mendapatkan API Key secara gratis di [Google AI Studio](https://aistudio.google.com/).
4. Klik **Save** dan Anda siap mulai membuat PRD!

## 📖 Cara Penggunaan

1. **New Project**: Masukkan ide produk Anda di input box (contoh: "Aplikasi rental mobil listrik").
2. **Template**: Gunakan chip template (SaaS, Mobile App, dll) untuk membantu AI memberikan output yang lebih spesifik.
3. **Generate**: Klik ikon kirim dan tunggu AI membuatkan PRD dan Diagram untuk Anda.
4. **Revise**: Jika ada yang kurang pas, ketik permintaan revisi di input chat yang sama (contoh: "Tambahkan fitur payment gateway Stripe").
5. **Version Control**: Gunakan tab di atas hasil PRD untuk berpindah antar versi (Original vs Revisions).
6. **Download**: Klik ikon download untuk menyimpan file sebagai `.md`.

## 🤝 Kontribusi
Kontribusi selalu terbuka! Silakan fork repository ini dan buat pull request, atau buka issue jika Anda menemukan bug.

## 📄 Lisensi
Project ini di bawah lisensi MIT.

---
Dibuat dengan ❤️ untuk para Product Manager.
