function initBanner() {
    const container = document.getElementById('app-header');
    container.innerHTML = ''; // Clear static HTML

    // Config
    const headerHeight = 120; // Taller for the drape
    container.style.height = `${headerHeight}px`;
    container.style.backgroundColor = 'transparent';
    container.style.boxShadow = 'none';
    container.style.background = 'none';
    container.style.overflow = 'visible';

    // SVG Init
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("width", "100%");
    svg.setAttribute("height", "100%");
    svg.style.overflow = "visible"; // Allow frills to poke out

    // Definitions (Gradients)
    const defs = document.createElementNS(svgNS, "defs");
    const gradient = document.createElementNS(svgNS, "linearGradient");
    gradient.setAttribute("id", "bannerGradient");
    gradient.setAttribute("x1", "0%");
    gradient.setAttribute("y1", "0%");
    gradient.setAttribute("x2", "0%");
    gradient.setAttribute("y2", "100%");

    // Light Pink to Rose
    const stop1 = document.createElementNS(svgNS, "stop");
    stop1.setAttribute("offset", "0%");
    stop1.setAttribute("stop-color", "#FFEBF0"); // Very light pink

    const stop2 = document.createElementNS(svgNS, "stop");
    stop2.setAttribute("offset", "100%");
    stop2.setAttribute("stop-color", "#FFB6C1"); // Light pink/Rose

    gradient.appendChild(stop1);
    gradient.appendChild(stop2);
    defs.appendChild(gradient);
    svg.appendChild(defs);

    // Calculate Dimensions
    const containerWidth = container.clientWidth;
    const bannerWidth = Math.min(containerWidth, 600);
    const offsetX = (containerWidth - bannerWidth) / 2;

    // Config for Drapes
    const drapeCount = 3;
    const drapeWidth = bannerWidth / drapeCount;
    const drapeDrop = 50;
    const startY = 20;
    const thickness = 70; // Slightly thicker to fit content
    const fillY = startY + thickness; // Bottom edge Y base

    // 1. Construct Main Ribbon Shape

    // Top Edge
    let topPathD = `M ${offsetX} ${startY} `;
    for (let i = 0; i < drapeCount; i++) {
        let currX = offsetX + (i * drapeWidth);
        let nextX = offsetX + ((i + 1) * drapeWidth);
        let midX = currX + (drapeWidth / 2);
        topPathD += `Q ${midX} ${startY + 10} ${nextX} ${startY} `;
    }

    // Bottom Edge
    let bottomPathD = `L ${offsetX + bannerWidth} ${fillY} `;
    for (let i = drapeCount - 1; i >= 0; i--) {
        let currX = offsetX + ((i + 1) * drapeWidth);
        let nextX = offsetX + (i * drapeWidth);
        let midX = nextX + (drapeWidth / 2);
        bottomPathD += `Q ${midX} ${fillY + drapeDrop} ${nextX} ${fillY} `;
    }
    bottomPathD += "Z";

    const ribbon = document.createElementNS(svgNS, "path");
    ribbon.setAttribute("d", topPathD + bottomPathD);
    ribbon.setAttribute("fill", "url(#bannerGradient)");
    ribbon.setAttribute("stroke", "#D4AF37");
    ribbon.setAttribute("stroke-width", "2");
    svg.appendChild(ribbon);

    // 2. Frills
    let frillPathD = `M ${offsetX} ${fillY} `;
    for (let i = 0; i < drapeCount; i++) {
        let nextX = offsetX + ((i + 1) * drapeWidth);
        let midX = offsetX + (i * drapeWidth) + (drapeWidth / 2);
        frillPathD += `Q ${midX} ${fillY + drapeDrop - 5} ${nextX} ${fillY} `;
    }
    const frills = document.createElementNS(svgNS, "path");
    frills.setAttribute("d", frillPathD);
    frills.setAttribute("fill", "none");
    frills.setAttribute("stroke", "#D4AF37");
    frills.setAttribute("stroke-width", "3");
    frills.setAttribute("stroke-dasharray", "5,5");
    svg.appendChild(frills);

    // 3. Text Path (Centered vertically in the thickness zone)
    // The visual center is roughly startY + (thickness / 2).
    // Let's bend it slightly to match the top drape curve for harmony.

    const textCenterY = startY + (thickness / 2) + 5; // +5 for Baseline adjustment
    const textPathD = `M ${offsetX} ${textCenterY}
                       Q ${offsetX + (bannerWidth / 2)} ${textCenterY + 10}
                       ${offsetX + bannerWidth} ${textCenterY}`;

    const textCurve = document.createElementNS(svgNS, "path");
    textCurve.setAttribute("id", "textCurve");
    textCurve.setAttribute("d", textPathD);
    textCurve.setAttribute("fill", "none");
    textCurve.setAttribute("stroke", "none");
    svg.appendChild(textCurve);

    // Text
    const text = document.createElementNS(svgNS, "text");
    text.setAttribute("fill", "#6A2C70");
    text.setAttribute("font-family", "'Fredoka', sans-serif"); // Gacha style font
    text.setAttribute("font-weight", "600");
    text.setAttribute("font-size", "32");

    const textPathElement = document.createElementNS(svgNS, "textPath");
    textPathElement.setAttribute("href", "#textCurve");
    textPathElement.setAttribute("startOffset", "50%");
    textPathElement.setAttribute("text-anchor", "middle");
    textPathElement.textContent = "Emma's Coloring Book";

    text.appendChild(textPathElement);
    svg.appendChild(text);

    // 4. Unicorns (Inset properly)
    const unicornSize = 45;
    const unicornY = startY + (thickness - unicornSize) / 2; // Center Vertically

    // Left
    const uLeft = document.createElementNS(svgNS, "image");
    uLeft.setAttribute("href", "images/unicorn.png");
    uLeft.setAttribute("x", offsetX + 15); // Padding from left edge
    uLeft.setAttribute("y", unicornY);
    uLeft.setAttribute("width", unicornSize);
    uLeft.setAttribute("height", unicornSize);
    svg.appendChild(uLeft);

    // Right
    const uRight = document.createElementNS(svgNS, "image");
    uRight.setAttribute("href", "images/unicorn.png");
    uRight.setAttribute("x", offsetX + bannerWidth - unicornSize - 15); // Padding from right edge
    uRight.setAttribute("y", unicornY);
    uRight.setAttribute("width", unicornSize);
    uRight.setAttribute("height", unicornSize);
    uRight.setAttribute("class", "svg-unicorn-right");
    svg.appendChild(uRight);

    container.appendChild(svg);
}

// Re-init on resize
let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(initBanner, 100);
});

// Run once loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBanner);
} else {
    initBanner();
}
