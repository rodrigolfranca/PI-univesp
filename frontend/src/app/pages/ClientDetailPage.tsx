import { useParams } from "react-router";
import { UserDetails } from "../components/UserDetails";

export function ClientDetailPage() {
  const { id } = useParams();
  return <UserDetails key={id} id={Number(id)} kind="client" />;
}
