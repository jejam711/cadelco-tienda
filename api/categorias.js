import pg from 'pg';

export default async function handler(req, res) {
  // Limitar estrictamente a consultas de obtención de datos (GET)
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Método no permitido' });
  }

  // Establecer conexión hermética y segura con Neon Postgres
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    // Extraemos la jerarquía completa de categorías y subcategorías
    const query = `
      SELECT id, codigo_slug, nombre_visible, categoria_padre_id 
      FROM categorias_web 
      WHERE activo = TRUE 
      ORDER BY categoria_padre_id ASC, nombre_visible ASC;
    `;
    
    const result = await pool.query(query);
    await pool.end();

    const filas = result.rows;
    const categoriasPrincipales = [];
    const mapeo = {};

    // Algoritmo que anida las subcategorías dentro de sus menús padres
    filas.forEach(cat => {
      mapeo[cat.id] = { ...cat, subcategorias: [] };
      if (cat.categoria_padre_id === null) {
        categoriasPrincipales.push(mapeo[cat.id]);
      } else {
        if (mapeo[cat.categoria_padre_id]) {
          mapeo[cat.categoria_padre_id].subcategorias.push(mapeo[cat.id]);
        }
      }
    });

    // Devolvemos el árbol estructurado listo para ser pintado al estilo Mercado Libre
    return res.status(200).json({
      success: true,
      menu: categoriasPrincipales
    });
  } catch (error) {
    await pool.end();
    console.error('Error al compilar el árbol de categorías:', error);
    return res.status(500).json({ success: false, message: 'Error interno en el servidor de menús.' });
  }
}
