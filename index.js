const express = require('express');
const axios = require('axios');
const admin = require('./admin');
const app = express();

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;

// SISTEMA DE CACHE (Ahorro de créditos)
let cachePartidos = null;
let ultimaActualizacion = 0;
const TIEMPO_CACHE = 1000 * 60 * 120; // 2 horas

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
            params: { 
                market: 'classic', 
                iso_date: hoy,
                federation: 'CONMEBOL,AFC,UEFA' //busca los mas importantes
            },
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
    let filtrados = global.MIS_FAVORITOS.length > 0 
        ? partidos.filter(p => global.MIS_FAVORITOS.includes(p.home_team)) 
        : partidos;

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
            <title>OjoDeGol 🕵️‍♂️⚽ | IA de Pronósticos</title>
            <style>
                body { font-family: 'Segoe UI', sans-serif; background: #0f172a; color: white; margin: 0; padding: 15px; }
                .header { text-align: center; padding: 25px 0; color: #fbbf24; font-size: 26px; font-weight: 900; }
                .container { max-width: 500px; margin: 0 auto; }
                .liga-section { margin-bottom: 12px; border-radius: 15px; overflow: hidden; background: #1e293b; border: 1px solid #334155; }
                .liga-header { background: #1e293b; padding: 15px; cursor: pointer; font-weight: bold; display: flex; justify-content: space-between; align-items: center; border-left: 5px solid #fbbf24; }
                .liga-content { display: none; padding: 12px; background: #0f172a; border-top: 1px solid #334155; }
                .card { background: white; color: #1e293b; border-radius: 18px; padding: 15px; margin-bottom: 15px; box-shadow: 0 4px 15px rgba(0,0,0,0.2); }
                .match-header { display: flex; justify-content: space-around; align-items: center; margin: 15px 0; text-align: center; }
                .team { flex: 1; font-weight: 800; font-size: 13px; }
                .team img { width: 40px; height: 40px; display: block; margin: 0 auto 5px; }
                .vs { font-size: 10px; color: #cbd5e1; font-weight: normal; }
                .pred-box { background: #0f172a; color: #fbbf24; padding: 12px; border-radius: 12px; text-align: center; margin: 10px 0; }
                .time-panel { background: #f8fafc; border-radius: 10px; padding: 10px; font-size: 11px; color: #64748b; border: 1px solid #e2e8f0; }
                .main-time { font-size: 13px; color: #1e293b; font-weight: 800; display: block; margin-bottom: 4px; }
            </style>
        </head>
        <body>
            <div class="header">🕵️‍♂️ OJODEGOL ⚽</div>
            <div class="container">
                ${Object.keys(ligas).length > 0 ? Object.keys(ligas).map(nombreLiga => `
                    <div class="liga-section">
                        <div class="liga-header" onclick="toggleLiga(this)">
                            <span>🏆 ${nombreLiga}</span>
                            <span class="icon">▼</span>
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
                                    <div class="match-header">
                                        <div class="team">
                                            <img src="https://api.dicebear.com/7.x/initials/svg?seed=${p.home_team}&backgroundColor=b6e3f4">${p.home_team}
                                        </div>
                                        <div class="vs">VS</div>
                                        <div class="team">
                                            <img src="https://api.dicebear.com/7.x/initials/svg?seed=${p.away_team}&backgroundColor=ffdfbf">${p.away_team}
                                        </div>
                                    </div>
                                    <div class="pred-box">
                                        <small style="font-size:9px; opacity:0.7;">RECOMENDACIÓN IA:</small><br>
                                        <span style="font-size:1.2rem; font-weight:900;">${traducir(p.prediction)}</span>
                                    </div>
                                    <div class="time-panel">
                                        <span class="main-time">🇧🇴 Bolivia: ${hBol}:${m}</span>
                                        <div style="display:flex; justify-content:space-between; opacity:0.8;">
                                            <span>🇲🇽 MX: ${hMex}:${m}</span>
                                            <span>🇪🇸 ES: ${hEsp}:${m}</span>
                                        </div>
                                    </div>
                                </div>`;
                            }).join('')}
                        </div>
                    </div>
                `).join('') : "<p style='text-align:center;'>Buscando partidos en el radar...</p>"}
            </div>
            <script>
                function toggleLiga(header) {
                    const content = header.nextElementSibling;
                    const icon = header.querySelector('.icon');
                    const isOpen = content.style.display === 'block';
                    content.style.display = isOpen ? 'none' : 'block';
                    icon.innerText = isOpen ? '▼' : '▲';
                }
            </script>
        </body>
        </html>
    `);
});

app.use('/admin', admin);
app.listen(process.env.PORT || 8080, '0.0.0.0');
