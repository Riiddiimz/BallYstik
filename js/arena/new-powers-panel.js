/* BallYstik — catalogue intégré des nouveaux pouvoirs.
 * Les descriptions et identités visuelles sont reprises du showcase validé.
 * Ce module ne charge pas powers_final.html et ne crée aucune navigation.
 */
(function () {
  'use strict';

  const groups = [
    {
      title: 'Attaque & destruction',
      color: '#fb923c',
      items: [
        { id: 'judgment_ray', name: 'Rayon du Jugement', icon: '⚡', color: '#67e8f9', desc: 'Ligne laser instantanée qui traverse une cible.' },
        { id: 'star_hunter', name: 'Chasseur Stellaire', icon: '➤', color: '#fb923c', desc: 'Missile guidé qui poursuit sa cible.' },
        { id: 'bomb_shrapnel', name: 'Bombe à fragmentation', icon: '✦', color: '#22d3ee', desc: 'Bombe qui explose en 8 fragments radiaux.' },
        { id: 'seismic_nova', name: 'Nova Sismique', icon: '◎', color: '#ef4444', desc: 'Onde circulaire qui repousse les boules.' },
        { id: 'magma_rift', name: 'Faille Magmatique', icon: '🔥', color: '#fb923c', desc: 'Traînée de lave persistante qui blesse au passage.' },
        { id: 'colossus', name: 'Surcharge Giga', icon: '⬢', color: '#fbbf24', desc: 'Devient géant et gagne un bonus de dégâts.' },
        { id: 'chain_lightning', name: 'Éclair en chaîne', icon: 'ϟ', color: '#a5f3fc', desc: 'La foudre rebondit d’une cible à l’autre.' },
        { id: 'explosive_flower', name: 'Fleur Explosive', icon: '✿', color: '#ec4899', desc: 'Une fleur se déploie, ses pétales partent en étoile.' }
      ]
    },
    {
      title: 'Contrôle & emprisonnement',
      color: '#7dd3fc',
      items: [
        { id: 'crystal_prison', name: 'Prison de Cristal', icon: '❄', color: '#7dd3fc', desc: 'Pose un piège qui verrouille la boule qui marche dessus.' },
        { id: 'imprisonment_seal', name: 'Sceau d’Emprisonnement', icon: '⌘', color: '#c084fc', desc: 'Un sceau mystique piège temporairement une cible.' },
        { id: 'singularity', name: 'Singularité Violette', icon: '◯', color: '#a855f7', desc: 'Attire les boules puis implose.' }
      ]
    },
    {
      title: 'Défense & réflexion',
      color: '#93c5fd',
      items: [
        { id: 'prism_reflector', name: 'Prisme Réflecteur', icon: '◇', color: '#93c5fd', desc: 'Bouclier hexagonal qui renvoie les dégâts.' }
      ]
    },
    {
      title: 'Mobilité & duplication',
      color: '#22d3ee',
      items: [
        { id: 'quantum_jump', name: 'Saut Quantique', icon: '◈', color: '#22d3ee', desc: 'Téléportation avec anneaux visibles.' },
        { id: 'multiplication', name: 'Division Cellulaire', icon: '✧', color: '#ff2a85', desc: 'Deux clones translucides se séparent.' }
      ]
    }
  ];

  const escapeHtml = value => String(value).replace(/[&<>"']/g, ch => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[ch]);

  function render() {
    const root = document.getElementById('rightSettingsContainer');
    if (!root) return;

    root.innerHTML = '<div class="space-y-2">' +
      '<div class="new-power-intro"><strong style="color:#f9a8d4">NOUVEAUX POUVOIRS</strong><br>' +
      '14 concepts répartis par thème. Cette vue est intégrée au panneau de pouvoirs : l’arène et les réglages restent en place.<br>' +
      '<span style="color:#a1a1aa">Catalogue visuel uniquement : le branchement de ces capacités au moteur de combat reste une étape distincte.</span></div>' +
      groups.map(group =>
        '<section aria-label="' + escapeHtml(group.title) + '">' +
          '<h3 class="new-power-theme" style="color:' + group.color + '">' + escapeHtml(group.title) + '</h3>' +
          '<div class="space-y-1.5">' + group.items.map(power =>
            '<article class="new-power-card" style="--power-color:' + power.color + '">' +
              '<div><div class="new-power-name">' + escapeHtml(power.name) +
                '<span class="new-power-tag">NOUVEAU</span></div>' +
                '<div class="new-power-desc">' + escapeHtml(power.desc) + '</div></div>' +
              '<div class="new-power-icon" aria-hidden="true">' + escapeHtml(power.icon) + '</div>' +
            '</article>'
          ).join('') + '</div></section>'
      ).join('') +
      '</div>';
  }

  function setTab(tab) {
    window.BallYstikPowerCatalog = tab;
    const origin = document.getElementById('originPowersTab');
    const fresh = document.getElementById('newPowersTab');
    if (origin) {
      origin.classList.toggle('active', tab === 'origin');
      origin.setAttribute('aria-pressed', String(tab === 'origin'));
    }
    if (fresh) {
      fresh.classList.toggle('active', tab === 'new');
      fresh.setAttribute('aria-pressed', String(tab === 'new'));
    }
    if (tab === 'new') render();
    else if (window.AbilitySettings && typeof window.AbilitySettings.render === 'function') window.AbilitySettings.render();
  }

  window.BallYstikNewPowers = { render, groups };
  document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('originPowersTab')?.addEventListener('click', () => setTab('origin'));
    document.getElementById('newPowersTab')?.addEventListener('click', () => setTab('new'));
    setTab('origin');
  });
})();
