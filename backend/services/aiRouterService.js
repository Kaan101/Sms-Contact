// backend/services/aiRouterService.js

function performAiAnalysis(rawText) {
    const text = (rawText || "").toLowerCase().trim();
    
    // 1. Aciliyet Tespiti
    const urgentKeywords = ["acil", "hemen", "kritik", "su basması", "kilitli kaldı", "yangın"];
    const isUrgent = urgentKeywords.some(keyword => text.includes(keyword));

    // 2. Kayıt Türü Tespiti (Talep vs Bildirim)
    const notificationKeywords = ["bilgi", "duyuru", "şikayet", "durum"];
    const isNotification = notificationKeywords.some(keyword => text.includes(keyword));
    const requestType = isNotification ? "BILDIRIM" : "TALEP";

    // 3. Etiket (Lookup Tags) Tespiti
    const categoryMapping = {
        "daire": "emlak",
        "kiralık": "konut",
        "tamirat": "teknik_servis",
        "su": "tesisat",
        "elektrik": "elektrik",
        "temizlik": "temizlik",
        "nakliye": "nakliye"
    };

    const detectedTags = [];
    for (const [keyword, tag] of Object.entries(category_mapping)) {
        if (text.includes(keyword) && !detectedTags.includes(tag)) {
            detectedTags.push(tag);
        }
    }

    if (detectedTags.length === 0) {
        detectedTags.push("genel_hizmet");
    }

    return {
        isUrgent,
        requestType,
        tags: detectedTags
    };
}

module.exports = { performAiAnalysis };