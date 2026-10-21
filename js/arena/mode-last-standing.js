/**
 * Mode Last Standing (Battle Royale FFA)
 * Mode classique de BallYstik : la dernière boule en vie remporte la victoire.
 */
(function (window) {
    'use strict';

    const LastStandingMode = {
        id: 'lastStanding',
        name: 'Battle Royale (Last Standing)',
        description: 'Chacun pour soi. Les boules s\'affrontent avec leurs armes et capacités jusqu\'à ce qu\'il n\'en reste qu\'une.',
        victoryCondition: 'Dernière boule en vie',

        init(world, battle) {
            // Configuration standard FFA
            // Le spawn par défaut est géré par battle._spawnBalls
        },

        update(dt, world, battle) {
            // Pas de mécanique externe propre en dehors du combat standard
        },

        render(ctx, world, battle) {
            // Rendu additionnel si nécessaire
        },

        checkVictory(world, battle) {
            const living = world.balls.filter(b => b.alive && !b.isClone);
            if (living.length === 1) {
                // S'il reste du slowmo à afficher avant la clôture
                const finalSlowMoRemaining = (window.ArenaBattleBridge?.deathSlowMoUntil || 0) - performance.now();
                if (finalSlowMoRemaining > 0) return null;

                return {
                    finished: true,
                    winner: living[0],
                    reason: 'Dernière survivante'
                };
            }
            if (living.length === 0 && world.balls.length > 0) {
                return {
                    finished: true,
                    winner: null,
                    reason: 'Égalité — Toutes les boules sont tombées'
                };
            }
            return null;
        },

        onTimeout(world, battle) {
            const contenders = world.balls
                .filter(b => !b.isClone)
                .sort((a, b) => {
                    const aliveA = a.alive ? 1 : 0;
                    const aliveB = b.alive ? 1 : 0;
                    if (aliveB !== aliveA) return aliveB - aliveA;
                    const hpA = a.health ? Number(a.health.current) || 0 : 0;
                    const hpB = b.health ? Number(b.health.current) || 0 : 0;
                    if (hpB !== hpA) return hpB - hpA;
                    return (a.id || 0) - (b.id || 0);
                });
            return {
                finished: true,
                winner: contenders[0] || null,
                reason: 'Temps écoulé — Plus de PV'
            };
        }
    };

    if (window.GameModes) {
        window.GameModes.register(LastStandingMode);
    }

    window.LastStandingMode = LastStandingMode;

})(typeof window !== 'undefined' ? window : this);
