
// Versioning to prevent ghosting of old lines/fills
const DATA_VERSION = 'v5_unicorns'; // Bump version

// Configuration
const PALETTE = [
    '#FF3B30', '#FF9500', '#FFCC00', '#4CD964',
    '#5AC8FA', '#007AFF', '#5856D6', '#FF2D55',
    '#A2845E', '#8E8E93', '#000000', '#FFFFFF',
    // New Colors
    '#FF69B4', // Hot Pink
    // Pastels
    '#FFB3BA', '#FFDFBA', '#FFFFBA', '#BAFFC9', '#BAE1FF', '#E2BAFF'
];
const TOLERANCE = 50; // Color matching tolerance

// State
let state = {
    currentIndex: 0,
    currentColor: PALETTE[0],
    currentTool: 'brush', // Default to brush for immediate fun
    brushSize: 30,
    textChar: 'A',
    isDirty: false,
    isReady: false
};

function checkVersion() {
    const savedVersion = localStorage.getItem('app_version');
    if (savedVersion !== DATA_VERSION) {
        localStorage.clear();
        localStorage.setItem('app_version', DATA_VERSION);
    }
}

// Check before anything else
checkVersion();

// DOM Elements
const canvas = document.getElementById('drawing-layer');
const ctx = canvas.getContext('2d', { willReadFrequently: true });
const lineArtImg = document.getElementById('line-art-layer');
const paletteContainer = document.getElementById('color-palette');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const pageNr = document.getElementById('page-indicator');
const clearBtn = document.getElementById('clear-btn');

// Initialization
// Initialization
function init() {
    setupPalette();
    setupCanvas();
    loadState();
    updateToolUI();
    renderPage();
    setupGallery(); // Build the gallery once
    // --- iOS Gesture Blocking ---
    document.addEventListener('gesturestart', function (e) { e.preventDefault(); });
    document.addEventListener('dblclick', function (e) { e.preventDefault(); }, { passive: false });

    // Prevent double-tap zoom on links/buttons
    let lastTouchEnd = 0;
    document.addEventListener('touchend', function (e) {
        const now = (new Date()).getTime();
        if (now - lastTouchEnd <= 300) {
            e.preventDefault();
        }
        lastTouchEnd = now;
    }, false);

    // Prevent long-press context menu
    window.oncontextmenu = function (event) {
        event.preventDefault();
        event.stopPropagation();
        return false;
    };
    // ----------------------------

    attachEventListeners();
}

function setupPalette() {
    PALETTE.forEach(color => {
        const btn = document.createElement('div');
        btn.className = 'control-btn color-btn';
        btn.style.backgroundColor = color;
        btn.dataset.color = color;
        if (color === state.currentColor) btn.classList.add('active');

        btn.addEventListener('pointerdown', (e) => {
            e.preventDefault();
            selectColor(color, btn);
        });
        paletteContainer.appendChild(btn);
    });
}

function selectColor(color, btnElement) {
    state.currentColor = color;
    document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
    if (btnElement) btnElement.classList.add('active');
}

function updateToolUI() {
    document.getElementById('tool-brush').classList.toggle('active', state.currentTool === 'brush');
    document.getElementById('tool-fill').classList.toggle('active', state.currentTool === 'fill');
    document.getElementById('tool-eraser').classList.toggle('active', state.currentTool === 'eraser');
    document.getElementById('tool-eraser').classList.toggle('active', state.currentTool === 'eraser');
    document.getElementById('tool-rainbow').classList.toggle('active', state.currentTool === 'rainbow');
    document.getElementById('tool-text').classList.toggle('active', state.currentTool === 'text');
}

function setupCanvas() {
    // Set canvas size to match the container's aspect ratio or fixed size
    // For simplicity, we'll match the SVG viewbox 500x500 but scale it up
    canvas.width = 1000;
    canvas.height = 1000;
    // CSS handles the display size
}

function renderPage() {
    const asset = ASSETS[state.currentIndex];

    // Handle Image Assets
    if (asset.type === 'blank') {
        lineArtImg.style.display = 'none'; // Hide outline for free draw
    } else if (asset.type === 'image') {
        lineArtImg.style.display = 'block';
        lineArtImg.src = asset.src;
    } else {
        lineArtImg.style.display = 'block';
        // Fallback for Inline SVG (if we keep any)
        const blob = new Blob([asset.svg], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        lineArtImg.src = url;
    }

    loadCanvasState();
}

function loadCanvasState() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Check local storage for saved painting
    const saved = localStorage.getItem(`drawing_${state.currentIndex}`);
    const imgPromise = new Promise((resolve) => {
        if (saved) {
            const img = new Image();
            img.onload = () => {
                ctx.drawImage(img, 0, 0);
                resolve();
            };
            img.src = saved;
        } else {
            resolve();
        }
    });

    // 2. Load logic
    imgPromise.then(() => {
        if (saved) {
            // If we restored a drawing, it already has lines (baked in).
            // We just set ready.
            state.isReady = true;
        } else {
            // No save, draw the fresh template
            drawLinesToCanvas().then(() => {
                state.isReady = true;
            });
        }
    });
}

function drawLinesToCanvas() {
    return new Promise((resolve) => {
        const asset = ASSETS[state.currentIndex];
        const img = new Image();

        // Common onload/onerror handlers
        const handleImageLoad = () => {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            resolve();
        };
        const handleImageError = () => {
            console.error("Failed to load asset image for canvas drawing.");
            resolve(); // Resolve anyway so app doesn't hang
        };

        img.onload = handleImageLoad;
        img.onerror = handleImageError;

        // Handle Source
        if (asset.type === 'image') {
            img.src = asset.src;
        } else {
            const svgBlob = new Blob([asset.svg], { type: 'image/svg+xml;charset=utf-8' });
            const url = URL.createObjectURL(svgBlob);
            img.src = url;
            // Revoke after load to save memory
            // Overwrite onload to include revokeObjectURL
            img.onload = () => {
                handleImageLoad(); // Call original load handler
                URL.revokeObjectURL(url);
            }
            // onerror remains the same
        }
    });
}

function saveCanvasState() {
    const data = canvas.toDataURL();
    localStorage.setItem(`drawing_${state.currentIndex}`, data);
    localStorage.setItem('coloring_book_state', JSON.stringify({
        currentIndex: state.currentIndex,
        currentColor: state.currentColor
    }));
}

function loadState() {
    const raw = localStorage.getItem('coloring_book_state');
    if (raw) {
        const data = JSON.parse(raw);
        state.currentIndex = data.currentIndex || 0;
        state.currentColor = data.currentColor || PALETTE[0];

        // Select the button visually
        document.querySelectorAll('.color-btn').forEach(btn => {
            if (btn.dataset.color === state.currentColor) btn.classList.add('active');
            else btn.classList.remove('active');
        });
    }
    updatePageIndicator();
}

function updatePageIndicator() {
    pageNr.textContent = `${state.currentIndex + 1}/${ASSETS.length}`;
}

// Tools
const TOOL_BRUSH = 'brush';
const TOOL_FILL = 'fill';
const TOOL_ERASER = 'eraser';
const TOOL_RAINBOW = 'rainbow';
const TOOL_TEXT = 'text';

function attachEventListeners() {
    // Navigation
    prevBtn.addEventListener('pointerdown', (e) => { e.preventDefault(); changePage(-1); });
    nextBtn.addEventListener('pointerdown', (e) => { e.preventDefault(); changePage(1); });

    // Global Tools
    clearBtn.addEventListener('pointerdown', (e) => { e.preventDefault(); clearCanvas(); });

    document.getElementById('tool-brush').addEventListener('pointerdown', (e) => { e.preventDefault(); setTool(TOOL_BRUSH); });
    document.getElementById('tool-fill').addEventListener('pointerdown', (e) => { e.preventDefault(); setTool(TOOL_FILL); });
    document.getElementById('tool-eraser').addEventListener('pointerdown', (e) => { e.preventDefault(); setTool(TOOL_ERASER); });
    document.getElementById('tool-rainbow').addEventListener('pointerdown', (e) => { e.preventDefault(); setTool(TOOL_RAINBOW); });
    document.getElementById('tool-text').addEventListener('pointerdown', (e) => { e.preventDefault(); setTool(TOOL_TEXT); });
    document.getElementById('tool-gallery').addEventListener('pointerdown', (e) => { e.preventDefault(); openGallery(); });
    document.getElementById('close-gallery').addEventListener('pointerdown', (e) => { e.preventDefault(); closeGallery(); });
    document.getElementById('finish-btn').addEventListener('pointerdown', (e) => { e.preventDefault(); fireConfetti(); });

    // Settings
    const charInput = document.getElementById('char-input');
    const sizeSlider = document.getElementById('size-slider');

    if (charInput) {
        charInput.addEventListener('input', (e) => {
            if (e.target.value) state.textChar = e.target.value.charAt(0);
        });
    }
    if (sizeSlider) {
        sizeSlider.addEventListener('input', (e) => {
            state.brushSize = parseInt(e.target.value, 10);
        });
    }

    // Canvas Pointer Events
    canvas.addEventListener('pointerdown', handlePointerDown);
    canvas.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
}

function setTool(tool) {
    state.currentTool = tool;
    document.getElementById('tool-brush').classList.toggle('active', tool === TOOL_BRUSH);
    document.getElementById('tool-fill').classList.toggle('active', tool === TOOL_FILL);
    document.getElementById('tool-eraser').classList.toggle('active', tool === TOOL_ERASER);
    document.getElementById('tool-eraser').classList.toggle('active', tool === TOOL_ERASER);
    document.getElementById('tool-rainbow').classList.toggle('active', tool === TOOL_RAINBOW);
    document.getElementById('tool-text').classList.toggle('active', tool === TOOL_TEXT);
}

// Drawing State
let isDrawing = false;
let lastX = 0;
let lastY = 0;

function handlePointerDown(e) {
    if (!state.isReady) return;
    if (!e.isPrimary) return;

    const { x, y } = getCoords(e);

    if (state.currentTool === TOOL_FILL) {
        floodFill(x, y, state.currentColor);
        saveCanvasState();
    } else if (state.currentTool === TOOL_TEXT) {
        isDrawing = true;
        lastX = x;
        lastY = y;
        stampText(x, y);
    } else {
        isDrawing = true;
        lastX = x;
        lastY = y;
        // Draw single dot
        drawCircle(x, y);
    }
}

function handlePointerMove(e) {
    if (!isDrawing) return;
    if (!e.isPrimary) return;

    const { x, y } = getCoords(e);

    if (state.currentTool === TOOL_TEXT) {
        const dist = Math.hypot(x - lastX, y - lastY);
        // Only stamp if moved enough (based on brush size to avoid clumping)
        const threshold = Math.max(state.brushSize * 0.6, 10);
        if (dist > threshold) {
            stampText(x, y);
            lastX = x;
            lastY = y;
        }
    } else {
        drawLine(lastX, lastY, x, y);
        lastX = x;
        lastY = y;
    }
}

function handlePointerUp(e) {
    if (isDrawing) {
        isDrawing = false;
        saveCanvasState();
    }
}

function getCoords(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
        x: Math.floor((e.clientX - rect.left) * scaleX),
        y: Math.floor((e.clientY - rect.top) * scaleY)
    };
}

function drawLine(x1, y1, x2, y2) {
    ctx.beginPath();

    if (state.currentTool === TOOL_ERASER) {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.strokeStyle = 'rgba(0,0,0,1)'; // Color doesn't matter for erase
    } else if (state.currentTool === TOOL_RAINBOW) {
        ctx.globalCompositeOperation = 'source-over';
        const hue = (Date.now() / 5) % 360;
        ctx.strokeStyle = `hsl(${hue}, 100%, 50%)`;
    } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = state.currentColor;
    }

    ctx.lineWidth = state.brushSize; // Use dynamic size
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    // No closePath here for continuous lines
}

function stampText(x, y) {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `bold ${state.brushSize}px "Fredoka", sans-serif`;

    // Rainbow logic for text
    const hue = (Date.now() / 5) % 360;
    ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;

    ctx.fillText(state.textChar, x, y);
    ctx.restore();
}

function drawCircle(x, y) {
    if (state.currentTool === TOOL_ERASER) {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.fillStyle = 'rgba(0,0,0,1)';
    } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = state.currentColor;
    }

    ctx.beginPath();
    ctx.arc(x, y, state.brushSize / 2, 0, Math.PI * 2);
    ctx.fill();
    // Reset comp op for safety, though drawLine handles it too
    ctx.globalCompositeOperation = 'source-over';
}

function changePage(delta) {
    const newIndex = state.currentIndex + delta;
    if (newIndex >= 0 && newIndex < ASSETS.length) {
        state.currentIndex = newIndex;
        updatePageIndicator();
        renderPage();
        saveCanvasState(); // Save global state (index)
    }
}

function clearCanvas() {
    // Clear fills but keep lines
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    localStorage.removeItem(`drawing_${state.currentIndex}`);
    drawLinesToCanvas(); // Redraw lines
}

// Flood Fill Algorithm
// Scanline Flood Fill Algorithm
function floodFill(startX, startY, hexColor) {
    // Convert hex to RGBA
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);
    const fillColor = { r, g, b, a: 255 };

    let imageData;
    try {
        imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    } catch (e) {
        console.error("Flood Fill Error (likely CORS/Tainted Canvas):", e);
        alert("⚠️ Security Restriction\n\nSmart Fill doesn't work when running directly from a file due to browser security.\n\nPlease install as an App (Add to Home Screen) or use a local server.");
        return;
    }
    const pixelData = imageData.data;
    const width = canvas.width;
    const height = canvas.height;

    const startPos = (startY * width + startX) * 4;
    const startR = pixelData[startPos];
    const startG = pixelData[startPos + 1];
    const startB = pixelData[startPos + 2];
    const startA = pixelData[startPos + 3];

    // Don't fill if color is same
    if (colorsMatch(r, g, b, 255, startR, startG, startB, startA)) return;

    const stack = [[startX, startY]];

    while (stack.length) {
        let [x, y] = stack.pop();
        let pixelPos = (y * width + x) * 4;

        // Move up as long as we match (shouldn't need this with span logic, but for safety of initial point)
        // Standard scanline: find left and right edges

        let x1 = x;
        while (x1 >= 0 && shouldFill(pixelData, (y * width + x1) * 4, startR, startG, startB, startA)) {
            x1--;
        }
        x1++; // Back to valid pixel

        let x2 = x;
        while (x2 < width && shouldFill(pixelData, (y * width + x2) * 4, startR, startG, startB, startA)) {
            x2++;
        }
        x2--; // Back to valid pixel

        // Fill the span
        for (let i = x1; i <= x2; i++) {
            const pos = (y * width + i) * 4;
            pixelData[pos] = r;
            pixelData[pos + 1] = g;
            pixelData[pos + 2] = b;
            pixelData[pos + 3] = 255;
        }

        // Check above and below
        scanLine(x1, x2, y + 1, stack, width, height, pixelData, startR, startG, startB, startA);
        scanLine(x1, x2, y - 1, stack, width, height, pixelData, startR, startG, startB, startA);
    }

    ctx.putImageData(imageData, 0, 0);
    saveCanvasState(); // Auto-save after fill
}

function scanLine(x1, x2, y, stack, width, height, pixelData, sr, sg, sb, sa) {
    if (y < 0 || y >= height) return;
    let spanAdded = false;
    for (let x = x1; x <= x2; x++) {
        const pos = (y * width + x) * 4;
        const match = shouldFill(pixelData, pos, sr, sg, sb, sa);
        if (!spanAdded && match) {
            stack.push([x, y]);
            spanAdded = true;
        } else if (spanAdded && !match) {
            spanAdded = false;
        }
    }
}

function shouldFill(pixelData, pos, sr, sg, sb, sa) {
    const r = pixelData[pos];
    const g = pixelData[pos + 1];
    const b = pixelData[pos + 2];
    // Ignore alpha for matching mostly, but keep it strict if needed. 
    // Usually line art is black (low RGB) on white/transparent.

    // Strict match on the start color
    return colorsMatch(r, g, b, pixelData[pos + 3], sr, sg, sb, sa);
}

function colorsMatch(r1, g1, b1, a1, r2, g2, b2, a2) {
    const dr = Math.abs(r1 - r2);
    const dg = Math.abs(g1 - g2);
    const db = Math.abs(b1 - b2);
    // Relaxed tolerance 
    const RELAXED_TOLERANCE = 80;
    return dr < RELAXED_TOLERANCE && dg < RELAXED_TOLERANCE && db < RELAXED_TOLERANCE;
}

// Confetti Effect
function fireConfetti() {
    const canvas = document.getElementById('confetti-layer');
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = [];
    const colors = ['#FF9500', '#FF3B30', '#4CD964', '#5AC8FA', '#007AFF', '#5856D6', '#FF2D55'];

    for (let i = 0; i < 150; i++) {
        particles.push({
            x: canvas.width / 2,
            y: canvas.height / 2,
            xv: (Math.random() - 0.5) * 20,
            yv: (Math.random() - 0.5) * 20 - 10,
            color: colors[Math.floor(Math.random() * colors.length)],
            size: Math.random() * 10 + 5,
            rotation: Math.random() * 360
        });
    }

    let frame = 0;
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        let active = false;
        particles.forEach(p => {
            p.x += p.xv;
            p.y += p.yv;
            p.yv += 0.5; // Gravity
            p.rotation += 5;

            if (p.y < canvas.height + 50) {
                active = true;
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rotation * Math.PI / 180);
                ctx.fillStyle = p.color;
                ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
                ctx.restore();
            }
        });

        if (active && frame < 300) {
            frame++;
            requestAnimationFrame(animate);
        } else {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    }
    animate();
}

// Gallery Logic
function openGallery() {
    document.getElementById('gallery-modal').classList.remove('hidden');
}

function closeGallery() {
    document.getElementById('gallery-modal').classList.add('hidden');
}

function setupGallery() {
    const grid = document.getElementById('gallery-grid');
    grid.innerHTML = '';

    // Group by Category
    const categories = {};
    ASSETS.forEach((asset, index) => {
        const cat = asset.category || 'Misc';
        if (!categories[cat]) categories[cat] = [];
        categories[cat].push({ asset, index });
    });

    // Render Groups
    Object.keys(categories).forEach(cat => {
        const section = document.createElement('div');
        section.className = 'gallery-section';

        const title = document.createElement('div');
        title.className = 'gallery-title';
        title.textContent = cat;
        section.appendChild(title);

        const itemsDiv = document.createElement('div');
        itemsDiv.className = 'gallery-items';

        categories[cat].forEach(item => {
            const el = document.createElement('div');
            el.className = 'gallery-item';
            if (item.index === state.currentIndex) el.classList.add('active');

            // Thumb
            const img = document.createElement('img');
            img.className = 'gallery-thumb';
            // Use src or a placeholder for blank
            img.src = item.asset.type === 'blank' ? 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="white" stroke="%23ddd" stroke-width="2"/><text x="50" y="50" text-anchor="middle" dy=".3em" fill="%23ccc">Blank</text></svg>' : item.asset.src;

            const label = document.createElement('div');
            label.className = 'gallery-label';
            label.textContent = item.asset.name;

            el.appendChild(img);
            el.appendChild(label);

            el.addEventListener('pointerdown', (e) => {
                // Select and close
                state.currentIndex = item.index;
                renderPage();
                updatePageIndicator();
                closeGallery();

                // Update active state visual in menu for next time
                document.querySelectorAll('.gallery-item').forEach(i => i.classList.remove('active'));
                el.classList.add('active');
            });

            itemsDiv.appendChild(el);
        });

        section.appendChild(itemsDiv);
        grid.appendChild(section);
    });
}

// Start
window.addEventListener('load', init);
