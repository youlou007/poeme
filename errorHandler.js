class ErrorHandler {
    static errors = {
        GITHUB_API: 'Erreur API GitHub',
        VALIDATION: 'Erreur de validation',
        NETWORK: 'Erreur réseau',
        AUTH: 'Erreur d\'authentification',
        UNKNOWN: 'Erreur inconnue',
        DATA: 'Erreur de données',
        PERMISSION: 'Erreur de permission'
    };

    static notificationQueue = [];
    static isShowingNotification = false;

    static async handleError(error, type = 'UNKNOWN', details = '') {
        // Log détaillé pour le débogage
        console.error(`[${type}]:`, {
            message: error.message || error,
            details,
            timestamp: new Date().toISOString(),
            stack: error.stack
        });

        // Créer le message d'erreur
        const message = this.createErrorMessage(type, error);
        
        // Ajouter à la file d'attente
        this.queueNotification(message);

        // Retourner false pour la gestion des promesses
        return false;
    }

    static createErrorMessage(type, error) {
        const message = document.createElement('div');
        message.className = 'error-notification';
        
        // Conteneur pour le message et le bouton de fermeture
        message.innerHTML = `
            <div class="error-content">
                <strong>${this.errors[type]}</strong>
                <p>${error.message || 'Une erreur est survenue'}</p>
            </div>
            <button class="close-error" aria-label="Fermer">&times;</button>
        `;

        // Ajouter le gestionnaire de fermeture
        message.querySelector('.close-error').addEventListener('click', () => {
            this.removeNotification(message);
        });

        return message;
    }

    static queueNotification(message) {
        this.notificationQueue.push(message);
        if (!this.isShowingNotification) {
            this.showNextNotification();
        }
    }

    static async showNextNotification() {
        if (this.notificationQueue.length === 0) {
            this.isShowingNotification = false;
            return;
        }

        this.isShowingNotification = true;
        const message = this.notificationQueue.shift();
        document.body.appendChild(message);

        // Animation d'entrée
        message.style.opacity = '0';
        message.style.transform = 'translateY(20px)';
        await new Promise(resolve => requestAnimationFrame(resolve));
        message.style.opacity = '1';
        message.style.transform = 'translateY(0)';

        // Auto-suppression après délai
        setTimeout(() => {
            this.removeNotification(message);
        }, 5000);
    }

    static async removeNotification(message) {
        // Animation de sortie
        message.style.opacity = '0';
        message.style.transform = 'translateY(-20px)';
        
        await new Promise(resolve => setTimeout(resolve, 300));
        
        if (message.parentNode) {
            message.parentNode.removeChild(message);
        }

        // Afficher la notification suivante
        setTimeout(() => this.showNextNotification(), 100);
    }

    // Méthode utilitaire pour les erreurs de réseau
    static handleNetworkError(error) {
        return this.handleError(error, 'NETWORK', 'Vérifiez votre connexion internet');
    }

    // Méthode utilitaire pour les erreurs d'API
    static handleApiError(error, endpoint) {
        return this.handleError(error, 'GITHUB_API', `Erreur lors de l'appel à ${endpoint}`);
    }
}

// Styles pour les notifications
const style = document.createElement('style');
style.textContent = `
    .error-notification {
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px;
        background: #fff;
        border-left: 4px solid #ff4444;
        border-radius: 4px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        z-index: 1000;
        display: flex;
        align-items: start;
        min-width: 300px;
        max-width: 400px;
        transition: all 0.3s ease;
    }

    .error-content {
        flex: 1;
        margin-right: 10px;
    }

    .close-error {
        background: none;
        border: none;
        color: #666;
        cursor: pointer;
        padding: 0 5px;
        font-size: 20px;
    }

    .close-error:hover {
        color: #333;
    }
`;
document.head.appendChild(style);

// Rendre disponible globalement
window.ErrorHandler = ErrorHandler;
