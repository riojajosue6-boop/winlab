const express = require('express');
const axios = require('axios');
const admin = require('./admin'); // Importamos tu panel de control
const app = express();

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY; 

// Base de datos temporal en memoria
global.MIS_FAVORITOS = []; 

async function obtenerPartidosAPI() {
    const hoy = new Date().toISOString().split('T')[0];
    const options = {
        method: 'GET',
        url: 'https://football-prediction-api.p.rapidapi.com/api/v2/predictions',
        params: { market: 'classic', iso_date: hoy, federation: 'UEFA' },
        headers: { 'x-rapidapi-key': RAPIDAPI_KEY, 'x-rapidapi-host': 'football-prediction-api.p.rapidapi.com' }
    };
    try {
        const res = await axios.request(options);
        return res.data.data || [];
    } catch (e) { return []; }
}

// RUTA PÚBLICA (Lo que ve tu audiencia)
app.get('/', async (req, res) => {
    const partidos = await obtenerPartidosAPI();
    let filtrados = global.MIS_FAVORITOS.length > 0 
        ? partidos.filter(p => global.MIS_FAVORITOS.includes(p.home_team)) 
        : partidos;

    res.send(`
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>WinLab | Pronósticos Premium</title>
            <style>
                body { font-family: 'Segoe UI', sans-serif; background: #0f172a; color: white; margin: 0; padding: 15px; }
                .nav { text-align: center; padding: 20px; border-bottom: 3px solid #fbbf24; margin-bottom: 25px; font-size: 28px; font-weight: 800; letter-spacing: 2px; }
                .container { max-width: 500px; margin: 0 auto; }
                .card { background: white; color: #1e293b; border-radius: 15px; padding: 20px; margin-bottom: 15px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.5); border-left: 6px solid #fbbf24; }
                .teams { font-size: 1.2rem; font-weight: bold; display: flex; justify-content: space-between; margin-bottom: 10px; }
                .prediction { background: #f1f5f9; padding: 10px; border-radius: 8px; text-align: center; font-weight: bold; color: #0f172a; border: 1px solid #cbd5e1; }
                .ad-space { background: #1e293b; border: 1px dashed #334155; padding: 15px; text-align: center; font-size: 10px; color: #94a3b8; margin: 20px 0; border-radius: 10px; }
            </style>
        </head>
        <body>
            <div class="nav">WINLAB 🔬</div>
            <div class="container">
                <div class="ad-space">PUBLICIDAD - ADSTERRA TOP</div>
                
                ${filtrados.map(p => `
                    <div class="card">
                        <div class="teams"><span>${p.home_team}</span> <span>VS</span> <span>${p.away_team}</span></div>
                        <div class="prediction">Predicción IA: ${p.prediction}</div>
                    </div>
                `).join('')}

                <div class="ad-space">PUBLICIDAD - ADSTERRA FOOTER</div>
            </div>
        </body>
        </html>
    `);
});

// Conectamos el archivo de administración
app.use('/admin', admin);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("WinLab Online"));
