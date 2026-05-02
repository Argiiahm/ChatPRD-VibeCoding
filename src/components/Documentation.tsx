import React from 'react';
import { motion } from 'framer-motion';
import { 
  Key, 
  Settings, 
  Sparkles, 
  RotateCcw, 
  Download, 
  Copy, 
  ExternalLink,
  BookOpen,
  X
} from 'lucide-react';

interface DocumentationProps {
  isOpen: boolean;
  onClose: () => void;
}

const Documentation: React.FC<DocumentationProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-[#1E1D1B] border border-[#3A3834] rounded-3xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="p-6 border-b border-[#3A3834] flex items-center justify-between bg-[#1E1D1B]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#D4A373]/10 rounded-xl flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-[#D4A373]" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">Documentation</h2>
              <p className="text-[13px] text-[#88857F]">Learn how to get the most out of ChatPRD</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-[#2B2A27] rounded-full transition-colors text-[#88857F] hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-10 custom-scrollbar">
          
          {/* Section 1: API Key */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-[#D4A373]">
              <Key className="w-5 h-5" />
              <h3 className="font-semibold text-lg">1. Ambil API Key (Gratis)</h3>
            </div>
            <div className="bg-[#2B2A27]/50 border border-[#3A3834] rounded-2xl p-5 space-y-4">
              <p className="text-[14px] text-[#EBEBE6] leading-relaxed">
                ChatPRD menggunakan model Gemini AI dari Google. Anda bisa mendapatkan API key secara gratis untuk penggunaan pribadi.
              </p>
              <ol className="space-y-3">
                <li className="flex gap-3 text-[13px] text-[#88857F]">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#3A3834] text-white flex items-center justify-center text-[11px]">1</span>
                  <span>Kunjungi <a href="https://aistudio.google.com/" target="_blank" rel="noopener noreferrer" className="text-[#D4A373] hover:underline inline-flex items-center gap-1">Google AI Studio <ExternalLink className="w-3 h-3" /></a></span>
                </li>
                <li className="flex gap-3 text-[13px] text-[#88857F]">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#3A3834] text-white flex items-center justify-center text-[11px]">2</span>
                  <span>Klik tombol <strong>"Get API key"</strong> di sidebar kiri.</span>
                </li>
                <li className="flex gap-3 text-[13px] text-[#88857F]">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#3A3834] text-white flex items-center justify-center text-[11px]">3</span>
                  <span>Salin API key yang muncul.</span>
                </li>
              </ol>
            </div>
          </section>

          {/* Section 2: Configuration */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-[#D4A373]">
              <Settings className="w-5 h-5" />
              <h3 className="font-semibold text-lg">2. Konfigurasi</h3>
            </div>
            <div className="bg-[#2B2A27]/50 border border-[#3A3834] rounded-2xl p-5 space-y-3 text-[14px] text-[#EBEBE6]">
              <p>Setelah mendapatkan API key, masukkan ke dalam aplikasi:</p>
              <ul className="space-y-2 list-disc list-inside text-[#88857F] text-[13px]">
                <li>Klik ikon <Settings className="w-3 h-3 inline" /> <strong>Settings</strong> di pojok kiri bawah.</li>
                <li>Tempel (Paste) API key Anda di kolom yang tersedia.</li>
                <li>Pilih model (disarankan <code>gemini-1.5-flash</code> untuk kecepatan).</li>
                <li>Klik <strong>Save</strong>.</li>
              </ul>
            </div>
          </section>

          {/* Section 3: Usage */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-[#D4A373]">
              <Sparkles className="w-5 h-5" />
              <h3 className="font-semibold text-lg">3. Cara Penggunaan</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-[#2B2A27]/50 border border-[#3A3834] rounded-2xl p-4 space-y-2">
                <h4 className="text-[14px] font-medium text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#D4A373]" /> Generate Baru
                </h4>
                <p className="text-[12px] text-[#88857F]">Ketik ide produk Anda di input box. Gunakan Template (SaaS, Mobile, dll) untuk hasil lebih spesifik.</p>
              </div>
              <div className="bg-[#2B2A27]/50 border border-[#3A3834] rounded-2xl p-4 space-y-2">
                <h4 className="text-[14px] font-medium text-white flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 text-[#D4A373]" /> Revisi PRD
                </h4>
                <p className="text-[12px] text-[#88857F]">Setelah PRD muncul, Anda bisa meminta revisi (maks. 2 kali) untuk memperbaiki detail tertentu.</p>
              </div>
              <div className="bg-[#2B2A27]/50 border border-[#3A3834] rounded-2xl p-4 space-y-2">
                <h4 className="text-[14px] font-medium text-white flex items-center gap-2">
                  <Copy className="w-4 h-4 text-[#D4A373]" /> Copy & Export
                </h4>
                <p className="text-[12px] text-[#88857F]">Gunakan tombol <Copy className="w-3 h-3 inline" /> untuk copy ke clipboard atau <Download className="w-3 h-3 inline" /> untuk download sebagai file Markdown (.md).</p>
              </div>
              <div className="bg-[#2B2A27]/50 border border-[#3A3834] rounded-2xl p-4 space-y-2">
                <h4 className="text-[14px] font-medium text-white flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-[#D4A373]" /> Flow Diagram
                </h4>
                <p className="text-[12px] text-[#88857F]">Aplikasi secara otomatis membuat diagram alur (Mermaid) berdasarkan PRD yang dibuat.</p>
              </div>
            </div>
          </section>

        </div>

        {/* Footer */}
        <div className="p-6 border-t border-[#3A3834] bg-[#2B2A27]/30 flex justify-center">
          <button 
            onClick={onClose}
            className="px-8 py-2.5 bg-[#D4A373] text-[#1E1D1B] font-semibold rounded-xl hover:bg-[#e5b485] transition-all shadow-lg"
          >
            Mulai Sekarang
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default Documentation;
