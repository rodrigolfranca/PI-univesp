import { useParams } from "react-router";
import { ProfessionalClientDetail } from "../components/ProfessionalClientDetail";
import { UserDetails } from "../components/UserDetails";
import { useAuth } from "../context/AuthContext";

export function ClientDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const numericId = Number(id);
  if (!user?.isAdmin && user?.professionalId) {
    return <ProfessionalClientDetail key={id} clientId={numericId} />;
  }
  return <UserDetails key={id} id={numericId} kind="client" />;
}
