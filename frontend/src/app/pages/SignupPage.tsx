import React, { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router";
import logo from "../../assets/brand/dayane-logo-white.png";

export function SignupPage() {
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
    <div className="min-h-screen bg-gradient-to-br from-wine-50 via-white to-wine-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Logo */}
          <div className="flex justify-center">
            <div className="w-24 h-24 bg-gradient-to-br from-wine-600 to-wine-800 rounded-full p-4 shadow-2xl">
              <img src={logo} alt="Dayane" className="w-full h-full object-cover rounded-full" />
            </div>
          </div>

          {/* Tagline */}
          <p className="text-center text-gray-600 text-sm">
            Reserve experiências inesquecíveis<br />de beleza e bem-estar
          </p>

          {/* Title */}
          <h1 className="text-3xl font-bold text-wine-800 text-center">
            Cadastre-se
          </h1>

          {/* Phone Input */}
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
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-wine-600 focus:border-transparent"
            />
          </div>

          {/* Email Input */}
          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-bold text-gray-700">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu.email@exemplo.com"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-wine-600 focus:border-transparent"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-wine-700 text-white py-3 rounded-lg hover:bg-wine-600 transition-colors font-medium shadow-lg"
          >
            Cadastrar
          </button>

          {/* Login Link */}
          <button
            type="button"
            onClick={() => navigate(treatmentId ? `/login?treatmentId=${treatmentId}` : "/login")}
            className="w-full border-2 border-wine-700 text-wine-700 py-3 rounded-lg hover:bg-wine-100 transition-colors font-medium"
          >
            Entre com sua conta
          </button>

          {/* Back to Home */}
          <p className="text-center pt-4">
            <Link to="/" className="text-sm text-gray-600 hover:text-wine-700">
              ← Voltar para Home
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
