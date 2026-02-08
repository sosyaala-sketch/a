/**
 * Notebooks Sync - Supabase Integration
 * Handles all CRUD operations for the AI Notebooks system.
 * 
 * OPTIMIZED: Uses localStorage caching (5 min validity) and Optimistic UI updates
 * to minimize Supabase quota usage.
 */

const NotebooksSync = {
    config: {
        baseUrl: 'https://znrlvhbuzmukznnfxpjy.supabase.co/rest/v1/notebooks',
        apiKey: 'sb_publishable_VQ6Eu0R0LKEMZOh9P93L0w_qR3Ylyu3',
        cacheKey: 'notebooks_cache',
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
     * Fetch all notebooks from Supabase
     * Uses Cache-First strategy
     */
    async fetchAll(forceRefresh = false) {
        // 1. Check Cache
        if (!forceRefresh) {
            const cachedData = this.getLocalData();
            if (cachedData) {
                console.log('⚡ [Notebooks] Served from Cache');
                return cachedData;
            }
        }

        console.log('🔄 [Notebooks] Syncing from Supabase...');
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
            const notebooks = data.map(item => ({
                id: item.id,
                title: item.title,
                description: item.description || '',
                link: item.link,
                date: item.created_at
            }));

            // Sort by creation date
            notebooks.sort((a, b) => new Date(a.date) - new Date(b.date));

            console.log(`✅ [Notebooks] Fetched ${notebooks.length} notebooks`);

            // 2. Update Cache
            this.saveLocalData(notebooks);

            return notebooks;
        } catch (err) {
            console.error('❌ [Notebooks] Fetch error:', err);
            // Fallback to cache even if expired
            const cached = localStorage.getItem(this.config.cacheKey);
            return cached ? JSON.parse(cached).data : [];
        }
    },

    /**
     * Add new notebook
     * Optimistic Update: Updates local cache immediately
     */
    async addNotebook(data) {
        console.log('📤 [Notebooks] Adding to Supabase:', data.title);
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
                    title: data.title,
                    description: data.description || '',
                    link: data.link
                })
            });

            if (!res.ok) {
                const errorText = await res.text();
                throw new Error(`Save failed: ${errorText}`);
            }

            const result = await res.json();
            const newItem = {
                id: result[0].id,
                title: result[0].title,
                description: result[0].description || '',
                link: result[0].link,
                date: result[0].created_at
            };

            // OPTIMISTIC UPDATE
            const currentList = this.getLocalData() || [];
            currentList.push(newItem);
            currentList.sort((a, b) => new Date(a.date) - new Date(b.date));
            this.saveLocalData(currentList);

            console.log('✅ [Notebooks] Added successfully');
            return newItem;
        } catch (err) {
            console.error('❌ [Notebooks] Add error:', err);
            throw err;
        }
    },

    /**
     * Update existing notebook
     * Optimistic Update: Updates local cache immediately
     */
    async updateNotebook(id, data) {
        console.log('📝 [Notebooks] Updating in Supabase:', id);
        try {
            const res = await fetch(`${this.config.baseUrl}?id=eq.${id}`, {
                method: 'PATCH',
                headers: {
                    'apikey': this.config.apiKey,
                    'Authorization': `Bearer ${this.config.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    title: data.title,
                    description: data.description || '',
                    link: data.link
                })
            });

            if (!res.ok) {
                const errorBody = await res.text();
                throw new Error(`Update failed: ${res.status} - ${errorBody}`);
            }

            // OPTIMISTIC UPDATE
            const currentList = this.getLocalData() || [];
            const index = currentList.findIndex(i => i.id === id);
            if (index !== -1) {
                currentList[index] = { ...currentList[index], ...data };
                this.saveLocalData(currentList);
            }

            console.log('✅ [Notebooks] Updated successfully');
            return true;
        } catch (err) {
            console.error('❌ [Notebooks] Update error:', err);
            throw err;
        }
    },

    /**
     * Delete notebook
     * Optimistic Update: Updates local cache immediately
     */
    async deleteNotebook(id) {
        console.log('🗑️ [Notebooks] Deleting from Supabase:', id);
        try {
            const res = await fetch(`${this.config.baseUrl}?id=eq.${id}`, {
                method: 'DELETE',
                headers: {
                    'apikey': this.config.apiKey,
                    'Authorization': `Bearer ${this.config.apiKey}`
                }
            });

            if (!res.ok) throw new Error(`Delete failed: ${res.status}`);

            // OPTIMISTIC UPDATE
            const currentList = this.getLocalData() || [];
            const updatedList = currentList.filter(i => i.id !== id);
            this.saveLocalData(updatedList);

            console.log('✅ [Notebooks] Deleted successfully');
            return true;
        } catch (err) {
            console.error('❌ [Notebooks] Delete error:', err);
            throw err;
        }
    }
};

// Export to global scope
window.NotebooksSync = NotebooksSync;

// Initial load (will use cache if available)
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => NotebooksSync.fetchAll());
} else {
    NotebooksSync.fetchAll();
}
