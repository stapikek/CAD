// Оптимизированный JavaScript для FREE CAD
(function() {
    'use strict';

    // Кэш DOM элементов для быстрого доступа
    const DOMCache = {
        themeIcon: null,
        backToTopBtn: null,
        mobileMenu: null,
        mobileMenuBtn: null,
        contactModal: null,
        privacyModal: null,
        bugReportForm: null,
        
        init() {
            this.themeIcon = document.querySelector('.theme-icon');
            this.backToTopBtn = document.getElementById('backToTop');
            this.mobileMenu = document.getElementById('mobileMenu');
            this.mobileMenuBtn = document.getElementById('mobileMenuBtn');
            this.contactModal = document.getElementById('contactModal');
            this.privacyModal = document.getElementById('privacyModal');
            this.bugReportForm = document.getElementById('bugReportForm');
        }
    };

    // Утилиты для оптимизации производительности
    const Utils = {
        // Debounce для ограничения частоты вызовов функций
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

        // Throttle для ограничения частоты выполнения функций
        throttle(func, limit) {
            let inThrottle;
            return function() {
                const args = arguments;
                const context = this;
                if (!inThrottle) {
                    func.apply(context, args);
                    inThrottle = true;
                    setTimeout(() => inThrottle = false, limit);
                }
            };
        },

        // Показ уведомлений с оптимизированной анимацией
        showNotification(message, type = 'success') {
            const notification = document.createElement('div');
            notification.className = `notification notification-${type}`;
            notification.textContent = message;
            
            // Оптимизированные стили
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
            
            // Анимация появления
            requestAnimationFrame(() => {
                notification.style.transform = 'translateX(0)';
            });
            
            // Автоматическое удаление
            setTimeout(() => {
                notification.style.transform = 'translateX(400px)';
                setTimeout(() => notification.remove(), 300);
            }, 3000);
        }
    };

    // Service Worker с оптимизированной регистрацией
    const ServiceWorker = {
        init() {
            if ('serviceWorker' in navigator && 
                (location.protocol === 'https:' || location.hostname === 'localhost')) {
                
                window.addEventListener('load', () => {
                    navigator.serviceWorker.register('/sw.js')
                        .then(registration => {
                            console.log('SW зарегистрирован:', registration);
                        })
                        .catch(error => {
                            console.log('SW регистрация не удалась:', error);
                        });
                });
            }
        }
    };

    // Оптимизированное управление темой
    const Theme = {
        current: null,
        
        init() {
            const savedTheme = localStorage.getItem('theme');
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            this.current = savedTheme || (prefersDark ? 'dark' : 'light');
            
            document.documentElement.setAttribute('data-theme', this.current);
            this.updateIcon();
            
            // Слушаем изменения системной темы
            window.matchMedia('(prefers-color-scheme: dark)')
                .addEventListener('change', (e) => {
                    if (!localStorage.getItem('theme')) {
                        this.current = e.matches ? 'dark' : 'light';
                        document.documentElement.setAttribute('data-theme', this.current);
                        this.updateIcon();
                    }
                });
        },

        toggle() {
            this.current = this.current === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', this.current);
            localStorage.setItem('theme', this.current);
            this.updateIcon();
            this.addTransition();
        },

        updateIcon() {
            if (DOMCache.themeIcon) {
                DOMCache.themeIcon.textContent = this.current === 'dark' ? '☀️' : '🌙';
            }
        },

        addTransition() {
            document.body.style.transition = 'background-color 0.3s ease, color 0.3s ease';
            setTimeout(() => document.body.style.transition = '', 300);
        }
    };

    // Оптимизированная навигация
    const Navigation = {
        init() {
            this.initSmoothScrolling();
            this.initBackToTop();
        },

        initSmoothScrolling() {
            // Используем делегирование событий для оптимизации
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

            // Используем throttle для оптимизации scroll события
            const handleScroll = Utils.throttle(() => {
                const isVisible = window.pageYOffset > 300;
                DOMCache.backToTopBtn.style.opacity = isVisible ? '1' : '0';
                DOMCache.backToTopBtn.style.visibility = isVisible ? 'visible' : 'hidden';
            }, 100);

            window.addEventListener('scroll', handleScroll, { passive: true });
        }
    };

    // Оптимизированное мобильное меню
    const MobileMenu = {
        isOpen: false,

        init() {
            if (!DOMCache.mobileMenu || !DOMCache.mobileMenuBtn) return;
            
            // Закрытие по клику вне меню
            document.addEventListener('click', (e) => {
                if (this.isOpen && 
                    !DOMCache.mobileMenu.contains(e.target) && 
                    !DOMCache.mobileMenuBtn.contains(e.target)) {
                    this.close();
                }
            });

            // Закрытие по Escape
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

    // Оптимизированные модальные окна
    const Modals = {
        init() {
            this.initContactModal();
            this.initPrivacyModal();
        },

        initContactModal() {
            if (!DOMCache.contactModal) return;

            const form = DOMCache.contactModal.querySelector('form');
            if (form) {
                form.addEventListener('submit', (e) => {
                    e.preventDefault();
                    Utils.showNotification('Сообщение отправлено! Мы свяжемся с вами в ближайшее время.');
                    this.closeContactModal();
                    form.reset();
                });
            }
        },

        initPrivacyModal() {
            if (!DOMCache.privacyModal) return;
            
            DOMCache.privacyModal.addEventListener('click', (e) => {
                if (e.target === DOMCache.privacyModal) {
                    this.closePrivacyModal();
                }
            });
        },

        openContactModal() {
            if (DOMCache.contactModal) {
                DOMCache.contactModal.style.display = 'block';
            }
        },

        closeContactModal() {
            if (DOMCache.contactModal) {
                DOMCache.contactModal.style.display = 'none';
            }
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

    // Оптимизированные формы
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

    // Оптимизированные анимации
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
                '.method-item, .feature-item, .support-card, .tip-box, .warning-box'
            );
            
            elements.forEach(el => {
                el.style.opacity = '0';
                el.style.transform = 'translateY(30px)';
                el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
                observer.observe(el);
            });
        }
    };

    // Оптимизированная проверка размера экрана
    const ScreenSize = {
        init() {
            this.checkScreenSize();
            window.addEventListener('resize', 
                Utils.debounce(() => this.checkScreenSize(), 250)
            );
        },

        checkScreenSize() {
            const isMobile = window.innerWidth <= 480;
            
            if (DOMCache.mobileMenuBtn) {
                DOMCache.mobileMenuBtn.style.display = isMobile ? 'flex' : 'none';
            }
            
            if (DOMCache.mobileMenu && !isMobile) {
                MobileMenu.close();
            }
        }
    };

    // Глобальные функции для HTML (сохранены для совместимости)
    window.toggleTheme = () => Theme.toggle();
    window.openContactForm = () => Modals.openContactModal();
    window.closeContactModal = () => Modals.closeContactModal();
    window.openMobileMenu = () => MobileMenu.open();
    window.closeMobileMenu = () => MobileMenu.close();
    window.showPrivacyPolicy = () => Modals.showPrivacyPolicy();
    window.closePrivacyModal = () => Modals.closePrivacyModal();
    window.clearBugForm = () => Forms.clearBugForm();

    // Оптимизированная инициализация
    document.addEventListener('DOMContentLoaded', () => {
        DOMCache.init();
        ServiceWorker.init();
        Theme.init();
        Navigation.init();
        MobileMenu.init();
        Modals.init();
        Forms.init();
        Animations.init();
        ScreenSize.init();
    });

})();