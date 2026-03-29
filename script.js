/**
 * FitAura - Premium Health & Wellness Web App
 * Core Logic & State Management
 */

const App = (() => {
    // State Management
    const state = {
        name: localStorage.getItem('aura_name') || 'Alex Wellness',
        steps: parseInt(localStorage.getItem('aura_steps')) || 0,
        water: parseFloat(localStorage.getItem('aura_water')) || 0,
        calories: parseInt(localStorage.getItem('aura_calories')) || 0,
        bmi: JSON.parse(localStorage.getItem('aura_bmi')) || null,
        activeMinutes: parseInt(localStorage.getItem('aura_active_minutes')) || 0,
        activityLog: JSON.parse(localStorage.getItem('aura_activity_log')) || [],
        goals: {
            steps: 10000,
            water: 3.0,
            calories: 2500
        }
    };

    // Timer Variables
    let timerInterval = null;
    let startTime = 0;
    let elapsedTime = 0;
    let isTimerRunning = false;

    // Chart Instances
    let stepsChart = null;
    let caloriesChart = null;
    let activityChart = null;

    const quotes = [
        { text: "The only way to keep your health is to eat what you don't want, drink what you don't like, and do what you'd rather not.", author: "Mark Twain" },
        { text: "Health is a state of complete physical, mental and social well-being and not merely the absence of disease or infirmity.", author: "WHO" },
        { text: "Physical fitness is not only one of the most important keys to a healthy body, it is the basis of dynamic and creative intellectual activity.", author: "John F. Kennedy" },
        { text: "To keep the body in good health is a duty... otherwise we shall not be able to keep our mind strong and clear.", author: "Buddha" },
        { text: "Your body is a temple, but only if you treat it as one.", author: "Astrid Alauda" }
    ];

    /**
     * Initialize the application
     */
    const init = () => {
        // Initialize Lucide icons
        lucide.createIcons();
        
        // Initialize Gamification
        if (window.Gamification) {
            window.Gamification.init();
        }

        setupNavigation();
        setupEventListeners();
        setupActivityFeatures();
        setupPhotoUpload();
        setupNameChange();
        setRandomQuote();
        setGreeting();
        initCharts();
        updateUI();
    };

    /**
     * Setup name change functionality
     */
    const setupNameChange = () => {
        const editBtn = document.getElementById('edit-name-btn');
        const saveBtn = document.getElementById('save-name-btn');
        const nameInput = document.getElementById('name-input');
        const editContainer = document.getElementById('name-edit-container');
        const nameDisplay = document.getElementById('profile-name-display');

        if (editBtn && saveBtn && nameInput && editContainer && nameDisplay) {
            editBtn.addEventListener('click', () => {
                editContainer.classList.toggle('hidden');
                nameInput.value = state.name;
                nameInput.focus();
            });

            saveBtn.addEventListener('click', () => {
                const newName = nameInput.value.trim();
                if (newName) {
                    state.name = newName;
                    save();
                    updateUI();
                    editContainer.classList.add('hidden');
                    if (window.Gamification) {
                        window.Gamification.addXP(10, "Profile updated!");
                    }
                }
            });

            nameInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') saveBtn.click();
            });
        }
    };

    /**
     * Setup profile photo upload
     */
    const setupPhotoUpload = () => {
        const photoInput = document.getElementById('photo-input');
        const changePhotoBtn = document.getElementById('change-photo-btn');
        const profileImg = document.getElementById('profile-img');

        if (changePhotoBtn && photoInput && profileImg) {
            changePhotoBtn.addEventListener('click', () => photoInput.click());
            photoInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        profileImg.src = event.target.result;
                        localStorage.setItem('aura_profile_photo', event.target.result);
                    };
                    reader.readAsDataURL(file);
                }
            });

            // Load saved photo
            const savedPhoto = localStorage.getItem('aura_profile_photo');
            if (savedPhoto) {
                profileImg.src = savedPhoto;
            }
        }
    };

    /**
     * Setup navigation between sections
     */
    const setupNavigation = () => {
        const navBtns = document.querySelectorAll('.nav-btn');
        const sections = document.querySelectorAll('.section');

        navBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const target = btn.getAttribute('data-target');
                
                // Update buttons
                navBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                // Update sections
                sections.forEach(s => s.classList.remove('active'));
                const targetSection = document.getElementById(`section-${target}`);
                if (targetSection) {
                    targetSection.classList.add('active');
                    // Scroll to top of the page when changing sections
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }
            });
        });
    };

    /**
     * Setup event listeners for user interactions
     */
    const setupEventListeners = () => {
        // Steps
        document.getElementById('steps-plus')?.addEventListener('click', () => adjustSteps(500));
        document.getElementById('steps-minus')?.addEventListener('click', () => adjustSteps(-500));

        // Water
        document.querySelectorAll('.water-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const amount = parseInt(btn.getAttribute('data-amount')) / 1000;
                addWater(amount);
            });
        });
        document.getElementById('water-reset')?.addEventListener('click', () => resetWater());

        // Calories
        document.getElementById('add-cal-btn')?.addEventListener('click', () => {
            const input = document.getElementById('cal-input');
            const val = parseInt(input.value);
            if (val > 0) {
                addCalories(val);
                input.value = '';
            }
        });
        document.querySelectorAll('.quick-cal').forEach(btn => {
            btn.addEventListener('click', () => {
                const val = parseInt(btn.getAttribute('data-val'));
                addCalories(val);
            });
        });
        document.getElementById('cal-reset')?.addEventListener('click', () => resetCalories());

        // BMI
        document.getElementById('calculate-bmi')?.addEventListener('click', () => calculateBMI());
    };

    /**
     * Setup Activity specific features (Timer, Log)
     */
    const setupActivityFeatures = () => {
        // Timer Controls
        const startBtn = document.getElementById('timer-start');
        const stopBtn = document.getElementById('timer-stop');
        const resetBtn = document.getElementById('timer-reset');
        const clearLogBtn = document.getElementById('clear-log');

        if (startBtn) {
            startBtn.addEventListener('click', () => {
                if (isTimerRunning) pauseTimer();
                else startTimer();
            });
        }

        if (stopBtn) {
            stopBtn.addEventListener('click', () => stopTimer());
        }

        if (resetBtn) {
            resetBtn.addEventListener('click', () => resetTimer());
        }

        if (clearLogBtn) {
            clearLogBtn.addEventListener('click', () => {
                state.activityLog = [];
                save();
                updateActivityUI();
            });
        }
    };

    /**
     * Workout Timer Logic
     */
    const startTimer = () => {
        isTimerRunning = true;
        startTime = Date.now() - elapsedTime;
        timerInterval = setInterval(updateTimerDisplay, 10);
        
        const playIcon = document.getElementById('timer-play-icon');
        const timerDot = document.getElementById('timer-dot');
        const timerLabel = document.getElementById('timer-label');
        
        if (playIcon) {
            playIcon.setAttribute('data-lucide', 'pause');
            lucide.createIcons();
        }
        if (timerDot) timerDot.classList.add('bg-primary', 'animate-pulse');
        if (timerLabel) {
            timerLabel.textContent = "Active";
            timerLabel.classList.add('text-primary');
        }
    };

    const pauseTimer = () => {
        isTimerRunning = false;
        clearInterval(timerInterval);
        
        const playIcon = document.getElementById('timer-play-icon');
        const timerDot = document.getElementById('timer-dot');
        const timerLabel = document.getElementById('timer-label');
        
        if (playIcon) {
            playIcon.setAttribute('data-lucide', 'play');
            lucide.createIcons();
        }
        if (timerDot) timerDot.classList.remove('animate-pulse');
        if (timerLabel) {
            timerLabel.textContent = "Paused";
            timerLabel.classList.remove('text-primary');
        }
    };

    const stopTimer = () => {
        if (elapsedTime > 0) {
            const minutes = Math.floor(elapsedTime / 60000);
            if (minutes > 0) {
                state.activeMinutes += minutes;
                logActivity('Workout', `${minutes} min`);
                if (window.Gamification) {
                    window.Gamification.addXP(minutes * 5, "Workout complete!");
                }
            }
        }
        resetTimer();
    };

    const resetTimer = () => {
        pauseTimer();
        elapsedTime = 0;
        updateTimerDisplay();
        
        const timerLabel = document.getElementById('timer-label');
        if (timerLabel) timerLabel.textContent = "Ready";
    };

    const updateTimerDisplay = () => {
        if (isTimerRunning) {
            elapsedTime = Date.now() - startTime;
        }
        
        const display = document.getElementById('workout-timer-display');
        if (display) {
            const h = Math.floor(elapsedTime / 3600000);
            const m = Math.floor((elapsedTime % 3600000) / 60000);
            const s = Math.floor((elapsedTime % 60000) / 1000);
            
            display.textContent = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        }
    };

    /**
     * Activity Logging
     */
    const logActivity = (type, value) => {
        const entry = {
            id: Date.now(),
            type,
            value,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        state.activityLog.unshift(entry);
        if (state.activityLog.length > 20) state.activityLog.pop();
        save();
        updateActivityUI();
    };

    /**
     * Chart Initialization
     */
    const initCharts = () => {
        const ctxSteps = document.getElementById('stepsLineChart')?.getContext('2d');
        const ctxCals = document.getElementById('caloriesBarChart')?.getContext('2d');
        const ctxDist = document.getElementById('activityDoughnutChart')?.getContext('2d');

        if (ctxSteps) {
            stepsChart = new Chart(ctxSteps, {
                type: 'line',
                data: {
                    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                    datasets: [{
                        label: 'Steps',
                        data: [4500, 6200, 5100, 8900, 7400, 10500, state.steps],
                        borderColor: '#8b5cf6',
                        backgroundColor: 'rgba(139, 92, 246, 0.1)',
                        fill: true,
                        tension: 0.4,
                        borderWidth: 3,
                        pointRadius: 0,
                        pointHoverRadius: 5
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        y: { display: false },
                        x: { grid: { display: false }, ticks: { color: '#ffffff', font: { size: 10 } } }
                    }
                }
            });
        }

        if (ctxCals) {
            caloriesChart = new Chart(ctxCals, {
                type: 'bar',
                data: {
                    labels: ['Burned', 'Consumed'],
                    datasets: [{
                        data: [state.steps * 0.04 + state.activeMinutes * 8, state.calories],
                        backgroundColor: ['#10b981', '#f59e0b'],
                        borderRadius: 8,
                        barThickness: 40
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        y: { display: false },
                        x: { grid: { display: false }, ticks: { color: '#ffffff', font: { size: 10 } } }
                    }
                }
            });
        }

        if (ctxDist) {
            activityChart = new Chart(ctxDist, {
                type: 'doughnut',
                data: {
                    labels: ['Walking', 'Running', 'Workout'],
                    datasets: [{
                        data: [60, 25, 15],
                        backgroundColor: ['#8b5cf6', '#3b82f6', '#10b981'],
                        borderWidth: 0,
                        cutout: '75%'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } }
                }
            });
        }
    };

    const updateCharts = () => {
        if (stepsChart) {
            const todayIndex = (new Date().getDay() + 6) % 7;
            stepsChart.data.datasets[0].data[todayIndex] = state.steps;
            stepsChart.update();
        }

        if (caloriesChart) {
            const burned = Math.round(state.steps * 0.04 + state.activeMinutes * 8);
            caloriesChart.data.datasets[0].data = [burned, state.calories];
            caloriesChart.update();
        }
    };

    /**
     * Adjust step count
     * @param {number} amount - Amount to adjust by
     */
    const adjustSteps = (amount) => {
        state.steps = Math.max(0, state.steps + amount);
        if (amount > 0) {
            logActivity('Steps', `+${amount}`);
        }
        save();
        updateUI();
        
        if (amount > 0 && window.Gamification) {
            window.Gamification.addXP(window.Gamification.XP_ACTIONS.ADD_STEPS, "Stepping up!");
        }
    };

    /**
     * Add water intake
     * @param {number} amount - Amount in Liters
     */
    const addWater = (amount) => {
        state.water = parseFloat((state.water + amount).toFixed(2));
        save();
        updateUI();
        
        if (window.Gamification) {
            window.Gamification.addXP(window.Gamification.XP_ACTIONS.ADD_WATER, "Stay hydrated!");
        }
    };

    /**
     * Reset water intake
     */
    const resetWater = () => {
        state.water = 0;
        save();
        updateUI();
    };

    /**
     * Add calorie intake
     * @param {number} amount - Amount in kcal
     */
    const addCalories = (amount) => {
        state.calories += amount;
        save();
        updateUI();
        
        if (window.Gamification) {
            window.Gamification.addXP(window.Gamification.XP_ACTIONS.LOG_CALORIES, "Fueling up!");
        }
    };

    /**
     * Reset calorie intake
     */
    const resetCalories = () => {
        state.calories = 0;
        save();
        updateUI();
    };

    /**
     * Calculate and save BMI
     */
    const calculateBMI = () => {
        const height = parseFloat(document.getElementById('bmi-height').value) / 100;
        const weight = parseFloat(document.getElementById('bmi-weight').value);

        if (height > 0 && weight > 0) {
            const bmiScore = (weight / (height * height)).toFixed(1);
            let category = "";
            
            if (bmiScore < 18.5) category = "Underweight";
            else if (bmiScore < 25) category = "Normal Weight";
            else if (bmiScore < 30) category = "Overweight";
            else category = "Obese";

            state.bmi = { score: bmiScore, category };
            save();
            updateUI();
            
            // Scroll to result
            setTimeout(() => {
                document.getElementById('bmi-result')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
            
            if (window.Gamification) {
                window.Gamification.addXP(window.Gamification.XP_ACTIONS.CALC_BMI, "Body awareness!");
            }
        }
    };

    /**
     * Update all UI elements based on current state
     */
    const updateUI = () => {
        // Dashboard
        const dashWater = document.getElementById('dash-water');
        const dashSteps = document.getElementById('dash-steps');
        const dashCalories = document.getElementById('dash-calories');
        const totalXp = document.getElementById('total-xp');
        const dashName = document.getElementById('user-name-dash');

        if (dashWater) dashWater.textContent = `${state.water}L`;
        if (dashSteps) dashSteps.textContent = state.steps.toLocaleString();
        if (dashCalories) dashCalories.textContent = `${state.calories} / ${state.goals.calories} kcal`;
        if (totalXp && window.Gamification) totalXp.textContent = window.Gamification.getState().xp;
        if (dashName) dashName.textContent = state.name.split(' ')[0]; // Show first name on dash

        // Activity Screen
        updateActivityUI();
        
        // Update Weekly Chart (Legacy)
        updateWeeklyChart();

        // Nutrition Screen
        const waterDisplay = document.getElementById('water-display');
        const caloriesDisplay = document.getElementById('calories-display');
        if (waterDisplay) waterDisplay.textContent = `${state.water.toFixed(1)}L`;
        if (caloriesDisplay) caloriesDisplay.textContent = `${state.calories} kcal`;
        
        const calProgressBar = document.getElementById('cal-progress-bar');
        const calPercentText = document.getElementById('cal-percent');
        if (calProgressBar && calPercentText) {
            const percent = Math.min((state.calories / state.goals.calories) * 100, 100);
            calProgressBar.style.width = `${percent}%`;
            calPercentText.textContent = `${Math.round(percent)}%`;
        }

        // Profile Screen
        const profileName = document.getElementById('profile-name-display');
        if (profileName) profileName.textContent = state.name;

        if (state.bmi) {
            const resultCard = document.getElementById('bmi-result');
            const scoreEl = document.getElementById('bmi-score');
            const catEl = document.getElementById('bmi-category');
            
            if (resultCard && scoreEl && catEl) {
                resultCard.classList.remove('hidden');
                scoreEl.textContent = state.bmi.score;
                catEl.textContent = state.bmi.category;
            }
        }
    };

    /**
     * Update Activity Panel UI
     */
    const updateActivityUI = () => {
        // Summary
        const summarySteps = document.getElementById('summary-steps');
        const summaryCalories = document.getElementById('summary-calories');
        const summaryMinutes = document.getElementById('summary-minutes');
        const summaryDistance = document.getElementById('summary-distance');

        const burned = Math.round(state.steps * 0.04 + state.activeMinutes * 8);
        const distance = (state.steps * 0.00076).toFixed(2); // Avg step length 0.76m

        if (summarySteps) summarySteps.textContent = state.steps.toLocaleString();
        if (summaryCalories) summaryCalories.textContent = burned.toLocaleString();
        if (summaryMinutes) summaryMinutes.textContent = state.activeMinutes.toLocaleString();
        if (summaryDistance) summaryDistance.textContent = distance;

        // Goal Progress
        const goalPercent = document.getElementById('goal-percent');
        const goalBar = document.getElementById('goal-progress-bar');
        const goalTarget = document.getElementById('goal-target');

        if (goalPercent && goalBar && goalTarget) {
            const percent = Math.min(Math.round((state.steps / state.goals.steps) * 100), 100);
            goalPercent.textContent = `${percent}%`;
            goalBar.style.width = `${percent}%`;
            goalTarget.textContent = state.goals.steps.toLocaleString();
        }

        // Activity Log
        const logList = document.getElementById('activity-log-list');
        if (logList) {
            if (state.activityLog.length === 0) {
                logList.innerHTML = `<div class="flex items-center justify-center py-8 text-white/20 italic text-xs">No activities logged today</div>`;
            } else {
                logList.innerHTML = state.activityLog.map(entry => `
                    <div class="flex items-center justify-between p-3 bg-primary/5 rounded-xl border border-primary/10 animate-fade-in group hover:bg-primary/10 transition-all">
                        <div class="flex items-center space-x-3 min-w-0">
                            <div class="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary flex-shrink-0">
                                <i data-lucide="${entry.type === 'Steps' ? 'footprints' : 'zap'}" class="w-4 h-4"></i>
                            </div>
                            <div class="min-w-0">
                                <p class="text-xs font-bold truncate text-white">${entry.type}</p>
                                <p class="text-[9px] text-white/40 truncate">${entry.time}</p>
                            </div>
                        </div>
                        <span class="text-xs font-black text-primary flex-shrink-0 ml-2">${entry.value}</span>
                    </div>
                `).join('');
                lucide.createIcons();
            }
        }

        // Update Charts
        updateCharts();
    };

    /**
     * Update the weekly activity chart with mock data
     */
    const updateWeeklyChart = () => {
        const chart = document.getElementById('weekly-chart');
        if (!chart) return;

        const bars = chart.querySelectorAll('.chart-bar');
        if (bars.length === 0) return;

        const mockData = [40, 65, 45, 80, 55, 90, 30]; // Base data
        
        // Slightly vary the current day's bar based on steps
        const todayIndex = (new Date().getDay() + 6) % 7; // Mon-Sun
        const currentProgress = Math.min((state.steps / state.goals.steps) * 100, 100);
        mockData[todayIndex] = Math.max(mockData[todayIndex], currentProgress);

        bars.forEach((bar, index) => {
            if (mockData[index] !== undefined) {
                setTimeout(() => {
                    bar.style.height = `${mockData[index]}%`;
                }, index * 50);
            }
        });
    };

    /**
     * Set a random motivational quote
     */
    const setRandomQuote = () => {
        const quote = quotes[Math.floor(Math.random() * quotes.length)];
        const textEl = document.getElementById('quote-text');
        const authorEl = document.getElementById('quote-author');
        
        if (textEl) textEl.textContent = `"${quote.text}"`;
        if (authorEl) authorEl.textContent = `— ${quote.author}`;
    };

    /**
     * Set greeting based on time of day
     */
    const setGreeting = () => {
        const hour = new Date().getHours();
        const greetingEl = document.getElementById('greeting');
        
        if (greetingEl) {
            if (hour < 12) greetingEl.textContent = "Good Morning";
            else if (hour < 18) greetingEl.textContent = "Good Afternoon";
            else greetingEl.textContent = "Good Evening";
        }
    };

    /**
     * Save state to localStorage
     */
    const save = () => {
        localStorage.setItem('aura_name', state.name);
        localStorage.setItem('aura_steps', state.steps);
        localStorage.setItem('aura_water', state.water);
        localStorage.setItem('aura_calories', state.calories);
        localStorage.setItem('aura_active_minutes', state.activeMinutes);
        localStorage.setItem('aura_activity_log', JSON.stringify(state.activityLog));
        localStorage.setItem('aura_bmi', JSON.stringify(state.bmi));
    };

    return { init };
})();

// Start the app
document.addEventListener('DOMContentLoaded', App.init);
