document.addEventListener('DOMContentLoaded', () => {
    // Technical Header: Blur on scroll
    const header = document.querySelector('.header');

    // Performance: Throttled scroll handler
    let isScrolling = false;

    window.addEventListener('scroll', () => {
        if (!isScrolling) {
            window.requestAnimationFrame(() => {
                if (window.scrollY > 20) {
                    header.style.background = 'rgba(0, 12, 76, 0.9)';
                    header.style.borderBottom = '1px solid rgba(255,255,255,0.1)';
                } else {
                    header.style.background = 'rgba(0, 12, 76, 0.8)';
                    header.style.borderBottom = '1px solid transparent';
                }
                isScrolling = false;
            });
            isScrolling = true;
        }
    }, { passive: true });

    // Intersection Observer for staggered animations
    // Using a single observer for efficiency
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                // Unobserve after showing to save resources
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.15, // Trigger when 15% visible
        rootMargin: '50px' // Pre-load slightly before view
    });

    // Select all elements that need animation
    const animatedElements = document.querySelectorAll('.animate-in');
    animatedElements.forEach(el => observer.observe(el));

    // Smooth scroll for anchors
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;

            const target = document.querySelector(targetId);
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
});

// Utility: CSS Class for entrance animations
// (Usually handled in CSS, but ensuring it's active here if needed dynamic additions)
const styleSheet = document.createElement("style");
styleSheet.textContent = `
    .animate-in { 
        opacity: 0; 
        transform: translateY(10px); 
        transition: opacity 0.6s ease, transform 0.6s ease;
        will-change: opacity, transform;
    }
    .animate-in.visible { 
        opacity: 1; 
        transform: translateY(0); 
    }
    
    /* Stagger delays */
    .stagger-1 { transition-delay: 0.1s; }
    .stagger-2 { transition-delay: 0.2s; }
    .stagger-3 { transition-delay: 0.3s; }
`;
document.head.appendChild(styleSheet);
