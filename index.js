// Función para traducir los códigos de la IA
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

// DENTRO DE TU RUTA PÚBLICA (app.get('/')), modifica la parte del MAP:
${filtrados.map(p => `
    <div class="card">
        <div style="font-size: 11px; color: #64748b; margin-bottom: 5px; font-weight: bold; text-transform: uppercase;">
            🏆 ${p.competition_name}
        </div>
        
        <div class="teams">
            <span>${p.home_team}</span> 
            <span style="color: #cbd5e1; font-size: 0.8em;">VS</span> 
            <span>${p.away_team}</span>
        </div>

        <div class="prediction">
            <span style="font-size: 12px; display: block; color: #64748b; font-weight: normal;">Sugerencia WinLab:</span>
            ${traducirPrediccion(p.prediction)}
        </div>

        <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #f1f5f9; display: flex; justify-content: space-between; font-size: 12px; color: #94a3b8;">
            <span>⏰ Hora: ${p.start_date.split('T')[1].substring(0, 5)} GMT</span>
            <span>📍 Análisis Finalizado</span>
        </div>
    </div>
`).join('')}
