const express = require('express');
const router = express.Router();
const axios = require('axios');

router.use(express.urlencoded({ extended: true }));

const ADMIN_PASS = "winlab2026"; // Cambia si deseas

router.get('/', async (req, res) => {
    if (req.query.pass !== ADMIN_PASS) return res.send("<h1>Acceso Denegado</h1>");

    try {
        const hoy = new Date().toISOString().split('T')[0];
        const response = await axios.get('https://football-prediction-api.p.rapidapi.com/api/v2/predictions', {
            params: { 
                market: 'classic', 
                iso_date: hoy,
                federation: 'CONMEBOL,UEFA,FIFA,CONCACAF,AFC'
            },
            headers: { 
                'x-rapidapi-key': process.env.RAPIDAPI_KEY, 
                'x-rapidapi-host': 'football-prediction-api.p.rapidapi.com' 
            }
        });
        
        const partidos = response.data.data || [];
        const ligas = {};
        partidos.forEach(p => {
            if (!ligas[p.competition_name]) ligas[p.competition_name] = [];
            ligas[p.competition_name].push(p);
        });

        res.send(`
            <html>
            <head><meta name="viewport" content="width=device-width, initial-scale=1"></head>
            <body style="font-family:sans-serif; padding:15px; background:#f1f5f9; color:#1e293b;">
                <h2 style="text-align:center;">🕵️‍♂️ OjoDeGol Admin</h2>
                <p style="text-align:center; font-size:12px;">Marca los partidos que quieres mostrar en el Index</p>
                
                <form action="/admin/save" method="POST">
                    ${Object.keys(ligas).map(liga => `
                        <div style="background:white; padding:15px; border-radius:12px; margin-bottom:15px; box-shadow:0 2px 8px rgba(0,0,0,0.1);">
                            <h3 style="margin-top:0; color:#0f172a; border-bottom:3px solid #fbbf24; padding-bottom:5px;">🏆 ${liga}</h3>
                            ${ligas[liga].map(p => `
                                <label style="display:flex; align-items:center; margin:10px 0; font-size:14px; cursor:pointer;">
                                    <input type="checkbox" name="partidos" value="${p.home_team}" 
                                    ${global.MIS_FAVORITOS.includes(p.home_team) ? 'checked' : ''} 
                                    style="width:20px; height:20px; margin-right:10px;"> 
                                    ${p.home_team} vs ${p.away_team}
                                </label>
                            `).join('')}
                        </div>
                    `).join('')}
                    
                    <div style="height:80px;"></div>
                    <button type="submit" style="position:fixed; bottom:20px; left:50%; transform:translateX(-50%); width:90%; max-width:400px; padding:18px; background:#fbbf24; border:none; border-radius:15px; font-weight:900; font-size:16px; cursor:pointer; box-shadow:0 8px 20px rgba(251,191,36,0.4);">
                        🚀 PUBLICAR EN PORTADA
                    </button>
                </form>
            </body>
            </html>
        `);
    } catch (e) { res.send("Error conectando con la API de Predicciones."); }
});

router.post('/save', (req, res) => {
    const seleccionados = req.body.partidos;
    global.MIS_FAVORITOS = Array.isArray(seleccionados) ? seleccionados : (seleccionados ? [seleccionados] : []);
    res.send(`
        <div style="text-align:center; padding:50px; font-family:sans-serif;">
            <h1>✅ Portada Actualizada</h1>
            <p>Los partidos seleccionados ya están visibles.</p>
            <a href="/" style="color:#fbbf24; font-weight:bold;">IR AL INICIO</a> | 
            <a href="/admin?pass=${ADMIN_PASS}">VOLVER AL ADMIN</a>
        </div>
    `);
});

module.exports = router;
