import { AuthGuard } from "./AuthGuard";

export function ClienteGuard() {
  return <AuthGuard role="client" />;
}
