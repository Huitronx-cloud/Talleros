import {
  Document, Page, Text, View, StyleSheet, Image,
} from '@react-pdf/renderer'
import { Cotizacion, Taller } from '@/types'

const AZUL   = '#1D4ED8'
const OSCURO = '#111827'
const MEDIO  = '#6B7280'
const CLARO  = '#F9FAFB'
const BORDE  = '#E5E7EB'

const s = StyleSheet.create({
  page:        { fontFamily: 'Helvetica', fontSize: 10, color: OSCURO, backgroundColor: '#FFFFFF', paddingHorizontal: 40, paddingVertical: 36 },
  // Header
  header:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 },
  logoBox:     { width: 60, height: 60 },
  logo:        { width: 60, height: 60, objectFit: 'contain' },
  logoPlaceholder: { width: 60, height: 60, backgroundColor: AZUL, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  logoLetra:   { color: '#FFFFFF', fontSize: 28, fontFamily: 'Helvetica-Bold' },
  tallerInfo:  { flex: 1, paddingLeft: 16 },
  tallerNombre:{ fontSize: 18, fontFamily: 'Helvetica-Bold', color: OSCURO, marginBottom: 4 },
  tallerDato:  { fontSize: 9, color: MEDIO, marginBottom: 2 },
  // Badge cotización
  badgeBox:    { alignItems: 'flex-end' },
  badgeLabel:  { fontSize: 9, color: MEDIO, letterSpacing: 1.2, marginBottom: 4 },
  badgeNumero: { fontSize: 22, fontFamily: 'Helvetica-Bold', color: AZUL },
  badgeFecha:  { fontSize: 9, color: MEDIO, marginTop: 4 },
  // Divider
  divider:     { height: 1, backgroundColor: BORDE, marginVertical: 16 },
  // Sección 2 col
  dosCol:      { flexDirection: 'row', gap: 16, marginBottom: 20 },
  seccion:     { flex: 1, backgroundColor: CLARO, borderRadius: 6, padding: 12 },
  secLabel:    { fontSize: 8, color: AZUL, fontFamily: 'Helvetica-Bold', letterSpacing: 0.8, marginBottom: 8 },
  secNombre:   { fontSize: 11, fontFamily: 'Helvetica-Bold', color: OSCURO, marginBottom: 3 },
  secDato:     { fontSize: 9, color: MEDIO, marginBottom: 2 },
  // Tabla servicios
  tablaHeader: { flexDirection: 'row', backgroundColor: AZUL, borderRadius: 4, paddingVertical: 7, paddingHorizontal: 10, marginBottom: 2 },
  thDesc:      { flex: 1, color: '#FFFFFF', fontFamily: 'Helvetica-Bold', fontSize: 9 },
  thNum:       { width: 40, color: '#FFFFFF', fontFamily: 'Helvetica-Bold', fontSize: 9, textAlign: 'center' },
  thMonto:     { width: 70, color: '#FFFFFF', fontFamily: 'Helvetica-Bold', fontSize: 9, textAlign: 'right' },
  fila:        { flexDirection: 'row', paddingVertical: 7, paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: BORDE },
  filaImpar:   { backgroundColor: CLARO },
  tdDesc:      { flex: 1, fontSize: 9, color: OSCURO },
  tdNum:       { width: 40, fontSize: 9, color: MEDIO, textAlign: 'center' },
  tdMonto:     { width: 70, fontSize: 9, color: OSCURO, textAlign: 'right' },
  // Totales
  totalesBox:  { alignItems: 'flex-end', marginTop: 12 },
  totalFila:   { flexDirection: 'row', width: 200, justifyContent: 'space-between', marginBottom: 4 },
  totalLabel:  { fontSize: 9, color: MEDIO },
  totalVal:    { fontSize: 9, color: OSCURO },
  totalLinea:  { height: 1, backgroundColor: BORDE, width: 200, marginVertical: 6 },
  totalGrande: { flexDirection: 'row', width: 200, justifyContent: 'space-between' },
  totalGLabel: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: OSCURO },
  totalGVal:   { fontSize: 12, fontFamily: 'Helvetica-Bold', color: AZUL },
  // Notas y vigencia
  notaBox:     { backgroundColor: CLARO, borderRadius: 6, padding: 12, marginTop: 24, borderLeftWidth: 3, borderLeftColor: AZUL },
  notaLabel:   { fontSize: 8, color: AZUL, fontFamily: 'Helvetica-Bold', letterSpacing: 0.8, marginBottom: 4 },
  notaTexto:   { fontSize: 9, color: MEDIO, lineHeight: 1.5 },
  // Footer
  footer:      { position: 'absolute', bottom: 24, left: 40, right: 40, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  footerText:  { fontSize: 8, color: BORDE },
  footerBrand: { fontSize: 8, color: MEDIO },
})

function fmt(n: number, moneda: string) {
  return `${moneda === 'MXN' ? '$' : 'COP '}${n.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`
}

interface Props {
  cotizacion: Cotizacion
  taller: Taller
}

export default function CotizacionDocumento({ cotizacion, taller }: Props) {
  const cliente  = cotizacion.clientes
  const moneda   = cotizacion.moneda
  const fecha    = new Date(cotizacion.created_at).toLocaleDateString('es-MX', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
  const vigencia = new Date(new Date(cotizacion.created_at).getTime() + cotizacion.vigencia_dias * 86400000)
    .toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <Document title={`Cotización #${String(cotizacion.numero_cotizacion).padStart(4, '0')}`}>
      <Page size="A4" style={s.page}>

        {/* ── HEADER ── */}
        <View style={s.header}>
          {/* Logo o inicial */}
          <View style={s.logoBox}>
            {taller.logo_url ? (
              <Image src={taller.logo_url} style={s.logo} />
            ) : (
              <View style={s.logoPlaceholder}>
                <Text style={s.logoLetra}>{taller.nombre.charAt(0).toUpperCase()}</Text>
              </View>
            )}
          </View>

          {/* Info del taller */}
          <View style={s.tallerInfo}>
            <Text style={s.tallerNombre}>{taller.nombre}</Text>
            {taller.direccion && <Text style={s.tallerDato}>{taller.direccion}</Text>}
            {taller.telefono  && <Text style={s.tallerDato}>Tel: {taller.telefono}</Text>}
            {taller.email     && <Text style={s.tallerDato}>{taller.email}</Text>}
          </View>

          {/* Número de cotización */}
          <View style={s.badgeBox}>
            <Text style={s.badgeLabel}>COTIZACIÓN</Text>
            <Text style={s.badgeNumero}>#{String(cotizacion.numero_cotizacion).padStart(4, '0')}</Text>
            <Text style={s.badgeFecha}>{fecha}</Text>
          </View>
        </View>

        <View style={s.divider} />

        {/* ── CLIENTE Y VEHÍCULO ── */}
        <View style={s.dosCol}>
          <View style={s.seccion}>
            <Text style={s.secLabel}>CLIENTE</Text>
            {cliente ? (
              <>
                <Text style={s.secNombre}>{cliente.nombre}</Text>
                {cliente.telefono && <Text style={s.secDato}>Tel: {cliente.telefono}</Text>}
                {cliente.email    && <Text style={s.secDato}>{cliente.email}</Text>}
              </>
            ) : (
              <Text style={s.secDato}>Sin cliente asignado</Text>
            )}
          </View>

          <View style={s.seccion}>
            <Text style={s.secLabel}>VIGENCIA</Text>
            <Text style={s.secNombre}>{cotizacion.vigencia_dias} días</Text>
            <Text style={s.secDato}>Válida hasta el {vigencia}</Text>
            <Text style={[s.secDato, { marginTop: 6 }]}>Estado: {cotizacion.estado.toUpperCase()}</Text>
          </View>
        </View>

        {/* ── TABLA DE SERVICIOS ── */}
        <View style={s.tablaHeader}>
          <Text style={s.thDesc}>Descripción</Text>
          <Text style={s.thNum}>Cant.</Text>
          <Text style={s.thMonto}>P. Unitario</Text>
          <Text style={s.thMonto}>Subtotal</Text>
        </View>

        {cotizacion.servicios.map((srv, i) => (
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
            <Text style={s.totalVal}>{fmt(cotizacion.subtotal, moneda)}</Text>
          </View>
          {cotizacion.descuento > 0 && (
            <View style={s.totalFila}>
              <Text style={s.totalLabel}>Descuento</Text>
              <Text style={s.totalVal}>-{fmt(cotizacion.descuento, moneda)}</Text>
            </View>
          )}
          {cotizacion.impuestos > 0 && (
            <View style={s.totalFila}>
              <Text style={s.totalLabel}>IVA (16%)</Text>
              <Text style={s.totalVal}>{fmt(cotizacion.impuestos, moneda)}</Text>
            </View>
          )}
          <View style={s.totalLinea} />
          <View style={s.totalGrande}>
            <Text style={s.totalGLabel}>TOTAL</Text>
            <Text style={s.totalGVal}>{fmt(cotizacion.total, moneda)}</Text>
          </View>
        </View>

        {/* ── NOTAS ── */}
        {cotizacion.notas && (
          <View style={s.notaBox}>
            <Text style={s.notaLabel}>NOTAS</Text>
            <Text style={s.notaTexto}>{cotizacion.notas}</Text>
          </View>
        )}

        {/* ── VIGENCIA ── */}
        <View style={[s.notaBox, { marginTop: 12 }]}>
          <Text style={s.notaTexto}>
            Esta cotización es válida por {cotizacion.vigencia_dias} días a partir de la fecha de emisión ({fecha}).
            Después de esta fecha los precios pueden cambiar sin previo aviso.
          </Text>
        </View>

        {/* ── FOOTER ── */}
        <View style={s.footer}>
          <Text style={s.footerText}>
            {taller.nombre} · {taller.telefono ?? ''} · {taller.email ?? ''}
          </Text>
          <Text style={s.footerBrand}>Generado por Talleros</Text>
        </View>

      </Page>
    </Document>
  )
}
