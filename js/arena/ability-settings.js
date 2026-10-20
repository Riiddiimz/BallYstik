/* BallYstik — configuration minimale des 14 pouvoirs validés.
 * Les anciennes capacités ne sont plus chargées ni configurables.
 */
(function () {
  'use strict';
  const IDS = [
    'judgment_ray','star_hunter','bomb_shrapnel','seismic_nova','magma_rift',
    'singularity','quantum_jump','colossus','prism_reflector','multiplication',
    'chain_lightning','crystal_prison','explosive_flower','imprisonment_seal'
  ];
  const STORE = 'ballystik.ability-settings.v2';
  const oldStore = 'ballystik.ability-settings.v1';
  const defaults = Object.fromEntries(IDS.map(id => [id, {
    enabled: true, weight: 4, durationMultiplier: 1, maxStacks: 1,
    canAppearAtStart: true, disabledInMode: false, params: {}
  }]));
  let state = { abilities: structuredCopy(defaults), global: {
    durationMultiplier: 1, maxStacks: 1, canAppearAtStart: true, disabledInMode: false
  }};
  function structuredCopy(v) { return JSON.parse(JSON.stringify(v)); }
  function cfg(id) { return state.abilities[id] || null; }
  function load() {
    try {
      let saved = JSON.parse(localStorage.getItem(STORE) || 'null');
      if (!saved) {
        const legacy = JSON.parse(localStorage.getItem(oldStore) || 'null');
        if (legacy && legacy.abilities) saved = legacy;
      }
      if (saved && saved.abilities) {
        IDS.forEach(id => {
          const c = saved.abilities[id];
          if (c) state.abilities[id] = Object.assign({}, state.abilities[id], c, { params: {} });
        });
        state.global = Object.assign({}, state.global, saved.global || {});
      }
      // Écrase la configuration historique : aucune ancienne capacité ne subsiste.
      save();
      try { localStorage.removeItem(oldStore); } catch (_) {}
    } catch (_) {}
  }
  function save() {
    try { localStorage.setItem(STORE, JSON.stringify(state)); } catch (_) {}
  }
  function runtime(id) {
    const c = cfg(id);
    if (!c) return null;
    return Object.assign({}, c, {
      durationMultiplier: Number(c.durationMultiplier || 1) * Number(state.global.durationMultiplier || 1),
      maxStacks: Math.min(Number(c.maxStacks || 1), Number(state.global.maxStacks || 1)),
      canAppearAtStart: c.canAppearAtStart !== false && state.global.canAppearAtStart !== false,
      disabledInMode: !!c.disabledInMode || !!state.global.disabledInMode
    });
  }
  function render() {
    if (window.BallYstikNewPowers) window.BallYstikNewPowers.render();
  }
  window.AbilitySettings = {
    render,
    get: cfg,
    getParam: () => undefined,
    runtimeConfig: runtime,
    isEnabled: id => { const c = runtime(id); return !!(c && c.enabled && !c.disabledInMode); },
    getWeight: (id, fallback) => { const c = runtime(id); return c ? Math.max(0, Number(c.weight) || 0) : fallback; },
    getDuration: (id, fallback) => { const c = runtime(id); return fallback > 0 && c ? fallback * c.durationMultiplier : fallback; },
    canAppearAtStart: id => { const c = runtime(id); return !!(c && c.canAppearAtStart && c.enabled && !c.disabledInMode); },
    snapshot: () => structuredCopy(state),
    setEnabled(id, enabled) { if (!cfg(id)) return false; state.abilities[id].enabled = !!enabled; save(); window.dispatchEvent(new CustomEvent('ballystik:ability-settings-changed')); return true; },
    setWeight(id, weight) { if (!cfg(id)) return false; state.abilities[id].weight = Math.max(0, Number(weight) || 0); save(); window.dispatchEvent(new CustomEvent('ballystik:ability-settings-changed')); return true; },
    reset() { state = { abilities: structuredCopy(defaults), global: { durationMultiplier: 1, maxStacks: 1, canAppearAtStart: true, disabledInMode: false } }; save(); render(); }
  };
  document.addEventListener('DOMContentLoaded', load);
})();
