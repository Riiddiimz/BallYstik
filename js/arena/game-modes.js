/**
 * Game Modes Registry & Architecture for BallYstik
 * Provides a modular interface for custom battle rules (Last Standing, Duel à Distance, Guerre de Territoire, etc.)
 */
(function (window) {
    'use strict';

    class GameModeRegistry {
        constructor() {
            this._modes = new Map();
            this._activeModeId = 'lastStanding';
        }

        /**
         * Enregistre un mode de jeu
         * @param {Object} mode - Doit posséder id, name, description, victoryCondition et les méthodes du cycle de vie
         */
        register(mode) {
            if (!mode || !mode.id) {
                console.error('[GameModes] Tentative d\'enregistrement d\'un mode invalide', mode);
                return;
            }
            this._modes.set(mode.id, mode);
        }

        get(id) {
            return this._modes.get(id) || null;
        }

        getAll() {
            return Array.from(this._modes.values());
        }

        setActiveMode(id) {
            if (this._modes.has(id)) {
                this._activeModeId = id;
            } else {
                console.warn(`[GameModes] Mode "${id}" inconnu, repli sur "lastStanding"`);
                this._activeModeId = 'lastStanding';
            }
        }

        getActiveMode() {
            return this._modes.get(this._activeModeId) || this._modes.get('lastStanding');
        }
    }

    window.GameModes = new GameModeRegistry();

})(typeof window !== 'undefined' ? window : this);
