import { Scissors, Clock, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import WhatsAppButton from "@/components/WhatsAppButton";
import { useNavigate } from "react-router-dom";
import { useServices } from "@/hooks/use-barbershop";

const Index = () => {
  const navigate = useNavigate();
  const { services, loading } = useServices();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <header className="relative flex flex-col items-center px-4 pb-10 pt-8">
        <div className="absolute inset-0 bg-gradient-to-b from-gold/5 to-transparent pointer-events-none" />
        
        <img
          src="/logo-barbearia.jpeg"
          alt="Logo Barbearia do Fal"
          className="relative z-10 mb-4 h-28 w-28 rounded-full border-2 border-gold object-cover shadow-lg shadow-gold/20"
        />

        <h1 className="relative z-10 font-display text-3xl font-bold uppercase tracking-wider text-foreground">
          Barbearia do <span className="text-primary">Fal</span>
        </h1>

        <div className="relative z-10 mt-4 flex flex-col items-center gap-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            <span>Terça a Sábado — 08:00 às 21:00</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-primary" />
            <span>(71) 98833-5501</span>
          </div>
        </div>

        <Button
          size="lg"
          className="relative z-10 mt-8 font-display text-lg uppercase tracking-wide"
          onClick={() => navigate("/agendar")}
        >
          <Scissors className="mr-2 h-5 w-5" />
          Agendar Horário
        </Button>
      </header>

      {/* Services */}
      <section className="mx-auto max-w-lg px-4 pb-24">
        <h2 className="mb-6 text-center font-display text-xl font-semibold uppercase tracking-wider text-primary">
          Serviços &amp; Preços
        </h2>

        <div className="space-y-2">
          {loading ? (
            <p className="text-center text-muted-foreground">Carregando...</p>
          ) : (
            services.map((service, i) => (
              <div
                key={service.id}
                className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3 animate-fade-in"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <span className="text-foreground">{service.name}</span>
                <span className="font-display font-semibold text-primary">
                  R$ {service.price.toFixed(2).replace(".", ",")}
                </span>
              </div>
            ))
          )}
        </div>

        {/* Admin link */}
        <div className="mt-12 text-center">
          <button
            onClick={() => navigate("/admin/login")}
            className="text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors"
          >
            Área do Barbeiro
          </button>
        </div>
      </section>

      <WhatsAppButton />
    </div>
  );
};

export default Index;
