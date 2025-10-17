// Оптимизированный JavaScript для страницы сообщения об ошибках FREE CAD
(function() {
    'use strict';

    // Кэш DOM элементов
    const DOMCache = {
        themeIcon: null,
        backToTopBtn: null,
        mobileMenu: null,
        mobileMenuBtn: null,
        bugReportForm: null,
        privacyModal: null,
        
        init() {
            this.themeIcon = document.querySelector('.theme-icon');
            this.backToTopBtn = document.getElementById('backToTop');
            this.mobileMenu = document.getElementById('mobileMenu');
            this.mobileMenuBtn = document.getElementById('mobileMenuBtn');
            this.bugReportForm = document.getElementById('bugReportForm');
            this.privacyModal = document.getElementById('privacyModal');
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
        },

        showNotification(message, type = 'success') {
            const notification = document.createElement('div');
            notification.className = `notification notification-${type}`;
            notification.textContent = message;
            
            Object.assign(notification.style, {
                position: 'fixed',
                top: '20px',
                right: '20px',
                zIndex: '10000',
                background: type === 'success' 
                    ? 'linear-gradient(45deg, #27ae60, #2ecc71)' 
                    : 'linear-gradient(45deg, #e74c3c, #c0392b)',
                color: 'white',
                padding: '15px 25px',
                borderRadius: '25px',
                boxShadow: '0 5px 20px rgba(0,0,0,0.2)',
                fontWeight: 'bold',
                transform: 'translateX(400px)',
                transition: 'transform 0.3s ease',
                maxWidth: '400px',
                wordWrap: 'break-word'
            });

            document.body.appendChild(notification);
            
            requestAnimationFrame(() => {
                notification.style.transform = 'translateX(0)';
            });
            
            setTimeout(() => {
                notification.style.transform = 'translateX(400px)';
                setTimeout(() => notification.remove(), 300);
            }, 3000);
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
                if (href === '#top') {
                    e.preventDefault();
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                } else if (href.startsWith('#')) {
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
                DOMCache.backToTopBtn.style.opacity = isVisible ? '1' : '0';
                DOMCache.backToTopBtn.style.visibility = isVisible ? 'visible' : 'hidden';
            };

            window.addEventListener('scroll', handleScroll, { passive: true });
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

    // Модальные окна
    const Modals = {
        init() {
            this.initPrivacyModal();
        },

        initPrivacyModal() {
            if (!DOMCache.privacyModal) return;
            
            DOMCache.privacyModal.addEventListener('click', (e) => {
                if (e.target === DOMCache.privacyModal) {
                    this.closePrivacyModal();
                }
            });
        },

        showPrivacyPolicy() {
            if (DOMCache.privacyModal) {
                DOMCache.privacyModal.style.display = 'block';
            }
        },

        closePrivacyModal() {
            if (DOMCache.privacyModal) {
                DOMCache.privacyModal.style.display = 'none';
            }
        }
    };

    // Формы
    const Forms = {
        init() {
            this.initBugReportForm();
        },

        initBugReportForm() {
            if (!DOMCache.bugReportForm) return;

            DOMCache.bugReportForm.addEventListener('submit', (e) => {
                e.preventDefault();
                Utils.showNotification('Отчет об ошибке отправлен! Спасибо за помощь в улучшении FREE CAD.');
                this.clearBugForm();
            });
        },

        clearBugForm() {
            if (DOMCache.bugReportForm) {
                DOMCache.bugReportForm.reset();
            }
        }
    };

    // Глобальные функции
    window.toggleTheme = () => Theme.toggle();
    window.openContactForm = () => window.location.href = 'contact.html';
    window.openMobileMenu = () => MobileMenu.open();
    window.closeMobileMenu = () => MobileMenu.close();
    window.showPrivacyPolicy = () => Modals.showPrivacyPolicy();
    window.closePrivacyModal = () => Modals.closePrivacyModal();
    window.clearBugForm = () => Forms.clearBugForm();

    // Инициализация
    document.addEventListener('DOMContentLoaded', () => {
        DOMCache.init();
        Theme.init();
        Navigation.init();
        MobileMenu.init();
        Modals.init();
        Forms.init();
    });

})();