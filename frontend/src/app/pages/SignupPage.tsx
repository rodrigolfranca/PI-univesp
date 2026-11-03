import { useSite } from "../config/SiteContext";
import React, { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router";
import { BrandLogo } from "../components/BrandLogo";
export function SignupPage() {
  const site = useSite();
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const treatmentId = searchParams.get("treatmentId");
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (treatmentId) {
      navigate(`/agendar/${treatmentId}`);
    } else {
      navigate("/app");
    }
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-brand-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Logo */}
          <div className="flex justify-center">
            <BrandLogo size="auth" />
          </div>

          {/* Tagline */}
          <p className="text-center text-gray-600 text-sm">
            {site.content.authTagline}
          </p>

          {/* Title */}
          <h1 className="text-3xl font-bold text-brand-800 text-center">
            Cadastre-se
          </h1>

          {/* Phone Input */}
          <div className="space-y-2">
            <label
              htmlFor="phone"
              className="block text-sm font-bold text-gray-700"
            >
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

          {/* Email Input */}
          <div className="space-y-2">
            <label
              htmlFor="email"
              className="block text-sm font-bold text-gray-700"
            >
              E-mail
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu.email@exemplo.com"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-brand-700 text-white py-3 rounded-lg hover:bg-brand-600 transition-colors font-medium shadow-lg"
          >
            Cadastrar
          </button>

          {/* Login Link */}
          <button
            type="button"
            onClick={() =>
              navigate(
                treatmentId ? `/login?treatmentId=${treatmentId}` : "/login",
              )
            }
            className="w-full border-2 border-brand-700 text-brand-700 py-3 rounded-lg hover:bg-brand-100 transition-colors font-medium"
          >
            Entre com sua conta
          </button>

          {/* Back to Home */}
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
