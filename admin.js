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
            headers: { 
                'x-rapidapi-key': RAPIDAPI_KEY, 
                'x-rapidapi-host': 'football-prediction-api.p.rapidapi.com' 
            }
        });
        const partidos = response.data.data || [];

        // Guardar selección
        if (req.query.select) {
            global.MIS_FAVORITOS = Array.isArray(req.query.select) ? req.query.select : [req.query.select];
            return res.send(`
                <body style="font-family:sans-serif; text-align:center; padding:50px;">
                    <h1>✅ Selección Guardada</h1>
                    <p>Los cambios ya están en vivo en la portada.</p>
                    <a href="/" style="padding:10px 20px; background:#fbbf24; color:black; text-decoration:none; border-radius:5px; font-weight:bold;">VER PORTADA</a>
                    <br><br>
                    <a href="/admin?pass=${ADMIN_PASS}">Volver al Admin</a>
                </body>
            `);
        }

        // Diseño del Panel Admin
        res.send(`
            <html>
            <head>
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <style>
                    body { font-family: sans-serif; background: #f1f5f9; padding: 15px; color: #1e293b; }
                    .header { background: #0f172a; color: white; padding: 20px; border-radius: 10px; margin-bottom: 20px; text-align: center; }
                    .match-card { background: white; padding: 15px; border-radius: 8px; margin-bottom: 10px; border: 1px solid #e2e8f0; display: flex; align-items: center; }
                    .btn-save { position: sticky; bottom: 20px; width: 100%; background: #fbbf24; border: none; padding: 20px; font-weight: bold; border-radius: 10px; cursor: pointer; box-shadow: 0 4px 10px rgba(0,0,0,0.2); }
                </style>
            </head>
            <body>
                <div class="header">
                    <h2>🔬 Panel Control WinLab</h2>
                    <p style="font-size:12px;">Selecciona los partidos más relevantes</p>
                </div>

                <form action="/admin" method="GET">
                    <input type="hidden" name="pass" value="${ADMIN_PASS}">
                    
                    ${partidos.length > 0 ? partidos.map(p => `
                        <label class="match-card">
                            <input type="checkbox" name="select" value="${p.home_team}" 
                            ${global.MIS_FAVORITOS.includes(p.home_team) ? 'checked' : ''} 
                            style="width:20px; height:20px; margin-right:15px;">
                            <div>
                                <strong>${p.home_team} vs ${p.away_team}</strong><br>
                                <span style="font-size:12px; color:#64748b;">${p.competition_name}</span>
                            </div>
                        </label>
                    `).join('') : "<p>No hay partidos disponibles hoy.</p>"}

                    <button type="submit" class="btn-save">ACTUALIZAR PORTADA EN VIVO</button>
                </form>
                
                <div style="text-align:center; margin-top:20px;">
                    <a href="/admin?pass=${ADMIN_PASS}&select=" style="color:red; font-size:12px;">Desmarcar todos y mostrar todo</a>
                </div>
            </body>
            </html>
        `);
    } catch (e) { 
        res.send("Error al conectar con la API. Verifica tu RAPIDAPI_KEY en las variables de Railway."); 
    }
});

module.exports = router;
