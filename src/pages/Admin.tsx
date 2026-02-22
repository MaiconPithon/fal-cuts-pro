import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { LogOut, Calendar, Settings, DollarSign, Clock, Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";

const DAY_NAMES = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

const Admin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<Tables<"appointments">[]>([]);
  const [services, setServices] = useState<Tables<"services">[]>([]);
  const [schedule, setSchedule] = useState<Tables<"schedule_settings">[]>([]);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [selectedDate]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { navigate("/admin/login"); return; }

    const { data: role } = await supabase.rpc("has_role", {
      _user_id: session.user.id,
      _role: "admin",
    });

    if (!role) {
      toast({ title: "Acesso negado", description: "Você não tem permissão de administrador.", variant: "destructive" });
      await supabase.auth.signOut();
      navigate("/admin/login");
      return;
    }

    setLoading(false);
    fetchServices();
    fetchSchedule();
  };

  const fetchAppointments = async () => {
    const { data } = await supabase
      .from("appointments")
      .select("*")
      .eq("appointment_date", selectedDate)
      .order("time_slot");
    setAppointments(data || []);
  };

  const fetchServices = async () => {
    const { data } = await supabase.from("services").select("*").order("sort_order");
    setServices(data || []);
  };

  const fetchSchedule = async () => {
    const { data } = await supabase.from("schedule_settings").select("*").order("day_of_week");
    setSchedule(data || []);
  };

  const updateServicePrice = async (id: string, price: number) => {
    await supabase.from("services").update({ price }).eq("id", id);
    fetchServices();
    toast({ title: "Preço atualizado!" });
  };

  const toggleDay = async (id: string, is_open: boolean) => {
    await supabase.from("schedule_settings").update({ is_open }).eq("id", id);
    fetchSchedule();
  };

  const updatePaymentStatus = async (id: string, status: string) => {
    await supabase.from("appointments").update({ payment_status: status }).eq("id", id);
    fetchAppointments();
    toast({ title: "Status atualizado!" });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/admin/login");
  };

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-background"><p className="text-muted-foreground">Carregando...</p></div>;
  }

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-border px-4 py-3">
        <h1 className="font-display text-lg font-bold uppercase text-foreground">
          Painel <span className="text-primary">Admin</span>
        </h1>
        <Button variant="ghost" size="icon" onClick={handleLogout}>
          <LogOut className="h-5 w-5" />
        </Button>
      </header>

      <Tabs defaultValue="agenda" className="px-4 pt-4">
        <TabsList className="w-full grid grid-cols-3 bg-secondary">
          <TabsTrigger value="agenda"><Calendar className="mr-1 h-4 w-4" /> Agenda</TabsTrigger>
          <TabsTrigger value="servicos"><DollarSign className="mr-1 h-4 w-4" /> Serviços</TabsTrigger>
          <TabsTrigger value="horarios"><Clock className="mr-1 h-4 w-4" /> Horários</TabsTrigger>
        </TabsList>

        {/* Agenda Tab */}
        <TabsContent value="agenda" className="space-y-4">
          <div>
            <Label>Data</Label>
            <Input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="mt-1" />
          </div>

          {appointments.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Nenhum agendamento para esta data.</p>
          ) : (
            <div className="space-y-3">
              {appointments.map((apt) => {
                const svcs = Array.isArray(apt.services_selected) ? apt.services_selected as any[] : [];
                return (
                  <div key={apt.id} className="rounded-lg border border-border bg-card p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-display font-semibold text-primary">{apt.time_slot.slice(0, 5)}</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        apt.payment_status === "confirmado" ? "bg-green-900/30 text-green-400" :
                        apt.payment_status === "cancelado" ? "bg-red-900/30 text-red-400" :
                        "bg-yellow-900/30 text-yellow-400"
                      }`}>
                        {apt.payment_status}
                      </span>
                    </div>
                    <p className="text-foreground font-medium">{apt.client_name}</p>
                    <p className="text-sm text-muted-foreground">{apt.client_phone}</p>
                    <p className="text-sm text-muted-foreground">{svcs.map((s: any) => s.name).join(", ")}</p>
                    <div className="flex items-center justify-between pt-2 border-t border-border">
                      <span className="font-display text-primary">R$ {Number(apt.total_price).toFixed(2).replace(".", ",")}</span>
                      <div className="flex gap-2">
                        {apt.payment_status !== "confirmado" && (
                          <Button size="sm" variant="outline" onClick={() => updatePaymentStatus(apt.id, "confirmado")}>
                            Confirmar Pgto
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Services Tab */}
        <TabsContent value="servicos" className="space-y-3">
          {services.map((service) => (
            <div key={service.id} className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
              <span className="flex-1 text-foreground">{service.name}</span>
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground text-sm">R$</span>
                <Input
                  type="number"
                  step="0.01"
                  defaultValue={service.price}
                  className="w-20 text-right"
                  onBlur={(e) => {
                    const v = parseFloat(e.target.value);
                    if (!isNaN(v) && v !== service.price) updateServicePrice(service.id, v);
                  }}
                />
              </div>
            </div>
          ))}
        </TabsContent>

        {/* Schedule Tab */}
        <TabsContent value="horarios" className="space-y-3">
          {schedule.map((day) => (
            <div key={day.id} className="flex items-center justify-between rounded-lg border border-border bg-card p-3">
              <span className="text-foreground">{DAY_NAMES[day.day_of_week]}</span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {day.is_open ? `${day.open_time.slice(0, 5)} - ${day.close_time.slice(0, 5)}` : "Fechado"}
                </span>
                <Switch checked={day.is_open} onCheckedChange={(checked) => toggleDay(day.id, checked)} />
              </div>
            </div>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Admin;
