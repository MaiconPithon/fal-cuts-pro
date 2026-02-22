import { MessageCircle } from "lucide-react";

const WHATSAPP_NUMBER = "5571988335501";

interface WhatsAppButtonProps {
  message?: string;
}

const WhatsAppButton = ({ message }: WhatsAppButtonProps) => {
  const defaultMessage = "Olá! Gostaria de agendar um horário na Barbearia do Fal.";
  const encodedMessage = encodeURIComponent(message || defaultMessage);
  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] shadow-lg transition-transform hover:scale-110"
      aria-label="Contato via WhatsApp"
    >
      <MessageCircle className="h-7 w-7 text-white" fill="white" />
    </a>
  );
};

export default WhatsAppButton;
