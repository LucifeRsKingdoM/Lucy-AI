// script1.js - Lucy AI Dashboard JavaScript

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
// SPEECH RECOGNITION & SYNTHESIS
// ================================
class VoiceManager {
    constructor() {
        this.voices              = [];
        this.currentVoice        = null;
        this.isInitialized       = false;
        this.speechSynthesis     = window.speechSynthesis;
        this.lastRecordingStart  = 0;   // for watchdog
        this.lastSpeechStart     = 0;   // for watchdog

        logger.info('VoiceManager initializing…');
        this.init();
    }

    /* ----------  bootstrap ---------- */
    async init() {
        try {
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
            setTimeout(() => resolve(), 1000);  // fallback
        });
    }

    selectVoice(lang = 'en') {
        this.currentVoice =
            this.voices.find(v =>
                v.lang.startsWith(lang) && /female/i.test(v.name)) ||
            this.voices.find(v => v.lang.startsWith(lang)) ||
            this.voices[0];
        logger.info('Selected voice:', this.currentVoice?.name || 'default');
    }

    /* ----------  speech-recognition ---------- */
    setupSpeechRecognition() {
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SR) {
            logger.error('Speech recognition not supported in this browser');
            return;
        }

        recognition                = new SR();
        recognition.lang           = currentLanguage;
        recognition.continuous     = false;
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
            isRecording           = true;
            this.lastRecordingStart = Date.now();
            logger.voice('🎙️  Listening…');
            this.showVoiceIndicator('Listening…');
        };

        recognition.onresult = (e) => {
            const i          = e.resultIndex;
            const transcript = e.results[i][0].transcript;
            if (e.results[i].isFinal) {
                this.processSpeechResult(transcript);
            } else {
                this.showInterimResult(transcript);
            }
        };

        recognition.onerror = (e) => {
            isRecording = false;
            logger.error('Speech recognition error:', e.error);
            if (e.error === 'not-allowed') {
                showToast('error','Permission Denied','Microphone access needed');
                this.stopVoiceMode();
            } else if (voiceModeActive && shouldContinueListening) {
                setTimeout(() => this.startListening(), 1500);
            }
        };

        recognition.onend = () => {
            isRecording = false;
            if (voiceModeActive && shouldContinueListening && !isSpeaking && !isProcessing) {
                setTimeout(() => this.startListening(), 500);
            }
        };

        logger.success('Speech recognition ready');
    }

    startListening() {
        if (!voiceModeActive || isRecording || isSpeaking || isProcessing) return;
        try {
            recognition.start();
        } catch { /* ignore “already started” */ }
    }

    stopListening() {
        if (isRecording) recognition.stop();
        isRecording = false;
    }

    processSpeechResult(text) {
        text = text.trim();
        if (!text) return;
        this.hideVoiceIndicator();
        elements.messageInput && (elements.messageInput.value = text);
        sendMessage(text);
    }

    showInterimResult(text) {
        elements.messageInput && (elements.messageInput.value = text);
    }

    /* ----------  speech-synthesis ---------- */
    async speak(text) {
        if (!text || isSpeaking) return;
        return new Promise(resolve => {
            this.speechSynthesis.cancel();

            const clean = text.replace(/\*/g,'')
                              .replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu,'')
                              .replace(/\n/g,' ')
                              .trim();
            if (!clean) return resolve();

            const u        = new SpeechSynthesisUtterance(clean);
            u.voice        = this.currentVoice;
            u.rate         = 0.9;
            u.pitch        = 1.1;

            u.onstart = () => {
                isSpeaking          = true;
                this.lastSpeechStart = Date.now();
                this.showVoiceIndicator('Speaking…');
            };
            u.onend   = () => { this.finishSpeaking(); resolve(); };
            u.onerror = () => { this.finishSpeaking(); resolve(); };

            this.speechSynthesis.speak(u);
        });
    }

    finishSpeaking() {
        isSpeaking = false;
        this.hideVoiceIndicator();
        if (voiceModeActive && shouldContinueListening) {
            setTimeout(() => this.startListening(), 800);
        }
    }

    /* ----------  UI helpers ---------- */
    showVoiceIndicator(text) {
        elements.voiceIndicator?.classList.add('active');
        if (elements.voiceText) elements.voiceText.textContent = text;
        this.animateVoiceWaves(true);
    }
    hideVoiceIndicator() {
        elements.voiceIndicator?.classList.remove('active');
        this.animateVoiceWaves(false);
    }
    animateVoiceWaves(active) {
        elements.voiceWaves.forEach(w => {
            w.style.animationPlayState = active ? 'running' : 'paused';
        });
    }

    /* ----------  VOICE MODE TOGGLE ---------- */
    async toggleVoiceMode() {
        voiceModeActive ? this.stopVoiceMode() : await this.startVoiceMode();
    }

    async startVoiceMode() {
        try {
            logger.voice('🔊 Voice mode ON');
            isVoiceMode            = true;
            voiceModeActive        = true;
            shouldContinueListening = false;

            this.stopListening();
            window.speechSynthesis.cancel();

            // button looks
            if (elements.switchModeBtn) {
                elements.switchModeBtn.querySelector('i').className = 'fas fa-keyboard';
                elements.switchModeBtn.querySelector('span').textContent = 'Chat Mode';
                elements.switchModeBtn.classList.add('active');
            }
            toggleUIElements(true);
            showToast('success','Voice Mode Active','I’m listening!');

            // automatic kick-off message
            const username = document.querySelector('.user-name')?.textContent.trim() || 'friend';
            const kickoff  = `Hi Lucy, I'm ${username}. Let’s practise my English.`;

            isProcessing = true;
            await sendMessage(kickoff);   // speak() will run inside sendMessage
            isProcessing = false;

            shouldContinueListening = true;
            setTimeout(() => this.startListening(), 800);
        } catch (err) {
            logger.error('Voice-mode bootstrap failed', err);
            showToast('error','Voice Error','Could not start voice mode');
            this.stopVoiceMode();
        }
    }

    stopVoiceMode() {
        logger.voice('🔇 Voice mode OFF');
        this.stopListening();
        window.speechSynthesis.cancel();

        isVoiceMode            = false;
        voiceModeActive        = false;
        shouldContinueListening = false;
        isRecording            = false;
        isSpeaking             = false;
        isProcessing           = false;

        if (elements.switchModeBtn) {
            elements.switchModeBtn.querySelector('i').className = 'fas fa-microphone';
            elements.switchModeBtn.querySelector('span').textContent = 'Voice Mode';
            elements.switchModeBtn.classList.remove('active');
        }
        toggleUIElements(false);
        this.hideVoiceIndicator();
        showToast('success','Chat Mode Active','Voice mode disabled');
    }
}

// ================================
// CHAT FUNCTIONALITY
// ================================

async function sendMessage(text) {
    const trimmedText = text?.trim();
    if (!trimmedText) {
        logger.warn('Empty message, ignoring send request');
        return;
    }
    
    logger.info(`Sending message: "${trimmedText}"`);
    
    // Set processing state
    isProcessing = true;
    
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
    
    try {
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
        });
        
        logger.info(`API Response status: ${response.status}`);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        logger.success('API response received:', data);
        
        const aiResponse = data.response || "Sorry, I didn't get a response from the server.";
        
        // Hide typing indicator
        hideTypingIndicator();
        
        // Display AI response
        displayMessage(aiResponse, 'ai');
        
        // Handle voice mode
        if (voiceModeActive && speechManager) {
            logger.voice('Voice mode active, speaking AI response');
            await speechManager.speak(aiResponse);
        }
        
        // Check for achievements
        checkAchievements();
        
        logger.success('Message sent and processed successfully');
        
    } catch (error) {
        logger.error('Error sending message:', error);
        hideTypingIndicator();
        
        const errorMessage = 'Sorry, I encountered an error. Please try again! 😔';
        displayMessage(errorMessage, 'ai');
        
        showToast('error', 'Connection Error', 'Failed to send message. Please check your connection.');
        
        // In voice mode, speak the error
        if (voiceModeActive && speechManager) {
            await speechManager.speak(errorMessage);
        }
    } finally {
        isProcessing = false;
        logger.info('Message processing completed');
    }
    
    // If the user has typed while Lucy was talking, stop the speech immediately
    if (speechManager && isSpeaking) {
        window.speechSynthesis.cancel();
        isSpeaking = false;
}
}

function displayMessage(text, sender) {
    if (!elements.chatBox) {
        logger.error('Chat box not found');
        return;
    }
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;
    
    const time = new Date().toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit' 
    });
    
    if (sender === 'ai') {
        messageDiv.innerHTML = `
            <div class="message-avatar">
                <img src="https://ui-avatars.com/api/?name=Lucy&background=ec4899&color=fff&size=32" alt="Lucy">
            </div>
            <div class="message-content">
                <div class="message-bubble">${text}</div>
                <span class="message-time">${time}</span>
            </div>
        `;
    } else {
        messageDiv.innerHTML = `
            <div class="message-content">
                <div class="message-bubble">${text}</div>
                <span class="message-time">${time}</span>
            </div>
        `;
    }
    
    elements.chatBox.appendChild(messageDiv);
    elements.chatBox.scrollTop = elements.chatBox.scrollHeight;
    
    logger.info(`Message displayed: ${sender} - ${text.substring(0, 50)}...`);
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
            name: 'PhonePe',
            upiId: 'yogiguli@ybl',
            phone: '+91-9008587582',
            qrCode: '/static/media/PhonePe_QR.png'
        },
        googlepay: {
            name: 'Google Pay',
            upiId: 'yogesh490807@okaxis',
            phone: '+91-9008587582',
            qrCode: '/static/media/GooglePay_QR.png'
        },
        paytm: {
            name: 'Paytm',
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

async function initializeApplication() {
    logger.info('🚀 Starting Lucy AI Dashboard initialization...');
    
    try {
        showLoadingOverlay();
        
        // Setup error handling first
        setupGlobalErrorHandling();
        
        // Initialize core systems
        logger.info('Initializing core systems...');
        
        // Initialize speech manager
        speechManager = new VoiceManager();
        
        // Wait for speech manager to be ready
        let attempts = 0;
        while (!speechManager.isInitialized && attempts < 50) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        if (!speechManager.isInitialized) {
            logger.warn('Speech manager initialization timeout, continuing anyway');
        }
        
        // Initialize UI components
        initializeTabNavigation();
        initializeInputHandling();
        initializeSuggestionChips();
        initializeChatActions();
        initializeDonationSystem();
        initializeProfileSystem();
        initializeNotificationSystem();
        initializeLogout();
        initializeWelcomeOverlay();
        initializeModalHandling();
        
        // Check microphone permissions
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            try {
                await navigator.mediaDevices.getUserMedia({ audio: true });
                logger.success('Microphone permissions granted');
            } catch (error) {
                logger.warn('Microphone permissions not granted:', error.message);
            }
        }
        
        // Start session timer
        setInterval(() => {
            updateLiveStats();
        }, 1000);
        
        // Performance monitoring
        setInterval(() => {
            logPerformanceStats();
        }, 60000); // Every minute
        
        // Load initial data
        updateLiveStats();
        updateNotificationBadge(3);
        
        // Hide loading overlay
        hideLoadingOverlay();
        
        // Set application as initialized
        isInitialized = true;
        
        logger.success('✅ Lucy AI Dashboard initialization complete!');
        
        // Show welcome message if new user
        if (!localStorage.getItem('returning_user')) {
            setTimeout(() => {
                showWelcomeOverlay();
            }, 1000);
        }
        
    } catch (error) {
        logger.error('❌ Application initialization failed:', error);
        hideLoadingOverlay();
        showToast('error', 'Initialization Error', 'Failed to initialize application');
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

// Page visibility change handler
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        logger.info('Page hidden - pausing activities');
        
        // Pause voice recognition if active
        if (voiceModeActive && speechManager) {
            speechManager.stopListening();
            shouldContinueListening = false;
        }
    } else {
        logger.info('Page visible - resuming activities');
        
        // Resume voice recognition if voice mode was active
        if (voiceModeActive && speechManager) {
            shouldContinueListening = true;
            setTimeout(() => {
                if (!isSpeaking && !isProcessing) {
                    speechManager.startListening();
                }
            }, 1000);
        }
    }
});

// Before unload handler
window.addEventListener('beforeunload', (e) => {
    if (voiceModeActive) {
        e.preventDefault();
        e.returnValue = 'Voice mode is active. Are you sure you want to leave?';
        return e.returnValue;
    }
    
    // Save session data
    const sessionData = {
        duration: Math.floor((new Date() - sessionStartTime) / 60000),
        messages: messageCount,
        words: wordCount,
        endTime: new Date().toISOString()
    };
    
    localStorage.setItem('lastSession', JSON.stringify(sessionData));
    logger.info('Session data saved before unload');
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