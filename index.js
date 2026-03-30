const express = require('express');
const axios = require('axios');
const admin = require('./admin');
const app = express();

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY; 
global.MIS_FAVORITOS = []; 

// Función para traducir los códigos de la IA a lenguaje humano
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
    } catch (e) { 
        console.error("Error API:", e.message);
        return []; 
    }
}

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
            <title>WinLab 🔬 | Análisis Premium</title>
            <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🔬</text></svg>">
            <style>
                body { font-family: 'Segoe UI', Tahoma, sans-serif; background: #0f172a; color: white; margin: 0; padding: 15px; }
                .nav { text-align: center; padding: 25px 0; border-bottom: 2px solid #fbbf24; margin-bottom: 20px; font-weight: 800; font-size: 26px; }
                .container { max-width: 500px; margin: 0 auto; }
                .card { background: white; color: #1e293b; border-radius: 18px; padding: 20px; margin-bottom: 25px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); border-top: 6px solid #fbbf24; }
                .league { font-size: 10px; color: #64748b; font-weight: 800; text-transform: uppercase; margin-bottom: 12px; display: block; letter-spacing: 0.5px; }
                .teams { display: flex; justify-content: space-between; align-items: center; font-weight: 800; font-size: 1.15rem; margin-bottom: 15px; }
                .vs { color: #cbd5e1; font-weight: 400; font-size: 0.8rem; padding: 0 10px; }
                .prediction-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 15px; text-align: center; margin-bottom: 15px; }
                .pred-label { font-size: 10px; color: #64748b; display: block; margin-bottom: 5px; font-weight: bold; }
                .pred-value { color: #10b981; font-weight: 800; font-size: 1.3rem; }
                
                /* PANEL DE ANALISIS TECNICO */
                .analysis-panel { background: #f1f5f9; padding: 15px; border-radius: 10px; font-size: 11px; color: #475569; line-height: 1.4; }
                .analysis-title { display: block; color: #1e293b; font-weight: 800; margin-bottom: 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
                .prob-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 5px; text-align: center; margin-bottom: 8px; }
                .prob-item b { color: #0f172a; display: block; font-size: 13px; }

                .info-row { display: flex; justify-content: space-between; margin-top: 15px; padding-top: 12px; border-top: 1px solid #f1f5f9; font-size: 11px; color: #94a3b8; }
                .ad-space { background: #1e293b; border: 1px dashed #334155; padding: 15px; text-align: center; font-size: 10px; color: #475569; margin: 20px 0; border-radius: 10px; }
            </style>
        </head>
        <body>
            <div class="nav">WINLAB 🔬</div>
            <div class="container">
                <div class="ad-space">ESPACIO PUBLICITARIO - ADSTERRA</div>

                ${filtrados.length > 0 ? filtrados.map(p => {
                    // Extraer probabilidades de la API
                    const pLocal = Math.round((p.probabilities['1'] || 0) * 100);
                    const pEmpate = Math.round((p.probabilities['X'] || 0) * 100);
                    const pVisita = Math.round((p.probabilities['2'] || 0) * 100);

                    // Ajuste de hora (GMT-4 para Bolivia)
                    let horaPartes = p.start_date.split('T')[1].split(':');
                    let horaH = (parseInt(horaPartes[0]) - 4 + 24) % 24;
                    let horaFinal = (horaH < 10 ? '0'+horaH : horaH) + ':' + horaPartes[1];

                    return `
                    <div class="card">
                        <span class="league">🏆 ${p.competition_name}</span>
                        
                        <div class="teams">
                            <span style="flex:1; text-align:right;">${p.home_team}</span>
                            <span class="vs">VS</span>
                            <span style="flex:1; text-align:left;">${p.away_team}</span>
                        </div>

                        <div class="prediction-box">
                            <span class="pred-label">RECOMENDACIÓN WINLAB:</span>
                            <span class="pred-value">${traducirPrediccion(p.prediction)}</span>
                        </div>

                        <div class="analysis-panel">
                            <span class="analysis-title">📊 ANÁLISIS DE PROBABILIDADES:</span>
                            <div class="prob-grid">
                                <div class="prob-item">L: <b>${pLocal}%</b></div>
                                <div class="prob-item">E: <b>${pEmpate}%</b></div>
                                <div class="prob-item">V: <b>${pVisita}%</b></div>
                            </div>
                            <div style="font-style: italic; color: #64748b;">
                                Lectura basada en rendimiento H2H y factor de localía/visitante de los últimos encuentros.
                            </div>
                        </div>

                        <div class="info-row">
                            <span>⏰ Hora Local: ${horaFinal}</span>
                            <span>✅ Datos Verificados</span>
                        </div>
                    </div>
                    `;
                }).join('') : "<p style='text-align:center; color:#94a3b8;'>Cargando análisis técnico...</p>"}

                <div class="ad-space">ESPACIO PUBLICITARIO - ADSTERRA</div>
            </div>
        </body>
        </html>
    `);
});

app.use('/admin', admin);
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("WinLab con Análisis Técnico Online"));
