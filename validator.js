class PoemValidator {
    static validatePoem(poem) {
        const errors = [];
        
        // Validation de base
        if (!poem.titre || !poem.contenu) {
            errors.push('Le titre et le contenu sont requis');
            return { isValid: false, errors };
        }

        // Validation contenu
        if (poem.contenu.length > CONFIG.VALIDATION.POEM.MAX_LENGTH) {
            errors.push(`Le poème ne doit pas dépasser ${CONFIG.VALIDATION.POEM.MAX_LENGTH} caractères`);
        }

        // Sanitization
        poem.titre = this.sanitizeInput(poem.titre);
        poem.contenu = this.sanitizeInput(poem.contenu);
        
        return {
            isValid: errors.length === 0,
            errors,
            sanitizedPoem: poem
        };
    }

    static sanitizeInput(input) {
        return input
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .trim();
    }
}

window.PoemValidator = PoemValidator; // Rendre disponible globalement
