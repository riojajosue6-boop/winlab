const express = require('express');
const axios = require('axios');
const app = express();

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY; 
const ADMIN_PASS = "winlab2026"; // <--- CAMBIA ESTA CLAVE POR LA QUE QUIERAS

// Memoria temporal para guardar tus favoritos (se borra si Render se reinicia)
let MIS_FAVORITOS = []; 

app.get('/', async (req, res) => {
    const hoy = new Date().toISOString().split('T')[0];
    const options = {
        method: 'GET',
        url: 'https://football-prediction-api.p.rapidapi.com/api/v2/predictions',
        params: { market: 'classic', iso_date: hoy, federation: 'FIFA' },
        headers: { 'x-rapidapi-key': RAPIDAPI_KEY, 'x-rapidapi-host': 'football-prediction-api.p.rapidapi.com' }
    };

    try {
        const response = await axios.request(options);
        let partidos = response.data.data || [];
        
        // Si no hay mundial, busca UEFA
        if (partidos.length === 0) {
            options.params.federation = 'UEFA';
            const resB = await axios.request(options);
            partidos = resB.data.data || [];
        }

        // FILTRO: Si hay favoritos, solo muestra esos
        let mostrados = MIS_FAVORITOS.length > 0 
            ? partidos.filter(p => MIS_FAVORITOS.includes(p.home_team)) 
            : partidos;

        let html = `
        <html>
        <head>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
                body { font-family: sans-serif; background: #0f172a; color: white; padding: 10px; }
                .card { background: white; color: black; border-radius: 10px; padding: 15px; margin-bottom: 10px; border-left: 5px solid #fbbf24; }
                .nav { text-align: center; padding: 20px; font-weight: bold; border-bottom: 2px solid #fbbf24; margin-bottom: 20px; }
            </style>
        </head>
        <body>
            <div class="nav">WINLAB 🔬</div>
            ${mostrados.map(p => `
                <div class="card">
                    <strong>${p.home_team} vs ${p.away_team}</strong><br>
                    Predicción: ${p.prediction}
                </div>
            `).join('')}
        </body>
        </html>`;
        res.send(html);
    } catch (e) { res.send("Error al cargar."); }
});

// --- PANEL DE CONTROL (ADMIN) ---
app.get('/admin', async (req, res) => {
    if (req.query.pass !== ADMIN_PASS) return res.send("Acceso denegado.");

    const hoy = new Date().toISOString().split('T')[0];
    const response = await axios.get('https://football-prediction-api.p.rapidapi.com/api/v2/predictions', {
        params: { market: 'classic', iso_date: hoy, federation: 'FIFA' },
        headers: { 'x-rapidapi-key': RAPIDAPI_KEY, 'x-rapidapi-host': 'football-prediction-api.p.rapidapi.com' }
    });
    
    let todos = response.data.data || [];
    
    // Si el admin envió una selección (ej: ?select=Equipo1,Equipo2)
    if (req.query.select) {
        MIS_FAVORITOS = req.query.select.split(',');
        return res.send("<h1>Selección actualizada!</h1><a href='/'>Ver página</a>");
    }

    let adminHtml = `
    <html>
    <body>
        <h1>Panel Admin WinLab</h1>
        <p>Toca los equipos para seleccionarlos:</p>
        <form action="/admin">
            <input type="hidden" name="pass" value="${ADMIN_PASS}">
            ${todos.map(p => `
                <input type="checkbox" name="select" value="${p.home_team}"> ${p.home_team} vs ${p.away_team}<br>
            `).join('')}
            <br><button type="submit">ACTUALIZAR PORTADA</button>
            <br><br><a href="/admin?pass=${ADMIN_PASS}&select=">MOSTRAR TODOS (RESET)</a>
        </form>
    </body>
    </html>`;
    res.send(adminHtml);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT);
