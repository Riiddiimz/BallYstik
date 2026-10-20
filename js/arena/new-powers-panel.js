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
  let activeTab = 'new';
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
  function renderOriginal() {
    const registry = window.AbilityRegistry && window.AbilityRegistry.all || {};
    const labels = { offensive:'Attaque', defensive:'Défense', utility:'Utilitaires', weapons:'Armes' };
    const order = ['offensive','defensive','utility','weapons'];
    return '<div class="power-catalog-list"><p class="power-catalog-note">Catalogue historique conservé à part. Ces capacités peuvent être ajoutées manuellement ; elles ne sont plus mélangées au tirage automatique des 14 nouveaux pouvoirs.</p>' +
      order.map(category => {
        const items = Object.values(registry).filter(p => !newIds.has(p.id) && p.category === category);
        if (!items.length) return '';
        return '<section class="power-catalog-group"><h3 class="power-theme" style="color:#a1a1aa">' + labels[category] + '<span>' + items.length + '</span></h3>' +
          items.map(p => '<article class="power-final-card power-original-card" style="--power-color:' + esc(p.color || '#a1a1aa') + '">' +
            '<div><div class="pname">' + esc(p.name) + '</div><div class="pdesc">' + esc(p.desc || 'Pouvoir d’origine') + '</div></div>' +
            '<div class="picon" aria-hidden="true">' + esc(p.icon || '✦') + '</div>' +
            '<div class="power-card-action">' + spawnButton(p.id, p.color || '#a1a1aa') + '</div></article>'
        ).join('') + '</section>';
      }).join('') + '</div>';
  }
  function render() {
    const root = document.getElementById('rightSettingsContainer');
    if (!root) return;
    root.innerHTML =
      '<div class="power-panel-head"><div class="power-final-heading">BALLYSTIK · POUVOIRS</div><p>Choisis un catalogue, puis fais apparaître autant de pouvoirs que nécessaire.</p></div>' +
      '<div class="power-catalog-tabs" role="tablist" aria-label="Catalogues de pouvoirs">' +
        '<button type="button" role="tab" data-power-tab="new" aria-selected="' + (activeTab === 'new') + '" class="' + (activeTab === 'new' ? 'active' : '') + '">✦ Nouveaux pouvoirs <span>14</span></button>' +
        '<button type="button" role="tab" data-power-tab="original" aria-selected="' + (activeTab === 'original') + '" class="' + (activeTab === 'original' ? 'active' : '') + '">◈ Pouvoirs d’origine</button>' +
      '</div>' + (activeTab === 'new' ? renderNew() : renderOriginal());
  }
  function setTab(tab) { activeTab = tab === 'original' ? 'original' : 'new'; render(); }
  window.BallYstikNewPowers = { render, groups, isNewPower: id => newIds.has(id) };
  document.addEventListener('click', function (event) {
    const tab = event.target.closest('[data-power-tab]');
    if (tab) { setTab(tab.getAttribute('data-power-tab')); return; }
    const button = event.target.closest('[data-power-spawn]');
    if (!button) return;
    const id = button.getAttribute('data-power-spawn');
    const ok = !!(window.ArenaBattle && window.ArenaBattle.spawnPickup && window.ArenaBattle.spawnPickup(id));
    const previous = button.dataset.label || button.textContent;
    button.dataset.label = previous;
    button.textContent = ok ? '✓ AJOUTÉ — ENCORE ?' : 'LANCE UNE PARTIE PUIS RÉESSAIE';
    button.classList.toggle('spawn-error', !ok);
    // Ne jamais désactiver le bouton : un même pouvoir peut être spawn plusieurs fois.
    window.setTimeout(function () { if (button.isConnected) { button.textContent = previous; button.classList.remove('spawn-error'); } }, 1400);
  });
  document.addEventListener('DOMContentLoaded', render);
})();