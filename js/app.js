/* BallYstik — interactions de l'interface, sans moteur de simulation historique. */
document.addEventListener('DOMContentLoaded', () => {
    const $ = id => document.getElementById(id);

    const bindSidebar = (toggleId, closeId, sidebarId, direction) => {
        const sidebar = $(sidebarId);
        const toggle = $(toggleId);
        const close = $(closeId);
        if (!sidebar) return;
        const open = () => {
            sidebar.classList.remove(direction === 'left' ? '-translate-x-full' : 'translate-x-full');
            sidebar.classList.add('translate-x-0');
        };
        const hide = () => {
            sidebar.classList.add(direction === 'left' ? '-translate-x-full' : 'translate-x-full');
            sidebar.classList.remove('translate-x-0');
        };
        if (toggle) toggle.addEventListener('click', open);
        if (close) close.addEventListener('click', hide);
    };

    bindSidebar('toggleLeftSidebarBtn', 'closeLeftSidebarBtn', 'leftSidebar', 'left');
    bindSidebar('toggleRightSidebarBtn', 'closeRightSidebarBtn', 'rightSidebar', 'right');

    document.querySelectorAll('.accordion-toggle').forEach(button => {
        button.addEventListener('click', () => {
            const target = $(button.dataset.target);
            if (!target) return;
            target.classList.toggle('open');
            target.style.display = target.classList.contains('open') ? '' : 'none';
            const icon = button.querySelector('.fa-chevron-down');
            if (icon) icon.classList.toggle('rotate-180', target.classList.contains('open'));
        });
    });

    const fullscreen = $('fullscreenBtn');
    if (fullscreen) fullscreen.addEventListener('click', async () => {
        try {
            if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
            else await document.exitFullscreen();
        } catch (error) {
            console.warn('[BallYstik] Plein écran indisponible :', error);
        }
    });

    const audioButton = $('audioInitBtn');
    if (audioButton) audioButton.addEventListener('click', () => {
        const audio = window.audioSynth;
        if (!audio) return;
        audio.init();
        audio.muted = !audio.muted;
        audioButton.innerHTML = audio.muted
            ? '<i class="fa-solid fa-volume-xmark"></i> Muet'
            : '<i class="fa-solid fa-volume-high"></i> Audio';
        audioButton.classList.toggle('text-red-400', audio.muted);
        audioButton.classList.toggle('text-emerald-400', !audio.muted);
    });
});