/* BallYstik v2-power — registre des 24 pouvoirs. */
(function () {
'use strict';
const groups = {
  distance: { name: 'À distance', color: '#7ce7ff' },
  impact: { name: 'Impact', color: '#ff8a3d' },
  zone: { name: 'Zone', color: '#84cc16' },
  control: { name: 'Contrôle', color: '#c084fc' },
  mobility: { name: 'Mobilité', color: '#fbbf24' },
  summon: { name: 'Invocation', color: '#22d3ee' },
  transform: { name: 'Transformation', color: '#fb7185' },
  defense: { name: 'Défense / Réactif', color: '#34d399' }
};
const list = [
['judgment_ray','Rayon du Jugement','distance','Verrouille une cible pendant 0,6 s puis tire un rayon perforant.','0.6s de charge, 18 dégâts, portée 720 px.','#7ce7ff','✦',12,7],
['star_hunter','Chasseur Stellaire','distance','Missile à tête chercheuse avec petite explosion à l’impact.','Traque 2 s, 20 dégâts et explosion de 90 px.','#fb923c','➤',12,7],
['ghost_billiard','Billard Fantôme','distance','Tire trois projectiles violets qui rebondissent sur les murs.','3 tirs, 3 rebonds chacun, 9 dégâts.','#c084fc','⋰',12,6],
['seismic_nova','Nova Sismique','impact','Onde de choc circulaire qui repousse les adversaires.','Rayon 175 px, 9 dégâts, forte poussée.','#fb4d5d','✹',12,8],
['titan_ram','Bélier Titan','impact','Grossit brièvement puis fonce sur la cible la plus proche.','Charge de 0,65 s, impact puissant, vitesse temporaire.','#fbbf24','➤',12,7],
['zero_detonator','Détonateur Zéro','impact','Charge un point blanc puis déclenche une explosion.','Télégraphe 0,8 s, rayon 170 px, 16 dégâts.','#dbeafe','◎',12,6],
['magma_rift','Faille Magmatique','zone','Dépose des fissures brûlantes qui blessent au passage.','Fissures actives 3 s, dégâts périodiques.','#ff6b35','♨',12,7],
['ice_prison','Prison de Givre','zone','Annonce une zone glacée qui ralentit les boules prises dedans.','Rayon 110 px, ralentissement 1,5 s.','#7ce7ff','❄',12,7],
['toxic_mist','Brouillard Toxique','zone','Laisse un nuage vert persistant qui empoisonne les adversaires.','Nuages de 3 s, dégâts si l’on reste dedans.','#84cc16','☣',12,6],
['singularity','Singularité','control','Crée un mini trou noir qui attire les boules voisines.','Zone de 2 s, aspiration forte, dégâts faibles.','#a855f7','◉',12,7],
['polarity_flip','Polarité Inversée','control','Relie la cible par un arc magnétique et la déporte vers le lanceur.','Marquage 1 s, traction latérale.','#f472b6','ϟ',12,6],
['time_distortion','Distorsion Temporelle','control','Anneau doré qui ralentit les adversaires pris à l’intérieur.','Rayon 180 px, vitesse à 40 % pendant 1,5 s.','#fbbf24','◷',12,7],
['lightning_ghost','Fantôme Éclair','mobility','Dash éclair avec trois rémanences et une brève phase intangible.','Dash court, esquive les dégâts au départ.','#67e8f9','»',12,7],
['mirror_portal','Portail Miroir','mobility','Deux portails s’ouvrent puis la boule ressort plus loin.','Téléportation d’environ 190 px, effet visible 1 s.','#c084fc','◇',12,5],
['crazy_orbit','Orbite Folle','mobility','Entre dans une rotation rapide qui rend sa trajectoire difficile à lire.','1,2 s d’orbite, dégâts reçus réduits.','#fbbf24','⟳',12,6],
['multiplication','Multiplication','summon','Crée deux doubles leurres qui imitent la direction du lanceur.','Leurres 3 s, disparaissent après un impact.','#22d3ee','✧',12,5],
['sentinel_turret','Tourelle Sentinelle','summon','Déploie une tourelle fixe qui tire sur les adversaires proches.','4 s, tir toutes les 0,8 s, faible dégâts.','#67e8f9','⊙',12,6],
['voracious_swarm','Essaim Vorace','summon','Six drones tournent autour de la boule puis piquent les ennemis.','6 drones, dégâts légers et poursuite courte.','#a3e635','⁙',12,6],
['colossus','Colosse','transform','Grossit de 60 %, gagne de la résistance et devient plus lent.','3 s, dégâts reçus réduits, vitesse à 70 %.','#fbbf24','⬡',12,6],
['electric_overload','Surcharge Électrique','transform','Se charge d’électricité et libère des décharges au contact.','2,5 s, décharges en chaîne courte.','#7ce7ff','ϟ',12,7],
['blazing_comet','Comète Ardente','transform','Devient une comète qui laisse une traînée de feu temporaire.','2 s de charge, traînée brûlante de 0,8 s.','#ff6b35','☄',12,7],
['refractive_dome','Dôme Réfractaire','defense','Un dôme hexagonal absorbe la prochaine grosse attaque.','Bloque une grande partie du prochain impact puis se brise.','#60a5fa','⬡',12,7],
['revenge_mirror','Miroir Vengeur','defense','Un miroir argenté renvoie une partie du prochain coup reçu.','Fenêtre de 1,5 s, renvoie les dégâts à l’attaquant.','#e2e8f0','◇',12,5],
['last_breath','Dernier Souffle','defense','À l’élimination, déclenche une explosion de vengeance.','Explosion posthume, rayon 170 px, dégâts et poussée.','#c084fc','✹',-1,4]
];
const REGISTRY = {};
for (const row of list) {
  const [id,name,category,desc,details,color,icon,duration,weight] = row;
  REGISTRY[id] = { id, name, category, desc, details, rarity: weight >= 7 ? 'rare' : 'epic', color, glow: color, icon, duration, weight, maxStacks: 1 };
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