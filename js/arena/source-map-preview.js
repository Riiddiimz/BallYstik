/* Aperçu des prototypes de maps sans modifier leur rendu ni leur code source. */
(function () {
    'use strict';

    const modal = document.getElementById('sourceMapsPreviewModal');
    const frame = document.getElementById('sourceMapsPreviewFrame');
    const title = document.getElementById('sourceMapsPreviewTitle');
    const openNewTab = document.getElementById('sourceMapsOpenNewTab');
    const closeButton = document.getElementById('closeSourceMapsPreview');

    if (!modal || !frame || !title || !openNewTab || !closeButton) return;

    const prototypes = {
        neon: {
            title: 'Map Neon — 11 maps originales',
            url: 'idees/map_neon.html'
        },
        refonte: {
            title: 'Refonte — maps thématiques originales',
            url: 'idees/ballystik_maps_refonte.html'
        }
    };

    function openPreview(key) {
        const prototype = prototypes[key];
        if (!prototype) return;
        title.textContent = prototype.title;
        frame.src = prototype.url;
        openNewTab.href = prototype.url;
        modal.classList.remove('hidden');
        document.body.classList.add('overflow-hidden');
    }

    function closePreview() {
        modal.classList.add('hidden');
        frame.src = 'about:blank';
        document.body.classList.remove('overflow-hidden');
    }

    document.getElementById('openNeonMapsPreview')?.addEventListener('click', () => openPreview('neon'));
    document.getElementById('openRefonteMapsPreview')?.addEventListener('click', () => openPreview('refonte'));
    closeButton.addEventListener('click', closePreview);
    modal.addEventListener('click', event => {
        if (event.target === modal) closePreview();
    });
    document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && !modal.classList.contains('hidden')) closePreview();
    });
})();
