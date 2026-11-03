import {
  Briefcase,
  Calendar,
  Sparkles,
  Heart,
  Star,
  Award,
  Users,
  Droplet,
  Zap,
  Activity,
  Clock,
  Wrench,
  Scissors,
  Phone,
} from "lucide-react";
import { iconNames } from "../config/schema.mjs";
const icons = {
  briefcase: Briefcase,
  calendar: Calendar,
  sparkles: Sparkles,
  heart: Heart,
  star: Star,
  award: Award,
  users: Users,
  droplet: Droplet,
  zap: Zap,
  activity: Activity,
  clock: Clock,
  wrench: Wrench,
  scissors: Scissors,
  phone: Phone,
};
// Validation and rendering share the supported icon names.
if (iconNames.some((name) => !(name in icons)))
  throw new Error("Catálogo de ícones incompleto");
export function SiteIcon({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const Icon = icons[name as keyof typeof icons] ?? Briefcase;
  return <Icon className={className} aria-hidden="true" />;
}
