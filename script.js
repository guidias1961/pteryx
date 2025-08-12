/**
 * PTERYX - Interactive Frontend Script
 * Production-ready vanilla JavaScript with accessibility and performance focus
 */

// Utility Functions
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);
const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const lerp = (start, end, factor) => start + (end - start) * factor;
const US_TZ = 'America/New_York';

function formatTime(ts) {
  return new Date(ts).toLocaleString('en-US', {
    timeZone: US_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
}

// State Management
const state = {
  theme: localStorage.getItem('pteryx-theme') || 'dark',
  flightLog: [],
  flightLogPage: 0,
  flightLogFiltered: [],
  consoleHistory: [],
  consoleCommandIndex: -1,
  lastScrollY: 0,
  scrollDirection: 'up'
};

// Animation Frame Optimization
let rafId = null;
const requestTick = (callback) => {
  if (rafId) return;
  rafId = requestAnimationFrame(() => {
    callback();
    rafId = null;
  });
};

/**
 * Initialize application after DOM loaded
 */
document.addEventListener('DOMContentLoaded', () => {
  initializeApp();
});

/**
 * Main application initialization
 */
function initializeApp() {
  setupTheme();
  setupNavigation();
  setupHeroCanvas();
  setupScrollEffects();
  setupFlightLog();
  setupConsole();
  setupModals();
  setupMobileFeatures();
  setupAccessibility();
  
  // Load data
  loadFlightLog();
  loadFieldNotes();
  
  console.log('🦕 PTERYX initialized successfully');
}

/**
 * Theme Management
 */
function setupTheme() {
  const themeToggle = $('.theme-toggle');
  const body = document.body;
  
  // Apply saved theme
  body.classList.toggle('light-mode', state.theme === 'light');
  body.classList.toggle('dark-mode', state.theme === 'dark');
  
  themeToggle?.addEventListener('click', () => {
    state.theme = state.theme === 'dark' ? 'light' : 'dark';
    body.classList.toggle('light-mode', state.theme === 'light');
    body.classList.toggle('dark-mode', state.theme === 'dark');
    localStorage.setItem('pteryx-theme', state.theme);
  });
}

/**
 * Navigation Setup
 */
function setupNavigation() {
  const navbar = $('.navbar');
  const navLinks = $$('.nav-link');
  
  // Active section highlighting
  const sections = $$('section[id]');
  
  const updateActiveSection = () => {
    let current = '';
    sections.forEach(section => {
      const rect = section.getBoundingClientRect();
      if (rect.top <= 100 && rect.bottom >= 100) {
        current = section.id;
      }
    });
    
    navLinks.forEach(link => {
      link.classList.toggle('active', link.getAttribute('href') === `#${current}`);
    });
  };
  
  // Smooth scroll for navigation links
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = link.getAttribute('href').slice(1);
      const target = $(`#${targetId}`);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
  
  // Scroll-based navbar behavior
  window.addEventListener('scroll', () => {
    requestTick(() => {
      const scrollY = window.scrollY;
      const direction = scrollY > state.lastScrollY ? 'down' : 'up';
      
      if (direction !== state.scrollDirection) {
        navbar.style.transform = direction === 'down' && scrollY > 100 
          ? 'translateY(-100%)' 
          : 'translateY(0)';
        state.scrollDirection = direction;
      }
      
      state.lastScrollY = scrollY;
      updateActiveSection();
    });
  });
}

/**
 * Hero Canvas Particles
 */
function setupHeroCanvas() {
  const canvas = $('.hero-canvas');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  let particles = [];
  let animationId;
  
  const resizeCanvas = () => {
    canvas.width = canvas.offsetWidth * devicePixelRatio;
    canvas.height = canvas.offsetHeight * devicePixelRatio;
    ctx.scale(devicePixelRatio, devicePixelRatio);
  };
  
  class Particle {
    constructor() {
      this.reset();
      this.y = Math.random() * canvas.offsetHeight;
    }
    
    reset() {
      this.x = Math.random() * canvas.offsetWidth;
      this.y = -10;
      this.size = Math.random() * 2 + 0.5;
      this.speedY = Math.random() * 0.5 + 0.2;
      this.speedX = Math.random() * 0.2 - 0.1;
      this.opacity = Math.random() * 0.3 + 0.1;
    }
    
    update() {
      this.y += this.speedY;
      this.x += this.speedX;
      
      if (this.y > canvas.offsetHeight + 10) {
        this.reset();
      }
    }
    
    draw() {
      ctx.save();
      ctx.globalAlpha = this.opacity;
      ctx.fillStyle = '#5ad0ff';
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
  
  const initParticles = () => {
    particles = [];
    const particleCount = Math.min(50, Math.floor(canvas.offsetWidth / 20));
    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }
  };
  
  const animate = () => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    
    ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);
    
    particles.forEach(particle => {
      particle.update();
      particle.draw();
    });
    
    animationId = requestAnimationFrame(animate);
  };
  
  resizeCanvas();
  initParticles();
  animate();
  
  window.addEventListener('resize', () => {
    resizeCanvas();
    initParticles();
  });
  
  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    if (animationId) cancelAnimationFrame(animationId);
  });
}

/**
 * Scroll Effects
 */
function setupScrollEffects() {
  const progressBar = $('.scroll-progress');
  
  window.addEventListener('scroll', () => {
    requestTick(() => {
      const scrollPercent = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
      progressBar.style.width = `${clamp(scrollPercent, 0, 100)}%`;
    });
  });
}

/**
 * Flight Log Management
 */
async function loadFlightLog() {
  try {
    const response = await fetch('./flight-log.json');
    state.flightLog = await response.json();
    state.flightLogFiltered = [...state.flightLog];
    renderFlightLog();
  } catch (error) {
    console.error('Failed to load flight log:', error);
    showFlightLogError();
  }
}

function setupFlightLog() {
  const searchInput = $('.search-input');
  const filterSelect = $('.filter-select');
  const loadMoreBtn = $('.load-more');
  
  searchInput?.addEventListener('input', debounce(() => {
    filterFlightLog();
  }, 300));
  
  filterSelect?.addEventListener('change', () => {
    filterFlightLog();
  });
  
  loadMoreBtn?.addEventListener('click', () => {
    state.flightLogPage++;
    renderFlightLog(true);
  });
}

function filterFlightLog() {
  const searchTerm = $('.search-input')?.value.toLowerCase() || '';
  const filterType = $('.filter-select')?.value || 'all';
  
  state.flightLogFiltered = state.flightLog.filter(entry => {
    const matchesSearch = entry.title.toLowerCase().includes(searchTerm) || 
                         entry.description.toLowerCase().includes(searchTerm);
    const matchesFilter = filterType === 'all' || entry.type === filterType;
    return matchesSearch && matchesFilter;
  });
  
  state.flightLogPage = 0;
  renderFlightLog();
}

function renderFlightLog(append = false) {
  const container = $('.flight-entries');
  if (!container) return;
  
  const pageSize = 10;
  const startIndex = state.flightLogPage * pageSize;
  const endIndex = startIndex + pageSize;
  const entries = state.flightLogFiltered.slice(startIndex, endIndex);
  
  if (!append) {
    container.innerHTML = '';
  }
  
  entries.forEach(entry => {
    const entryEl = document.createElement('div');
    entryEl.className = 'flight-entry';
    entryEl.innerHTML = `
      <h3>${escapeHtml(entry.title)}</h3>
      <p>${escapeHtml(entry.description)}</p>
      <div class="flight-meta">
        <span>Block: ${entry.block.toLocaleString()}</span>
        <span>${formatTime(entry.timestamp)}</span>
        ${entry.txLink ? `<a href="${entry.txLink}" target="_blank" rel="noopener">View TX</a>` : ''}
      </div>
    `;
    container.appendChild(entryEl);
  });
  
  // Update load more button
  const loadMoreBtn = $('.load-more');
  if (loadMoreBtn) {
    loadMoreBtn.style.display = endIndex >= state.flightLogFiltered.length ? 'none' : 'block';
  }
}

function showFlightLogError() {
  const container = $('.flight-entries');
  if (container) {
    container.innerHTML = `
      <div class="flight-entry">
        <h3>Unable to load flight log</h3>
        <p>Please check your connection and try again.</p>
      </div>
    `;
  }
}

/**
 * Console Terminal
 */
async function loadFieldNotes() {
  try {
    const response = await fetch('./field-notes.json');
    const notes = await response.json();
    state.fieldNotes = notes;
  } catch (error) {
    console.error('Failed to load field notes:', error);
    state.fieldNotes = { commands: {}, notes: [] };
  }
}

function setupConsole() {
  const consoleInput = $('.console-input');
  const consoleOutput = $('.console-output');
  
  if (!consoleInput || !consoleOutput) return;
  
  // Initialize with welcome message
  typeMessage(consoleOutput, 'PTERYX Research Terminal v1.0\nType "help" to see available commands.\n\n');
  
  consoleInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const command = consoleInput.value.trim();
      if (command) {
        executeCommand(command, consoleOutput);
        state.consoleHistory.push(command);
        state.consoleCommandIndex = state.consoleHistory.length;
      }
      consoleInput.value = '';
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (state.consoleCommandIndex > 0) {
        state.consoleCommandIndex--;
        consoleInput.value = state.consoleHistory[state.consoleCommandIndex] || '';
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (state.consoleCommandIndex < state.consoleHistory.length - 1) {
        state.consoleCommandIndex++;
        consoleInput.value = state.consoleHistory[state.consoleCommandIndex] || '';
      } else {
        state.consoleCommandIndex = state.consoleHistory.length;
        consoleInput.value = '';
      }
    }
  });
}

function executeCommand(command, output) {
  const [cmd, ...args] = command.toLowerCase().split(/\s+/);
  
  output.innerHTML += `<span class="console-prompt">pteryx@lab:~$</span> ${escapeHtml(command)}\n`;
  
  switch (cmd) {
    case 'help':
      typeMessage(output, `Available commands:
  help     - Show this help message
  notes    - Display recent field observations
  lore     - Show evolutionary timeline
  socials  - Display social media links  
  clear    - Clear terminal screen
  
`);
      break;
      
    case 'notes':
      if (state.fieldNotes?.notes) {
        let notesText = 'Recent Field Observations:\n\n';
        state.fieldNotes.notes.slice(-5).forEach((note, index) => {
          notesText += `[${note.date}] ${note.observation}\n`;
        });
        notesText += '\n';
        typeMessage(output, notesText);
      } else {
        typeMessage(output, 'No field notes available.\n\n');
      }
      break;
      
    case 'lore':
      typeMessage(output, `Evolutionary Timeline:
  
  Fossil Discovery    - Transitional specimen preserved in limestone
  First Feather      - Asymmetrical flight feathers documented  
  First Flight       - Powered flight mechanism validated
  
`);
      break;
      
    case 'socials':
      typeMessage(output, `Social Media Links:
  
  Twitter: @PteryxPulse
  Telegram: t.me/PteryxPulse
  PulseX: [Coming Soon]
  
`);
      break;
      
    case 'clear':
      output.innerHTML = '';
      break;
      
    default:
      typeMessage(output, `Command not found: ${cmd}\nType 'help' for available commands.\n\n`);
  }
  
  // Auto-scroll to bottom
  output.parentElement.scrollTop = output.parentElement.scrollHeight;
}

function typeMessage(output, message, speed = 20) {
  return new Promise(resolve => {
    let index = 0;
    const originalContent = output.innerHTML;
    
    function type() {
      if (index < message.length) {
        output.innerHTML = originalContent + message.slice(0, index + 1);
        index++;
        setTimeout(type, speed);
      } else {
        resolve();
      }
    }
    
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      type();
    } else {
      output.innerHTML = originalContent + message;
      resolve();
    }
  });
}

/**
 * Modal System
 */
function setupModals() {
  const modalOverlay = $('.modal-overlay');
  const modalClose = $('.modal-close');
  const labButtons = $$('.lab-button');
  
  // Lab test modals
  labButtons.forEach(button => {
    button.addEventListener('click', () => {
      const testType = button.dataset.test;
      openLabModal(testType);
    });
  });
  
  // Close modal events
  modalClose?.addEventListener('click', closeModal);
  modalOverlay?.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModal();
  });
  
  // Escape key to close
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });
}

function openLabModal(testType) {
  const modal = $('.modal-overlay');
  const modalBody = $('.modal-body');
  
  if (!modal || !modalBody) return;
  
  const testData = getTestData(testType);
  modalBody.innerHTML = `
    <h2>${testData.title}</h2>
    <div class="test-status ${testData.status}">Status: ${testData.statusText}</div>
    <p>${testData.description}</p>
    <div class="test-details">
      <h3>Parameters</h3>
      <ul>
        ${testData.parameters.map(param => `<li>${param}</li>`).join('')}
      </ul>
      ${testData.results ? `
        <h3>Results</h3>
        <div class="test-results">${testData.results}</div>
      ` : ''}
    </div>
  `;
  
  modal.classList.add('active');
  modal.setAttribute('aria-hidden', 'false');
  
  // Focus management
  const firstFocusable = modal.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
  firstFocusable?.focus();
}

function closeModal() {
  const modal = $('.modal-overlay');
  if (modal) {
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
  }
}

function getTestData(testType) {
  const tests = {
    aero: {
      title: 'Aerodynamic Analysis',
      status: 'completed',
      statusText: 'Completed',
      description: 'Comprehensive wind tunnel analysis of Archaeopteryx feather structure and wing configuration.',
      parameters: [
        'Wind speed: 15-45 m/s',
        'Temperature: 20-25°C',
        'Humidity: 45-55%',
        'Test duration: 72 hours'
      ],
      results: 'Flight capability confirmed. Lift-to-drag ratio: 12:1. Optimal gliding angle: 15°.'
    },
    bones: {
      title: 'Bone Density Mapping',
      status: 'in-progress',
      statusText: 'In Progress (68% complete)',
      description: 'High-resolution CT scanning and analysis of bone structure for weight optimization.',
      parameters: [
        'Resolution: 0.1mm voxel size',
        'Scan energy: 120kV',
        'Samples: 15 specimens',
        'Analysis duration: 14 days'
      ]
    },
    simulation: {
      title: 'Flight Path Simulation',
      status: 'pending',
      statusText: 'Queued for Testing',
      description: 'Computational fluid dynamics modeling of prehistoric flight patterns and energy expenditure.',
      parameters: [
        'Environment: Late Jurassic climate model',
        'Flight duration: 30-120 seconds',
        'Energy expenditure tracking',
        'Thermal updraft analysis'
      ]
    }
  };
  
  return tests[testType] || tests.aero;
}

/**
 * Mobile Features
 */
function setupMobileFeatures() {
  const mobileBuyButton = $('.mobile-buy-button');
  if (!mobileBuyButton) return;
  
  let lastScrollY = window.scrollY;
  
  window.addEventListener('scroll', () => {
    requestTick(() => {
      const currentScrollY = window.scrollY;
      const scrollingDown = currentScrollY > lastScrollY;
      
      if (scrollingDown && currentScrollY > 200) {
        mobileBuyButton.classList.add('hidden');
      } else {
        mobileBuyButton.classList.remove('hidden');
      }
      
      lastScrollY = currentScrollY;
    });
  });
  
  // Copy contract address functionality
  const contractCopy = $('.contract-copy');
  if (contractCopy) {
    contractCopy.addEventListener('click', async () => {
      const address = contractCopy.dataset.address;
      try {
        await navigator.clipboard.writeText(address);
        showToast('Contract address copied to clipboard');
      } catch (error) {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = address;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showToast('Contract address copied to clipboard');
      }
    });
  }
}

/**
 * Accessibility Features
 */
function setupAccessibility() {
  // Skip to main content link
  const skipLink = document.createElement('a');
  skipLink.href = '#hero';
  skipLink.textContent = 'Skip to main content';
  skipLink.className = 'sr-only';
  skipLink.style.cssText = `
    position: absolute;
    top: -40px;
    left: 6px;
    background: var(--color-primary);
    color: white;
    padding: 8px;
    text-decoration: none;
    border-radius: 4px;
    z-index: 1000;
  `;
  
  skipLink.addEventListener('focus', () => {
    skipLink.style.top = '6px';
  });
  
  skipLink.addEventListener('blur', () => {
    skipLink.style.top = '-40px';
  });
  
  document.body.insertBefore(skipLink, document.body.firstChild);
  
  // Announce dynamic content changes
  const announcer = document.createElement('div');
  announcer.setAttribute('aria-live', 'polite');
  announcer.setAttribute('aria-atomic', 'true');
  announcer.className = 'sr-only';
  document.body.appendChild(announcer);
  
  window.announce = (message) => {
    announcer.textContent = message;
    setTimeout(() => announcer.textContent = '', 1000);
  };
}

/**
 * Utility Functions
 */
function debounce(func, wait) {
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

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function showToast(message, duration = 3000) {
  const toast = document.createElement('div');
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: var(--color-primary);
    color: white;
    padding: 12px 24px;
    border-radius: 8px;
    z-index: 1000;
    opacity: 0;
    transition: opacity 0.3s ease;
  `;
  
  document.body.appendChild(toast);
  
  requestAnimationFrame(() => {
    toast.style.opacity = '1';
  });
  
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => document.body.removeChild(toast), 300);
  }, duration);
}

// Performance monitoring
if (window.performance) {
  window.addEventListener('load', () => {
    const loadTime = performance.now();
    console.log(`🚀 PTERYX loaded in ${Math.round(loadTime)}ms`);
    
    // Report Core Web Vitals
    if ('web-vital' in window) {
      getCLS(console.log);
      getFID(console.log);
      getFCP(console.log);
      getLCP(console.log);
      getTTFB(console.log);
    }
  });
}
