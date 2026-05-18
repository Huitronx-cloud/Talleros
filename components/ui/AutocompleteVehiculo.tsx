'use client'

import { useState, useRef, useEffect } from 'react'

const MARCAS = [
  'Acura','Alfa Romeo','Audi','BMW','BYD','Buick','Cadillac','Chery','Chevrolet',
  'Chrysler','Citroën','Dodge','FAW','Fiat','Ford','GAC','GMC','Geely','Great Wall',
  'Honda','Hyundai','Infiniti','JAC','Jeep','Kia','Land Rover','Lexus','Lincoln',
  'Mazda','Mercedes-Benz','MG','Mini','Mitsubishi','Nissan','Omoda','Peugeot',
  'Pontiac','Porsche','RAM','Renault','SEAT','Subaru','Suzuki','Toyota','Volkswagen',
  'Volvo','Wuling','Zotye',
]

const MODELOS: Record<string, string[]> = {
  'Toyota':     ['Corolla','Camry','RAV4','Hilux','Land Cruiser','Yaris','Prius','Fortuner','Avanza','4Runner'],
  'Nissan':     ['Sentra','Versa','X-Trail','Frontier','Kicks','March','Pathfinder','Murano','Altima','NP300'],
  'Chevrolet':  ['Spark','Aveo','Trax','Equinox','Silverado','Colorado','Captiva','Onix','Tracker','Beat'],
  'Ford':       ['Mustang','F-150','Explorer','Escape','Ranger','Focus','Fiesta','Expedition','Edge','Bronco'],
  'Volkswagen': ['Jetta','Golf','Tiguan','Polo','Passat','Vento','T-Cross','Taos','Touareg','Amarok'],
  'Honda':      ['Civic','Accord','CR-V','HR-V','Pilot','Fit','City','Ridgeline','Odyssey','BR-V'],
  'Hyundai':    ['Tucson','Santa Fe','Elantra','Accent','Creta','Sonata','Kona','Palisade','Venue','Ioniq'],
  'Kia':        ['Sportage','Seltos','Sorento','Rio','Picanto','Stinger','Carnival','Telluride','Cerato','Soul'],
  'BMW':        ['Serie 1','Serie 2','Serie 3','Serie 5','Serie 7','X1','X3','X5','X7','M3'],
  'Mercedes-Benz': ['Clase A','Clase C','Clase E','Clase S','GLA','GLC','GLE','GLS','CLA','AMG GT'],
  'Audi':       ['A1','A3','A4','A6','A8','Q3','Q5','Q7','Q8','TT'],
  'Mazda':      ['Mazda2','Mazda3','Mazda6','CX-3','CX-30','CX-5','CX-9','MX-5','BT-50'],
  'Mitsubishi': ['Outlander','Eclipse Cross','L200','ASX','Montero','Galant','Lancer','Pajero'],
  'Dodge':      ['Ram','Challenger','Charger','Durango','Journey','Grand Caravan'],
  'Jeep':       ['Wrangler','Grand Cherokee','Cherokee','Compass','Renegade','Gladiator'],
  'RAM':        ['1500','2500','3500','ProMaster'],
  'Suzuki':     ['Swift','Vitara','Grand Vitara','Jimny','Baleno','Ignis','Dzire'],
  'Subaru':     ['Forester','Outback','Impreza','Legacy','XV','WRX','BRZ'],
  'Renault':    ['Duster','Sandero','Logan','Koleos','Captur','Kwid','Megane'],
  'Peugeot':    ['208','308','3008','5008','2008','508','Partner'],
  'Citroën':    ['C3','C4','Berlingo','Jumper','C5 Aircross'],
  'Fiat':       ['Uno','Palio','Strada','Pulse','Fastback','Argo','Cronos'],
  'BYD':        ['Atto 3','Han','Tang','Song Plus','Seal','Dolphin','Yuan Plus'],
  'Chery':      ['Tiggo 2','Tiggo 4','Tiggo 7','Tiggo 8','Arrizo 5','Arrizo 6'],
  'Geely':      ['Coolray','Okavango','Emgrand','Atlas','Tugella'],
  'MG':         ['MG3','MG5','MG6','HS','ZS','RX5','One'],
  'JAC':        ['S3','S4','S7','T6','T8','iEV'],
  'Wuling':     ['Almaz','Formo','Confero','Air EV'],
}

interface Props {
  value: string
  onChange: (val: string) => void
  placeholder?: string
  className?: string
  type: 'marca' | 'modelo'
  marcaSeleccionada?: string
}

export default function AutocompleteVehiculo({ value, onChange, placeholder, className, type, marcaSeleccionada }: Props) {
  const [abierto, setAbierto]         = useState(false)
  const [sugerencias, setSugerencias] = useState<string[]>([])
  const inputRef  = useRef<HTMLInputElement>(null)
  const wrapRef   = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setAbierto(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function handleChange(val: string) {
    onChange(val)
    if (val.length < 1) { setSugerencias([]); setAbierto(false); return }

    const lista = type === 'marca'
      ? MARCAS
      : (marcaSeleccionada && MODELOS[marcaSeleccionada]) ? MODELOS[marcaSeleccionada] : Object.values(MODELOS).flat()

    const filtradas = lista.filter(item =>
      item.toLowerCase().includes(val.toLowerCase())
    ).slice(0, 8)

    setSugerencias(filtradas)
    setAbierto(filtradas.length > 0)
  }

  function seleccionar(item: string) {
    onChange(item)
    setSugerencias([])
    setAbierto(false)
    inputRef.current?.blur()
  }

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={e => handleChange(e.target.value)}
        onFocus={() => value.length > 0 && sugerencias.length > 0 && setAbierto(true)}
        placeholder={placeholder}
        className={className}
        autoComplete="off"
      />
      {abierto && sugerencias.length > 0 && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          zIndex: 50,
          background: '#fff',
          border: '1px solid #e5e7eb',
          borderRadius: 10,
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          marginTop: 4,
          overflow: 'hidden',
        }}>
          {sugerencias.map((item, i) => (
            <button
              key={i}
              type="button"
              onMouseDown={() => seleccionar(item)}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                padding: '9px 14px',
                fontSize: 14,
                color: '#111827',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                borderBottom: i < sugerencias.length - 1 ? '1px solid #f3f4f6' : 'none',
                transition: 'background .15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#f9fafb')}
              onMouseLeave={e => (e.currentTarget.style.background = 'none')}
            >
              {item}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}