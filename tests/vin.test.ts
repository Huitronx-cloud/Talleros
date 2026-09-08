import { describe, it, expect } from 'vitest'
import {
  normalizarVin, digitoControlEsperado, digitoControlCuadra,
  problemaVin, vinValido, aniosPosibles, anioProbable,
  motorLegible, mapearNhtsa,
} from '@/lib/vin'

// Los VIN de las pruebas salen de la base de datos real, no están inventados.
// Los cuatro primeros son coches que pasaron por talleres de verdad.
const NP300  = '3N6AD35AXKK844275' // Nissan, armado en Jiutepec
const JETTA  = '3VW1W1AJ6HM345958' // Volkswagen, armado en Puebla
const VIRTUS = '9BWDL5BZ5NP015244' // Volkswagen, armado en Brasil
const FORTE  = 'KNAFZ4A71G5451922' // Kia, armado en Corea

describe('normalizarVin', () => {
  it('quita guiones y espacios y sube a mayúsculas', () => {
    expect(normalizarVin(' 3vw1w1aj6-hm345958 ')).toBe(JETTA)
  })

  it('la nada no revienta', () => {
    expect(normalizarVin(null)).toBe('')
    expect(normalizarVin(undefined)).toBe('')
  })
})

describe('digito de control', () => {
  it('cuadra en los cuatro coches reales', () => {
    for (const vin of [NP300, JETTA, VIRTUS, FORTE]) {
      expect(digitoControlCuadra(vin)).toBe(true)
    }
  })

  // Estos tres estaban guardados en la base como si fueran VIN buenos.
  it('caza los VIN inventados que ya había en la base', () => {
    expect(digitoControlCuadra('12345678912345678')).toBe(false)
    expect(digitoControlCuadra('1D2F1S2D1F2S3E2D1')).toBe(false)
    expect(digitoControlCuadra('MK909090909090909')).toBe(false)
  })

  it('un solo carácter cambiado rompe el dígito: para eso existe', () => {
    const conDedazo = JETTA.slice(0, 12) + '9' + JETTA.slice(13)
    expect(digitoControlCuadra(conDedazo)).toBe(false)
  })

  it('sin 17 caracteres no hay dígito que calcular', () => {
    expect(digitoControlEsperado('3VW1W1AJ6')).toBeNull()
  })
})

describe('problemaVin', () => {
  it('los VIN buenos no tienen problema', () => {
    expect(problemaVin(JETTA)).toBeNull()
    expect(vinValido(JETTA)).toBe(true)
  })

  it('dice cuántos caracteres faltan en vez de un "inválido" a secas', () => {
    expect(problemaVin('3VW1W1AJ6')).toContain('9')
  })

  it('explica la letra prohibida y qué suele ser en realidad', () => {
    const conO = 'O' + JETTA.slice(1)
    expect(problemaVin(conO)).toContain('0 (cero)')
    const conI = 'I' + JETTA.slice(1)
    expect(problemaVin(conI)).toContain('1 (uno)')
  })

  it('el campo vacío pide el VIN, no da un error', () => {
    expect(problemaVin('')).toBe('Escribe el VIN.')
  })

  // El dígito de control no descalifica: en Europa y parte de Asia no todos
  // los fabricantes lo respetan, y bloquear dejaría al mecánico sin trabajar.
  it('un dígito que no cuadra NO invalida el VIN', () => {
    expect(vinValido('12345678912345678')).toBe(true)
    expect(digitoControlCuadra('12345678912345678')).toBe(false)
  })
})

describe('año por la posición 10', () => {
  // Este es el caso que NHTSA falló: respondió 1992 para un coche de 2022.
  it('el Virtus da las dos posibilidades y elige la reciente', () => {
    expect(aniosPosibles(VIRTUS)).toContain(1992)
    expect(aniosPosibles(VIRTUS)).toContain(2022)
    expect(anioProbable(VIRTUS)).toBe(2022)
  })

  it('acierta el Jetta y el Forte, que NHTSA también acertó', () => {
    expect(anioProbable(JETTA)).toBe(2017)
    expect(anioProbable(FORTE)).toBe(2016)
  })

  it('no propone años en el futuro', () => {
    const limite = new Date().getFullYear() + 1
    for (const vin of [NP300, JETTA, VIRTUS, FORTE]) {
      for (const anio of aniosPosibles(vin)) expect(anio).toBeLessThanOrEqual(limite)
    }
  })

  it('un VIN a medias no inventa año', () => {
    expect(aniosPosibles('3VW1W1AJ6')).toEqual([])
    expect(anioProbable('3VW1W1AJ6')).toBeNull()
  })
})

describe('motorLegible', () => {
  it('el Jetta trae el motor en EngineModel y la cilindrada vacía', () => {
    expect(motorLegible({ EngineModel: '1.4 TSI', Turbo: 'Yes', DisplacementL: '', EngineCylinders: '' }))
      .toBe('1.4 TSI · turbo')
  })

  it('el Forte lo trae repartido en varios campos', () => {
    expect(motorLegible({
      EngineModel: 'MPI Nu', DisplacementL: '2', EngineCylinders: '4',
      EngineConfiguration: 'In-Line', ValveTrainDesign: 'Dual Overhead Cam (DOHC)',
      FuelTypePrimary: 'Gasoline',
    })).toBe('MPI Nu · 2.0L · 4 cil. · en línea · DOHC · gasolina')
  })

  it('sin datos de motor devuelve null, no una cadena a medias', () => {
    expect(motorLegible({ EngineModel: '', DisplacementL: '', EngineCylinders: '' })).toBeNull()
  })

  it('una cilindrada en cero no se cuela como "0.0L"', () => {
    expect(motorLegible({ DisplacementL: '0' })).toBeNull()
  })
})

describe('mapearNhtsa', () => {
  it('marca limpio solo cuando el ErrorCode es 0', () => {
    expect(mapearNhtsa({ ErrorCode: '0' }).limpio).toBe(true)
    // El Jetta trajo un motor perfecto CON este código, y la NP300 trajo una
    // cilindrada equivocada con el mismo. Por eso no basta mirar los campos.
    expect(mapearNhtsa({ ErrorCode: '5,14' }).limpio).toBe(false)
    expect(mapearNhtsa({}).limpio).toBe(false)
  })

  it('el año del Virtus llega como 1992 y se pasa tal cual: la corrección va aparte', () => {
    expect(mapearNhtsa({ ModelYear: '1992' }).anio).toBe(1992)
  })

  it('un modelo vacío es null y no una cadena vacía', () => {
    const d = mapearNhtsa({ Make: 'VOLKSWAGEN', Model: '' })
    expect(d.marca).toBe('VOLKSWAGEN')
    expect(d.modelo).toBeNull()
  })

  it('junta la transmisión y traduce el estilo', () => {
    expect(mapearNhtsa({ TransmissionStyle: 'Manual/Standard', TransmissionSpeeds: '5' }).transmision)
      .toBe('Manual · 5 vel.')
  })

  it('el rin lleva sus comillas', () => {
    expect(mapearNhtsa({ WheelSizeFront: '16' }).rin).toBe('16"')
  })

  it('la planta junta ciudad y país', () => {
    expect(mapearNhtsa({ PlantCity: 'PUEBLA', PlantCountry: 'MEXICO' }).planta).toBe('PUEBLA, MEXICO')
  })
})
