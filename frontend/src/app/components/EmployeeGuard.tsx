import { AuthGuard } from "./AuthGuard";

export function EmployeeGuard() {
  return <AuthGuard role="employee" />;
}
