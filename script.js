// script.js
// This script contains the core game logic for Slime Survivor, now with a store and Twin Claw upgrade.

// --- Global Variables ---
let canvas;
let ctx;
let gameRunning = false;
let score = 0; // Cats caught this round
let totalCatsCaught = 0; // Total cats ever caught across all games
let scoreDisplay;
let healthDisplay; // This element exists but its textContent is not updated for health number
let messageBox;
let messageTextSpan; // Reference to the span inside messageBox for text
let newGameButton;
let messageTimeoutId = null;

// Game timer variables
let gameTimer = 0; // Current game time in frames
// Assuming 120 FPS for the game loop, adjust duration constants accordingly
const GAME_DURATION = 3 * 60 * 120; // 3 minutes * 60 seconds/minute * 120 frames/second
let timerDisplay; // Element to display the game timer

// Store related variables
let isStoreOpen = false;
let storeButton;
let storePanel;
let totalCatsCaughtDisplay; // Display for total cats in the store
let buyCatClawsButton;
let catClawsStatus;
// NEW: Twin Claw store elements
let twinClawItem; // The div container for Twin Claw
let buyTwinClawButton;
let twinClawStatus;

// Upgrade variables
let catClawsOwned = false;
let catClawsCooldown = 0;
const CAT_CLAWS_COOLDOWN_DURATION = 60; // 1 second at 60 FPS (using 120FPS for game, so half that if logic is faster)
const CAT_CLAWS_RANGE = 70; // Range of Cat Claws attack from player center
const CAT_CLAWS_COST = 10;
// NEW: Twin Claw variables
let twinClawOwned = false;
const TWIN_CLAW_COST = 20;


// Visual effects arrays
let slashes = []; // For Cat Claws visual effect

// Player properties
const player = {
    x: 0,
    y: 0,
    radius: 20,
    speed: 2.5,
    health: 10,
    maxHealth: 10,
    isInvulnerable: false,
    invulnerabilityTimer: 0,
    invulnerabilityDuration: 60,
    color: '#7CFC00',
    sprite: {
        image: new Image(),
        src: 'https://i.imgur.com/ShxaI1U.png',
        width: 32,
        height: 32, // Height of a single frame
        frames: 9, // Now correctly set to 9 frames
        currentFrame: 0,
        frameRate: 5 // Speed of animation (frames per game loop update)
    },
    // New sprite for Cat Claws upgrade
    catClawsSprite: {
        image: new Image(),
        src: 'https://i.imgur.com/PBoAJCH.png', // New sprite sheet for cat ears
        width: 32,
        height: 32, // Height of a single frame
        frames: 11, // Updated to 11 frames as per your correction
        currentFrame: 0,
        frameRate: 5
    },
    animationTimer: 0
};

// Slime puddle properties
const puddles = [];
const PUDDLE_LIFESPAN = 180; // Frames (e.g., 3 seconds at 60 FPS)
const PUDDLE_FADE_RATE = 1 / PUDDLE_LIFESPAN;
const PUDDLE_SPAWN_INTERVAL = 10; // Spawn a puddle every X frames of movement
let puddleTimer = 0;

const puddleSprite = {
    image: new Image(),
    src: 'https://i.imgur.com/z6R5u07.png',
    width: 32,
    height: 32,
    frames: 6,
    frameRate: 10
};

const puddleSpriteVertical = {
    image: new Image(),
    src: 'https://i.imgur.com/NFIUahx.png',
    width: 32,
    height: 32,
    frames: 6,
    frameRate: 10
};

// Enemy (Cat) properties
const enemies = [];
const CAT_RADIUS = 16;
const CAT_SPEED = 0.75;
let initialCatSpawnInterval = 90; // Initial spawn interval
let CAT_SPAWN_INTERVAL = initialCatSpawnInterval; // Current spawn interval
const CAT_SPAWN_INCREASE_INTERVAL = 10 * 120; // Increase rate every 10 seconds (1200 frames, assuming 120 FPS)
const CAT_SPAWN_INCREASE_AMOUNT = 5; // Decrease CAT_SPAWN_INTERVAL by this amount
let catSpawnTimer = 0;

const catSprite = {
    image: new Image(),
    src: 'https://i.imgur.com/0eoSSUs.png',
    width: 32,
    height: 32,
    frames: 6,
    frameRate: 8
};

// Input handling
const keysPressed = {};

// Music variables
let gameMusic;
let musicToggleButton;
let isMusicPlaying = false;

// --- Initialization ---

window.onload = function() {
    console.log("window.onload: Initializing game...");
    canvas = document.getElementById('gameCanvas');
    if (!canvas) {
        console.error("ERROR: Canvas element with ID 'gameCanvas' not found!");
        return;
    }
    ctx = canvas.getContext('2d');
    if (!ctx) {
        console.error("ERROR: Could not get 2D rendering context from canvas!");
        return;
    }
    console.log("Canvas and context obtained!");

    scoreDisplay = document.getElementById('scoreDisplay');
    healthDisplay = document.getElementById('healthDisplay'); // Get health display element
    messageBox = document.getElementById('messageBox');
    messageTextSpan = document.getElementById('messageText'); // Get the span inside messageBox for text
    newGameButton = document.getElementById('newGameButton');
    timerDisplay = document.getElementById('timerDisplay'); // Get the timer display element
    musicToggleButton = document.getElementById('musicToggleButton'); // Get the music toggle button

    // Get store elements
    storeButton = document.getElementById('storeButton');
    storePanel = document.getElementById('storePanel');
    totalCatsCaughtDisplay = document.getElementById('totalCatsCaughtDisplay');
    buyCatClawsButton = document.getElementById('buyCatClawsButton');
    catClawsStatus = document.getElementById('catClawsStatus');
    closeStoreButton = document.getElementById('closeStoreButton');
    // NEW: Get Twin Claw store elements
    twinClawItem = document.getElementById('twinClawItem');
    buyTwinClawButton = document.getElementById('buyTwinClawButton');
    twinClawStatus = document.getElementById('twinClawStatus');


    // Get audio element
    gameMusic = document.getElementById('gameMusic');

    // Check if all necessary UI elements are found
    if (!scoreDisplay || !healthDisplay || !messageBox || !messageTextSpan || !newGameButton || !timerDisplay ||
        !storeButton || !storePanel || !totalCatsCaughtDisplay || !buyCatClawsButton || !catClawsStatus || !closeStoreButton || !gameMusic || !musicToggleButton ||
        !twinClawItem || !buyTwinClawButton || !twinClawStatus) { // NEW: Check Twin Claw elements
        console.error("ERROR: One or more UI display elements or audio element not found! Check HTML IDs.");
        console.log("Missing elements check:", {scoreDisplay, healthDisplay, messageBox, messageTextSpan, newGameButton, timerDisplay, musicToggleButton, storeButton, storePanel, totalCatsCaughtDisplay, buyCatClawsButton, catClawsStatus, closeStoreButton, gameMusic, twinClawItem, buyTwinClawButton, twinClawStatus});
    } else {
        console.log("UI elements and audio obtained! gameMusic object:", gameMusic);
    }

    // Add event listeners
    if (newGameButton) {
        newGameButton.addEventListener('click', resetGame);
        console.log("New Game button event listener added.");
    }
    if (storeButton) {
        storeButton.addEventListener('click', toggleStore);
        console.log("Store button event listener added.");
    }
    if (buyCatClawsButton) {
        buyCatClawsButton.addEventListener('click', buyCatClaws);
        console.log("Buy Cat Claws button event listener added.");
    }
    // NEW: Add Twin Claw buy button listener
    if (buyTwinClawButton) {
        buyTwinClawButton.addEventListener('click', buyTwinClaw);
        console.log("Buy Twin Claw button event listener added.");
    }
    if (closeStoreButton) {
        closeStoreButton.addEventListener('click', toggleStore);
        console.log("Close Store button event listener added.");
    }
    if (musicToggleButton) {
        musicToggleButton.addEventListener('click', toggleMusic);
        console.log("Music Toggle button event listener added.");
    }

    resizeCanvas(); // Initial canvas resize
    player.x = canvas.width / 2;
    player.y = canvas.height / 2;
    console.log(`Initial player position: (${player.x}, ${player.y})`);

    // Update initial UI
    if (scoreDisplay) {
        scoreDisplay.textContent = score;
        console.log(`window.onload: Score display textContent set to: "${scoreDisplay.textContent}". Current display style: "${scoreDisplay.style.display}"`);
    }
    if (healthDisplay) { // Update initial health display
        healthDisplay.textContent = player.health;
    }
    if (totalCatsCaughtDisplay) totalCatsCaughtDisplay.textContent = totalCatsCaught; // Initialize total cats display
    updateCatClawsUI(); // Update Cat Claws status initially
    updateTwinClawUI(); // NEW: Update Twin Claw status initially
    console.log(`Initial score: ${score}, Initial health: ${player.health}, Total cats: ${totalCatsCaught}`);

    // Ensure buttons are initially visible before any game logic hides them
    if (newGameButton) {
        newGameButton.style.display = 'block';
        console.log("window.onload: New Game button initially set to display: block.");
    }
    if (storeButton) {
        storeButton.style.display = 'block';
        console.log("window.onload: Store button initially set to display: block.");
    }
    if (musicToggleButton) {
        musicToggleButton.style.display = 'block';
        console.log("window.onload: Music Toggle button initially set to display: block.");
    }


    // Load sprite images
    player.sprite.image.src = player.sprite.src;
    player.sprite.image.onload = () => {
        console.log("Player sprite image loaded successfully! (Dimensions: " + player.sprite.image.naturalWidth + "x" + player.sprite.image.naturalHeight + ")");
        console.log("Player sprite natural dimensions: " + player.sprite.image.naturalWidth + "x" + player.sprite.image.naturalHeight);
        draw();
    };
    player.sprite.image.onerror = (e) => {
        console.error("FAILED to load player sprite image. Check URL. Using fallback circle.", e);
    };

    // Load the cat claws sprite image as well
    player.catClawsSprite.image.src = player.catClawsSprite.src;
    player.catClawsSprite.image.onload = () => {
        console.log("Cat Claws sprite image loaded successfully! (Dimensions: " + player.catClawsSprite.image.naturalWidth + "x" + player.catClawsSprite.image.naturalHeight + ")");
    };
    player.catClawsSprite.image.onerror = (e) => {
        console.error("FAILED to load Cat Claws sprite image. Check URL.", e);
    };


    puddleSprite.image.src = puddleSprite.src;
    puddleSprite.image.onload = () => { console.log("Horizontal Puddle sprite image loaded successfully!"); };
    puddleSprite.image.onerror = (e) => { console.error("FAILED to load horizontal puddle sprite image. Using fallback circles.", e); };

    puddleSpriteVertical.image.src = puddleSpriteVertical.src;
    puddleSpriteVertical.image.onload = () => { console.log("Vertical Puddle sprite image loaded successfully!"); };
    puddleSpriteVertical.image.onerror = (e) => { console.error("FAILED to load vertical puddle sprite image. Using fallback circles.", e); };

    catSprite.image.src = catSprite.src;
    catSprite.image.onload = () => { console.log("Cat sprite image loaded successfully!"); };
    catSprite.image.onerror = (e) => { console.error("FAILED to load cat sprite image. Using fallback squares.", e); };

    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    console.log("Event listeners added.");

    startGame();
    showMessage("Welcome to Slime Survivor!", 2000);
    console.log("Game initialization complete!");
};

/**
 * Toggles music playback (play/pause and mute/unmute).
 */
function toggleMusic() {
    console.log("toggleMusic called. Current state: isMusicPlaying:", isMusicPlaying, "gameMusic.paused:", gameMusic.paused, "gameMusic.muted:", gameMusic.muted);
    if (!gameMusic) {
        console.error("toggleMusic: gameMusic element is NULL or UNDEFINED!");
        showMessage("Music player not found. Please check HTML.", 3000);
        return;
    }

    if (isMusicPlaying) {
        gameMusic.pause();
        gameMusic.muted = true; // Mute when paused
        isMusicPlaying = false;
        musicToggleButton.textContent = "Play Music";
        console.log("Music paused and muted.");
    } else {
        gameMusic.muted = false; // Unmute before playing
        gameMusic.volume = 0.5; // Set a default volume
        console.log("Attempting to play music via toggle button...");
        gameMusic.play().then(() => {
            isMusicPlaying = true;
            musicToggleButton.textContent = "Pause Music";
            console.log("Music started playing successfully via toggle button.");
        }).catch(error => {
            console.error("Error playing music from toggle button:", error);
            // Specifically check for NotAllowedError to provide tailored message
            if (error.name === "NotAllowedError") {
                showMessage("Music playback requires user interaction. Try clicking again.", 3000);
            } else {
                showMessage("Music playback failed. See console for details.", 3000);
            }
        });
    }
}


/**
 * Resets the game to its initial state and starts a new round.
 */
function resetGame() {
    console.log("resetGame: FUNCTION CALLED. Starting a new game round.");
    // Hide the message box
    if (messageBox) {
        messageBox.classList.remove('visible');
        messageBox.classList.add('hidden');
        if (messageTimeoutId) {
            clearTimeout(messageTimeoutId);
            messageTimeoutId = null;
        }
    }

    // Reset game state variables for the new round
    score = 0;
    player.health = player.maxHealth;
    if (healthDisplay) healthDisplay.textContent = player.health; // Update health display on reset
    console.log("resetGame: Player health reset to:", player.health); // Added log
    puddles.length = 0; // Clear puddles array
    enemies.length = 0; // Clear enemies array
    slashes.length = 0; // Clear slashes array
    puddleTimer = 0;
    catSpawnTimer = 0;
    gameTimer = 0; // Reset game timer
    CAT_SPAWN_INTERVAL = initialCatSpawnInterval; // Reset cat spawn interval
    player.isInvulnerable = false;
    player.invulnerabilityTimer = 0;
    catClawsCooldown = 0; // Reset cooldown for new game

    // Ensure upgrade states are reset correctly if the game fully resets (e.g., from a new game button after a refresh)
    // For a full game reset (like from a browser refresh or if we want upgrades to be one-time buys)
    // if a hard reset of ALL upgrades is desired on "New Game", uncomment these:
    // catClawsOwned = false;
    // twinClawOwned = false;

    // Reset player position
    player.x = canvas.width / 2;
    player.y = canvas.height / 2;

    // Reset player sprite to default if Cat Claws is not owned, otherwise use Cat Claws sprite.
    // This maintains the correct sprite across resets if the upgrade is persistent.
    if (!catClawsOwned) {
        player.sprite.image.src = 'https://i.imgur.com/ShxaI1U.png';
        player.sprite.frames = 9;
        player.sprite.height = 32;
        player.sprite.currentFrame = 0;
        console.log("resetGame: Player sprite reset to original.");
    } else {
        player.sprite.image.src = player.catClawsSprite.src;
        player.sprite.frames = player.catClawsSprite.frames;
        player.sprite.height = player.catClawsSprite.height;
        player.sprite.currentFrame = 0;
        console.log("resetGame: Player sprite remains Cat Claws version.");
    }


    // Update UI
    if (scoreDisplay) scoreDisplay.textContent = score;
    // totalCatsCaughtDisplay is updated in buyCatClaws or gameOver, no need to reset here
    updateCatClawsUI(); // Update UI for Cat Claws
    updateTwinClawUI(); // NEW: Update UI for Twin Claw


    // Ensure game buttons are visible
    if (newGameButton) newGameButton.style.display = 'block';
    if (storeButton) storeButton.style.display = 'block';
    if (musicToggleButton) musicToggleButton.style.display = 'block';


    // Restart the game loop
    startGame();
    showMessage("New Game! Survive the cats!", 2000);
    draw(); // Initial draw for the new game state
}

/**
 * Toggles the visibility of the store panel.
 */
function toggleStore() {
    isStoreOpen = !isStoreOpen;
    if (storePanel) {
        if (isStoreOpen) {
            storePanel.classList.add('visible');
            storePanel.classList.remove('hidden');
            if (totalCatsCaughtDisplay) {
                totalCatsCaughtDisplay.textContent = totalCatsCaught; // Update total cats when opening store
            }
            updateCatClawsUI(); // Update Cat Claws status when store opens
            updateTwinClawUI(); // NEW: Update Twin Claw status when store opens

            // Pause game when store is open
            gameRunning = false;
            console.log("toggleStore: Store opened. gameRunning set to FALSE.");
            // Hide game over message if it's visible when store opens
            if (messageBox) {
                messageBox.classList.remove('visible');
                messageBox.classList.add('hidden');
            }
            // Hide all game control buttons when store is open
            if (newGameButton) newGameButton.style.display = 'none';
            if (storeButton) storeButton.style.display = 'none';
            if (musicToggleButton) musicToggleButton.style.display = 'none';
        } else { // Closing store
            storePanel.classList.remove('visible');
            storePanel.classList.add('hidden');
            // Resume game when store is closed, only if player is alive
            console.log("toggleStore: Closing store. Player health on close:", player.health); // Added log
            if (player.health > 0) {
                gameRunning = true;
                console.log("toggleStore: Store closed. Player alive. gameRunning set to TRUE.");
                gameLoop(); // Restart the game loop
                // When game resumes, ensure game buttons are visible
                if (newGameButton) newGameButton.style.display = 'block';
                if (storeButton) storeButton.style.display = 'block';
                if (musicToggleButton) musicToggleButton.style.display = 'block';
            } else { // Game is over (player.health <= 0)
                // If game is over, show New Game and Store buttons
                console.log("toggleStore: Game is over, showing New Game and Store buttons.");
                if (newGameButton) newGameButton.style.display = 'block';
                if (storeButton) storeButton.style.display = 'block';
                if (musicToggleButton) musicToggleButton.style.display = 'block';
            }
            console.log("toggleStore: Store closed. Final button states: New Game:", newGameButton.style.display, "Store:", storeButton.style.display);
        }
    }
    console.log("Store toggled. isStoreOpen:", isStoreOpen);
}

/**
 * Handles the purchase of Cat Claws upgrade.
 */
function buyCatClaws() {
    if (catClawsOwned) {
        showMessage("You already own Cat Claws!", 1500);
        return;
    }

    if (totalCatsCaught >= CAT_CLAWS_COST) {
        totalCatsCaught -= CAT_CLAWS_COST;
        catClawsOwned = true;
        if (totalCatsCaughtDisplay) totalCatsCaughtDisplay.textContent = totalCatsCaught;
        updateCatClawsUI();
        updateTwinClawUI(); // NEW: Update Twin Claw UI visibility after buying Cat Claws
        showMessage("Cat Claws purchased!", 1500);
        console.log("Cat Claws purchased. Total cats remaining:", totalCatsCaught);

        // Change player sprite to Cat Claws version
        player.sprite.image.src = player.catClawsSprite.src;
        player.sprite.frames = player.catClawsSprite.frames;
        player.sprite.height = player.catClawsSprite.height;
        player.sprite.currentFrame = 0; // Reset animation to first frame of new sprite
        console.log("Player sprite changed to Cat Claws version.");

    } else {
        showMessage(`Not enough cats! Need ${CAT_CLAWS_COST - totalCatsCaught} more.`, 1500);
        console.log("Failed to purchase Cat Claws. Not enough cats.");
    }
}

/**
 * NEW: Handles the purchase of Twin Claw upgrade.
 */
function buyTwinClaw() {
    console.log("buyTwinClaw called. Current totalCatsCaught:", totalCatsCaught, "catClawsOwned:", catClawsOwned);
    if (twinClawOwned) {
        showMessage("You already own Twin Claw!", 1500);
        return;
    }

    if (!catClawsOwned) {
        showMessage("You need Cat Claws first!", 1500);
        console.log("Twin Claw purchase failed: Cat Claws not owned.");
        return;
    }

    if (totalCatsCaught >= TWIN_CLAW_COST) {
        totalCatsCaught -= TWIN_CLAW_COST;
        twinClawOwned = true;
        if (totalCatsCaughtDisplay) totalCatsCaughtDisplay.textContent = totalCatsCaught;
        updateTwinClawUI(); // Update UI for Twin Claw
        showMessage("Twin Claw purchased! Your claws now strike twice!", 2000);
        console.log("Twin Claw purchased. Total cats remaining:", totalCatsCaught);
    } else {
        showMessage(`Not enough cats! Need ${TWIN_CLAW_COST - totalCatsCaught} more.`, 1500);
        console.log(`Twin Claw purchase failed: Not enough cats. Needed ${TWIN_CLAW_COST}, have ${totalCatsCaught}.`);
    }
}

/**
 * Updates the UI display for the Cat Claws upgrade.
 */
function updateCatClawsUI() {
    if (catClawsStatus && buyCatClawsButton) {
        if (catClawsOwned) {
            catClawsStatus.textContent = "Owned";
            buyCatClawsButton.disabled = true;
            buyCatClawsButton.textContent = "Owned";
            buyCatClawsButton.style.backgroundColor = '#6B7280'; // Gray out
            buyCatClawsButton.style.cursor = 'not-allowed';
        } else {
            catClawsStatus.textContent = `Cost: ${CAT_CLAWS_COST} Cats`;
            buyCatClawsButton.disabled = false;
            buyCatClawsButton.textContent = "Buy";
            buyCatClawsButton.style.backgroundColor = '#4CAF50'; // Green
            buyCatClawsButton.style.cursor = 'pointer';
        }
    }
}

/**
 * NEW: Updates the UI display for the Twin Claw upgrade.
 */
function updateTwinClawUI() {
    console.log("updateTwinClawUI called. catClawsOwned:", catClawsOwned, "twinClawOwned:", twinClawOwned);
    if (twinClawItem && buyTwinClawButton && twinClawStatus) {
        if (!catClawsOwned) {
            twinClawItem.style.display = 'none'; // Hide Twin Claw if Cat Claws not owned
            console.log("Twin Claw item hidden because Cat Claws not owned.");
        } else {
            twinClawItem.style.display = 'block'; // Show Twin Claw if Cat Claws owned
            console.log("Twin Claw item shown because Cat Claws is owned.");
            if (twinClawOwned) {
                twinClawStatus.textContent = "Owned";
                buyTwinClawButton.disabled = true;
                buyTwinClawButton.textContent = "Owned";
                buyTwinClawButton.style.backgroundColor = '#6B7280';
                buyTwinClawButton.style.cursor = 'not-allowed';
                console.log("Twin Claw status: Owned.");
            } else {
                twinClawStatus.textContent = `Cost: ${TWIN_CLAW_COST} Cats`;
                buyTwinClawButton.disabled = false;
                buyTwinClawButton.textContent = "Buy";
                buyTwinClawButton.style.backgroundColor = '#4CAF50';
                buyTwinClawButton.style.cursor = 'pointer';
                console.log("Twin Claw status: Available for purchase.");
            }
        }
    } else {
        console.warn("updateTwinClawUI: One or more Twin Claw UI elements not found.");
    }
}


function resizeCanvas() {
    console.log("resizeCanvas: Adjusting canvas dimensions...");
    if (!canvas || !canvas.parentElement) {
        console.error("resizeCanvas: Canvas or parent element not found.");
        return;
    }

    const container = canvas.parentElement;
    // Get the actual available space for the canvas within its container
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    const targetAspectRatio = 16 / 9; // Desired aspect ratio for the game area

    let newCanvasWidth = containerWidth;
    let newCanvasHeight = containerHeight;

    // Calculate dimensions to fit within container while maintaining aspect ratio
    if (newCanvasWidth / newCanvasHeight > targetAspectRatio) {
        // Container is wider than target aspect ratio, constrain by height
        newCanvasWidth = newCanvasHeight * targetAspectRatio;
    } else {
        // Container is taller than target aspect ratio, constrain by width
        newCanvasHeight = newCanvasWidth / targetAspectRatio;
    }

    // Store old dimensions to check if player needs re-centering
    const oldCanvasWidth = canvas.width;
    const oldCanvasHeight = canvas.height;

    // Set the canvas element's actual drawing buffer size
    canvas.width = newCanvasWidth;
    canvas.height = newCanvasHeight;

    // Set the canvas element's CSS size to match its drawing buffer size
    canvas.style.width = `${newCanvasWidth}px`;
    canvas.style.height = `${newCanvasHeight}px`;

    console.log(`Canvas drawing buffer set to: ${canvas.width}x${canvas.height}`);
    console.log(`Canvas CSS style set to: width: ${canvas.style.width}, height: ${canvas.style.height}`);

    // Re-center player if canvas dimensions changed
    if (oldCanvasWidth !== canvas.width || oldCanvasHeight !== canvas.height) {
        player.x = canvas.width / 2;
        player.y = canvas.height / 2;
        console.log(`Player position adjusted to (${player.x}, ${player.y}) due to resize.`);
    }

    if (gameRunning) {
        draw();
        console.log("Redrawing after resize.");
    }
}

/**
 * Displays a temporary message in the message box.
 * @param {string} message - The message to display.
 * @param {number} duration - How long to display the message in milliseconds. If 0, it stays visible.
 */
function showMessage(message, duration) {
    if (messageBox && messageTextSpan) {
        if (messageTimeoutId) {
            clearTimeout(messageTimeoutId);
            messageTimeoutId = null;
            console.log("showMessage: Cleared previous message timeout.");
        }

        console.log(`showMessage: Attempting to show message: "${message}" for ${duration}ms.`);
        messageTextSpan.textContent = message; // Update the text content of the span
        
        messageBox.classList.add('visible');
        messageBox.classList.remove('hidden');
        
        // Removed button visibility logic from here. Buttons are now controlled by startGame/gameOver/toggleStore.

        if (duration > 0) {
            messageTimeoutId = setTimeout(() => {
                console.log(`showMessage (timeout callback): Hiding message: "${message}" after ${duration}ms. Player health: ${player.health}.`);
                messageBox.classList.remove('visible');
                messageBox.classList.add('hidden');
                messageTimeoutId = null;
                // No button visibility logic here anymore.
            }, duration);
        } else {
            console.log(`showMessage: Message "${message}" will remain visible indefinitely.`);
        }
    } else {
        console.warn(`showMessage: Attempted to show message "${message}", but messageBox or messageTextSpan element not found.`);
    }
}

// --- Input Handlers ---

function handleKeyDown(event) {
    keysPressed[event.key] = true;
}

function handleKeyUp(event) {
    keysPressed[event.key] = false;
}

// --- Game Loop ---

function startGame() {
    console.log("startGame: Initiating game loop. Current gameRunning:", gameRunning);
    gameRunning = true;
    console.log("startGame: gameRunning set to TRUE. Calling gameLoop().");
    // Hide buttons when game starts
    if (newGameButton) {
        newGameButton.style.display = 'none';
        console.log("startGame: Hiding New Game button.");
    }
    if (storeButton) {
        storeButton.style.display = 'none';
        console.log("startGame: Hiding Store button.");
    }
    if (musicToggleButton) {
        musicToggleButton.style.display = 'block'; // Ensure music button is visible during game
    }
    // Attempt to play music when game starts (unmuted)
    if (gameMusic && !isMusicPlaying) {
        gameMusic.muted = false;
        gameMusic.volume = 0.5; // Ensure volume is set
        console.log("startGame: Attempting to play music automatically.");
        gameMusic.play().then(() => {
            isMusicPlaying = true;
            musicToggleButton.textContent = "Pause Music";
            console.log("Music started on game start automatically (if allowed).");
        }).catch(error => {
            console.warn("Music autoplay prevented on game start:", error);
            // Specifically check for NotAllowedError to provide tailored message
            if (error.name === "NotAllowedError") {
                showMessage("Music autoplay blocked. Click 'Toggle Music' to enable.", 3000);
            } else {
                showMessage("Music playback failed. See console for details.", 3000);
            }
        });
    }

    gameLoop();
    console.log("gameLoop: Requesting next animation frame.");
}

function gameLoop() {
    if (!gameRunning) {
        console.log("gameLoop: Game not running (gameRunning is FALSE), stopping loop.");
        return;
    }
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// --- Update Logic ---

function update() {
    if (!gameRunning) return;
    if (isStoreOpen) return; // Pause game logic if store is open

    gameTimer++; // Increment game timer

    // Check for win condition
    if (gameTimer >= GAME_DURATION) {
        winGame();
        return; // Stop further updates if game is won
    }

    // Increase cat spawn rate every CAT_SPAWN_INCREASE_INTERVAL frames
    // Ensure CAT_SPAWN_INTERVAL doesn't go below a reasonable minimum (e.g., 10 frames)
    if (gameTimer % CAT_SPAWN_INCREASE_INTERVAL === 0 && CAT_SPAWN_INTERVAL > 10) {
        CAT_SPAWN_INTERVAL = Math.max(10, CAT_SPAWN_INTERVAL - CAT_SPAWN_INCREASE_AMOUNT);
        console.log(`Cat spawn interval increased! New interval: ${CAT_SPAWN_INTERVAL}`);
        // Removed: showMessage(`Cats are getting faster!`, 1500);
    }


    updatePlayer();
    updatePuddles();
    updateCats();
    checkCollisions();
    updatePlayerAnimation(); // Re-enabled player animation update
    updateSlashes(); // New: Update slashes for visual effect

    // Handle Cat Claws attack (now potentially Twin Claw)
    if (catClawsOwned && catClawsCooldown === 0) {
        checkCatClawsAttack(); // This function now handles single/twin attacks
    }
    if (catClawsCooldown > 0) {
        catClawsCooldown--;
    }

    puddleTimer++;
    catSpawnTimer++;

    // Update timer display
    const remainingTime = Math.max(0, Math.floor((GAME_DURATION - gameTimer) / 120)); // Convert frames to seconds
    const minutes = Math.floor(remainingTime / 60);
    const seconds = remainingTime % 60;
    if (timerDisplay) {
        timerDisplay.textContent = `Time: ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
}

function updatePlayer() {
    let dx = 0;
    let dy = 0;

    if (keysPressed['w'] || keysPressed['ArrowUp']) {
        dy -= player.speed;
    }
    if (keysPressed['s'] || keysPressed['ArrowDown']) {
        dy += player.speed;
    }
    if (keysPressed['a'] || keysPressed['ArrowLeft']) {
        dx -= player.speed;
    }
    if (keysPressed['d'] || keysPressed['ArrowRight']) {
        dx += player.speed;
    }

    if (dx !== 0 && dy !== 0) {
        const magnitude = Math.sqrt(dx * dx + dy * dy);
        dx = (dx / magnitude) * player.speed;
        dy = (dy / magnitude) * player.speed;
    }

    player.x += dx;
    player.y += dy;

    player.x = Math.max(player.radius, Math.min(canvas.width - player.radius, player.x));
    player.y = Math.max(player.radius, Math.min(canvas.height - player.radius, player.y));

    let currentPuddleSprite = puddleSprite;
    if (Math.abs(dy) > Math.abs(dx)) {
        currentPuddleSprite = puddleSpriteVertical;
    }

    if (player.isInvulnerable) {
        player.invulnerabilityTimer--;
        if (player.invulnerabilityTimer <= 0) {
            player.isInvulnerable = false;
        }
    }

    if ((dx !== 0 || dy !== 0) && puddleTimer >= PUDDLE_SPAWN_INTERVAL) {
        puddles.push({
            x: player.x,
            y: player.y + player.radius * 1.1,
            radius: player.radius * 0.8,
            alpha: 1,
            lifespan: PUDDLE_LIFESPAN,
            currentFrame: 0,
            animationTimer: 0,
            sprite: currentPuddleSprite
        });
        puddleTimer = 0;
    }
}

function updatePuddles() {
    for (let i = puddles.length - 1; i >= 0; i--) {
        const puddle = puddles[i];
        puddle.lifespan--;
        puddle.alpha = puddle.lifespan / PUDDLE_LIFESPAN;

        puddle.animationTimer++;
        if (puddle.animationTimer >= puddle.sprite.frameRate) {
            puddle.currentFrame = (puddle.currentFrame + 1) % puddle.sprite.frames;
            puddle.animationTimer = 0;
        }

        if (puddle.lifespan <= 0) {
            puddles.splice(i, 1);
        }
    }
}

function updateCats() {
    if (catSpawnTimer >= CAT_SPAWN_INTERVAL) {
        spawnCat();
        catSpawnTimer = 0;
    }

    for (const cat of enemies) {
        if (!cat.isTrapped) {
            const angle = Math.atan2(player.y - cat.y, player.x - cat.x);
            cat.x += Math.cos(angle) * CAT_SPEED;
            cat.y += Math.sin(angle) * CAT_SPEED;
        }
        cat.animationTimer++;
        if (cat.animationTimer >= catSprite.frameRate) {
            cat.currentFrame = (cat.currentFrame + 1) % catSprite.frames;
            cat.animationTimer = 0;
        }
    }
}

function spawnCat() {
    let x, y;
    const spawnPadding = 50;
    const side = Math.floor(Math.random() * 4);

    switch (side) {
        case 0: // Top
            x = Math.random() * canvas.width;
            y = -CAT_RADIUS - spawnPadding;
            break;
        case 1: // Right
            x = canvas.width + CAT_RADIUS + spawnPadding;
            y = Math.random() * canvas.height;
            break;
        case 2: // Bottom
            x = Math.random() * canvas.width;
            y = canvas.height + CAT_RADIUS + spawnPadding;
            break;
        case 3: // Left
            x = -CAT_RADIUS - spawnPadding;
            y = Math.random() * canvas.height;
            break;
    }

    enemies.push({
        x: x,
        y: y,
        radius: CAT_RADIUS,
        speed: CAT_SPEED,
        color: '#FF0000',
        isTrapped: false,
        sprite: catSprite,
        currentFrame: 0,
        animationTimer: 0
    });
}

/**
 * Checks for collisions between player and cats, and cat-puddle.
 */
function checkCollisions() {
    // Check for cat-puddle collisions (trapping cats)
    for (const cat of enemies) {
        if (!cat.isTrapped) {
            for (const puddle of puddles) {
                const distance = Math.sqrt(
                    (cat.x - puddle.x) ** 2 + (cat.y - puddle.y) ** 2
                );
                if (distance < cat.radius + puddle.radius) {
                    cat.isTrapped = true;
                    cat.color = '#8A2BE2';
                    break;
                }
            }
        }
    }

    // Check for player-cat collisions
    for (let i = enemies.length - 1; i >= 0; i--) {
        const cat = enemies[i];
        const distance = Math.sqrt(
            (player.x - cat.x) ** 2 + (player.y - cat.y) ** 2
        );

        if (distance < player.radius + cat.radius) {
            if (cat.isTrapped) {
                score++;
                totalCatsCaught++; // Increment total cats caught
                if (scoreDisplay) scoreDisplay.textContent = score; // Update current round score display
                if (totalCatsCaughtDisplay) totalCatsCaughtDisplay.textContent = totalCatsCaught; // Update total cats display in store
                enemies.splice(i, 1);
            } else if (!player.isInvulnerable) {
                player.health--;
                if (healthDisplay) healthDisplay.textContent = player.health; // Update health display
                player.isInvulnerable = true;
                player.invulnerabilityTimer = player.invulnerabilityDuration;

                if (player.health <= 0) {
                    gameOver();
                    return;
                }
                enemies.splice(i, 1);
            }
        }
    }
}

/**
 * Checks for and applies Cat Claws attack to nearby enemies.
 * Now handles single or twin attacks based on twinClawOwned.
 */
function checkCatClawsAttack() {
    if (catClawsOwned && catClawsCooldown === 0) {
        let attacksPerformed = 0;
        const maxAttacks = twinClawOwned ? 2 : 1; // Perform 2 attacks if Twin Claw owned, else 1

        // Loop to perform multiple attacks if Twin Claw is owned
        // We need a way to track which cats have been targeted in THIS single activation
        // to avoid hitting the same cat twice if only one is available.
        const targetedCats = new Set(); // Use a Set to keep track of cats targeted in this activation

        for (let i = 0; i < maxAttacks; i++) {
            let closestCat = null;
            let minDistance = Infinity;

            for (const cat of enemies) {
                // Only consider untrapped cats that haven't been targeted yet in this multi-attack
                if (!cat.isTrapped && !targetedCats.has(cat)) {
                    const distance = Math.sqrt(
                        (player.x - cat.x) ** 2 + (player.y - cat.y) ** 2
                    );
                    if (distance <= CAT_CLAWS_RANGE && distance < minDistance) {
                        minDistance = distance;
                        closestCat = cat;
                    }
                }
            }

            if (closestCat) {
                // Add a slash visual effect
                slashes.push({
                    x: closestCat.x,
                    y: closestCat.y,
                    alpha: 1,
                    lifespan: 30
                });
                
                targetedCats.add(closestCat); // Mark this cat as targeted for this wave
                attacksPerformed++;
            }

            if (attacksPerformed >= maxAttacks) break; // Stop if max attacks performed
        }

        // Now remove all cats that were successfully targeted and collected in this batch
        // We iterate enemies backwards because we'll be splicing elements
        for (let i = enemies.length - 1; i >= 0; i--) {
            if (targetedCats.has(enemies[i])) {
                enemies.splice(i, 1);
            }
        }

        if (attacksPerformed > 0) {
            catClawsCooldown = CAT_CLAWS_COOLDOWN_DURATION; // Apply cooldown after successful attack(s)
        }
    }
}

/**
 * Updates the state of all slash effects (fading and removal).
 */
function updateSlashes() {
    for (let i = slashes.length - 1; i >= 0; i--) {
        const slash = slashes[i];
        slash.lifespan--;
        slash.alpha = slash.lifespan / 30; // Fade out over its lifespan

        if (slash.lifespan <= 0) {
            slashes.splice(i, 1);
        }
    }
}

/**
 * Ends the game.
 */
function gameOver() {
    gameRunning = false;
    console.log("gameOver: Player health is:", player.health); // Log player health at game over
    // Clear any existing message timeout to ensure game over message remains
    if (messageTimeoutId) {
        clearTimeout(messageTimeoutId);
        messageTimeoutId = null;
        console.log("gameOver: Cleared message timeout to display game over message.");
    }
    showMessage(`GAME OVER! You collected ${score} cats this round! Total cats ever caught: ${totalCatsCaught}. Your Slime Perished.`, 0);
    console.log("gameOver: Final Score (round):", score, "Total Cats Ever Caught:", totalCatsCaught);

    // Explicitly show buttons when game is over
    if (newGameButton) {
        newGameButton.style.display = 'block';
        console.log("gameOver: Showing New Game button.");
    }
    if (storeButton) {
        storeButton.style.display = 'block';
        console.log("gameOver: Showing Store button.");
    }
    if (musicToggleButton) {
        musicToggleButton.style.display = 'block'; // Show music button when game is over
    }
    // Pause music on game over
    if (gameMusic && isMusicPlaying) {
        gameMusic.pause();
        isMusicPlaying = false;
        musicToggleButton.textContent = "Play Music";
        console.log("Music paused on game over.");
    }
}

/**
 * Handles the game winning condition.
 */
function winGame() {
    gameRunning = false;
    console.log("winGame: Player has survived the duration!");
    if (messageTimeoutId) {
        clearTimeout(messageTimeoutId);
        messageTimeoutId = null;
    }
    showMessage(`YOU WIN! You survived for 3 minutes and collected ${score} cats!`, 0);
    
    // Explicitly show buttons when game is won
    if (newGameButton) {
        newGameButton.style.display = 'block';
        console.log("winGame: Showing New Game button.");
    }
    if (storeButton) {
        storeButton.style.display = 'block';
        console.log("winGame: Showing Store button.");
    }
    if (musicToggleButton) {
        musicToggleButton.style.display = 'block'; // Show music button when game is won
    }
    // Pause music on game win
    if (gameMusic && isMusicPlaying) {
        gameMusic.pause();
        isMusicPlaying = false;
        musicToggleButton.textContent = "Play Music";
        console.log("Music paused on game win.");
    }
}


/**
 * Updates the player's sprite animation frame.
 */
function updatePlayerAnimation() {
    player.animationTimer++;
    if (player.animationTimer >= player.sprite.frameRate) {
        player.sprite.currentFrame = (player.sprite.currentFrame + 1) % player.sprite.frames;
        player.animationTimer = 0;
    }
}

// --- Drawing Logic ---

function draw() {
    // Debugging: Log globalAlpha at the start of each draw frame
    // console.log("draw(): ctx.globalAlpha at start:", ctx.globalAlpha); // Too verbose

    if (!ctx) {
        console.error("draw: 2D rendering context (ctx) is not available.");
        return;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawPuddles();
    drawCats();
    drawPlayer();
    drawHealthBar();
    drawSlashes(); // New: Draw slash effects
    updateTimerDisplay(); // Update the timer display
}

function drawPlayer() {
    if (!ctx) return;
    // Debugging: Log player sprite loading status
    // console.log("drawPlayer(): Player sprite image complete:", player.sprite.image.complete, "naturalWidth:", player.sprite.image.naturalWidth, "naturalHeight:", player.sprite.image.naturalHeight); // Too verbose

    // Ensure image is loaded and has valid dimensions before attempting to draw sprite
    if (player.sprite.image && player.sprite.image.complete && player.sprite.image.naturalWidth > 0 && player.sprite.image.naturalHeight > 0) {
        // console.log("drawPlayer(): Attempting to draw sprite. Image dimensions:", player.sprite.image.naturalWidth, "x", player.sprite.image.naturalHeight); // Too verbose
        
        // Source rectangle on the sprite sheet
        const bleedOffset = 0.5; // Small offset to prevent pixel bleeding from adjacent frames
        const sx = bleedOffset;
        const sy = player.sprite.currentFrame * player.sprite.height + bleedOffset; // Calculate Y position based on current frame, with offset
        const sWidth = player.sprite.width - (2 * bleedOffset); // Reduce width by twice the offset
        const sHeight = player.sprite.height - (2 * bleedOffset); // Reduce height by twice the offset

        // console.log(`drawPlayer(): drawImage source: sx=${sx}, sy=${sy}, sWidth=${sWidth}, sHeight=${sHeight}`); // Too verbose

        ctx.save(); // Save the current canvas state before applying transformations/alpha

        if (player.isInvulnerable) {
            if (Math.floor(player.invulnerabilityTimer / 10) % 2 === 0) {
                ctx.globalAlpha = 0.5; // Apply invulnerability flicker
            }
        }

        // Draw the specific frame of the sprite sheet onto the canvas
        ctx.drawImage(
            player.sprite.image,
            sx,
            sy,
            sWidth,
            sHeight,
            player.x - player.radius, // Destination X (center of player minus radius)
            player.y - player.radius, // Destination Y (center of player minus radius)
            player.radius * 2,         // Destination Width (player diameter)
            player.radius * 2          // Destination Height (player diameter)
        );
        
        ctx.restore(); // Restore the canvas state (resets globalAlpha, etc.)
    } else {
        // Fallback: Draw a circle if the sprite image is not loaded or invalid
        console.warn("drawPlayer(): Player sprite not ready or invalid, drawing fallback circle. Image complete:", player.sprite.image.complete, "naturalWidth:", player.sprite.image.naturalWidth, "naturalHeight:", player.sprite.image.naturalHeight);
        ctx.beginPath();
        ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
        ctx.fillStyle = player.color; // Use player's color
        ctx.fill();
        ctx.strokeStyle = '#32CD32'; // Darker green border
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.closePath();
        console.log("drawPlayer(): Fallback circle drawn.");
    }
}

function drawPuddles() {
    if (!ctx) return;
    for (const puddle of puddles) {
        ctx.globalAlpha = puddle.alpha;
        if (puddle.sprite.image.complete && puddle.sprite.image.naturalWidth !== 0) {
            const bleedOffset = 0.5; // Keep for puddles if they look fine
            const sx = bleedOffset;
            const sy = puddle.currentFrame * puddle.sprite.height + bleedOffset;
            const sWidth = puddle.sprite.width - (2 * bleedOffset);
            const sHeight = puddle.sprite.height - (2 * bleedOffset);

            ctx.drawImage(
                puddle.sprite.image,
                sx,
                sy,
                sWidth,
                sHeight,
                puddle.x - puddle.radius,
                puddle.y - puddle.radius,
                puddle.radius * 2,
                puddle.radius * 2
            );
        } else {
            ctx.beginPath();
            ctx.arc(puddle.x, puddle.y, puddle.radius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(100, 149, 237, ${puddle.alpha})`;
            ctx.fill();
            ctx.closePath();
        }
        ctx.globalAlpha = 1;
    }
}

function drawCats() {
    if (!ctx) return;
    for (const cat of enemies) {
        ctx.globalAlpha = 1; // Ensure cats are not affected by player's alpha
        if (cat.sprite.image.complete && cat.sprite.image.naturalWidth !== 0) {
            const bleedOffset = 0.5; // Keep for cats if they look fine
            const sx = bleedOffset;
            const sy = cat.currentFrame * cat.sprite.height + bleedOffset;
            const sWidth = cat.sprite.width - (2 * bleedOffset);
            const sHeight = cat.sprite.height - (2 * bleedOffset);

            ctx.save();
            ctx.translate(cat.x, cat.y);

            if (player.x > cat.x) {
                ctx.scale(-1, 1);
            }

            if (cat.isTrapped) {
                ctx.beginPath();
                ctx.arc(0, 0, cat.radius * 1.2, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(0, 255, 0, 0.5)';
                ctx.fill();
                ctx.closePath();
            }

            ctx.drawImage(
                cat.sprite.image,
                sx,
                sy,
                sWidth,
                sHeight,
                -cat.radius,
                -cat.radius,
                cat.radius * 2,
                cat.radius * 2
            );

            ctx.restore();
        } else {
            ctx.fillStyle = cat.color;
            ctx.fillRect(
                cat.x - cat.radius,
                cat.y - cat.radius,
                cat.radius * 2,
                cat.radius * 2
            );
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 2;
            ctx.strokeRect(
                cat.x - cat.radius,
                cat.y - cat.radius,
                cat.radius * 2,
                cat.radius * 2
            );
        }
    }
}

function drawHealthBar() {
    if (!ctx) return;

    const barWidth = player.radius * 4;
    const barHeight = 8;
    const barX = player.x - barWidth / 2;
    const barY = player.y - player.radius - barHeight - 5;

    ctx.fillStyle = '#555';
    ctx.fillRect(barX, barY, barWidth, barHeight);

    const currentHealthWidth = (player.health / player.maxHealth) * barWidth;
    ctx.fillStyle = '#00FF00';
    ctx.fillRect(barX, barY, currentHealthWidth, barHeight);

    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barWidth, barHeight);
}

/**
 * Draws the visual slash effects for Cat Claws.
 */
function drawSlashes() {
    if (!ctx) return;
    for (const slash of slashes) {
        ctx.globalAlpha = slash.alpha;
        ctx.strokeStyle = `rgba(255, 255, 255, ${slash.alpha})`; // White slashes
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';

        // Draw multiple small lines to simulate a slash effect
        for (let i = 0; i < 3; i++) {
            const angle = Math.random() * Math.PI * 2; // Random angle
            const length = 10 + Math.random() * 10; // Random length
            const startX = slash.x + Math.cos(angle) * (slash.lifespan / 5); // Move slightly as it fades
            const startY = slash.y + Math.sin(angle) * (slash.lifespan / 5);
            const endX = startX + Math.cos(angle + Math.PI / 4) * length;
            const endY = startY + Math.sin(angle + Math.PI / 4) * length;

            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(endX, endY);
            ctx.stroke();
        }
        ctx.globalAlpha = 1; // Reset global alpha
    }
}

/**
 * Updates the display of the game timer.
 */
function updateTimerDisplay() {
    if (timerDisplay) {
        // Calculate remaining frames based on the assumed FPS (e.g., 120 FPS)
        const remainingFrames = GAME_DURATION - gameTimer;
        // Convert frames to seconds using the assumed FPS (120 FPS)
        const remainingSeconds = Math.max(0, Math.floor(remainingFrames / 120));
        const minutes = Math.floor(remainingSeconds / 60);
        const seconds = remainingSeconds % 60;
        timerDisplay.textContent = `Time: ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
}
