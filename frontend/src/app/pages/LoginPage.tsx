import React, { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router";
import logo from "../../imports/dayane_logo_white_ilustracao_transparente_limpa.png";
import { useAuth } from "../context/AuthContext";

export function LoginPage() {
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
            Entre na sua conta
          </h1>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

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

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-wine-700 text-white py-3 rounded-lg hover:bg-wine-600 transition-colors font-medium shadow-lg"
          >
            Entrar
          </button>

          {/* Sign Up Link */}
          <p className="text-center text-sm text-gray-600 pt-8">
            Não tem uma conta?{" "}
            <Link
              to={treatmentId ? `/signup?treatmentId=${treatmentId}` : "/signup"}
              className="text-wine-700 underline font-medium hover:text-wine-600"
            >
              Cadastre-se
            </Link>
          </p>

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
