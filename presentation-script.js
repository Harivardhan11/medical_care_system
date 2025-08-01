let currentSlide = 1;
const totalSlides = 16;

function showSlide(n) {
    const slides = document.querySelectorAll('.slide');
    
    if (n > totalSlides) currentSlide = 1;
    if (n < 1) currentSlide = totalSlides;
    
    slides.forEach(slide => slide.classList.remove('active'));
    slides[currentSlide - 1].classList.add('active');
    
    updateNavigation();
    updateSlideCounter();
}

function nextSlide() {
    currentSlide++;
    showSlide(currentSlide);
}

function previousSlide() {
    currentSlide--;
    showSlide(currentSlide);
}

function updateNavigation() {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    
    prevBtn.disabled = currentSlide === 1;
    nextBtn.disabled = currentSlide === totalSlides;
}

function updateSlideCounter() {
    document.getElementById('slideCounter').textContent = `${currentSlide} / ${totalSlides}`;
}

// Keyboard navigation
document.addEventListener('keydown', function(event) {
    if (event.key === 'ArrowRight' || event.key === ' ') {
        event.preventDefault();
        nextSlide();
    } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        previousSlide();
    } else if (event.key === 'Home') {
        event.preventDefault();
        currentSlide = 1;
        showSlide(currentSlide);
    } else if (event.key === 'End') {
        event.preventDefault();
        currentSlide = totalSlides;
        showSlide(currentSlide);
    }
});

// Touch/swipe support for mobile
let touchStartX = 0;
let touchEndX = 0;

document.addEventListener('touchstart', function(event) {
    touchStartX = event.changedTouches[0].screenX;
});

document.addEventListener('touchend', function(event) {
    touchEndX = event.changedTouches[0].screenX;
    handleSwipe();
});

function handleSwipe() {
    const swipeThreshold = 50;
    const diff = touchStartX - touchEndX;
    
    if (Math.abs(diff) > swipeThreshold) {
        if (diff > 0) {
            // Swipe left - next slide
            nextSlide();
        } else {
            // Swipe right - previous slide
            previousSlide();
        }
    }
}

// Initialize presentation
document.addEventListener('DOMContentLoaded', function() {
    showSlide(currentSlide);
    
    // Add click handlers for navigation buttons
    document.getElementById('prevBtn').addEventListener('click', previousSlide);
    document.getElementById('nextBtn').addEventListener('click', nextSlide);
});

// Auto-advance slides (optional - uncomment to enable)
/*
let autoAdvanceInterval;

function startAutoAdvance() {
    autoAdvanceInterval = setInterval(() => {
        if (currentSlide < totalSlides) {
            nextSlide();
        } else {
            stopAutoAdvance();
        }
    }, 10000); // 10 seconds per slide
}

function stopAutoAdvance() {
    if (autoAdvanceInterval) {
        clearInterval(autoAdvanceInterval);
        autoAdvanceInterval = null;
    }
}

// Start auto-advance when presentation loads
// startAutoAdvance();

// Stop auto-advance on user interaction
document.addEventListener('click', stopAutoAdvance);
document.addEventListener('keydown', stopAutoAdvance);
document.addEventListener('touchstart', stopAutoAdvance);
*/

// Presentation mode toggle
function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
            console.log(`Error attempting to enable fullscreen: ${err.message}`);
        });
    } else {
        document.exitFullscreen();
    }
}

// Add fullscreen toggle on F11 or double-click
document.addEventListener('keydown', function(event) {
    if (event.key === 'F11') {
        event.preventDefault();
        toggleFullscreen();
    }
});

document.addEventListener('dblclick', function(event) {
    if (event.target.closest('.slide')) {
        toggleFullscreen();
    }
});

// Print support
function printPresentation() {
    window.print();
}

// Add print styles when printing
window.addEventListener('beforeprint', function() {
    document.body.classList.add('printing');
    // Show all slides for printing
    document.querySelectorAll('.slide').forEach(slide => {
        slide.style.display = 'block';
        slide.style.pageBreakAfter = 'always';
    });
});

window.addEventListener('afterprint', function() {
    document.body.classList.remove('printing');
    // Restore normal slide display
    showSlide(currentSlide);
});

// Slide progress indicator
function createProgressIndicator() {
    const progressContainer = document.createElement('div');
    progressContainer.className = 'progress-indicator';
    progressContainer.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 4px;
        background: rgba(255,255,255,0.3);
        z-index: 1000;
    `;
    
    const progressBar = document.createElement('div');
    progressBar.className = 'progress-bar';
    progressBar.style.cssText = `
        height: 100%;
        background: #667eea;
        transition: width 0.3s ease;
        width: ${(currentSlide / totalSlides) * 100}%;
    `;
    
    progressContainer.appendChild(progressBar);
    document.body.appendChild(progressContainer);
    
    return progressBar;
}

// Initialize progress indicator
const progressBar = createProgressIndicator();

// Update progress bar when slide changes
function updateProgress() {
    if (progressBar) {
        progressBar.style.width = `${(currentSlide / totalSlides) * 100}%`;
    }
}

// Override showSlide to include progress update
const originalShowSlide = showSlide;
showSlide = function(n) {
    originalShowSlide(n);
    updateProgress();
};

// Slide notes (for presenter mode)
const slideNotes = {
    1: "Welcome slide - introduce yourself and the project",
    2: "Overview of presentation structure",
    3: "Explain the healthcare problem and our solution approach",
    4: "Detail the specific objectives we aimed to achieve",
    5: "Show the three-tier architecture of our system",
    6: "Explain each technology choice and its purpose",
    7: "Compare MongoDB vs MySQL approaches",
    8: "Demonstrate frontend implementation details",
    9: "Show backend server setup and configuration",
    10: "Highlight key features with examples",
    11: "Explain API design and endpoints",
    12: "Connect programming concepts to implementation",
    13: "Live demo or screenshots of working system",
    14: "Discuss challenges faced and solutions implemented",
    15: "Future improvements and roadmap",
    16: "Summarize achievements and learning outcomes"
};

// Show presenter notes (optional)
function showPresenterNotes() {
    const note = slideNotes[currentSlide];
    if (note) {
        console.log(`Slide ${currentSlide} Notes: ${note}`);
    }
}

// Add notes display on slide change
const originalShowSlideWithNotes = showSlide;
showSlide = function(n) {
    originalShowSlideWithNotes(n);
    showPresenterNotes();
};