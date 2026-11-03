import { useTerminology, useSite } from "../config/SiteContext";
import { SiteIcon } from "../components/SiteIcon";
import { whatsappLink, instagramLink } from "../config/links";
import { BrandLogo } from "../components/BrandLogo";
import React from "react";
import { Link, useNavigate } from "react-router";
import { Instagram, KeyRound, ChevronRight } from "lucide-react";
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
  const copy = useTerminology();
  const site = useSite();
  const { name, aboutTitle, aboutParagraphs, whatsappNumber, instagramHandle } = useBrand();
  const whatsappUrl = whatsappLink(whatsappNumber);
  const instagramUrl = instagramLink(instagramHandle);
  const { procedures } = useProcedures();
  const activeProcedures = procedures.filter((p) => p.status === "Ativo");
  const navigate = useNavigate();
  const { images } = useGallery();

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-brand-100">
      <header className="bg-white/95 shadow-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <a href="#hero" onClick={scrollTo("hero")} className="flex items-center gap-3">
              <BrandLogo size="header" />
              <div>
                <h1 className="text-xl font-bold text-brand-700">{name}</h1>
                <p className="text-xs text-brand-600">{site.identity.tagline}</p>
              </div>
            </a>

            <nav className="hidden md:flex items-center gap-8">
              <a
                href="#hero"
                onClick={scrollTo("hero")}
                className="text-brand-700 font-medium hover:text-brand-600 transition-colors cursor-pointer"
              >
                Home
              </a>
              <a
                href={"#tratamentos"}
                onClick={scrollTo("tratamentos")}
                className="text-gray-600 font-medium hover:text-brand-700 transition-colors cursor-pointer"
              >
                {copy(" Tratamentos ")}
              </a>
              {(aboutTitle || aboutParagraphs.some(Boolean)) && (
                <a
                  href="#sobre"
                  onClick={scrollTo("sobre")}
                  className="text-gray-600 font-medium hover:text-brand-700 transition-colors cursor-pointer"
                >
                  Sobre
                </a>
              )}
              {images.length > 0 && (
                <a
                  href="#galeria"
                  onClick={scrollTo("galeria")}
                  className="text-gray-600 font-medium hover:text-brand-700 transition-colors cursor-pointer"
                >
                  Galeria
                </a>
              )}
              {(whatsappUrl || instagramUrl) && (
                <a
                  href="#contato"
                  onClick={scrollTo("contato")}
                  className="text-gray-600 font-medium hover:text-brand-700 transition-colors cursor-pointer"
                >
                  Contato
                </a>
              )}
            </nav>

            <div className="flex items-center gap-3">
              {whatsappUrl && (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-[#00c950] rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-all"
                  title="WhatsApp"
                >
                  <svg className="w-5 h-5" fill="white" viewBox="0 0 20 20">
                    <path d="M10.015 0h-.03C4.489 0 0 4.488 0 10.015c0 2.218.731 4.27 1.97 5.933L.69 20l4.218-1.238A9.957 9.957 0 0010.015 20C15.542 20 20 15.542 20 10.015 20 4.488 15.542 0 10.015 0zm5.637 14.134c-.24.675-1.411 1.233-1.954 1.31-.515.074-1.184.104-1.91-.12-.443-.137-.753-.273-1.428-.565-2.834-1.224-4.684-4.094-4.827-4.283-.143-.189-1.167-1.554-1.167-2.966 0-1.411.739-2.105 1-2.387.262-.282.573-.353.764-.353.19 0 .38.002.546.01.175.008.41-.066.64.488.237.572.805 1.965.875 2.107.07.143.117.31.024.5-.094.19-.141.308-.282.474-.14.165-.295.369-.422.494-.14.142-.287.296-.124.58.164.282.728 1.2 1.563 1.945 1.075.96 1.98 1.258 2.262 1.4.282.14.446.117.61-.071.165-.19.708-.827.898-1.11.19-.282.38-.236.64-.142.262.094 1.658.782 1.943.924.282.142.47.212.54.329.07.118.07.674-.17 1.349z" />
                  </svg>
                </a>
              )}
              {instagramUrl && (
                <a
                  href={instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-gradient-to-br from-[#9810fa] via-[#e60076] to-[#ff6900] rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-all"
                  title="Instagram"
                >
                  <Instagram className="w-5 h-5 text-white" />
                </a>
              )}
              <Link
                to="/login"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-brand-700 border border-brand-300 rounded-md hover:bg-brand-100 transition-colors"
                title="Faça login na sua conta"
              >
                <KeyRound className="w-3.5 h-3.5" />
                Entrar
              </Link>
            </div>
          </div>
        </div>
      </header>

      <section id="hero" className="max-w-6xl mx-auto px-6 py-20 text-center">
        <div className="flex justify-center mb-8">
          <BrandLogo size="hero" />
        </div>

        <p className="text-2xl text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed">
          {site.content.hero}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
          <a
            href={"#tratamentos"}
            onClick={scrollTo("tratamentos")}
            className="px-8 py-4 bg-brand-700 text-white text-lg font-medium rounded-lg shadow-lg hover:bg-brand-600 transition-all hover:scale-105 cursor-pointer"
          >
            {copy(" Ver tratamentos ")}
          </a>
          {(whatsappUrl || instagramUrl) && (
            <a
              href="#contato"
              onClick={scrollTo("contato")}
              className="px-8 py-4 bg-white text-brand-700 text-lg font-medium rounded-lg border-2 border-brand-200 hover:bg-brand-100 transition-all cursor-pointer"
            >
              Fale conosco
            </a>
          )}
        </div>

        {site.content.features.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-16">
            {site.content.features.map((feature) => (
              <div
                key={feature.title}
                className="bg-white rounded-2xl p-6 shadow-lg border border-brand-100 hover:shadow-xl transition-all"
              >
                <div className="w-12 h-12 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <SiteIcon name={feature.icon} className="w-6 h-6 text-brand-700" />
                </div>
                <h3 className="text-lg font-bold text-brand-800 mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      {(aboutTitle || aboutParagraphs.some(Boolean)) && (
        <section id="sobre" className="bg-brand-50 py-20">
          <div className="max-w-6xl mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <span className="text-sm font-semibold text-brand-600 uppercase tracking-widest mb-3 block">
                  Sobre nós
                </span>
                <h2 className="text-4xl font-bold text-brand-800 mb-6 leading-tight">
                  {aboutTitle}
                </h2>
                {aboutParagraphs.map(
                  (paragraph, index) =>
                    paragraph && (
                      <p key={index} className="text-gray-600 leading-relaxed mb-4">
                        {paragraph}
                      </p>
                    ),
                )}
              </div>

              <div className="flex justify-center">
                <div className="relative">
                  <BrandLogo size="about" />
                  {site.content.experience.value && (
                    <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-brand-100 rounded-full flex items-center justify-center shadow-lg border-4 border-white">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-brand-700">
                          {site.content.experience.value}
                        </p>
                        <p className="text-xs text-brand-600 font-medium leading-tight">
                          {site.content.experience.label}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      <section id="tratamentos" className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <span className="text-sm font-semibold text-brand-600 uppercase tracking-widest mb-3 block">
              {copy("Nossos serviços")}
            </span>
            <h2 className="text-4xl font-bold text-brand-800 mb-4">{site.content.catalogTitle}</h2>
            <p className="text-lg text-gray-600 max-w-xl mx-auto">{site.content.catalogIntro}</p>
          </div>

          {activeProcedures.length === 0 ? (
            <p className="text-center text-gray-500 py-12">
              {copy(" Nenhum tratamento disponível no momento. ")}
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeProcedures.map((procedure) => (
                <button
                  key={procedure.id}
                  type="button"
                  onClick={() => navigate(`/login?treatmentId=${procedure.id}`)}
                  className="group bg-white rounded-2xl p-7 shadow-md border border-brand-100 hover:shadow-xl hover:border-brand-300 hover:-translate-y-1 transition-all text-left cursor-pointer w-full"
                >
                  <div className="w-14 h-14 bg-brand-100 group-hover:bg-brand-200 rounded-xl flex items-center justify-center mb-5 transition-colors">
                    <SiteIcon name={site.catalog.icon} className="w-7 h-7 text-brand-700" />
                  </div>
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-bold text-brand-800 leading-snug flex-1">
                      {procedure.name}
                    </h3>
                    <ChevronRight className="w-4 h-4 text-brand-500 opacity-0 group-hover:opacity-100 transition-opacity mt-1 ml-1 flex-shrink-0" />
                  </div>
                  <span className="inline-block text-xs font-medium text-brand-600 bg-brand-100 px-2 py-0.5 rounded mb-3">
                    {procedure.category}
                  </span>
                  {procedure.description ? (
                    <p className="text-sm text-gray-600 leading-relaxed">{procedure.description}</p>
                  ) : null}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {images.length > 0 && (
        <section id="galeria" className="py-20 bg-white">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-14">
              <span className="text-sm font-semibold text-brand-600 uppercase tracking-widest mb-3 block">
                Galeria
              </span>
              <h2 className="text-4xl font-bold text-brand-800 mb-4">Nossa galeria</h2>
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

      {(whatsappUrl || instagramUrl) && (
        <section id="contato" className="bg-gradient-to-br from-brand-600 to-brand-800 py-20">
          <div className="max-w-6xl mx-auto px-6 text-center">
            <span className="text-sm font-semibold text-brand-300 uppercase tracking-widest mb-3 block">
              Entre em contato
            </span>
            <h2 className="text-4xl font-bold text-white mb-4">{site.content.contactTitle}</h2>
            <p className="text-brand-200 text-lg mb-10 max-w-xl mx-auto leading-relaxed">
              {site.content.contactIntro}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              {whatsappUrl && (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-8 py-4 bg-[#00c950] text-white text-lg font-medium rounded-lg shadow-lg hover:brightness-110 transition-all hover:scale-105"
                >
                  <svg className="w-6 h-6" fill="white" viewBox="0 0 20 20">
                    <path d="M10.015 0h-.03C4.489 0 0 4.488 0 10.015c0 2.218.731 4.27 1.97 5.933L.69 20l4.218-1.238A9.957 9.957 0 0010.015 20C15.542 20 20 15.542 20 10.015 20 4.488 15.542 0 10.015 0zm5.637 14.134c-.24.675-1.411 1.233-1.954 1.31-.515.074-1.184.104-1.91-.12-.443-.137-.753-.273-1.428-.565-2.834-1.224-4.684-4.094-4.827-4.283-.143-.189-1.167-1.554-1.167-2.966 0-1.411.739-2.105 1-2.387.262-.282.573-.353.764-.353.19 0 .38.002.546.01.175.008.41-.066.64.488.237.572.805 1.965.875 2.107.07.143.117.31.024.5-.094.19-.141.308-.282.474-.14.165-.295.369-.422.494-.14.142-.287.296-.124.58.164.282.728 1.2 1.563 1.945 1.075.96 1.98 1.258 2.262 1.4.282.14.446.117.61-.071.165-.19.708-.827.898-1.11.19-.282.38-.236.64-.142.262.094 1.658.782 1.943.924.282.142.47.212.54.329.07.118.07.674-.17 1.349z" />
                  </svg>
                  Agendar pelo WhatsApp
                </a>
              )}
              {instagramUrl && (
                <a
                  href={instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-8 py-4 bg-white/10 text-white text-lg font-medium rounded-lg border border-white/30 hover:bg-white/20 transition-all"
                >
                  <Instagram className="w-5 h-5" />
                  Ver no Instagram
                </a>
              )}
            </div>
          </div>
        </section>
      )}

      <footer className="border-t border-brand-200 py-8 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-center text-sm text-gray-500">
            © {new Date().getFullYear()} {name}
            {site.identity.tagline && <> - {site.identity.tagline}</>}. {site.content.footer}
          </p>
        </div>
      </footer>
    </div>
  );
}
