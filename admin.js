// Attendre que le DOM soit chargé
document.addEventListener('DOMContentLoaded', function() {
    // Configuration
    const SECURE_CONFIG = {
        MOT_DE_PASSE: "DC3NNAYKEFEV"
    };

    // Gestionnaire de connexion
    document.getElementById('login-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        const password = document.getElementById('admin-password').value;
        
        if (password === CONFIG.SECURITY.ADMIN_PASSWORD) {
            document.getElementById('login-screen').classList.add('hidden');
            document.getElementById('admin-panel').classList.remove('hidden');
            try {
                await chargerPoemesAdmin();
            } catch (error) {
                ErrorHandler.handleError(error, 'LOADING');
            }
        } else {
            alert('Mot de passe incorrect');
        }
    });

    // Remplacer la fonction chargerPoemesAdmin
    async function chargerPoemesAdmin() {
        try {
            const response = await fetch(`https://api.github.com/repos/${CONFIG.REPO_OWNER}/${CONFIG.REPO_NAME}/contents/${CONFIG.FILE_PATH}`);
            const fileData = await response.json();
            const content = JSON.parse(atob(fileData.content));
            const poemes = content.poemes;
            
            const container = document.getElementById('poems-list');
            container.innerHTML = '';
            
            poemes.forEach(poeme => {
                const element = document.createElement('div');
                element.className = 'poem-item';
                element.innerHTML = `
                    <div class="poem-content">
                        <h3>${poeme.titre}</h3>
                        <p class="poem-text">${poeme.contenu.replace(/\n/g, '<br>')}</p>
                        <div class="poem-meta">
                            <span>Thème: ${poeme.theme}</span>
                            <span>Date: ${new Date(poeme.date).toLocaleDateString()}</span>
                        </div>
                    </div>
                    <div class="poem-actions">
                        <button onclick="modifierPoeme('${poeme.id}')" class="edit-btn">Modifier</button>
                        <button onclick="supprimerPoeme('${poeme.id}')" class="delete-btn">Supprimer</button>
                    </div>
                `;
                container.appendChild(element);
            });
        } catch (error) {
            console.error('Erreur:', error);
            alert('Impossible de charger les poèmes');
        }
    }

    let poemeEnEdition = null;

    document.getElementById('poem-form').addEventListener('submit', function(e) {
        e.preventDefault();
        const poemId = document.getElementById('poem-id').value;
        const poeme = {
            id: poemId || Date.now().toString(),
            titre: document.getElementById('poem-title').value,
            contenu: document.getElementById('poem-content').value,
            theme: document.getElementById('poem-theme').value,
            date: poemId ? poemeEnEdition.date : new Date().toISOString()
        };
        
        // Validation avant sauvegarde
        const validation = validatePoeme(poeme);
        if (!validation.isValid) {
            alert('Erreurs de validation:\n' + validation.errors.join('\n'));
            return false;
        }

        // Si la validation passe, sauvegarder
        sauvegarderPoeme(poeme)
            .then(() => {
                resetForm();
                chargerPoemesAdmin();
            })
            .catch(error => handleApiError(error));
    });

    // Ajouter ces fonctions de validation
    const VALIDATION_RULES = {
        TITRE: {
            min: 3,
            max: 100,
            pattern: /^[a-zA-ZÀ-ÿ0-9\s',.!?-]+$/
        },
        CONTENU: {
            min: 10,
            max: 5000
        },
        THEME: {
            min: 2,
            max: 30,
            pattern: /^[a-zA-ZÀ-ÿ\s]+$/
        }
    };

    function validatePoeme(poeme) {
        const errors = [];
        
        // Validation du titre
        if (!poeme.titre || poeme.titre.length < VALIDATION_RULES.TITRE.min) {
            errors.push(`Le titre doit contenir au moins ${VALIDATION_RULES.TITRE.min} caractères`);
        }
        if (poeme.titre.length > VALIDATION_RULES.TITRE.max) {
            errors.push(`Le titre ne doit pas dépasser ${VALIDATION_RULES.TITRE.max} caractères`);
        }
        if (!VALIDATION_RULES.TITRE.pattern.test(poeme.titre)) {
            errors.push("Le titre contient des caractères non autorisés");
        }

        // Validation du contenu
        if (!poeme.contenu || poeme.contenu.length < VALIDATION_RULES.CONTENU.min) {
            errors.push(`Le contenu doit contenir au moins ${VALIDATION_RULES.CONTENU.min} caractères`);
        }
        if (poeme.contenu.length > VALIDATION_RULES.CONTENU.max) {
            errors.push(`Le contenu ne doit pas dépasser ${VALIDATION_RULES.CONTENU.max} caractères`);
        }

        // Validation du thème
        if (poeme.theme) {
            if (poeme.theme.length < VALIDATION_RULES.THEME.min) {
                errors.push(`Le thème doit contenir au moins ${VALIDATION_RULES.THEME.min} caractères`);
            }
            if (poeme.theme.length > VALIDATION_RULES.THEME.max) {
                errors.push(`Le thème ne doit pas dépasser ${VALIDATION_RULES.THEME.max} caractères`);
            }
            if (!VALIDATION_RULES.THEME.pattern.test(poeme.theme)) {
                errors.push("Le thème contient des caractères non autorisés");
            }
        }

        // Validation de la date
        if (poeme.date && isNaN(Date.parse(poeme.date))) {
            errors.push("La date n'est pas valide");
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    // Ajouter la fonction de validation du contenu GitHub
    async function validateGitHubContent(content) {
        try {
            // Vérifier la structure du contenu
            if (!content.metadata || !Array.isArray(content.poemes)) {
                throw new Error('Structure JSON invalide');
            }
            
            // Vérifier chaque poème
            content.poemes.forEach(poeme => {
                if (!poeme.id || !poeme.titre || !poeme.contenu) {
                    throw new Error('Poème invalide détecté');
                }
            });
            
            return true;
        } catch (error) {
            console.error('Validation error:', error);
            return false;
        }
    }

    // Modifier la fonction sauvegarderPoeme pour inclure la validation
    async function sauvegarderPoeme(poeme) {
        // Validation des données
        const validation = validatePoeme(poeme);
        if (!validation.isValid) {
            alert('Erreurs de validation:\n' + validation.errors.join('\n'));
            return false;
        }

        try {
            const response = await fetch(`https://api.github.com/repos/${CONFIG.REPO_OWNER}/${CONFIG.REPO_NAME}/contents/${CONFIG.FILE_PATH}`);
            const fileData = await response.json();
            const content = JSON.parse(atob(fileData.content));

            if (!await validateGitHubContent(content)) {
                throw new Error('Contenu JSON invalide');
            }

            // Mise à jour des métadonnées
            content.metadata.lastUpdate = new Date().toISOString();

            if (poeme.id) {
                // Modification d'un poème existant
                const index = content.poemes.findIndex(p => p.id === poeme.id);
                if (index !== -1) {
                    content.poemes[index] = poeme;
                }
            } else {
                // Ajout d'un nouveau poème
                poeme.id = Date.now().toString();
                poeme.date = new Date().toISOString();
                content.poemes.push(poeme);
            }

            // Mise à jour du fichier sur GitHub
            const updatedContent = JSON.stringify(content, null, 2);
            await fetch(`https://api.github.com/repos/${CONFIG.REPO_OWNER}/${CONFIG.REPO_NAME}/contents/${CONFIG.FILE_PATH}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${CONFIG.GITHUB_TOKEN}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: poeme.id ? `Modification du poème: ${poeme.titre}` : `Ajout du poème: ${poeme.titre}`,
                    content: btoa(updatedContent),
                    sha: fileData.sha
                })
            });

            return true;
        } catch (error) {
            return handleApiError(error);
        }
    }

    window.supprimerPoeme = async function(id) {
        if (confirm('Voulez-vous vraiment supprimer ce poème ?')) {
            try {
                const response = await fetch(`https://api.github.com/repos/${CONFIG.REPO_OWNER}/${CONFIG.REPO_NAME}/contents/${CONFIG.FILE_PATH}`);
                const fileData = await response.json();
                const content = JSON.parse(atob(fileData.content));

                // Suppression du poème
                content.poemes = content.poemes.filter(p => p.id !== id);
                content.metadata.lastUpdate = new Date().toISOString();

                // Mise à jour du fichier sur GitHub
                const updatedContent = JSON.stringify(content, null, 2);
                await fetch(`https://api.github.com/repos/${CONFIG.REPO_OWNER}/${CONFIG.REPO_NAME}/contents/${CONFIG.FILE_PATH}`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `token ${CONFIG.GITHUB_TOKEN}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        message: `Suppression d'un poème`,
                        content: btoa(updatedContent),
                        sha: fileData.sha
                    })
                });

                chargerPoemesAdmin();
                return true;
            } catch (error) {
                return handleApiError(error);
            }
        }
    }

    // Modifier la fonction de modification
    window.modifierPoeme = async function(id) {
        try {
            const response = await fetch(`https://api.github.com/repos/${CONFIG.REPO_OWNER}/${CONFIG.REPO_NAME}/contents/${CONFIG.FILE_PATH}`);
            const fileData = await response.json();
            const content = JSON.parse(atob(fileData.content));
            poemeEnEdition = content.poemes.find(p => p.id === id);
            
            if (poemeEnEdition) {
                document.getElementById('poem-id').value = poemeEnEdition.id;
                document.getElementById('poem-title').value = poemeEnEdition.titre;
                document.getElementById('poem-content').value = poemeEnEdition.contenu;
                document.getElementById('poem-theme').value = poemeEnEdition.theme;
                
                document.getElementById('submit-btn').textContent = 'Enregistrer les modifications';
                document.getElementById('cancel-btn').classList.remove('hidden');
                
                document.getElementById('poem-form').scrollIntoView({ behavior: 'smooth' });
            }
        } catch (error) {
            handleApiError(error);
        }
    }

    function resetForm() {
        document.getElementById('poem-form').reset();
        document.getElementById('poem-id').value = '';
        document.getElementById('submit-btn').textContent = 'Ajouter un poème';
        document.getElementById('cancel-btn').classList.add('hidden');
        poemeEnEdition = null;
    }

    document.getElementById('cancel-btn').addEventListener('click', resetForm);

    // Fonction de gestion des erreurs
    async function handleApiError(error) {
        console.error('Erreur API:', error);
        alert('Une erreur est survenue. Veuillez réessayer.');
        return false;
    }
});
