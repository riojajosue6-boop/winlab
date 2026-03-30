const express = require('express');
const axios = require('axios');
const app = express();

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY; 
const ADMIN_PASS = "winlab2026"; 
let MIS_FAVORITOS = []; 

app.get('/', async (req, res) => {
    try {
        // Usamos una fecha fija para probar si la API responde (Hoy)
        const hoy = new Date().toISOString().split('T')[0];
        
        const options = {
            method: 'GET',
            url: 'https://football-prediction-api.p.rapidapi.com/api/v2/predictions',
            params: { market: 'classic', iso_date: hoy, federation: 'UEFA' },
            headers: { 
                'x-rapidapi-key': RAPIDAPI_KEY, 
                'x-rapidapi-host': 'football-prediction-api.p.rapidapi.com' 
            }
        };

        const response = await axios.request(options);
        const partidos = response.data.data || [];

        // Filtro de favoritos
        let mostrados = MIS_FAVORITOS.length > 0 
            ? partidos.filter(p => MIS_FAVORITOS.includes(p.home_team)) 
            : partidos;

        let html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
                body { font-family: sans-serif; background: #0f172a; color: white; padding: 20px; text-align: center; }
                .navbar { font-size: 24px; font-weight: bold; border-bottom: 3px solid #fbbf24; padding-bottom: 10px; margin-bottom: 20px; }
                .card { background: white; color: #1e293b; border-radius: 12px; padding: 20px; margin: 10px auto; max-width: 400px; text-align: left; }
            </style>
        </head>
        <body>
            <div class="navbar">WINLAB 🔬</div>
            <p>Fecha: ${hoy}</p>
            ${mostrados.length > 0 ? mostrados.map(p => `
                <div class="card">
                    <h3>${p.home_team} vs ${p.away_team}</h3>
                    <p>Predicción: <strong>${p.prediction}</strong></p>
                </div>
            `).join('') : "<h3>No hay partidos para esta fecha en UEFA.</h3>"}
        </body>
        </html>`;
        res.send(html);

    } catch (error) {
        // Si hay error, mostramos qué pasó exactamente para arreglarlo
        console.error(error);
        res.send(`
            <h1>WinLab: Error de Conexión</h1>
            <p>Detalle: ${error.response ? error.response.data.message : error.message}</p>
            <p>Verifica que tu RAPIDAPI_KEY en Render sea correcta.</p>
        `);
    }
});

// Mantén tu código de /admin igual abajo...
app.get('/admin', (req, res) => { /* ... mismo código anterior ... */ res.send("Panel Admin"); });

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('WinLab Online'));
