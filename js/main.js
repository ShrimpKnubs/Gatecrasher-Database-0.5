// Initialize background
document.getElementById('vanta-background').style.backgroundImage = "url('textures/background.png')";
document.getElementById('vanta-background').style.backgroundSize = "cover";
document.getElementById('vanta-background').style.backgroundRepeat = "no-repeat";

// DOM Elements
const bootOverlay = document.getElementById('boot-overlay');
const activateButton = document.getElementById('activate-button');
const terminalText = document.getElementById('terminal-text');
const logoScreen = document.getElementById('logo-screen');
const music = document.getElementById('background-music');
const activationSound = document.getElementById('activation-sound');
const tabSound = document.getElementById('tab-sound');
const missionSound = document.getElementById('mission-sound');
const intelSound = document.getElementById('intel-sound');
const statusText = document.getElementById('status-text');
const dateTimeDisplay = document.getElementById('date-time');
const notification = document.getElementById('notification');
const volumeSlider = document.getElementById('volume-slider');
const globe = document.getElementById('globe');
const missionPanel = document.getElementById('mission-panel');
const closeMissionButton = document.getElementById('close-mission');
const intelPanel = document.getElementById('intel-panel');
const closeIntelButton = document.getElementById('close-intel');
const missionIntelButton = document.getElementById('mission-intel-button');
const lcdOverlay = document.getElementById('lcd-overlay');
const leftPanel = document.getElementById('left-panel');
const rightPanel = document.getElementById('right-panel');

// Add background image to logo screen and boot overlay too
logoScreen.style.backgroundImage = "url('textures/background.png')";
logoScreen.style.backgroundSize = "cover";
logoScreen.style.backgroundRepeat = "no-repeat";

bootOverlay.style.backgroundImage = "url('textures/background.png')";
bootOverlay.style.backgroundSize = "cover";
bootOverlay.style.backgroundRepeat = "no-repeat";
bootOverlay.style.backgroundColor = "rgba(0, 31, 24, 0.85)"; // Semi-transparent overlay

// System State
let systemActive = false;
let activeMission = null;
let rotating = true;
let lastInteractionTime = 0;
let rotationTimeout = null;
let velocity = { x: 0, y: 0 };
const friction = 0.95;

// Logo Screen Handling (No fading, instant transition)
setTimeout(() => {
  logoScreen.style.display = 'none';
}, 2000);

// Load mission data from external file
async function loadMissions() {
  try {
    const response = await fetch('data/missions.json');
    const missions = await response.json();
    
    // Log loaded missions for debugging
    console.log('Loaded missions:', missions);
    
    if (!missions || missions.length === 0) {
      throw new Error('No missions found in JSON file');
    }
    
    return missions;
  } catch (error) {
    console.error('Error loading missions:', error);
    // Fallback to sample missions if file not found or empty
    return [
      {
        id: 'mission1',
        name: 'OPERATION BLACKOUT',
        location: 'ALTIS - COORDINATES: 38.9072N, 77.0369E',
        difficulty: 'HIGH',
        payment: '$15,000',
        duration: '2.5 HRS',
        teamSize: 'SQUAD (4-8)',
        coordinates: { lat: 38.9072, lon: -77.0369 }
      },
      {
        id: 'mission2',
        name: 'OPERATION RED STORM',
        location: 'TANOA - COORDINATES: 51.5074N, 0.1278E',
        difficulty: 'MEDIUM',
        payment: '$12,000',
        duration: '2 HRS',
        teamSize: 'FIRETEAM (4)',
        coordinates: { lat: 51.5074, lon: -0.1278 }
      },
      {
        id: 'mission3',
        name: 'OPERATION FROZEN THUNDER',
        location: 'CHERNARUS - COORDINATES: 55.7558N, 37.6173E',
        difficulty: 'EXTREME',
        payment: '$22,000',
        duration: '3 HRS',
        teamSize: 'PLATOON (12-16)',
        coordinates: { lat: 55.7558, lon: 37.6173 }
      },
      {
        id: 'mission4',
        name: 'OPERATION DESERT HAWK',
        location: 'TAKISTAN - COORDINATES: 39.9042N, 116.4074E',
        difficulty: 'LOW',
        payment: '$8,000',
        duration: '4 HRS',
        teamSize: 'RECON TEAM (2-3)',
        coordinates: { lat: 39.9042, lon: 116.4074 }
      }
    ];
  }
}

// Load intel data from external file
async function loadIntel() {
  try {
    const response = await fetch('data/intel.json');
    const intel = await response.json();
    return intel;
  } catch (error) {
    console.error('Error loading intel:', error);
    // Fallback to sample intel if file not found
    return {
      "mission1": {
        "title": "OPERATION BLACKOUT INTEL",
        "content": "",
        "images": ["blackout_sat.jpg", "blackout_compound.jpg"]
      },
      "mission2": {
        "title": "OPERATION RED STORM INTEL",
        "content": "",
        "images": ["redstorm_village.jpg", "redstorm_hostages.jpg"]
      },
      "mission3": {
        "title": "OPERATION FROZEN THUNDER INTEL",
        "content": "",
        "images": ["frozen_array.jpg", "frozen_thermal.jpg"]
      },
      "mission4": {
        "title": "OPERATION DESERT HAWK INTEL",
        "content": "",
        "images": ["desert_topo.jpg", "desert_vehicle.jpg"]
      }
    };
  }
}

// Initialize decorative elements
function initializeDecorativeElements() {
  // Hide side panels at first
  leftPanel.style.opacity = '0';
  rightPanel.style.opacity = '0';
  
  // Create random radar blips
  setInterval(() => {
    if (!systemActive) return;
    
    const radarContainer = document.querySelector('.radar-container');
    
    // Remove old dots that aren't the initial ones
    const oldDots = document.querySelectorAll('.radar-dot.temp');
    oldDots.forEach(dot => dot.remove());
    
    // Add 1-3 new random dots
    const numDots = Math.floor(Math.random() * 3) + 1;
    
    for (let i = 0; i < numDots; i++) {
      const dot = document.createElement('div');
      dot.className = 'radar-dot temp';
      
      // Random position within radar
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * 75;
      const x = 75 + Math.cos(angle) * distance;
      const y = 75 + Math.sin(angle) * distance;
      
      dot.style.left = `${x}px`;
      dot.style.top = `${y}px`;
      
      // Random color based on distance (closer = more likely to be alert color)
      const colorRandom = Math.random();
      if (distance < 25 || colorRandom < 0.3) {
        dot.style.background = 'var(--alert-color)';
        dot.style.width = '4px';
        dot.style.height = '4px';
      } else if (distance < 50 || colorRandom < 0.7) {
        dot.style.background = 'var(--warning-color)';
      } else {
        dot.style.background = 'var(--highlight-color)';
      }
      
      // Fade out effect
      dot.style.opacity = '1';
      dot.style.transition = 'opacity 3s';
      
      radarContainer.appendChild(dot);
      
      setTimeout(() => {
        dot.style.opacity = '0';
        setTimeout(() => dot.remove(), 3000);
      }, 2000);
    }
  }, 2000);
  
  // Animate waveform
  setInterval(() => {
    if (!systemActive) return;
    
    const wavePath = document.querySelector('.wave-svg path');
    if (!wavePath) return;
    
    // Generate a different waveform pattern
    const points = [];
    const segments = 8;
    
    for (let i = 0; i <= segments; i++) {
      const x = (i / segments) * 200;
      const yOffset = Math.random() * 30 - 15;
      points.push([x, 25 + yOffset]);
    }
    
    // Create SVG path from points
    let pathData = `M${points[0][0]},${points[0][1]}`;
    
    for (let i = 1; i < points.length; i++) {
      const xc = (points[i][0] + points[i-1][0]) / 2;
      const yc = (points[i][1] + points[i-1][1]) / 2;
      pathData += ` Q${points[i-1][0]},${points[i-1][1]} ${xc},${yc}`;
    }
    
    // Smooth transition to new path
    wavePath.style.transition = 'all 1s ease-in-out';
    wavePath.setAttribute('d', pathData);
  }, 2000);
  
  // Update system values periodically
  setInterval(() => {
    if (!systemActive) return;
    
    // Update random system values
    document.querySelectorAll('.system-fill').forEach(fill => {
      const currentWidth = parseInt(fill.style.width);
      // Small random fluctuation in system values
      const fluctuation = Math.random() * 6 - 3; // Range: -3 to +3
      const newWidth = Math.max(10, Math.min(99, currentWidth + fluctuation));
      fill.style.width = `${newWidth}%`;
      
      // Update percentage text if it exists
      const valueText = fill.closest('.system-item')?.querySelector('div:last-child');
      if (valueText) {
        valueText.textContent = `${Math.round(newWidth)}%`;
      }
      
      // Change color based on value
      if (newWidth < 30) {
        fill.style.background = 'var(--alert-color)';
        if (valueText) valueText.style.color = 'var(--alert-color)';
      } else if (newWidth < 65) {
        fill.style.background = 'var(--warning-color)';
        if (valueText) valueText.style.color = 'var(--warning-color)';
      } else if (!fill.hasAttribute('style') || fill.style.background.includes('var(--warning-color)')) {
        // Don't change color if it already has a custom background
      } else {
        fill.style.background = 'var(--highlight-color)';
        if (valueText) valueText.style.color = 'var(--text-primary)';
      }
    });
  }, 5000);
}

// Boot Sequence System
function initializeBootSequence() {
  // Initialize States
  activateButton.style.display = 'none';
  
  // Animate Terminal
  const lines = terminalText.querySelectorAll('p');
  let delay = 0;
  lines.forEach((line, index) => {
    const text = line.textContent;
    line.textContent = '';
    typeWriter(line, text, delay, () => {
      if (index === lines.length - 1) {
        setTimeout(() => {
          activateButton.style.display = 'block';
          activateButton.style.opacity = '1';
        }, 500);
      }
    });
    delay += text.length * 25 + 250;
  });
  
  // Activation Protocol
  activateButton.addEventListener('click', activateSystem);
}

// Typewriter Effect
function typeWriter(element, text, delay, callback) {
  let i = 0;
  const speed = 25;
  
  function type() {
    if (i < text.length) {
      element.innerHTML += text.charAt(i);
      i++;
      setTimeout(type, speed);
    } else if (callback) {
      callback();
    }
  }
  
  setTimeout(type, delay);
}

// System Activation
function activateSystem() {
  systemActive = true;
  activationSound.play().catch(console.error);
  
  // Set music volume based on slider
  music.volume = volumeSlider.value;
  music.play().catch(console.error);
  
  // Instant hide of boot overlay (no fade)
  bootOverlay.style.display = 'none';
  
  // Initialize updating features
  updateDateTime();
  setInterval(updateDateTime, 1000);
  
  // Show notification
  showNotification('SYSTEM ACTIVATED - GLOBE TRACKING OPERATIONAL');
  
  // Apply LCD screen overlay
  lcdOverlay.style.display = 'block';
  
  // Fade in side panels
  setTimeout(() => {
    leftPanel.style.transition = 'opacity 1s ease-in';
    rightPanel.style.transition = 'opacity 1s ease-in';
    leftPanel.style.opacity = '1';
    rightPanel.style.opacity = '1';
  }, 500);
}

// Mission Panel System
function initializeMissionPanel() {
  closeMissionButton.addEventListener('click', () => {
    missionPanel.classList.remove('active');
    activeMission = null;
    
    // Resume auto-rotation when mission panel is closed
    resumeRotation();
  });
  
  // Intel button functionality
  missionIntelButton.addEventListener('click', () => {
    if (activeMission) {
      openIntelPanel(activeMission);
    }
  });
}

// Intel Panel System
function initializeIntelPanel() {
  closeIntelButton.addEventListener('click', () => {
    intelPanel.classList.remove('active');
  });
}

async function openIntelPanel(missionId) {
  // Load intel data
  const intelData = await loadIntel();
  const missionIntel = intelData[missionId];
  
  if (!missionIntel) {
    showNotification('NO INTEL AVAILABLE FOR THIS MISSION');
    return;
  }
  
  // Play intel sound
  if (intelSound && intelSound.readyState >= 2) {
    intelSound.currentTime = 0;
    intelSound.play().catch(console.error);
  }
  
  // Update intel panel content
  document.getElementById('intel-title').textContent = missionIntel.title || 'MISSION INTEL';
  
  // Create intel content container
  let intelContent = '';
  
  // Only add content paragraph if there's actual content
  if (missionIntel.content && missionIntel.content.trim() !== '') {
    intelContent += `<p>${missionIntel.content}</p>`;
  }
  
  // Add images if available
  if (missionIntel.images && missionIntel.images.length > 0) {
    missionIntel.images.forEach(imgSrc => {
      intelContent += `<img src="data/images/${imgSrc}" class="intel-image" alt="Mission Intel">`;
    });
  }
  
  // If there's no content and no images, show a placeholder message
  if (intelContent === '') {
    intelContent = '<p>No intel data available.</p>';
  }
  
  document.getElementById('intel-content').innerHTML = intelContent;
  
  // Show intel panel
  intelPanel.classList.add('active');
  
  // Show notification
  showNotification('ACCESSING MISSION INTEL');
}

async function displayMission(missionId) {
  // Load mission data
  const missions = await loadMissions();
  const mission = missions.find(m => m.id === missionId);
  
  if (!mission) {
    showNotification('MISSION DATA NOT FOUND');
    return;
  }
  
  // Play mission sound
  if (missionSound && missionSound.readyState >= 2) {
    missionSound.currentTime = 0;
    missionSound.play().catch(console.error);
  }
  
  // Update mission panel content
  document.getElementById('mission-title').textContent = mission.name;
  document.getElementById('mission-location').textContent = mission.location;
  document.getElementById('mission-difficulty').textContent = mission.difficulty;
  document.getElementById('mission-payment').textContent = mission.payment;
  document.getElementById('mission-duration').textContent = mission.duration;
  document.getElementById('mission-team-size').textContent = mission.teamSize;
  
  // Display mission image if available
  const missionPanel = document.getElementById('mission-panel');
  let missionImageElement = missionPanel.querySelector('.mission-image');
  
  if (mission.image) {
    // Create or update mission image element
    if (!missionImageElement) {
      missionImageElement = document.createElement('img');
      missionImageElement.className = 'mission-image';
      
      // Insert after mission location
      const locationElement = document.getElementById('mission-location').parentElement;
      locationElement.parentNode.insertBefore(missionImageElement, locationElement.nextSibling);
    }
    
    missionImageElement.src = `data/images/${mission.image}`;
    missionImageElement.style.display = 'block';
  } else if (missionImageElement) {
    // Hide mission image if none available
    missionImageElement.style.display = 'none';
  }
  
  // Show mission panel
  missionPanel.classList.add('active');
  activeMission = missionId;
  
  // Stop rotation when mission is displayed
  rotating = false;
  
  // Show notification
  showNotification(`MISSION BRIEFING: ${mission.name}`);
}

// Globe rotation control
function pauseRotation() {
  rotating = false;
  lastInteractionTime = Date.now();
  
  // Clear any existing timeout
  if (rotationTimeout) {
    clearTimeout(rotationTimeout);
  }
  
  // Set timeout to resume rotation after 3 seconds of inactivity
  rotationTimeout = setTimeout(resumeRotation, 3000);
}

function resumeRotation() {
  // Don't resume if a mission is active
  if (activeMission) return;
  
  rotating = true;
}

// Globe Visualization System
async function initializeGlobe() {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
  const renderer = new THREE.WebGLRenderer({
    canvas: document.getElementById('globe'),
    antialias: true,
    alpha: true
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000, 0); // Transparent background
  
  // Position and orientation
  camera.position.z = 20;
  scene.rotation.y = 0.5; // Initial rotation
  
  // Globe interaction
  let isDragging = false;
  let previousMousePosition = {
    x: 0,
    y: 0
  };
  
  // Mouse control for globe
  document.addEventListener('mousedown', (e) => {
    if (!systemActive) return;
    
    isDragging = true;
    previousMousePosition = {
      x: e.clientX,
      y: e.clientY
    };
    
    // Reset velocity when starting to drag
    velocity = { x: 0, y: 0 };
    
    // Pause rotation when user interacts with globe
    pauseRotation();
  });
  
  document.addEventListener('mouseup', () => {
    isDragging = false;
  });
  
  document.addEventListener('mousemove', (e) => {
    if (!systemActive) return;
    
    // Rotate globe when dragging
    if (isDragging) {
      pauseRotation();
      
      const deltaMove = {
        x: e.clientX - previousMousePosition.x,
        y: e.clientY - previousMousePosition.y
      };
      
      // Set velocity based on mouse movement
      velocity.x = deltaMove.x * 0.005;
      velocity.y = deltaMove.y * 0.005;
      
      scene.rotation.y += velocity.x;
      
      // Apply rotation limits to prevent going upside down
      const newXRotation = scene.rotation.x + velocity.y;
      const maxRotation = Math.PI / 2 * 0.95; // Slightly less than 90 degrees
      
      if (newXRotation <= maxRotation && newXRotation >= -maxRotation) {
        scene.rotation.x = newXRotation;
      }
      
      previousMousePosition = {
        x: e.clientX,
        y: e.clientY
      };
    }
  });
  
  // Create textured globe using earth.jpg
  function createTexturedGlobe() {
    // Create a texture loader
    const textureLoader = new THREE.TextureLoader();
    const earthTexture = textureLoader.load('textures/earth.jpg');
    
    // Create sphere geometry
    const geometry = new THREE.SphereGeometry(10, 64, 64);
    
    // Create material with texture
    const material = new THREE.MeshBasicMaterial({
      map: earthTexture,
      transparent: true,
      opacity: 0.9
    });
    
    // Create mesh and add to scene
    const sphere = new THREE.Mesh(geometry, material);
    scene.add(sphere);
    
    return sphere;
  }
  
  // Create the textured globe
  const earthGlobe = createTexturedGlobe();
  
  // Load missions and add them to the globe
  const missions = await loadMissions();
  const missionPoints = [];
  
  // Add mission points of interest
  function addMissionPoint(mission) {
    const lat = mission.coordinates.lat;
    const lon = mission.coordinates.lon;
    const phi = (90 - lat) * Math.PI/180;
    const theta = (lon + 180) * Math.PI/180;
    
    // Create point marker - Dark red color
    const geometry = new THREE.SphereGeometry(0.15, 8, 8);
    const material = new THREE.MeshBasicMaterial({ color: 0x8B0000 }); // Dark red
    const point = new THREE.Mesh(geometry, material);
    
    point.position.x = -10 * Math.sin(phi) * Math.cos(theta);
    point.position.y = 10 * Math.cos(phi);
    point.position.z = 10 * Math.sin(phi) * Math.sin(theta);
    
    // Add mission identifier
    point.userData = { 
      missionId: mission.id,
      type: 'mission-point'
    };
    
    scene.add(point);
    
    // Add pulsing effect (ring) - Dark red
    const ringGeometry = new THREE.RingGeometry(0.2, 0.3, 32);
    const ringMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x8B0000, // Dark red
      transparent: true,
      opacity: 0.7,
      side: THREE.DoubleSide
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.position.copy(point.position);
    
    // Orient ring to face outward from globe center
    ring.lookAt(new THREE.Vector3(0, 0, 0));
    scene.add(ring);
    
    // Store reference for animation
    point.userData.ring = ring;
    
    return point;
  }
  
  // Add mission points
  missions.forEach(mission => {
    const point = addMissionPoint(mission);
    missionPoints.push(point);
  });
  
  // Handle clicking on mission points
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  
  globe.addEventListener('click', (event) => {
    if (!systemActive) return;
    
    // Calculate mouse position in normalized device coordinates
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    
    // Update the raycaster
    raycaster.setFromCamera(mouse, camera);
    
    // Check for intersections with mission points
    const intersects = raycaster.intersectObjects(missionPoints);
    if (intersects.length > 0) {
      const missionId = intersects[0].object.userData.missionId;
      displayMission(missionId);
    }
  });
  
  // Animation Loop
  function animate() {
    requestAnimationFrame(animate);
    
    // Apply momentum with friction if not dragging
    if (!isDragging && !rotating) {
      velocity.x *= friction;
      velocity.y *= friction;
      
      // Only apply velocity if it's significant
      if (Math.abs(velocity.x) > 0.0001) {
        scene.rotation.y += velocity.x;
      }
      
      if (Math.abs(velocity.y) > 0.0001) {
        // Apply rotation limits
        const newXRotation = scene.rotation.x + velocity.y;
        const maxRotation = Math.PI / 2 * 0.95;
        
        if (newXRotation <= maxRotation && newXRotation >= -maxRotation) {
          scene.rotation.x = newXRotation;
        } else {
          // If we hit the limits, stop the y velocity
          velocity.y = 0;
        }
      }
    }
    
    // Auto rotate globe if enabled - doubled speed
    if (rotating) {
      scene.rotation.y += 0.001; // Doubled from 0.0005
    }
    
    // Animate mission points
    missionPoints.forEach(point => {
      if (point.userData.ring) {
        const ring = point.userData.ring;
        ring.scale.x = 1 + 0.2 * Math.sin(Date.now() * 0.003);
        ring.scale.y = 1 + 0.2 * Math.sin(Date.now() * 0.003);
        ring.material.opacity = 0.7 * (0.5 + 0.5 * Math.sin(Date.now() * 0.003));
      }
    });
    
    renderer.render(scene, camera);
  }
  animate();
  
  // Window Resize Handler
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth/window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}

// Utility Functions
function showNotification(text) {
  notification.textContent = text;
  notification.style.display = 'block';
  
  // Use setTimeout for immediate display and removal rather than fade
  setTimeout(() => {
    notification.style.display = 'none';
  }, 3000);
}

function updateDateTime() {
  const now = new Date();
  const hours = String(now.getUTCHours()).padStart(2, '0');
  const minutes = String(now.getUTCMinutes()).padStart(2, '0');
  const seconds = String(now.getUTCSeconds()).padStart(2, '0');
  dateTimeDisplay.textContent = `${hours}:${minutes}:${seconds} UTC`;
}

// Volume Control
volumeSlider.addEventListener('input', (e) => {
  if (music.readyState >= 2) {
    music.volume = e.target.value;
  }
});

// Initialize All Systems
document.addEventListener('DOMContentLoaded', () => {
  initializeBootSequence();
  initializeMissionPanel();
  initializeIntelPanel();
  initializeGlobe();
  initializeDecorativeElements();
  
  // Fix volume icon if not showing
  const volumeIcon = document.getElementById('volume-icon');
  if (volumeIcon) {
    volumeIcon.onerror = function() {
      // Fallback if image fails to load
      this.style.display = 'none';
      document.getElementById('volume-control').innerHTML += '<span style="color:#53a774;">VOL</span>';
    };
  }
});
