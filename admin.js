const express = require('express');
const axios = require('axios');
const router = express.Router();

const ADMIN_PASS = "winlab2026";
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;

router.get('/', async (req, res) => {
    if (req.query.pass !== ADMIN_PASS) return res.send("Acceso Denegado");

    // LÓGICA DE FECHA: Si no eliges una, usa la de HOY.
    // Pero ahora permitimos recibir una fecha por la URL (ej: ?fecha=2026-04-01)
    const hoy = new Date();
    const fechaSeleccionada = req.query.fecha || hoy.toISOString().split('T')[0];

    try {
        const response = await axios.get('https://football-prediction-api.p.rapidapi.com/api/v2/predictions', {
            params: { market: 'classic', iso_date: fechaSeleccionada, federation: 'UEFA' },
            headers: { 'x-rapidapi-key': RAPIDAPI_KEY, 'x-rapidapi-host': 'football-prediction-api.p.rapidapi.com' }
        });
        const partidos = response.data.data || [];

        if (req.query.select) {
            global.MIS_FAVORITOS = Array.isArray(req.query.select) ? req.query.select : [req.query.select];
            return res.send("<h1>WinLab: Selección Guardada</h1><a href='/'>Ir a Portada</a> | <a href='/admin?pass="+ADMIN_PASS+"'>Volver al Admin</a>");
        }

        // Creamos botones para Hoy, Mañana y Pasado Mañana
        const manana = new Date(hoy); manana.setDate(hoy.getDate() + 1);
        const pasado = new Date(hoy); pasado.setDate(hoy.getDate() + 2);

        const btnHoy = hoy.toISOString().split('T')[0];
        const btnMan = manana.toISOString().split('T')[0];
        const btnPas = pasado.toISOString().split('T')[0];

        res.send(`
            <html>
            <body style="font-family:sans-serif; padding:20px; background:#f8fafc;">
                <h2>🔬 WinLab Admin Panel</h2>
                
                <div style="margin-bottom:20px; background:white; padding:15px; border-radius:10px;">
                    <p><strong>Paso 1: Elige qué día quieres analizar:</strong></p>
                    <a href="?pass=${ADMIN_PASS}&fecha=${btnHoy}" style="padding:10px; background:#e2e8f0; text-decoration:none; border-radius:5px; margin-right:5px;">Hoy</a>
                    <a href="?pass=${ADMIN_PASS}&fecha=${btnMan}" style="padding:10px; background:#e2e8f0; text-decoration:none; border-radius:5px; margin-right:5px;">Mañana</a>
                    <a href="?pass=${ADMIN_PASS}&fecha=${btnPas}" style="padding:10px; background:#e2e8f0; text-decoration:none; border-radius:5px;">Pasado Mañana</a>
                </div>

                <form action="/admin">
                    <p><strong>Paso 2: Selecciona partidos para la portada (${fechaSeleccionada}):</strong></p>
                    <input type="hidden" name="pass" value="${ADMIN_PASS}">
                    ${partidos.length > 0 ? partidos.map(p => `
                        <div style="padding:15px; background:white; margin-bottom:5px; border-radius:8px; border:1px solid #e2e8f0;">
                            <input type="checkbox" name="select" value="${p.home_team}" 
                            ${global.MIS_FAVORITOS.includes(p.home_team) ? 'checked' : ''}> 
                            <strong>${p.home_team} vs ${p.away_team}</strong>
                        </div>
                    `).join('') : "<p>No hay predicciones listas para esta fecha todavía.</p>"}
                    
                    <button type="submit" style="width:100%; padding:20px; background:#fbbf24; border:none; font-weight:bold; border-radius:10px; margin-top:10px; cursor:pointer;">
                        PUBLICAR EN PORTADA
                    </button>
                </form>
            </body>
            </html>
        `);
    } catch (e) { res.send("Error cargando datos de esa fecha."); }
});

module.exports = router;
