export const LIMITS = {
  username: { min: 3, max: 50 },
  email: { max: 254 },
  personName: { min: 2, max: 80 },
  idNumber: { max: 20 }, // cédula/documento
  phone: { max: 20 },
  searchQuery: { max: 100 },
  shortText: { max: 100 }, // nombres de concepto, cargo, afiliación
  description: { max: 200 },
  notes: { max: 500 }, // textarea / observaciones
  dismissalDescription: { max: 250 }, // despido.descripcion (varchar(250))
  password: { min: 8, maxBytes: 72 },
  money: { max: 999_999_999.99, decimals: 2 },
  hours: { max: 24, decimals: 2 },
} as const;

export type Limits = typeof LIMITS;
