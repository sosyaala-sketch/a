/**
 * Homework Sync V2 - Clean Architecture
 * Single source of truth: GitHub
 * No local caching, no merge conflicts
 * 
 * OPTIMIZED: Uses localStorage caching (5 min validity) and Optimistic UI updates
 * to minimize Supabase quota usage.
 */

const HomeworkSyncV2 = {
    config: {
        baseUrl: 'https://znrlvhbuzmukznnfxpjy.supabase.co/rest/v1/homeworks',
        apiKey: 'sb_publishable_VQ6Eu0R0LKEMZOh9P93L0w_qR3Ylyu3',
        cacheKey: 'homework_v2_cache',
        cacheDuration: 5 * 60 * 1000 // 5 minutes
    },

    /**
     * Helper: Get data from local storage if valid
     */
    getLocalData() {
        try {
            const cached = localStorage.getItem(this.config.cacheKey);
            if (!cached) return null;

            const { data, timestamp } = JSON.parse(cached);
            if (Date.now() - timestamp < this.config.cacheDuration) {
                return data;
            }
            return null; // Expired
        } catch (e) {
            return null;
        }
    },

    /**
     * Helper: Save data to local storage
     */
    saveLocalData(data) {
        localStorage.setItem(this.config.cacheKey, JSON.stringify({
            data: data,
            timestamp: Date.now()
        }));
    },

    /**
     * Helper: Update UI
     */
    updateUI(homeworks) {
        window.homeworkList = homeworks;

        if (typeof renderHomeworkCards === 'function') {
            renderHomeworkCards();
        }
        if (typeof renderMobileHomeworkList === 'function') {
            renderMobileHomeworkList();
        }

        const countEl = document.getElementById('mobileHwCount');
        if (countEl && homeworks.length > 0) {
            countEl.textContent = homeworks.length;
        }
    },

    /**
     * Fetch all homeworks directly from Supabase REST API
     * Uses Cache-First strategy
     */
    async fetchAll(forceRefresh = false) {
        // 1. Check Cache
        if (!forceRefresh) {
            const cachedData = this.getLocalData();
            if (cachedData) {
                console.log('⚡ [V2] Served from Cache');
                this.updateUI(cachedData); // Ensure UI matches cache
                return cachedData;
            }
        }

        console.log('🔄 [V2] Fetching all homeworks from Supabase...');

        try {
            const res = await fetch(this.config.baseUrl, {
                headers: {
                    'apikey': this.config.apiKey,
                    'Authorization': `Bearer ${this.config.apiKey}`
                }
            });

            if (!res.ok) {
                throw new Error(`Supabase API error: ${res.status}`);
            }

            const data = await res.json();

            // Map Supabase columns back to frontend fields
            const homeworks = data.map(item => ({
                id: item.id,
                subject: item.title,
                description: item.description,
                lesson: item.lesson,
                givenDate: item.assigned_date,
                dueDate: item.due_date,
                createdAt: item.created_at ? new Date(item.created_at).getTime() : Date.now()
            }));

            console.log(`📁 [V2] Found ${homeworks.length} homeworks`);

            // Sort by due date
            homeworks.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

            // Update Cache & UI
            this.saveLocalData(homeworks);
            this.updateUI(homeworks);

            return homeworks;

        } catch (err) {
            console.error('❌ [V2] Fetch error:', err);
            // Fallback to cache even if expired
            const cached = this.getLocalData(); // Reuse logic or fetch raw if willing to accept expired
            const fallback = cached || window.homeworkList || [];
            this.updateUI(fallback);
            return fallback;
        }
    },

    /**
     * Add new homework directly to Supabase
     * Optimistic Update
     */
    async addHomework(data) {
        console.log('📤 [V2] Adding homework to Supabase:', data.subject);

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
                    title: data.subject.toUpperCase(),
                    description: data.description,
                    lesson: data.lesson,
                    assigned_date: data.givenDate,
                    due_date: data.dueDate
                })
            });

            if (!res.ok) {
                const errorText = await res.text();
                throw new Error(`Upload failed: ${res.status} - ${errorText}`);
            }

            const result = await res.json();
            console.log('✅ [V2] Homework added successfully');

            // Construct new item from result
            const newItem = {
                id: result[0].id,
                subject: result[0].title,
                description: result[0].description,
                lesson: result[0].lesson,
                givenDate: result[0].assigned_date,
                dueDate: result[0].due_date,
                createdAt: result[0].created_at ? new Date(result[0].created_at).getTime() : Date.now()
            };

            // OPTIMISTIC UPDATE
            const currentList = this.getLocalData() || [];
            currentList.push(newItem);
            currentList.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate)); // Keep sorted

            this.saveLocalData(currentList);
            this.updateUI(currentList);

            return result[0];

        } catch (err) {
            console.error('❌ [V2] Add error:', err);
            throw err;
        }
    },

    /**
     * Delete homework directly from Supabase
     * Optimistic Update
     */
    async deleteHomework(id) {
        console.log('🗑️ [V2] Deleting homework from Supabase:', id);

        try {
            const res = await fetch(`${this.config.baseUrl}?id=eq.${id}`, {
                method: 'DELETE',
                headers: {
                    'apikey': this.config.apiKey,
                    'Authorization': `Bearer ${this.config.apiKey}`
                }
            });

            if (!res.ok) {
                throw new Error(`Delete failed: ${res.status}`);
            }

            console.log('✅ [V2] Homework deleted successfully');

            // OPTIMISTIC UPDATE
            const currentList = this.getLocalData() || [];
            const updatedList = currentList.filter(i => i.id !== id);

            this.saveLocalData(updatedList);
            this.updateUI(updatedList);

            return true;
        } catch (err) {
            console.error('❌ [V2] Delete error:', err);
            throw err;
        }
    },

    /**
     * Update existing homework in Supabase
     * Optimistic Update
     */
    async updateHomework(id, data) {
        console.log('📝 [V2] Updating homework in Supabase:', id);

        try {
            const res = await fetch(`${this.config.baseUrl}?id=eq.${id}`, {
                method: 'PATCH',
                headers: {
                    'apikey': this.config.apiKey,
                    'Authorization': `Bearer ${this.config.apiKey}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify({
                    title: data.subject.toUpperCase(),
                    description: data.description,
                    lesson: data.lesson,
                    assigned_date: data.givenDate,
                    due_date: data.dueDate
                })
            });

            if (!res.ok) {
                const errorText = await res.text();
                throw new Error(`Update failed: ${res.status} - ${errorText}`);
            }

            console.log('✅ [V2] Homework updated successfully');

            // OPTIMISTIC UPDATE
            const currentList = this.getLocalData() || [];
            const index = currentList.findIndex(i => i.id === id);

            if (index !== -1) {
                currentList[index] = {
                    ...currentList[index],
                    subject: data.subject.toUpperCase(),
                    description: data.description,
                    lesson: data.lesson,
                    givenDate: data.givenDate,
                    dueDate: data.dueDate
                };

                // Re-sort might be needed if due date changed
                currentList.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

                this.saveLocalData(currentList);
                this.updateUI(currentList);
            }

            return true;

        } catch (err) {
            console.error('❌ [V2] Update error:', err);
            throw err;
        }
    }
};

// Auto-fetch on page load
if (typeof window !== 'undefined') {
    window.HomeworkSyncV2 = HomeworkSyncV2;

    // Fetch homeworks when page loads
    document.addEventListener('DOMContentLoaded', async () => {
        console.log('🚀 [V2] Initializing homework system...');
        await HomeworkSyncV2.fetchAll();
    });
}
