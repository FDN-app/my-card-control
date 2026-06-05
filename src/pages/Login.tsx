import { useState } from "react";
import React from "react";
import { supabase } from "@/lib/supabase";
import { useNavigate, Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useAuth } from "@/lib/AuthContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const navigate = useNavigate();
  const { session } = useAuth();

  if (session) {
    return <Navigate to="/" replace />;
  }

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        toast.success("¡Registro exitoso! Revisa tu email para confirmar.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        toast.success("¡Bienvenido/a a CuotaCtrl!");
        navigate("/");
      }
    } catch (error: any) {
      toast.error(error.message || "Ocurrió un error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background bg-cyber-grid p-4 relative overflow-hidden">
      {/* Ambient blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-96 h-96 rounded-full opacity-15"
          style={{ background: 'radial-gradient(circle, hsl(153 100% 50%), transparent 70%)', filter: 'blur(80px)' }} />
        <div className="absolute bottom-[-20%] right-[-10%] w-96 h-96 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, hsl(192 100% 50%), transparent 70%)', filter: 'blur(80px)' }} />
      </div>

      <Card className="w-full max-w-md glass-panel border-0 relative z-10">
        <CardHeader className="space-y-2 text-center pb-6">
          {/* Logo mark */}
          <div className="flex justify-center mb-2">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{
                background: 'hsl(153 100% 50% / 0.1)',
                border: '1px solid hsl(153 100% 50% / 0.4)',
                boxShadow: '0 0 20px hsl(153 100% 50% / 0.3)',
              }}>
              <span className="text-2xl font-black font-mono"
                style={{ color: 'hsl(153 100% 50%)', filter: 'drop-shadow(0 0 6px hsl(153 100% 50%))' }}>
                ₵
              </span>
            </div>
          </div>
          <CardTitle
            className="text-3xl font-black tracking-tight bg-clip-text text-transparent"
            style={{
              backgroundImage: 'linear-gradient(90deg, hsl(153 100% 60%), hsl(192 100% 60%), hsl(153 100% 60%))',
              backgroundSize: '200% auto',
              animation: 'textShine 4s linear infinite',
            }}
          >
            CuotaCtrl
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            {isSignUp ? "Crea tu cuenta para empezar a organizar" : "Ingresa a tu cuenta para continuar"}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleAuth} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-muted-foreground text-sm">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-secondary/50 border-border focus:border-primary/50"
                style={{ '--tw-ring-color': 'hsl(153 100% 50% / 0.3)' } as React.CSSProperties}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="password" className="text-muted-foreground text-sm">Contraseña</Label>
                {!isSignUp && (
                  <button
                    type="button"
                    onClick={async () => {
                      if (!email) return toast.error("Ingresa tu email primero para recuperar tu contraseña.");
                      try {
                        const { error } = await supabase.auth.resetPasswordForEmail(email, {
                          redirectTo: window.location.origin + '/login',
                        });
                        if (error) throw error;
                        toast.success("Correo de recuperación enviado.");
                      } catch (err: any) {
                        toast.error(err.message || "Error al enviar recuperación.");
                      }
                    }}
                    className="text-xs transition-colors"
                    style={{ color: 'hsl(192 100% 60%)' }}
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                )}
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                min={6}
                className="bg-secondary/50 border-border"
              />
            </div>

            <Button
              type="submit"
              className="w-full font-bold mt-2"
              style={{
                background: 'hsl(153 100% 50%)',
                color: 'hsl(153 100% 5%)',
                boxShadow: '0 0 20px hsl(153 100% 50% / 0.4)',
              }}
              disabled={loading}
            >
              {loading ? "Cargando..." : isSignUp ? "Registrarme" : "Iniciar Sesión"}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex justify-center pt-0">
          <Button
            variant="link"
            className="text-muted-foreground text-sm"
            style={{ '--tw-text-opacity': '1' } as React.CSSProperties}
            onClick={() => setIsSignUp(!isSignUp)}
          >
            {isSignUp ? "¿Ya tienes cuenta? Inicia sesión" : "¿No tienes cuenta? Regístrate"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
