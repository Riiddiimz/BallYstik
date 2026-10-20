/* BallYstik — panneau clair avec deux catalogues distincts.
 * Les nouveaux pouvoirs conservent leurs noms, couleurs et thèmes validés.
 */
(function () {
  'use strict';

  const groups = [
    { title: 'Attaque & destruction', color: '#fb923c', items: [
      { id:'judgment_ray', name:'Rayon du Jugement', icon:'⚡', color:'#67e8f9', desc:'Ligne laser instantanée qui traverse une cible.' },
      { id:'star_hunter', name:'Chasseur Stellaire', icon:'➤', color:'#fb923c', desc:'Missile guidé qui poursuit sa cible.' },
      { id:'bomb_shrapnel', name:'Bombe à fragmentation', icon:'✦', color:'#22d3ee', desc:'Bombe qui explose en 8 fragments radiaux.' },
      { id:'seismic_nova', name:'Nova Sismique', icon:'◎', color:'#ef4444', desc:'Onde circulaire qui repousse les boules.' },
      { id:'magma_rift', name:'Faille Magmatique', icon:'🔥', color:'#fb923c', desc:'Traînée de lave persistante qui blesse au passage.' },
      { id:'colossus', name:'Surcharge Giga', icon:'⬢', color:'#fbbf24', desc:'Devient géant et gagne un bonus de dégâts.' },
      { id:'chain_lightning', name:'Éclair en chaîne', icon:'ϟ', color:'#a5f3fc', desc:'La foudre rebondit d’une cible à l’autre.' },
      { id:'explosive_flower', name:'Fleur Explosive', icon:'✿', color:'#ec4899', desc:'Une fleur se déploie, ses pétales partent en étoile.' }
    ]},
    { title:'Contrôle & emprisonnement', color:'#7dd3fc', items:[
      { id:'crystal_prison', name:'Prison de Cristal', icon:'❄', color:'#7dd3fc', desc:'Pose un piège qui verrouille la boule qui marche dessus.' },
      { id:'imprisonment_seal', name:'Sceau d’Emprisonnement', icon:'⌘', color:'#c084fc', desc:'Un sceau mystique piège temporairement une cible.' },
      { id:'singularity', name:'Singularité Violette', icon:'◯', color:'#a855f7', desc:'Attire les boules puis implose.' }
    ]},
    { title:'Défense & réflexion', color:'#93c5fd', items:[
      { id:'prism_reflector', name:'Prisme Réflecteur', icon:'◇', color:'#93c5fd', desc:'Bouclier hexagonal qui renvoie les dégâts.' }
    ]},
    { title:'Mobilité & duplication', color:'#22d3ee', items:[
      { id:'quantum_jump', name:'Saut Quantique', icon:'◈', color:'#22d3ee', desc:'Téléportation avec anneaux visibles.' },
      { id:'multiplication', name:'Division Cellulaire', icon:'✧', color:'#ff2a85', desc:'Deux clones translucides se séparent.' }
    ]}
  ];
  const newIds = new Set(groups.flatMap(g => g.items.map(p => p.id)));
  const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));

  function spawnButton(id, color) {
    return '<button type="button" class="power-final-spawn" data-power-spawn="' + esc(id) + '" style="width:100%;padding:7px 8px;border:1px solid ' + esc(color) + '66;border-radius:7px;background:' + esc(color) + '18;color:' + esc(color) + ';font-size:10px;font-weight:900;cursor:pointer">＋ FAIRE APPARAÎTRE</button>';
  }
  function renderNew() {
    return '<div class="power-catalog-list">' + groups.map(group =>
      '<section class="power-catalog-group" aria-label="' + esc(group.title) + '">' +
      '<h3 class="power-theme" style="color:' + group.color + '">' + esc(group.title) + '<span>' + group.items.length + '</span></h3>' +
      group.items.map(power =>
        '<article class="power-final-card" style="--power-color:' + power.color + '">' +
          '<div><div class="pname">' + esc(power.name) + '<span class="new-tag">NOUVEAU</span></div><div class="pdesc">' + esc(power.desc) + '</div></div>' +
          '<div class="picon" aria-hidden="true">' + esc(power.icon) + '</div>' +
          '<div class="power-card-action">' + spawnButton(power.id, power.color) + '</div>' +
        '</article>'
      ).join('') + '</section>'
    ).join('') + '</div>';
  }
  function render() {
    const root = document.getElementById('rightSettingsContainer');
    if (!root) return;
    root.innerHTML =
      '<div class="power-panel-head"><div class="power-final-heading">BALLYSTIK · 14 POUVOIRS</div><p>Uniquement les pouvoirs de powers_final.html. Clique autant de fois que nécessaire pour ajouter des pickups.</p></div>' + renderNew();
  }
  window.BallYstikNewPowers = { render, groups, isNewPower: id => newIds.has(id) };
  document.addEventListener('click', function (event) {
    const button = event.target.closest('[data-power-spawn]');
    if (!button) return;
    const id = button.getAttribute('data-power-spawn');
    const ok = !!(window.ArenaBattle && window.ArenaBattle.spawnPickup && window.ArenaBattle.spawnPickup(id));
    const previous = button.dataset.label || button.textContent;
    button.dataset.label = previous;
    button.textContent = ok ? '✓ AJOUTÉ' : 'DÉJÀ PRÉSENT / PARTIE À LANCER';
    button.classList.toggle('spawn-error', !ok);
    // Ne jamais désactiver le bouton : un même pouvoir peut être spawn plusieurs fois.
    window.setTimeout(function () { if (button.isConnected) { button.textContent = previous; button.classList.remove('spawn-error'); } }, 1400);
  });
  document.addEventListener('DOMContentLoaded', render);
})();