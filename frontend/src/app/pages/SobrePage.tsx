import { useTerminology } from "../config/SiteContext";
import { SiteIcon } from "../components/SiteIcon";
import { useSite } from "../config/SiteContext";
import { whatsappLink, instagramLink } from "../config/links";
import { BrandLogo } from "../components/BrandLogo";
import React from "react";
import { Link } from "react-router";
import { Instagram } from "lucide-react";
import { useBrand } from "../context/BrandContext";
export function SobrePage() {
  const copy = useTerminology();
  const site = useSite();
  const { name, whatsappNumber, instagramHandle } = useBrand();
  const whatsappUrl = whatsappLink(whatsappNumber);
  const instagramUrl = instagramLink(instagramHandle);
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-brand-100">
      {/* Header */}
      <header className="bg-white/95 shadow-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3">
              <BrandLogo size="header" />
              <div>
                <h1 className="text-xl font-bold text-brand-700">{name}</h1>
                <p className="text-xs text-brand-600">
                  {site.identity.tagline}
                </p>
              </div>
            </Link>

            {/* Navigation */}
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
                className="text-brand-700 font-medium hover:text-brand-600 transition-colors"
              >
                Sobre
              </Link>
              <Link
                to="/contato"
                className="text-gray-600 font-medium hover:text-brand-700 transition-colors"
              >
                Contato
              </Link>
            </nav>

            {/* Social Links */}
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

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-16">
        {/* Title Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-brand-800 mb-4">
            {site.content.pageHeadings.aboutTitle}
          </h1>
          <p className="text-lg text-gray-600">
            {site.content.pageHeadings.aboutIntro}
          </p>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          {/* Mission Text */}
          {(site.content.about.missionTitle ||
            site.content.about.paragraphs.length > 0) && (
            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-brand-800">
                {site.content.about.missionTitle}
              </h2>
              {site.content.about.paragraphs.map((paragraph) => (
                <p key={paragraph} className="text-gray-600 leading-relaxed">
                  {paragraph}
                </p>
              ))}
            </div>
          )}

          {/* Values Grid */}
          <div className="grid grid-cols-2 gap-4">
            {site.content.about.values.map((value) => {
              return (
                <div
                  key={value.title}
                  className="bg-white rounded-2xl p-6 shadow-lg border border-brand-100"
                >
                  <div className="w-12 h-12 bg-brand-100 rounded-full flex items-center justify-center mb-4">
                    <SiteIcon
                      name={value.icon}
                      className="w-6 h-6 text-brand-700"
                    />
                  </div>
                  <h3 className="font-bold text-brand-800 mb-2">
                    {value.title}
                  </h3>
                  <p className="text-sm text-gray-600">{value.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-brand-200 py-8">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-center text-sm text-gray-500">
            © {new Date().getFullYear()} {name}
            {site.identity.tagline && <> - {site.identity.tagline}</>}.{" "}
            {site.content.footer}
          </p>
        </div>
      </footer>
    </div>
  );
}
