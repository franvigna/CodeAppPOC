import { useEffect, useState } from 'react'
import './App.css'
import { Cr1e4_pruebasService } from './generated/services/Cr1e4_pruebasService'
import type { Cr1e4_pruebas } from './generated/models/Cr1e4_pruebasModel'
import { LISTADODEWIKISService } from './generated/services/LISTADODEWIKISService'
import type { LISTADODEWIKISRead } from './generated/models/LISTADODEWIKISModel'

function App() {
  const [pruebas, setPruebas] = useState<Cr1e4_pruebas[]>([])
  const [pruebasLoading, setPruebasLoading] = useState(true)
  const [pruebasError, setPruebasError] = useState<string | null>(null)

  const [wikis, setWikis] = useState<LISTADODEWIKISRead[]>([])
  const [wikisLoading, setWikisLoading] = useState(true)
  const [wikisError, setWikisError] = useState<string | null>(null)

  useEffect(() => {
    Cr1e4_pruebasService.getAll()
      .then((resultado) => {
        if (resultado.success) {
          setPruebas(resultado.data)
        } else {
          setPruebasError('No se pudo cargar la tabla de prueba.')
        }
      })
      .finally(() => setPruebasLoading(false))

    LISTADODEWIKISService.getAll()
      .then((resultado) => {
        if (resultado.success) {
          setWikis(resultado.data)
        } else {
          setWikisError('No se pudo cargar el listado de wikis.')
        }
      })
      .finally(() => setWikisLoading(false))
  }, [])

  return (
    <div style={{ padding: '2rem', textAlign: 'left' }}>
      <h1>Tabla Prueba (Dataverse)</h1>

      {pruebasLoading && <p>Cargando...</p>}
      {pruebasError && <p style={{ color: 'red' }}>{pruebasError}</p>}

      {!pruebasLoading && !pruebasError && (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '2rem' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #444' }}>Nombre</th>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #444' }}>Descripción</th>
            </tr>
          </thead>
          <tbody>
            {pruebas.map((item) => (
              <tr key={item.cr1e4_pruebaid}>
                <td>{item.cr1e4_pruebaname}</td>
                <td>{item.cr1e4_descripcion}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h1>Listado de Wikis (SharePoint)</h1>

      {wikisLoading && <p>Cargando...</p>}
      {wikisError && <p style={{ color: 'red' }}>{wikisError}</p>}

      {!wikisLoading && !wikisError && (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #444' }}>Título</th>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #444' }}>Estado</th>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #444' }}>Tipo</th>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #444' }}>Generada por</th>
            </tr>
          </thead>
          <tbody>
            {wikis.map((wiki) => (
              <tr key={wiki.ID}>
                <td>{wiki.Title}</td>
                <td>{wiki.Estado?.Value ?? '-'}</td>
                <td>{wiki.TipoWiki?.Value ?? '-'}</td>
                <td>{wiki.GeneradaPor?.DisplayName ?? '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

export default App
