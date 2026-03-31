const express = require('express');
const axios = require('axios');
const admin = require('./admin');
const app = express();

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;

// CACHE PARA EVITAR ERRORES Y AHORRAR CRÉDITOS
let cachePartidos = null;
let ultimaActualizacion = 0;
const TIEMPO_CACHE = 1000 * 60 * 60; // 1 Hora

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
            params: { market: 'classic', iso_date: hoy }, // CONFIGURACIÓN ESTALBE SIN FILTROS
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
            <title>OjoDeGol 🕵️‍♂️⚽</title>
            <style>
                body { font-family: sans-serif; background: #0f172a; color: white; margin: 0; padding: 15px; }
                .header { text-align: center; padding: 20px 0; color: #fbbf24; font-size: 24px; font-weight: 900; }
                .container { max-width: 500px; margin: 0 auto; }
                .liga-section { margin-bottom: 10px; border-radius: 12px; overflow: hidden; background: #1e293b; }
                .liga-header { background: #334155; padding: 15px; cursor: pointer; font-weight: bold; display: flex; justify-content: space-between; border-left: 4px solid #fbbf24; }
                .liga-content { display: none; padding: 10px; background: #0f172a; }
                .card { background: white; color: #1e293b; border-radius: 15px; padding: 15px; margin-bottom: 15px; }
                .teams { display: flex; justify-content: space-around; align-items: center; font-weight: 800; }
                .pred-box { background: #0f172a; color: #fbbf24; padding: 10px; border-radius: 10px; text-align: center; margin: 10px 0; }
                .time-box { font-size: 11px; color: #64748b; text-align: center; border-top: 1px solid #f1f5f9; padding-top: 8px; }
            </style>
        </head>
        <body>
            <div class="header">🕵️‍♂️ OJODEGOL ⚽</div>
            <div class="container">
                ${Object.keys(ligas).length > 0 ? Object.keys(ligas).map(nombreLiga => `
                    <div class="liga-section">
                        <div class="liga-header" onclick="this.nextElementSibling.style.display = this.nextElementSibling.style.display === 'block' ? 'none' : 'block'">
                            <span>🏆 ${nombreLiga}</span> <span>▼</span>
                        </div>
                        <div class="liga-content">
                            ${ligas[nombreLiga].map(p => {
                                const fecha = new Date(p.start_date);
                                const hGmt = fecha.getUTCHours();
                                const m = fecha.getUTCMinutes().toString().padStart(2, '0');
                                const hBol = (hGmt - 4 + 24) % 24;
                                return `
                                <div class="card">
                                    <div class="teams">
                                        <span>${p.home_team}</span> <small>VS</small> <span>${p.away_team}</span>
                                    </div>
                                    <div class="pred-box"><b>${traducir(p.prediction)}</b></div>
                                    <div class="time-box">🇧🇴 Bolivia: ${hBol}:${m}</div>
                                </div>`;
                            }).join('')}
                        </div>
                    </div>
                `).join('') : "<p style='text-align:center;'>Cargando partidos...</p>"}
            </div>
        </body>
        </html>
    `);
});

app.use('/admin', admin);
app.listen(process.env.PORT || 8080, '0.0.0.0');
