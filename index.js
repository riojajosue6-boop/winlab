const express = require('express');
const axios = require('axios');
const admin = require('./admin');
const app = express();

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY; 
global.MIS_FAVORITOS = []; 

function traducirPrediccion(codigo) {
    const mapa = {
        '1': 'Victoria Local',
        '2': 'Victoria Visitante',
        'X': 'Empate',
        '1X': 'Local o Empate',
        '2X': 'Visitante o Empate',
        '12': 'Local o Visitante'
    };
    return mapa[codigo] || codigo;
}

async function obtenerPartidosAPI() {
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
    try {
        const res = await axios.request(options);
        return res.data.data || [];
    } catch (e) { return []; }
}

app.get('/', async (req, res) => {
    try {
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
                <title>WinLab 🔬</title>
                <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🔬</text></svg>">
                <style>
                    body { font-family: sans-serif; background: #0f172a; color: white; margin: 0; padding: 15px; }
                    .nav { text-align: center; padding: 20px 0; border-bottom: 2px solid #fbbf24; font-weight: 800; font-size: 24px; }
                    .container { max-width: 500px; margin: 0 auto; }
                    .card { background: white; color: #1e293b; border-radius: 15px; padding: 15px; margin-top: 20px; border-top: 5px solid #fbbf24; }
                    .teams { display: flex; justify-content: space-between; font-weight: bold; margin: 10px 0; }
                    .prediction-box { background: #f8fafc; padding: 10px; border-radius: 10px; text-align: center; border: 1px solid #e2e8f0; }
                    .analysis-panel { background: #f1f5f9; padding: 10px; border-radius: 8px; font-size: 11px; margin-top: 10px; color: #475569; }
                    .prob-grid { display: flex; justify-content: space-around; margin-top: 5px; font-weight: bold; color: #0f172a; }
                    .low-priority { text-align: center; font-size: 10px; color: #94a3b8; margin-top: 10px; font-style: italic; border-top: 1px solid #f1f5f9; padding-top: 8px; }
                </style>
            </head>
            <body>
                <div class="nav">WINLAB 🔬</div>
                <div class="container">
                    ${filtrados.map(p => {
                        const probs = p.probabilities || {};
                        const pL = Math.round((probs['1'] || 0) * 100);
                        const pE = Math.round((probs['X'] || 0) * 100);
                        const pV = Math.round((probs['2'] || 0) * 100);
                        const tieneDatos = (pL + pE + pV) > 0;

                        return `
                        <div class="card">
                            <div style="font-size:10px; color:gray;">🏆 ${p.competition_name || 'Liga'}</div>
                            <div class="teams">
                                <span>${p.home_team}</span> <span>VS</span> <span>${p.away_team}</span>
                            </div>
                            <div class="prediction-box">
                                <small>PRONÓSTICO:</small><br>
                                <b style="color:#10b981; font-size:1.2rem;">${traducirPrediccion(p.prediction)}</b>
                            </div>
                            
                            ${tieneDatos ? `
                                <div class="analysis-panel">
                                    <b>📊 PROBABILIDADES IA:</b>
                                    <div class="prob-grid">
                                        <span>L: ${pL}%</span> <span>E: ${pE}%</span> <span>V: ${pV}%</span>
                                    </div>
                                </div>
                            ` : `
                                <div class="low-priority">
                                    ⚠️ Liga de baja prioridad: Sin métricas avanzadas disponibles.
                                </div>
                            `}
                        </div>`;
                    }).join('')}
                </div>
            </body>
            </html>
        `);
    } catch (error) {
        res.status(500).send("Error interno.");
    }
});

app.use('/admin', admin);
const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0');
