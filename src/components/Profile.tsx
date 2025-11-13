import React, { useState, useEffect } from "react";
import { User, Save } from "lucide-react";
import { toast } from "sonner@2.0.3";
import { useAuth } from "../utils/auth-context";
import { apiRequest } from "../utils/api";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";

export function Profile() {
  const { user, accessToken, refreshUser } = useAuth();
  const [formData, setFormData] = useState({
    name: user?.name || "",
    carrera: user?.carrera || "",
    whatsapp: user?.whatsapp || "",
    bio: user?.bio || "",
    subjects: user?.subjects?.join(", ") || "",
  });
  const [loading, setLoading] = useState(false);

  // Actualizar el formulario cuando cambian los datos del usuario
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        carrera: user.carrera || "",
        whatsapp: user.whatsapp || "",
        bio: user.bio || "",
        subjects: user.subjects?.join(", ") || "",
      });
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      const updates: any = {
        name: formData.name,
        whatsapp: formData.whatsapp,
      };

      if (user?.role === "student") {
        updates.carrera = formData.carrera;
      } else if (user?.role === "tutor") {
        updates.bio = formData.bio;
        updates.subjects = formData.subjects
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      }

      await apiRequest(
        "/profile",
        {
          method: "PUT",
          body: JSON.stringify(updates),
        },
        accessToken,
      );

      await refreshUser();
      toast.success("Perfil actualizado correctamente");
    } catch (err: any) {
      toast.error(err.message || "Error al actualizar perfil");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="mb-2">Mi Perfil</h1>
        <p className="text-muted-foreground">
          Actualiza tu información personal
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Información General
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Nombre Completo</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    name: e.target.value,
                  })
                }
                required
              />
            </div>

            <div>
              <Label htmlFor="email">Correo Electrónico</Label>
              <Input
                id="email"
                value={user?.email || ""}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground mt-1">
                El correo no puede ser modificado
              </p>
            </div>

            {user?.role === "student" && (
              <div>
                <Label htmlFor="carrera">Carrera</Label>
                <Input
                  id="carrera"
                  value={formData.carrera}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      carrera: e.target.value,
                    })
                  }
                  required
                />
              </div>
            )}

            {user?.role === "tutor" && (
              <>
                <div>
                  <Label htmlFor="bio">Biografía</Label>
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        bio: e.target.value,
                      })
                    }
                    rows={4}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="subjects">
                    Materias (separadas por comas)
                  </Label>
                  <Input
                    id="subjects"
                    value={formData.subjects}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        subjects: e.target.value,
                      })
                    }
                    placeholder="Cálculo I, Física I, Álgebra"
                    required
                  />
                </div>
              </>
            )}

            <div>
              <Label htmlFor="whatsapp">
                Número de WhatsApp (opcional)
              </Label>
              <Input
                id="whatsapp"
                value={formData.whatsapp}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    whatsapp: e.target.value,
                  })
                }
                placeholder="+1234567890"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              {loading ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}