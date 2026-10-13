/**
 * ============================================================================
 * VEKTRALZ // CONFIGURATION DES MODES & VALEURS PAR DÉFAUT
 * ============================================================================
 * Vous pouvez modifier directement ce fichier à la main pour ajuster
 * les valeurs par défaut de chaque mode et de la boule.
 *
 * Chaque paramètre contient en commentaire :
 * - La plage conseillée [Min - Max]
 * - L'unité de mesure
 * - Une brève explication de son impact visuel et physique
 * ============================================================================
 */

window.APP_CONFIG = {
    // Mode actif au chargement de l'application ('classic', 'infinite', 'destruction', etc.)
    defaultMode: 'classic',

    // ========================================================================
    // 1. MODE CLASSIC ESCAPE (Cercles concentriques rotatifs)
    // ========================================================================
    classic: {
        id: 'classic',
        name: 'Classic Escape',

        // --- PHYSIQUE DE LA BOULE ---
        ball: {
            // Rayon de la boule en pixels
            // [Min: 6px | Max: 25px | Défaut: 13px]
            radius: 13,

            // Gravité vers le bas appliquée à chaque frame
            // [Min: 0.00 (apesanteur) | Max: 0.80 (chute très rapide) | Défaut: 0.24]
            gravity: 0.24,

            // Élasticité / Restitution du rebond (1.0 = rebond parfait sans perte d'énergie)
            // [Min: 0.85 (rebond amorti) | Max: 1.15 (rebond survolté) | Défaut: 1.02]
            bounciness: 1.02,

            // Gain de vitesse multiplicatif à chaque impact sur un cercle
            // [Min: 1.00 (+0%) | Max: 1.08 (+8% par rebond) | Défaut: 1.01 (+1%)]
            speedBoost: 1.01,

            // Plafond de vitesse maximale de sécurité (empêche la boule de traverser les murs)
            // [Min: 15 | Max: 60 | Défaut: 32]
            maxSpeed: 32
        },

        // --- PARAMÈTRES DES CERCLES & DU MONDE ---
        world: {
            // Nombre total de cercles concentriques à traverser
            // [Min: 2 | Max: 10 | Défaut: 6]
            ringCount: 6,

            // Vitesse de rotation des cercles
            // [Min: 0.02 (lent) | Max: 0.60 (très rapide) | Défaut: 0.12]
            rotationSpeed: 0.12,

            // Sens de rotation des cercles successifs :
            // Options : 'alternate' (sens alterné) | 'clockwise' (sens horaire) | 'counter' (anti-horaire)
            rotationDirection: 'alternate',

            // Angle initial des brèches : 'random' | 'offset' | 'alternate'
            initialGapMode: 'random',

            // Décalage angulaire entre deux cercles consécutifs en degrés [0–360]
            gapOffset: 0,

            // Taille de l'ouverture / brèche dans les cercles (en proportion de PI)
            // [Min: 0.25 (brèche étroite difficile) | Max: 0.85 (large facile) | Défaut: 0.45 (moyen)]
            gapSizeRatio: 0.45,

            // Palette de couleurs des cercles
            // Options disponibles : 'neon' | 'cyberpunk' | 'ocean' | 'sunset' | 'candy' | 'fire' | 'rainbow'
            palette: 'neon',

            // Mode multi-couleur (true = chaque anneau a une couleur distincte, false = couleur unie)
            multiColor: true,

            // Activer ou désactiver les pics d'obstacles (Spikes)
            spikesEnabled: false,

            // Nombre de pics répartis le long de chaque anneau
            // [Min: 3 | Max: 20 | Défaut: 8]
            spikeCount: 8,

            // Longueur des pics vers l'intérieur en pixels
            // [Min: 8px | Max: 28px | Défaut: 16px]
            spikeLength: 16,

            // Largeur angulaire de la base des pics
            // [Min: 0.05 | Max: 0.25 | Défaut: 0.12]
            spikeWidth: 0.12
        }
    },

    // ========================================================================
    // 2. MODE INFINITE LOOP (Duplication exponentielle de balles)
    // ========================================================================
    infinite: {
        id: 'infinite',
        name: 'Infinite Loop',
        ball: {
            // Boule plus petite pour gérer des centaines de balles à l'écran
            // [Min: 4px | Max: 16px | Défaut: 8px]
            radius: 8,
            // Gravité allégée
            gravity: 0.18,
            // Rebond neutre
            bounciness: 1.00,
            speedBoost: 1.00,
            maxSpeed: 26
        },
        world: {
            // Nombre de nouvelles balles créées à chaque collision contre le mur
            // [Min: 1 | Max: 4 | Défaut: 1]
            spawnPerBounce: 1,

            // Nombre maximum de balles autorisées simultanément (protection de performance)
            // [Min: 50 | Max: 400 | Défaut: 150]
            maxBalls: 150
        }
    },

    // ========================================================================
    // 3. MODE DESTRUCTION (Murs segmentés destructibles)
    // ========================================================================
    destruction: {
        id: 'destruction',
        name: 'Destruction Rings',
        ball: {
            // Balle plus massive et percutante pour casser les briques
            // [Min: 10px | Max: 25px | Défaut: 15px]
            radius: 15,
            gravity: 0.28,
            bounciness: 1.04,
            speedBoost: 1.02,
            maxSpeed: 35
        },
        world: {
            ringCount: 5,
            // Nombre d'impacts nécessaires pour détruire un segment
            // [Min: 1 | Max: 5 | Défaut: 1]
            hitsToBreak: 1,
            // Quantité de débris projetés à chaque brisure
            // [Min: 3 | Max: 20 | Défaut: 8]
            debrisAmount: 8
        }
    },

    // ========================================================================
    // 4. MODE ACCUMULATION (Pics collants et explosion finale)
    // ========================================================================
    accumulation: {
        id: 'accumulation',
        name: 'Spike Trap',
        ball: {
            radius: 12,
            gravity: 0.22,
            bounciness: 1.01,
            speedBoost: 1.00,
            maxSpeed: 30
        },
        world: {
            spikeCount: 16,
            // Nombre de balles collées requises pour déclencher l'explosion finale
            // [Min: 5 | Max: 30 | Défaut: 12]
            stickThreshold: 12
        }
    },

    // ========================================================================
    // 5. AUDIO & SYNTHÉTISEUR (Réglages de base)
    // ========================================================================
    audio: {
        // Instrument initial :
        // Options : 'marimba' | 'synth' | 'piano' | 'bell' | 'chiptune' | 'pluck'
        instrument: 'marimba',

        // Gamme musicale initiale :
        // Options : 'pentatonic' | 'major' | 'minor' | 'synthwave' | 'japanese' | 'celestial'
        scale: 'pentatonic',

        // Volume initial en pourcentage [Min: 0 | Max: 100 | Défaut: 80]
        volume: 80,

        // Sourdine au chargement (false = activable dès le premier clic)
        muted: false
    },

    // ========================================================================
    // 6. EFFETS VISUELS & SEED PAR DÉFAUT
    // ========================================================================
    visuals: {
        enableTrail: true,
        enableParticles: true,
        enableShockwaves: true,
        enableScreenShake: false, // Toujours désactivé par défaut
        portrait916: true         // Format 9:16 portrait activé
    },

    // Seed déterministe par défaut
    initialSeed: 104291
};
