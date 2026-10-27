import pg from 'pg';

export default async function handler(req, res) {
  // Solo permitir consultas de obtención de datos (GET)
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Método no permitido' });
  }

  // Configurar la conexión segura con Neon
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    // Consultar solo los artículos aprobados para exhibición en la web
    const query = `
      SELECT 
        codigo_sistema_local, 
        codigo_sku_odoo, 
        nombre_comercial, 
        marca, 
        modelo, 
        precio_bcv, 
        imagen_url, 
        video_url, 
        caracteristicas_tecnicas
      FROM articulos_web 
      WHERE exhibir_en_web = TRUE
      ORDER BY id ASC;
    `;

    const result = await pool.query(query);
    await pool.end();

    // Enviamos los datos ordenados al frontend (Nota que excluimos el pitch para que no lo plagien por F12)
    return res.status(200).json({
      success: true,
      articulos: result.rows
    });

  } catch (error) {
    await pool.end();
    console.error('Error al consultar el catálogo:', error);
    return res.status(500).json({ success: false, message: 'Error interno al cargar los productos.' });
  }
}
