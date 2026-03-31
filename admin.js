const express = require('express');
const router = express.Router();
const axios = require('axios');

router.use(express.urlencoded({ extended: true }));

router.get('/', async (req, res) => {
    try {
        const hoy = new Date().toISOString().split('T')[0];
        const response = await axios.get('https://football-prediction-api.p.rapidapi.com/api/v2/predictions', {
            params: { market: 'classic', iso_date: hoy },
            headers: { 'x-rapidapi-key': process.env.RAPIDAPI_KEY, 'x-rapidapi-host': 'football-prediction-api.p.rapidapi.com' }
        });
        
        const partidos = response.data.data || [];
        const ligas = {};
        partidos.forEach(p => {
            if (!ligas[p.competition_name]) ligas[p.competition_name] = [];
            ligas[p.competition_name].push(p);
        });

        res.send(`
            <html>
            <body style="font-family:sans-serif; padding:20px; background:#f1f5f9;">
                <h2>🕵️‍♂️ Admin OjoDeGol - Seleccionar Partidos</h2>
                <form action="/admin/save" method="POST">
                    ${Object.keys(ligas).map(liga => `
                        <div style="background:white; padding:15px; border-radius:10px; margin-bottom:20px; box-shadow:0 2px 5px rgba(0,0,0,0.1);">
                            <h3 style="margin-top:0; color:#1e293b; border-bottom:2px solid #fbbf24;">🏆 ${liga}</h3>
                            ${ligas[liga].map(p => `
                                <label style="display:block; margin:8px 0; cursor:pointer;">
                                    <input type="checkbox" name="partidos" value="${p.home_team}" 
                                    ${global.MIS_FAVORITOS.includes(p.home_team) ? 'checked' : ''}> 
                                    ${p.home_team} vs ${p.away_team}
                                </label>
                            `).join('')}
                        </div>
                    `).join('')}
                    <button style="position:fixed; bottom:20px; right:20px; padding:15px 30px; background:#fbbf24; border:none; border-radius:50px; font-weight:bold; cursor:pointer; box-shadow:0 5px 15px rgba(0,0,0,0.3);">
                        💾 GUARDAR SELECCIÓN
                    </button>
                </form>
            </body>
            </html>
        `);
    } catch (e) { res.send("Error cargando partidos"); }
});

router.post('/save', (req, res) => {
    const seleccionados = req.body.partidos;
    global.MIS_FAVORITOS = Array.isArray(seleccionados) ? seleccionados : (seleccionados ? [seleccionados] : []);
    res.send("<h1>✅ Guardado. Los cambios se verán en el Index.</h1><a href='/admin'>Volver</a>");
});

module.exports = router;
