/* ================================================================
   JATIN MARATHE — PORTFOLIO SCRIPT
   Features: particle system, bubbles, parallax, nav, form, reveal
================================================================ */

// ── UTILITIES ─────────────────────────────────────────────────
const qs = (sel, ctx = document) => ctx.querySelector(sel);
const qsa = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
const isDark = () => document.body.classList.contains('dark');

// ── SAFE STORAGE (handles tracking-prevention blocks) ─────────
const safeStore = {
    get: (k) => { try { return localStorage.getItem(k); } catch { return null; } },
    set: (k, v) => { try { localStorage.setItem(k, v); } catch { } }
};

// ── STATE ─────────────────────────────────────────────────────
let mouseX = 0, mouseY = 0;

// ══════════════════════════════════════════════════════════════
//   1. PARTICLE + BUBBLE SYSTEM
// ══════════════════════════════════════════════════════════════
class ParticleSystem {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.particles = [];
        this.bubbles = [];
        this.rafId = null;
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.initParticles();
        this.initBubbles();
    }

    initParticles() {
        const count = isDark()
            ? Math.floor((window.innerWidth * window.innerHeight) / 14000)
            : Math.floor((window.innerWidth * window.innerHeight) / 22000);
        this.particles = Array.from({ length: count }, () => this.createParticle(true));
    }

    createParticle(random = false) {
        const W = this.canvas.width;
        const H = this.canvas.height;
        const darkColors = [[6, 214, 240], [91, 127, 255], [0, 255, 212], [124, 58, 237], [147, 197, 253]];
        const lightColors = [[6, 182, 212], [99, 102, 241], [168, 85, 247]];
        const palette = isDark() ? darkColors : lightColors;
        const col = palette[Math.floor(Math.random() * palette.length)];
        return {
            x: Math.random() * W,
            y: random ? Math.random() * H : H + 10,
            vx: (Math.random() - 0.5) * 0.3,
            vy: -(Math.random() * 0.4 + 0.1),
            r: Math.random() * 1.8 + 0.4,
            alpha: Math.random() * 0.5 + 0.1,
            alphaDir: Math.random() > 0.5 ? 1 : -1,
            color: col,
            life: 1,
        };
    }

    initBubbles() {
        if (!isDark()) { this.bubbles = []; return; }
        const count = Math.floor(window.innerWidth / 80);
        this.bubbles = Array.from({ length: count }, () => this.createBubble(true));
    }

    createBubble(random = false) {
        const W = this.canvas.width;
        const H = this.canvas.height;
        return {
            x: Math.random() * W,
            y: random ? Math.random() * H : H + 20,
            r: Math.random() * 4 + 1.5,
            vy: -(Math.random() * 0.35 + 0.08),
            vx: (Math.random() - 0.5) * 0.15,
            alpha: Math.random() * 0.18 + 0.04,
            wobble: Math.random() * Math.PI * 2,
            wobbleSpeed: Math.random() * 0.015 + 0.005,
        };
    }

    draw() {
        const { ctx, canvas } = this;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const dark = isDark();

        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.alpha += p.alphaDir * 0.003;
            if (p.alpha >= (dark ? 0.6 : 0.35)) p.alphaDir = -1;
            if (p.alpha <= 0.05) p.alphaDir = 1;
            if (p.y < -10 || p.x < -10 || p.x > canvas.width + 10) {
                this.particles[i] = this.createParticle(false);
                continue;
            }
            const [r, g, b] = p.color;
            ctx.save();
            if (dark) { ctx.shadowBlur = 8; ctx.shadowColor = `rgba(${r},${g},${b},0.6)`; }
            ctx.globalAlpha = p.alpha;
            ctx.fillStyle = `rgb(${r},${g},${b})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        if (dark) {
            for (let i = this.bubbles.length - 1; i >= 0; i--) {
                const b = this.bubbles[i];
                b.wobble += b.wobbleSpeed;
                b.x += Math.sin(b.wobble) * 0.4 + b.vx;
                b.y += b.vy;
                if (b.y < -b.r * 2) { this.bubbles[i] = this.createBubble(false); continue; }
                ctx.save();
                ctx.globalAlpha = b.alpha;
                ctx.strokeStyle = `rgba(6,214,240,${b.alpha * 2.5})`;
                ctx.lineWidth = 0.8;
                ctx.shadowBlur = 6;
                ctx.shadowColor = 'rgba(6,214,240,0.3)';
                ctx.beginPath();
                ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
                ctx.stroke();
                ctx.globalAlpha = b.alpha * 0.6;
                ctx.fillStyle = 'rgba(6,214,240,0.15)';
                ctx.beginPath();
                ctx.arc(b.x - b.r * 0.3, b.y - b.r * 0.3, b.r * 0.35, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
        }

        this.rafId = requestAnimationFrame(() => this.draw());
    }

    start() { if (this.rafId) cancelAnimationFrame(this.rafId); this.draw(); }
    stop() { if (this.rafId) cancelAnimationFrame(this.rafId); this.rafId = null; }
    refresh() { this.initParticles(); this.initBubbles(); }
}

// ══════════════════════════════════════════════════════════════
//   2. THEME TOGGLE
// ══════════════════════════════════════════════════════════════
function initTheme() {
    const btn = qs('#themeToggle');
    if (!btn) return;

    const saved = safeStore.get('jm-theme');
    if (saved === 'dark') applyDark(true);

    btn.addEventListener('click', () => {
        const going = !isDark();
        applyDark(going);
        safeStore.set('jm-theme', going ? 'dark' : 'light');
        if (window._ps) window._ps.refresh();
    });
}

function applyDark(on) {
    document.body.classList.toggle('dark', on);
    qsa('.nav-links').forEach(el => {
        el.style.background = on ? 'rgba(2,6,23,0.92)' : '';
    });
}

// Legacy button support
function clickfun() { applyDark(true); safeStore.set('jm-theme', 'dark'); }
function closefun() { applyDark(false); safeStore.set('jm-theme', 'light'); }

// ══════════════════════════════════════════════════════════════
//   3. NAVBAR
// ══════════════════════════════════════════════════════════════
function initNav() {
    const nav = qs('.nav, #nav');
    const hamburger = qs('#hamburger, .hamburger:not(.nav *)');
    const navLinks = qs('#navLinks, .nav-links');

    window.addEventListener('scroll', () => {
        nav?.classList.toggle('scrolled', window.scrollY > 50);
        updateActiveLink();
    }, { passive: true });

    hamburger?.addEventListener('click', () => {
        hamburger.classList.toggle('open');
        navLinks?.classList.toggle('active');
        navLinks?.classList.toggle('open');
    });

    qsa('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            hamburger?.classList.remove('open');
            navLinks?.classList.remove('active', 'open');
        });
    });

    qsa('.nav-link[href^="#"]').forEach(link => {
        link.addEventListener('click', e => {
            const target = qs(link.getAttribute('href'));
            if (!target) return;
            e.preventDefault();
            window.scrollTo({ top: target.offsetTop - 80, behavior: 'smooth' });
        });
    });
}

function updateActiveLink() {
    const sections = qsa('section[id], header[id]');
    let current = '';
    sections.forEach(s => { if (window.scrollY >= s.offsetTop - 120) current = s.id; });
    qsa('.nav-link').forEach(l => {
        l.classList.toggle('active', l.getAttribute('href') === '#' + current);
    });
}

// ══════════════════════════════════════════════════════════════
//   4. SCROLL REVEAL
// ══════════════════════════════════════════════════════════════
function initReveal() {
    const els = qsa('.reveal');

    if ('IntersectionObserver' in window) {
        const io = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const siblings = qsa('.reveal', entry.target.parentElement);
                    const idx = siblings.indexOf(entry.target);
                    entry.target.style.transitionDelay = `${idx * 0.08}s`;
                    entry.target.classList.add('visible');
                    io.unobserve(entry.target);
                }
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

        els.forEach(el => io.observe(el));
    } else {
        els.forEach(el => el.classList.add('visible'));
    }
}

// ══════════════════════════════════════════════════════════════
//   5. MOUSE PARALLAX
// ══════════════════════════════════════════════════════════════
function initParallax() {
    window.addEventListener('mousemove', e => {
        mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
        mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    }, { passive: true });

    function tickParallax() {
        if (isDark()) {
            const blobs = qsa('.blob');
            if (blobs[0]) blobs[0].style.transform = `translate(${mouseX * 18}px, ${mouseY * 12}px)`;
            if (blobs[1]) blobs[1].style.transform = `translate(${-mouseX * 14}px, ${-mouseY * 10}px)`;
            if (blobs[2]) blobs[2].style.transform = `translate(${mouseX * 8}px, ${mouseY * 6}px)`;
            const avatar = qs('.avatar-ring');
            if (avatar) avatar.style.transform = `perspective(800px) rotateY(${mouseX * 5}deg) rotateX(${-mouseY * 3}deg)`;
        }
        requestAnimationFrame(tickParallax);
    }
    tickParallax();
}

// ══════════════════════════════════════════════════════════════
//   6. MAGNETIC BUTTONS
// ══════════════════════════════════════════════════════════════
function initMagnetic() {
    qsa('.btn-primary, .btn-outline').forEach(btn => {
        btn.addEventListener('mousemove', e => {
            if (!isDark()) return;
            const rect = btn.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            btn.style.transform = `translate(${x * 0.25}px, ${y * 0.25}px) translateY(-3px)`;
        });
        btn.addEventListener('mouseleave', () => { btn.style.transform = ''; });
    });
}

// ══════════════════════════════════════════════════════════════
//   7. CTA SCROLL HELPERS
// ══════════════════════════════════════════════════════════════
function scrollSection(selector) {
    const el = qs(selector);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ══════════════════════════════════════════════════════════════
//   8. CONTACT FORM
// ══════════════════════════════════════════════════════════════
function initContactForm() {
    const form = qs('#contactForm');
    const btn = qs('#submitBtn');
    const loader = qs('.btn-loader');
    const text = qs('.btn-text');
    const status = qs('#formStatus');
    if (!form) return;

    form.addEventListener('submit', async e => {
        e.preventDefault();
        if (loader) loader.classList.add('show');
        if (text) text.classList.add('hide');
        if (btn) btn.disabled = true;
        if (status) status.innerText = '';

        try {
            const res = await fetch(form.action, {
                method: 'POST',
                body: new FormData(form),
                headers: { Accept: 'application/json' },
            });
            if (res.ok) {
                status.innerText = '✦ Message sent — I\'ll get back to you soon!';
                status.style.color = isDark() ? '#06d6f0' : '#0891b2';
                form.reset();
                qsa('.field input, .field textarea', form).forEach(inp => {
                    inp.dispatchEvent(new Event('change'));
                });
            } else {
                throw new Error('Server error');
            }
        } catch {
            status.innerText = '✕ Something went wrong. Please try again.';
            status.style.color = '#f87171';
        } finally {
            if (loader) loader.classList.remove('show');
            if (text) text.classList.remove('hide');
            if (btn) btn.disabled = false;
        }
    });
}

// ══════════════════════════════════════════════════════════════
//   9. TIMELINE SCROLL ANIMATION
// ══════════════════════════════════════════════════════════════
function initTimeline() {
    const items = qsa('.timeline-item');
    if (!items.length) return;

    if ('IntersectionObserver' in window) {
        const io = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const idx = items.indexOf(entry.target);
                    setTimeout(() => entry.target.classList.add('show', 'visible'), idx * 120);
                    io.unobserve(entry.target);
                }
            });
        }, { threshold: 0.15 });
        items.forEach(el => io.observe(el));
    } else {
        items.forEach(el => el.classList.add('show', 'visible'));
    }
}

// ══════════════════════════════════════════════════════════════
//   10. CUSTOM CURSOR (dark mode only)
// ══════════════════════════════════════════════════════════════
function initCursor() {
    if ('ontouchstart' in window) return;

    const cursor = document.createElement('div');
    cursor.id = 'jm-cursor';
    cursor.style.cssText = `
        position:fixed; width:8px; height:8px; border-radius:50%;
        pointer-events:none; z-index:99999; transform:translate(-50%,-50%);
        transition:transform .1s, opacity .3s, width .3s, height .3s, background .3s;
        mix-blend-mode:screen; display:none;`;
    document.body.appendChild(cursor);

    const ring = document.createElement('div');
    ring.id = 'jm-cursor-ring';
    ring.style.cssText = `
        position:fixed; width:28px; height:28px; border-radius:50%;
        pointer-events:none; z-index:99998; border:1px solid rgba(6,214,240,0.5);
        transform:translate(-50%,-50%);
        transition:transform .08s, opacity .3s, width .25s, height .25s; display:none;`;
    document.body.appendChild(ring);

    let cx = 0, cy = 0, rx = 0, ry = 0;

    window.addEventListener('mousemove', e => {
        cx = e.clientX; cy = e.clientY;
        if (isDark()) {
            cursor.style.display = 'block';
            ring.style.display = 'block';
            cursor.style.left = cx + 'px';
            cursor.style.top = cy + 'px';
            cursor.style.background = 'rgba(6,214,240,0.9)';
            cursor.style.boxShadow = '0 0 8px rgba(6,214,240,0.8)';
        } else {
            cursor.style.display = 'none';
            ring.style.display = 'none';
        }
    }, { passive: true });

    (function animRing() {
        rx += (cx - rx) * 0.12;
        ry += (cy - ry) * 0.12;
        ring.style.left = rx + 'px';
        ring.style.top = ry + 'px';
        requestAnimationFrame(animRing);
    })();

    document.addEventListener('mouseover', e => {
        const link = e.target.closest('a, button, [role="button"], .project-card, .skill-card');
        if (link && isDark()) {
            cursor.style.width = '14px';
            cursor.style.height = '14px';
            ring.style.width = '44px';
            ring.style.height = '44px';
            ring.style.borderColor = 'rgba(6,214,240,0.8)';
        }
    });

    document.addEventListener('mouseout', () => {
        cursor.style.width = '8px';
        cursor.style.height = '8px';
        ring.style.width = '28px';
        ring.style.height = '28px';
        ring.style.borderColor = 'rgba(6,214,240,0.5)';
    });
}

// ══════════════════════════════════════════════════════════════
//   11. TYPING EFFECT (hero eyebrow)
// ══════════════════════════════════════════════════════════════
function initTyping() {
    const el = qs('.hero-eyebrow');
    if (!el) return;
    const text = el.textContent.replace('◈ ', '').trim();
    el.textContent = '';
    let i = 0;
    function type() {
        if (i < text.length) {
            el.textContent = text.slice(0, ++i);
            setTimeout(type, 60 + Math.random() * 40);
        }
    }
    setTimeout(type, 800);
}

// ══════════════════════════════════════════════════════════════
//   12. PROJECT CARD TILT
// ══════════════════════════════════════════════════════════════
function initCardTilt() {
    qsa('.project-card, .skill-card').forEach(card => {
        card.addEventListener('mousemove', e => {
            if (!isDark()) return;
            const rect = card.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width - 0.5;
            const y = (e.clientY - rect.top) / rect.height - 0.5;
            card.style.transform = `translateY(-6px) perspective(600px) rotateX(${-y * 5}deg) rotateY(${x * 5}deg)`;
        });
        card.addEventListener('mouseleave', () => { card.style.transform = ''; });
    });
}

// ══════════════════════════════════════════════════════════════
//   13. PRELOADER
// ══════════════════════════════════════════════════════════════
function initPreloader() {
    const pl = qs('#preloader');
    if (!pl) return;
    window.addEventListener('load', () => {
        setTimeout(() => {
            pl.classList.add('hide');
            setTimeout(() => pl.remove(), 700);
        }, 900);
    });
}

// ══════════════════════════════════════════════════════════════
//   14. CURSOR TRAIL (dark only, GPU-safe)
// ══════════════════════════════════════════════════════════════
function initCursorTrail() {
    if ('ontouchstart' in window) return;
    const TRAIL_COUNT = 6;
    const trail = [];

    for (let i = 0; i < TRAIL_COUNT; i++) {
        const dot = document.createElement('div');
        dot.className = 'cursor-trail';
        dot.style.cssText = `opacity:${0.55 - i * 0.08}; width:${5 - i * 0.5}px; height:${5 - i * 0.5}px;`;
        document.body.appendChild(dot);
        trail.push({ el: dot });
    }

    let mx = -100, my = -100;
    let positions = Array.from({ length: TRAIL_COUNT }, () => ({ x: -100, y: -100 }));

    window.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; }, { passive: true });

    (function tickTrail() {
        if (!isDark()) {
            trail.forEach(t => { t.el.style.opacity = '0'; });
            requestAnimationFrame(tickTrail);
            return;
        }
        positions = [{ x: mx, y: my }, ...positions.slice(0, TRAIL_COUNT - 1)];
        trail.forEach((t, i) => {
            t.el.style.opacity = String(0.55 - i * 0.08);
            t.el.style.transform = `translate(${positions[i].x}px,${positions[i].y}px) translate(-50%,-50%)`;
        });
        requestAnimationFrame(tickTrail);
    })();
}

// ══════════════════════════════════════════════════════════════
//   15. MAGNETIC UPGRADE (spring physics, more targets)
// ══════════════════════════════════════════════════════════════
function upgradeMagnetic() {
    qsa('.btn-primary, .btn-outline, .social-btn, .ach-profile-card, .nav-logo').forEach(el => {
        let rafId, tx = 0, ty = 0;

        el.addEventListener('mousemove', e => {
            if (!isDark()) return;
            const rect = el.getBoundingClientRect();
            const dx = e.clientX - (rect.left + rect.width / 2);
            const dy = e.clientY - (rect.top + rect.height / 2);
            const strength = Math.min(1, 1 - Math.sqrt(dx * dx + dy * dy) / rect.width);
            tx = dx * strength * 0.28;
            ty = dy * strength * 0.28;
            el.style.transform = `translate(${tx}px,${ty}px)`;
        });

        el.addEventListener('mouseleave', () => {
            cancelAnimationFrame(rafId);
            (function spring() {
                tx *= 0.8; ty *= 0.8;
                el.style.transform = `translate(${tx}px,${ty}px)`;
                if (Math.abs(tx) > 0.1 || Math.abs(ty) > 0.1) {
                    rafId = requestAnimationFrame(spring);
                } else {
                    el.style.transform = '';
                }
            })();
        });
    });
}

// ══════════════════════════════════════════════════════════════
//   16. SKILL ICON HOVER GLOW
// ══════════════════════════════════════════════════════════════
function initIconHover() {
    qsa('.sk-icon').forEach(icon => {
        icon.addEventListener('mouseenter', () => {
            if (!isDark()) return;
            icon.style.boxShadow = '0 8px 28px rgba(0,0,0,.55), 0 0 20px rgba(6,214,240,.28)';
        });
        icon.addEventListener('mouseleave', () => { icon.style.boxShadow = ''; });
    });
}

// ══════════════════════════════════════════════════════════════
//   17. ACHIEVEMENTS — DSA counter + progress bar animation
//   NOTE: Must be a top-level function (not nested inside initReveal)
// ══════════════════════════════════════════════════════════════
function initAchievements() {
    const counters = document.querySelectorAll('.ach-dsa-num[data-target]');
    const barFills = document.querySelectorAll('.ach-dsa-fill');
    if (!counters.length && !barFills.length) return;

    const io = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;

            // Animate counter
            if (entry.target.dataset && entry.target.dataset.target) {
                const el = entry.target;
                const target = +el.dataset.target;
                let current = 0;
                const step = Math.ceil(target / 60);
                const tick = setInterval(() => {
                    current = Math.min(current + step, target);
                    el.textContent = current + '+';
                    if (current >= target) clearInterval(tick);
                }, 20);
            }

            // Animate progress bar
            if (entry.target.classList.contains('ach-dsa-fill')) {
                entry.target.classList.add('animate');
            }

            io.unobserve(entry.target);
        });
    }, { threshold: 0.5 });

    counters.forEach(el => io.observe(el));
    barFills.forEach(el => io.observe(el));
}

// ══════════════════════════════════════════════════════════════
//   INIT ALL
// ══════════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
    // Particle system
    const canvas = qs('#particles');
    if (canvas) {
        window._ps = new ParticleSystem(canvas);
        window._ps.start();
    }

    initTheme();
    initNav();
    initReveal();
    initTimeline();
    initParallax();
    initMagnetic();
    initContactForm();
    initCursor();
    initTyping();
    initCardTilt();
    initPreloader();
    initCursorTrail();
    upgradeMagnetic();
    initIconHover();
    initAchievements();

    updateActiveLink();
});