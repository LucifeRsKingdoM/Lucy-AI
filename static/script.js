// script1.js - Lucy AI Dashboard JavaScript


// ================================
// MOBILE CRASH PREVENTION - ADD THIS FIRST!
// ================================


// ================================
// CRITICAL MOBILE FIXES
// ================================

// Fix toast dismiss functionality
function fixToastDismiss() {
    document.addEventListener('click', (e) => {
        if (e.target.closest('.toast-close')) {
            const toast = e.target.closest('.toast');
            if (toast) {
                toast.classList.remove('show');
                setTimeout(() => {
                    toast.style.display = 'none';
                }, 300);
            }
        }
    });
    
    // Auto-dismiss error toasts after 5 seconds
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.classList && node.classList.contains('toast')) {
                    setTimeout(() => {
                        node.classList.remove('show');
                        setTimeout(() => {
                            node.style.display = 'none';
                        }, 300);
                    }, 5000);
                }
            });
        });
    });
    
    observer.observe(document.body, { childList: true, subtree: true });
}

// Fix mobile input issues
function fixMobileInputs() {
    const messageInput = document.getElementById('messageInput');
    const sendBtn = document.getElementById('sendMessageBtn');
    
    if (messageInput) {
        // Remove any blocking attributes
        messageInput.removeAttribute('disabled');
        messageInput.removeAttribute('readonly');
        messageInput.style.pointerEvents = 'auto';
        messageInput.style.touchAction = 'manipulation';
        
        // Add touch event handlers
        messageInput.addEventListener('touchstart', (e) => {
            e.stopPropagation();
        }, { passive: true });
        
        messageInput.addEventListener('touchend', (e) => {
            e.stopPropagation();
            messageInput.focus();
        }, { passive: true });
        
        // Fix focus issues
        messageInput.addEventListener('focus', () => {
            setTimeout(() => {
                messageInput.scrollIntoView({
                    behavior: 'smooth',
                    block: 'nearest'
                });
            }, 300);
        });
    }
    
    if (sendBtn) {
        sendBtn.style.pointerEvents = 'auto';
        sendBtn.style.touchAction = 'manipulation';
    }
}

// Override toggleUIElements to not disable inputs
function toggleUIElements(disable = false) {
    const elementsToToggle = [
        ...document.querySelectorAll('.menu-item'),
        ...document.querySelectorAll('.mobile-nav-item'),
        document.getElementById('donateBtn'),
        document.getElementById('notificationBtn'),
        document.getElementById('userProfileBtn'),
        document.getElementById('clearChatBtn'),
        ...document.querySelectorAll('.suggestion-chip')
    ];
    
    elementsToToggle.forEach(element => {
        if (element) {
            if (disable) {
                element.style.pointerEvents = 'none';
                element.style.opacity = '0.5';
                element.setAttribute('disabled', 'true');
            } else {
                element.style.pointerEvents = 'auto';
                element.style.opacity = '1';
                element.removeAttribute('disabled');
            }
        }
    });
    
    // NEVER disable input and send button
    const messageInput = document.getElementById('messageInput');
    const sendBtn = document.getElementById('sendMessageBtn');
    
    if (messageInput) {
        messageInput.style.pointerEvents = 'auto';
        messageInput.style.opacity = '1';
        messageInput.removeAttribute('disabled');
    }
    
    if (sendBtn) {
        sendBtn.style.pointerEvents = 'auto';
        sendBtn.style.opacity = '1';
        sendBtn.removeAttribute('disabled');
    }
}

// Initialize fixes when DOM loads
document.addEventListener('DOMContentLoaded', () => {
    fixToastDismiss();
    fixMobileInputs();
    
    // Run fixes every 2 seconds as backup
    setInterval(() => {
        if (window.isMobile) {
            fixMobileInputs();
        }
    }, 2000);
});

// Rest of your existing code goes here...

// Detect mobile and prevent crashes
window.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
window.isLowEndDevice = window.isMobile && (navigator.hardwareConcurrency <= 2 || navigator.deviceMemory <= 2);

console.log('🔧 Mobile Detection:', {
    isMobile: window.isMobile,
    isLowEndDevice: window.isLowEndDevice,
    userAgent: navigator.userAgent
});

// Global error prevention
window.addEventListener('error', function(e) {
    console.error('🚨 Global error caught:', e.error);
    e.preventDefault();
    return true;
});

window.addEventListener('unhandledrejection', function(e) {
    console.error('🚨 Unhandled promise rejection:', e.reason);
    e.preventDefault();
});

// Mobile performance mode
if (window.isMobile) {
    document.documentElement.classList.add('mobile-device');
    console.log('📱 Mobile optimizations enabled');
}


// ================================
// GLOBAL VARIABLES & CONFIGURATION
// ================================

let isVoiceMode = false;
let isRecording = false;
let isSpeaking = false;
let isProcessing = false;
let currentLanguage = 'en-US';
let sessionStartTime = new Date();
let messageCount = 0;
let wordCount = 0;
let accuracyScore = 88;
let streakDays = 0;
let speechManager = null;
let recognition = null;
let currentUser = null;
let isInitialized = false;

// Voice mode state management
let voiceModeQueue = [];
let voiceModeActive = false;
let shouldContinueListening = true;

// Performance monitoring
const performanceLogger = {
    apiCalls: 0,
    errors: 0,
    voiceEvents: 0,
    startTime: performance.now()
};

console.log('🚀 Lucy AI Dashboard - Initializing JavaScript...');

// ================================
// DOM ELEMENTS CACHE
// ================================

const elements = {
    // Navigation
    navbar: document.querySelector('.navbar'),
    logoutBtn: document.getElementById('logoutBtn'),
    donateBtn: document.getElementById('donateBtn'),
    userProfileBtn: document.getElementById('userProfileBtn'),
    notificationBtn: document.getElementById('notificationBtn'),
    
    // Sidebar & Navigation
    menuItems: document.querySelectorAll('.menu-item'),
    mobileNavItems: document.querySelectorAll('.mobile-nav-item'),
    switchModeBtn: document.getElementById('switchModeBtn'),
    
    // Chat Interface
    chatBox: document.getElementById('chatBox'),
    messageInput: document.getElementById('messageInput'),
    sendMessageBtn: document.getElementById('sendMessageBtn'),
    chatSuggestions: document.getElementById('chatSuggestions'),
    suggestionChips: document.querySelectorAll('.suggestion-chip'),
    clearChatBtn: document.getElementById('clearChatBtn'),
    exportChatBtn: document.getElementById('exportChatBtn'),
    
    // Content Sections
    contentSections: document.querySelectorAll('.content-section'),
    chatContent: document.getElementById('chatContent'),
    lessonsContent: document.getElementById('lessonsContent'),
    progressContent: document.getElementById('progressContent'),
    vocabularyContent: document.getElementById('vocabularyContent'),
    achievementsContent: document.getElementById('achievementsContent'),
    
    // Voice Mode
    voiceIndicator: document.getElementById('voiceIndicator'),
    voiceText: document.getElementById('voiceText'),
    voiceWaves: document.querySelectorAll('.wave'),
    fabBtn: document.getElementById('fabBtn'),
    
    // Analytics
    sessionDuration: document.getElementById('sessionDuration'),
    messagesCount: document.getElementById('messagesCount'),
    accuracyScore: document.getElementById('accuracyScore'),
    streakDays: document.getElementById('streakDays'),
    
    // Modals
    donationModal: document.getElementById('donationModal'),
    profileModal: document.getElementById('profileModal'),
    notificationPanel: document.getElementById('notificationPanel'),
    welcomeOverlay: document.getElementById('welcomeOverlay'),
    loadingOverlay: document.getElementById('loadingOverlay'),
    startBtn: document.getElementById('startBtn'),
    
    // Toasts
    achievementToast: document.getElementById('achievementToast'),
    successToast: document.getElementById('successToast'),
    errorToast: document.getElementById('errorToast'),

    // Right-sidebar quick-stats
    rsSession:  document.getElementById('rsSession'),
    rsMessages: document.getElementById('rsMessages'),
    rsAccuracy: document.getElementById('rsAccuracy'),
    rsStreak:   document.getElementById('rsStreak'),
    
    contributeBtn: document.getElementById('contributeBtn'),
};

console.log('📋 DOM Elements cached:', Object.keys(elements).length, 'elements found');

// ================================
// UTILITY FUNCTIONS
// ================================

// Logging utility with timestamps
const logger = {
    info: (message, data = null) => {
        console.log(`ℹ️ [${new Date().toLocaleTimeString()}] ${message}`, data || '');
    },
    success: (message, data = null) => {
        console.log(`✅ [${new Date().toLocaleTimeString()}] ${message}`, data || '');
    },
    error: (message, error = null) => {
        console.error(`❌ [${new Date().toLocaleTimeString()}] ${message}`, error || '');
        performanceLogger.errors++;
    },
    warn: (message, data = null) => {
        console.warn(`⚠️ [${new Date().toLocaleTimeString()}] ${message}`, data || '');
    },
    voice: (message, data = null) => {
        console.log(`🎤 [${new Date().toLocaleTimeString()}] VOICE: ${message}`, data || '');
        performanceLogger.voiceEvents++;
    }
};

// Show toast notifications
function showToast(type, title, message, duration = 5000) {
    logger.info(`Showing ${type} toast: ${title}`);
    
    const toast = elements[`${type}Toast`];
    if (!toast) {
        logger.error(`Toast element not found: ${type}Toast`);
        return;
    }
    
    const titleElement = toast.querySelector('h4');
    const messageElement = toast.querySelector('p');
    
    if (titleElement) titleElement.textContent = title;
    if (messageElement) messageElement.textContent = message;
    
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, duration);
}

// Update live statistics
function updateLiveStats() {
    const now = new Date();
    const duration = now - sessionStartTime;
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);
    
    // Update session duration
    if (elements.sessionDuration) {
        elements.sessionDuration.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    
    // Update message count
    if (elements.messagesCount) {
        elements.messagesCount.textContent = messageCount.toString();
    }
    
    // Update accuracy score
    if (elements.accuracyScore) {
        elements.accuracyScore.textContent = `${accuracyScore}%`;
    }
    
    // Update streak days
    if (elements.streakDays) {
        elements.streakDays.textContent = `${streakDays} days`;
    }
    
    logger.info(`Stats updated - Messages: ${messageCount}, Duration: ${minutes}:${seconds}`);

    // mirror to right-sidebar
    elements.rsSession  && (elements.rsSession.textContent  = elements.sessionDuration.textContent);
    elements.rsMessages && (elements.rsMessages.textContent = elements.messagesCount.textContent);
    elements.rsAccuracy && (elements.rsAccuracy.textContent = elements.accuracyScore.textContent);
    elements.rsStreak   && (elements.rsStreak.textContent   = elements.streakDays.textContent);

}


// Disable/Enable UI elements during voice mode
function toggleUIElements(disable = false) {
    const elementsToToggle = [
        ...elements.menuItems,
        ...elements.mobileNavItems,
        elements.donateBtn,
        elements.notificationBtn,
        elements.userProfileBtn,
        elements.clearChatBtn,
        elements.exportChatBtn,
        ...elements.suggestionChips
    ];
    
    elementsToToggle.forEach(element => {
        if (element) {
            if (disable) {
                element.style.pointerEvents = 'none';
                element.style.opacity = '0.5';
                element.setAttribute('disabled', 'true');
            } else {
                element.style.pointerEvents = 'auto';
                element.style.opacity = '1';
                element.removeAttribute('disabled');
            }
        }
    });
    
    logger.info(`UI elements ${disable ? 'disabled' : 'enabled'} for voice mode`);
}

// ================================
// OPTIMIZED VOICE MANAGER - REPLACE ENTIRE CLASS
// ================================

class VoiceManager {
    constructor() {
        this.voices = [];
        this.currentVoice = null;
        this.isInitialized = false;
        this.speechSynthesis = window.speechSynthesis;
        this.lastRecordingStart = 0;
        this.lastSpeechStart = 0;
        this.recognition = null;
        this.isDestroyed = false;
        this.maxRetries = 3;
        this.retryCount = 0;
        this.timeouts = new Set(); // Track timeouts for cleanup

        logger.info('VoiceManager initializing with mobile optimizations...');
        this.init();
    }

    async init() {
        try {
            // Skip voice features on low-end devices
            if (window.isLowEndDevice) {
                logger.warn('Low-end device detected, voice features disabled');
                return;
            }

            await this.loadVoices();
            this.setupSpeechRecognition();
            this.isInitialized = true;
            logger.success('VoiceManager initialized successfully');
        } catch (err) {
            logger.error('VoiceManager initialization failed', err);
        }
    }

    async loadVoices() {
        return new Promise((resolve) => {
            const loadVoices = () => {
                this.voices = this.speechSynthesis.getVoices();
                if (this.voices.length) {
                    this.selectVoice();
                    logger.info(`Loaded ${this.voices.length} voices`);
                    resolve();
                }
            };
            loadVoices();
            this.speechSynthesis.onvoiceschanged = loadVoices;
            
            // Shorter timeout for mobile
            const timeout = setTimeout(() => resolve(), window.isMobile ? 500 : 1000);
            this.timeouts.add(timeout);
        });
    }

    selectVoice(lang = 'en') {
        this.currentVoice = this.voices.find(v => 
            v.lang.startsWith(lang) && /female/i.test(v.name)
        ) || this.voices.find(v => v.lang.startsWith(lang)) || this.voices[0];
        
        logger.info('Selected voice:', this.currentVoice?.name || 'default');
    }

    setupSpeechRecognition() {
        // Clean up existing recognition
        this.cleanupRecognition();

        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SR) {
            logger.error('Speech recognition not supported');
            return;
        }

        this.recognition = new SR();
        this.recognition.lang = currentLanguage;
        this.recognition.continuous = false;
        this.recognition.interimResults = window.isMobile ? false : true; // Disable interim on mobile
        this.recognition.maxAlternatives = 1;

        // Mobile-optimized event handlers
        this.recognition.onstart = () => {
            if (this.isDestroyed) return;
            isRecording = true;
            this.lastRecordingStart = Date.now();
            logger.voice('🎙️ Listening...');
            this.showVoiceIndicator('Listening...');
        };

        this.recognition.onresult = (e) => {
            if (this.isDestroyed) return;
            const i = e.resultIndex;
            const transcript = e.results[i][0].transcript;
            if (e.results[i].isFinal) {
                this.processSpeechResult(transcript);
            } else if (!window.isMobile) {
                this.showInterimResult(transcript);
            }
        };

        this.recognition.onerror = (e) => {
            if (this.isDestroyed) return;
            isRecording = false;
            logger.error('Speech recognition error:', e.error);
            
            if (e.error === 'not-allowed') {
                showToast('error', 'Permission Denied', 'Microphone access needed');
                this.stopVoiceMode();
            } else if (e.error === 'network') {
                this.retryCount++;
                if (this.retryCount < this.maxRetries && voiceModeActive) {
                    const timeout = setTimeout(() => this.startListening(), 2000);
                    this.timeouts.add(timeout);
                } else {
                    this.stopVoiceMode();
                    showToast('error', 'Network Error', 'Voice recognition failed');
                }
            } else if (voiceModeActive && shouldContinueListening) {
                const timeout = setTimeout(() => this.startListening(), 1500);
                this.timeouts.add(timeout);
            }
        };

        this.recognition.onend = () => {
            if (this.isDestroyed) return;
            isRecording = false;
            if (voiceModeActive && shouldContinueListening && !isSpeaking && !isProcessing) {
                const timeout = setTimeout(() => this.startListening(), 500);
                this.timeouts.add(timeout);
            }
        };

        logger.success('Speech recognition ready');
    }

    startListening() {
        if (!voiceModeActive || isRecording || isSpeaking || isProcessing || this.isDestroyed) {
            return;
        }
        
        try {
            this.recognition?.start();
        } catch (error) {
            logger.error('Failed to start recognition:', error);
        }
    }

    stopListening() {
        if (isRecording && this.recognition) {
            this.recognition.stop();
        }
        isRecording = false;
    }

    processSpeechResult(text) {
        text = text.trim();
        if (!text || this.isDestroyed) return;
        
        logger.voice(`User said: "${text}"`);
        
        this.hideVoiceIndicator();
        if (elements.messageInput) {
            elements.messageInput.value = text;
        }
        
        // Stop listening while processing
        shouldContinueListening = false;
        
        // Send the message (this will trigger AI response and speech)
        sendMessage(text);
    }

    showInterimResult(text) {
        if (elements.messageInput && !window.isMobile) {
            elements.messageInput.value = text;
        }
    }

    async speak(text) {
        if (!text || isSpeaking || this.isDestroyed) return;
        
        return new Promise(resolve => {
            this.speechSynthesis.cancel();

            const clean = text.replace(/\*/g, '')
                              .replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '')
                              .replace(/\n/g, ' ')
                              .trim();
            
            if (!clean) return resolve();

            const utterance = new SpeechSynthesisUtterance(clean);
            utterance.voice = this.currentVoice;
            utterance.rate = window.isMobile ? 1.0 : 0.9; // Faster on mobile
            utterance.pitch = 1.1;

            utterance.onstart = () => {
                if (this.isDestroyed) return;
                isSpeaking = true;
                this.lastSpeechStart = Date.now();
                this.showVoiceIndicator('Speaking...');
            };

            utterance.onend = () => {
                this.finishSpeaking();
                resolve();
            };

            utterance.onerror = () => {
                this.finishSpeaking();
                resolve();
            };

            this.speechSynthesis.speak(utterance);
        });
    }

    finishSpeaking() {
        if (this.isDestroyed) return;
        isSpeaking = false;
        this.hideVoiceIndicator();
        
        // Only start listening if we're in voice mode and should continue
        if (voiceModeActive && shouldContinueListening && !isProcessing) {
            logger.voice('Speech finished, starting to listen for user input...');
            const timeout = setTimeout(() => {
                if (voiceModeActive && shouldContinueListening && !isProcessing) {
                    this.startListening();
                }
            }, 800);
            this.timeouts.add(timeout);
        }
    }

    showVoiceIndicator(text) {
        if (elements.voiceIndicator) {
            elements.voiceIndicator.classList.add('active');
        }
        if (elements.voiceText) {
            elements.voiceText.textContent = text;
        }
        this.animateVoiceWaves(true);
    }

    hideVoiceIndicator() {
        if (elements.voiceIndicator) {
            elements.voiceIndicator.classList.remove('active');
        }
        this.animateVoiceWaves(false);
    }

    animateVoiceWaves(active) {
        elements.voiceWaves.forEach(w => {
            if (w) {
                w.style.animationPlayState = active ? 'running' : 'paused';
            }
        });
    }

    async toggleVoiceMode() {
        if (voiceModeActive) {
            this.stopVoiceMode();
        } else {
            await this.startVoiceMode();
        }
    }

    async startVoiceMode() {
        try {
            logger.voice('🔊 Voice mode ON');
            isVoiceMode = true;
            voiceModeActive = true;
            shouldContinueListening = false; // Important: Don't start listening yet!
            this.retryCount = 0;

            // Stop any existing activities
            this.stopListening();
            this.speechSynthesis.cancel();

            // Update UI
            if (elements.switchModeBtn) {
                const icon = elements.switchModeBtn.querySelector('i');
                const span = elements.switchModeBtn.querySelector('span');
                if (icon) icon.className = 'fas fa-keyboard';
                if (span) span.textContent = 'Chat Mode';
                elements.switchModeBtn.classList.add('active');
            }
            
            toggleUIElements(true);
            showToast('success', 'Voice Mode Active', 'Starting conversation...');

            // STEP 1: Send automatic greeting message to AI
            const username = document.querySelector('.user-name')?.textContent?.trim() || 
                            document.querySelector('.highlight')?.textContent?.trim() || 
                            'friend';
            
            const automaticMessage = `Hi Lucy, I'm ${username}. Let's practice my English conversation today.`;
            
            logger.voice(`Sending automatic greeting: "${automaticMessage}"`);
            
            // Set processing state
            isProcessing = true;
            
            // Display the automatic user message
            displayMessage(automaticMessage, 'user');
            
            // Update stats
            messageCount++;
            wordCount += automaticMessage.split(' ').length;
            updateLiveStats();
            
            // Show typing indicator
            showTypingIndicator();
            
            // STEP 2: Send to AI and get response
            try {
                const response = await fetch('/process', {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify({ 
                        text: automaticMessage,
                        language: currentLanguage,
                        timestamp: new Date().toISOString()
                    }),
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                const data = await response.json();
                const aiResponse = data.response || "Hello! I'm Lucy, ready to help you practice English!";
                
                // Hide typing indicator
                hideTypingIndicator();
                
                // STEP 3: Display AI response
                displayMessage(aiResponse, 'ai');
                
                logger.voice(`AI responded: "${aiResponse.substring(0, 50)}..."`);
                
                // STEP 4: Speak the AI response
                logger.voice('Speaking AI response...');
                await this.speak(aiResponse);
                
                logger.voice('AI finished speaking, now ready for user input');
                
                // STEP 5: NOW start listening for user input
                isProcessing = false;
                shouldContinueListening = true;
                
                // Small delay before starting to listen
                const timeout = setTimeout(() => {
                    if (voiceModeActive && shouldContinueListening) {
                        this.startListening();
                        logger.voice('👂 Now listening for your response...');
                    }
                }, 1000);
                this.timeouts.add(timeout);
                
            } catch (error) {
                logger.error('Error in voice mode startup:', error);
                hideTypingIndicator();
                
                // Fallback AI message
                const fallbackMessage = "Hello! I'm Lucy, your English practice companion. How are you today?";
                displayMessage(fallbackMessage, 'ai');
                
                // Speak fallback and start listening
                await this.speak(fallbackMessage);
                isProcessing = false;
                shouldContinueListening = true;
                
                const timeout = setTimeout(() => {
                    if (voiceModeActive && shouldContinueListening) {
                        this.startListening();
                    }
                }, 1000);
                this.timeouts.add(timeout);
            }

        } catch (err) {
            logger.error('Voice mode start failed', err);
            showToast('error', 'Voice Error', 'Could not start voice mode');
            this.stopVoiceMode();
            isProcessing = false;
        }
    }

    stopVoiceMode() {
        logger.voice('🔇 Voice mode OFF');
        this.cleanup();

        isVoiceMode = false;
        voiceModeActive = false;
        shouldContinueListening = false;
        isRecording = false;
        isSpeaking = false;
        isProcessing = false;

        // Update UI
        if (elements.switchModeBtn) {
            const icon = elements.switchModeBtn.querySelector('i');
            const span = elements.switchModeBtn.querySelector('span');
            if (icon) icon.className = 'fas fa-microphone';
            if (span) span.textContent = 'Voice Mode';
            elements.switchModeBtn.classList.remove('active');
        }

        toggleUIElements(false);
        this.hideVoiceIndicator();
        showToast('success', 'Chat Mode Active', 'Voice mode disabled');
    }

    cleanup() {
        this.stopListening();
        this.speechSynthesis.cancel();
        
        // Clear all timeouts
        this.timeouts.forEach(timeout => clearTimeout(timeout));
        this.timeouts.clear();
    }

    cleanupRecognition() {
        if (this.recognition) {
            this.recognition.onstart = null;
            this.recognition.onresult = null;
            this.recognition.onerror = null;
            this.recognition.onend = null;
            this.recognition = null;
        }
    }

    destroy() {
        this.isDestroyed = true;
        this.cleanup();
        this.cleanupRecognition();
        logger.info('VoiceManager destroyed');
    }
}

// ================================
// OPTIMIZED SEND MESSAGE FUNCTION
// ================================

async function sendMessage(text) {
    const trimmedText = text?.trim();
    if (!trimmedText) {
        logger.warn('Empty message, ignoring send request');
        return;
    }
    
    logger.info(`Sending message: "${trimmedText.substring(0, 50)}..."`);
    
    // Prevent double processing
    if (isProcessing) {
        logger.warn('Already processing a message, ignoring duplicate');
        return;
    }
    
    isProcessing = true;
    let timeoutId = null;
    
    try {
        // Display user message
        displayMessage(trimmedText, 'user');
        
        // Clear input
        if (elements.messageInput) {
            elements.messageInput.value = '';
        }
        
        // Update stats
        messageCount++;
        wordCount += trimmedText.split(' ').length;
        updateLiveStats();
        
        // Show typing indicator
        showTypingIndicator();
        
        // Set request timeout for mobile
        const timeoutDuration = window.isMobile ? 15000 : 30000;
        const controller = new AbortController();
        
        timeoutId = setTimeout(() => {
            controller.abort();
            logger.error('Request timeout');
        }, timeoutDuration);
        
        logger.info('Making API request to /process');
        performanceLogger.apiCalls++;
        
        const response = await fetch('/process', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ 
                text: trimmedText,
                language: currentLanguage,
                timestamp: new Date().toISOString()
            }),
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        logger.info(`API Response status: ${response.status}`);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        logger.success('API response received');
        
        const aiResponse = data.response || "Sorry, I didn't get a response from the server.";
        
        // Hide typing indicator
        hideTypingIndicator();
        
        // Display AI response
        displayMessage(aiResponse, 'ai');
        
        // ========================================
        // CORRECTED VOICE MODE HANDLING
        // ========================================
        if (voiceModeActive && speechManager && !speechManager.isDestroyed) {
            try {
                logger.voice('Voice mode active - speaking AI response...');
                
                // IMPORTANT: Stop listening while AI is speaking
                shouldContinueListening = false;
                speechManager.stopListening();
                
                // Speak the AI response
                await speechManager.speak(aiResponse);
                
                logger.voice('AI finished speaking, preparing to listen for user input...');
                
                // IMPORTANT: After AI finishes speaking, start listening for user input
                if (voiceModeActive) { // Double check voice mode is still active
                    shouldContinueListening = true;
                    
                    // Small delay before starting to listen
                    setTimeout(() => {
                        if (voiceModeActive && shouldContinueListening && speechManager && !speechManager.isDestroyed) {
                            speechManager.startListening();
                            logger.voice('👂 Now listening for your response...');
                        }
                    }, 1000);
                }
                
            } catch (speechError) {
                logger.error('Speech synthesis failed:', speechError);
                
                // Even if speech fails, still enable listening
                if (voiceModeActive) {
                    shouldContinueListening = true;
                    setTimeout(() => {
                        if (voiceModeActive && speechManager && !speechManager.isDestroyed) {
                            speechManager.startListening();
                            logger.voice('👂 Speech failed, but now listening for your response...');
                        }
                    }, 1000);
                }
            }
        }
        
        // Check for achievements
        checkAchievements();
        
        logger.success('Message processed successfully');
        
    } catch (error) {
        clearTimeout(timeoutId);
        logger.error('Error sending message:', error);
        hideTypingIndicator();
        
        let errorMessage = 'Sorry, I encountered an error. Please try again! 😔';
        
        if (error.name === 'AbortError') {
            errorMessage = 'Request timed out. Please check your connection and try again.';
        } else if (!navigator.onLine) {
            errorMessage = 'You appear to be offline. Please check your connection.';
        }
        
        displayMessage(errorMessage, 'ai');
        showToast('error', 'Connection Error', 'Failed to send message');
        
        // ========================================
        // VOICE MODE ERROR HANDLING
        // ========================================
        if (voiceModeActive && speechManager && !speechManager.isDestroyed) {
            try {
                logger.voice('Speaking error message...');
                
                // Stop listening while speaking error
                shouldContinueListening = false;
                speechManager.stopListening();
                
                // Speak the error message
                await speechManager.speak(errorMessage);
                
                // After error message, resume listening
                if (voiceModeActive) {
                    shouldContinueListening = true;
                    setTimeout(() => {
                        if (voiceModeActive && speechManager && !speechManager.isDestroyed) {
                            speechManager.startListening();
                            logger.voice('👂 Error spoken, now listening again...');
                        }
                    }, 1000);
                }
                
            } catch (speechError) {
                logger.error('Error speech failed:', speechError);
                
                // Resume listening even if error speech fails
                if (voiceModeActive) {
                    shouldContinueListening = true;
                    setTimeout(() => {
                        if (voiceModeActive && speechManager && !speechManager.isDestroyed) {
                            speechManager.startListening();
                        }
                    }, 1000);
                }
            }
        }
        
    } finally {
        isProcessing = false;
        logger.info('Message processing completed');
    }
}

// Add this function after your VoiceManager class
function logVoiceModeState(action) {
    logger.voice(`🎤 Voice Mode State: ${action}`, {
        voiceModeActive,
        isRecording,
        isSpeaking,
        isProcessing,
        shouldContinueListening
    });
}


// ================================
// CHAT MAXIMIZE/MINIMIZE FUNCTIONALITY
// ================================

let isChatMaximized = false;
let maximizedChatElements = {};

function initializeChatMaximize() {
    logger.info('Initializing chat maximize functionality...');
    
    // Cache maximized chat elements
    maximizedChatElements = {
        overlay: document.getElementById('chatMaximizedOverlay'),
        messages: document.getElementById('maximizedChatMessages'),
        input: document.getElementById('maximizedMessageInput'),
        sendBtn: document.getElementById('maximizedSendBtn'),
        suggestions: document.getElementById('maximizedChatSuggestions'),
        maximizeBtn: document.getElementById('maximizeBtn'),
        minimizeBtn: document.getElementById('minimizeBtn'),
        closeBtn: document.getElementById('closeMaximizedBtn')
    };
    
    // Maximize button click
    if (maximizedChatElements.maximizeBtn) {
        maximizedChatElements.maximizeBtn.addEventListener('click', maximizeChat);
    }
    
    // Minimize button click
    if (maximizedChatElements.minimizeBtn) {
        maximizedChatElements.minimizeBtn.addEventListener('click', minimizeChat);
    }
    
    // Close button click
    if (maximizedChatElements.closeBtn) {
        maximizedChatElements.closeBtn.addEventListener('click', minimizeChat);
    }
    
    // Maximized send button
    if (maximizedChatElements.sendBtn) {
        maximizedChatElements.sendBtn.addEventListener('click', () => {
            if (maximizedChatElements.input && maximizedChatElements.input.value.trim()) {
                sendMessage(maximizedChatElements.input.value.trim());
            }
        });
    }
    
    // Maximized input enter key
    if (maximizedChatElements.input) {
        maximizedChatElements.input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (maximizedChatElements.input.value.trim()) {
                    sendMessage(maximizedChatElements.input.value.trim());
                }
            }
        });
    }
    
    // Maximized suggestion chips
    if (maximizedChatElements.suggestions) {
        maximizedChatElements.suggestions.addEventListener('click', (e) => {
            if (e.target.classList.contains('suggestion-chip')) {
                const text = e.target.getAttribute('data-text') || e.target.textContent;
                if (maximizedChatElements.input) {
                    maximizedChatElements.input.value = text;
                }
                sendMessage(text);
            }
        });
    }
    
    // ESC key to minimize
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && isChatMaximized) {
            minimizeChat();
        }
    });
    
    // Click outside to minimize (optional)
    if (maximizedChatElements.overlay) {
        maximizedChatElements.overlay.addEventListener('click', (e) => {
            if (e.target === maximizedChatElements.overlay) {
                minimizeChat();
            }
        });
    }
    
    logger.success('Chat maximize functionality initialized');
}

function maximizeChat() {
    if (voiceModeActive) {
        showToast('warning', 'Voice Mode Active', 'Please exit voice mode first');
        return;
    }
    
    logger.info('Maximizing chat...');
    
    isChatMaximized = true;
    
    // Show maximized overlay
    if (maximizedChatElements.overlay) {
        maximizedChatElements.overlay.classList.add('active');
    }
    
    // Update maximize button
    if (maximizedChatElements.maximizeBtn) {
        maximizedChatElements.maximizeBtn.classList.add('maximized');
        maximizedChatElements.maximizeBtn.querySelector('i').className = 'fas fa-compress';
        maximizedChatElements.maximizeBtn.title = 'Minimize Chat';
    }
    
    // Copy messages to maximized view
    copyMessagesToMaximized();
    
    // Focus on maximized input
    setTimeout(() => {
        if (maximizedChatElements.input) {
            maximizedChatElements.input.focus();
        }
    }, 300);
    
    // Scroll to bottom
    setTimeout(() => {
        if (maximizedChatElements.messages) {
            maximizedChatElements.messages.scrollTop = maximizedChatElements.messages.scrollHeight;
        }
    }, 100);
    
    showToast('success', 'Chat Maximized', 'Full screen chat mode activated');
    logger.success('Chat maximized successfully');
}

function minimizeChat() {
    logger.info('Minimizing chat...');
    
    isChatMaximized = false;
    
    // Hide maximized overlay
    if (maximizedChatElements.overlay) {
        maximizedChatElements.overlay.classList.remove('active');
    }
    
    // Update maximize button
    if (maximizedChatElements.maximizeBtn) {
        maximizedChatElements.maximizeBtn.classList.remove('maximized');
        maximizedChatElements.maximizeBtn.querySelector('i').className = 'fas fa-expand';
        maximizedChatElements.maximizeBtn.title = 'Maximize Chat';
    }
    
    // Clear maximized input
    if (maximizedChatElements.input) {
        maximizedChatElements.input.value = '';
    }
    
    // Focus back on original input
    setTimeout(() => {
        if (elements.messageInput) {
            elements.messageInput.focus();
        }
    }, 300);
    
    logger.success('Chat minimized successfully');
}

function copyMessagesToMaximized() {
    if (!maximizedChatElements.messages || !elements.chatBox) return;
    
    // Clear existing messages
    maximizedChatElements.messages.innerHTML = '';
    
    // Copy all messages from original chat
    const originalMessages = elements.chatBox.querySelectorAll('.message:not(.typing-indicator)');
    originalMessages.forEach(msg => {
        const clonedMessage = msg.cloneNode(true);
        maximizedChatElements.messages.appendChild(clonedMessage);
    });
    
    logger.info(`Copied ${originalMessages.length} messages to maximized view`);
}

// Update the original displayMessage function to also update maximized view
const originalDisplayMessage = displayMessage;
window.displayMessage = function(text, sender) {
    // Call original function
    originalDisplayMessage(text, sender);
    
    // If maximized, also add to maximized view
    if (isChatMaximized && maximizedChatElements.messages) {
        setTimeout(() => {
            copyMessagesToMaximized();
            maximizedChatElements.messages.scrollTop = maximizedChatElements.messages.scrollHeight;
        }, 100);
    }
};

// Clear maximized input after sending message
const originalSendMessage = sendMessage;
window.sendMessage = async function(text) {
    await originalSendMessage(text);
    
    // Clear maximized input if message was sent from there
    if (isChatMaximized && maximizedChatElements.input) {
        maximizedChatElements.input.value = '';
    }
};


// ================================
// MEMORY MANAGEMENT FUNCTIONS
// ================================

function cleanupOldMessages() {
    if (!elements.chatBox) return;
    
    const messages = elements.chatBox.querySelectorAll('.message');
    const maxMessages = window.isMobile ? 50 : 100;
    
    if (messages.length > maxMessages) {
        const messagesToRemove = messages.length - maxMessages;
        for (let i = 0; i < messagesToRemove; i++) {
            if (messages[i]) {
                messages[i].remove();
            }
        }
        logger.info(`Cleaned up ${messagesToRemove} old messages`);
    }
}

function optimizePerformance() {
    // Clean up old messages
    cleanupOldMessages();
    
    // Force garbage collection if available
    if (window.gc) {
        window.gc();
    }
    
    // Log memory usage
    if (performance.memory) {
        const memoryMB = Math.round(performance.memory.usedJSHeapSize / 1024 / 1024);
        logger.info(`Memory usage: ${memoryMB}MB`);
        
        // Alert if memory usage is high
        if (memoryMB > 100) {
            logger.warn('High memory usage detected');
            if (window.isMobile) {
                showToast('warning', 'Performance', 'High memory usage - consider refreshing');
            }
        }
    }
}

// Run cleanup every 2 minutes
setInterval(optimizePerformance, 120000);



function displayMessage(text, sender) {
    if (!elements.chatBox) {
        logger.error('Chat box not found');
        return;
    }
    
    // Clean up old messages first
    cleanupOldMessages();
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;
    
    const time = new Date().toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit' 
    });
    
    // Sanitize text to prevent XSS
    const sanitizedText = text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    
    if (sender === 'ai') {
        messageDiv.innerHTML = `
            <div class="message-avatar">
                <img src="https://ui-avatars.com/api/?name=Lucy&background=ec4899&color=fff&size=32" alt="Lucy" loading="lazy">
            </div>
            <div class="message-content">
                <div class="message-bubble">${sanitizedText}</div>
                <span class="message-time">${time}</span>
            </div>
        `;
    } else {
        messageDiv.innerHTML = `
            <div class="message-content">
                            <div class="message-bubble">${sanitizedText}</div>
                <span class="message-time">${time}</span>
            </div>
        `;
    }
    
    elements.chatBox.appendChild(messageDiv);
    
    // Smooth scroll to bottom with mobile optimization
    if (window.isMobile) {
        elements.chatBox.scrollTop = elements.chatBox.scrollHeight;
    } else {
        elements.chatBox.scrollTo({
            top: elements.chatBox.scrollHeight,
            behavior: 'smooth'
        });
    }
    
    logger.info(`Message displayed: ${sender} - ${sanitizedText.substring(0, 50)}...`);
}



function showTypingIndicator() {
    if (!elements.chatBox) return;
    
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message ai-message typing-indicator';
    typingDiv.id = 'typing-indicator';
    typingDiv.innerHTML = `
        <div class="message-avatar">
            <img src="https://ui-avatars.com/api/?name=Lucy&background=ec4899&color=fff&size=32" alt="Lucy">
        </div>
        <div class="message-content">
            <div class="message-bubble">
                <div class="typing-dots">
                    <span></span><span></span><span></span>
                </div>
            </div>
        </div>
    `;
    
    elements.chatBox.appendChild(typingDiv);
    elements.chatBox.scrollTop = elements.chatBox.scrollHeight;
    
    logger.info('Typing indicator shown');
}

function hideTypingIndicator() {
    const typingIndicator = document.getElementById('typing-indicator');
    if (typingIndicator) {
        typingIndicator.remove();
        logger.info('Typing indicator hidden');
    }
}

// ================================
// TAB NAVIGATION SYSTEM
// ================================

function initializeTabNavigation() {
    logger.info('Initializing tab navigation...');
    
    // Desktop menu items
    elements.menuItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            
            if (voiceModeActive) {
                logger.warn('Tab navigation blocked - voice mode active');
                return;
            }
            
            const tabName = item.getAttribute('data-tab');
            switchTab(tabName);
            
            // Update active state
            elements.menuItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
        });
    });
    
    // Mobile menu items
    elements.mobileNavItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            
            if (voiceModeActive) {
                logger.warn('Mobile tab navigation blocked - voice mode active');
                return;
            }
            
            const tabName = item.getAttribute('data-tab');
            switchTab(tabName);
            
            // Update active state
            elements.mobileNavItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
        });
    });
    
    logger.success('Tab navigation initialized');
}

function switchTab(tabName) {
    logger.info(`Switching to tab: ${tabName}`);
    
    // Hide all content sections
    elements.contentSections.forEach(section => {
        section.style.display = 'none';
        section.classList.remove('active');
    });
    
    // Show selected tab
    const selectedTab = document.getElementById(`${tabName}Content`);
    if (selectedTab) {
        selectedTab.style.display = 'flex';
        selectedTab.classList.add('active');
        logger.success(`Tab switched to: ${tabName}`);
        
        // Load tab-specific data
        loadTabData(tabName);
    } else {
        logger.error(`Tab content not found: ${tabName}Content`);
    }
}

function loadTabData(tabName) {
    switch (tabName) {
        case 'lessons':
            loadLessonsData();
            break;
        case 'progress':
            loadProgressData();
            break;
        case 'vocabulary':
            loadVocabularyData();
            break;
        case 'achievements':
            loadAchievementsData();
            break;
        case 'chat':
        default:
            // Chat is always loaded
            break;
    }
}

function loadLessonsData() {
    logger.info('Loading lessons data...');
    // Lessons data would be loaded from backend in real implementation
    showToast('success', 'Lessons', 'Lessons feature coming soon!');
}

function loadProgressData() {
    logger.info('Loading progress data...');
    // Progress data would be loaded from backend in real implementation
    showToast('success', 'Progress', 'Progress tracking active!');
}

function loadVocabularyData() {
    logger.info('Loading vocabulary data...');
    // Vocabulary data would be loaded from backend in real implementation
    showToast('success', 'Vocabulary', 'Vocabulary list updated!');
}

function loadAchievementsData() {
    logger.info('Loading achievements data...');
    // Achievements data would be loaded from backend in real implementation
    showToast('success', 'Achievements', 'Achievement system active!');
}

// ================================
// DONATION SYSTEM
// ================================

function initializeDonationSystem() {
    logger.info('Initializing donation system...');
    
    const donationData = {
        phonepe: {
            name: 'PhonePe - Yogesh V',
            upiId: 'yogiguli@ybl',
            phone: '+91-9008587582',
            qrCode: '/static/media/PhonePe_QR.png'
        },
        googlepay: {
            name: 'Google Pay - Yogesh V',
            upiId: 'yogesh490807@okaxis',
            phone: '+91-9008587582',
            qrCode: '/static/media/GooglePay_QR.png'
        },
        paytm: {
            name: 'Paytm - Yogesh V',
            upiId: '9008587582@ptaxis',
            phone: '+91-9008587582',
            qrCode: '/static/media/Paytm_QR.png'
        }
    };
    
    // Donate button click
    if (elements.donateBtn) {
        elements.donateBtn.addEventListener('click', () => {
            if (voiceModeActive) {
                logger.warn('Donation blocked - voice mode active');
                return;
            }
            showDonationModal();
        });
    }
    // left-sidebar “Contribute” button
    if (elements.contributeBtn) {
        elements.contributeBtn.addEventListener('click', () => {
            if (voiceModeActive) {
                logger.warn('Donation blocked – voice mode active');
                return;
            }
            showDonationModal();
        });
    }
    
    // Payment method buttons
    document.querySelectorAll('.payment-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const method = btn.getAttribute('data-method');
            showPaymentDetails(method, donationData[method]);
        });
    });
    
    // Custom amount
    const customAmountBtn = document.querySelector('.custom-amount-btn');
    if (customAmountBtn) {
        customAmountBtn.addEventListener('click', () => {
            const customInput = document.getElementById('customAmountInput');
            const amount = customInput?.value;
            if (amount && amount > 0) {
                selectDonationAmount(amount);
            } else {
                showToast('error', 'Invalid Amount', 'Please enter a valid amount');
            }
        });
    }
    
    // Copy buttons
    document.addEventListener('click', (e) => {
        if (e.target.closest('.copy-btn')) {
            const copyBtn = e.target.closest('.copy-btn');
            const textToCopy = copyBtn.previousElementSibling?.textContent;
            if (textToCopy) {
                copyToClipboard(textToCopy);
            }
        }
    });
    
    // Close donation modal
    const closeDonationBtn = document.getElementById('closeDonationBtn');
    if (closeDonationBtn) {
        closeDonationBtn.addEventListener('click', hideDonationModal);
    }
    
    logger.success('Donation system initialized');
}

function showDonationModal() {
    logger.info('Showing donation modal');
    if (elements.donationModal) {
        elements.donationModal.classList.add('active');
    }
}

function hideDonationModal() {
    logger.info('Hiding donation modal');
    if (elements.donationModal) {
        elements.donationModal.classList.remove('active');
    }
    
    // Reset payment details
    const paymentDetails = document.getElementById('paymentDetails');
    if (paymentDetails) {
        paymentDetails.style.display = 'none';
    }
}

function selectDonationAmount(amount) {
    logger.info(`Donation amount selected: ₹${amount}`);
    
    // Update all amount buttons
    document.querySelectorAll('.amount-btn').forEach(btn => {
        btn.classList.remove('selected');
        if (btn.getAttribute('data-amount') === amount.toString()) {
            btn.classList.add('selected');
        }
    });
    
    showToast('success', 'Amount Selected', `₹${amount} selected for donation`);
}

function showPaymentDetails(method, data) {
    logger.info(`Showing payment details for: ${method}`);
    
    const paymentDetails = document.getElementById('paymentDetails');
    const qrCode = document.getElementById('qrCode');
    const paymentMethodName = document.getElementById('paymentMethodName');
    const upiId = document.getElementById('upiId');
    const phoneNumber = document.getElementById('phoneNumber');
    
    if (paymentDetails) {
        paymentDetails.style.display = 'block';
    }
    
    if (paymentMethodName) {
        paymentMethodName.textContent = data.name;
    }
    
    if (upiId) {
        upiId.textContent = data.upiId;
    }
    
    if (phoneNumber) {
        phoneNumber.textContent = data.phone;
    }
    
    if (qrCode) {
        qrCode.innerHTML = `<img src="${data.qrCode}" alt="${data.name} QR Code" style="width: 100%; height: 100%; object-fit: contain;">`;
    }
    
    showToast('success', 'Payment Method', `${data.name} details displayed`);
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        logger.success(`Copied to clipboard: ${text}`);
        showToast('success', 'Copied!', 'Text copied to clipboard');
    }).catch(err => {
        logger.error('Copy failed:', err);
        showToast('error', 'Copy Failed', 'Unable to copy text');
    });
}

// ================================
// USER PROFILE SYSTEM
// ================================

function initializeProfileSystem() {
    logger.info('Initializing profile system...');
    
    // Profile button click
    if (elements.userProfileBtn) {
        elements.userProfileBtn.addEventListener('click', () => {
            if (voiceModeActive) {
                logger.warn('Profile access blocked - voice mode active');
                return;
            }
            showProfileModal();
        });
    }
    
    // Close profile modal
    const closeProfileBtn = document.getElementById('closeProfileBtn');
    if (closeProfileBtn) {
        closeProfileBtn.addEventListener('click', hideProfileModal);
    }
    
    logger.success('Profile system initialized');
}

function showProfileModal() {
    logger.info('Showing profile modal');
    
    if (elements.profileModal) {
        elements.profileModal.classList.add('active');
        loadUserProfile();
    }
}

function hideProfileModal() {
    logger.info('Hiding profile modal');
    
    if (elements.profileModal) {
        elements.profileModal.classList.remove('active');
    }
}

async function loadUserProfile() {
    logger.info('Loading user profile data...');
    
    try {
        const response = await fetch('/get_user_data');
        if (response.ok) {
            const userData = await response.json();
            updateProfileDisplay(userData);
            logger.success('User profile loaded successfully');
        } else {
            logger.warn('Failed to load user profile');
        }
    } catch (error) {
        logger.error('Error loading user profile:', error);
    }
}

function updateProfileDisplay(userData) {
    const profileName = document.getElementById('profileName');
    const profileEmail = document.getElementById('profileEmail');
    const memberSince = document.getElementById('memberSince');
    const profileStreak = document.getElementById('profileStreak');
    const totalMessages = document.getElementById('totalMessages');
    const totalTime = document.getElementById('totalTime');
    const totalAchievements = document.getElementById('totalAchievements');
    const currentLevel = document.getElementById('currentLevel');
    
    if (profileName) profileName.textContent = userData.name || 'User';
    if (profileEmail) profileEmail.textContent = userData.email || 'user@example.com';
    if (memberSince) memberSince.textContent = new Date().toLocaleDateString();
        if (profileStreak) profileStreak.querySelector('span').textContent = `${streakDays} days`;
    if (totalMessages) totalMessages.textContent = messageCount.toString();
    if (totalTime) totalTime.textContent = `${Math.floor((new Date() - sessionStartTime) / 3600000)}h`;
    if (totalAchievements) totalAchievements.textContent = '2'; // Mock data
    if (currentLevel) currentLevel.textContent = 'Intermediate';
    
    logger.info('Profile display updated');
}

// ================================
// NOTIFICATION SYSTEM
// ================================

function initializeNotificationSystem() {
    logger.info('Initializing notification system...');
    
    // Notification button click
    if (elements.notificationBtn) {
        elements.notificationBtn.addEventListener('click', () => {
            if (voiceModeActive) {
                logger.warn('Notifications blocked - voice mode active');
                return;
            }
            toggleNotificationPanel();
        });
    }
    
    // Mark all read button
    const markAllReadBtn = document.getElementById('markAllReadBtn');
    if (markAllReadBtn) {
        markAllReadBtn.addEventListener('click', markAllNotificationsRead);
    }
    
    // Close panel when clicking outside
    document.addEventListener('click', (e) => {
        if (!elements.notificationPanel?.contains(e.target) && 
            !elements.notificationBtn?.contains(e.target)) {
            hideNotificationPanel();
        }
    });
    
    logger.success('Notification system initialized');
}

function toggleNotificationPanel() {
    if (elements.notificationPanel) {
        const isActive = elements.notificationPanel.classList.contains('active');
        
        if (isActive) {
            hideNotificationPanel();
        } else {
            showNotificationPanel();
        }
    }
}

function showNotificationPanel() {
    logger.info('Showing notification panel');
    
    if (elements.notificationPanel) {
        elements.notificationPanel.classList.add('active');
        loadNotifications();
    }
}

function hideNotificationPanel() {
    if (elements.notificationPanel) {
        elements.notificationPanel.classList.remove('active');
    }
}

function loadNotifications() {
    logger.info('Loading notifications...');
    // In real implementation, this would fetch from backend
    updateNotificationBadge(2);
}

function markAllNotificationsRead() {
    logger.info('Marking all notifications as read');
    
    // Remove unread class from all notifications
    document.querySelectorAll('.notification-item.unread').forEach(item => {
        item.classList.remove('unread');
    });
    
    updateNotificationBadge(0);
    showToast('success', 'Notifications', 'All notifications marked as read');
}

function updateNotificationBadge(count) {
    if (elements.notificationBtn) {
        const badge = elements.notificationBtn.querySelector('.notification-badge');
        if (badge) {
            badge.textContent = count.toString();
            badge.style.display = count > 0 ? 'flex' : 'none';
        }
    }
}

// ================================
// ACHIEVEMENTS SYSTEM
// ================================

function checkAchievements() {
    logger.info('Checking for achievements...');
    
    const achievements = [
        { id: 'first_message', threshold: 1, name: 'First Steps', description: 'Sent your first message!', icon: '👶' },
        { id: 'ten_messages', threshold: 10, name: 'Chatterbox', description: 'Sent 10 messages', icon: '💬' },
        { id: 'fifty_messages', threshold: 50, name: 'Conversation Master', description: 'Sent 50 messages', icon: '🗣️' },
        { id: 'hundred_words', threshold: 100, name: 'Word Smith', description: 'Spoke 100 words', icon: '📝' },
    ];
    
    achievements.forEach(achievement => {
        if (messageCount === achievement.threshold || wordCount === achievement.threshold) {
            unlockAchievement(achievement);
        }
    });
    
    // Time-based achievements
    const sessionMinutes = Math.floor((new Date() - sessionStartTime) / 60000);
    if (sessionMinutes === 5) {
        unlockAchievement({
            id: 'five_minutes',
            name: '5 Minute Practice',
            description: 'Practiced for 5 minutes straight!',
            icon: '⏰'
        });
    }
}

function unlockAchievement(achievement) {
    logger.success(`Achievement unlocked: ${achievement.name}`);
    
    // Show achievement toast
    showAchievementToast(achievement);
    
    // Update notification count
    updateNotificationBadge(3);
    
    // Add to achievements list (in real app, save to backend)
    addAchievementToList(achievement);
}

function showAchievementToast(achievement) {
    if (elements.achievementToast) {
        const title = elements.achievementToast.querySelector('#achievementTitle');
        const description = elements.achievementToast.querySelector('#achievementDescription');
        
        if (title) title.textContent = `🏆 ${achievement.name}`;
        if (description) description.textContent = achievement.description;
        
        elements.achievementToast.classList.add('show');
        
        // Auto hide after 5 seconds
        setTimeout(() => {
            elements.achievementToast.classList.remove('show');
        }, 5000);
    }
}

function addAchievementToList(achievement) {
    const achievementsGrid = document.getElementById('achievementsGrid');
    if (achievementsGrid) {
        // In real implementation, this would update the achievements display
        logger.info(`Achievement added to list: ${achievement.name}`);
    }
}

// ================================
// SUGGESTION CHIPS SYSTEM
// ================================

function initializeSuggestionChips() {
    logger.info('Initializing suggestion chips...');
    
    elements.suggestionChips.forEach(chip => {
        chip.addEventListener('click', () => {
            if (voiceModeActive) {
                logger.warn('Suggestion chip blocked - voice mode active');
                return;
            }
            
            const suggestionText = chip.getAttribute('data-text') || chip.textContent;
            
            if (elements.messageInput) {
                elements.messageInput.value = suggestionText;
            }
            
            sendMessage(suggestionText);
            logger.info(`Suggestion chip clicked: ${suggestionText}`);
        });
    });
    
    logger.success('Suggestion chips initialized');
}

// ================================
// CHAT ACTIONS
// ================================

function initializeChatActions() {
    logger.info('Initializing chat actions...');
    
    // Clear chat button
    if (elements.clearChatBtn) {
        elements.clearChatBtn.addEventListener('click', () => {
            if (voiceModeActive) {
                logger.warn('Clear chat blocked - voice mode active');
                return;
            }
            clearChat();
        });
    }
    
    // Export chat button
    if (elements.exportChatBtn) {
        elements.exportChatBtn.addEventListener('click', () => {
            if (voiceModeActive) {
                logger.warn('Export chat blocked - voice mode active');
                return;
            }
            exportChat();
        });
    }
    
    logger.success('Chat actions initialized');
}

function clearChat() {
    if (confirm('Are you sure you want to clear the chat history?')) {
        if (elements.chatBox) {
            // Keep only the date divider
            const dateDiv = elements.chatBox.querySelector('.chat-date-divider');
            elements.chatBox.innerHTML = '';
            if (dateDiv) {
                elements.chatBox.appendChild(dateDiv);
            }
        }
        
        // Reset stats
        messageCount = 0;
        wordCount = 0;
        updateLiveStats();
        
        logger.info('Chat cleared');
        showToast('success', 'Chat Cleared', 'Chat history has been cleared');
    }
}

function exportChat() {
    logger.info('Exporting chat...');
    
    const messages = [];
    const messageElements = elements.chatBox?.querySelectorAll('.message:not(.typing-indicator)');
    
    messageElements?.forEach(msgEl => {
        const isUser = msgEl.classList.contains('user-message');
        const bubble = msgEl.querySelector('.message-bubble');
        const time = msgEl.querySelector('.message-time');
        
        if (bubble && time) {
            messages.push({
                sender: isUser ? 'You' : 'Lucy AI',
                message: bubble.textContent,
                time: time.textContent
            });
        }
    });
    
    const exportData = {
        exportDate: new Date().toISOString(),
        sessionDuration: Math.floor((new Date() - sessionStartTime) / 60000),
        messageCount: messageCount,
        wordCount: wordCount,
        messages: messages
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `lucy-ai-chat-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
    
    logger.success('Chat exported successfully');
    showToast('success', 'Chat Exported', 'Chat history downloaded as JSON file');
}

// ================================
// INPUT HANDLING
// ================================

function initializeInputHandling() {
    logger.info('Initializing input handling...');
    
    // Message input events
    if (elements.messageInput) {
        elements.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (!voiceModeActive) {
                    sendMessage(elements.messageInput.value);
                }
            }
        });
        
        // Prevent input in voice mode
        elements.messageInput.addEventListener('focus', () => {
            if (voiceModeActive) {
                elements.messageInput.blur();
                logger.warn('Text input blocked - voice mode active');
            }
        });
    }
    
    // Send button
    if (elements.sendMessageBtn) {
        elements.sendMessageBtn.addEventListener('click', () => {
            if (!voiceModeActive && elements.messageInput) {
                sendMessage(elements.messageInput.value);
            }
        });
    }
    
    // Voice mode toggle
    if (elements.switchModeBtn) {
        elements.switchModeBtn.addEventListener('click', () => {
            if (speechManager) {
                speechManager.toggleVoiceMode();
            } else {
                logger.error('Speech manager not initialized');
                showToast('error', 'Voice Error', 'Voice system not ready');
            }
        });
    }
    
    // FAB button
    if (elements.fabBtn) {
        elements.fabBtn.addEventListener('click', () => {
            if (speechManager) {
                speechManager.toggleVoiceMode();
            }
        });
    }
    
    logger.success('Input handling initialized');
}

// ================================
// LOGOUT FUNCTIONALITY
// ================================

function initializeLogout() {
    logger.info('Initializing logout functionality...');
    
    if (elements.logoutBtn) {
        elements.logoutBtn.addEventListener('click', async () => {
            if (voiceModeActive) {
                logger.warn('Logout blocked - voice mode active. Please exit voice mode first.');
                showToast('warning', 'Exit Voice Mode', 'Please exit voice mode before logging out');
                return;
            }
            
            if (confirm('Are you sure you want to logout?')) {
                await handleLogout();
            }
        });
    }
    
    logger.success('Logout functionality initialized');
}

async function handleLogout() {
    logger.info('Processing logout...');
    
    try {
        // Stop voice mode if active
        if (speechManager && voiceModeActive) {
            speechManager.stopVoiceMode();
        }
        
        // Save session data
        const sessionData = {
            duration: Math.floor((new Date() - sessionStartTime) / 60000),
            messages: messageCount,
            words: wordCount,
            accuracy: accuracyScore,
            endTime: new Date().toISOString()
        };
        
        logger.info('Session data to save:', sessionData);
        
        // Clear local storage
        localStorage.clear();
        sessionStorage.clear();
        
        // Redirect to logout endpoint
        window.location.href = '/logout';
        
    } catch (error) {
        logger.error('Error during logout:', error);
        // Force logout anyway
        window.location.href = '/logout';
    }
}

// ================================
// WELCOME OVERLAY
// ================================

function initializeWelcomeOverlay() {
    logger.info('Initializing welcome overlay...');
    
    if (elements.startBtn) {
        elements.startBtn.addEventListener('click', async () => {
            hideWelcomeOverlay();
            await sendWelcomeMessage();
        });
    }
    
    // Auto-hide welcome overlay after delay
    setTimeout(() => {
        if (!localStorage.getItem('returning_user')) {
            showWelcomeOverlay();
        }
    }, 2000);
}

function showWelcomeOverlay() {
    if (elements.welcomeOverlay) {
        elements.welcomeOverlay.style.display = 'flex';
        logger.info('Welcome overlay shown');
    }
}

function hideWelcomeOverlay() {
    if (elements.welcomeOverlay) {
        elements.welcomeOverlay.style.display = 'none';
        localStorage.setItem('returning_user', 'true');
        logger.info('Welcome overlay hidden');
    }
}

async function sendWelcomeMessage() {
    const welcomeMessages = [
        "Hi there! I'm Lucy, your AI language learning companion. How are you feeling today?",
        "Welcome to Lucy AI! I'm excited to help you practice and improve your English skills.",
        "Hello! Ready to start our learning journey together? What would you like to practice today?"
    ];
    
    const randomMessage = welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)];
    
    // Add initial AI message
    displayMessage(randomMessage, 'ai');
    
    // If voice mode, speak the welcome message
    if (voiceModeActive && speechManager) {
        await speechManager.speak(randomMessage);
    }
    
    logger.info('Welcome message sent');
}

// ================================
// MODAL HANDLING
// ================================

function initializeModalHandling() {
    logger.info('Initializing modal handling...');
    
    // Close modals when clicking outside
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal-overlay')) {
            hideAllModals();
        }
    });
    
    // Close toast notifications
    document.addEventListener('click', (e) => {
        if (e.target.closest('.toast-close')) {
            const toast = e.target.closest('.toast');
            if (toast) {
                toast.classList.remove('show');
            }
        }
    });
    
    // ESC key to close modals
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            hideAllModals();
        }
    });
    
    logger.success('Modal handling initialized');
}

function hideAllModals() {
    const modals = [
        elements.donationModal,
        elements.profileModal,
        elements.welcomeOverlay
    ];
    
    modals.forEach(modal => {
        if (modal) {
            modal.classList.remove('active');
            modal.style.display = 'none';
        }
    });
    
    hideNotificationPanel();
    logger.info('All modals hidden');
}

// ================================
// PERFORMANCE MONITORING
// ================================

function logPerformanceStats() {
    const now = performance.now();
    const sessionDuration = Math.floor((now - performanceLogger.startTime) / 1000);
    
    logger.info('📊 Performance Stats:', {
        sessionDuration: `${sessionDuration}s`,
        apiCalls: performanceLogger.apiCalls,
        errors: performanceLogger.errors,
        voiceEvents: performanceLogger.voiceEvents,
        messagesPerMinute: Math.round(messageCount / (sessionDuration / 60)),
        memoryUsage: navigator.userAgent.includes('Chrome') ? 
            `${Math.round(performance.memory?.usedJSHeapSize / 1024 / 1024)}MB` : 'N/A'
    });
}

// ================================
// ERROR HANDLING
// ================================

function setupGlobalErrorHandling() {
    logger.info('Setting up global error handling...');
    
    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
        logger.error('Unhandled promise rejection:', event.reason);
        showToast('error', 'System Error', 'An unexpected error occurred');
        event.preventDefault();
    });
    
    // General errors
    window.addEventListener('error', (event) => {
        logger.error('Global error:', event.error);
        performanceLogger.errors++;
    });
    
    logger.success('Global error handling setup complete');
}

// ================================
// INITIALIZATION & STARTUP
// ================================

function showLoadingOverlay() {
    if (elements.loadingOverlay) {
        elements.loadingOverlay.style.display = 'flex';
        logger.info('Loading overlay shown');
    }
}

function hideLoadingOverlay() {
    if (elements.loadingOverlay) {
        elements.loadingOverlay.style.display = 'none';
        logger.info('Loading overlay hidden');
    }
}

// ================================
// OPTIMIZED APPLICATION INITIALIZATION
// ================================

async function initializeApplication() {
    logger.info('🚀 Starting Lucy AI Dashboard initialization...');
    
    try {
        showLoadingOverlay();
        
        // Setup error handling first
        setupGlobalErrorHandling();
        
        // Initialize core systems based on device capabilities
        logger.info('Initializing core systems...');
        
        // Initialize basic UI first
        initializeTabNavigation();
        initializeInputHandling();
        initializeSuggestionChips();
        initializeChatActions();
        initializeModalHandling();
        initializeLogout();
        
        // Initialize speech manager only if not low-end device
        if (!window.isLowEndDevice) {
            speechManager = new VoiceManager();
            
            // Don't wait too long for speech manager on mobile
            const maxWait = window.isMobile ? 20 : 50;
            let attempts = 0;
            
            while (!speechManager.isInitialized && attempts < maxWait) {
                await new Promise(resolve => setTimeout(resolve, 100));
                attempts++;
            }
            
            if (!speechManager.isInitialized) {
                logger.warn('Speech manager initialization timeout, continuing anyway');
            }
        } else {
            logger.info('Skipping speech manager on low-end device');
            // Hide voice mode buttons
            if (elements.switchModeBtn) elements.switchModeBtn.style.display = 'none';
            if (elements.fabBtn) elements.fabBtn.style.display = 'none';
        }
        
        // Initialize other systems
        initializeDonationSystem();
        initializeProfileSystem();
        initializeNotificationSystem();
        initializeWelcomeOverlay();     
        initializeChatMaximize();
        
        // Request microphone permissions only if needed
        if (!window.isLowEndDevice && !window.isMobile) {
            try {
                await navigator.mediaDevices.getUserMedia({ audio: true });
                logger.success('Microphone permissions granted');
            } catch (error) {
                logger.warn('Microphone permissions not granted:', error.message);
            }
        }
        
        // Start timers with mobile optimization
        const updateInterval = window.isMobile ? 2000 : 1000; // Less frequent on mobile
        setInterval(updateLiveStats, updateInterval);
        
        // Performance monitoring (less frequent on mobile)
        const perfInterval = window.isMobile ? 300000 : 60000; // 5min vs 1min
        setInterval(logPerformanceStats, perfInterval);
        
        // Load initial data
        updateLiveStats();
        updateNotificationBadge(3);
        
        // Hide loading overlay
        hideLoadingOverlay();
        
        // Set application as initialized
        isInitialized = true;
        
        logger.success('✅ Lucy AI Dashboard initialization complete!');
        
        // Show welcome for new users
        if (!localStorage.getItem('returning_user')) {
            setTimeout(showWelcomeOverlay, 1000);
        }
        
    } catch (error) {
        logger.error('❌ Application initialization failed:', error);
        hideLoadingOverlay();
        showToast('error', 'Initialization Error', 'Failed to initialize application');
        
        // Fallback: at least show the chat interface
        if (elements.chatContent) {
            elements.chatContent.style.display = 'flex';
            elements.chatContent.classList.add('active');
        }
    }
}

// ================================
// STARTUP SEQUENCE
// ================================

// DOM Content Loaded
document.addEventListener('DOMContentLoaded', () => {
    logger.info('DOM content loaded, starting initialization...');
        initializeApplication();
});

// Window loaded
window.addEventListener('load', () => {
    logger.info('Window fully loaded');
    
    // Final initialization steps
    setTimeout(() => {
        if (isInitialized) {
            logger.success('🎉 Lucy AI Dashboard fully ready!');
            
            // Show success notification
            showToast('success', 'Welcome!', 'Lucy AI is ready to help you learn!');
            
            // Update current date
            const chatDate = document.getElementById('chatDate');
            if (chatDate) {
                chatDate.textContent = new Date().toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
            }
        }
    }, 500);
});

// ================================
// IMPROVED PAGE VISIBILITY HANDLING
// ================================

document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        logger.info('Page hidden - pausing activities');
        
        // Stop voice mode completely when page is hidden
        if (voiceModeActive && speechManager) {
            speechManager.cleanup();
            shouldContinueListening = false;
        }
        
        // Cancel any ongoing API requests
        if (window.currentFetchController) {
            window.currentFetchController.abort();
        }
        
        // Pause animations to save battery
        document.querySelectorAll('*').forEach(el => {
            if (el.style.animationPlayState !== undefined) {
                el.style.animationPlayState = 'paused';
            }
        });
        
    } else {
        logger.info('Page visible - resuming activities');
        
        // Resume animations
        document.querySelectorAll('*').forEach(el => {
            if (el.style.animationPlayState !== undefined) {
                el.style.animationPlayState = 'running';
            }
        });
        
        // Don't auto-resume voice mode for better UX
        if (isVoiceMode) {
            showToast('info', 'Voice Mode', 'Voice mode paused. Click voice button to resume.');
        }
    }
});

// ================================
// IMPROVED CLEANUP ON PAGE UNLOAD
// ================================

window.addEventListener('beforeunload', (e) => {
    // Clean up voice mode
    if (voiceModeActive && speechManager) {
        speechManager.destroy();
    }
    
    // Cancel any ongoing requests
    if (window.currentFetchController) {
        window.currentFetchController.abort();
    }
    
    // Save session data with error handling
    try {
        const sessionData = {
            duration: Math.floor((new Date() - sessionStartTime) / 60000),
            messages: messageCount,
            words: wordCount,
            endTime: new Date().toISOString(),
            device: window.isMobile ? 'mobile' : 'desktop'
        };
        
        localStorage.setItem('lastSession', JSON.stringify(sessionData));
        logger.info('Session data saved before unload');
    } catch (error) {
        logger.error('Failed to save session data:', error);
    }
    
    // Only show warning if voice mode is active
    if (voiceModeActive) {
        e.preventDefault();
        e.returnValue = 'Voice mode is active. Are you sure you want to leave?';
        return e.returnValue;
    }
});

// ================================
// KEYBOARD SHORTCUTS
// ================================

document.addEventListener('keydown', (e) => {
    // Only allow certain shortcuts in voice mode
    if (voiceModeActive && !['Escape', 'm'].includes(e.key.toLowerCase())) {
        return;
    }
    
    // Ctrl/Cmd + Enter to send message
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (elements.messageInput && !voiceModeActive) {
            sendMessage(elements.messageInput.value);
        }
    }
    
    // Ctrl/Cmd + M to toggle voice mode
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'm') {
        e.preventDefault();
        if (speechManager) {
            speechManager.toggleVoiceMode();
        }
    }
    
    // Ctrl/Cmd + D to open donation modal
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        if (!voiceModeActive) {
            showDonationModal();
        }
    }
    
    // Ctrl/Cmd + P to open profile
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        if (!voiceModeActive) {
            showProfileModal();
        }
    }
    
    // Ctrl/Cmd + K to focus message input
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (elements.messageInput && !voiceModeActive) {
            elements.messageInput.focus();
        }
    }
    
    // Space to stop/start voice mode when focused on voice button
    if (e.key === ' ' && e.target === elements.switchModeBtn) {
        e.preventDefault();
        if (speechManager) {
            speechManager.toggleVoiceMode();
        }
    }
});

// ================================
// MOBILE SPECIFIC HANDLERS
// ================================

function initializeMobileHandlers() {
    // Touch handlers for better mobile experience
    if ('ontouchstart' in window) {
        logger.info('Touch device detected - initializing mobile handlers');
        
        // Prevent zoom on double tap for buttons
        document.addEventListener('touchend', (e) => {
            if (e.target.matches('button, .btn, .menu-item, .suggestion-chip')) {
                e.preventDefault();
            }
        });
        
        // Handle orientation change
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                // Scroll to bottom of chat
                if (elements.chatBox) {
                    elements.chatBox.scrollTop = elements.chatBox.scrollHeight;
                }
                
                // Update viewport height for mobile browsers
                const vh = window.innerHeight * 0.01;
                document.documentElement.style.setProperty('--vh', `${vh}px`);
                
                logger.info('Orientation changed - UI adjusted');
            }, 100);
        });
        
        // Set initial viewport height
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
    }
}

// ================================
// ENHANCED MOBILE OPTIMIZATIONS
// ================================

function initializeEnhancedMobileHandlers() {
    if (!window.isMobile) return;
    
    logger.info('Initializing enhanced mobile optimizations...');
    
    // Optimize viewport handling
    function updateViewportHeight() {
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
    }
    
    updateViewportHeight();
    window.addEventListener('resize', updateViewportHeight);
    window.addEventListener('orientationchange', () => {
        setTimeout(updateViewportHeight, 100);
    });
    
    // Optimize touch interactions
    document.addEventListener('touchstart', () => {}, { passive: true });
    document.addEventListener('touchend', (e) => {
        // Prevent zoom on double tap for interactive elements
        if (e.target.matches('button, .btn, .menu-item, .suggestion-chip, input, textarea')) {
            e.preventDefault();
        }
    });
    
    // Optimize scrolling performance
    const scrollableElements = document.querySelectorAll('.chat-messages, .main-content, .content-section');
    scrollableElements.forEach(el => {
        el.style.webkitOverflowScrolling = 'touch';
        el.style.overscrollBehavior = 'contain';
    });
    
    // Optimize input handling
    const inputs = document.querySelectorAll('input, textarea');
    inputs.forEach(input => {
        // Prevent zoom on focus
        input.style.fontSize = '16px';
        
        // Handle virtual keyboard
        input.addEventListener('focus', () => {
            setTimeout(() => {
                input.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 300);
        });
    });
    
    // Battery optimization
    if ('getBattery' in navigator) {
        navigator.getBattery().then(battery => {
            if (battery.level < 0.2 && !battery.charging) {
                logger.warn('Low battery detected, enabling power save mode');
                document.documentElement.classList.add('power-save-mode');
                showToast('info', 'Power Save', 'Low battery - some features disabled');
            }
        });
    }
    
    // Memory pressure handling
    if ('memory' in performance) {
        setInterval(() => {
            const memoryInfo = performance.memory;
            const usedMB = memoryInfo.usedJSHeapSize / 1024 / 1024;
            const limitMB = memoryInfo.jsHeapSizeLimit / 1024 / 1024;
            
            if (usedMB / limitMB > 0.8) {
                logger.warn('High memory pressure detected');
                cleanupOldMessages();
                
                if (usedMB / limitMB > 0.9) {
                    showToast('warning', 'Memory Warning', 'High memory usage - consider refreshing');
                }
            }
        }, 30000);
    }
    
    logger.success('Enhanced mobile optimizations initialized');
}

// Call this after the main initialization
initializeEnhancedMobileHandlers();

// ================================
// NETWORK STATUS MONITORING
// ================================

function initializeNetworkMonitoring() {
    logger.info('Initializing network monitoring...');
    
    // Online/offline handlers
    window.addEventListener('online', () => {
        logger.success('Network connection restored');
        showToast('success', 'Connected', 'Network connection restored');
        
        // Resume voice mode if it was active
        if (voiceModeActive && speechManager) {
            shouldContinueListening = true;
            if (!isSpeaking && !isProcessing) {
                speechManager.startListening();
            }
        }
    });
    
    window.addEventListener('offline', () => {
        logger.warn('Network connection lost');
        showToast('error', 'Offline', 'Network connection lost. Some features may not work.');
        
        // Pause voice mode
        if (voiceModeActive && speechManager) {
            speechManager.stopListening();
            shouldContinueListening = false;
        }
    });
    
    // Check initial network status
    if (!navigator.onLine) {
        logger.warn('Application started offline');
        showToast('warning', 'Offline Mode', 'You are currently offline');
    }
}

// ================================
// AUTO-SAVE FUNCTIONALITY
// ================================

function initializeAutoSave() {
    logger.info('Initializing auto-save functionality...');
    
    let autoSaveTimer;
    
    function autoSave() {
        clearTimeout(autoSaveTimer);
        autoSaveTimer = setTimeout(() => {
            try {
                const chatHistory = [];
                const messages = elements.chatBox?.querySelectorAll('.message:not(.typing-indicator)');
                
                messages?.forEach(msg => {
                    const isUser = msg.classList.contains('user-message');
                    const bubble = msg.querySelector('.message-bubble');
                    const time = msg.querySelector('.message-time');
                    
                    if (bubble && time) {
                        chatHistory.push({
                            type: isUser ? 'user' : 'ai',
                            text: bubble.textContent,
                            time: time.textContent,
                            timestamp: new Date().toISOString()
                        });
                    }
                });
                
                const saveData = {
                    chatHistory,
                    sessionStats: {
                        startTime: sessionStartTime.toISOString(),
                        messageCount,
                        wordCount,
                        accuracyScore,
                        streakDays
                    },
                    lastSaved: new Date().toISOString()
                };
                
                localStorage.setItem('lucyAI_autoSave', JSON.stringify(saveData));
                logger.info('Auto-save completed');
                
            } catch (error) {
                logger.error('Auto-save failed:', error);
            }
        }, 5000);
    }
    
    // Auto-save after each message
    const originalDisplayMessage = displayMessage;
    window.displayMessage = function(text, sender) {
        originalDisplayMessage(text, sender);
        autoSave();
    };
    
    // Periodic auto-save
    setInterval(autoSave, 30000); // Every 30 seconds
}

// ================================
// DATA RECOVERY
// ================================

function attemptDataRecovery() {
    logger.info('Attempting data recovery...');
    
    try {
        const savedData = localStorage.getItem('lucyAI_autoSave');
        if (savedData) {
            const data = JSON.parse(savedData);
            const lastSaved = new Date(data.lastSaved);
            const timeDiff = new Date() - lastSaved;
            
            // Only recover if data is less than 1 hour old
            if (timeDiff < 3600000) {
                logger.info('Recent auto-save data found, attempting recovery...');
                
                // Restore session stats
                if (data.sessionStats) {
                    messageCount = data.sessionStats.messageCount || 0;
                    wordCount = data.sessionStats.wordCount || 0;
                    accuracyScore = data.sessionStats.accuracyScore || 88;
                    streakDays = data.sessionStats.streakDays || 0;
                    updateLiveStats();
                }
                
                // Restore chat history
                if (data.chatHistory && data.chatHistory.length > 0) {
                    data.chatHistory.forEach(msg => {
                        displayMessage(msg.text, msg.type);
                    });
                    
                    showToast('success', 'Data Recovered', 'Previous session data has been restored');
                    logger.success('Data recovery completed successfully');
                    return true;
                }
            } else {
                logger.info('Auto-save data too old, skipping recovery');
            }
        }
    } catch (error) {
        logger.error('Data recovery failed:', error);
    }
    
    return false;
}

// ================================
// DEBUGGING UTILITIES
// ================================

// Create debugging interface for development
window.lucyAI_Debug = {
    // System info
    getSystemInfo: () => ({
        isInitialized,
        voiceModeActive,
        isRecording,
        isSpeaking,
        isProcessing,
        currentLanguage,
        messageCount,
        wordCount,
        accuracyScore,
        sessionDuration: Math.floor((new Date() - sessionStartTime) / 60000),
        performanceStats: performanceLogger
    }),
    
    // Voice system controls
    voice: {
        start: () => speechManager?.startVoiceMode(),
        stop: () => speechManager?.stopVoiceMode(),
        speak: (text) => speechManager?.speak(text),
        listen: () => speechManager?.startListening(),
        getVoices: () => speechManager?.voices || []
    },
    
    // UI controls
    ui: {
        showToast: (type, title, message) => showToast(type, title, message),
        showModal: (modalName) => {
            switch (modalName) {
                case 'donation': showDonationModal(); break;
                case 'profile': showProfileModal(); break;
                case 'welcome': showWelcomeOverlay(); break;
            }
        },
        switchTab: switchTab,
        clearChat: clearChat
    },
    
    // Data management
    data: {
        exportSession: () => {
            return {
                sessionStart: sessionStartTime.toISOString(),
                duration: Math.floor((new Date() - sessionStartTime) / 60000),
                stats: { messageCount, wordCount, accuracyScore, streakDays },
                performance: performanceLogger
            };
        },
        clearStorage: () => {
            localStorage.clear();
            sessionStorage.clear();
            logger.info('All storage cleared');
        },
        recoverData: attemptDataRecovery
    },
    
    // Testing utilities
    test: {
        simulateMessage: (text, sender = 'user') => displayMessage(text, sender),
        simulateAchievement: (name) => unlockAchievement({
            id: 'test',
            name: name,
            description: 'Test achievement',
            icon: '🧪'
        }),
        simulateError: () => {
            throw new Error('Test error for debugging');
        }
    }
};

// ================================
// FINAL INITIALIZATION
// ================================

// Initialize mobile handlers
initializeMobileHandlers();

// Initialize network monitoring
initializeNetworkMonitoring();

// Initialize auto-save
initializeAutoSave();

// Attempt data recovery on startup
setTimeout(() => {
    if (isInitialized) {
        attemptDataRecovery();
    }
}, 2000);

// ================================
// CONSOLE WELCOME MESSAGE
// ================================

setTimeout(() => {
    if (isInitialized) {
        console.log(`
╭─────────────────────────────────────────────────────╮
│                                                     │
│             🤖 Lucy AI Dashboard v1.0                │
│                                                     │
│  Ready for intelligent language learning!          │
│                                                     │
│  Debug Tools: window.lucyAI_Debug                   │
│  Voice Mode: Ctrl/Cmd + M                          │
│  Donate: Ctrl/Cmd + D                              │
│                                                     │
│  Status: ✅ All systems operational                  │
│                                                     │
╰─────────────────────────────────────────────────────╯
        `);
        
        // Show system status
        console.table({
            'Initialization': '✅ Complete',
            'Speech Recognition': speechManager?.isInitialized ? '✅ Ready' : '❌ Not Available',
            'Voice Synthesis': window.speechSynthesis ? '✅ Ready' : '❌ Not Available',
            'Network Status': navigator.onLine ? '✅ Online' : '❌ Offline',
            'Storage': localStorage ? '✅ Available' : '❌ Not Available',
            'Microphone': 'Checking...'
        });
        
        // Check microphone availability
        if (navigator.mediaDevices?.getUserMedia) {
            navigator.mediaDevices.getUserMedia({ audio: true })
                .then(() => {
                    console.log('🎤 Microphone: ✅ Available');
                })
                .catch(() => {
                    console.log('🎤 Microphone: ❌ Permission needed');
                });
        }
    }
}, 3000);

// ================================
// ERROR RECOVERY MECHANISMS
// ================================

// Automatic error recovery for voice mode
setInterval(() => {
    if (voiceModeActive && speechManager) {
        // Check if voice mode is stuck
        const now = Date.now();
        
        // If we've been in the same state too long, reset
        if (isRecording && (now - (speechManager.lastRecordingStart || 0)) > 30000) {
            logger.warn('Voice recording stuck, resetting...');
            speechManager.stopListening();
            setTimeout(() => speechManager.startListening(), 1000);
        }
        
        if (isSpeaking && (now - (speechManager.lastSpeechStart || 0)) > 60000) {
            logger.warn('Speech synthesis stuck, resetting...');
            window.speechSynthesis.cancel();
            isSpeaking = false;
            setTimeout(() => speechManager.startListening(), 1000);
        }
    }
}, 10000); // Check every 10 seconds

// ================================
// PERFORMANCE OPTIMIZATION
// ================================

// Throttle resize events
let resizeTimer;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
        // Update viewport height for mobile
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
        
        // Scroll chat to bottom after resize
        if (elements.chatBox) {
            elements.chatBox.scrollTop = elements.chatBox.scrollHeight;
        }
        
        logger.info('Window resized, UI adjusted');
    }, 250);
});

// Optimize scroll performance
if (elements.chatBox) {
    let scrollTimer;
    elements.chatBox.addEventListener('scroll', () => {
        clearTimeout(scrollTimer);
        scrollTimer = setTimeout(() => {
            // Lazy load messages if needed (for large chat histories)
            // This would be implemented for production
        }, 100);
    });
}

// ================================
// FEATURE FLAGS & CONFIGURATION
// ================================

const featureFlags = {
    voiceMode: true,
    achievements: true,
    analytics: true,
    autoSave: true,
    dataRecovery: true,
    debugging: true
};

// Apply feature flags
if (!featureFlags.voiceMode) {
    elements.switchModeBtn?.style.setProperty('display', 'none');
    elements.fabBtn?.style.setProperty('display', 'none');
}

if (!featureFlags.achievements) {
    const achievementsMenuItem = document.querySelector('[data-tab="achievements"]');
    achievementsMenuItem?.style.setProperty('display', 'none');
}

logger.info('Feature flags applied:', featureFlags);

// ================================
// FINAL READY STATE
// ================================

logger.success('🎉 Lucy AI Dashboard JavaScript fully loaded and ready!');
logger.info('Total initialization time:', Math.round(performance.now()), 'ms');


// ================================
// FINAL ERROR RECOVERY & SAFETY NETS
// ================================

// Emergency recovery function
window.emergencyRecovery = function() {
    logger.warn('🚨 Emergency recovery initiated');
    
    // Stop all voice activities
    if (speechManager) {
        speechManager.destroy();
    }
    
    // Clear all intervals and timeouts
    const highestTimeoutId = setTimeout(() => {}, 0);
    for (let i = 0; i < highestTimeoutId; i++) {
        clearTimeout(i);
        clearInterval(i);
    }
    
    // Reset global state
    isVoiceMode = false;
    voiceModeActive = false;
    isRecording = false;
    isSpeaking = false;
    isProcessing = false;
    shouldContinueListening = false;
    
    // Show basic chat interface
    if (elements.chatContent) {
        elements.chatContent.style.display = 'flex';
        elements.chatContent.classList.add('active');
    }
    
    // Hide all modals
    document.querySelectorAll('.modal-overlay').forEach(modal => {
        modal.classList.remove('active');
        modal.style.display = 'none';
    });
    
    // Re-enable all UI elements
    document.querySelectorAll('[disabled]').forEach(el => {
        el.removeAttribute('disabled');
        el.style.pointerEvents = 'auto';
        el.style.opacity = '1';
    });
    
    showToast('success', 'Recovery Complete', 'Application has been reset');
    logger.info('✅ Emergency recovery completed');
};

// Auto-recovery on critical errors
let criticalErrorCount = 0;
window.addEventListener('error', (e) => {
    criticalErrorCount++;
    if (criticalErrorCount >= 5) {
        logger.error('Multiple critical errors detected, initiating recovery');
        window.emergencyRecovery();
        criticalErrorCount = 0;
    }
});

// Final initialization check
setTimeout(() => {
    if (!isInitialized) {
        logger.error('Initialization failed, running emergency recovery');
        window.emergencyRecovery();
    }
}, 10000);

// Global debug helper for mobile
if (window.isMobile) {
    window.mobileDebug = {
        getStatus: () => ({
            initialized: isInitialized,
            voiceMode: voiceModeActive,
            memory: performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1024 / 1024) + 'MB' : 'N/A',
            battery: 'getBattery' in navigator ? 'Available' : 'N/A',
            messages: messageCount,
            errors: performanceLogger.errors
        }),
        recover: window.emergencyRecovery,
        clearMessages: () => {
            if (elements.chatBox) elements.chatBox.innerHTML = '';
            messageCount = 0;
            updateLiveStats();
        }
    };
    
    console.log('📱 Mobile debug tools available: window.mobileDebug');
}

logger.success('🎉 All optimizations and safety nets in place!');

