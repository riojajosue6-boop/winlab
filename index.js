const express = require('express');
const axios = require('axios');
const app = express();

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY; 
const ADMIN_PASS = "winlab2026"; 
let MIS_FAVORITOS = []; 

// Función para pedir datos a la API de forma segura
async function obtenerPartidos(federacion) {
    const hoy = new Date().toISOString().split('T')[0];
    const options = {
        method: 'GET',
        url: 'https://football-prediction-api.p.rapidapi.com/api/v2/predictions',
        params: { market: 'classic', iso_date: hoy, federation: federacion },
        headers: { 
            'x-rapidapi-key': RAPIDAPI_KEY, 
            'x-rapidapi-host': 'football-prediction-api.p.rapidapi.com' 
        }
    };
    const res = await axios.request(options);
    return res.data.data || [];
}

app.get('/', async (req, res) => {
    try {
        // Intentamos FIFA, si no hay, vamos a UEFA
        let partidos = await obtenerPartidos('FIFA');
        if (partidos.length === 0) {
            partidos = await obtenerPartidos('UEFA');
        }

        // Filtramos si el admin seleccionó favoritos
        let mostrados = MIS_FAVORITOS.length > 0 
            ? partidos.filter(p => MIS_FAVORITOS.includes(p.home_team)) 
            : partidos;

        let html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
                body { font-family: sans-serif; background: #0f172a; color: white; padding: 20px; text-align: center; }
                .navbar { font-size: 24px; font-weight: bold; border-bottom: 3px solid #fbbf24; padding-bottom: 10px; margin-bottom: 20px; }
                .card { background: white; color: #1e293b; border-radius: 12px; padding: 20px; margin: 10px auto; max-width: 400px; text-align: left; box-shadow: 0 4px 6px rgba(0,0,0,0.3); }
                .tag { color: #fbbf24; font-size: 12px; font-weight: bold; }
            </style>
        </head>
        <body>
            <div class="navbar">WINLAB 🔬</div>
            ${mostrados.length > 0 ? mostrados.map(p => `
                <div class="card">
                    <span class="tag">PRONÓSTICO IA</span>
                    <h3 style="margin: 10px 0;">${p.home_team} vs ${p.away_team}</h3>
                    <p>Predicción: <strong>${p.prediction}</strong></p>
                </div>
            `).join('') : "<h3>No hay partidos importantes para mostrar hoy.</h3>"}
        </body>
        </html>`;
        res.send(html);
    } catch (error) {
        console.error(error);
        res.send("<h1>WinLab está actualizando sus bases de datos...</h1><p>Reintenta en un momento.</p>");
    }
});

// PANEL ADMIN
app.get('/admin', async (req, res) => {
    if (req.query.pass !== ADMIN_PASS) return res.send("Acceso denegado.");
    
    try {
        let todos = await obtenerPartidos('FIFA');
        let uefa = await obtenerPartidos('UEFA');
        todos = [...todos, ...uefa];

        if (req.query.select) {
            MIS_FAVORITOS = Array.isArray(req.query.select) ? req.query.select : [req.query.select];
            return res.send("<h1>Selección actualizada!</h1><a href='/'>Ir a la portada</a>");
        }

        let adminHtml = `
        <html>
        <body style="font-family:sans-serif; padding: 20px;">
            <h2>Panel Admin WinLab</h2>
            <form action="/admin">
                <input type="hidden" name="pass" value="${ADMIN_PASS}">
                ${todos.map(p => `
                    <label style="display:block; padding: 10px; border-bottom: 1px solid #eee;">
                        <input type="checkbox" name="select" value="${p.home_team}"> ${p.home_team} vs ${p.away_team}
                    </label>
                `).join('')}
                <br><button type="submit" style="padding: 15px; background: #fbbf24; border: none; font-weight: bold;">ACTUALIZAR PORTADA</button>
                <br><br><a href="/admin?pass=${ADMIN_PASS}&select=">MOSTRAR TODOS (RESET)</a>
            </form>
        </body>
        </html>`;
        res.send(adminHtml);
    } catch (e) { res.send("Error en el panel admin."); }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('WinLab Ready'));
