import { useSite } from "../config/SiteContext";
import { useBrand } from "../context/BrandContext";

const sizes = {
  small: { frame: "w-8 h-8 p-1.5 shadow", plain: "w-8 h-8" },
  header: { frame: "w-12 h-12 p-2 shadow-lg", plain: "w-12 h-12" },
  auth: { frame: "w-24 h-24 p-4 shadow-2xl", plain: "w-24 h-24" },
  hero: { frame: "w-32 h-32 p-4 shadow-2xl", plain: "w-32 h-32" },
  about: { frame: "w-64 h-64 p-6 shadow-2xl", plain: "w-64 h-64" },
  dashboard: { frame: "w-10 h-10", plain: "w-10 h-10" },
};

export function BrandLogo({ size }: { size: keyof typeof sizes }) {
  const site = useSite();
  const { name, logoUrl } = useBrand();
  const image =
    logoUrl ?? (size === "dashboard" ? site.identity.logo.dashboard : site.identity.logo.public);
  const framed = site.identity.logo.presentation === "framed" && size !== "dashboard";
  const classes = `${framed ? sizes[size].frame + " bg-gradient-to-br from-brand-600 to-brand-800" : sizes[size].plain} rounded-full flex items-center justify-center shrink-0`;

  return (
    <div className={classes}>
      {image ? (
        <img
          src={image}
          alt={name}
          className={`w-full h-full rounded-full ${framed ? "object-cover" : "object-contain"}`}
        />
      ) : (
        <span className="text-brand-700 font-bold" role="img" aria-label={name}>
          {name
            .split(/\s+/)
            .slice(0, 2)
            .map((part) => part[0])
            .join("")}
        </span>
      )}
    </div>
  );
}
