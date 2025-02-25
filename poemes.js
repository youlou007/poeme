document.addEventListener('DOMContentLoaded', async function() {
    const poemsContainer = document.getElementById('poems-container');
    const searchInput = document.getElementById('search-poems');
    const prevButton = document.querySelector('.prev-result');
    const nextButton = document.querySelector('.next-result');
    const resultCount = document.querySelector('.result-count');
    let poemes = await chargerPoemes();
    let searchMatches = [];
    let currentMatchIndex = -1;

    async function chargerPoemes() {
        try {
            const timestamp = new Date().getTime();
            const url = `${CONFIG.GITHUB.RAW_CONTENT_URL}/${CONFIG.GITHUB.OWNER}/${CONFIG.GITHUB.REPO}/main/${CONFIG.GITHUB.FILE_PATH}?t=${timestamp}`;
            
            const response = await fetch(url);
            if (!response.ok) throw new Error('Erreur de chargement des poèmes');
            const data = await response.json();
            return data.poemes;
        } catch (error) {
            console.error('Erreur:', error);
            return [];
        }
    }

    function highlightText(text, searchTerm, isCurrentMatch = false) {
        if (!searchTerm) return text;
        const regex = new RegExp(`(${searchTerm})`, 'gi');
        return text.replace(regex, (match) => 
            `<span class="highlight${isCurrentMatch ? ' current' : ''}">${match}</span>`
        );
    }

    function updateNavigationDisplay() {
        const total = searchMatches.length;
        const current = total > 0 ? currentMatchIndex + 1 : 0;
        resultCount.textContent = `${current}/${total}`;
        prevButton.disabled = total === 0 || currentMatchIndex <= 0;
        nextButton.disabled = total === 0 || currentMatchIndex >= total - 1;
    }

    function displayPoems(poemsList = poemes) {
        const searchTerm = searchInput.value.trim();
        poemsContainer.innerHTML = '';
        searchMatches = [];
        currentMatchIndex = -1;

        if (poemsList.length === 0) {
            poemsContainer.innerHTML = '<p class="no-poems">Aucun poème disponible</p>';
            updateNavigationDisplay();
            return;
        }

        poemsList.forEach((poeme, poemeIndex) => {
            if (searchTerm) {
                const titreMatches = [...poeme.titre.matchAll(new RegExp(searchTerm, 'gi'))];
                const contenuMatches = [...poeme.contenu.matchAll(new RegExp(searchTerm, 'gi'))];
                titreMatches.forEach(match => searchMatches.push({ poemeIndex, type: 'titre' }));
                contenuMatches.forEach(match => searchMatches.push({ poemeIndex, type: 'contenu' }));
            }

            const isCurrentPoem = searchMatches[currentMatchIndex]?.poemeIndex === poemeIndex;
            const titre = highlightText(poeme.titre, searchTerm, isCurrentPoem);
            const contenu = highlightText(poeme.contenu, searchTerm, isCurrentPoem);

            const poemeElement = document.createElement('div');
            poemeElement.className = 'poem-card';
            poemeElement.innerHTML = `
                <div class="poem-content">
                    <div class="poem-header">
                        <h3>${titre}</h3>
                        <div class="poem-meta">
                            <span class="poem-theme">
                                <i class="fas fa-bookmark"></i> ${poeme.theme || 'Sans thème'}
                            </span>
                            <span class="poem-date">
                                <i class="fas fa-calendar"></i> ${new Date(poeme.date).toLocaleDateString()}
                            </span>
                        </div>
                    </div>
                    <div class="poem-text">
                        <p>${contenu.replace(/\n/g, '<br>')}</p>
                    </div>
                </div>
            `;
            poemsContainer.appendChild(poemeElement);
        });

        if (searchMatches.length > 0) {
            currentMatchIndex = 0;
            highlightCurrentMatch();
        }
        updateNavigationDisplay();
    }

    function highlightCurrentMatch() {
        document.querySelectorAll('.highlight.current').forEach(el => {
            el.classList.remove('current');
        });

        if (currentMatchIndex >= 0 && currentMatchIndex < searchMatches.length) {
            const highlights = document.querySelectorAll('.highlight');
            const currentHighlight = highlights[currentMatchIndex];
            if (currentHighlight) {
                currentHighlight.classList.add('current');
                currentHighlight.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                });
            }
        }
    }

    // Ajout de la gestion du scroll pour la barre de recherche
    const searchContainer = document.querySelector('.search-container');
    const heroSection = document.querySelector('.poems-hero');
    let heroBottom = heroSection.offsetTop + heroSection.offsetHeight;

    function updateSearchBarPosition() {
        const currentScroll = window.pageYOffset;
        const searchBarHeight = searchContainer.offsetHeight;
        
        // Calcul de la position limite en tenant compte de la hauteur de la barre
        const threshold = heroBottom - searchBarHeight - 32; // 32px de marge
        
        if (currentScroll > threshold) {
            searchContainer.classList.add('sticky');
            searchContainer.style.transform = 'translateX(-50%)';
        } else {
            searchContainer.classList.remove('sticky');
            searchContainer.style.transform = 'translateX(-50%)';
        }
    }

    // Mise à jour de heroBottom lors du redimensionnement
    window.addEventListener('resize', () => {
        heroBottom = heroSection.offsetTop + heroSection.offsetHeight;
        updateSearchBarPosition();
    });

    // Écoute du scroll
    window.addEventListener('scroll', updateSearchBarPosition);

    // Ajout du titre flottant
    const mainTitle = document.querySelector('.poems-hero h1').textContent;
    const floatingTitle = document.createElement('div');
    floatingTitle.className = 'floating-header';
    floatingTitle.textContent = mainTitle;
    document.body.appendChild(floatingTitle);

    function updateHeaderAndSearch() {
        const currentScroll = window.pageYOffset;
        const threshold = heroBottom - searchContainer.offsetHeight - 32;
        
        if (currentScroll > threshold) {
            // Ajout des classes en même temps
            searchContainer.classList.add('sticky', 'visible');
            floatingTitle.classList.add('visible');
        } else {
            // Retrait des classes en même temps
            searchContainer.classList.remove('sticky', 'visible');
            floatingTitle.classList.remove('visible');
        }
    }

    // Mise à jour du gestionnaire de scroll existant
    let ticking = false;
    window.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(() => {
                updateHeaderAndSearch();
                ticking = false;
            });
            ticking = true;
        }
    });

    // Event Listeners
    searchInput.addEventListener('input', () => displayPoems());

    prevButton.addEventListener('click', () => {
        if (currentMatchIndex > 0) {
            currentMatchIndex--;
            highlightCurrentMatch();
            updateNavigationDisplay();
        }
    });

    nextButton.addEventListener('click', () => {
        if (currentMatchIndex < searchMatches.length - 1) {
            currentMatchIndex++;
            highlightCurrentMatch();
            updateNavigationDisplay();
        }
    });

    // Initial display
    displayPoems();
});