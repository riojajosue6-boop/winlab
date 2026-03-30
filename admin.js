const express = require('express');
const axios = require('axios');
const router = express.Router();

const ADMIN_PASS = "winlab2026";
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;

router.get('/', async (req, res) => {
    if (req.query.pass !== ADMIN_PASS) return res.send("Acceso Denegado");

    const hoy = new Date().toISOString().split('T')[0];
    try {
        const response = await axios.get('https://football-prediction-api.p.rapidapi.com/api/v2/predictions', {
            params: { market: 'classic', iso_date: hoy, federation: 'UEFA' },
            headers: { 'x-rapidapi-key': RAPIDAPI_KEY, 'x-rapidapi-host': 'football-prediction-api.p.rapidapi.com' }
        });
        const partidos = response.data.data || [];

        if (req.query.select) {
            global.MIS_FAVORITOS = Array.isArray(req.query.select) ? req.query.select : [req.query.select];
            return res.send("<h1>WinLab: Selección Guardada</h1><a href='/'>Ir a Portada</a>");
        }

        res.send(`
            <html>
            <body style="font-family:sans-serif; padding:20px; background:#f8fafc;">
                <h2>🔬 WinLab Admin Panel</h2>
                <form action="/admin">
                    <input type="hidden" name="pass" value="${ADMIN_PASS}">
                    ${partidos.map(p => `
                        <div style="padding:15px; background:white; margin-bottom:5px; border-radius:8px; border:1px solid #e2e8f0;">
                            <input type="checkbox" name="select" value="${p.home_team}" 
                            ${global.MIS_FAVORITOS.includes(p.home_team) ? 'checked' : ''}> 
                            <strong>${p.home_team} vs ${p.away_team}</strong>
                        </div>
                    `).join('')}
                    <button type="submit" style="width:100%; padding:20px; background:#fbbf24; border:none; font-weight:bold; border-radius:10px; margin-top:10px; cursor:pointer;">
                        ACTUALIZAR SELECCIÓN MUNDIAL
                    </button>
                </form>
                <br><a href="/admin?pass=${ADMIN_PASS}&select=" style="color:red;">Restablecer (Ver todo)</a>
            </body>
            </html>
        `);
    } catch (e) { res.send("Error cargando lista admin."); }
});

module.exports = router;
