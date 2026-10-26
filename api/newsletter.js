import pg from 'pg';

export default async function handler(req, res) {
  // 1. Limitar a que solo acepte peticiones POST (envío de datos)
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Método no permitido' });
  }

  // 2. Extraer los datos enviados por el usuario
  const { email, nombre } = req.body;

  // Validación básica del correo
  if (!email || !email.includes('@')) {
    return res.status(400).json({ success: false, message: 'Por favor, proporciona un correo electrónico válido.' });
  }

  // 3. Crear la conexión con Neon Postgres usando la variable que configuramos antes
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false } // Requerido por Neon para conexiones seguras
  });

  try {
    // 4. Inyectar de forma segura los datos en la tabla (previene inyección SQL)
    const query = `
      INSERT INTO suscriptores_newsletter (email, nombre) 
      VALUES ($1, $2)
      RETURNING id, fecha_registro;
    `;
    const values = [email.trim().toLowerCase(), nombre ? nombre.trim() : null];
    
    const result = await pool.query(query, values);

    // Cerrar la conexión al terminar
    await pool.end();

    // 5. Responder al frontend que todo salió perfecto
    return res.status(200).json({ 
      success: true, 
      message: '¡Registro exitoso! Gracias por unirte a nuestro newsletter.',
      data: result.rows[0]
    });

  } catch (error) {
    await pool.end();
    
    // Capturar si el correo ya existe en la base de datos (Error 23505 de Postgres para UNIQUE)
    if (error.code === '23505') {
      return res.status(400).json({ success: false, message: 'Este correo electrónico ya está registrado.' });
    }

    console.error('Error en la base de datos:', error);
    return res.status(500).json({ success: false, message: 'Ocurrió un error interno en el servidor.' });
  }
}
