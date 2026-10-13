/* ==========================================================================
   Modes Configuration & Presets
   Définit les valeurs par défaut visuelles et physiques spécifiques à chaque mode.
   D'un mode à l'autre, la boule et la physique adoptent des réglages adaptés.
   ========================================================================== */

const MODES_CONFIG = {
    classic: {
        id: 'classic',
        name: 'Escape',
        badge: 'Actif',
        description: 'La balle rebondit à l\'intérieur d\'anneaux rotatifs et cherche la brèche pour s\'échapper.',
        icon: 'fa-circle-notch',
        color: '#10b981', // Emerald

        // Réglages physiques spécifiques de la boule pour ce mode
        ballPhysics: {
            gravity: 0.24,
            bounciness: 1.02,
            ballRadius: 13,
            speedBoost: 1.01,
            maxSpeed: 32
        },

        // Réglages géométriques du mode
        modeSettings: {
            ringCount: 6,
            rotationMultiplier: 0.12,
            rotationDirection: 'alternate',
            initialGapMode: 'random',
            gapOffset: 0, // 'alternate' | 'clockwise' | 'counter'
            gapSizeRatio: 0.45,
            paletteName: 'neon',
            multiColor: true,
            spikesEnabled: false,
            spikeCount: 8,
            spikeLength: 16,
            spikeWidth: 0.12
        }
    },

    infinite: {
        id: 'infinite',
        name: 'Infinite Loop',
        badge: 'Bientôt',
        description: 'Multiplication exponentielle : chaque collision génère de nouvelles balles.',
        icon: 'fa-infinity',
        color: '#00f2fe', // Cyan

        // Boules plus petites et gravité allégée pour gérer la masse
        ballPhysics: {
            gravity: 0.18,
            bounciness: 1.00,
            ballRadius: 8,
            speedBoost: 1.00,
            maxSpeed: 26
        },

        modeSettings: {
            spawnPerCollision: 1,
            maxBalls: 150,
            overflowRule: 'stop'
        }
    },

    destruction: {
        id: 'destruction',
        name: 'Destruction Rings',
        badge: 'Bientôt',
        description: 'Les parois sont composées de briques fragiles qui éclatent au contact.',
        icon: 'fa-volcano',
        color: '#f59e0b', // Amber

        // Grosse balle puissante avec rebond tonique
        ballPhysics: {
            gravity: 0.28,
            bounciness: 1.04,
            ballRadius: 15,
            speedBoost: 1.02,
            maxSpeed: 35
        },

        modeSettings: {
            ringCount: 5,
            hitsToBreak: 1,
            debrisAmount: 8
        }
    },

    accumulation: {
        id: 'accumulation', name: 'Accumulation', badge: 'Nouveau', description: 'Chaque balle dispose de cinq secondes avant de se figer et devenir un obstacle.', icon: 'fa-layer-group', color: '#f97316',
        ballPhysics: { gravity: 0.24, bounciness: 1.02, ballRadius: 13, speedBoost: 1.01, maxSpeed: 32 },
        modeSettings: {"freezeInterval":5,"gapSizeDeg":42,"gapAngleDeg":30,"ballSpeed":5.4}
    },
    multiply: {
        id: 'multiply', name: 'Multiply', badge: 'Nouveau', description: 'Les contacts entre boules génèrent des balles supplémentaires.', icon: 'fa-clone', color: '#f43f5e',
        ballPhysics: { gravity: 0.18, bounciness: 1, ballRadius: 8, speedBoost: 1, maxSpeed: 26 },
        modeSettings: {"initialBalls":2,"spawnPerBounce":1,"maxBalls":10,"radiusScale":1,"ballSpeed":5}
    },
    battleLines: {
        id: 'battleLines', name: 'Battle Lines', badge: 'Nouveau', description: 'Six boules sans gravité : les lignes disparaissent au contact et les rebords en rendent trois.', icon: 'fa-grip-lines', color: '#a78bfa',
        ballPhysics: { gravity: 0, bounciness: 1, ballRadius: 9, speedBoost: 1, maxSpeed: 22 },
        modeSettings: {"ballCount":6,"startingLines":5,"wallLineGain":3,"battleSpeed":4,"lineSpreadDeg":7}
    },
    lines: {
        id: 'lines', name: 'Lines', badge: 'Nouveau', description: 'Chaque point de rebond est relié au centre pour créer un dessin géométrique.', icon: 'fa-bezier-curve', color: '#22d3ee',
        ballPhysics: { gravity: 0.24, bounciness: 1.02, ballRadius: 12, speedBoost: 1.01, maxSpeed: 32 },
        modeSettings: {}
    },
    paint: {
        id: 'paint', name: 'Paint', badge: 'Nouveau', description: "La balle peint la zone avec une traînée arc-en-ciel et affiche la couverture.", icon: 'fa-palette', color: '#fb7185',
        ballPhysics: { gravity: 0.24, bounciness: 1.02, ballRadius: 12, speedBoost: 1.01, maxSpeed: 32 },
        modeSettings: {}
    },
    target: {
        id: 'target', name: 'Target', badge: 'Nouveau', description: 'Détruis les segments numérotés en les touchant dans la séquence prévue.', icon: 'fa-bullseye', color: '#facc15',
        ballPhysics: { gravity: 0.2, bounciness: 1.02, ballRadius: 12, speedBoost: 1.01, maxSpeed: 32 },
        modeSettings: {"targetCount":12}
    },
    grow: {
        id: 'grow', name: 'Grow', badge: 'Nouveau', description: 'La balle grossit à chaque rebond pour repousser les limites de la zone.', icon: 'fa-expand', color: '#4ade80',
        ballPhysics: { gravity: 0.2, bounciness: 1.02, ballRadius: 10, speedBoost: 1.01, maxSpeed: 28 },
        modeSettings: {"growthPerBounce":0.35}
    },
    shatter: {
        id: 'shatter', name: 'Shatter', badge: 'Nouveau', description: 'Les segments de la paroi se fissurent et se brisent après plusieurs impacts.', icon: 'fa-burst', color: '#f97316',
        ballPhysics: { gravity: 0.2, bounciness: 1.03, ballRadius: 12, speedBoost: 1.01, maxSpeed: 32 },
        modeSettings: {"segmentCount":24,"hitsToBreak":2}
    },
    colorMatch: {
        id: 'colorMatch', name: 'Color Match', badge: 'Nouveau', description: 'La balle change de couleur à chaque rebond et brise les segments de couleur assortie.', icon: 'fa-droplet', color: '#c084fc',
        ballPhysics: { gravity: 0.2, bounciness: 1.02, ballRadius: 12, speedBoost: 1.01, maxSpeed: 32 },
        modeSettings: {"segmentCount":24}
    },
    portal: {
        id: 'portal', name: 'Portal', badge: 'Nouveau', description: 'Les portails jumelés téléportent la balle puis se brisent après trois utilisations.', icon: 'fa-right-left', color: '#38bdf8',
        ballPhysics: { gravity: 0.2, bounciness: 1.02, ballRadius: 12, speedBoost: 1.01, maxSpeed: 32 },
        modeSettings: {"portalUses":3}
    }
};

window.MODES_CONFIG = MODES_CONFIG;
