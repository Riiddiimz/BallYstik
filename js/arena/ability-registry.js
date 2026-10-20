/**
 * ABILITY REGISTRY — uniquement les 14 pouvoirs de powers_final.html.
 */
(function () {
    'use strict';

    const REGISTRY = {
        // ──────────── OFFENSIVE ────────────
        // Seuls les pouvoirs validés dans idees/powers_final.html sont enregistrés.
        judgment_ray: { id: 'judgment_ray', name: 'Rayon du Jugement', desc: 'Ligne laser instantanée qui traverse une cible.', category: 'offensive', rarity: 'epic', color: '#67e8f9', glow: '#67e8f9', icon: '⚡', duration: 8, weight: 4, maxStacks: 1 },
        star_hunter: { id: 'star_hunter', name: 'Chasseur Stellaire', desc: 'Missile guidé qui poursuit sa cible.', category: 'offensive', rarity: 'epic', color: '#fb923c', glow: '#fb923c', icon: '➤', duration: 8, weight: 4, maxStacks: 1 },
        bomb_shrapnel: { id: 'bomb_shrapnel', name: 'Bombe à fragmentation', desc: 'Bombe qui explose en fragments radiaux.', category: 'offensive', rarity: 'epic', color: '#22d3ee', glow: '#22d3ee', icon: '✦', duration: 8, weight: 4, maxStacks: 1 },
        seismic_nova: { id: 'seismic_nova', name: 'Nova Sismique', desc: 'Onde circulaire qui repousse les adversaires.', category: 'offensive', rarity: 'epic', color: '#ef4444', glow: '#ef4444', icon: '◎', duration: 8, weight: 4, maxStacks: 1 },
        magma_rift: { id: 'magma_rift', name: 'Faille Magmatique', desc: 'Zone brûlante persistante autour de la cible.', category: 'offensive', rarity: 'epic', color: '#fb923c', glow: '#fb923c', icon: '🔥', duration: 8, weight: 4, maxStacks: 1 },
        colossus: { id: 'colossus', name: 'Surcharge Giga', desc: 'Augmente temporairement la taille et la puissance.', category: 'offensive', rarity: 'epic', color: '#fbbf24', glow: '#fbbf24', icon: '⬢', duration: 8, weight: 4, maxStacks: 1 },
        chain_lightning: { id: 'chain_lightning', name: 'Éclair en chaîne', desc: 'La foudre rebondit d’une cible à l’autre.', category: 'offensive', rarity: 'epic', color: '#a5f3fc', glow: '#a5f3fc', icon: 'ϟ', duration: 8, weight: 4, maxStacks: 1 },
        explosive_flower: { id: 'explosive_flower', name: 'Fleur Explosive', desc: 'Une floraison d’énergie frappe autour de la boule.', category: 'offensive', rarity: 'epic', color: '#ec4899', glow: '#ec4899', icon: '✿', duration: 8, weight: 4, maxStacks: 1 },
        crystal_prison: { id: 'crystal_prison', name: 'Prison de Cristal', desc: 'Immobilise brièvement les adversaires proches.', category: 'defensive', rarity: 'epic', color: '#7dd3fc', glow: '#7dd3fc', icon: '❄', duration: 8, weight: 4, maxStacks: 1 },
        imprisonment_seal: { id: 'imprisonment_seal', name: 'Sceau d’Emprisonnement', desc: 'Marque et frappe une cible proche.', category: 'defensive', rarity: 'epic', color: '#c084fc', glow: '#c084fc', icon: '⌘', duration: 8, weight: 4, maxStacks: 1 },
        singularity: { id: 'singularity', name: 'Singularité Violette', desc: 'Attire les adversaires puis déclenche une implosion.', category: 'utility', rarity: 'epic', color: '#a855f7', glow: '#a855f7', icon: '◯', duration: 8, weight: 4, maxStacks: 1 },
        prism_reflector: { id: 'prism_reflector', name: 'Prisme Réflecteur', desc: 'Réduit les dégâts reçus et renvoie une partie.', category: 'defensive', rarity: 'epic', color: '#93c5fd', glow: '#93c5fd', icon: '◇', duration: 8, weight: 4, maxStacks: 1 },
        quantum_jump: { id: 'quantum_jump', name: 'Saut Quantique', desc: 'Téléportation courte avec effet d’anneaux.', category: 'utility', rarity: 'epic', color: '#22d3ee', glow: '#22d3ee', icon: '◈', duration: 8, weight: 4, maxStacks: 1 },
        multiplication: { id: 'multiplication', name: 'Division Cellulaire', desc: 'Crée un effet de duplication et une onde offensive.', category: 'utility', rarity: 'epic', color: '#ff2a85', glow: '#ff2a85', icon: '✧', duration: 8, weight: 4, maxStacks: 1 }
    };

    // Seuls les 14 nouveaux pouvoirs existent dans le registre et le tirage.
    const NEW_POWER_IDS = new Set([
        'judgment_ray', 'star_hunter', 'bomb_shrapnel', 'seismic_nova',
        'magma_rift', 'singularity', 'quantum_jump', 'colossus',
        'prism_reflector', 'multiplication', 'chain_lightning',
        'crystal_prison', 'explosive_flower', 'imprisonment_seal'
    ]);

    const RARITY_GLOW = {
        common: null,
        rare: 'rgba(0, 242, 254, 0.7)',
        epic: 'rgba(255, 42, 133, 0.85)'
    };

    window.AbilityRegistry = {
        all: REGISTRY,

        get(id) {
            return REGISTRY[id] || null;
        },

        pickRandom(prng, filterFn) {
            const list = Object.values(REGISTRY).filter(a => NEW_POWER_IDS.has(a.id) && (!window.AbilitySettings || (window.AbilitySettings.isEnabled(a.id) && window.AbilitySettings.getWeight(a.id, a.weight) > 0)) && (!filterFn || filterFn(a)));
            if (!list.length) return null;
            const total = list.reduce((s, a) => s + (window.AbilitySettings ? window.AbilitySettings.getWeight(a.id, a.weight) : (a.weight || 1)), 0);
            let r = (prng && prng.next ? prng.next() : Math.random()) * total;
            for (const a of list) {
                r -= (window.AbilitySettings ? window.AbilitySettings.getWeight(a.id, a.weight) : (a.weight || 1));
                if (r <= 0) return a;
            }
            return list[list.length - 1];
        },

        isNewPower(id) { return NEW_POWER_IDS.has(id); },

        getRarityGlow(rarity) {
            return RARITY_GLOW[rarity] || null;
        }
    };
})();