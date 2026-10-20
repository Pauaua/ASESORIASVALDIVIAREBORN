/** Bloque de un texto legal: título de sección, subtítulo, párrafo o viñeta. */
export type LegalBlock = { type: 'h2' | 'h3' | 'p' | 'li'; text: string }
