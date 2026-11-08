import { useTerminology } from "../config/SiteContext";
import { UserProfile } from "../components/UserProfile";
import { GoogleCalendarSettings } from "../components/GoogleCalendarSettings";
import type { Theme } from "../config/types";
import React, { useRef, useState } from "react";
import {
  Phone,
  Palette,
  Upload,
  Check,
  Instagram,
  Images,
  ImageOff,
  X,
  Pencil,
} from "lucide-react";
import { useBrand, COLOR_THEMES } from "../context/BrandContext";
import { useGallery } from "../context/GalleryContext";

export function SettingsPage() {
  const copy = useTerminology();
  const {
    name,
    logoUrl,
    theme,
    aboutTitle,
    aboutParagraphs,
    whatsappNumber,
    instagramHandle,
    updateBrand,
  } = useBrand();
  const { images, addImages, removeImage, updateTitle } = useGallery();
  const [editName, setEditName] = useState(name);
  const [editTheme, setEditTheme] = useState<Theme>(theme);
  const [previewLogo, setPreviewLogo] = useState<string | null>(logoUrl);
  const [editAboutTitle, setEditAboutTitle] = useState(aboutTitle);
  const [editParagraphs, setEditParagraphs] = useState(aboutParagraphs);
  const [editWhatsapp, setEditWhatsapp] = useState(whatsappNumber);
  const [editInstagram, setEditInstagram] = useState(instagramHandle);
  const [saved, setSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
  const [editingTitleValue, setEditingTitleValue] = useState("");

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setPreviewLogo(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    updateBrand({
      name: editName,
      logoUrl: previewLogo,
      theme: editTheme,
      aboutTitle: editAboutTitle,
      aboutParagraphs: editParagraphs,
      whatsappNumber: editWhatsapp,
      instagramHandle: editInstagram,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleGalleryUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    addImages(Array.from(files));
    event.target.value = "";
  };

  const startEditTitle = (id: string, current: string | undefined) => {
    setEditingTitleId(id);
    setEditingTitleValue(current ?? "");
  };

  const handleParagraphChange = (index: number, value: string) => {
    setEditParagraphs((paragraphs) =>
      paragraphs.map((paragraph, paragraphIndex) => (paragraphIndex === index ? value : paragraph)),
    );
  };

  const commitEditTitle = () => {
    if (editingTitleId) {
      updateTitle(editingTitleId, editingTitleValue);
      setEditingTitleId(null);
      setEditingTitleValue("");
    }
  };

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-semibold text-gray-900">Configurações</h1>
        <p className="text-gray-500 mt-1 text-sm md:text-base">Gerencie suas preferências</p>
      </div>

      <div className="space-y-6">
        <div className="space-y-6">
          <UserProfile />

          <GoogleCalendarSettings />

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-9 h-9 rounded-lg bg-brand-100 flex items-center justify-center">
                <Palette className="w-5 h-5 text-brand-600" />
              </div>
              <div>
                <h2 className="text-lg md:text-xl font-semibold text-gray-900">
                  Personalização da Marca
                </h2>
                <p className="text-xs text-gray-500">Adapte o sistema para o seu estabelecimento</p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Nome do estabelecimento
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-400 transition-colors"
                  placeholder="Ex: Studio Beauty"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Logo</label>
                <div className="flex items-center gap-4">
                  {previewLogo && (
                    <div className="w-14 h-14 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden">
                      <img
                        src={previewLogo}
                        alt="Logo preview"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  )}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 px-4 py-2.5 border border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:border-brand-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                  >
                    <Upload className="w-4 h-4" />
                    {previewLogo ? "Trocar logo" : "Enviar logo"}
                  </button>
                  {previewLogo && (
                    <button
                      onClick={() => setPreviewLogo(null)}
                      className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                    >
                      Remover
                    </button>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleLogoUpload}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1.5">
                  PNG, SVG ou JPG. Recomendado: fundo transparente.
                </p>
              </div>

              <div className="pt-2 border-t border-gray-100">
                <p className="text-sm font-semibold text-gray-700 mb-4">Contatos</p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      <span className="flex items-center gap-1.5">
                        <Phone className="w-4 h-4" />
                        Número ou link do WhatsApp
                      </span>
                    </label>
                    <input
                      type="text"
                      value={editWhatsapp}
                      onChange={(e) => setEditWhatsapp(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-400 transition-colors"
                      placeholder="5511987654321"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Número com DDI (ex: 5511987654321) ou link completo do WhatsApp
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      <span className="flex items-center gap-1.5">
                        <Instagram className="w-4 h-4" />
                        Instagram
                      </span>
                    </label>
                    <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-brand-300 focus-within:border-brand-400 transition-colors">
                      <span className="px-3 py-2.5 bg-gray-50 text-gray-400 text-sm border-r border-gray-200 select-none">
                        @
                      </span>
                      <input
                        type="text"
                        value={editInstagram}
                        onChange={(e) => setEditInstagram(e.target.value.replace(/^@/, ""))}
                        className="flex-1 px-3 py-2.5 text-gray-900 text-sm focus:outline-none"
                        placeholder="seuperfil"
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Handle sem o símbolo @</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Tema de cores
                </label>
                {Object.keys(editTheme.palette).length > 0 && (
                  <p className="text-sm text-gray-600 mb-3">Paleta personalizada da variante</p>
                )}
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                  {COLOR_THEMES.map((theme) => (
                    <button
                      key={theme.id}
                      onClick={() =>
                        setEditTheme({
                          preset: theme.id,
                          palette: {},
                        })
                      }
                      className={`relative flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${editTheme.preset === theme.id && !Object.keys(editTheme.palette).length ? "border-gray-800 shadow-md" : "border-transparent hover:border-gray-200"}`}
                    >
                      <div
                        className="w-8 h-8 rounded-full shadow-sm flex items-center justify-center"
                        style={{ backgroundColor: theme.hex }}
                      >
                        {editTheme.preset === theme.id &&
                          !Object.keys(editTheme.palette).length && (
                            <Check className="w-4 h-4 text-white stroke-[2.5]" />
                          )}
                      </div>
                      <span className="text-xs text-gray-600 font-medium">{theme.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-gray-100">
                <p className="text-sm font-semibold text-gray-700 mb-4">Seção "Sobre Nós" (home)</p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Título</label>
                    <input
                      type="text"
                      value={editAboutTitle}
                      onChange={(e) => setEditAboutTitle(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-400 transition-colors"
                      placeholder="Apresente seu negócio"
                    />
                  </div>

                  {editParagraphs.map((paragraph, index) => (
                    <div key={index}>
                      <label
                        htmlFor={`about-paragraph-${index}`}
                        className="block text-sm font-medium text-gray-700 mb-1.5"
                      >
                        Parágrafo {index + 1}
                      </label>
                      <textarea
                        id={`about-paragraph-${index}`}
                        value={paragraph}
                        onChange={(event) => handleParagraphChange(index, event.target.value)}
                        rows={3}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-gray-900 text-sm"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setEditParagraphs((current) => current.filter((_, i) => i !== index))
                        }
                        className="text-sm text-brand-700"
                      >
                        Remover parágrafo
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setEditParagraphs((current) => [...current, ""])}
                    className="text-sm text-brand-700"
                  >
                    Adicionar parágrafo
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={handleSave}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${saved ? "bg-green-600 text-white" : "bg-brand-600 text-white hover:bg-brand-700"}`}
                >
                  {saved ? (
                    <>
                      <Check className="w-4 h-4" />
                      Salvo!
                    </>
                  ) : (
                    "Salvar alterações"
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-brand-100 flex items-center justify-center">
                  <Images className="w-5 h-5 text-brand-600" />
                </div>
                <div>
                  <h2 className="text-lg md:text-xl font-semibold text-gray-900">
                    Galeria de Imagens
                  </h2>
                  <p className="text-xs text-gray-500">Exibida na seção galeria da home</p>
                </div>
              </div>
              <button
                onClick={() => galleryInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700 transition-colors"
              >
                <Upload className="w-4 h-4" />
                <span className="hidden sm:inline">Adicionar</span>
              </button>
              <input
                ref={galleryInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleGalleryUpload}
              />
            </div>

            {images.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                  <ImageOff className="w-7 h-7 text-gray-400" />
                </div>
                <p className="text-sm font-medium text-gray-600 mb-1">Nenhuma imagem cadastrada</p>
                <p className="text-xs text-gray-400 max-w-xs">
                  A seção de galeria ficará oculta na home enquanto não houver imagens.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {images.map((img) => (
                  <div key={img.id} className="group relative">
                    <div className="aspect-square rounded-xl overflow-hidden bg-gray-100 shadow-sm">
                      <img
                        src={img.url}
                        alt={img.title ?? "Imagem da galeria"}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <button
                      onClick={() => removeImage(img.id)}
                      className="absolute top-1.5 right-1.5 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:bg-red-600"
                      title="Remover imagem"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                    {editingTitleId === img.id ? (
                      <input
                        autoFocus
                        type="text"
                        value={editingTitleValue}
                        onChange={(e) => setEditingTitleValue(e.target.value)}
                        onBlur={commitEditTitle}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") commitEditTitle();

                          if (e.key === "Escape") setEditingTitleId(null);
                        }}
                        className="mt-1.5 w-full px-2 py-1 text-xs border border-brand-300 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-400"
                        placeholder="Legenda (opcional)"
                      />
                    ) : (
                      <button
                        onClick={() => startEditTitle(img.id, img.title)}
                        className="mt-1.5 w-full flex items-center gap-1 text-left text-xs text-gray-500 hover:text-brand-600 transition-colors truncate"
                        title="Editar legenda"
                      >
                        <Pencil className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{img.title || "Adicionar legenda"}</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
