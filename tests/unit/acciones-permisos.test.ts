import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Rol } from '@/lib/rbac'

/*
 * Recorre cada Server Action del panel con cada rol y verifica que el servidor rechace (403) lo
 * que la matriz no permite, aunque la acción se llame directo. La sesión y la BD están simuladas.
 */

const sesion = vi.hoisted(() => ({ actual: null as null | { id: string; role: string } }))

vi.mock('@/lib/auth', () => ({
  auth: async () =>
    sesion.actual ? { user: { ...sesion.actual, name: 'Prueba', email: 'p@x.cl' } } : null,
}))
vi.mock('next/server', () => ({ connection: async () => {} }))
vi.mock('next/cache', () => ({ refresh: () => {} }))
vi.mock('next/navigation', () => ({
  redirect: (url: string) => {
    throw new Error(`redirect:${url}`)
  },
  unstable_rethrow: () => {},
}))
vi.mock('@/lib/blob', () => ({ borrarBlob: async () => {} }))

const db = vi.hoisted(() => {
  type Args = { where?: unknown; data?: Record<string, unknown> }
  const modelo = () => ({
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(async () => []),
    count: vi.fn(async () => 1),
    create: vi.fn(async (_args: Args) => ({ id: 99 })),
    update: vi.fn(async (_args: Args) => ({ id: 1 })),
    updateMany: vi.fn(async (_args: Args) => ({ count: 1 })),
    delete: vi.fn(async (_args: Args) => ({ id: 1 })),
    deleteMany: vi.fn(async (_args: Args) => ({ count: 1 })),
  })
  const base = {
    user: modelo(),
    resource: modelo(),
    resourceFile: modelo(),
    contactForm: modelo(),
    cotizationForm: modelo(),
    $transaction: vi.fn(),
  }
  base.$transaction.mockImplementation(async (fn: (tx: unknown) => unknown) => fn(base))
  return base
})
vi.mock('@/lib/db', () => ({ db }))

const usuarios = await import('@/lib/actions/usuarios')
const recursos = await import('@/lib/actions/recursos')
const mensajes = await import('@/lib/actions/mensajes')

const IDS: Record<Rol, number> = { ADMIN: 1, TEAM: 2, CLIENT: 3 }

function como(rol: Rol | null) {
  sesion.actual = rol ? { id: String(IDS[rol]), role: rol } : null
}

const personal = {
  username: 'nuevo',
  name: 'Nuevo',
  lastname: 'Usuario',
  phone: '912345678',
  email: 'nuevo@ejemplo.cl',
}

beforeEach(() => {
  vi.clearAllMocks()
  // Objetivo por defecto: un CLIENT activo con id 3 (distinto de ADMIN y TEAM).
  db.user.findUnique.mockResolvedValue({
    id: 3,
    role: 'CLIENT',
    active: true,
    email: 'cliente@x.cl',
    image: null,
    files: [],
  })
  db.resource.findUnique.mockResolvedValue({ files: [] })
  db.resourceFile.findUnique.mockResolvedValue({ url: 'https://ejemplo.cl/a.pdf' })
  db.user.count.mockResolvedValue(2)
})

type Caso = {
  nombre: string
  permitidos: Rol[]
  ejecutar: () => Promise<{ ok: boolean; status?: number }>
}

const CASOS: Caso[] = [
  {
    nombre: 'crearUsuario',
    permitidos: ['ADMIN'],
    ejecutar: () => usuarios.crearUsuario({ ...personal, password: '12345678', role: 'CLIENT' }),
  },
  {
    nombre: 'editarUsuario (otro)',
    permitidos: ['ADMIN'],
    ejecutar: () => usuarios.editarUsuario(3, { ...personal, role: 'CLIENT' }),
  },
  {
    nombre: 'cambiarEstadoUsuario (otro)',
    permitidos: ['ADMIN'],
    ejecutar: () => usuarios.cambiarEstadoUsuario(3, false),
  },
  {
    nombre: 'eliminarUsuario (otro)',
    permitidos: ['ADMIN'],
    ejecutar: () => usuarios.eliminarUsuario(3, 'cliente@x.cl'),
  },
  { nombre: 'leerUsuario', permitidos: ['ADMIN'], ejecutar: () => usuarios.leerUsuario(3) },
  {
    nombre: 'editarCliente (Drive)',
    permitidos: ['ADMIN', 'TEAM'],
    ejecutar: () => usuarios.editarCliente(3, { driveURL: 'https://drive.google.com/x' }),
  },
  {
    nombre: 'actualizarPerfil',
    permitidos: ['ADMIN', 'TEAM', 'CLIENT'],
    ejecutar: () => usuarios.actualizarPerfil(personal),
  },
  {
    nombre: 'crearCategoria',
    permitidos: ['ADMIN'],
    ejecutar: () => recursos.crearCategoria({ name: 'Cat' }),
  },
  {
    nombre: 'editarCategoria',
    permitidos: ['ADMIN'],
    ejecutar: () => recursos.editarCategoria(1, { name: 'Cat' }),
  },
  {
    nombre: 'eliminarCategoria',
    permitidos: ['ADMIN'],
    ejecutar: () => recursos.eliminarCategoria(1),
  },
  {
    nombre: 'crearArchivo',
    permitidos: ['ADMIN'],
    ejecutar: () =>
      recursos.crearArchivo({ name: 'A', url: 'https://a.cl', type: 'link', resourceId: 1 }),
  },
  {
    nombre: 'editarArchivo',
    permitidos: ['ADMIN'],
    ejecutar: () =>
      recursos.editarArchivo(1, { name: 'A', url: 'https://a.cl', type: 'link', resourceId: 1 }),
  },
  { nombre: 'eliminarArchivo', permitidos: ['ADMIN'], ejecutar: () => recursos.eliminarArchivo(1) },
  {
    nombre: 'marcarLeido',
    permitidos: ['ADMIN', 'TEAM'],
    ejecutar: () => mensajes.marcarLeido({ tipo: 'contacto', id: 1 }, true),
  },
  {
    nombre: 'eliminarMensaje',
    permitidos: ['ADMIN'],
    ejecutar: () => mensajes.eliminarMensaje({ tipo: 'cotizacion', id: 1 }),
  },
  {
    nombre: 'exportarMensajesCsv',
    permitidos: ['ADMIN'],
    ejecutar: () => mensajes.exportarMensajesCsv({ tipo: 'contacto' }),
  },
]

const ESCRITURAS = () =>
  [db.user, db.resource, db.resourceFile, db.contactForm, db.cotizationForm].flatMap((m) => [
    m.create,
    m.update,
    m.updateMany,
    m.delete,
    m.deleteMany,
  ])

describe('Server Actions × rol', () => {
  for (const caso of CASOS) {
    for (const rol of ['ADMIN', 'TEAM', 'CLIENT'] as const) {
      const permitido = caso.permitidos.includes(rol)
      it(`${caso.nombre}: ${rol} → ${permitido ? 'permitido' : '403'}`, async () => {
        como(rol)
        const r = await caso.ejecutar()
        if (permitido) {
          expect(r, JSON.stringify(r)).toMatchObject({ ok: true })
        } else {
          expect(r).toMatchObject({ ok: false, status: 403 })
          for (const escritura of ESCRITURAS()) expect(escritura).not.toHaveBeenCalled()
        }
      })
    }
    it(`${caso.nombre}: sin sesión → 401`, async () => {
      como(null)
      expect(await caso.ejecutar()).toMatchObject({ ok: false, status: 401 })
    })
  }
})

describe('reglas sobre sí mismo y último ADMIN', () => {
  it('ADMIN no puede desactivarse a sí mismo', async () => {
    como('ADMIN')
    db.user.findUnique.mockResolvedValue({ id: 1, role: 'ADMIN', active: true })
    expect(await usuarios.cambiarEstadoUsuario(1, false)).toMatchObject({ ok: false, status: 403 })
    expect(db.user.update).not.toHaveBeenCalled()
  })

  it('ADMIN no puede cambiarse su propio rol', async () => {
    como('ADMIN')
    db.user.findUnique.mockResolvedValue({ id: 1, role: 'ADMIN', active: true, image: null })
    const r = await usuarios.editarUsuario(1, { ...personal, role: 'TEAM' })
    expect(r).toMatchObject({ ok: false, status: 403 })
    expect(db.user.update).not.toHaveBeenCalled()
  })

  it('ADMIN no puede eliminarse a sí mismo', async () => {
    como('ADMIN')
    db.user.findUnique.mockResolvedValue({ id: 1, role: 'ADMIN', active: true, email: 'a@x.cl' })
    expect(await usuarios.eliminarUsuario(1, 'a@x.cl')).toMatchObject({ ok: false, status: 403 })
  })

  it('no se desactiva al último ADMIN activo', async () => {
    como('ADMIN')
    db.user.findUnique.mockResolvedValue({ id: 5, role: 'ADMIN', active: true })
    db.user.count.mockResolvedValue(1)
    expect(await usuarios.cambiarEstadoUsuario(5, false)).toMatchObject({ ok: false, status: 403 })
  })

  it('eliminar exige escribir el correo del usuario', async () => {
    como('ADMIN')
    expect(await usuarios.eliminarUsuario(3, 'otro@x.cl')).toMatchObject({ ok: false, status: 400 })
    expect(db.user.delete).not.toHaveBeenCalled()
  })

  it('crearUsuario nunca crea ADMIN', async () => {
    como('ADMIN')
    const r = await usuarios.crearUsuario({ ...personal, password: '12345678', role: 'ADMIN' })
    expect(r).toMatchObject({ ok: false, status: 400 })
    expect(db.user.create).not.toHaveBeenCalled()
  })
})

describe('perfil propio por rol', () => {
  const conExtras = {
    ...personal,
    company: 'Empresa',
    companyRUT: '12.345.678-5',
    companyEmail: 'Ventas@Empresa.cl',
    companyPhone: '552000000',
    // Campos que nunca deben aceptarse desde el perfil:
    active: false,
    role: 'ADMIN',
    driveURL: 'https://drive.google.com/x',
    image: 'https://evil.cl/a.png',
  }

  it('CLIENT guarda su información comercial (RUT normalizado) y nada más', async () => {
    como('CLIENT')
    expect(await usuarios.actualizarPerfil(conExtras)).toMatchObject({ ok: true })
    const data = db.user.update.mock.calls[0]?.[0]?.data
    expect(data).toMatchObject({
      company: 'Empresa',
      companyRUT: '12345678-5',
      companyEmail: 'ventas@empresa.cl',
    })
    for (const prohibido of ['active', 'role', 'driveURL', 'image']) {
      expect(data).not.toHaveProperty(prohibido)
    }
    expect(db.user.update.mock.calls[0]?.[0]?.where).toEqual({ id: IDS.CLIENT })
  })

  it('CLIENT con RUT inválido recibe error de campo', async () => {
    como('CLIENT')
    const r = await usuarios.actualizarPerfil({ ...personal, companyRUT: '12.345.678-9' })
    expect(r).toMatchObject({ ok: false, status: 400 })
    expect(r.ok === false && r.fieldErrors?.companyRUT).toBeTruthy()
  })

  it('ADMIN y TEAM no guardan campos comerciales ni de control', async () => {
    for (const rol of ['ADMIN', 'TEAM'] as const) {
      vi.clearAllMocks()
      como(rol)
      expect(await usuarios.actualizarPerfil(conExtras)).toMatchObject({ ok: true })
      const data = db.user.update.mock.calls[0]?.[0]?.data
      for (const prohibido of ['company', 'companyRUT', 'active', 'role', 'driveURL', 'image']) {
        expect(data).not.toHaveProperty(prohibido)
      }
    }
  })

  it('TEAM solo edita el Drive del cliente, aunque envíe datos comerciales', async () => {
    como('TEAM')
    const r = await usuarios.editarCliente(3, {
      driveURL: 'https://drive.google.com/x',
      company: 'Hackeada',
    })
    expect(r).toMatchObject({ ok: true })
    expect(db.user.update.mock.calls[0]?.[0]?.data).toEqual({
      driveURL: 'https://drive.google.com/x',
    })
  })

  it('el link de Drive debe ser de Google Drive/Docs', async () => {
    como('ADMIN')
    const r = await usuarios.editarCliente(3, { driveURL: 'https://evil.cl/x' })
    expect(r).toMatchObject({ ok: false, status: 400 })
  })
})
