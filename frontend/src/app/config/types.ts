export interface Category {
  id: number;
  name: string;
}
export interface Procedure {
  id: number;
  name: string;
  category: string;
  duration: string;
  price: string;
  status: string;
  description: string;
  durationMinutes: number;
  sessions: number;
  triagem: boolean;
  triagemMinutes: number;
  bloqueioPeriodo: number | null;
}
export interface GalleryImage {
  id: string;
  url: string;
  title?: string;
}
export interface Client {
  id: number;
  name: string;
  phone: string;
  email: string;
}

export type AppStatus = "Confirmado" | "Concluído" | "Cancelado" | "Ausente";

export interface Appointment {
  id: number;
  clientId: number;
  professionalId: number;
  procedureId: number;
  client: string;
  clientPhone: string;
  professional: string;
  professionalPhone: string;
  procedure: string;
  date: string;
  time: string;
  status: AppStatus;
  durationMin: number;
  session: number;
  googleEventLink: string | null;
}
export interface Manifest {
  id: string;
  domains: string[];
}
export interface Theme {
  preset: string;
  palette: Record<string, string>;
}
export interface ContentCard {
  title: string;
  description: string;
  icon: string;
}
export interface SiteConfig extends Manifest {
  identity: {
    name: string;
    tagline: string;
    description: string;
    logo: {
      public: string;
      dashboard: string;
      presentation: "framed" | "plain";
    };
  };
  theme: Theme;
  terms: {
    service: string;
    services: string;
    procedure: string;
    procedures: string;
    establishment: string;
    professional: string;
    professionals: string;
  };
  content: {
    pageHeadings: {
      treatmentsTitle: string;
      treatmentsIntro: string;
      aboutTitle: string;
      aboutIntro: string;
      contactTitle: string;
      contactIntro: string;
    };
    homeAbout: { title: string; paragraphs: string[] };
    about: {
      missionTitle: string;
      paragraphs: string[];
      values: ContentCard[];
    };
    treatments: ContentCard[];
    hero: string;
    authTagline: string;
    bookingConfirmation: string;
    features: ContentCard[];
    experience: { value: string; label: string };
    catalogTitle: string;
    catalogIntro: string;
    contactTitle: string;
    contactIntro: string;
    contactPageTitle: string;
    contactPageIntro: string;
    footer: string;
    owner: { name: string; role: string; phone: string; registeredAt: string };
  };
  contact: {
    address: string[];
    phone: string;
    email: string;
    hours: string[];
    whatsapp: string;
    instagram: string;
  };
  catalog: {
    categories: Category[];
    procedures: Procedure[];
    gallery: GalleryImage[];
    icon: string;
  };
  agenda: { timeSlots: string[]; blockedSlots: string[] };
  data: {
    clientDocuments: {
      id: number;
      name: string;
      uploadDate: string;
      size: string;
      url: string;
    }[];
    procedureDocuments: {
      id: number;
      name: string;
      uploadDate: string;
      size: string;
      url: string;
    }[];
    clientAppointments: {
      id: string;
      procedure: string;
      date: string;
      time: string;
      status: "confirmado" | "pendente" | "concluido" | "cancelado";
    }[];
    clients: Client[];
    appointments: Appointment[];
    employees: {
      id: number;
      name: string;
      role: string;
      email: string;
      phone: string;
      status: string;
    }[];
    notifications: {
      id: number;
      type: string;
      title: string;
      message: string;
      time: string;
      read: boolean;
    }[];
    clientNotifications: {
      id: string;
      type: "lembrete" | "confirmacao" | "cancelamento" | "info";
      title: string;
      body: string;
      time: string;
      read: boolean;
    }[];
  };
}
export interface BrandConfig {
  name: string;
  logoUrl: string | null;
  theme: Theme;
  aboutTitle: string;
  aboutParagraphs: string[];
  whatsappNumber: string;
  instagramHandle: string;
}
