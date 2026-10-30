import pg from 'pg';

// Devuelve los artículos activos en la web (exhibir_en_web = TRUE), con su categoría y subcategoría.
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Método no permitido' });
  }

  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const { rows } = await pool.query(`
      SELECT
        a.codigo_sistema_local,
        a.nombre_comercial,
        a.marca,
        a.modelo,
        a.precio_bcv,
        a.imagen_url,
        a.video_url,
        a.argumento_venta_pitch,
        a.caracteristicas_tecnicas,
        c.codigo_slug AS subcategoria_slug,
        p.codigo_slug AS categoria_slug
      FROM articulos_web a
      LEFT JOIN categorias_web c ON c.id = a.subcategoria_id
      LEFT JOIN categorias_web p ON p.id = c.categoria_padre_id
      WHERE a.exhibir_en_web = TRUE
      ORDER BY a.id ASC;
    `);
    return res.status(200).json({ success: true, articulos: rows });
  } catch (error) {
    console.error('Error al consultar el catálogo:', error);
    return res.status(500).json({ success: false, message: 'No se pudo cargar el catálogo.' });
  } finally {
    await pool.end();
  }
}
