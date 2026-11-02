// backend/services/requestStateMachine.js

const { performAiAnalysis } = require('./aiRouterService');

/**
 * Aşama 1.2: Task Context (Görev Bağlamı) Oluşturucu
 */
function enrichTaskContext(reqBody) {
    const rawText = reqBody.rawText || "";
    const aiAnalysis = performAiAnalysis(rawText);

    // Tek bir "Task Context" objesi altında birleştirme
    const taskContext = {
        rawText: rawText,
        location: reqBody.location || "İstanbul, Türkiye",
        contactValue: reqBody.contactValue,
        preferredChannel: reqBody.preferredChannel || "PHONE, SMS, WHATSAPP",
        intent: aiAnalysis.intent || "SERVICE_REQUEST",
        requestType: reqBody.requestType || aiAnalysis.requestType,
        isUrgent: reqBody.isUrgent !== undefined ? reqBody.isUrgent : aiAnalysis.isUrgent,
        tags: aiAnalysis.tags,
        createdAt: new Date().toISOString()
    };

    return taskContext;
}

/**
 * Aşama 1.3: Durum Makinesi (State Machine) Sıkılaştırma ve Doğrulayıcı
 * Geçerli geçişler: POOL -> MATCHED -> ACCEPTED -> COMPLETED
 * İptal (CANCELLED) her aşamadan yapılabilir.
 */
const VALID_TRANSITIONS = {
    'POOL': ['MATCHED', 'CANCELLED', 'PROVIDER_SKIPPED'],
    'MATCHED': ['ACCEPTED', 'CANCELLED', 'POOL', 'PROVIDER_SKIPPED'],
    'ACCEPTED': ['PROVIDER_COMPLETED', 'COMPLETED', 'CANCELLED'],
    'PROVIDER_COMPLETED': ['COMPLETED', 'CANCELLED'],
    'PROVIDER_SKIPPED': ['POOL', 'MATCHED', 'CANCELLED'],
    'CANCELLED': []
};

function validateStateTransition(currentState, targetState) {
    const current = (currentState || 'POOL').toUpperCase();
    const target = (targetState || '').toUpperCase();

    const allowedNextStates = VALID_TRANSITIONS[current];

    if (!allowedNextStates) {
        return { isValid: false, message: `Geçersiz başlangıç durumu: ${current}` };
    }

    if (!allowedNextStates.includes(target)) {
        return { 
            isValid: false, 
            message: `Durum geçişi reddedildi! "${current}" durumundan "${target}" durumuna geçilemez.` 
        };
    }

    return { isValid: true };
}

module.exports = { enrichTaskContext, validateStateTransition };