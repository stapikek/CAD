// Плавная прокрутка для якорных ссылок
document.addEventListener('DOMContentLoaded', function() {
    // Обработка кликов по навигационным ссылкам
    const navLinks = document.querySelectorAll('.nav-menu a, .footer-links a');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Обработка кнопки "Вверх"
    const backToTop = document.querySelector('.back-to-top a');
    if (backToTop) {
        backToTop.addEventListener('click', function(e) {
            e.preventDefault();
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

    // Показ/скрытие кнопки "Вверх" при прокрутке
    window.addEventListener('scroll', function() {
        const backToTop = document.querySelector('.back-to-top');
        if (backToTop) {
            if (window.scrollY > 300) {
                backToTop.style.opacity = '1';
                backToTop.style.visibility = 'visible';
            } else {
                backToTop.style.opacity = '0';
                backToTop.style.visibility = 'hidden';
            }
        }
    });

    // Анимация появления элементов при прокрутке
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Наблюдение за секциями
    const sections = document.querySelectorAll('.methods-section, .online-section, .programs-section');
    sections.forEach(section => {
        section.style.opacity = '0';
        section.style.transform = 'translateY(30px)';
        section.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(section);
    });

    // Обработка кнопок действий
    const actionButtons = document.querySelectorAll('.btn-primary, .btn-secondary, .btn-highlight');
    actionButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Добавляем эффект пульсации
            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = '';
            }, 150);

            // Проверяем, есть ли onclick атрибут
            if (this.onclick) {
                // Если есть onclick, выполняем его
                this.onclick();
            } else {
                // Иначе показываем уведомление
                showNotification('Функция в разработке! Скоро будет доступна.');
            }
        });
    });

    // Обработка кнопки "ЗАДАТЬ ВОПРОС"
    const askQuestionBtn = document.querySelector('.ask-question-btn');
    if (askQuestionBtn) {
        askQuestionBtn.addEventListener('click', function() {
            showNotification('Форма обратной связи будет добавлена в следующей версии!');
        });
    }

    // Функция показа уведомлений
    function showNotification(message) {
        // Создаем элемент уведомления
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(45deg, #27ae60, #2ecc71);
            color: white;
            padding: 15px 25px;
            border-radius: 25px;
            box-shadow: 0 5px 20px rgba(0,0,0,0.2);
            z-index: 1000;
            font-weight: bold;
            transform: translateX(400px);
            transition: transform 0.3s ease;
        `;

        document.body.appendChild(notification);

        // Анимация появления
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        // Автоматическое скрытие через 3 секунды
        setTimeout(() => {
            notification.style.transform = 'translateX(400px)';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    // Эффект параллакса для hero-секции
    window.addEventListener('scroll', function() {
        const heroSection = document.querySelector('.hero-section');
        if (heroSection) {
            const scrolled = window.pageYOffset;
            const rate = scrolled * -0.5;
            heroSection.style.transform = `translateY(${rate}px)`;
        }
    });

    // Добавление эффекта печатания для заголовка
    const heroTitle = document.querySelector('.hero-section h1');
    if (heroTitle) {
        const originalText = heroTitle.textContent;
        heroTitle.textContent = '';
        
        let i = 0;
        const typeWriter = () => {
            if (i < originalText.length) {
                heroTitle.textContent += originalText.charAt(i);
                i++;
                setTimeout(typeWriter, 100);
            }
        };
        
        setTimeout(typeWriter, 500);
    }

    // Подсветка активной секции в навигации
    const sectionsForNav = document.querySelectorAll('section[id]');
    const navItems = document.querySelectorAll('.nav-menu a');

    window.addEventListener('scroll', function() {
        let current = '';
        sectionsForNav.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            if (window.scrollY >= (sectionTop - 200)) {
                current = section.getAttribute('id');
            }
        });

        navItems.forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('href') === '#' + current) {
                item.classList.add('active');
            }
        });
    });
});

// Дополнительные стили для активной навигации
const style = document.createElement('style');
style.textContent = `
    .nav-menu a.active {
        color: #3498db !important;
        background-color: rgba(52, 152, 219, 0.1) !important;
        border-radius: 4px;
    }
    
    .back-to-top {
        transition: opacity 0.3s ease, visibility 0.3s ease;
    }
`;
document.head.appendChild(style);
