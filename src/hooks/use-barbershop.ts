import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";

export function useServices() {
  const [services, setServices] = useState<Tables<"services">[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("services")
      .select("*")
      .order("sort_order")
      .then(({ data }) => {
        setServices(data || []);
        setLoading(false);
      });
  }, []);

  return { services, loading };
}

export function useScheduleSettings() {
  const [settings, setSettings] = useState<Tables<"schedule_settings">[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("schedule_settings")
      .select("*")
      .order("day_of_week")
      .then(({ data }) => {
        setSettings(data || []);
        setLoading(false);
      });
  }, []);

  return { settings, loading };
}

export function useBlockedSlots(date?: string) {
  const [slots, setSlots] = useState<Tables<"blocked_slots">[]>([]);

  useEffect(() => {
    if (!date) return;
    supabase
      .from("blocked_slots")
      .select("*")
      .eq("slot_date", date)
      .then(({ data }) => setSlots(data || []));
  }, [date]);

  return slots;
}

export function useAppointmentsByDate(date?: string) {
  const [appointments, setAppointments] = useState<Tables<"appointments">[]>([]);

  useEffect(() => {
    if (!date) return;
    supabase
      .from("appointments")
      .select("*")
      .eq("appointment_date", date)
      .eq("status", "agendado")
      .then(({ data }) => setAppointments(data || []));
  }, [date]);

  return appointments;
}
