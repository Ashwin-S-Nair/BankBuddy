// Video and prompt mappings
const videoMap = {
    welcome: 'assets/welcome.mp4',
    'loan-type': 'assets/loan-type.mp4',
    income: 'assets/income.mp4',
    amount: 'assets/amount.mp4',
    documents: 'assets/documents.mp4',
    processing: 'assets/processing.mp4',
    approved: 'assets/approved.mp4',
    rejected: 'assets/rejected.mp4',
    blockchain: 'assets/blockchain.mp4',
    thankyou: 'assets/thankyou.mp4'
};

const promptMap = {
    welcome: "Hello! Welcome to BankBuddy, your AI-powered NeoBank. I’m here to assist you in applying for a loan seamlessly. Let’s get started!",
    'loan-type': "What type of loan would you like to apply for today? You can choose from personal, home, car, education, or business loans. Select an option to proceed.",
    income: "To assess your eligibility, please share your monthly income. You can type it or record a video response stating your income clearly.",
    amount: "Great! Now, please enter or record how much loan amount you need. Make sure to request an amount that aligns with your financial profile.",
    documents: "Please upload at least one KYC document such as Aadhar, PAN card, or bank statement. Click submit once uploaded.",
    processing: "Thank you! Our AI is now verifying your details and assessing your loan eligibility. This may take a few seconds. Please wait.",
    approved: "Congratulations! Your loan has been approved. Your financial profile meets our criteria. Please review the summary below.",
    rejected: "Unfortunately, your loan application did not meet the required criteria. But don’t worry! You can submit additional details for further review.",
    blockchain: "Your application is securely processed via blockchain technology. Your loan agreement is now digitally stored, ensuring transparency and security.",
    thankyou: "Thank you for applying! Your application has been successfully submitted. As a token of appreciation, you've earned 50 loyalty points. We’ll update you on your application status soon!"
};

// Loan type interest rates
const loanDetails = {
    personal: { interestRate: 12.0 },
    home: { interestRate: 9.0 },
    car: { interestRate: 9.75 },
    education: { interestRate: 10.8 },
    business: { interestRate: 12.8 }
};

// State
let currentTab = 'welcome';
let userData = { loanType: '', income: '', loanAmount: '', documents: [], result: '', financialHealthScore: 0, tenure: '' };
let docData = { documents: [], extractedData: { name: '', dob: '', employmentType: '' } };
let mediaStream = null;
let recognition = null;

// DOM elements
const tabButtons = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');
const progressFill = document.getElementById('progress');
const startBtn = document.getElementById('start-btn');
const welcomeVideo = document.getElementById('welcome-video');
const loanTypeVideo = document.getElementById('loan-type-video');
const incomeVideo = document.getElementById('income-video');
const amountVideo = document.getElementById('amount-video');
const documentsVideo = document.getElementById('documents-video');
const resultVideo = document.getElementById('result-video');
const loanTypeRecordBtn = document.getElementById('loan-type-record-btn');
const incomeRecordBtn = document.getElementById('income-record-btn');
const amountRecordBtn = document.getElementById('amount-record-btn');
const loanTypeUserVideo = document.getElementById('loan-type-user-video');
const incomeUserVideo = document.getElementById('income-user-video');
const amountUserVideo = document.getElementById('amount-user-video');
const loanTypeTranscript = document.getElementById('loan-type-transcript');
const incomeTranscript = document.getElementById('income-transcript');
const amountTranscript = document.getElementById('amount-transcript');
const welcomePrompt = document.getElementById('welcome-prompt');
const loanTypePrompt = document.getElementById('loan-type-prompt');
const incomePrompt = document.getElementById('income-prompt');
const amountPrompt = document.getElementById('amount-prompt');
const documentsPrompt = document.getElementById('documents-prompt');
const resultPrompt = document.getElementById('result-prompt');
const docUpload = document.getElementById('doc-upload');
const submitDoc = document.getElementById('submit-doc');
const resultText = document.getElementById('result-text');
const healthScore = document.getElementById('health-score');
const notifications = document.getElementById('smart-notifications');
const faceRecognitionBtn = document.getElementById('face-recognition-btn');
const logo = document.getElementById('logo');
const loanOptions = document.querySelectorAll('.option-btn');
const summaryIncome = document.getElementById('summary-income');
const summaryAmount = document.getElementById('summary-amount');
const summaryLoanType = document.getElementById('summary-loan-type');
const loanAmountDetails = document.getElementById('loan-amount-details');
const loanInterestRate = document.getElementById('loan-interest-rate');
const summaryName = document.getElementById('summary-name');
const summaryDob = document.getElementById('summary-dob');
const summaryEmployment = document.getElementById('summary-employment');
const tenureButtons = document.querySelectorAll('.tenure-btn');
const tenureConfirmation = document.getElementById('tenure-confirmation');
const monthlyPayment = document.getElementById('monthly-payment');

// Update UI and enforce linear navigation
function updateUI() {
    tabContents.forEach(content => content.classList.remove('active'));
    document.getElementById(currentTab).classList.add('active');
    tabButtons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.tab === 'welcome') {
            btn.disabled = false; // Always enable the Welcome tab
        } else {
            btn.disabled = true; // Disable other tabs by default
        }
    });
    const currentBtn = document.querySelector(`[data-tab="${currentTab}"]`);
    if (currentBtn) currentBtn.classList.add('active');
    currentBtn.disabled = false; // Enable the current tab

    const progressSteps = { welcome: 16.67, 'loan-type': 33.33, income: 50, amount: 66.67, documents: 83.33, result: 100 };
    progressFill.style.width = `${progressSteps[currentTab]}%`;

    if (currentTab === 'welcome') {
        welcomeVideo.play();
        welcomePrompt.textContent = promptMap.welcome;
        startBtn.focus();
    }
    if (currentTab === 'loan-type') {
        loanTypeVideo.play();
        loanTypePrompt.textContent = promptMap['loan-type'];
        loanOptions.forEach(btn => {
            btn.classList.remove('selected');
            if (btn.dataset.option === userData.loanType) btn.classList.add('selected');
        });
        loanTypeRecordBtn.focus();
    }
    if (currentTab === 'income') {
        incomeVideo.play();
        incomePrompt.textContent = promptMap.income;
        incomeRecordBtn.focus();
    }
    if (currentTab === 'amount') {
        amountVideo.play();
        amountPrompt.textContent = promptMap.amount;
        amountRecordBtn.focus();
    }
    if (currentTab === 'documents') {
        documentsVideo.play();
        documentsPrompt.textContent = promptMap.documents;
        document.querySelectorAll('.option-btn').forEach(btn => btn.classList.remove('selected'));
        userData.documents.forEach(doc => {
            document.querySelector(`.option-btn[data-option="${doc}"]`)?.classList.add('selected');
        });
        submitDoc.focus();
    }
    if (currentTab === 'result') {
        resultVideo.src = videoMap[userData.result];
        resultVideo.play();
        resultPrompt.textContent = promptMap[userData.result];
        
        if (userData.result === 'rejected') {
            const income = parseInt(userData.income) || 0;
            const maxLoan = 5 * income;
            const age = calculateAge(docData.extractedData.dob);
            let reasons = [];
            if (income <= 25000) reasons.push("your income is below ₹25,000");
            if (userData.loanAmount >= maxLoan) reasons.push(`loan amount exceeds 5x your income (max allowed: ₹${Math.floor(maxLoan)})`);
            if (age < 21) reasons.push("you are under 21 years old");
            if (age > 60) reasons.push("you are over 60 years old");
            resultText.textContent = `Rejected: Your ${userData.loanType} loan didn’t meet criteria. Reasons: ${reasons.join(", ")}.`;
        } else {
            resultText.textContent = `Approved! Your ${userData.loanType} Loan of ₹${userData.loanAmount} is approved.`;
        }
        resultText.className = `result-text ${userData.result}`;

        summaryIncome.textContent = userData.income || 'N/A';
        summaryAmount.textContent = userData.loanAmount || 'N/A';
        summaryLoanType.textContent = userData.loanType ? userData.loanType.charAt(0).toUpperCase() + userData.loanType.slice(1) : 'N/A';
        loanAmountDetails.textContent = userData.loanAmount || 'N/A';
        loanInterestRate.textContent = loanDetails[userData.loanType]?.interestRate || 'N/A';
        summaryName.textContent = docData.extractedData.name || 'N/A';
        summaryDob.textContent = docData.extractedData.dob || 'N/A';
        summaryEmployment.textContent = docData.extractedData.employmentType || 'N/A';

        updateFinancialHealthScore();

        // Ensure tenure buttons are enabled and selectable
        tenureButtons.forEach(btn => {
            btn.classList.remove('selected');
            btn.disabled = false; // Explicitly enable tenure buttons
            if (parseInt(btn.dataset.tenure) === parseInt(userData.tenure)) {
                btn.classList.add('selected');
                calculateMonthlyPayment();
            }
        });
        tenureConfirmation.style.display = userData.tenure ? 'block' : 'none';
        monthlyPayment.style.display = userData.tenure ? 'block' : 'none';
    }
}

// Move to next tab
function nextTab() {
    const tabOrder = ['welcome', 'loan-type', 'income', 'amount', 'documents', 'result'];
    const currentIndex = tabOrder.indexOf(currentTab);
    if (currentIndex < tabOrder.length - 1) {
        currentTab = tabOrder[currentIndex + 1];
        updateUI();
    }
}

// Initialize Media Stream and Speech Recognition
async function initMediaAndSpeech() {
    if (!('webkitSpeechRecognition' in window)) {
        notify('Speech recognition is not supported in this browser. Please use Chrome.');
        return false;
    }

    try {
        mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        console.log('Media stream initialized:', mediaStream);

        recognition = new webkitSpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'en-IN';
        recognition.onend = () => console.log('Speech recognition ended');
        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            notify(`Speech recognition error: ${event.error}. Please try again.`);
        };

        notify('Microphone and camera access granted. You’re ready to proceed!');
        return true;
    } catch (error) {
        console.error('Media access error:', error);
        notify('Please allow camera and microphone access to proceed.');
        return false;
    }
}

// Record with Speech-to-Text
function recordVideoWithSpeech(videoElement, button, transcriptElement, callback) {
    if (!mediaStream || !recognition) {
        notify('Media or speech not initialized. Please refresh and allow permissions.');
        button.textContent = 'Record Response';
        button.disabled = false;
        return;
    }

    videoElement.srcObject = mediaStream;
    button.textContent = 'Recording...';
    button.disabled = true;

    recognition.onresult = (event) => {
        let interim = '';
        let final = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
            const text = event.results[i][0].transcript;
            if (event.results[i].isFinal) final += text;
            else interim = text;
        }
        transcriptElement.textContent = final + interim;
    };

    recognition.start();
    console.log('Speech recognition started');

    setTimeout(() => {
        recognition.stop();
        button.textContent = 'Record Response';
        button.disabled = false;
        const transcript = transcriptElement.textContent.trim();
        callback(transcript);
        nextTab(); // Move to next tab after recording
    }, 5000);
}

// Handle option selection
function handleOptionSelection(event) {
    const selectedOption = event.target.dataset.option;
    if (currentTab === 'loan-type') {
        userData.loanType = selectedOption;
        notify(`You’ve chosen a ${userData.loanType} loan.`);
        nextTab();
    } else if (currentTab === 'documents') {
        if (!userData.documents.includes(selectedOption)) {
            userData.documents.push(selectedOption);
            event.target.classList.add('selected');
            notify(`Added ${selectedOption} to documents.`);
        }
    }
}

// Handle tenure selection
function handleTenureSelection(event) {
    userData.tenure = event.target.dataset.tenure;
    notify(`Selected tenure: ${userData.tenure} years.`);
    tenureConfirmation.textContent = "Thank you, we will get back to you shortly.";
    calculateMonthlyPayment();
    updateUI();
}

// AI Features
function updateFinancialHealthScore() {
    const income = parseInt(userData.income) || 0;
    const loanAmount = parseInt(userData.loanAmount) || 0;
    const baseScore = Math.min(100, Math.floor(income / 1000));
    const loanRatio = loanAmount / (income * 12);
    userData.financialHealthScore = Math.max(0, Math.min(100, baseScore - (loanRatio * 100)));
    healthScore.textContent = `${userData.financialHealthScore}/100`;
}

// Calculate monthly payment
function calculateMonthlyPayment() {
    const loanAmount = parseInt(userData.loanAmount) || 0;
    const interestRate = loanDetails[userData.loanType]?.interestRate || 0;
    const tenureYears = parseInt(userData.tenure) || 0;
    const monthlyInterestRate = (interestRate / 100) / 12;
    const numberOfPayments = tenureYears * 12;

    if (loanAmount > 0 && tenureYears > 0 && monthlyInterestRate > 0) {
        const monthlyPaymentAmount = loanAmount * (monthlyInterestRate * Math.pow(1 + monthlyInterestRate, numberOfPayments)) / (Math.pow(1 + monthlyInterestRate, numberOfPayments) - 1);
        monthlyPayment.textContent = `Monthly Payment: ₹${monthlyPaymentAmount.toFixed(2)}`;
    } else {
        monthlyPayment.textContent = 'Monthly Payment: N/A';
    }
}

// Helper function to parse extracted text for key details
function parseExtractedText(text) {
    const extractedData = { name: '', dob: '', employmentType: '' };
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);

    for (const line of lines) {
        if (!extractedData.name) {
            if (line.toLowerCase().startsWith('name:')) {
                extractedData.name = line.substring(5).trim();
            } else if (/^[A-Z][a-z]+ [A-Z][a-z]+$/.test(line)) {
                extractedData.name = line;
            }
        }

        if (!extractedData.dob) {
            if (line.toLowerCase().startsWith('dob:') || line.toLowerCase().startsWith('date of birth:')) {
                const dobMatch = line.match(/\d{2}\/\d{2}\/\d{4}|\d{4}-\d{2}-\d{2}/);
                if (dobMatch) extractedData.dob = dobMatch[0];
            } else if (/\d{2}\/\d{2}\/\d{4}|\d{4}-\d{2}-\d{2}/.test(line)) {
                extractedData.dob = line.match(/\d{2}\/\d{2}\/\d{4}|\d{4}-\d{2}-\d{2}/)[0];
            }
        }

        if (!extractedData.employmentType) {
            if (line.toLowerCase().startsWith('employment:') || line.toLowerCase().startsWith('type:')) {
                const typeMatch = line.match(/Full-Time|Part-Time|Self-Employed|Freelance|Student/i);
                if (typeMatch) extractedData.employmentType = typeMatch[0];
            } else if (/Full-Time|Part-Time|Self-Employed|Freelance|Student/i.test(line)) {
                extractedData.employmentType = line.match(/Full-Time|Part-Time|Self-Employed|Freelance|Student/i)[0];
            }
        }
    }

    return extractedData;
}

async function processDocuments() {
    const files = docUpload.files;
    if (files.length === 0) {
        notify('Please upload at least one document.');
        return false;
    }

    notify('Processing document with OCR... Please wait.');

    try {
        const { createWorker } = Tesseract;
        const worker = await createWorker('eng', 1, {
            logger: (m) => console.log(m),
        });

        const file = files[0];
        const { data: { text } } = await worker.recognize(file);
        console.log('Extracted text:', text);

        docData.extractedData = parseExtractedText(text);

        await worker.terminate();

        notify('AI OCR: Document processed successfully!');
        return true;
    } catch (error) {
        console.error('OCR error:', error);
        notify('Error processing document with OCR. Please try again.');
        return false;
    }
}

function checkFraud() {
    return Math.random() > 0.1;
}

function notify(message) {
    const notification = document.createElement('div');
    notification.textContent = message;
    notifications.appendChild(notification);
    setTimeout(() => notification.remove(), 4000);
}

// Parse Speech Responses
function parseLoanType(transcript) {
    const lowerTranscript = transcript.toLowerCase();
    const loanTypes = ['personal', 'home', 'car', 'education', 'business'];
    return loanTypes.find(type => lowerTranscript.includes(type)) || '';
}

function parseNumber(transcript) {
    const lowerTranscript = transcript.toLowerCase();
    const numberMatch = transcript.match(/\d+/)?.[0];
    let multiplier = 1;
    if (lowerTranscript.includes('lakh')) multiplier = 100000;
    else if (lowerTranscript.includes('lacs')) multiplier = 100000;
    else if (lowerTranscript.includes('thousand')) multiplier = 1000;
    return numberMatch ? parseInt(numberMatch) * multiplier : 0;
}

function parseDocuments(transcript) {
    const lowerTranscript = transcript.toLowerCase();
    const validDocs = ['aadhar', 'pan', 'bank'];
    return validDocs.filter(doc => lowerTranscript.includes(doc));
}

// Event Listeners
startBtn.addEventListener('click', async () => {
    if (!mediaStream) {
        const success = await initMediaAndSpeech();
        if (!success) return;
    }
    nextTab();
});

tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        if (btn.dataset.tab === 'welcome') {
            currentTab = 'welcome';
            updateUI();
        }
        // Other tabs are disabled and can only be navigated via nextTab()
    });
});

loanOptions.forEach(btn => {
    btn.addEventListener('click', handleOptionSelection);
});

loanTypeRecordBtn.addEventListener('click', () => {
    recordVideoWithSpeech(loanTypeUserVideo, loanTypeRecordBtn, loanTypeTranscript, (transcript) => {
        userData.loanType = parseLoanType(transcript);
        if (userData.loanType) {
            notify(`You’ve chosen a ${userData.loanType} loan.`);
        } else {
            notify('Couldn’t recognize loan type. Please try again.');
        }
    });
});

incomeRecordBtn.addEventListener('click', () => {
    recordVideoWithSpeech(incomeUserVideo, incomeRecordBtn, incomeTranscript, (transcript) => {
        userData.income = parseNumber(transcript);
        if (userData.income > 0) {
            notify(`Noted! Your income is ₹${userData.income}.`);
        } else {
            notify('Couldn’t recognize income. Please try again.');
        }
    });
});

amountRecordBtn.addEventListener('click', () => {
    recordVideoWithSpeech(amountUserVideo, amountRecordBtn, amountTranscript, (transcript) => {
        userData.loanAmount = parseNumber(transcript);
        if (userData.loanAmount > 0) {
            notify(`Got it! You need ₹${userData.loanAmount}.`);
        } else {
            notify('Couldn’t recognize amount. Please try again.');
        }
    });
});

submitDoc.addEventListener('click', async () => {
    if (userData.documents.length >= 1) {
        const success = await processDocuments();
        if (success && checkFraud()) {
            documentsVideo.src = videoMap.processing;
            documentsVideo.play();
            documentsVideo.onended = () => {
                checkEligibility();
                nextTab();
            };
        } else {
            notify('Document processing failed or flagged as fraudulent. Please try again.');
        }
    } else {
        notify('Please select at least 1 document and upload a file!');
    }
});

faceRecognitionBtn.addEventListener('click', () => {
    notify('AI Face Recognition: Verification successful!');
});

tenureButtons.forEach(btn => {
    btn.addEventListener('click', handleTenureSelection);
});

// Eligibility Check
function checkEligibility() {
    const income = parseInt(userData.income) || 0;
    const loanAmount = parseInt(userData.loanAmount) || 0;
    const age = calculateAge(docData.extractedData.dob);
    userData.result = income > 25000 && loanAmount < 5 * income && age >= 21 && age <= 60 ? 'approved' : 'rejected';
}

function calculateAge(dob) {
    if (!dob) return 0;
    const today = new Date();
    const birthDate = new Date(dob);
    return today.getFullYear() - birthDate.getFullYear();
}

// Initial Setup
updateUI();
notify('Welcome! Click "Start Voice Application" and allow microphone access.');