/**
 * Mode Guerre de Territoire (Territory War)
 * Arène quadrillée de dalles/briques à conquérir en les percutant.
 * Intègre des cellules bombes pour des retournements spectaculaires et un score territorial en temps réel.
 */
(function (window) {
    'use strict';

    const TerritoryWarMode = {
        id: 'territoryWar',
        name: 'Guerre de Territoire',
        description: 'Quadrillage territorial style paintball : colorez les dalles, déclenchez des méga-bombes et contrôlez la majorité de l\'arène !',
        victoryCondition: '% de territoire contrôlé ou domination totale',

        state: {
            grid: [],
            cols: 10,
            rows: 16,
            scores: { team1: 0, team2: 0, neutral: 0 },
            pulseTime: 0
        },

        customBallSpawn(world, battle) {
            const arena = world.arena;
            const cx = arena.x + arena.w / 2;
            const cy = arena.y + arena.h / 2;
            const radius = 15;

            // 2 combattants Cyan (Équipe 1) en haut/gauche
            const b1 = battle._createBall(world, cx - arena.w * 0.28, cy - arena.h * 0.25, '#00f2fe', { radius, team: 1, maxHp: 150 });
            const b2 = battle._createBall(world, cx - arena.w * 0.28, cy + arena.h * 0.25, '#38bdf8', { radius, team: 1, maxHp: 150 });

            // 2 combattants Magenta (Équipe 2) en haut/droite
            const b3 = battle._createBall(world, cx + arena.w * 0.28, cy - arena.h * 0.25, '#ff2a85', { radius, team: 2, maxHp: 150 });
            const b4 = battle._createBall(world, cx + arena.w * 0.28, cy + arena.h * 0.25, '#f43f5e', { radius, team: 2, maxHp: 150 });

            world.balls.push(b1, b2, b3, b4);
        },

        init(world, battle) {
            this.state.pulseTime = 0;
            this._generateGrid(world);
            this._updateScores();
        },

        _generateGrid(world) {
            const arena = world.arena;
            const prng = world.prng || { next: () => Math.random() };
            const cols = 10;
            const rows = 16;
            this.state.cols = cols;
            this.state.rows = rows;

            const marginX = arena.w * 0.04;
            const marginY = arena.h * 0.05;
            const cellW = (arena.w - 2 * marginX) / cols;
            const cellH = (arena.h - 2 * marginY) / rows;

            this.state.grid = [];
            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    const x = arena.x + marginX + c * cellW;
                    const y = arena.y + marginY + r * cellH;
                    // Environ 8% de cellules sont des bombes
                    const isBomb = prng.next() < 0.085;

                    this.state.grid.push({
                        c, r,
                        x, y,
                        w: cellW,
                        h: cellH,
                        cx: x + cellW / 2,
                        cy: y + cellH / 2,
                        owner: 0, // 0 = neutre, 1 = Cyan, 2 = Magenta
                        isBomb,
                        hitFlash: 0
                    });
                }
            }
        },

        _updateScores() {
            let t1 = 0, t2 = 0, neu = 0;
            const total = this.state.grid.length || 1;
            for (const cell of this.state.grid) {
                if (cell.owner === 1) t1++;
                else if (cell.owner === 2) t2++;
                else neu++;
            }
            this.state.scores.team1 = Math.round((t1 / total) * 100);
            this.state.scores.team2 = Math.round((t2 / total) * 100);
            this.state.scores.neutral = 100 - this.state.scores.team1 - this.state.scores.team2;
        },

        update(dt, world, battle) {
            this.state.pulseTime += dt;

            // Détection de collision et capture de tuiles par les boules
            for (const ball of world.balls) {
                if (!ball.alive) continue;
                const ballTeam = ball.team === 1 ? 1 : 2;

                for (const cell of this.state.grid) {
                    if (cell.hitFlash > 0) cell.hitFlash = Math.max(0, cell.hitFlash - dt * 3.5);

                    // Test de collision rapide cercle-boîte
                    const closestX = Math.max(cell.x, Math.min(ball.x, cell.x + cell.w));
                    const closestY = Math.max(cell.y, Math.min(ball.y, cell.y + cell.h));
                    const dx = ball.x - closestX;
                    const dy = ball.y - closestY;

                    if (dx * dx + dy * dy < (ball.radius * 0.9) * (ball.radius * 0.9)) {
                        if (cell.owner !== ballTeam) {
                            cell.owner = ballTeam;
                            cell.hitFlash = 1.0;

                            if (cell.isBomb) {
                                // Explosion en chaîne : convertit les tuiles adjacentes
                                this._detonateBomb(cell, ballTeam, world, battle);
                            } else {
                                world.spawnParticle?.(cell.cx, cell.cy, {
                                    color: ballTeam === 1 ? '#00f2fe' : '#ff2a85',
                                    count: 5,
                                    speed: 110,
                                    life: 0.3,
                                    size: 2
                                });
                            }
                        }
                    }
                }
            }

            this._updateScores();
        },

        _detonateBomb(bombCell, team, world, battle) {
            bombCell.isBomb = false; // désamorcée
            const radius = 2; // rayon en cellules
            const color = team === 1 ? '#00f2fe' : '#ff2a85';

            world.addShockwave?.(bombCell.cx, bombCell.cy, { radius: 65, color, life: 0.35 });
            world.spawnParticle?.(bombCell.cx, bombCell.cy, { color, count: 25, speed: 260, life: 0.55, size: 3.2 });
            world.playSound?.('explosion', { pitch: 1.1 });

            for (const cell of this.state.grid) {
                const dc = Math.abs(cell.c - bombCell.c);
                const dr = Math.abs(cell.r - bombCell.r);
                if (dc <= radius && dr <= radius) {
                    cell.owner = team;
                    cell.hitFlash = 0.9;
                }
            }
        },

        renderBackground(ctx, world, battle) {
            // Dessine la grille de territoire sous les combattants
            const pulse = 0.5 + 0.5 * Math.sin(this.state.pulseTime * 3);

            ctx.save();
            for (const cell of this.state.grid) {
                const pad = 1.5;
                const bx = cell.x + pad;
                const by = cell.y + pad;
                const bw = cell.w - pad * 2;
                const bh = cell.h - pad * 2;

                if (cell.owner === 1) {
                    // Équipe Cyan
                    ctx.fillStyle = cell.hitFlash > 0
                        ? `rgba(0, 242, 254, ${0.4 + cell.hitFlash * 0.5})`
                        : 'rgba(0, 242, 254, 0.28)';
                } else if (cell.owner === 2) {
                    // Équipe Magenta
                    ctx.fillStyle = cell.hitFlash > 0
                        ? `rgba(255, 42, 133, ${0.4 + cell.hitFlash * 0.5})`
                        : 'rgba(255, 42, 133, 0.28)';
                } else {
                    // Neutre
                    ctx.fillStyle = 'rgba(24, 24, 32, 0.45)';
                }

                ctx.fillRect(bx, by, bw, bh);

                // Bordures des briques
                ctx.strokeStyle = cell.owner === 1 ? 'rgba(0, 242, 254, 0.5)' : cell.owner === 2 ? 'rgba(255, 42, 133, 0.5)' : 'rgba(255, 255, 255, 0.05)';
                ctx.lineWidth = 1;
                ctx.strokeRect(bx, by, bw, bh);

                // Rendu des méga-bombes
                if (cell.isBomb) {
                    ctx.save();
                    ctx.fillStyle = pulse > 0.5 ? '#facc15' : '#ef4444';
                    ctx.shadowColor = '#facc15';
                    ctx.shadowBlur = 12;
                    ctx.beginPath();
                    ctx.arc(cell.cx, cell.cy, Math.min(bw, bh) * 0.24, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                }
            }
            ctx.restore();
        },

        render(ctx, world, battle) {
            // Rendu de la jauge territoriale en haut de l'arène
            const arena = world.arena;
            const barW = arena.w * 0.72;
            const barH = 14;
            const barX = arena.x + (arena.w - barW) / 2;
            const barY = arena.y + 12;

            ctx.save();
            // Fond de la barre
            ctx.fillStyle = 'rgba(10, 10, 15, 0.85)';
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.roundRect(barX, barY, barW, barH, 7);
            ctx.fill();
            ctx.stroke();

            // Segment Cyan (Gauche)
            const p1 = this.state.scores.team1 / 100;
            const w1 = barW * p1;
            if (w1 > 0) {
                ctx.fillStyle = '#00f2fe';
                ctx.shadowColor = '#00f2fe';
                ctx.shadowBlur = 10;
                ctx.beginPath();
                ctx.roundRect(barX, barY, w1, barH, 7);
                ctx.fill();
            }

            // Segment Magenta (Droite)
            const p2 = this.state.scores.team2 / 100;
            const w2 = barW * p2;
            if (w2 > 0) {
                ctx.fillStyle = '#ff2a85';
                ctx.shadowColor = '#ff2a85';
                ctx.shadowBlur = 10;
                ctx.beginPath();
                ctx.roundRect(barX + barW - w2, barY, w2, barH, 7);
                ctx.fill();
            }

            // Labels textuels des %
            ctx.shadowBlur = 0;
            ctx.font = '900 11px Outfit, sans-serif';
            ctx.textAlign = 'left';
            ctx.fillStyle = '#00f2fe';
            ctx.fillText(`${this.state.scores.team1}%`, barX - 32, barY + 11);

            ctx.textAlign = 'right';
            ctx.fillStyle = '#ff2a85';
            ctx.fillText(`${this.state.scores.team2}%`, barX + barW + 32, barY + 11);

            ctx.restore();
        },

        checkVictory(world, battle) {
            // Domination écrasante (>= 75% du territoire total)
            if (this.state.scores.team1 >= 75) {
                const team1Balls = world.balls.filter(b => b.team === 1 && b.alive);
                return {
                    finished: true,
                    winner: team1Balls[0] || world.balls[0],
                    reason: 'Domination Territoriale — Équipe Cyan (75%+)'
                };
            }
            if (this.state.scores.team2 >= 75) {
                const team2Balls = world.balls.filter(b => b.team === 2 && b.alive);
                return {
                    finished: true,
                    winner: team2Balls[0] || world.balls[2] || world.balls[0],
                    reason: 'Domination Territoriale — Équipe Magenta (75%+)'
                };
            }

            // Si toutes les boules d'une équipe sont éliminées
            const team1Alive = world.balls.filter(b => b.team === 1 && b.alive).length;
            const team2Alive = world.balls.filter(b => b.team === 2 && b.alive).length;
            if (team1Alive === 0 && team2Alive > 0) {
                const winner = world.balls.find(b => b.team === 2 && b.alive);
                return { finished: true, winner, reason: 'Élimination totale de l\'équipe adverse' };
            }
            if (team2Alive === 0 && team1Alive > 0) {
                const winner = world.balls.find(b => b.team === 1 && b.alive);
                return { finished: true, winner, reason: 'Élimination totale de l\'équipe adverse' };
            }

            return null;
        },

        onTimeout(world, battle) {
            const s1 = this.state.scores.team1;
            const s2 = this.state.scores.team2;
            if (s1 > s2) {
                const winner = world.balls.find(b => b.team === 1 && b.alive) || world.balls[0];
                return { finished: true, winner, reason: `Victoire au Territoire : Cyan (${s1}% vs ${s2}%)` };
            } else if (s2 > s1) {
                const winner = world.balls.find(b => b.team === 2 && b.alive) || world.balls[1] || world.balls[0];
                return { finished: true, winner, reason: `Victoire au Territoire : Magenta (${s2}% vs ${s1}%)` };
            } else {
                return { finished: true, winner: null, reason: `Égalité parfaite : ${s1}% partout` };
            }
        }
    };

    if (window.GameModes) {
        window.GameModes.register(TerritoryWarMode);
    }

    window.TerritoryWarMode = TerritoryWarMode;

})(typeof window !== 'undefined' ? window : this);
