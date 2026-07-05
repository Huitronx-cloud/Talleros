-- ─────────────────────────────────────────────────────────────────────────────
-- Amplía el log de wa.me a los nuevos contextos de envío: fotos de diagnóstico,
-- portal del cliente, reporte PDF de servicio y aprobación de trabajo adicional.
-- Ejecutar en: Supabase > SQL Editor
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.mensajes_whatsapp_log
  drop constraint if exists mensajes_whatsapp_log_plantilla_check;

alter table public.mensajes_whatsapp_log
  add constraint mensajes_whatsapp_log_plantilla_check
  check (plantilla in (
    'recibido','diagnostico_listo','en_progreso','listo_entrega','garantia',
    'fotos_diagnostico','portal_cliente','pdf_servicio','aprobacion_extra'
  ));
