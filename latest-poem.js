document.addEventListener('DOMContentLoaded', async function() {
    const container = document.getElementById('latest-poem-content');
    if (!container) return;
    
    try {
        const response = await fetch(`https://raw.githubusercontent.com/${CONFIG.REPO_OWNER}/${CONFIG.REPO_NAME}/main/data/poems.json`);
        const data = await response.json();
        const poemes = data.poemes;
        
        if (poemes.length > 0) {
            const dernierPoeme = poemes[poemes.length - 1];
            const contenuPoeme = dernierPoeme.contenu.substring(0, Math.floor(dernierPoeme.contenu.length * 0.55)) + '...';
            
            container.innerHTML = `
                <div class="poem-preview">
                    <h3>${dernierPoeme.titre}</h3>
                    <p>${contenuPoeme.replace(/\n/g, '<br>')}</p>
                    <a href="poemes.html">Lire la suite</a>
                </div>
            `;
        } else {
            container.innerHTML = `
                <div class="poem-preview">
                    <p>Aucun poème n'a encore été ajouté.</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Erreur:', error);
        container.innerHTML = `
            <div class="poem-preview">
                <p>Impossible de charger le dernier poème.</p>
            </div>
        `;
    }
});
