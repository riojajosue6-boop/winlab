const express = require('express');
const axios = require('axios');
const admin = require('./admin');
const app = express();

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;

// CACHE PARA AHORRAR CRÉDITOS
let cachePartidos = null;
let ultimaActualizacion = 0;
const TIEMPO_CACHE = 1000 * 60 * 120; // 2 horas en milisegundos

global.MIS_FAVORITOS = []; 

function traducir(codigo) {
    const mapa = {
        '1': 'Victoria Local', '2': 'Victoria Visitante', 'X': 'Empate',
        '1X': 'Local o Empate', '2X': 'Visitante o Empate', '12': 'Local o Visitante'
    };
    return mapa[codigo] || codigo;
}

async function obtenerDatosAPI() {
    const ahora = Date.now();
    if (cachePartidos && (ahora - ultimaActualizacion < TIEMPO_CACHE)) {
        return cachePartidos;
    }

    try {
        const hoy = new Date().toISOString().split('T')[0];
        const res = await axios.get('https://football-prediction-api.p.rapidapi.com/api/v2/predictions', {
            params: { market: 'classic', iso_date: hoy },
            headers: { 'x-rapidapi-key': RAPIDAPI_KEY, 'x-rapidapi-host': 'football-prediction-api.p.rapidapi.com' }
        });
        cachePartidos = res.data.data || [];
        ultimaActualizacion = ahora;
        return cachePartidos;
    } catch (e) {
        return cachePartidos || []; 
    }
}

app.get('/', async (req, res) => {
    const partidos = await obtenerDatosAPI();
    
    // Filtrar solo los que elegiste en el Admin
    let filtrados = global.MIS_FAVORITOS.length > 0 
        ? partidos.filter(p => global.MIS_FAVORITOS.includes(p.home_team)) 
        : partidos;

    // Agrupar por Ligas
    const ligas = {};
    filtrados.forEach(p => {
        if (!ligas[p.competition_name]) ligas[p.competition_name] = [];
        ligas[p.competition_name].push(p);
    });

    res.send(`
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>OjoDeGol 🕵️‍♂️⚽</title>
            <style>
                body { font-family: 'Segoe UI', sans-serif; background: #0f172a; color: white; margin: 0; padding: 15px; }
                .header { text-align: center; padding: 20px 0; color: #fbbf24; font-size: 24px; font-weight: 900; }
                .container { max-width: 500px; margin: 0 auto; }
                
                /* ESTILO ACORDEÓN */
                .liga-section { margin-bottom: 10px; border-radius: 12px; overflow: hidden; background: #1e293b; }
                .liga-header { background: #334155; padding: 15px; cursor: pointer; font-weight: bold; display: flex; justify-content: space-between; align-items: center; border-left: 4px solid #fbbf24; }
                .liga-content { display: none; padding: 10px; background: #0f172a; }
                
                .card { background: white; color: #1e293b; border-radius: 15px; padding: 15px; margin-bottom: 15px; }
                .teams { display: flex; justify-content: space-around; align-items: center; text-align: center; font-weight: 800; margin: 10px 0; }
                .team-img { width: 40px; height: 40px; display: block; margin-bottom: 5px; }
                .pred-box { background: #ecfdf5; border: 1px solid #10b981; padding: 10px; border-radius: 10px; text-align: center; margin: 10px 0; }
                .time-box { font-size: 10px; color: #64748b; text-align: center; border-top: 1px solid #f1f5f9; padding-top: 8px; }
            </style>
        </head>
        <body>
            <div class="header">🕵️‍♂️ OJODEGOL ⚽</div>
            <div class="container">
                ${Object.keys(ligas).map(nombreLiga => `
                    <div class="liga-section">
                        <div class="liga-header" onclick="this.nextElementSibling.style.display = this.nextElementSibling.style.display === 'block' ? 'none' : 'block'">
                            <span>🏆 ${nombreLiga}</span>
                            <span>▼</span>
                        </div>
                        <div class="liga-content">
                            ${ligas[nombreLiga].map(p => {
                                const fecha = new Date(p.start_date);
                                const hGmt = fecha.getUTCHours();
                                const m = fecha.getUTCMinutes().toString().padStart(2, '0');
                                const hBol = (hGmt - 4 + 24) % 24;
                                const hMex = (hGmt - 6 + 24) % 24;
                                const hEsp = (hGmt + 1 + 24) % 24;

                                return `
                                <div class="card">
                                    <div class="teams">
                                        <div><img class="team-img" src="https://api.dicebear.com/7.x/initials/svg?seed=${p.home_team}">${p.home_team}</div>
                                        <div style="color:#cbd5e1; font-size:12px;">VS</div>
                                        <div><img class="team-img" src="https://api.dicebear.com/7.x/initials/svg?seed=${p.away_team}">${p.away_team}</div>
                                    </div>
                                    <div class="pred-box">
                                        <small>SUGERENCIA:</small><br>
                                        <b style="color:#065f46;">${traducir(p.prediction)}</b>
                                    </div>
                                    <div class="time-box">
                                        🇧🇴 ${hBol}:${m} | 🇲🇽 ${hMex}:${m} | 🇪🇸 ${hEsp}:${m}
                                    </div>
                                </div>`;
                            }).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
        </body>
        </html>
    `);
});

app.use('/admin', admin);
app.listen(process.env.PORT || 8080, '0.0.0.0');
