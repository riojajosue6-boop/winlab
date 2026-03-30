const express = require('express');
const axios = require('axios');
const app = express();

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY; 

app.get('/', async (req, res) => {
    const hoy = new Date().toISOString().split('T')[0];
    
    const options = {
        method: 'GET',
        url: 'https://football-prediction-api.p.rapidapi.com/api/v2/predictions',
        params: {
            market: 'classic',
            iso_date: hoy,
            federation: 'UEFA'
        },
        headers: {
            'x-rapidapi-key': RAPIDAPI_KEY,
            'x-rapidapi-host': 'football-prediction-api.p.rapidapi.com'
        }
    };

    try {
        const response = await axios.request(options);
        const partidos = response.data.data || [];

        let htmlContent = `
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>WinLab | Pronósticos Inteligentes</title>
            <style>
                :root { --primary: #0f172a; --accent: #38bdf8; --success: #22c55e; }
                body { font-family: 'Inter', sans-serif; background: #f8fafc; color: #1e293b; margin: 0; padding: 0; }
                .navbar { background: var(--primary); color: white; padding: 1rem; text-align: center; font-weight: bold; font-size: 1.5rem; letter-spacing: 1px; }
                .hero { background: white; padding: 2rem 1rem; text-align: center; border-bottom: 1px solid #e2e8f0; }
                .container { max-width: 600px; margin: 0 auto; padding: 1rem; }
                .card { background: white; border-radius: 12px; padding: 1.5rem; margin-bottom: 1rem; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
                .teams { display: flex; justify-content: space-between; align-items: center; font-weight: 700; margin-bottom: 1rem; }
                .prediction-badge { background: #f1f5f9; padding: 0.5rem; border-radius: 6px; text-align: center; font-weight: bold; color: var(--primary); border: 1px solid var(--accent); }
                .prob-container { display: flex; gap: 5px; margin-top: 1rem; font-size: 0.75rem; color: #64748b; }
                .prob-bar { height: 8px; border-radius: 4px; background: #e2e8f0; flex-grow: 1; overflow: hidden; display: flex; }
                .ad-slot { background: #f1f5f9; border: 2px dashed #cbd5e1; padding: 1rem; margin: 1.5rem 0; text-align: center; font-size: 0.7rem; color: #94a3b8; }
            </style>
        </head>
        <body>
            <div class="navbar">WINLAB 🔬</div>
            <div class="hero">
                <h2>Predicciones del día</h2>
                <p>Análisis de datos para el ${hoy}</p>
            </div>

            <div class="container">
                <div class="ad-slot">PUBLICIDAD - ESPACIO DISPONIBLE</div>

                ${partidos.length > 0 ? partidos.map((p, index) => `
                    <div class="card">
                        <div class="teams">
                            <span>${p.home_team}</span>
                            <span style="color:var(--accent)">VS</span>
                            <span>${p.away_team}</span>
                        </div>
                        <div class="prediction-badge">
                            Predicción: ${p.prediction === '1' ? 'Victoria Local' : p.prediction === '2' ? 'Victoria Visitante' : 'Empate'}
                        </div>
                        <div class="prob-container">
                            <span>L: ${(p.probabilities.home_win * 100).toFixed(0)}%</span>
                            <span>E: ${(p.probabilities.draw * 100).toFixed(0)}%</span>
                            <span>V: ${(p.probabilities.away_win * 100).toFixed(0)}%</span>
                        </div>
                    </div>
                    
                    ${index === 1 ? '<div class="ad-slot">PUBLICIDAD - ADSTERRA NATIVE</div>' : ''}
                `).join('') : '<p style="text-align:center">No hay partidos UEFA analizados por ahora.</p>'}

                <div class="ad-slot">PUBLICIDAD - FOOTER ADS</div>
            </div>
            
            <footer style="text-align:center; padding: 2rem; font-size: 0.8rem; color: #94a3b8;">
                &copy; 2026 WinLab - Data Driven Sports Analysis
            </footer>
        </body>
        </html>`;

        res.send(htmlContent);

    } catch (error) {
        console.error(error);
        res.status(500).send("<h1>WinLab está actualizando los datos... vuelve pronto.</h1>");
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('WinLab operativo en puerto ' + PORT));
