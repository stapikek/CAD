// Оптимизированный JavaScript для страницы документации FREE CAD
(function() {
    'use strict';

    // Кэш DOM элементов
    const DOMCache = {
        themeIcon: null,
        backToTopBtn: null,
        mobileMenu: null,
        mobileMenuBtn: null,
        
        init() {
            this.themeIcon = document.querySelector('.theme-icon');
            this.backToTopBtn = document.getElementById('backToTop');
            this.mobileMenu = document.getElementById('mobileMenu');
            this.mobileMenuBtn = document.getElementById('mobileMenuBtn');
        }
    };

    // Утилиты
    const Utils = {
        debounce(func, wait) {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    clearTimeout(timeout);
                    func(...args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        }
    };

    // Управление темой
    const Theme = {
        current: null,
        
        init() {
            const savedTheme = localStorage.getItem('theme');
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            this.current = savedTheme || (prefersDark ? 'dark' : 'light');
            
            document.documentElement.setAttribute('data-theme', this.current);
            this.updateIcon();
        },

        toggle() {
            this.current = this.current === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', this.current);
            localStorage.setItem('theme', this.current);
            this.updateIcon();
        },

        updateIcon() {
            if (DOMCache.themeIcon) {
                DOMCache.themeIcon.textContent = this.current === 'dark' ? '☀️' : '🌙';
            }
        }
    };

    // Навигация
    const Navigation = {
        init() {
            this.initSmoothScrolling();
            this.initBackToTop();
        },

        initSmoothScrolling() {
            document.addEventListener('click', (e) => {
                const link = e.target.closest('a[href^="#"]');
                if (!link) return;

                const href = link.getAttribute('href');
                
                // Если ссылка ведет на другую страницу, не предотвращаем стандартное поведение
                if (href.includes('index.html') || href.includes('contact.html') || 
                    href.includes('bug-report.html') || href.includes('cad.html')) {
                    return;
                }
                
                // Если это якорная ссылка на текущей странице
                if (href.startsWith('#')) {
                    e.preventDefault();
                    const targetId = href.substring(1);
                    const targetElement = document.getElementById(targetId);
                    
                    if (targetElement) {
                        targetElement.scrollIntoView({
                            behavior: 'smooth',
                            block: 'start'
                        });
                    }
                }
            });
        },

        initBackToTop() {
            if (!DOMCache.backToTopBtn) return;

            const handleScroll = () => {
                const isVisible = window.pageYOffset > 300;
                DOMCache.backToTopBtn.style.display = isVisible ? 'block' : 'none';
            };

            window.addEventListener('scroll', handleScroll, { passive: true });
            
            DOMCache.backToTopBtn.addEventListener('click', () => {
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            });
        }
    };

    // Мобильное меню
    const MobileMenu = {
        isOpen: false,

        init() {
            if (!DOMCache.mobileMenu || !DOMCache.mobileMenuBtn) return;
            
            document.addEventListener('click', (e) => {
                if (this.isOpen && 
                    !DOMCache.mobileMenu.contains(e.target) && 
                    !DOMCache.mobileMenuBtn.contains(e.target)) {
                    this.close();
                }
            });

            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this.isOpen) {
                    this.close();
                }
            });
        },

        open() {
            if (!DOMCache.mobileMenu || !DOMCache.mobileMenuBtn) return;
            
            DOMCache.mobileMenu.style.display = 'block';
            DOMCache.mobileMenuBtn.style.display = 'none';
            this.isOpen = true;
            
            requestAnimationFrame(() => {
                DOMCache.mobileMenu.style.opacity = '1';
                DOMCache.mobileMenu.style.transform = 'translateX(0)';
            });
        },

        close() {
            if (!DOMCache.mobileMenu || !DOMCache.mobileMenuBtn) return;
            
            DOMCache.mobileMenu.style.opacity = '0';
            DOMCache.mobileMenu.style.transform = 'translateX(100%)';
            this.isOpen = false;
            
            setTimeout(() => {
                DOMCache.mobileMenu.style.display = 'none';
                DOMCache.mobileMenuBtn.style.display = 'flex';
            }, 300);
        }
    };

    // Анимации
    const Animations = {
        init() {
            this.initScrollAnimations();
        },

        initScrollAnimations() {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.style.opacity = '1';
                        entry.target.style.transform = 'translateY(0)';
                    }
                });
            }, { threshold: 0.1 });

            const elements = document.querySelectorAll(
                '.docs-section, .requirements, .steps-list, .tip-box, .warning-box'
            );
            
            elements.forEach(el => {
                el.style.opacity = '0';
                el.style.transform = 'translateY(30px)';
                el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
                observer.observe(el);
            });
        }
    };

    // Глобальные функции
    window.toggleTheme = () => Theme.toggle();
    window.openContactForm = () => window.location.href = 'contact.html';
    window.openMobileMenu = () => MobileMenu.open();
    window.closeMobileMenu = () => MobileMenu.close();

    // Инициализация
    document.addEventListener('DOMContentLoaded', () => {
        DOMCache.init();
        Theme.init();
        Navigation.init();
        MobileMenu.init();
        Animations.init();
    });

})();