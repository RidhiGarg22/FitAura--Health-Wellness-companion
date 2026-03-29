/**
 * Gamification System for FitAura
 * Handles XP, Levels, and Level-up logic
 */

const Gamification = (() => {
    // Constants
    const XP_PER_LEVEL = 1000;
    const XP_ACTIONS = {
        ADD_WATER: 25,
        ADD_STEPS: 50,
        LOG_CALORIES: 30,
        CALC_BMI: 100
    };

    // State
    let state = {
        xp: parseInt(localStorage.getItem('aura_xp')) || 0,
        level: parseInt(localStorage.getItem('aura_level')) || 1
    };

    /**
     * Initialize the gamification UI
     */
    const init = () => {
        updateUI();
        setupEventListeners();
    };

    /**
     * Add XP to the user's total
     * @param {number} amount - Amount of XP to add
     * @param {string} reason - Reason for adding XP (for toast)
     */
    const addXP = (amount, reason = "") => {
        state.xp += amount;
        
        // Check for level up
        const newLevel = Math.floor(state.xp / XP_PER_LEVEL) + 1;
        
        if (newLevel > state.level) {
            state.level = newLevel;
            showLevelUp();
        }

        save();
        updateUI();
        
        if (reason) {
            showToast(`+${amount} XP: ${reason}`);
        }
    };

    /**
     * Update the UI elements related to gamification
     */
    const updateUI = () => {
        const levelEl = document.getElementById('user-level');
        const xpProgressEl = document.getElementById('xp-progress');
        const totalXpEl = document.getElementById('total-xp');
        const xpToNextEl = document.getElementById('xp-to-next');

        if (levelEl) levelEl.textContent = state.level;
        if (totalXpEl) totalXpEl.textContent = state.xp;

        const currentLevelXP = state.xp % XP_PER_LEVEL;
        const progressPercent = (currentLevelXP / XP_PER_LEVEL) * 100;
        
        if (xpProgressEl) {
            xpProgressEl.style.width = `${progressPercent}%`;
        }

        if (xpToNextEl) {
            xpToNextEl.textContent = `${XP_PER_LEVEL - currentLevelXP} XP to Level ${state.level + 1}`;
        }
    };

    /**
     * Save gamification state to localStorage
     */
    const save = () => {
        localStorage.setItem('aura_xp', state.xp);
        localStorage.setItem('aura_level', state.level);
    };

    /**
     * Show the level up overlay
     */
    const showLevelUp = () => {
        const overlay = document.getElementById('level-up-overlay');
        const levelVal = document.getElementById('new-level-val');
        
        if (overlay && levelVal) {
            levelVal.textContent = state.level;
            overlay.classList.remove('hidden');
            setTimeout(() => {
                overlay.classList.add('active');
            }, 10);
        }
    };

    /**
     * Show a temporary toast notification
     * @param {string} message - Message to display
     */
    const showToast = (message) => {
        const toast = document.getElementById('toast');
        const toastMsg = document.getElementById('toast-msg');
        
        if (toast && toastMsg) {
            toastMsg.textContent = message;
            toast.style.opacity = '1';
            toast.style.transform = 'translate(-50%, 0)';
            
            setTimeout(() => {
                toast.style.opacity = '0';
                toast.style.transform = 'translate(-50%, -20px)';
            }, 3000);
        }
    };

    /**
     * Setup event listeners for gamification UI
     */
    const setupEventListeners = () => {
        const closeBtn = document.getElementById('close-level-up');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                const overlay = document.getElementById('level-up-overlay');
                if (overlay) {
                    overlay.classList.remove('active');
                    setTimeout(() => {
                        overlay.classList.add('hidden');
                    }, 500);
                }
            });
        }
    };

    return {
        init,
        addXP,
        XP_ACTIONS,
        getState: () => ({ ...state })
    };
})();

// Export for use in script.js
window.Gamification = Gamification;
