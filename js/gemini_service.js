/**
 * Groq Service (SENA)
 * Handles communication with Groq API (Llama 3 Engine)
 */

const GeminiService = {
    config: {
        apiKey: '', // BURAYA KENDİ GROQ API ANAHTARINIZI EKLEYİN
        model: 'llama-3.3-70b-versatile',
        baseUrl: 'https://api.groq.com/openai/v1/chat/completions'
    },

    STORAGE_KEYS: {
        ADMIN_NOTE: 'ai_instant_context',
        CHAT_HISTORY: 'ai_chat_history'
    },

    async getSystemInstruction() {
        // 1. Admin Instant Note (Top Priority)
        const adminNote = localStorage.getItem(this.STORAGE_KEYS.ADMIN_NOTE) || "Özel bir durum yok.";

        let homeworks = [];
        let exams = [];

        try {
            // Check if dependencies exist before calling
            if (typeof window.HomeworkSyncV2 !== 'undefined') {
                const allHw = await window.HomeworkSyncV2.fetchAll().catch(() => []);
                const now = Date.now();
                const next5Days = now + (5 * 24 * 60 * 60 * 1000);
                homeworks = allHw.filter(h => {
                    const d = new Date(h.dueDate).getTime();
                    return d >= now && d <= next5Days;
                }).slice(0, 5).map(h => `${h.subject}: ${h.description}`);
            }

            if (typeof window.ExamsSync !== 'undefined') {
                const allExams = await window.ExamsSync.fetchAll().catch(() => []);
                exams = allExams.slice(0, 5).map(e => `${e.subject} (${e.date})`);
            }
        } catch (e) {
            console.warn("Ctx Fetch Error (SENA can still work):", e);
        }

        return `
Sen "SENA". 9A sınıfının **akıllı ve donanımlı** akademik asistanısın.
Adın SENA.
Görevin: Öğrencilere sadece bilgi vermek değil, onların başarısını artırmak için **stratejik tavsiyeler** sunmak.

TON & KİŞİLİK:
- **MÜMKÜN OLDUĞUNCA KISA CEVAP VER.** Uzun paragraflar yasak. Nokta atışı yap.
- **ASLA İNGİLİZCE KONUŞMA.** Sadece Türkçe. "SENA here" gibi girişler KESİNLİKLE YASAK.
- **Zeki ve Çözüm Odaklı Ol:** Sorunun köküne in ve en mantıklı yolu **tek cümleyle** göster.
- **Nazik ve Profesyonel:** "Kanka" kullanma. Düzgün, akıcı ve güven veren bir Türkçe konuş.
- **Proaktif Ol:** Sadece gerekliyse ek bilgi ver.

CANLI VERİLER (Senin Hafızan):
1. YÖNETİCİ NOTU: "${adminNote}"
2. YAKLAŞAN ÖDEVLER: ${homeworks.length ? homeworks.join(', ') : 'Acil ödev yok.'}
3. SINAVLAR: ${exams.length ? exams.join(', ') : 'Yakın sınav yok.'}

Eğer veri yoksa "Bilgim yok" de ve geç. Asla lafı uzatma.
        `.trim();
    },

    async chat(userMessage, history = []) {
        console.log("⚡ SENA (Groq) Düşünüyor...");

        try {
            const sysPrompt = await this.getSystemInstruction();

            // OpenAI / Groq Format
            const messages = [
                { role: "system", content: sysPrompt },
                ...history, // Previous history if any
                { role: "user", content: userMessage }
            ];

            const response = await fetch(this.config.baseUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.config.apiKey}`
                },
                body: JSON.stringify({
                    model: this.config.model,
                    messages: messages,
                    temperature: 0.7,
                    max_tokens: 1024
                })
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                console.error("Groq API Hatası:", errData);
                throw new Error(errData.error?.message || `API Hatası: ${response.status}`);
            }

            const data = await response.json();

            if (!data.choices || !data.choices.length) {
                throw new Error("Boş cevap döndü.");
            }

            return data.choices[0].message.content;

        } catch (error) {
            console.error("❌ SENA Hata:", error);
            return `Bağlantı sorunu oluştu: ${error.message}`;
        }
    },

    setAdminContext(text) {
        localStorage.setItem(this.STORAGE_KEYS.ADMIN_NOTE, text);
    },

    getAdminContext() {
        return localStorage.getItem(this.STORAGE_KEYS.ADMIN_NOTE) || "";
    }
};

window.GeminiService = GeminiService;
