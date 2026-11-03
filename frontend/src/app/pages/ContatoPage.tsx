import { useTerminology, useSite } from "../config/SiteContext";
import { whatsappLink, instagramLink } from "../config/links";
import { BrandLogo } from "../components/BrandLogo";
import React from "react";
import { Link } from "react-router";
import { MapPin, Phone, Mail, Clock, Instagram } from "lucide-react";
import { useBrand } from "../context/BrandContext";

export function ContatoPage() {
  const copy = useTerminology();
  const site = useSite();
  const { name, whatsappNumber, instagramHandle } = useBrand();
  const whatsappUrl = whatsappLink(whatsappNumber);
  const instagramUrl = instagramLink(instagramHandle);

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-brand-100">
      <header className="bg-white/95 shadow-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3">
              <BrandLogo size="header" />
              <div>
                <h1 className="text-xl font-bold text-brand-700">{name}</h1>
                <p className="text-xs text-brand-600">{site.identity.tagline}</p>
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-8">
              <Link
                to="/"
                className="text-gray-600 font-medium hover:text-brand-700 transition-colors"
              >
                Home
              </Link>
              <Link
                to={"/tratamentos"}
                className="text-gray-600 font-medium hover:text-brand-700 transition-colors"
              >
                {copy(" Tratamentos ")}
              </Link>
              <Link
                to="/sobre"
                className="text-gray-600 font-medium hover:text-brand-700 transition-colors"
              >
                Sobre
              </Link>
              <Link
                to="/contato"
                className="text-brand-700 font-medium hover:text-brand-600 transition-colors"
              >
                Contato
              </Link>
            </nav>

            <div className="flex items-center gap-4">
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
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-brand-800 mb-4">
            {site.content.pageHeadings.contactTitle}
          </h1>
          <p className="text-lg text-gray-600">{site.content.pageHeadings.contactIntro}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            {[
              {
                label: "Endereço",
                lines: site.contact.address,
                icon: MapPin,
              },
              {
                label: "Telefone",
                lines: [site.contact.phone].filter(Boolean),
                icon: Phone,
              },
              {
                label: "E-mail",
                lines: [site.contact.email].filter(Boolean),
                icon: Mail,
              },
              {
                label: "Horário de Funcionamento",
                lines: site.contact.hours,
                icon: Clock,
              },
            ]
              .filter((card) => card.lines.length > 0)
              .map((card) => (
                <div
                  key={card.label}
                  className="bg-white rounded-2xl p-6 shadow-lg border border-brand-100"
                >
                  <div className="flex gap-4">
                    <div className="w-12 h-12 bg-brand-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <card.icon className="w-6 h-6 text-brand-700" />
                    </div>
                    <div>
                      <h3 className="font-bold text-brand-800 mb-2">{card.label}</h3>
                      <p className="text-gray-600 leading-relaxed">
                        {card.lines.map((line, index) => (
                          <React.Fragment key={index}>
                            {index > 0 && <br />}
                            {line}
                          </React.Fragment>
                        ))}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
          </div>

          {whatsappUrl && (
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-brand-100 flex flex-col items-center justify-center text-center h-fit lg:sticky lg:top-24">
              <h2 className="text-3xl font-bold text-brand-800 mb-4">
                {site.content.contactPageTitle}
              </h2>
              <p className="text-gray-600 mb-8">{site.content.contactPageIntro}</p>
              {whatsappUrl && (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-8 py-4 bg-[#00c950] text-white text-lg font-medium rounded-lg shadow-lg hover:bg-[#00b347] transition-all hover:scale-105"
                >
                  <svg className="w-6 h-6" fill="white" viewBox="0 0 24 24">
                    <path d="M12.015 0h-.03C5.4 0 0 5.4 0 12.015c0 2.66 1.09 5.12 2.85 6.9L.97 24l5.31-1.56c1.66.98 3.6 1.56 5.73 1.56C18.64 24 24 18.64 24 12.015 24 5.4 18.64 0 12.015 0zm6.74 16.96c-.28.8-1.66 1.47-2.34 1.56-.62.09-1.42.12-2.29-.14-.53-.16-.9-.33-1.71-.68-3.4-1.47-5.62-4.91-5.79-5.14-.17-.23-1.4-1.86-1.4-3.56 0-1.69.89-2.53 1.2-2.87.31-.34.68-.42.91-.42.23 0 .46 0 .66.01.21.01.49-.08.77.59.28.69.97 2.36 1.05 2.53.08.17.14.37.03.6-.11.23-.17.37-.34.57-.17.2-.36.44-.51.59-.17.17-.34.36-.15.7.2.34.87 1.44 1.87 2.33 1.29 1.15 2.38 1.51 2.72 1.68.34.17.54.14.73-.09.2-.23.85-.99 1.08-1.33.23-.34.46-.28.77-.17.31.11 1.99.94 2.33 1.11.34.17.57.25.65.39.08.14.08.81-.2 1.62z" />
                  </svg>
                  Agendar pelo WhatsApp
                </a>
              )}
            </div>
          )}
        </div>
      </main>

      <footer className="border-t border-brand-200 py-8 mt-16">
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
