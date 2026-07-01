import {
  Document, Page, Text, View, StyleSheet, Image,
} from '@react-pdf/renderer'
import { Orden, Taller } from '@/types'

const AZUL   = '#1D4ED8'
const VERDE  = '#059669'
const OSCURO = '#111827'
const MEDIO  = '#6B7280'
const CLARO  = '#F9FAFB'
const BORDE  = '#E5E7EB'

const IVA_ETIQUETA: Record<string, string> = {
  'México':    'IVA 16%', 'Colombia':  'IVA 19%', 'Argentina': 'IVA 21%',
  'Chile':     'IVA 19%', 'Perú':      'IGV 18%', 'Ecuador':   'IVA 15%',
  'Venezuela': 'IVA 16%', 'Bolivia':   'IVA 13%', 'Paraguay':  'IVA 10%',
  'Uruguay':   'IVA 22%', 'Guatemala': 'IVA 12%', 'Costa Rica':'IVA 13%',
  'Panamá':    'ITBMS 7%','Honduras':  'ISV 15%', 'El Salvador':'IVA 13%',
  'Nicaragua': 'IVA 15%', 'República Dominicana': 'ITBIS 18%',
}

const s = StyleSheet.create({
  page:         { fontFamily: 'Helvetica', fontSize: 10, color: OSCURO, backgroundColor: '#FFFFFF', paddingHorizontal: 40, paddingVertical: 36 },
  header:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  logoBox:      { width: 56, height: 56 },
  logo:         { width: 56, height: 56, objectFit: 'contain' },
  logoPlaceholder: { width: 56, height: 56, backgroundColor: AZUL, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  logoLetra:    { color: '#FFFFFF', fontSize: 26, fontFamily: 'Helvetica-Bold' },
  tallerInfo:   { flex: 1, paddingLeft: 14 },
  tallerNombre: { fontSize: 17, fontFamily: 'Helvetica-Bold', color: OSCURO, marginBottom: 3 },
  tallerDato:   { fontSize: 9, color: MEDIO, marginBottom: 2 },
  badgeBox:     { alignItems: 'flex-end' },
  badgeLabel:   { fontSize: 8, color: MEDIO, letterSpacing: 1.2, marginBottom: 3 },
  badgeNumero:  { fontSize: 20, fontFamily: 'Helvetica-Bold', color: AZUL },
  badgeFecha:   { fontSize: 8, color: MEDIO, marginTop: 3 },
  divider:      { height: 1, backgroundColor: BORDE, marginVertical: 14 },
  // Estado badge
  estadoBadge:  { alignSelf: 'flex-start', backgroundColor: VERDE, borderRadius: 4, paddingHorizontal: 8, paddingVertical: 3, marginBottom: 16 },
  estadoText:   { color: '#FFFFFF', fontSize: 8, fontFamily: 'Helvetica-Bold', letterSpacing: 0.8 },
  // Grid 3 columnas info
  tresCol:      { flexDirection: 'row', gap: 10, marginBottom: 18 },
  seccion:      { flex: 1, backgroundColor: CLARO, borderRadius: 6, padding: 10 },
  secLabel:     { fontSize: 7, color: AZUL, fontFamily: 'Helvetica-Bold', letterSpacing: 0.8, marginBottom: 6 },
  secNombre:    { fontSize: 10, fontFamily: 'Helvetica-Bold', color: OSCURO, marginBottom: 2 },
  secDato:      { fontSize: 8, color: MEDIO, marginBottom: 1.5 },
  // Tabla
  tablaHeader:  { flexDirection: 'row', backgroundColor: AZUL, borderRadius: 4, paddingVertical: 7, paddingHorizontal: 10, marginBottom: 2 },
  thDesc:       { flex: 1, color: '#FFFFFF', fontFamily: 'Helvetica-Bold', fontSize: 8 },
  thNum:        { width: 36, color: '#FFFFFF', fontFamily: 'Helvetica-Bold', fontSize: 8, textAlign: 'center' },
  thMonto:      { width: 65, color: '#FFFFFF', fontFamily: 'Helvetica-Bold', fontSize: 8, textAlign: 'right' },
  fila:         { flexDirection: 'row', paddingVertical: 7, paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: BORDE },
  filaImpar:    { backgroundColor: CLARO },
  tdDesc:       { flex: 1, fontSize: 8.5, color: OSCURO },
  tdNum:        { width: 36, fontSize: 8.5, color: MEDIO, textAlign: 'center' },
  tdMonto:      { width: 65, fontSize: 8.5, color: OSCURO, textAlign: 'right' },
  // Totales
  totalesBox:   { alignItems: 'flex-end', marginTop: 10 },
  totalFila:    { flexDirection: 'row', width: 210, justifyContent: 'space-between', marginBottom: 3 },
  totalLabel:   { fontSize: 8.5, color: MEDIO },
  totalVal:     { fontSize: 8.5, color: OSCURO },
  totalLinea:   { height: 1, backgroundColor: BORDE, width: 210, marginVertical: 5 },
  totalGrande:  { flexDirection: 'row', width: 210, justifyContent: 'space-between' },
  totalGLabel:  { fontSize: 12, fontFamily: 'Helvetica-Bold', color: OSCURO },
  totalGVal:    { fontSize: 12, fontFamily: 'Helvetica-Bold', color: AZUL },
  // Info extra
  dosCol:       { flexDirection: 'row', gap: 10, marginTop: 18 },
  notaBox:      { backgroundColor: CLARO, borderRadius: 6, padding: 10, borderLeftWidth: 3, borderLeftColor: AZUL },
  notaLabel:    { fontSize: 7, color: AZUL, fontFamily: 'Helvetica-Bold', letterSpacing: 0.8, marginBottom: 3 },
  notaTexto:    { fontSize: 8.5, color: MEDIO, lineHeight: 1.5 },
  // Firma
  firmaBox:     { backgroundColor: CLARO, borderRadius: 6, padding: 10, borderLeftWidth: 3, borderLeftColor: VERDE, flex: 1 },
  firmaLabel:   { fontSize: 7, color: VERDE, fontFamily: 'Helvetica-Bold', letterSpacing: 0.8, marginBottom: 3 },
  firmaImg:     { width: 120, height: 40, objectFit: 'contain' },
  // Footer
  footer:       { position: 'absolute', bottom: 22, left: 40, right: 40, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  footerText:   { fontSize: 7.5, color: BORDE },
  footerBrand:  { fontSize: 7.5, color: MEDIO },
  // QR de opt-in a WhatsApp
  qrRow:        { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14, backgroundColor: CLARO, borderRadius: 6, padding: 10 },
  qrImg:        { width: 50, height: 50 },
  qrTextBox:    { flex: 1 },
  qrLabel:      { fontSize: 8.5, color: OSCURO, fontFamily: 'Helvetica-Bold', marginBottom: 2 },
  qrSub:        { fontSize: 7.5, color: MEDIO },
})

function fmt(n: number, moneda?: string) {
  const sym = moneda === 'COP' ? 'COP $' : '$'
  return `${sym}${(n ?? 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`
}

function fmtFecha(f: string | null) {
  if (!f) return '—'
  return new Date(f + 'T12:00:00').toLocaleDateString('es-MX', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

interface Props {
  orden: Orden & { firma_url?: string | null }
  taller: Taller
  qrOptInUrl?: string | null
}

export default function OrdenDocumento({ orden, taller, qrOptInUrl }: Props) {
  const moneda    = (taller as any).moneda ?? 'MXN'
  const pais      = (taller as any).pais   ?? 'México'
  const ivaLabel  = IVA_ETIQUETA[pais] ?? 'IVA 16%'
  const cliente   = orden.clientes
  const impuestos = (orden as any).impuestos ?? 0

  return (
    <Document title={`Orden #${String(orden.numero_orden).padStart(4, '0')}`}>
      <Page size="A4" style={s.page}>

        {/* ── HEADER ── */}
        <View style={s.header}>
          <View style={s.logoBox}>
            {taller.logo_url ? (
              <Image src={taller.logo_url} style={s.logo} />
            ) : (
              <View style={s.logoPlaceholder}>
                <Text style={s.logoLetra}>{taller.nombre.charAt(0).toUpperCase()}</Text>
              </View>
            )}
          </View>
          <View style={s.tallerInfo}>
            <Text style={s.tallerNombre}>{taller.nombre}</Text>
            {taller.direccion && <Text style={s.tallerDato}>{taller.direccion}</Text>}
            {taller.telefono  && <Text style={s.tallerDato}>Tel: {taller.telefono}</Text>}
            {taller.email     && <Text style={s.tallerDato}>{taller.email}</Text>}
          </View>
          <View style={s.badgeBox}>
            <Text style={s.badgeLabel}>ORDEN DE SERVICIO</Text>
            <Text style={s.badgeNumero}>#{String(orden.numero_orden).padStart(4, '0')}</Text>
            <Text style={s.badgeFecha}>{fmtFecha(orden.fecha_entrada)}</Text>
          </View>
        </View>

        <View style={s.divider} />

        {/* ── ESTADO ── */}
        <View style={s.estadoBadge}>
          <Text style={s.estadoText}>{orden.estado.toUpperCase().replace('_', ' ')}</Text>
        </View>

        {/* ── INFO EN 3 COLUMNAS ── */}
        <View style={s.tresCol}>
          {/* Cliente */}
          <View style={s.seccion}>
            <Text style={s.secLabel}>CLIENTE</Text>
            {cliente ? (
              <>
                <Text style={s.secNombre}>{cliente.nombre}</Text>
                {cliente.telefono && <Text style={s.secDato}>Tel: {cliente.telefono}</Text>}
              </>
            ) : (
              <Text style={s.secDato}>Sin cliente registrado</Text>
            )}
          </View>

          {/* Vehículo */}
          <View style={s.seccion}>
            <Text style={s.secLabel}>VEHÍCULO</Text>
            <Text style={s.secNombre}>
              {[orden.vehiculo_marca, orden.vehiculo_modelo].filter(Boolean).join(' ') || '—'}
            </Text>
            {orden.vehiculo_año && <Text style={s.secDato}>Año: {orden.vehiculo_año}</Text>}
            {orden.placas       && <Text style={s.secDato}>Placas: {orden.placas}</Text>}
            {orden.kilometraje  && <Text style={s.secDato}>Km: {orden.kilometraje.toLocaleString()}</Text>}
          </View>

          {/* Fechas */}
          <View style={s.seccion}>
            <Text style={s.secLabel}>FECHAS</Text>
            <Text style={s.secDato}>Entrada: {fmtFecha(orden.fecha_entrada)}</Text>
            {orden.fecha_prometida && <Text style={s.secDato}>Prometida: {fmtFecha(orden.fecha_prometida)}</Text>}
            {orden.fecha_entrega   && <Text style={s.secDato}>Entrega: {fmtFecha(orden.fecha_entrega)}</Text>}
            {orden.mecanico_asignado && <Text style={[s.secDato, { marginTop: 4 }]}>Mecánico: {orden.mecanico_asignado}</Text>}
          </View>
        </View>

        {/* ── DESCRIPCIÓN ── */}
        {(orden.descripcion_problema || orden.diagnostico) && (
          <View style={[s.notaBox, { marginBottom: 14 }]}>
            {orden.descripcion_problema && (
              <>
                <Text style={s.notaLabel}>PROBLEMA REPORTADO</Text>
                <Text style={s.notaTexto}>{orden.descripcion_problema}</Text>
              </>
            )}
            {orden.diagnostico && (
              <>
                <Text style={[s.notaLabel, { marginTop: 6 }]}>DIAGNÓSTICO</Text>
                <Text style={s.notaTexto}>{orden.diagnostico}</Text>
              </>
            )}
          </View>
        )}

        {/* ── TABLA SERVICIOS ── */}
        <View style={s.tablaHeader}>
          <Text style={s.thDesc}>Descripción</Text>
          <Text style={s.thNum}>Cant.</Text>
          <Text style={s.thMonto}>P. Unit.</Text>
          <Text style={s.thMonto}>Total</Text>
        </View>

        {orden.servicios_realizados?.map((srv, i) => (
          <View key={i} style={[s.fila, i % 2 === 1 ? s.filaImpar : {}]}>
            <Text style={s.tdDesc}>{srv.descripcion}</Text>
            <Text style={s.tdNum}>{srv.cantidad}</Text>
            <Text style={s.tdMonto}>{fmt(srv.precio_unitario, moneda)}</Text>
            <Text style={s.tdMonto}>{fmt(srv.total, moneda)}</Text>
          </View>
        ))}

        {/* ── TOTALES ── */}
        <View style={s.totalesBox}>
          <View style={s.totalFila}>
            <Text style={s.totalLabel}>Subtotal</Text>
            <Text style={s.totalVal}>{fmt(orden.subtotal, moneda)}</Text>
          </View>
          {orden.descuento > 0 && (
            <View style={s.totalFila}>
              <Text style={s.totalLabel}>Descuento</Text>
              <Text style={s.totalVal}>-{fmt(orden.descuento, moneda)}</Text>
            </View>
          )}
          {impuestos > 0 && (
            <View style={s.totalFila}>
              <Text style={s.totalLabel}>{ivaLabel}</Text>
              <Text style={s.totalVal}>{fmt(impuestos, moneda)}</Text>
            </View>
          )}
          <View style={s.totalLinea} />
          <View style={s.totalGrande}>
            <Text style={s.totalGLabel}>TOTAL</Text>
            <Text style={s.totalGVal}>{fmt(orden.total, moneda)}</Text>
          </View>
          <Text style={[s.totalLabel, { marginTop: 3 }]}>
            Forma de pago: {orden.forma_pago?.charAt(0).toUpperCase()}{orden.forma_pago?.slice(1)}
          </Text>
        </View>

        {/* ── NOTAS + FIRMA ── */}
        <View style={s.dosCol}>
          {orden.notas_internas ? (
            <View style={[s.notaBox, { flex: 1 }]}>
              <Text style={s.notaLabel}>NOTAS</Text>
              <Text style={s.notaTexto}>{orden.notas_internas}</Text>
            </View>
          ) : <View style={{ flex: 1 }} />}

          {orden.firma_url ? (
            <View style={s.firmaBox}>
              <Text style={s.firmaLabel}>FIRMA DEL CLIENTE</Text>
              <Image src={orden.firma_url} style={s.firmaImg} />
            </View>
          ) : <View style={{ flex: 1 }} />}
        </View>

        {/* ── QR OPT-IN WHATSAPP ── */}
        {qrOptInUrl && (
          <View style={s.qrRow}>
            <Image src={qrOptInUrl} style={s.qrImg} />
            <View style={s.qrTextBox}>
              <Text style={s.qrLabel}>Escanea para recibir actualizaciones de tu auto</Text>
              <Text style={s.qrSub}>Te escribimos por WhatsApp cuando tu vehículo tenga novedades.</Text>
            </View>
          </View>
        )}

        {/* ── FOOTER ── */}
        <View style={s.footer}>
          <Text style={s.footerText}>
            {taller.nombre} · {taller.telefono ?? ''} · {taller.email ?? ''}
          </Text>
          <Text style={s.footerBrand}>Generado por TallerOS</Text>
        </View>

      </Page>
    </Document>
  )
}