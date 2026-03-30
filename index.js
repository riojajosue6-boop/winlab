const express = require('express');
const axios = require('axios');
const admin = require('./admin');
const app = express();

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY; 
global.MIS_FAVORITOS = []; 

// 1. TU FUNCIÓN DE TRADUCCIÓN
function traducirPrediccion(codigo) {
    const mapa = {
        '1': 'Victoria Local',
        '2': 'Victoria Visitante',
        'X': 'Empate',
        '1X': 'Local o Empate',
        '2X': 'Visitante o Empate',
        '12': 'Cualquiera Gana (No Empate)'
    };
    return mapa[codigo] || codigo;
}

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

app.get('/', async (req, res) => {
    const partidos = await obtenerPartidosAPI();
    let filtrados = global.MIS_FAVORITOS.length > 0 
        ? partidos.filter(p => global.MIS_FAVORITOS.includes(p.home_team)) 
        : partidos;

    // 2. AQUÍ SE GENERA TODA LA PÁGINA (HTML)
    res.send(`
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>WinLab 🔬 | Análisis Premium</title>
            
            <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🔬</text></svg>">
            
            <style>
                body { font-family: 'Segoe UI', Tahoma, sans-serif; background: #0f172a; color: white; margin: 0; padding: 15px; }
                .nav { text-align: center; padding: 25px 0; border-bottom: 2px solid #fbbf24; margin-bottom: 20px; font-weight: 800; font-size: 24px; }
                .container { max-width: 500px; margin: 0 auto; }
                .card { background: white; color: #1e293b; border-radius: 15px; padding: 20px; margin-bottom: 20px; box-shadow: 0 4px 15px rgba(0,0,0,0.3); border-left: 5px solid #fbbf24; }
                .teams { display: flex; justify-content: space-between; font-weight: bold; font-size: 1.1rem; margin: 10px 0; }
                .prediction { background: #f8fafc; padding: 12px; border-radius: 10px; text-align: center; font-weight: bold; border: 1px solid #e2e8f0; }
                .ad-space { background: #1e293b; border: 1px dashed #334155; padding: 15px; text-align: center; font-size: 10px; color: #64748b; margin: 20px 0; border-radius: 8px; }
            </style>
        </head>
        <body>
            <div class="nav">WINLAB 🔬</div>
            <div class="container">
                <div class="ad-space">PUBLICIDAD - ADSTERRA TOP</div>

                ${filtrados.map(p => {
                    // Ajuste de hora para Bolivia (GMT-4)
                    let horaPartes = p.start_date.split('T')[1].split(':');
                    let horaH = (parseInt(horaPartes[0]) - 4 + 24) % 24;
                    let horaFinal = (horaH < 10 ? '0'+horaH : horaH) + ':' + horaPartes[1];

                    return `
                    <div class="card">
                        <div style="font-size: 11px; color: #64748b; margin-bottom: 5px; font-weight: bold; text-transform: uppercase;">
                            🏆 ${p.competition_name}
                        </div>
                        
                        <div class="teams">
                            <span>${p.home_team}</span> 
                            <span style="color: #cbd5e1; font-weight: normal;">VS</span> 
                            <span>${p.away_team}</span>
                        </div>

                        <div class="prediction">
                            <span style="font-size: 11px; display: block; color: #64748b; font-weight: normal; margin-bottom: 4px;">RECOMENDACIÓN:</span>
                            ${traducirPrediccion(p.prediction)}
                        </div>

                        <div style="margin-top: 12px; padding-top: 10px; border-top: 1px solid #f1f5f9; display: flex; justify-content: space-between; font-size: 11px; color: #94a3b8;">
                            <span>⏰ Hora Local: ${horaFinal}</span>
                            <span>📍 Análisis IA</span>
                        </div>
                    </div>
                    `;
                }).join('')}

                <div class="ad-space">PUBLICIDAD - ADSTERRA FOOTER</div>
            </div>
        </body>
        </html>
    `);
});

app.use('/admin', admin);
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("WinLab Online"));
