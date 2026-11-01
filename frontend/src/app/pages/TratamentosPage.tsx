import React from "react";
import { Link } from "react-router";
import { Sparkles, Droplet, Zap, Activity, Instagram } from "lucide-react";
import logo from "../../imports/dayane_logo_white_ilustracao_transparente_limpa.png";
import { useBrand } from "../context/BrandContext";

export function TratamentosPage() {
  const { whatsappNumber, instagramHandle } = useBrand();
  const whatsappUrl = `https://wa.me/${whatsappNumber}`;
  const instagramUrl = `https://instagram.com/${instagramHandle}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-wine-50 via-white to-wine-100">
      {/* Header */}
      <header className="bg-white/95 shadow-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-wine-600 to-wine-800 rounded-full p-2 shadow-lg">
                <img src={logo} alt="Dayane Di Giovanni" className="w-full h-full object-cover rounded-full" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-wine-700">Dayane Di Giovanni</h1>
                <p className="text-xs text-wine-600">Estética e Bem estar</p>
              </div>
            </Link>

            {/* Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              <Link to="/" className="text-gray-600 font-medium hover:text-wine-700 transition-colors">
                Home
              </Link>
              <Link to="/tratamentos" className="text-wine-700 font-medium hover:text-wine-600 transition-colors">
                Tratamentos
              </Link>
              <Link to="/sobre" className="text-gray-600 font-medium hover:text-wine-700 transition-colors">
                Sobre
              </Link>
              <Link to="/contato" className="text-gray-600 font-medium hover:text-wine-700 transition-colors">
                Contato
              </Link>
            </nav>

            {/* Social Links */}
            <div className="flex items-center gap-4">
              <a
                href="{whatsappUrl}"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-[#00c950] rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-all"
                title="WhatsApp"
              >
                <svg className="w-5 h-5" fill="white" viewBox="0 0 20 20">
                  <path d="M10.015 0h-.03C4.489 0 0 4.488 0 10.015c0 2.218.731 4.27 1.97 5.933L.69 20l4.218-1.238A9.957 9.957 0 0010.015 20C15.542 20 20 15.542 20 10.015 20 4.488 15.542 0 10.015 0zm5.637 14.134c-.24.675-1.411 1.233-1.954 1.31-.515.074-1.184.104-1.91-.12-.443-.137-.753-.273-1.428-.565-2.834-1.224-4.684-4.094-4.827-4.283-.143-.189-1.167-1.554-1.167-2.966 0-1.411.739-2.105 1-2.387.262-.282.573-.353.764-.353.19 0 .38.002.546.01.175.008.41-.066.64.488.237.572.805 1.965.875 2.107.07.143.117.31.024.5-.094.19-.141.308-.282.474-.14.165-.295.369-.422.494-.14.142-.287.296-.124.58.164.282.728 1.2 1.563 1.945 1.075.96 1.98 1.258 2.262 1.4.282.14.446.117.61-.071.165-.19.708-.827.898-1.11.19-.282.38-.236.64-.142.262.094 1.658.782 1.943.924.282.142.47.212.54.329.07.118.07.674-.17 1.349z" />
                </svg>
              </a>
              <a
                href="{instagramUrl}"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-gradient-to-br from-[#9810fa] via-[#e60076] to-[#ff6900] rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-all"
                title="Instagram"
              >
                <Instagram className="w-5 h-5 text-white" />
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-16">
        {/* Title Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-wine-800 mb-4">Nossos Tratamentos</h1>
          <p className="text-lg text-gray-600">
            Descubra nossos tratamentos especializados para realçar sua beleza natural
          </p>
        </div>

        {/* Treatments Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-wine-100 hover:shadow-xl transition-all">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-wine-100 rounded-full flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-wine-700" />
              </div>
            </div>
            <h2 className="text-xl font-bold text-wine-800 text-center mb-4">Limpeza de Pele</h2>
            <p className="text-center text-gray-600">
              Tratamento profundo para renovação e limpeza da pele
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-lg border border-wine-100 hover:shadow-xl transition-all">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-wine-100 rounded-full flex items-center justify-center">
                <Droplet className="w-8 h-8 text-wine-700" />
              </div>
            </div>
            <h2 className="text-xl font-bold text-wine-800 text-center mb-4">Hidratação Facial</h2>
            <p className="text-center text-gray-600">
              Hidratação profunda para pele radiante e saudável
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-lg border border-wine-100 hover:shadow-xl transition-all">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-wine-100 rounded-full flex items-center justify-center">
                <Zap className="w-8 h-8 text-wine-700" />
              </div>
            </div>
            <h2 className="text-xl font-bold text-wine-800 text-center mb-4">Peeling</h2>
            <p className="text-center text-gray-600">
              Renovação celular para uma pele mais jovem
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-lg border border-wine-100 hover:shadow-xl transition-all">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-wine-100 rounded-full flex items-center justify-center">
                <Activity className="w-8 h-8 text-wine-700" />
              </div>
            </div>
            <h2 className="text-xl font-bold text-wine-800 text-center mb-4">Tratamentos Corporais</h2>
            <p className="text-center text-gray-600">
              Cuidados especiais para todo o corpo
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-wine-200 py-8 mt-16">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-center text-sm text-gray-500">
            © 2026 Dayane Di Giovanni - Estética e Bem estar. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
