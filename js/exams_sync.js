/**
 * Exams Sync - Supabase Integration
 * Handles all CRUD operations for the Yazılılar (Exams) system.
 */

const ExamsSync = {
    config: {
        baseUrl: 'https://znrlvhbuzmukznnfxpjy.supabase.co/rest/v1/exams',
        apiKey: 'sb_publishable_VQ6Eu0R0LKEMZOh9P93L0w_qR3Ylyu3'
    },

    /**
     * Fetch all exams from Supabase
     */
    async fetchAll() {
        console.log('🔄 [Exams] Syncing from Supabase...');
        try {
            const res = await fetch(this.config.baseUrl, {
                headers: {
                    'apikey': this.config.apiKey,
                    'Authorization': `Bearer ${this.config.apiKey}`
                }
            });

            if (!res.ok) throw new Error(`Supabase error: ${res.status}`);

            const data = await res.json();

            // Map Supabase columns to UI fields
            const exams = data.map(item => ({
                id: item.id,
                subject: item.subject,
                date: item.exam_date,
                lessonNumber: item.lesson_number,
                topics: Array.isArray(item.topics) ? item.topics : (item.topics ? item.topics.split(',').map(t => t.trim()) : []),
                pages: item.pages,
                scenarioNo: item.scenario_no,
                scenarioLink: item.scenario_link,
                mebSampleLink: item.meb_sample_link,
                teacherNotes: item.teacher_notes,
                category: '-' // Deprecated
            }));

            // Sort chronologically
            exams.sort((a, b) => {
                const dateDiff = new Date(a.date) - new Date(b.date);
                if (dateDiff !== 0) return dateDiff;
                return parseInt(a.lessonNumber) - parseInt(b.lessonNumber);
            });

            // Update global state in Exams page
            if (typeof window !== 'undefined') {
                const oldDataStr = JSON.stringify(window.exams || []);
                const newDataStr = JSON.stringify(exams);

                window.exams = exams;

                // Trigger UI update if changed
                if (newDataStr !== oldDataStr && typeof applyFilters === 'function') {
                    console.log('✨ [Exams] Updates detected, refreshing UI...');
                    applyFilters();
                }
            }

            return exams;
        } catch (err) {
            console.error('❌ [Exams] Fetch error:', err);
            return window.exams || [];
        }
    },

    /**
     * Add new exam
     */
    async addExam(data) {
        console.log('📤 [Exams] Adding to Supabase:', data.subject);
        try {
            const res = await fetch(this.config.baseUrl, {
                method: 'POST',
                headers: {
                    'apikey': this.config.apiKey,
                    'Authorization': `Bearer ${this.config.apiKey}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify({
                    subject: data.subject,
                    exam_date: data.date,
                    lesson_number: data.lessonNumber,
                    topics: Array.isArray(data.topics) ? data.topics.join(', ') : data.topics,
                    pages: data.pages,
                    scenario_no: data.scenarioNo,
                    scenario_link: data.scenarioLink,
                    meb_sample_link: data.mebSampleLink,
                    teacher_notes: data.teacherNotes,
                    // category removed
                })
            });

            if (!res.ok) throw new Error(`Save failed: ${await res.text()}`);

            await this.fetchAll();
            return true;
        } catch (err) {
            console.error('❌ [Exams] Add error:', err);
            throw err;
        }
    },

    /**
     * Update existing exam
     */
    async updateExam(id, data) {
        console.log('📝 [Exams] Updating in Supabase:', id);
        try {
            const res = await fetch(`${this.config.baseUrl}?id=eq.${id}`, {
                method: 'PATCH',
                headers: {
                    'apikey': this.config.apiKey,
                    'Authorization': `Bearer ${this.config.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    subject: data.subject,
                    exam_date: data.date,
                    lesson_number: data.lessonNumber,
                    topics: Array.isArray(data.topics) ? data.topics.join(', ') : data.topics,
                    pages: data.pages,
                    scenario_no: data.scenarioNo,
                    scenario_link: data.scenarioLink,
                    meb_sample_link: data.mebSampleLink,
                    teacher_notes: data.teacherNotes,
                    // category removed
                })
            });

            if (!res.ok) {
                const errorBody = await res.text();
                throw new Error(`Update failed: ${res.status} - ${errorBody}`);
            }

            await this.fetchAll();
            return true;
        } catch (err) {
            console.error('❌ [Exams] Update error:', err);
            throw err;
        }
    },

    /**
     * Delete exam
     */
    async deleteExam(id) {
        console.log('🗑️ [Exams] Deleting from Supabase:', id);
        try {
            const res = await fetch(`${this.config.baseUrl}?id=eq.${id}`, {
                method: 'DELETE',
                headers: {
                    'apikey': this.config.apiKey,
                    'Authorization': `Bearer ${this.config.apiKey}`
                }
            });

            if (!res.ok) throw new Error(`Delete failed: ${res.status}`);

            await this.fetchAll();
            return true;
        } catch (err) {
            console.error('❌ [Exams] Delete error:', err);
            throw err;
        }
    }
};

// Polling Engine - DISABLED to save Supabase quota
// Data will only sync on page load/refresh
function initExamsPolling() {
    // DISABLED: Automatic polling every 10 seconds
    // setInterval(() => {
    //     if (typeof ExamsSync !== 'undefined') {
    //         ExamsSync.fetchAll();
    //     }
    // }, 10000);
    console.log("⚠️ Exams Auto-Sync DISABLED (saves quota, refresh page to sync)");
}

window.ExamsSync = ExamsSync;
initExamsPolling();

