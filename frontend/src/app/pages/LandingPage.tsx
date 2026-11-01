import React from "react";
import { Link, useNavigate } from "react-router";
import {
  Calendar, Sparkles, Heart, Star, Instagram, KeyRound, ChevronRight,
} from "lucide-react";
import defaultLogo from "../../imports/dayane_logo_white_ilustracao_transparente_limpa.png";
import { useBrand } from "../context/BrandContext";
import { useProcedures } from "../context/ProceduresContext";
import { useGallery } from "../context/GalleryContext";

function scrollTo(id: string) {
  return (e: React.MouseEvent) => {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };
}

export function LandingPage() {
  const { name, logoUrl, aboutTitle, aboutParagraph1, aboutParagraph2, aboutParagraph3, whatsappNumber, instagramHandle } = useBrand();
  const logo = logoUrl ?? defaultLogo;
  const whatsappUrl = `https://wa.me/${whatsappNumber}`;
  const instagramUrl = `https://instagram.com/${instagramHandle}`;
  const { procedures } = useProcedures();
  const activeProcedures = procedures.filter((p) => p.status === "Ativo");
  const navigate = useNavigate();
  const { images } = useGallery();

  return (
    <div className="min-h-screen bg-gradient-to-br from-wine-50 via-white to-wine-100">
      {/* Header */}
      <header className="bg-white/95 shadow-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <a href="#hero" onClick={scrollTo("hero")} className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-wine-600 to-wine-800 rounded-full p-2 shadow-lg">
                <img src={logo} alt={name} className="w-full h-full object-cover rounded-full" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-wine-700">{name}</h1>
                <p className="text-xs text-wine-600">Estética e Bem estar</p>
              </div>
            </a>

            {/* Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              <a href="#hero" onClick={scrollTo("hero")} className="text-wine-700 font-medium hover:text-wine-600 transition-colors cursor-pointer">
                Home
              </a>
              <a href="#tratamentos" onClick={scrollTo("tratamentos")} className="text-gray-600 font-medium hover:text-wine-700 transition-colors cursor-pointer">
                Tratamentos
              </a>
              <a href="#sobre" onClick={scrollTo("sobre")} className="text-gray-600 font-medium hover:text-wine-700 transition-colors cursor-pointer">
                Sobre
              </a>
              {images.length > 0 && (
                <a href="#galeria" onClick={scrollTo("galeria")} className="text-gray-600 font-medium hover:text-wine-700 transition-colors cursor-pointer">
                  Galeria
                </a>
              )}
              <a href="#contato" onClick={scrollTo("contato")} className="text-gray-600 font-medium hover:text-wine-700 transition-colors cursor-pointer">
                Contato
              </a>
            </nav>

            {/* Social Links + Acesso Gestão */}
            <div className="flex items-center gap-3">
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
              <Link
                to="/login"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-wine-700 border border-wine-300 rounded-md hover:bg-wine-100 transition-colors"
                title="Faça login na sua conta"
              >
                <KeyRound className="w-3.5 h-3.5" />
                Entrar
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section id="hero" className="max-w-6xl mx-auto px-6 py-20 text-center">
        <div className="flex justify-center mb-8">
          <div className="w-32 h-32 bg-gradient-to-br from-wine-600 to-wine-800 rounded-full p-4 shadow-2xl">
            <img src={logo} alt={name} className="w-full h-full object-cover rounded-full" />
          </div>
        </div>

        <p className="text-2xl text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed">
          Reserve experiências inesquecíveis de beleza e bem-estar com profissionais especializados
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
          <a
            href="#tratamentos"
            onClick={scrollTo("tratamentos")}
            className="px-8 py-4 bg-wine-700 text-white text-lg font-medium rounded-lg shadow-lg hover:bg-wine-600 transition-all hover:scale-105 cursor-pointer"
          >
            Ver tratamentos
          </a>
          <a
            href="#contato"
            onClick={scrollTo("contato")}
            className="px-8 py-4 bg-white text-wine-700 text-lg font-medium rounded-lg border-2 border-wine-200 hover:bg-wine-100 transition-all cursor-pointer"
          >
            Fale conosco
          </a>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-16">
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-wine-100 hover:shadow-xl transition-all">
            <div className="w-12 h-12 bg-wine-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-6 h-6 text-wine-700" />
            </div>
            <h3 className="text-lg font-bold text-wine-800 mb-2">Agendamento fácil</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Reserve seus horários de forma rápida e intuitiva
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-wine-100 hover:shadow-xl transition-all">
            <div className="w-12 h-12 bg-wine-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-6 h-6 text-wine-700" />
            </div>
            <h3 className="text-lg font-bold text-wine-800 mb-2">Profissionais qualificados</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Equipe especializada e apaixonada por beleza
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-wine-100 hover:shadow-xl transition-all">
            <div className="w-12 h-12 bg-wine-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="w-6 h-6 text-wine-700" />
            </div>
            <h3 className="text-lg font-bold text-wine-800 mb-2">Experiência única</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Atendimento personalizado e acolhedor
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-wine-100 hover:shadow-xl transition-all">
            <div className="w-12 h-12 bg-wine-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Star className="w-6 h-6 text-wine-700" />
            </div>
            <h3 className="text-lg font-bold text-wine-800 mb-2">Resultados incríveis</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Realce sua beleza natural com nossos tratamentos
            </p>
          </div>
        </div>
      </section>

      {/* Sobre Section */}
      <section id="sobre" className="bg-wine-50 py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-sm font-semibold text-wine-600 uppercase tracking-widest mb-3 block">
                Sobre nós
              </span>
              <h2 className="text-4xl font-bold text-wine-800 mb-6 leading-tight">
                {aboutTitle}
              </h2>
              {aboutParagraph1 && (
                <p className="text-gray-600 leading-relaxed mb-4">{aboutParagraph1}</p>
              )}
              {aboutParagraph2 && (
                <p className="text-gray-600 leading-relaxed mb-4">{aboutParagraph2}</p>
              )}
              {aboutParagraph3 && (
                <p className="text-gray-600 leading-relaxed">{aboutParagraph3}</p>
              )}
            </div>

            <div className="flex justify-center">
              <div className="relative">
                <div className="w-64 h-64 bg-gradient-to-br from-wine-600 to-wine-800 rounded-full p-6 shadow-2xl flex items-center justify-center">
                  <img src={logo} alt={name} className="w-full h-full object-contain" />
                </div>
                <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-wine-100 rounded-full flex items-center justify-center shadow-lg border-4 border-white">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-wine-700">10+</p>
                    <p className="text-xs text-wine-600 font-medium leading-tight">anos de<br />experiência</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tratamentos Section */}
      <section id="tratamentos" className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <span className="text-sm font-semibold text-wine-600 uppercase tracking-widest mb-3 block">
              Nossos serviços
            </span>
            <h2 className="text-4xl font-bold text-wine-800 mb-4">Tratamentos disponíveis</h2>
            <p className="text-lg text-gray-600 max-w-xl mx-auto">
              Descubra os procedimentos especializados que oferecemos para realçar sua beleza e promover seu bem-estar.
            </p>
          </div>

          {activeProcedures.length === 0 ? (
            <p className="text-center text-gray-500 py-12">
              Nenhum tratamento disponível no momento.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeProcedures.map((procedure) => (
                <button
                  key={procedure.id}
                  type="button"
                  onClick={() => navigate(`/login?treatmentId=${procedure.id}`)}
                  className="group bg-white rounded-2xl p-7 shadow-md border border-wine-100 hover:shadow-xl hover:border-wine-300 hover:-translate-y-1 transition-all text-left cursor-pointer w-full"
                >
                  <div className="w-14 h-14 bg-wine-100 group-hover:bg-wine-200 rounded-xl flex items-center justify-center mb-5 transition-colors">
                    <Sparkles className="w-7 h-7 text-wine-700" />
                  </div>
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-bold text-wine-800 leading-snug flex-1">
                      {procedure.name}
                    </h3>
                    <ChevronRight className="w-4 h-4 text-wine-500 opacity-0 group-hover:opacity-100 transition-opacity mt-1 ml-1 flex-shrink-0" />
                  </div>
                  <span className="inline-block text-xs font-medium text-wine-600 bg-wine-100 px-2 py-0.5 rounded mb-3">
                    {procedure.category}
                  </span>
                  {procedure.description ? (
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {procedure.description}
                    </p>
                  ) : null}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Galeria Section */}
      {images.length > 0 && (
        <section id="galeria" className="py-20 bg-white">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-14">
              <span className="text-sm font-semibold text-wine-600 uppercase tracking-widest mb-3 block">
                Galeria
              </span>
              <h2 className="text-4xl font-bold text-wine-800 mb-4">Nossa galeria</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {images.map((img) => (
                <div
                  key={img.id}
                  className="group relative aspect-square rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all"
                >
                  <img
                    src={img.url}
                    alt={img.title ?? "Galeria"}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {img.title && (
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-white text-xs font-medium">{img.title}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Contato Section */}
      <section id="contato" className="bg-gradient-to-br from-wine-600 to-wine-800 py-20">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <span className="text-sm font-semibold text-wine-300 uppercase tracking-widest mb-3 block">
            Entre em contato
          </span>
          <h2 className="text-4xl font-bold text-white mb-4">Pronta para começar?</h2>
          <p className="text-wine-200 text-lg mb-10 max-w-xl mx-auto leading-relaxed">
            Agende uma avaliação gratuita e descubra o tratamento ideal para você. Estamos aqui para te atender.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="{whatsappUrl}"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-8 py-4 bg-[#00c950] text-white text-lg font-medium rounded-lg shadow-lg hover:brightness-110 transition-all hover:scale-105"
            >
              <svg className="w-6 h-6" fill="white" viewBox="0 0 20 20">
                <path d="M10.015 0h-.03C4.489 0 0 4.488 0 10.015c0 2.218.731 4.27 1.97 5.933L.69 20l4.218-1.238A9.957 9.957 0 0010.015 20C15.542 20 20 15.542 20 10.015 20 4.488 15.542 0 10.015 0zm5.637 14.134c-.24.675-1.411 1.233-1.954 1.31-.515.074-1.184.104-1.91-.12-.443-.137-.753-.273-1.428-.565-2.834-1.224-4.684-4.094-4.827-4.283-.143-.189-1.167-1.554-1.167-2.966 0-1.411.739-2.105 1-2.387.262-.282.573-.353.764-.353.19 0 .38.002.546.01.175.008.41-.066.64.488.237.572.805 1.965.875 2.107.07.143.117.31.024.5-.094.19-.141.308-.282.474-.14.165-.295.369-.422.494-.14.142-.287.296-.124.58.164.282.728 1.2 1.563 1.945 1.075.96 1.98 1.258 2.262 1.4.282.14.446.117.61-.071.165-.19.708-.827.898-1.11.19-.282.38-.236.64-.142.262.094 1.658.782 1.943.924.282.142.47.212.54.329.07.118.07.674-.17 1.349z" />
              </svg>
              Agendar pelo WhatsApp
            </a>
            <a
              href="{instagramUrl}"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-8 py-4 bg-white/10 text-white text-lg font-medium rounded-lg border border-white/30 hover:bg-white/20 transition-all"
            >
              <Instagram className="w-5 h-5" />
              Ver no Instagram
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-wine-200 py-8 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-center text-sm text-gray-500">
            © 2026 {name} - Estética e Bem estar. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
