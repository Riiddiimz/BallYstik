/* BallYstik v2-power — 10 pouvoirs à signatures visuelles uniques. */
(function () {
'use strict';
const groups = {
  distance: { name: 'Projectiles & rayon', color: '#7ce7ff' },
  impact: { name: 'Impact', color: '#fb4d5d' },
  zone: { name: 'Terrain', color: '#ff6b35' },
  control: { name: 'Contrôle', color: '#a855f7' },
  mobility: { name: 'Mobilité', color: '#38bdf8' },
  transform: { name: 'Transformation', color: '#fbbf24' },
  defense: { name: 'Défense / Parade', color: '#93c5fd' },
  summon: { name: 'Invocation', color: '#22d3ee' }
};
const list = [
['judgment_ray','Rayon du Jugement','distance','Une ligne de visée pointillée annonce un rayon qui traverse instantanément l’arène.','Charge 0,6 s · rayon perforant · touche les cibles alignées.','#7ce7ff','╱',12,8],
['star_hunter','Chasseur Stellaire','distance','Un missile orange courbe sa trajectoire pour poursuivre une cible.','Missile guidé · 20 dégâts · explosion légère à l’impact.','#fb923c','➤',12,8],
['bomb_shrapnel','Bombe à fragmentation','distance','Une bombe lumineuse vole puis explose au contact en une gerbe radiale.','Projectile explosif · dégâts de zone à l’impact.','#38bdf8','✹',12,8],
['seismic_nova','Nova Sismique','impact','Un anneau rouge part de la boule et repousse les adversaires sur son passage.','Onde de choc expansive · repousse les ennemis proches.','#fb4d5d','◎',12,8],
['magma_rift','Faille Magmatique','zone','La boule laisse une fissure de lave persistante qui brûle les adversaires qui la traversent.','Traînée au sol · brûlure pendant quelques secondes.','#ff6b35','♨',12,8],
['singularity','Singularité Violette','control','Un trou noir visible aspire les boules vers son centre puis implose.','Attraction forte · implosion finale.','#a855f7','◉',12,8],
['quantum_jump','Saut Quantique','mobility','La boule disparaît dans un flash puis réapparaît plus loin avec une silhouette fantôme.','Téléportation instantanée · repositionnement derrière la cible.','#38bdf8','✧',12,7],
['colossus','Surcharge Giga','transform','La boule grossit brutalement, devient plus lente et repousse plus violemment les adversaires.','Transformation temporaire · taille accrue · résistance renforcée.','#fbbf24','⬡',12,7],
['prism_reflector','Prisme Réflecteur','defense','Un prisme hexagonal bloque une attaque et renvoie un trait lumineux vers l’attaquant.','Parade courte · bloque le coup et blesse l’attaquant.','#93c5fd','⬡',12,8],
['multiplication','Division Cellulaire','summon','Une boule se divise en deux clones pour former trois boules visuellement identiques.','Deux leurres temporaires · disparaissent après quelques secondes ou à la mort du porteur.','#22d3ee','✧',12,7]
];
const REGISTRY = {};
for (const row of list) {
  const [id,name,category,desc,details,color,icon,duration,weight] = row;
  REGISTRY[id] = { id, name, category, desc, details, rarity: weight >= 8 ? 'rare' : 'epic', color, glow: color, icon, duration, weight, maxStacks: 1 };
}
window.AbilityCategories = groups;
window.AbilityRegistry = {
  all: REGISTRY,
  get(id) { return REGISTRY[id] || null; },
  pickRandom(prng, filterFn) {
    const list = Object.values(REGISTRY).filter(a =>
      (!window.AbilitySettings || (window.AbilitySettings.isEnabled(a.id) && window.AbilitySettings.getWeight(a.id, a.weight) > 0)) &&
      (!filterFn || filterFn(a))
    );
    if (!list.length) return null;
    const total = list.reduce((s,a) => s + (window.AbilitySettings ? window.AbilitySettings.getWeight(a.id,a.weight) : a.weight), 0);
    let r = (prng && prng.next ? prng.next() : Math.random()) * total;
    for (const a of list) { r -= (window.AbilitySettings ? window.AbilitySettings.getWeight(a.id,a.weight) : a.weight); if (r <= 0) return a; }
    return list[list.length - 1];
  },
  getRarityGlow(rarity) { return rarity === 'epic' ? 'rgba(192,132,252,.8)' : 'rgba(124,231,255,.7)'; }
};
})();
