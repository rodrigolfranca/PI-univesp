import { useSite } from "../config/SiteContext";
import React, { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router";
import { BrandLogo } from "../components/BrandLogo";
import { useAuth } from "../context/AuthContext";

export function LoginPage() {
  const site = useSite();
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const treatmentId = searchParams.get("treatmentId");
  const { login } = useAuth();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    const role = login(phone);
    if (!role) {
      setError("Informe seu número de telefone para continuar.");
      return;
    }

    if (role === "employee") {
      navigate("/app/appointments");
    } else {
      if (treatmentId) {
        navigate(`/agendar/${treatmentId}`);
      } else {
        navigate("/cliente/agendamentos");
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-brand-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex justify-center">
            <BrandLogo size="auth" />
          </div>

          <p className="text-center text-gray-600 text-sm">{site.content.authTagline}</p>

          <h1 className="text-3xl font-bold text-brand-800 text-center">Entre na sua conta</h1>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="phone" className="block text-sm font-bold text-gray-700">
              Telefone
            </label>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(11) 94002-8922"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-brand-700 text-white py-3 rounded-lg hover:bg-brand-600 transition-colors font-medium shadow-lg"
          >
            Entrar
          </button>

          <p className="text-center text-sm text-gray-600 pt-8">
            Não tem uma conta?{" "}
            <Link
              to={treatmentId ? `/signup?treatmentId=${treatmentId}` : "/signup"}
              className="text-brand-700 underline font-medium hover:text-brand-600"
            >
              Cadastre-se
            </Link>
          </p>

          <p className="text-center pt-4">
            <Link to="/" className="text-sm text-gray-600 hover:text-brand-700">
              ← Voltar para Home
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
