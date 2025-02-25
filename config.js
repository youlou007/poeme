const CONFIG = {
    // GitHub Configuration
    GITHUB: {
        TOKEN: 'votre_nouveau_token_ici', // ⚠️ À remplacer avec un vrai token
        OWNER: 'youlou007',
        REPO: 'poeme',
        FILE_PATH: 'data/poems.json',
        API_BASE_URL: 'https://api.github.com',
        RAW_CONTENT_URL: 'https://raw.githubusercontent.com'
    },

    // Security Configuration
    SECURITY: {
        ADMIN_PASSWORD: "DC3NNAYKEFEV"
    },

    // Validation Rules
    VALIDATION: {
        POEM: {
            MAX_LENGTH: 5000,
            MIN_LENGTH: 10,
            TITLE: {
                MIN: 3,
                MAX: 100,
                PATTERN: /^[a-zA-ZÀ-ÿ0-9\s',.!?-]+$/
            },
            THEME: {
                MIN: 2,
                MAX: 30,
                PATTERN: /^[a-zA-ZÀ-ÿ\s]+$/
            }
        }
    },

    // Cache Configuration
    CACHE: {
        DURATION: 5 * 60 * 1000 // 5 minutes
    }
};

// Utility Functions
const GitHubAPI = {
    async request(url, options = {}) {
        const defaultHeaders = {
            'Authorization': `token ${CONFIG.GITHUB.TOKEN}`,
            'Accept': 'application/vnd.github.v3+json'
        };

        const response = await fetch(url, {
            ...options,
            headers: {
                ...defaultHeaders,
                ...options.headers
            }
        });

        if (!response.ok) {
            throw new Error(`GitHub API error: ${response.status}`);
        }

        return await response.json();
    },

    getApiUrl(path) {
        return `${CONFIG.GITHUB.API_BASE_URL}/repos/${CONFIG.GITHUB.OWNER}/${CONFIG.GITHUB.REPO}/${path}`;
    },

    getRawUrl(path) {
        return `${CONFIG.GITHUB.RAW_CONTENT_URL}/${CONFIG.GITHUB.OWNER}/${CONFIG.GITHUB.REPO}/main/${path}`;
    }
};

// Make both CONFIG and GitHubAPI available globally
window.CONFIG = CONFIG;
window.GitHubAPI = GitHubAPI;
