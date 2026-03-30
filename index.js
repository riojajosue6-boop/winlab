const express = require('express');
const axios = require('axios');
const app = express();

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY; 

app.get('/', async (req, res) => {
    // Ajuste de fecha para que coincida con tu zona horaria
    const hoy = new Date().toISOString().split('T')[0];
    
    // CONFIGURACIÓN DE TUS PRIORIDADES
    const miSeleccionManual = []; // Aquí puedes poner IDs de partidos específicos luego
    const federacionPrioritaria = 'FIFA'; // Cambiamos UEFA por FIFA para el Mundial

    const options = {
        method: 'GET',
        url: 'https://football-prediction-api.p.rapidapi.com/api/v2/predictions',
        params: {
            market: 'classic',
            iso_date: hoy,
            federation: federacionPrioritaria 
        },
        headers: {
            'x-rapidapi-key': RAPIDAPI_KEY,
            'x-rapidapi-host': 'football-prediction-api.p.rapidapi.com'
        }
    };

    try {
        const response = await axios.request(options);
        let partidos = response.data.data || [];

        // SI NO HAY MUNDIAL HOY, BUSCAMOS EN EUROPA (UEFA) O SUDAMÉRICA (CONMEBOL)
        if (partidos.length === 0) {
            options.params.federation = 'UEFA';
            const resBackup = await axios.request(options);
            partidos = resBackup.data.data || [];
        }

        let htmlContent = `
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>WinLab | Especial Mundial 2026</title>
            <style>
                :root { --primary: #1e293b; --accent: #ef4444; --gold: #f59e0b; }
                body { font-family: 'Inter', sans-serif; background: #f8fafc; color: #1e293b; margin: 0; }
                .navbar { background: var(--primary); color: white; padding: 1.2rem; text-align: center; font-weight: bold; border-bottom: 4px solid var(--gold); }
                .hero { background: white; padding: 2rem 1rem; text-align: center; }
                .container { max-width: 600px; margin: 0 auto; padding: 1rem; }
                .card { background: white; border-radius: 12px; padding: 1.5rem; margin-bottom: 1rem; border: 1px solid #e2e8f0; position: relative; overflow: hidden; }
                .card.mundial::before { content: "MUNDIAL"; position: absolute; top: 0; right: 0; background: var(--gold); color: black; font-size: 10px; padding: 2px 10px; font-weight: bold; }
                .teams { display: flex; justify-content: space-between; align-items: center; font-weight: 700; margin-bottom: 1rem; font-size: 1.1rem; }
                .prediction-badge { background: #fff7ed; padding: 0.8rem; border-radius: 8px; text-align: center; font-weight: bold; color: #c2410c; border: 1px solid #fdba74; }
                .prob-bar { display: flex; height: 8px; border-radius: 4px; background: #eee; margin-top: 1rem; overflow: hidden; }
                .ad-slot { background: #f8fafc; border: 1px dashed #cbd5e1; padding: 1rem; margin: 1.5rem 0; text-align: center; font-size: 10px; color: #94a3b8; }
                .btn-live { display: block; background: var(--primary); color: white; text-align: center; padding: 10px; border-radius: 6px; text-decoration: none; margin-top: 10px; font-weight: bold; }
            </style>
        </head>
        <body>
            <div class="navbar">WINLAB 🔬🏆</div>
            <div class="hero">
                <h2 style="margin:0;">Pronósticos Mundial 2026</h2>
                <p style="color:#64748b;">Análisis de datos para hoy ${hoy}</p>
            </div>

            <div class="container">
                <div class="ad-slot">PUBLICIDAD - WINLAB ADS</div>

                ${partidos.length > 0 ? partidos.map((p) => `
                    <div class="card ${federacionPrioritaria === 'FIFA' ? 'mundial' : ''}">
                        <div class="teams">
                            <span>${p.home_team}</span>
                            <span style="color:#94a3b8">VS</span>
                            <span>${p.away_team}</span>
                        </div>
                        <div class="prediction-badge">
                            Puntaje IA: ${p.prediction === '1' ? 'Local' : p.prediction === '2' ? 'Visitante' : 'Empate'}
                        </div>
                        <div class="prob-bar">
                            <div style="width: ${p.probabilities.home_win * 100}%; background: #22c55e;"></div>
                            <div style="width: ${p.probabilities.draw * 100}%; background: #f59e0b;"></div>
                            <div style="width: ${p.probabilities.away_win * 100}%; background: #ef4444;"></div>
                        </div>
                        <a href="#" class="btn-live">ANÁLISIS COMPLETO</a>
                    </div>
                `).join('') : '<div class="card">No hay partidos destacados en este momento. Revisa más tarde.</div>'}

                <div class="ad-slot">PUBLICIDAD - FOOTER</div>
            </div>
            
            <footer style="text-align:center; padding: 2rem; font-size: 11px; color: #94a3b8;">
                &copy; 2026 WinLab World Cup Edition
            </footer>
        </body>
        </html>`;

        res.send(htmlContent);

    } catch (error) {
        console.error(error);
        res.status(500).send("Actualizando base de datos Mundial...");
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('WinLab Mundial Listo'));
