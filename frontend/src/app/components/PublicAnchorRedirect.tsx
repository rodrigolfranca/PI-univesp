import { Navigate } from "react-router";

export function PublicAnchorRedirect({ anchor }: { anchor: string }) {
  return <Navigate to={`/#${anchor}`} replace />;
}
