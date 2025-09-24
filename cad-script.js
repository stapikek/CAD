// CAD Application JavaScript
class CADApplication {
    constructor() {
        this.canvas = document.getElementById('drawingCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.currentTool = 'line';
        this.isDrawing = false;
        this.startX = 0;
        this.startY = 0;
        this.shapes = [];
        this.selectedShape = null;
        this.gridSize = 20;
        this.snapToGrid = true;
        this.currentFormat = 'A4';
        this.drawingTemplate = null;
        this.scale = 1;
        this.offsetX = 0;
        this.offsetY = 0;
        this.isPanning = false;
        this.lastPanX = 0;
        this.lastPanY = 0;
        this.currentObject = null;
        this.propertiesPanel = null;
        this.isMovingObject = false;
        this.dragStartX = 0;
        this.dragStartY = 0;
        this.originalObjectX = 0;
        this.originalObjectY = 0;
        
        // Дополнительные свойства для меню
        this.gridVisible = true;
        this.snapToGrid = false;
        this.clipboard = null;
        
        // Система истории для undo/redo
        this.history = [];
        this.historyIndex = -1;
        this.maxHistorySize = 50;
        
        // Стандартные размеры чертежных листов (в пикселях)
        this.formats = {
            'A4-H': { width: 800, height: 600, scale: 1, orientation: 'horizontal' },
            'A4-V': { width: 600, height: 800, scale: 1, orientation: 'vertical' },
            'A3-H': { width: 1200, height: 800, scale: 1.5, orientation: 'horizontal' },
            'A3-V': { width: 800, height: 1200, scale: 1.5, orientation: 'vertical' },
            'A2-H': { width: 1600, height: 1200, scale: 2, orientation: 'horizontal' },
            'A2-V': { width: 1200, height: 1600, scale: 2, orientation: 'vertical' },
            'A1-H': { width: 2000, height: 1600, scale: 2.5, orientation: 'horizontal' },
            'A1-V': { width: 1600, height: 2000, scale: 2.5, orientation: 'vertical' }
        };
        
        this.init();
    }

    init() {
        this.setupCanvas();
        this.setupEventListeners();
        this.setupToolbar();
        this.setupProperties();
        this.setupPropertiesPanel();
        this.drawGrid();
    }

    setupCanvas() {
        // Устанавливаем размеры canvas
        const container = this.canvas.parentElement;
        const rect = container.getBoundingClientRect();
        this.canvas.width = 800;
        this.canvas.height = 600;
        
        // Настройки контекста
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.ctx.strokeStyle = '#000000';
        this.ctx.fillStyle = '#000000';
        this.ctx.lineWidth = 1;
        
        // Создаем начальный шаблон A4
        this.createDrawingTemplate('A4-H');
        
        // Сохраняем начальное состояние
        this.saveState();
    }

    setupEventListeners() {
        // События мыши
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        this.canvas.addEventListener('dblclick', (e) => this.handleDoubleClick(e));
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault()); // Предотвращаем контекстное меню

        // События клавиатуры
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));

        // События изменения размера окна
        window.addEventListener('resize', () => this.handleResize());

        // События масштабирования
        this.canvas.addEventListener('wheel', (e) => this.handleWheel(e));
    }

    setupToolbar() {
        const toolButtons = document.querySelectorAll('.tool-btn[data-tool]');
        toolButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                // Убираем активный класс со всех кнопок
                toolButtons.forEach(b => b.classList.remove('active'));
                // Добавляем активный класс к выбранной кнопке
                btn.classList.add('active');
                
                this.currentTool = btn.dataset.tool;
                this.updateInputHint();
            });
        });

        // Кнопки файловых операций
        document.querySelector('.tool-btn[title="Новый файл"]').addEventListener('click', () => this.newFile());
        document.querySelector('.tool-btn[title="Сохранить"]').addEventListener('click', () => this.saveFile());
        document.querySelector('.tool-btn[title="Открыть"]').addEventListener('click', () => this.openFile());
        document.querySelector('.tool-btn[title="Отменить"]').addEventListener('click', () => this.undo());
        document.querySelector('.tool-btn[title="Повторить"]').addEventListener('click', () => this.redo());
        
        // Кнопки форматов листов
        // Обработка кнопок форматов
        document.querySelectorAll('.tool-btn[data-format]').forEach(btn => {
            btn.addEventListener('click', () => {
                const format = btn.getAttribute('data-format');
                this.createDrawingTemplate(format);
            });
        });
        
        // Кнопки масштабирования
        document.querySelector('.tool-btn[title="Приблизить"]').addEventListener('click', () => this.zoomIn());
        document.querySelector('.tool-btn[title="Отдалить"]').addEventListener('click', () => this.zoomOut());
        document.querySelector('.tool-btn[title="Сбросить масштаб"]').addEventListener('click', () => this.resetZoom());
        
        // Кнопка перемещения объектов
        document.querySelector('.tool-btn[title="Перемещение объектов"]').addEventListener('click', () => {
            this.currentTool = 'move-object';
            this.updateInputHint('Режим перемещения объектов. Кликните на объект и перетащите его.');
        });
    }

    setupProperties() {
        // Настройки по умолчанию
        this.ctx.lineWidth = 1;
        this.ctx.strokeStyle = '#000000';
        this.ctx.fillStyle = '#000000';
    }

    setupPropertiesPanel() {
        this.propertiesPanel = document.getElementById('propertiesPanel');
        const closeBtn = document.getElementById('closeProperties');
        const applyBtn = document.getElementById('applyProperties');
        const cancelBtn = document.getElementById('cancelProperties');

        closeBtn.addEventListener('click', () => this.hidePropertiesPanel());
        cancelBtn.addEventListener('click', () => this.hidePropertiesPanel());
        applyBtn.addEventListener('click', () => this.applyProperties());
    }

    handleMouseDown(e) {
        // Проверяем, не панорамируем ли мы
        if (this.isPanning) return;
        
        // Если нажата средняя кнопка мыши (колесико), начинаем панорамирование
        if (e.button === 1) {
            e.preventDefault();
            this.isPanning = true;
            this.lastPanX = e.clientX;
            this.lastPanY = e.clientY;
            this.canvas.style.cursor = 'grabbing';
            return;
        }
        
        const rect = this.canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left - this.offsetX) / this.scale;
        const y = (e.clientY - rect.top - this.offsetY) / this.scale;

        this.startX = this.snapToGrid ? this.snapToGridPoint(x) : x;
        this.startY = this.snapToGrid ? this.snapToGridPoint(y) : y;

        this.isDrawing = true;

        if (this.currentTool === 'select') {
            this.selectShape(x, y);
        } else if (this.currentTool === 'text') {
            this.addText(x, y);
        } else if (this.currentTool === 'pan') {
            // Для инструмента панорамирования используем левую кнопку мыши
            this.isPanning = true;
            this.lastPanX = e.clientX;
            this.lastPanY = e.clientY;
            this.canvas.style.cursor = 'grabbing';
        } else if (this.currentTool === 'move-object') {
            // Для перемещения объектов
            this.selectShape(x, y);
            if (this.selectedShape) {
                this.isMovingObject = true;
                this.dragStartX = x;
                this.dragStartY = y;
                // Сохраняем оригинальные координаты объекта
                this.originalObjectX = this.selectedShape.startX;
                this.originalObjectY = this.selectedShape.startY;
                this.canvas.style.cursor = 'grabbing';
            }
        }
    }

    handleMouseMove(e) {
        // Обрабатываем панорамирование
        if (this.isPanning) {
            e.preventDefault();
            
            const deltaX = e.clientX - this.lastPanX;
            const deltaY = e.clientY - this.lastPanY;
            
            this.offsetX += deltaX;
            this.offsetY += deltaY;
            
            this.lastPanX = e.clientX;
            this.lastPanY = e.clientY;
            
            this.redraw();
            return;
        }

        // Обрабатываем перемещение объектов
        if (this.isMovingObject && this.selectedShape) {
            e.preventDefault();
            
            const rect = this.canvas.getBoundingClientRect();
            const x = (e.clientX - rect.left - this.offsetX) / this.scale;
            const y = (e.clientY - rect.top - this.offsetY) / this.scale;
            
            const deltaX = x - this.dragStartX;
            const deltaY = y - this.dragStartY;
            
            // Для кругов и дуг перемещаем только центр
            if (this.selectedShape.type === 'circle' || this.selectedShape.type === 'arc-3-points' || this.selectedShape.type === 'arc-2-points') {
                // Для кругов перемещаем центр, сохраняя радиус
                const radius = Math.sqrt(Math.pow(this.selectedShape.endX - this.selectedShape.startX, 2) + 
                    Math.pow(this.selectedShape.endY - this.selectedShape.startY, 2));
                
                this.selectedShape.startX = this.originalObjectX + deltaX;
                this.selectedShape.startY = this.originalObjectY + deltaY;
                this.selectedShape.endX = this.selectedShape.startX + radius;
                this.selectedShape.endY = this.selectedShape.startY;
            } else {
                // Для остальных объектов сохраняем размеры
                const originalWidth = this.selectedShape.endX - this.selectedShape.startX;
                const originalHeight = this.selectedShape.endY - this.selectedShape.startY;
                
                this.selectedShape.startX = this.originalObjectX + deltaX;
                this.selectedShape.startY = this.originalObjectY + deltaY;
                this.selectedShape.endX = this.selectedShape.startX + originalWidth;
                this.selectedShape.endY = this.selectedShape.startY + originalHeight;
            }
            
            this.redraw();
            return;
        }

        if (!this.isDrawing) return;

        const rect = this.canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left - this.offsetX) / this.scale;
        const y = (e.clientY - rect.top - this.offsetY) / this.scale;

        const currentX = this.snapToGrid ? this.snapToGridPoint(x) : x;
        const currentY = this.snapToGrid ? this.snapToGridPoint(y) : y;

        // Очищаем canvas
        this.clearCanvas();
        
        // Применяем трансформации
        this.ctx.save();
        this.ctx.translate(this.offsetX, this.offsetY);
        this.ctx.scale(this.scale, this.scale);
        
        this.drawGrid();
        // Перерисовываем шаблон чертежного листа
        if (this.currentFormat) {
            this.drawDrawingTemplate(this.currentFormat);
        }
        this.redrawShapes();

        // Рисуем предварительный вид
        this.drawPreview(currentX, currentY);
        
        this.ctx.restore();
    }

    handleMouseUp(e) {
        // Завершаем панорамирование
        if (this.isPanning) {
            this.isPanning = false;
            this.canvas.style.cursor = 'crosshair';
            return;
        }

        // Завершаем перемещение объектов
        if (this.isMovingObject) {
            this.isMovingObject = false;
            this.canvas.style.cursor = 'crosshair';
            return;
        }

        if (!this.isDrawing) return;

        const rect = this.canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left - this.offsetX) / this.scale;
        const y = (e.clientY - rect.top - this.offsetY) / this.scale;

        const endX = this.snapToGrid ? this.snapToGridPoint(x) : x;
        const endY = this.snapToGrid ? this.snapToGridPoint(y) : y;

        this.isDrawing = false;

        if (this.currentTool !== 'select' && this.currentTool !== 'text' && this.currentTool !== 'pan') {
            this.createShape(endX, endY);
        }
    }

    handleDoubleClick(e) {
        if (this.currentTool === 'text') {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            this.addText(x, y);
        }
    }

    handleKeyDown(e) {
        if (e.key === 'Delete' && this.selectedShape) {
            this.deleteSelectedShape();
        } else if (e.key === 'Escape') {
            this.selectedShape = null;
            this.redraw();
        } else if (e.ctrlKey && e.key === 'z') {
            e.preventDefault();
            this.undo();
        } else if (e.ctrlKey && e.key === 'y') {
            e.preventDefault();
            this.redo();
        }
    }

    handleResize() {
        // Перерисовываем canvas при изменении размера
        this.redraw();
    }

    handleWheel(e) {
        // Проверяем, зажат ли Ctrl
        if (e.ctrlKey) {
            e.preventDefault(); // Предотвращаем масштабирование страницы
            
            const rect = this.canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            
            // Коэффициент масштабирования
            const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
            const newScale = this.scale * zoomFactor;
            
            // Ограничиваем масштаб
            if (newScale >= 0.1 && newScale <= 5) {
                // Вычисляем новое смещение для центрирования на курсоре
                this.offsetX = mouseX - (mouseX - this.offsetX) * zoomFactor;
                this.offsetY = mouseY - (mouseY - this.offsetY) * zoomFactor;
                
                this.scale = newScale;
                this.redraw();
                
                console.log(`Масштаб: ${(this.scale * 100).toFixed(0)}%`);
            }
        }
    }

    snapToGridPoint(value) {
        return Math.round(value / this.gridSize) * this.gridSize;
    }

    drawGrid() {
        this.ctx.save();
        this.ctx.strokeStyle = '#e0e0e0';
        this.ctx.lineWidth = 0.5;
        this.ctx.setLineDash([1, 1]);

        for (let x = 0; x <= this.canvas.width; x += this.gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }

        for (let y = 0; y <= this.canvas.height; y += this.gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }

        this.ctx.restore();
    }

    drawPreview(x, y) {
        this.ctx.save();
        this.ctx.strokeStyle = '#3498db';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);

        switch (this.currentTool) {
            case 'line':
            case 'vertical-line':
            case 'horizontal-line':
            case 'parallel-line':
                this.ctx.beginPath();
                this.ctx.moveTo(this.startX, this.startY);
                this.ctx.lineTo(x, y);
                this.ctx.stroke();
                break;
            case 'rectangle':
                this.ctx.strokeRect(this.startX, this.startY, x - this.startX, y - this.startY);
                break;
            case 'circle':
            case 'arc-3-points':
            case 'arc-2-points':
                const radius = Math.sqrt(Math.pow(x - this.startX, 2) + Math.pow(y - this.startY, 2));
                this.ctx.beginPath();
                this.ctx.arc(this.startX, this.startY, radius, 0, 2 * Math.PI);
                this.ctx.stroke();
                break;
            case 'spline':
                // Простая кривая Безье
                this.ctx.beginPath();
                this.ctx.moveTo(this.startX, this.startY);
                this.ctx.quadraticCurveTo((this.startX + x) / 2, (this.startY + y) / 2, x, y);
                this.ctx.stroke();
                break;
            case 'arrow':
                // Простая стрелка
                this.ctx.beginPath();
                this.ctx.moveTo(this.startX, this.startY);
                this.ctx.lineTo(x, y);
                this.ctx.stroke();
                // Наконечник стрелки
                const angle = Math.atan2(y - this.startY, x - this.startX);
                const arrowLength = 10;
                this.ctx.beginPath();
                this.ctx.moveTo(x, y);
                this.ctx.lineTo(x - arrowLength * Math.cos(angle - Math.PI / 6), y - arrowLength * Math.sin(angle - Math.PI / 6));
                this.ctx.moveTo(x, y);
                this.ctx.lineTo(x - arrowLength * Math.cos(angle + Math.PI / 6), y - arrowLength * Math.sin(angle + Math.PI / 6));
                this.ctx.stroke();
                break;
        }

        this.ctx.restore();
    }

    createShape(endX, endY) {
        const shape = {
            type: this.currentTool,
            startX: this.startX,
            startY: this.startY,
            endX: endX,
            endY: endY,
            lineWidth: this.ctx.lineWidth,
            strokeStyle: this.ctx.strokeStyle,
            fillStyle: this.ctx.fillStyle,
            id: Date.now()
        };

        this.shapes.push(shape);
        this.currentObject = shape;
        this.showPropertiesPanel(shape);
        
        // Сохраняем состояние после создания объекта
        this.saveState();
        
        this.redraw();
    }

    redrawShapes() {
        this.shapes.forEach(shape => {
            this.drawShape(shape);
        });
    }

    drawShape(shape) {
        this.ctx.save();
        this.ctx.lineWidth = shape.lineWidth;
        this.ctx.strokeStyle = shape.strokeStyle;
        this.ctx.fillStyle = shape.fillStyle;

        switch (shape.type) {
            case 'line':
            case 'vertical-line':
            case 'horizontal-line':
            case 'parallel-line':
                this.ctx.beginPath();
                this.ctx.moveTo(shape.startX, shape.startY);
                this.ctx.lineTo(shape.endX, shape.endY);
                this.ctx.stroke();
                break;
            case 'rectangle':
                this.ctx.strokeRect(shape.startX, shape.startY, 
                    shape.endX - shape.startX, shape.endY - shape.startY);
                break;
            case 'circle':
            case 'arc-3-points':
            case 'arc-2-points':
                const radius = Math.sqrt(Math.pow(shape.endX - shape.startX, 2) + 
                    Math.pow(shape.endY - shape.startY, 2));
                this.ctx.beginPath();
                this.ctx.arc(shape.startX, shape.startY, radius, 0, 2 * Math.PI);
                this.ctx.stroke();
                break;
            case 'spline':
                this.ctx.beginPath();
                this.ctx.moveTo(shape.startX, shape.startY);
                this.ctx.quadraticCurveTo((shape.startX + shape.endX) / 2, (shape.startY + shape.endY) / 2, shape.endX, shape.endY);
                this.ctx.stroke();
                break;
            case 'arrow':
                this.ctx.beginPath();
                this.ctx.moveTo(shape.startX, shape.startY);
                this.ctx.lineTo(shape.endX, shape.endY);
                this.ctx.stroke();
                // Наконечник стрелки
                const angle = Math.atan2(shape.endY - shape.startY, shape.endX - shape.startX);
                const arrowLength = 10;
                this.ctx.beginPath();
                this.ctx.moveTo(shape.endX, shape.endY);
                this.ctx.lineTo(shape.endX - arrowLength * Math.cos(angle - Math.PI / 6), shape.endY - arrowLength * Math.sin(angle - Math.PI / 6));
                this.ctx.moveTo(shape.endX, shape.endY);
                this.ctx.lineTo(shape.endX - arrowLength * Math.cos(angle + Math.PI / 6), shape.endY - arrowLength * Math.sin(angle + Math.PI / 6));
                this.ctx.stroke();
                break;
        }

        this.ctx.restore();
    }

    selectShape(x, y) {
        // Простой алгоритм выбора фигуры
        for (let i = this.shapes.length - 1; i >= 0; i--) {
            const shape = this.shapes[i];
            if (this.isPointInShape(x, y, shape)) {
                this.selectedShape = shape;
                this.highlightSelectedShape();
                // Показываем панель свойств только если НЕ в режиме перемещения объектов
                if (this.currentTool !== 'move-object') {
                    this.showPropertiesPanel(shape);
                }
                break;
            }
        }
    }

    isPointInShape(x, y, shape) {
        // Упрощенная проверка попадания точки в фигуру
        const tolerance = 10;
        
        switch (shape.type) {
            case 'line':
                const distance = Math.abs((y - shape.startY) * (shape.endX - shape.startX) - 
                    (x - shape.startX) * (shape.endY - shape.startY)) / 
                    Math.sqrt(Math.pow(shape.endX - shape.startX, 2) + Math.pow(shape.endY - shape.startY, 2));
                return distance < tolerance;
            case 'rectangle':
                return x >= Math.min(shape.startX, shape.endX) - tolerance &&
                       x <= Math.max(shape.startX, shape.endX) + tolerance &&
                       y >= Math.min(shape.startY, shape.endY) - tolerance &&
                       y <= Math.max(shape.startY, shape.endY) + tolerance;
            case 'circle':
                const radius = Math.sqrt(Math.pow(shape.endX - shape.startX, 2) + 
                    Math.pow(shape.endY - shape.startY, 2));
                const distanceFromCenter = Math.sqrt(Math.pow(x - shape.startX, 2) + 
                    Math.pow(y - shape.startY, 2));
                return Math.abs(distanceFromCenter - radius) < tolerance;
        }
        return false;
    }

    highlightSelectedShape() {
        if (this.selectedShape) {
            this.ctx.save();
            this.ctx.strokeStyle = '#e74c3c';
            this.ctx.lineWidth = 3;
            this.ctx.setLineDash([5, 5]);
            this.drawShape(this.selectedShape);
            this.ctx.restore();
        }
    }

    deleteSelectedShape() {
        if (this.selectedShape) {
            const index = this.shapes.indexOf(this.selectedShape);
            if (index > -1) {
                this.shapes.splice(index, 1);
                this.selectedShape = null;
                
                // Сохраняем состояние после удаления объекта
                this.saveState();
                
                this.redraw();
            }
        }
    }

    addText(x, y) {
        const text = prompt('Введите текст:');
        if (text) {
            this.ctx.save();
            this.ctx.font = '16px Arial';
            this.ctx.fillStyle = this.ctx.strokeStyle;
            this.ctx.fillText(text, x, y);
            this.ctx.restore();
        }
    }

    processCoordinateInput(input) {
        // Обработка ввода координат (например: "100,200" или "100 200")
        const coords = input.split(/[,\s]+/).map(Number);
        if (coords.length >= 2) {
            this.startX = coords[0];
            this.startY = coords[1];
            this.updateInputHint(`Точка установлена: (${this.startX}, ${this.startY})`);
        }
    }

    updateInputHint(message) {
        // Выводим сообщение в консоль, так как левая панель удалена
        console.log(message);
    }

    updateLineStyle(style) {
        switch (style) {
            case 'solid':
                this.ctx.setLineDash([]);
                break;
            case 'dashed':
                this.ctx.setLineDash([10, 5]);
                break;
            case 'dotted':
                this.ctx.setLineDash([2, 3]);
                break;
        }
    }

    clearCanvas() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    redraw() {
        this.clearCanvas();
        
        // Применяем трансформации
        this.ctx.save();
        this.ctx.translate(this.offsetX, this.offsetY);
        this.ctx.scale(this.scale, this.scale);
        
        this.drawGrid();
        // Перерисовываем шаблон чертежного листа
        if (this.currentFormat) {
            this.drawDrawingTemplate(this.currentFormat);
        }
        this.redrawShapes();
        if (this.selectedShape) {
            this.highlightSelectedShape();
        }
        
        this.ctx.restore();
    }

    // Файловые операции
    newFile() {
        if (confirm('Создать новый файл? Все несохраненные изменения будут потеряны.')) {
            this.shapes = [];
            this.selectedShape = null;
            this.scale = 1;
            this.offsetX = 0;
            this.offsetY = 0;
            this.redraw();
            this.updateInputHint('Новый файл создан');
        }
    }

    saveFile() {
        const data = {
            shapes: this.shapes,
            canvasWidth: this.canvas.width,
            canvasHeight: this.canvas.height
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'drawing.json';
        a.click();
        URL.revokeObjectURL(url);
        
        this.updateInputHint('Файл сохранен');
    }

    openFile() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const data = JSON.parse(e.target.result);
                        this.shapes = data.shapes || [];
                        this.redraw();
                        this.updateInputHint('Файл загружен');
                    } catch (error) {
                        alert('Ошибка при загрузке файла');
                    }
                };
                reader.readAsText(file);
            }
        };
        input.click();
    }

    undo() {
        if (this.shapes.length > 0) {
            this.shapes.pop();
            this.redraw();
            this.updateInputHint('Действие отменено');
        }
    }

    redo() {
        // Простая реализация - в реальном приложении нужен стек отмены
        this.updateInputHint('Функция повтора в разработке');
    }

    // Функции масштабирования
    zoomIn() {
        const newScale = this.scale * 1.2;
        if (newScale <= 5) {
            this.scale = newScale;
            this.redraw();
            console.log(`Масштаб: ${(this.scale * 100).toFixed(0)}%`);
        }
    }

    zoomOut() {
        const newScale = this.scale * 0.8;
        if (newScale >= 0.1) {
            this.scale = newScale;
            this.redraw();
            console.log(`Масштаб: ${(this.scale * 100).toFixed(0)}%`);
        }
    }

    resetZoom() {
        this.scale = 1;
        this.offsetX = 0;
        this.offsetY = 0;
        this.redraw();
        console.log('Масштаб сброшен: 100%');
    }

    // Функции панели свойств
    showPropertiesPanel(shape) {
        if (!this.propertiesPanel) return;
        
        // Вычисляем длину и угол для линии
        if (shape.type === 'line') {
            const length = Math.sqrt(Math.pow(shape.endX - shape.startX, 2) + Math.pow(shape.endY - shape.startY, 2));
            const angle = Math.atan2(shape.endY - shape.startY, shape.endX - shape.startX) * 180 / Math.PI;
            
            document.getElementById('objectLength').value = length.toFixed(2);
            document.getElementById('objectAngle').value = angle.toFixed(2);
        } else {
            document.getElementById('objectLength').value = '';
            document.getElementById('objectAngle').value = '';
        }
        
        document.getElementById('objectWidth').value = shape.lineWidth;
        document.getElementById('objectStyle').value = 'Основная';
        
        this.propertiesPanel.style.display = 'block';
    }

    hidePropertiesPanel() {
        if (this.propertiesPanel) {
            this.propertiesPanel.style.display = 'none';
        }
        this.currentObject = null;
    }

    applyProperties() {
        if (!this.currentObject) return;
        
        const length = parseFloat(document.getElementById('objectLength').value);
        const angle = parseFloat(document.getElementById('objectAngle').value);
        const width = parseFloat(document.getElementById('objectWidth').value);
        const style = document.getElementById('objectStyle').value;
        
        // Применяем свойства к объекту
        this.currentObject.lineWidth = width;
        
        // Если это линия и заданы длина и угол
        if (this.currentObject.type === 'line' && !isNaN(length) && !isNaN(angle)) {
            const radians = angle * Math.PI / 180;
            this.currentObject.endX = this.currentObject.startX + length * Math.cos(radians);
            this.currentObject.endY = this.currentObject.startY + length * Math.sin(radians);
        }
        
        // Обновляем выделение
        this.selectedShape = this.currentObject;
        
        // Применяем стиль линии
        this.applyLineStyle(style);
        
        this.redraw();
        this.hidePropertiesPanel();
        
        // Сохраняем состояние после изменения свойств
        this.saveState();
        
        console.log('Свойства применены:', { length, angle, width, style });
    }

    applyLineStyle(style) {
        switch (style) {
            case 'Основная':
                this.ctx.setLineDash([]);
                break;
            case 'Тонкая':
                this.ctx.setLineDash([]);
                this.ctx.lineWidth = 0.5;
                break;
            case 'Толстая':
                this.ctx.setLineDash([]);
                this.ctx.lineWidth = 2;
                break;
            case 'Пунктирная':
                this.ctx.setLineDash([5, 5]);
                break;
        }
    }

    // Функции меню
    showFileMenu() {
        const options = [
            'Новый файл',
            'Открыть файл',
            'Сохранить файл',
            'Сохранить как...',
            'Экспорт в PDF',
            'Печать'
        ];
        
        const choice = prompt(`Меню "Файл":\n\n${options.map((opt, i) => `${i + 1}. ${opt}`).join('\n')}\n\nВведите номер опции (1-6):`);
        
        switch(choice) {
            case '1':
                this.newFile();
                break;
            case '2':
                this.openFile();
                break;
            case '3':
                this.saveFile();
                break;
            case '4':
                this.saveFileAs();
                break;
            case '5':
                this.exportToPDF();
                break;
            case '6':
                this.printDrawing();
                break;
            default:
                console.log('Отменено');
        }
    }

    showViewMenu() {
        const options = [
            'Приблизить',
            'Отдалить',
            'Показать весь лист',
            'Сетка вкл/выкл',
            'Привязка к сетке вкл/выкл',
            'Полноэкранный режим'
        ];
        
        const choice = prompt(`Меню "Вид":\n\n${options.map((opt, i) => `${i + 1}. ${opt}`).join('\n')}\n\nВведите номер опции (1-6):`);
        
        switch(choice) {
            case '1':
                this.zoomIn();
                break;
            case '2':
                this.zoomOut();
                break;
            case '3':
                this.resetZoom();
                break;
            case '4':
                this.toggleGrid();
                break;
            case '5':
                this.toggleSnapToGrid();
                break;
            case '6':
                this.toggleFullscreen();
                break;
            default:
                console.log('Отменено');
        }
    }

    // Дополнительные функции для меню
    saveFileAs() {
        const fileName = prompt('Введите имя файла:', 'drawing');
        if (fileName) {
            this.saveFile();
            console.log(`Файл сохранен как: ${fileName}.json`);
        }
    }

    exportToPDF() {
        alert('Функция экспорта в PDF будет доступна в следующей версии!');
    }

    printDrawing() {
        window.print();
    }

    toggleGrid() {
        // Переключаем отображение сетки
        const gridVisible = !this.gridVisible;
        this.gridVisible = gridVisible;
        this.redraw();
        console.log(`Сетка: ${gridVisible ? 'включена' : 'выключена'}`);
    }

    toggleSnapToGrid() {
        this.snapToGrid = !this.snapToGrid;
        console.log(`Привязка к сетке: ${this.snapToGrid ? 'включена' : 'выключена'}`);
    }

    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    }

    showDrawingMenu() {
        const options = [
            'Линия',
            'Прямоугольник',
            'Круг',
            'Дуга по 3 точкам',
            'Дуга по 2 точкам',
            'Сплайн',
            'Штриховка',
            'Стрелка'
        ];
        
        const choice = prompt(`Меню "Рисование":\n\n${options.map((opt, i) => `${i + 1}. ${opt}`).join('\n')}\n\nВведите номер опции (1-8):`);
        
        const tools = ['line', 'rectangle', 'circle', 'arc-3-points', 'arc-2-points', 'spline', 'hatching', 'arrow'];
        if (choice && choice >= 1 && choice <= 8) {
            this.currentTool = tools[choice - 1];
            this.updateToolHint();
            console.log(`Выбран инструмент: ${options[choice - 1]}`);
        }
    }

    showEditorMenu() {
        const options = [
            'Копировать',
            'Вставить',
            'Вырезать',
            'Удалить',
            'Отменить',
            'Повторить',
            'Выделить все',
            'Очистить выделение'
        ];
        
        const choice = prompt(`Меню "Редактор":\n\n${options.map((opt, i) => `${i + 1}. ${opt}`).join('\n')}\n\nВведите номер опции (1-8):`);
        
        switch(choice) {
            case '1':
                this.copySelected();
                break;
            case '2':
                this.pasteObjects();
                break;
            case '3':
                this.cutSelected();
                break;
            case '4':
                this.deleteSelected();
                break;
            case '5':
                this.undo();
                break;
            case '6':
                this.redo();
                break;
            case '7':
                this.selectAll();
                break;
            case '8':
                this.clearSelection();
                break;
            default:
                console.log('Отменено');
        }
    }

    showDimensionsMenu() {
        const options = [
            'Линейный размер',
            'Угловой размер',
            'Радиальный размер',
            'Диаметральный размер',
            'Выноска',
            'Текст'
        ];
        
        const choice = prompt(`Меню "Размеры":\n\n${options.map((opt, i) => `${i + 1}. ${opt}`).join('\n')}\n\nВведите номер опции (1-6):`);
        
        const tools = ['linear-dimension', 'angular-dimension', 'radial-dimension', 'diameter-dimension', 'leader', 'text'];
        if (choice && choice >= 1 && choice <= 6) {
            this.currentTool = tools[choice - 1];
            this.updateToolHint();
            console.log(`Выбран инструмент: ${options[choice - 1]}`);
        }
    }

    showInsertMenu() {
        const options = [
            'Блок',
            'Изображение',
            'Текст',
            'Таблица',
            'Символ',
            'Шаблон'
        ];
        
        const choice = prompt(`Меню "Вставка":\n\n${options.map((opt, i) => `${i + 1}. ${opt}`).join('\n')}\n\nВведите номер опции (1-6):`);
        
        switch(choice) {
            case '1':
                this.insertBlock();
                break;
            case '2':
                this.insertImage();
                break;
            case '3':
                this.insertText();
                break;
            case '4':
                this.insertTable();
                break;
            case '5':
                this.insertSymbol();
                break;
            case '6':
                this.insertTemplate();
                break;
            default:
                console.log('Отменено');
        }
    }

    // Дополнительные функции для редактора
    copySelected() {
        if (this.selectedShape) {
            this.clipboard = JSON.parse(JSON.stringify(this.selectedShape));
            console.log('Объект скопирован');
        } else {
            console.log('Нет выделенного объекта');
        }
    }

    pasteObjects() {
        if (this.clipboard) {
            const newShape = JSON.parse(JSON.stringify(this.clipboard));
            newShape.startX += 20;
            newShape.startY += 20;
            newShape.endX += 20;
            newShape.endY += 20;
            this.shapes.push(newShape);
            
            // Сохраняем состояние после вставки объекта
            this.saveState();
            
            this.redraw();
            console.log('Объект вставлен');
        } else {
            console.log('Буфер обмена пуст');
        }
    }

    cutSelected() {
        if (this.selectedShape) {
            this.clipboard = JSON.parse(JSON.stringify(this.selectedShape));
            this.shapes = this.shapes.filter(shape => shape !== this.selectedShape);
            this.selectedShape = null;
            
            // Сохраняем состояние после вырезания объекта
            this.saveState();
            
            this.redraw();
            console.log('Объект вырезан');
        }
    }

    deleteSelected() {
        if (this.selectedShape) {
            this.shapes = this.shapes.filter(shape => shape !== this.selectedShape);
            this.selectedShape = null;
            
            // Сохраняем состояние после удаления объекта
            this.saveState();
            
            this.redraw();
            console.log('Объект удален');
        }
    }

    // Система истории для undo/redo
    saveState() {
        const state = {
            shapes: JSON.parse(JSON.stringify(this.shapes)),
            selectedShape: this.selectedShape ? JSON.parse(JSON.stringify(this.selectedShape)) : null,
            currentFormat: this.currentFormat,
            scale: this.scale,
            offsetX: this.offsetX,
            offsetY: this.offsetY
        };
        
        // Удаляем все состояния после текущего индекса
        this.history = this.history.slice(0, this.historyIndex + 1);
        
        // Добавляем новое состояние
        this.history.push(state);
        this.historyIndex++;
        
        // Ограничиваем размер истории
        if (this.history.length > this.maxHistorySize) {
            this.history.shift();
            this.historyIndex--;
        }
        
        console.log(`Сохранено состояние ${this.historyIndex + 1}/${this.history.length}`);
    }
    
    undo() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            this.restoreState(this.history[this.historyIndex]);
            console.log(`Отменено действие ${this.historyIndex + 1}/${this.history.length}`);
        } else {
            console.log('Нет действий для отмены');
        }
    }

    redo() {
        if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            this.restoreState(this.history[this.historyIndex]);
            console.log(`Повторено действие ${this.historyIndex + 1}/${this.history.length}`);
        } else {
            console.log('Нет действий для повтора');
        }
    }
    
    restoreState(state) {
        this.shapes = JSON.parse(JSON.stringify(state.shapes));
        this.selectedShape = state.selectedShape ? JSON.parse(JSON.stringify(state.selectedShape)) : null;
        this.currentFormat = state.currentFormat;
        this.scale = state.scale;
        this.offsetX = state.offsetX;
        this.offsetY = state.offsetY;
        
        // Перерисовываем canvas
        this.redraw();
        
        // Обновляем панель свойств если есть выделенный объект
        if (this.selectedShape) {
            this.highlightSelectedShape();
        }
    }

    selectAll() {
        this.selectedShape = this.shapes[this.shapes.length - 1];
        this.highlightSelectedShape();
        console.log('Все объекты выделены');
    }

    clearSelection() {
        this.selectedShape = null;
        this.redraw();
        console.log('Выделение очищено');
    }

    // Дополнительные функции для вставки
    insertBlock() {
        console.log('Функция вставки блока будет доступна в следующей версии!');
    }

    insertImage() {
        console.log('Функция вставки изображения будет доступна в следующей версии!');
    }

    insertText() {
        this.currentTool = 'text';
        this.updateToolHint();
        console.log('Выбран инструмент: Текст');
    }

    insertTable() {
        console.log('Функция вставки таблицы будет доступна в следующей версии!');
    }

    insertSymbol() {
        console.log('Функция вставки символа будет доступна в следующей версии!');
    }

    insertTemplate() {
        console.log('Функция вставки шаблона будет доступна в следующей версии!');
    }

    // Функции панорамирования



    // Создание чертежного шаблона
    createDrawingTemplate(format) {
        this.currentFormat = format;
        const formatData = this.formats[format];
        
        // Обновляем размеры canvas
        this.canvas.width = formatData.width;
        this.canvas.height = formatData.height;
        
        // Очищаем canvas
        this.clearCanvas();
        
        // Создаем шаблон
        this.drawDrawingTemplate(format);
        
        // Перерисовываем сетку и объекты
        this.drawGrid();
        this.redrawShapes();
        
        this.updateInputHint(`Создан чертежный лист ${format} (${formatData.orientation})`);
    }

    // Рисование чертежного шаблона
    drawDrawingTemplate(format) {
        const formatData = this.formats[format];
        const width = formatData.width;
        const height = formatData.height;
        const scale = formatData.scale;
        
        this.ctx.save();
        this.ctx.strokeStyle = '#0000ff'; // Синий цвет для рамки
        this.ctx.fillStyle = '#ffffff';
        this.ctx.lineWidth = 2;
        
        // Основная рамка чертежа
        const margin = 20 * scale;
        const frameX = margin;
        const frameY = margin;
        const frameWidth = width - 2 * margin;
        const frameHeight = height - 2 * margin;
        
        // Рисуем основную рамку
        this.ctx.strokeRect(frameX, frameY, frameWidth, frameHeight);
        
        // Рисуем штамп (основной)
        this.drawMainTitleBlock(format, frameX, frameY, frameWidth, frameHeight, scale);
        
        this.ctx.restore();
    }

    // Рисование основного штампа (справа внизу)
    drawMainTitleBlock(format, frameX, frameY, frameWidth, frameHeight, scale) {
        const stampWidth = 140 * scale;
        const stampHeight = 55 * scale;
        const stampX = frameX + frameWidth - stampWidth;
        const stampY = frameY + frameHeight - stampHeight;
        
        // Основной штамп
        this.ctx.strokeRect(stampX, stampY, stampWidth, stampHeight);
        
        // Вертикальные линии в штампе
        const leftColWidth = 20 * scale;
        this.ctx.beginPath();
        this.ctx.moveTo(stampX + leftColWidth, stampY);
        this.ctx.lineTo(stampX + leftColWidth, stampY + stampHeight);
        this.ctx.stroke();
        
        // Горизонтальные линии
        const rowHeight = 11 * scale;
        for (let i = 1; i <= 4; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(stampX, stampY + i * rowHeight);
            this.ctx.lineTo(stampX + stampWidth, stampY + i * rowHeight);
            this.ctx.stroke();
        }
        
        // Дополнительные вертикальные линии
        const colWidths = [20, 25, 25, 25, 25, 20] * scale;
        let currentX = stampX + leftColWidth;
        for (let i = 0; i < colWidths.length; i++) {
            currentX += colWidths[i];
            this.ctx.beginPath();
            this.ctx.moveTo(currentX, stampY);
            this.ctx.lineTo(currentX, stampY + stampHeight);
            this.ctx.stroke();
        }
        
        // Подписи в штампе
        this.ctx.save();
        this.ctx.fillStyle = '#000000';
        this.ctx.font = `${8 * scale}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        // Левая колонка
        const leftLabels = ['Изм.', 'Лист', '№ докум.', 'Подп.', 'Дата'];
        for (let i = 0; i < leftLabels.length; i++) {
            this.ctx.fillText(leftLabels[i], stampX + leftColWidth/2, stampY + (i + 0.5) * rowHeight);
        }
        
        // Основные подписи
        const mainLabels = ['Разраб.', 'Пров.', 'Т. контр.', 'Н. контр.', 'Утв.'];
        let labelX = stampX + leftColWidth + 12.5 * scale;
        for (let i = 0; i < mainLabels.length; i++) {
            this.ctx.fillText(mainLabels[i], labelX, stampY + (i + 0.5) * rowHeight);
            labelX += 25 * scale;
        }
        
        // Правая часть
        this.ctx.fillText('Лит.', stampX + leftColWidth + 125 * scale, stampY + 0.5 * rowHeight);
        this.ctx.fillText('Масса', stampX + leftColWidth + 125 * scale, stampY + 1.5 * rowHeight);
        this.ctx.fillText('Масштаб', stampX + leftColWidth + 125 * scale, stampY + 2.5 * rowHeight);
        this.ctx.fillText('1:1', stampX + leftColWidth + 125 * scale, stampY + 3.5 * rowHeight);
        this.ctx.fillText('Лист', stampX + leftColWidth + 125 * scale, stampY + 4.5 * rowHeight);
        this.ctx.fillText('Листов', stampX + leftColWidth + 125 * scale, stampY + 5.5 * rowHeight);
        
        this.ctx.restore();
    }

}

// Инициализация приложения
document.addEventListener('DOMContentLoaded', () => {
    const cadApp = new CADApplication();
    
    // Обработка выпадающих меню
    document.querySelectorAll('.dropdown-menu a[data-tool]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const tool = link.getAttribute('data-tool');
            cadApp.currentTool = tool;
            cadApp.updateInputHint(`Выбран инструмент: ${link.textContent}`);
            
            // Обновляем активный инструмент в панели
            document.querySelectorAll('.tool-btn').forEach(btn => btn.classList.remove('active'));
            const toolBtn = document.querySelector(`[data-tool="${tool}"]`);
            if (toolBtn) {
                toolBtn.classList.add('active');
            }
        });
    });

    // Обработка форматов листов в подменю
    document.querySelectorAll('.submenu a[data-format]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const format = link.getAttribute('data-format');
            cadApp.createDrawingTemplate(format);
        });
    });

    // Обработка кнопок меню
    document.querySelectorAll('.menu-item:not(.dropdown-toggle)').forEach(btn => {
        btn.addEventListener('click', () => {
            const menuName = btn.textContent;
            
            switch(menuName) {
                case 'Файл':
                    this.showFileMenu();
                    break;
                case 'Вид':
                    this.showViewMenu();
                    break;
                case 'Рисование':
                    this.showDrawingMenu();
                    break;
                case 'Редактор':
                    this.showEditorMenu();
                    break;
                case 'Размеры':
                    this.showDimensionsMenu();
                    break;
                case 'Вставка':
                    this.showInsertMenu();
                    break;
                default:
                    alert(`Функция "${menuName}" будет доступна в следующей версии!`);
            }
        });
    });
});
