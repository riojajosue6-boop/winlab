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
                <title>OjoDeGol 🕵️‍♂️⚽ | Análisis IA</title>
                <style>
                    body { font-family: 'Segoe UI', sans-serif; background: #0f172a; color: white; margin: 0; padding: 15px; }
                    .header { text-align: center; padding: 25px 0; color: #fbbf24; font-size: 26px; font-weight: 900; }
                    .container { max-width: 500px; margin: 0 auto; }
                    .card { background: #ffffff; color: #1e293b; border-radius: 24px; padding: 20px; margin-bottom: 25px; box-shadow: 0 10px 25px rgba(0,0,0,0.3); position: relative; overflow: hidden; }
                    .league-badge { font-size: 10px; background: #f1f5f9; padding: 5px 12px; border-radius: 20px; color: #64748b; font-weight: bold; }
                    
                    /* ESTILO EQUIPOS Y LOGOS */
                    .match-header { display: flex; justify-content: space-around; align-items: center; margin: 20px 0; text-align: center; }
                    .team { flex: 1; font-weight: 800; font-size: 14px; }
                    .team img { width: 45px; height: 45px; display: block; margin: 0 auto 8px; object-fit: contain; }
                    .vs-circle { background: #f8fafc; border: 1px solid #e2e8f0; width: 30px; height: 30px; line-height: 30px; border-radius: 50%; font-size: 10px; color: #cbd5e1; }

                    /* SEMÁFORO DE CONFIANZA */
                    .confidence { display: inline-block; padding: 4px 10px; border-radius: 8px; font-size: 10px; font-weight: bold; margin-bottom: 10px; text-transform: uppercase; }
                    .conf-high { background: #dcfce7; color: #166534; } /* Verde */
                    .conf-med { background: #fef9c3; color: #854d0e; }  /* Amarillo */

                    .prediction-box { background: #0f172a; color: #fbbf24; border-radius: 15px; padding: 15px; text-align: center; margin-bottom: 15px; }
                    
                    /* PANEL DE HORARIOS */
                    .time-panel { background: #f8fafc; border-radius: 12px; padding: 12px; font-size: 11px; color: #64748b; border: 1px solid #e2e8f0; }
                    .main-time { font-size: 14px; color: #1e293b; font-weight: 800; display: block; margin-bottom: 5px; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; }
                    .other-times { display: flex; justify-content: space-between; opacity: 0.8; }
                </style>
            </head>
            <body>
                <div class="header">🕵️‍♂️ OJODEGOL ⚽</div>
                <div class="container">
                    ${filtrados.map(p => {
                        const probs = p.probabilities || {};
                        const pWin = Math.max(probs['1'] || 0, probs['2'] || 0, probs['X'] || 0) * 100;
                        const confClass = pWin > 65 ? 'conf-high' : 'conf-med';
                        const confText = pWin > 65 ? '🔥 ALTA CONFIANZA' : '⚖️ ANÁLISIS PROBABLE';

                        // LOGICA DE HORARIOS
                        const fechaBase = new Date(p.start_date);
                        const hGmt = fechaBase.getUTCHours();
                        const mins = fechaBase.getUTCMinutes().toString().padStart(2, '0');

                        const hBol = (hGmt - 4 + 24) % 24;
                        const hMex = (hGmt - 6 + 24) % 24;
                        const hEsp = (hGmt + 1 + 24) % 24;

                        // URL de Logo (Usa un servicio de placeholder si no encuentra)
                        const logoHome = `https://api.dicebear.com/7.x/initials/svg?seed=${p.home_team}&backgroundColor=b6e3f4`;
                        const logoAway = `https://api.dicebear.com/7.x/initials/svg?seed=${p.away_team}&backgroundColor=ffdfbf`;

                        return `
                        <div class="card">
                            <div style="display:flex; justify-content:space-between; align-items:center;">
                                <span class="league-badge">🏆 ${p.competition_name}</span>
                                <span class="confidence ${confClass}">${confText}</span>
                            </div>

                            <div class="match-header">
                                <div class="team">
                                    <img src="${logoHome}" alt="L">
                                    ${p.home_team}
                                </div>
                                <div class="vs-circle">VS</div>
                                <div class="team">
                                    <img src="${logoAway}" alt="V">
                                    ${p.away_team}
                                </div>
                            </div>

                            <div class="prediction-box">
                                <small style="text-transform:uppercase; font-size:9px; letter-spacing:1px; color:#94a3b8;">Sugerencia de la IA:</small><br>
                                <span style="font-size:1.4rem; font-weight:900;">${traducir(p.prediction)}</span>
                            </div>

                            <div class="time-panel">
                                <span class="main-time">🇧🇴 Bolivia: ${hBol}:${mins}</span>
                                <div class="other-times">
                                    <span>🇲🇽 México: ${hMex}:${mins}</span>
                                    <span>🇪🇸 España: ${hEsp}:${mins}</span>
                                </div>
                            </div>
                        </div>`;
                    }).join('')}
                </div>
            </body>
            </html>
        `);
    } catch (e) { res.status(500).send("Error de conexión"); }
});

app.use('/admin', admin);
const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0');
