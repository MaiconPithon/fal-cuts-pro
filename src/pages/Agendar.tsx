import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { format, addDays, isBefore, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useServices, useScheduleSettings, useBlockedSlots, useAppointmentsByDate } from "@/hooks/use-barbershop";
import WhatsAppButton from "@/components/WhatsAppButton";

const WHATSAPP_NUMBER = "5571988335501";

function generateTimeSlots(open: string, close: string): string[] {
  const slots: string[] = [];
  const [oh, om] = open.split(":").map(Number);
  const [ch, cm] = close.split(":").map(Number);
  let h = oh, m = om;
  while (h < ch || (h === ch && m < cm)) {
    slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    m += 30;
    if (m >= 60) { h++; m = 0; }
  }
  return slots;
}

const steps = ["Serviços", "Data", "Horário", "Dados", "Pagamento", "Confirmação"];

const Agendar = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { services, loading: loadingServices } = useServices();
  const { settings } = useScheduleSettings();

  const [step, setStep] = useState(0);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"pix" | "cartao" | "dinheiro" | "">("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const dateStr = selectedDate ? format(selectedDate, "yyyy-MM-dd") : undefined;
  const blockedSlots = useBlockedSlots(dateStr);
  const existingAppointments = useAppointmentsByDate(dateStr);

  const chosen = services.filter((s) => selectedServices.includes(s.id));
  const total = chosen.reduce((sum, s) => sum + s.price, 0);

  const daySchedule = selectedDate
    ? settings.find((s) => s.day_of_week === selectedDate.getDay())
    : undefined;

  const timeSlots = daySchedule && daySchedule.is_open
    ? generateTimeSlots(daySchedule.open_time, daySchedule.close_time)
    : [];

  const blockedTimes = new Set(blockedSlots.map((b) => b.time_slot.slice(0, 5)));
  const bookedTimes = new Set(existingAppointments.map((a) => a.time_slot.slice(0, 5)));
  const availableSlots = timeSlots.filter((t) => !blockedTimes.has(t) && !bookedTimes.has(t));

  const disabledDays = (date: Date) => {
    if (isBefore(date, startOfDay(new Date()))) return true;
    const schedule = settings.find((s) => s.day_of_week === date.getDay());
    return !schedule || !schedule.is_open;
  };

  const toggleService = (id: string) => {
    setSelectedServices((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const handleSubmit = async () => {
    if (!selectedDate || !selectedTime || !paymentMethod) return;
    setSubmitting(true);

    const { error } = await supabase.from("appointments").insert({
      client_name: clientName,
      client_phone: clientPhone,
      appointment_date: format(selectedDate, "yyyy-MM-dd"),
      time_slot: selectedTime,
      services_selected: chosen.map((s) => ({ id: s.id, name: s.name, price: s.price })),
      total_price: total,
      payment_method: paymentMethod,
    });

    setSubmitting(false);

    if (error) {
      toast({ title: "Erro ao agendar", description: error.message, variant: "destructive" });
      return;
    }

    setDone(true);
  };

  const whatsappConfirmation = () => {
    const servicesText = chosen.map((s) => s.name).join(", ");
    const dateText = selectedDate ? format(selectedDate, "dd/MM/yyyy") : "";
    const msg = `✅ *Agendamento Confirmado*\n\n👤 ${clientName}\n📞 ${clientPhone}\n✂️ ${servicesText}\n📅 ${dateText} às ${selectedTime}\n💰 R$ ${total.toFixed(2).replace(".", ",")}\n💳 ${paymentMethod === "pix" ? "Pix" : paymentMethod === "cartao" ? "Cartão" : "Dinheiro"}`;
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
  };

  if (done) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
        <div className="animate-fade-in text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary">
            <Check className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground">Agendamento Confirmado!</h1>
          <p className="mt-2 text-muted-foreground">
            {format(selectedDate!, "dd/MM/yyyy")} às {selectedTime}
          </p>
          <p className="text-muted-foreground">{chosen.map((s) => s.name).join(", ")}</p>
          <p className="mt-1 font-display text-lg text-primary">R$ {total.toFixed(2).replace(".", ",")}</p>

          <div className="mt-6 flex flex-col gap-3">
            <a href={whatsappConfirmation()} target="_blank" rel="noopener noreferrer">
              <Button className="w-full bg-[#25D366] hover:bg-[#20b858]">
                Enviar Confirmação via WhatsApp
              </Button>
            </a>
            <Button variant="outline" onClick={() => navigate("/")}>Voltar ao Início</Button>
          </div>
        </div>
        <WhatsAppButton />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 pb-24 pt-6">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => step === 0 ? navigate("/") : setStep(step - 1)}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h1 className="font-display text-xl font-bold uppercase text-foreground">Agendar Horário</h1>
      </div>

      {/* Progress */}
      <div className="mb-8 flex gap-1">
        {steps.map((s, i) => (
          <div key={s} className={`h-1 flex-1 rounded-full ${i <= step ? "bg-primary" : "bg-border"}`} />
        ))}
      </div>

      {/* Step 0: Services */}
      {step === 0 && (
        <div className="space-y-3 animate-fade-in">
          <h2 className="font-display text-lg text-primary">Escolha os serviços</h2>
          {services.map((service) => (
            <button
              key={service.id}
              onClick={() => toggleService(service.id)}
              className={`flex w-full items-center justify-between rounded-lg border px-4 py-3 transition-colors ${
                selectedServices.includes(service.id)
                  ? "border-primary bg-primary/10"
                  : "border-border bg-card"
              }`}
            >
              <span className="text-foreground">{service.name}</span>
              <span className="font-display font-semibold text-primary">
                R$ {service.price.toFixed(2).replace(".", ",")}
              </span>
            </button>
          ))}
          {selectedServices.length > 0 && (
            <div className="flex items-center justify-between pt-2 text-foreground">
              <span className="font-semibold">Total:</span>
              <span className="font-display text-lg text-primary">R$ {total.toFixed(2).replace(".", ",")}</span>
            </div>
          )}
          <Button className="mt-4 w-full" disabled={selectedServices.length === 0} onClick={() => setStep(1)}>
            Continuar <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Step 1: Date */}
      {step === 1 && (
        <div className="animate-fade-in">
          <h2 className="mb-4 font-display text-lg text-primary">Escolha a data</h2>
          <div className="flex justify-center">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(d) => { setSelectedDate(d); setSelectedTime(""); }}
              disabled={disabledDays}
              locale={ptBR}
              className="rounded-lg border border-border bg-card p-3 pointer-events-auto"
              fromDate={new Date()}
              toDate={addDays(new Date(), 60)}
            />
          </div>
          <Button className="mt-4 w-full" disabled={!selectedDate} onClick={() => setStep(2)}>
            Continuar <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Step 2: Time */}
      {step === 2 && (
        <div className="animate-fade-in">
          <h2 className="mb-4 font-display text-lg text-primary">Escolha o horário</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            {selectedDate && format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
          </p>
          {availableSlots.length === 0 ? (
            <p className="text-muted-foreground">Nenhum horário disponível nesta data.</p>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {availableSlots.map((time) => (
                <button
                  key={time}
                  onClick={() => setSelectedTime(time)}
                  className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                    selectedTime === time
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-foreground hover:border-primary/50"
                  }`}
                >
                  {time}
                </button>
              ))}
            </div>
          )}
          <Button className="mt-4 w-full" disabled={!selectedTime} onClick={() => setStep(3)}>
            Continuar <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Step 3: Client info */}
      {step === 3 && (
        <div className="animate-fade-in space-y-4">
          <h2 className="font-display text-lg text-primary">Seus dados</h2>
          <div>
            <Label htmlFor="name">Nome</Label>
            <Input id="name" value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Seu nome" className="mt-1" />
          </div>
          <div>
            <Label htmlFor="phone">Telefone</Label>
            <Input id="phone" value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} placeholder="(71) 99999-9999" className="mt-1" />
          </div>
          <Button className="w-full" disabled={!clientName || !clientPhone} onClick={() => setStep(4)}>
            Continuar <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Step 4: Payment */}
      {step === 4 && (
        <div className="animate-fade-in space-y-4">
          <h2 className="font-display text-lg text-primary">Forma de Pagamento</h2>

          {(["pix", "cartao", "dinheiro"] as const).map((method) => (
            <button
              key={method}
              onClick={() => setPaymentMethod(method)}
              className={`flex w-full items-center rounded-lg border px-4 py-3 transition-colors ${
                paymentMethod === method ? "border-primary bg-primary/10" : "border-border bg-card"
              }`}
            >
              <span className="text-foreground">
                {method === "pix" && "💠 Pix"}
                {method === "cartao" && "💳 Cartão de Crédito"}
                {method === "dinheiro" && "💵 Dinheiro (pagar no local)"}
              </span>
            </button>
          ))}

          {paymentMethod === "pix" && (
            <div className="rounded-lg border border-primary/30 bg-card p-4 text-center">
              <p className="mb-2 text-sm text-muted-foreground">Chave Pix (Telefone):</p>
              <p className="font-display text-lg font-bold text-primary">71 98833-5501</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Valor: <span className="text-primary font-semibold">R$ {total.toFixed(2).replace(".", ",")}</span>
              </p>
              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`Olá! Segue o comprovante de Pix no valor de R$ ${total.toFixed(2).replace(".", ",")} referente ao agendamento de ${clientName}.`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-block"
              >
                <Button variant="outline" size="sm" className="border-[#25D366] text-[#25D366]">
                  Enviar Comprovante via WhatsApp
                </Button>
              </a>
            </div>
          )}

          {paymentMethod === "cartao" && (
            <div className="rounded-lg border border-border bg-card p-4 text-center">
              <p className="text-sm text-muted-foreground">
                Pagamento por cartão será disponibilizado em breve via integração Stripe.
              </p>
            </div>
          )}

          <Button className="w-full" disabled={!paymentMethod} onClick={() => setStep(5)}>
            Continuar <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Step 5: Confirmation */}
      {step === 5 && (
        <div className="animate-fade-in space-y-4">
          <h2 className="font-display text-lg text-primary">Confirmar Agendamento</h2>
          <div className="rounded-lg border border-border bg-card p-4 space-y-2">
            <p><span className="text-muted-foreground">Nome:</span> <span className="text-foreground">{clientName}</span></p>
            <p><span className="text-muted-foreground">Telefone:</span> <span className="text-foreground">{clientPhone}</span></p>
            <p><span className="text-muted-foreground">Data:</span> <span className="text-foreground">{selectedDate && format(selectedDate, "dd/MM/yyyy")}</span></p>
            <p><span className="text-muted-foreground">Horário:</span> <span className="text-foreground">{selectedTime}</span></p>
            <p><span className="text-muted-foreground">Serviços:</span> <span className="text-foreground">{chosen.map((s) => s.name).join(", ")}</span></p>
            <p><span className="text-muted-foreground">Pagamento:</span> <span className="text-foreground">{paymentMethod === "pix" ? "Pix" : paymentMethod === "cartao" ? "Cartão" : "Dinheiro"}</span></p>
            <p className="pt-2 border-t border-border">
              <span className="text-muted-foreground">Total:</span>{" "}
              <span className="font-display text-lg font-bold text-primary">R$ {total.toFixed(2).replace(".", ",")}</span>
            </p>
          </div>
          <Button className="w-full" onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Agendando..." : "Confirmar Agendamento"}
          </Button>
        </div>
      )}

      <WhatsAppButton />
    </div>
  );
};

export default Agendar;
