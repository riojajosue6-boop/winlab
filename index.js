const express = require('express');
const axios = require('axios');
const admin = require('./admin');
const app = express();

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY; 
global.MIS_FAVORITOS = []; 

function traducir(codigo) {
    const mapa = {
        '1': 'Victoria Local', '2': 'Victoria Visitante', 'X': 'Empate',
        '1X': 'Local o Empate', '2X': 'Visitante o Empate', '12': 'Local o Visitante'
    };
    return mapa[codigo] || codigo;
}

app.get('/', async (req, res) => {
    try {
        const hoy = new Date().toISOString().split('T')[0];
        const response = await axios.get('https://football-prediction-api.p.rapidapi.com/api/v2/predictions', {
            params: { market: 'classic', iso_date: hoy, federation: 'UEFA' },
            headers: { 'x-rapidapi-key': RAPIDAPI_KEY, 'x-rapidapi-host': 'football-prediction-api.p.rapidapi.com' }
        });
        const partidos = response.data.data || [];
        let filtrados = global.MIS_FAVORITOS.length > 0 ? partidos.filter(p => global.MIS_FAVORITOS.includes(p.home_team)) : partidos;

        res.send(`
            <!DOCTYPE html>
            <html lang="es">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>OjoDeGol 👁️ | IA de Pronósticos</title>
                <style>
                    body { font-family: 'Segoe UI', sans-serif; background: #0b0f19; color: white; margin: 0; padding: 15px; }
                    .header { text-align: center; padding: 30px 0; color: #fbbf24; font-size: 28px; font-weight: 900; letter-spacing: 2px; }
                    .container { max-width: 500px; margin: 0 auto; }
                    .card { background: #ffffff; color: #1e293b; border-radius: 20px; padding: 20px; margin-bottom: 25px; border-bottom: 8px solid #fbbf24; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
                    .league-tag { font-size: 10px; background: #f1f5f9; padding: 4px 10px; border-radius: 5px; color: #64748b; font-weight: bold; text-transform: uppercase; }
                    .teams { display: flex; justify-content: space-between; align-items: center; margin: 15px 0; font-size: 1.2rem; font-weight: 800; }
                    .vs { font-size: 0.7rem; color: #cbd5e1; background: #f8fafc; padding: 5px; border-radius: 50%; border: 1px solid #e2e8f0; }
                    .prediction-main { background: #ecfdf5; border: 2px solid #10b981; border-radius: 12px; padding: 15px; text-align: center; margin-bottom: 15px; }
                    .analysis-box { background: #f8fafc; border-radius: 12px; padding: 15px; font-size: 12px; color: #475569; border: 1px solid #e2e8f0; }
                    .prob-bar { display: flex; justify-content: space-around; font-weight: 800; color: #0f172a; margin-top: 8px; font-size: 14px; }
                </style>
            </head>
            <body>
                <div class="header">👁️ OJODEGOL</div>
                <div class="container">
                    ${filtrados.map(p => {
                        const probs = p.probabilities || {};
                        const pGoles = Math.round((probs['over_25'] || 0) * 100);
                        const pL = Math.round((probs['1'] || 0) * 100);
                        const pE = Math.round((probs['X'] || 0) * 100);
                        const pV = Math.round((probs['2'] || 0) * 100);
                        
                        let lecturaGoles = pGoles > 60 ? "🔥 Alta tendencia a +2.5 goles" : "🛡️ Partido de pocos goles (Bajo 2.5)";
                        if ((pL + pE + pV) === 0) lecturaGoles = "⚠️ Liga de baja prioridad: Sin métricas de goles.";

                        return `
                        <div class="card">
                            <span class="league-tag">🏆 ${p.competition_name || 'Internacional'}</span>
                            <div class="teams">
                                <span style="flex:1; text-align:right;">${p.home_team}</span>
                                <span class="vs">VS</span>
                                <span style="flex:1; text-align:left;">${p.away_team}</span>
                            </div>
                            <div class="prediction-main">
                                <small style="color:#059669; font-weight:bold; display:block; margin-bottom:5px;">RECOMENDACIÓN OJODEGOL:</small>
                                <span style="color:#065f46; font-size:1.4rem; font-weight:900;">${traducir(p.prediction)}</span>
                            </div>
                            <div class="analysis-box">
                                <b>🎯 LECTURA DE GOLES:</b><br>
                                <span>${lecturaGoles}</span>
                                ${(pL + pE + pV) > 0 ? `
                                    <div style="margin-top:10px; border-top:1px solid #e2e8f0; pt:10px;">
                                        <b>📊 PROBABILIDADES:</b>
                                        <div class="prob-bar">
                                            <span>L: ${pL}%</span> <span>E: ${pE}%</span> <span>V: ${pV}%</span>
                                        </div>
                                    </div>
                                ` : ''}
                            </div>
                        </div>`;
                    }).join('')}
                </div>
            </body>
            </html>
        `);
    } catch (e) { res.status(500).send("Error"); }
});

app.use('/admin', admin);
const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0');
