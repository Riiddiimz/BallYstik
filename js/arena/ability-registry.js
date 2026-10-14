/**
 * ABILITY REGISTRY — Méta de toutes les capacités.
 */
(function () {
    'use strict';

    const REGISTRY = {
        // ──────────── OFFENSIVE ────────────
        pikes: {
            id: 'pikes', name: 'Picosphère',
            desc: '4 piques orbitent autour de vous. Dégâts au contact.',
            category: 'offensive', rarity: 'common',
            color: '#ff8a3d', glow: '#ffd166', icon: '⚔',
            duration: 8, weight: 10, maxStacks: 1
        },
        arrow: {
            id: 'arrow', name: 'Flèche',
            desc: 'Tire automatiquement vers l\'ennemi le plus proche. Rebondit 1 fois.',
            category: 'offensive', rarity: 'common',
            color: '#00f2fe', glow: '#7ff7ff', icon: '➤',
            duration: 10, weight: 10, maxStacks: 1
        },
        mine: {
            id: 'mine', name: 'Mine',
            desc: 'Dépose une mine qui explose au contact.',
            category: 'offensive', rarity: 'common',
            color: '#ff4d4d', glow: '#ff8080', icon: '◉',
            duration: 10, weight: 8, maxStacks: 1
        },
        laser: {
            id: 'laser', name: 'Laser',
            desc: 'Après charge, émet un rayon continu qui suit l\'ennemi.',
            category: 'offensive', rarity: 'rare',
            color: '#ff2a85', glow: '#ffb0d0', icon: '≡',
            duration: 6, weight: 5, maxStacks: 1
        },
        chain: {
            id: 'chain', name: 'Éclair en chaîne',
            desc: 'Foudroie plusieurs ennemis proches automatiquement.',
            category: 'offensive', rarity: 'rare',
            color: '#a855f7', glow: '#d8b4fe', icon: '⚡',
            duration: 10, weight: 5, maxStacks: 1
        },
        firetrail: {
            id: 'firetrail', name: 'Traînée de feu',
            desc: 'Laisse une zone enflammée derrière vous.',
            category: 'offensive', rarity: 'common',
            color: '#ff6b35', glow: '#ffb347', icon: '🔥',
            duration: 10, weight: 8, maxStacks: 1
        },
        clone: {
            id: 'clone', name: 'Scintille',
            desc: 'Crée un clone temporaire qui combat à vos côtés.',
            category: 'offensive', rarity: 'epic',
            color: '#22d3ee', glow: '#a5f3fc', icon: '✦',
            duration: 5, weight: 3, maxStacks: 1
        },

        blade: {
            id: 'blade', name: 'Lame orbitale',
            desc: 'Une épée tenue par la boule frappe les adversaires qui s’approchent, avec un coup visible et un recul.',
            category: 'offensive', rarity: 'rare',
            color: '#dbeafe', glow: '#93c5fd', icon: '⚔',
            duration: -1, weight: 0, maxStacks: 1
        },

        plasmaCannon: {
            id: 'plasmaCannon', name: 'Canon à plasma',
            desc: 'Monte un canon sur la boule. Charge une cible puis tire un obus qui explose et blesse les ennemis proches.',
            category: 'offensive', rarity: 'epic',
            color: '#fb923c', glow: '#fed7aa', icon: '✹',
            duration: 12, weight: 5, maxStacks: 1
        },

        teslaCoil: {
            id: 'teslaCoil', name: 'Bobine Tesla',
            desc: 'Une bobine montée sur la boule charge puis foudroie une cible, avec un arc secondaire vers un ennemi voisin.',
            category: 'offensive', rarity: 'rare',
            color: '#67e8f9', glow: '#cffafe', icon: 'ϟ',
            duration: 12, weight: 4, maxStacks: 1
        },

        // ──────────── DEFENSIVE ────────────
        shield: {
            id: 'shield', name: 'Bouclier',
            desc: 'Absorbe 40 dégâts. Régénère après 3s sans coup.',
            category: 'defensive', rarity: 'common',
            color: '#60a5fa', glow: '#93c5fd', icon: '◈',
            duration: 12, weight: 10, maxStacks: 1
        },
        thorns: {
            id: 'thorns', name: 'Épines',
            desc: 'Renvoie 40% des dégâts subis.',
            category: 'defensive', rarity: 'common',
            color: '#ef4444', glow: '#fca5a5', icon: '✱',
            duration: 10, weight: 8, maxStacks: 1
        },
        regen: {
            id: 'regen', name: 'Régénération',
            desc: 'Récupère 4 HP/s en continu.',
            category: 'defensive', rarity: 'common',
            color: '#34d399', glow: '#a7f3d0', icon: '✚',
            duration: 10, weight: 8, maxStacks: 2
        },
        teleport: {
            id: 'teleport', name: 'Téléportation',
            desc: 'Se téléporte périodiquement dans sa direction.',
            category: 'defensive', rarity: 'rare',
            color: '#c084fc', glow: '#e9d5ff', icon: '◇',
            duration: 12, weight: 5, maxStacks: 1
        },

        // ──────────── UTILITY ────────────
        dash: {
            id: 'dash', name: 'Charge',
            desc: 'Dash périodique à vitesse x3. Dégâts de contact augmentés.',
            category: 'utility', rarity: 'common',
            color: '#fbbf24', glow: '#fde68a', icon: '»',
            duration: 12, weight: 8, maxStacks: 1
        },
        magnet: {
            id: 'magnet', name: 'Aimant',
            desc: 'Attire les balles et orbes à proximité.',
            category: 'utility', rarity: 'common',
            color: '#f472b6', glow: '#fbcfe8', icon: '⌂',
            duration: 10, weight: 6, maxStacks: 1
        },
        blackhole: {
            id: 'blackhole', name: 'Trou noir',
            desc: 'Crée une singularité qui aspire tout. Usage unique.',
            category: 'utility', rarity: 'epic',
            color: '#1e1b4b', glow: '#a78bfa', icon: '◯',
            duration: 0, weight: 2, maxStacks: 1
        },
        deathbomb: {
            id: 'deathbomb', name: 'Bombe posthume',
            desc: 'Explose violemment à la mort. Vengeance garantie.',
            category: 'utility', rarity: 'rare',
            color: '#dc2626', glow: '#fca5a5', icon: '☢',
            duration: -1, weight: 4, maxStacks: 1
        }
    };

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
            const list = Object.values(REGISTRY).filter(a => (!window.AbilitySettings || (window.AbilitySettings.isEnabled(a.id) && window.AbilitySettings.getWeight(a.id, a.weight) > 0)) && (!filterFn || filterFn(a)));
            if (!list.length) return null;
            const total = list.reduce((s, a) => s + (window.AbilitySettings ? window.AbilitySettings.getWeight(a.id, a.weight) : (a.weight || 1)), 0);
            let r = (prng && prng.next ? prng.next() : Math.random()) * total;
            for (const a of list) {
                r -= (window.AbilitySettings ? window.AbilitySettings.getWeight(a.id, a.weight) : (a.weight || 1));
                if (r <= 0) return a;
            }
            return list[list.length - 1];
        },

        getRarityGlow(rarity) {
            return RARITY_GLOW[rarity] || null;
        }
    };
})();