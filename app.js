/* ========================================
   TENNIS PLAYERS DATABASE APP
   With Firebase Realtime Database
   ======================================== */

const App = {
    // Data
    players: [],
    filteredPlayers: [],
    currentEditId: null,
    currentDeleteId: null,
    filterEmpathy: 0,
    isListView: false,
    dbRef: null,

    // Days mapping
    days: [
        { value: 'lunedi', label: 'Lunedì', short: 'Lun' },
        { value: 'martedi', label: 'Martedì', short: 'Mar' },
        { value: 'mercoledi', label: 'Mercoledì', short: 'Mer' },
        { value: 'giovedi', label: 'Giovedì', short: 'Gio' },
        { value: 'venerdi', label: 'Venerdì', short: 'Ven' },
        { value: 'sabato', label: 'Sabato', short: 'Sab' },
        { value: 'domenica', label: 'Domenica', short: 'Dom' }
    ],

    // Levels mapping
    levels: {
        principiante: { label: 'Principiante', class: 'level-principiante' },
        intermedio: { label: 'Intermedio', class: 'level-intermedio' },
        avanzato: { label: 'Avanzato', class: 'level-avanzato' },
        agonista: { label: 'Agonista', class: 'level-agonista' }
    },

    // ========================================
    // INITIALIZATION
    // ========================================
    init() {
        // Check if Firebase is available
        if (typeof firebase !== 'undefined' && firebase.database) {
            this.dbRef = firebase.database().ref('players');
            this.setupFirebaseListener();
            console.log('🔥 Firebase mode: Database connected');
        } else {
            console.warn('⚠️ Firebase not available, using LocalStorage fallback');
            this.loadFromStorage();
        }

        this.bindEvents();
        this.render();
        console.log('🎾 Tennis Players Database initialized');
    },

    // ========================================
    // FIREBASE OPERATIONS
    // ========================================
    setupFirebaseListener() {
        // Listen for realtime changes
        this.dbRef.on('value', (snapshot) => {
            this.players = [];
            snapshot.forEach((childSnapshot) => {
                const player = childSnapshot.val();
                player.id = childSnapshot.key;
                this.players.push(player);
            });

            // Sort by cognome
            this.players.sort((a, b) => a.cognome.localeCompare(b.cognome));

            this.applyFilters();
            console.log(`📊 Loaded ${this.players.length} players from Firebase`);
        }, (error) => {
            console.error('Firebase error:', error);
            this.showToast('Errore di connessione al database', 'error');
        });
    },

    async saveToFirebase(playerData) {
        try {
            if (playerData.id) {
                // Update existing
                await this.dbRef.child(playerData.id).update(playerData);
            } else {
                // Create new
                const newRef = await this.dbRef.push(playerData);
                playerData.id = newRef.key;
            }
            return true;
        } catch (error) {
            console.error('Error saving to Firebase:', error);
            this.showToast('Errore nel salvataggio', 'error');
            return false;
        }
    },

    async deleteFromFirebase(playerId) {
        try {
            await this.dbRef.child(playerId).remove();
            return true;
        } catch (error) {
            console.error('Error deleting from Firebase:', error);
            this.showToast('Errore nell\'eliminazione', 'error');
            return false;
        }
    },

    // ========================================
    // LOCAL STORAGE (Fallback)
    // ========================================
    loadFromStorage() {
        const stored = localStorage.getItem('tennis_players');
        if (stored) {
            try {
                this.players = JSON.parse(stored);
            } catch (e) {
                console.error('Error loading data:', e);
                this.players = [];
            }
        }
    },

    saveToStorage() {
        localStorage.setItem('tennis_players', JSON.stringify(this.players));
    },

    // ========================================
    // UTILITIES
    // ========================================
    generateId() {
        return 'player_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    },

    getDayShort(dayValue) {
        const day = this.days.find(d => d.value === dayValue);
        return day ? day.short : dayValue;
    },

    getDayLabel(dayValue) {
        const day = this.days.find(d => d.value === dayValue);
        return day ? day.label : dayValue;
    },

    formatTime(time) {
        return time || '--:--';
    },

    showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        const toastIcon = toast.querySelector('.toast-icon');
        const toastMessage = toast.querySelector('.toast-message');

        const icons = {
            success: '✓',
            error: '✕',
            warning: '⚠'
        };

        toast.className = 'toast ' + type;
        toastIcon.textContent = icons[type] || '';
        toastMessage.textContent = message;
        toast.classList.add('show');

        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    },

    // ========================================
    // EVENT BINDINGS
    // ========================================
    bindEvents() {
        // New Player Button
        document.getElementById('btnNewPlayer').addEventListener('click', () => this.openModal());

        // Modal Controls
        document.getElementById('btnCloseModal').addEventListener('click', () => this.closeModal());
        document.getElementById('btnCancel').addEventListener('click', () => this.closeModal());
        document.getElementById('playerForm').addEventListener('submit', (e) => this.handleSubmit(e));

        // Delete Modal Controls
        document.getElementById('btnCloseDeleteModal').addEventListener('click', () => this.closeDeleteModal());
        document.getElementById('btnCancelDelete').addEventListener('click', () => this.closeDeleteModal());
        document.getElementById('btnConfirmDelete').addEventListener('click', () => this.confirmDelete());

        // Availability
        document.getElementById('btnAddAvailability').addEventListener('click', () => this.addAvailabilitySlot());

        // Star Rating in Form
        this.bindStarRating();

        // Filter Events
        document.getElementById('searchInput').addEventListener('input', () => this.applyFilters());
        document.querySelectorAll('input[name="level"]').forEach(cb => {
            cb.addEventListener('change', () => this.applyFilters());
        });
        document.querySelectorAll('input[name="day"]').forEach(cb => {
            cb.addEventListener('change', () => this.applyFilters());
        });
        document.getElementById('filterTimeStart').addEventListener('change', () => this.applyFilters());
        document.getElementById('filterTimeEnd').addEventListener('change', () => this.applyFilters());

        // Empathy Filter Stars
        this.bindEmpathyFilter();

        // Reset Filters
        document.getElementById('btnResetFilters').addEventListener('click', () => this.resetFilters());

        // View Toggle
        document.getElementById('btnGridView').addEventListener('click', () => this.setView('grid'));
        document.getElementById('btnListView').addEventListener('click', () => this.setView('list'));

        // Mobile Filter Toggle
        document.getElementById('btnToggleFilters').addEventListener('click', () => this.toggleFilters());

        // Close modal on overlay click
        document.getElementById('playerModal').addEventListener('click', (e) => {
            if (e.target.id === 'playerModal') this.closeModal();
        });
        document.getElementById('deleteModal').addEventListener('click', (e) => {
            if (e.target.id === 'deleteModal') this.closeDeleteModal();
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
                this.closeDeleteModal();
            }
        });
    },

    bindStarRating() {
        const stars = document.querySelectorAll('#empathyRating .star');
        stars.forEach(star => {
            star.addEventListener('click', () => {
                const value = parseInt(star.dataset.value);
                document.getElementById('empatia').value = value;
                this.updateStarDisplay(stars, value);
            });
            star.addEventListener('mouseenter', () => {
                const value = parseInt(star.dataset.value);
                this.updateStarDisplay(stars, value, true);
            });
        });

        document.getElementById('empathyRating').addEventListener('mouseleave', () => {
            const currentValue = parseInt(document.getElementById('empatia').value) || 0;
            this.updateStarDisplay(stars, currentValue);
        });
    },

    bindEmpathyFilter() {
        const stars = document.querySelectorAll('#empathyFilter .star');
        stars.forEach(star => {
            star.addEventListener('click', () => {
                const value = parseInt(star.dataset.value);
                // Toggle off if clicking the same value
                if (this.filterEmpathy === value) {
                    this.filterEmpathy = 0;
                } else {
                    this.filterEmpathy = value;
                }
                this.updateFilterStars();
                this.applyFilters();
            });
        });
    },

    updateStarDisplay(stars, value, isHover = false) {
        stars.forEach(star => {
            const starValue = parseInt(star.dataset.value);
            if (starValue <= value) {
                star.classList.add('active');
            } else {
                star.classList.remove('active');
            }
        });
    },

    updateFilterStars() {
        const stars = document.querySelectorAll('#empathyFilter .star');
        const valueEl = document.getElementById('empathyValue');

        stars.forEach(star => {
            const starValue = parseInt(star.dataset.value);
            if (starValue <= this.filterEmpathy) {
                star.classList.add('active');
            } else {
                star.classList.remove('active');
            }
        });

        valueEl.textContent = this.filterEmpathy > 0 ? `${this.filterEmpathy}+ stelle` : 'Tutti';
    },

    // ========================================
    // MODAL HANDLING
    // ========================================
    openModal(player = null) {
        const modal = document.getElementById('playerModal');
        const title = document.getElementById('modalTitle');
        const form = document.getElementById('playerForm');

        form.reset();
        document.getElementById('empatia').value = '0';
        this.updateStarDisplay(document.querySelectorAll('#empathyRating .star'), 0);
        document.getElementById('availabilityList').innerHTML = '';

        if (player) {
            // Edit mode
            this.currentEditId = player.id;
            title.textContent = 'Modifica Giocatore';
            document.getElementById('playerId').value = player.id;
            document.getElementById('cognome').value = player.cognome;
            document.getElementById('nome').value = player.nome;
            document.getElementById('telefono').value = player.telefono;
            document.getElementById('livello').value = player.livello;
            document.getElementById('empatia').value = player.empatia;
            this.updateStarDisplay(document.querySelectorAll('#empathyRating .star'), player.empatia);

            // Load availability slots
            if (player.disponibilita && player.disponibilita.length > 0) {
                player.disponibilita.forEach(slot => {
                    this.addAvailabilitySlot(slot);
                });
            }
        } else {
            // New mode
            this.currentEditId = null;
            title.textContent = 'Nuovo Giocatore';
            document.getElementById('playerId').value = '';
        }

        modal.classList.add('active');
        document.getElementById('cognome').focus();
    },

    closeModal() {
        const modal = document.getElementById('playerModal');
        modal.classList.remove('active');
        this.currentEditId = null;
    },

    openDeleteModal(player) {
        this.currentDeleteId = player.id;
        document.getElementById('deletePlayerName').textContent = `${player.cognome} ${player.nome}`;
        document.getElementById('deleteModal').classList.add('active');
    },

    closeDeleteModal() {
        document.getElementById('deleteModal').classList.remove('active');
        this.currentDeleteId = null;
    },

    // ========================================
    // AVAILABILITY MANAGEMENT
    // ========================================
    addAvailabilitySlot(data = null) {
        const list = document.getElementById('availabilityList');
        const slot = document.createElement('div');
        slot.className = 'availability-slot';

        const dayOptions = this.days.map(d =>
            `<option value="${d.value}" ${data && data.giorno === d.value ? 'selected' : ''}>${d.label}</option>`
        ).join('');

        slot.innerHTML = `
            <select class="slot-day" required>
                <option value="">Giorno...</option>
                ${dayOptions}
            </select>
            <input type="time" class="slot-start" value="${data ? data.oraInizio : ''}" required>
            <span class="slot-separator">—</span>
            <input type="time" class="slot-end" value="${data ? data.oraFine : ''}" required>
            <button type="button" class="btn-remove-slot" title="Rimuovi">×</button>
        `;

        slot.querySelector('.btn-remove-slot').addEventListener('click', () => {
            slot.remove();
        });

        list.appendChild(slot);
    },

    getAvailabilityFromForm() {
        const slots = document.querySelectorAll('#availabilityList .availability-slot');
        const availability = [];

        slots.forEach(slot => {
            const giorno = slot.querySelector('.slot-day').value;
            const oraInizio = slot.querySelector('.slot-start').value;
            const oraFine = slot.querySelector('.slot-end').value;

            if (giorno && oraInizio && oraFine) {
                availability.push({ giorno, oraInizio, oraFine });
            }
        });

        return availability;
    },

    // ========================================
    // CRUD OPERATIONS
    // ========================================
    async handleSubmit(e) {
        e.preventDefault();

        const empatia = parseInt(document.getElementById('empatia').value);
        if (empatia < 1 || empatia > 5) {
            this.showToast('Seleziona il livello di empatia (1-5 stelle)', 'error');
            return;
        }

        const disponibilita = this.getAvailabilityFromForm();

        const playerData = {
            cognome: document.getElementById('cognome').value.trim(),
            nome: document.getElementById('nome').value.trim(),
            telefono: document.getElementById('telefono').value.trim(),
            livello: document.getElementById('livello').value,
            empatia: empatia,
            disponibilita: disponibilita,
            updatedAt: new Date().toISOString()
        };

        // Use Firebase if available
        if (this.dbRef) {
            if (this.currentEditId) {
                playerData.id = this.currentEditId;
                const success = await this.saveToFirebase(playerData);
                if (success) {
                    this.showToast('Giocatore aggiornato con successo');
                }
            } else {
                playerData.createdAt = new Date().toISOString();
                const success = await this.saveToFirebase(playerData);
                if (success) {
                    this.showToast('Giocatore aggiunto con successo');
                }
            }
        } else {
            // Fallback to LocalStorage
            if (this.currentEditId) {
                const index = this.players.findIndex(p => p.id === this.currentEditId);
                if (index !== -1) {
                    this.players[index] = {
                        ...this.players[index],
                        ...playerData
                    };
                    this.showToast('Giocatore aggiornato con successo');
                }
            } else {
                playerData.id = this.generateId();
                playerData.createdAt = new Date().toISOString();
                this.players.push(playerData);
                this.showToast('Giocatore aggiunto con successo');
            }
            this.saveToStorage();
            this.applyFilters();
        }

        this.closeModal();
    },

    editPlayer(id) {
        const player = this.players.find(p => p.id === id);
        if (player) {
            this.openModal(player);
        }
    },

    deletePlayer(id) {
        const player = this.players.find(p => p.id === id);
        if (player) {
            this.openDeleteModal(player);
        }
    },

    async confirmDelete() {
        if (this.currentDeleteId) {
            if (this.dbRef) {
                // Delete from Firebase
                const success = await this.deleteFromFirebase(this.currentDeleteId);
                if (success) {
                    this.showToast('Giocatore eliminato');
                }
            } else {
                // Fallback to LocalStorage
                this.players = this.players.filter(p => p.id !== this.currentDeleteId);
                this.saveToStorage();
                this.applyFilters();
                this.showToast('Giocatore eliminato');
            }
            this.closeDeleteModal();
        }
    },

    // ========================================
    // FILTERING
    // ========================================
    applyFilters() {
        const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();

        const selectedLevels = Array.from(document.querySelectorAll('input[name="level"]:checked'))
            .map(cb => cb.value);

        const selectedDays = Array.from(document.querySelectorAll('input[name="day"]:checked'))
            .map(cb => cb.value);

        const timeStart = document.getElementById('filterTimeStart').value;
        const timeEnd = document.getElementById('filterTimeEnd').value;

        this.filteredPlayers = this.players.filter(player => {
            // Search filter
            if (searchTerm) {
                const fullName = `${player.cognome} ${player.nome}`.toLowerCase();
                if (!fullName.includes(searchTerm)) {
                    return false;
                }
            }

            // Level filter
            if (selectedLevels.length > 0 && !selectedLevels.includes(player.livello)) {
                return false;
            }

            // Empathy filter
            if (this.filterEmpathy > 0 && player.empatia < this.filterEmpathy) {
                return false;
            }

            // Day filter
            if (selectedDays.length > 0) {
                const playerDays = (player.disponibilita || []).map(d => d.giorno);
                const hasMatchingDay = selectedDays.some(day => playerDays.includes(day));
                if (!hasMatchingDay) {
                    return false;
                }
            }

            // Time range filter
            if (timeStart || timeEnd) {
                const hasMatchingTime = (player.disponibilita || []).some(slot => {
                    if (timeStart && slot.oraInizio < timeStart) return false;
                    if (timeEnd && slot.oraFine > timeEnd) return false;
                    return true;
                });
                if (!hasMatchingTime && (player.disponibilita || []).length > 0) {
                    return false;
                }
            }

            return true;
        });

        this.render();
    },

    resetFilters() {
        document.getElementById('searchInput').value = '';
        document.querySelectorAll('input[name="level"]').forEach(cb => cb.checked = false);
        document.querySelectorAll('input[name="day"]').forEach(cb => cb.checked = false);
        document.getElementById('filterTimeStart').value = '';
        document.getElementById('filterTimeEnd').value = '';
        this.filterEmpathy = 0;
        this.updateFilterStars();
        this.applyFilters();
    },

    // ========================================
    // VIEW CONTROLS
    // ========================================
    setView(view) {
        this.isListView = view === 'list';
        document.getElementById('btnGridView').classList.toggle('active', !this.isListView);
        document.getElementById('btnListView').classList.toggle('active', this.isListView);
        document.getElementById('playersGrid').classList.toggle('list-view', this.isListView);
    },

    toggleFilters() {
        const sidebar = document.getElementById('sidebar');
        sidebar.classList.toggle('open');
    },

    // ========================================
    // RENDERING
    // ========================================
    render() {
        const grid = document.getElementById('playersGrid');
        const emptyState = document.getElementById('emptyState');
        const countEl = document.getElementById('playerCount');

        // Use filtered players or all players
        const playersToShow = this.filteredPlayers.length > 0 ||
            document.getElementById('searchInput').value ||
            document.querySelectorAll('input[name="level"]:checked').length > 0 ||
            document.querySelectorAll('input[name="day"]:checked').length > 0 ||
            this.filterEmpathy > 0 ||
            document.getElementById('filterTimeStart').value ||
            document.getElementById('filterTimeEnd').value
            ? this.filteredPlayers
            : this.players;

        countEl.textContent = `(${playersToShow.length})`;

        if (playersToShow.length === 0) {
            grid.innerHTML = '';
            emptyState.classList.add('visible');
            return;
        }

        emptyState.classList.remove('visible');

        grid.innerHTML = playersToShow.map(player => this.renderPlayerCard(player)).join('');

        // Bind card events
        grid.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', () => this.editPlayer(btn.dataset.id));
        });
        grid.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', () => this.deletePlayer(btn.dataset.id));
        });
    },

    renderPlayerCard(player) {
        const levelInfo = this.levels[player.livello] || { label: player.livello, class: '' };

        // Render empathy stars
        let stars = '';
        for (let i = 1; i <= 5; i++) {
            stars += `<span class="star ${i <= player.empatia ? '' : 'inactive'}">★</span>`;
        }

        // Render availability tags
        let availabilityHtml = '';
        if (player.disponibilita && player.disponibilita.length > 0) {
            availabilityHtml = player.disponibilita.map(slot => `
                <span class="availability-tag">
                    <span class="day-short">${this.getDayShort(slot.giorno)}</span>
                    ${slot.oraInizio}-${slot.oraFine}
                </span>
            `).join('');
        }

        return `
            <div class="player-card" data-id="${player.id}">
                <div class="player-header">
                    <div class="player-info">
                        <h3>${player.cognome} ${player.nome}</h3>
                        <div class="player-phone">
                            📞 <a href="tel:${player.telefono}">${player.telefono}</a>
                        </div>
                    </div>
                    <div class="player-actions">
                        <button class="btn-icon-only btn-edit" data-id="${player.id}" title="Modifica">✏️</button>
                        <button class="btn-icon-only btn-delete delete" data-id="${player.id}" title="Elimina">🗑️</button>
                    </div>
                </div>
                <div class="player-meta">
                    <span class="player-level">
                        <span class="level-badge ${levelInfo.class}">${levelInfo.label}</span>
                    </span>
                    <div class="player-empathy">
                        ${stars}
                    </div>
                </div>
                ${availabilityHtml ? `<div class="availability-preview">${availabilityHtml}</div>` : ''}
            </div>
        `;
    }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => App.init());
