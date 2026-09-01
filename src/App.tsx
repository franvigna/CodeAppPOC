import { useEffect, useState } from 'react'
import './App.css'
import { LISTADODEWIKISService } from './generated/services/LISTADODEWIKISService'
import type { LISTADODEWIKISRead } from './generated/models/LISTADODEWIKISModel'

function App() {
  const [wikis, setWikis] = useState<LISTADODEWIKISRead[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    LISTADODEWIKISService.getAll()
      .then((resultado) => {
        if (resultado.success) {
          setWikis(resultado.data)
        } else {
          setError('No se pudo cargar el listado de wikis.')
        }
      })
      .finally(() => setLoading(false))
  }, [])

  return (
    <div style={{ padding: '2rem', textAlign: 'left' }}>
      <h1>Listado de Wikis</h1>

      {loading && <p>Cargando...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {!loading && !error && (
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
