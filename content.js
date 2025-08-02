// Auto Scroll Marker - Content Script
(function() {
    'use strict';
    
    const STORAGE_KEY_PREFIX = 'scroll_pos_';
    const SAVE_INTERVAL = 2000; // Save every 2 seconds
    const SCROLL_DELAY = 500; // Wait 500ms before restoring scroll
    
    let saveTimer;
    let isRestoring = false;
    
    // Get unique key for current page
    function getStorageKey() {
        return STORAGE_KEY_PREFIX + window.location.href;
    }
    
    // Save current scroll position
    function saveScrollPosition() {
        if (isRestoring) return; // Don't save while restoring
        
        const scrollData = {
            x: window.pageXOffset || document.documentElement.scrollLeft,
            y: window.pageYOffset || document.documentElement.scrollTop,
            timestamp: Date.now()
        };
        
        const key = getStorageKey();
        
        // Use Chrome storage API
        chrome.storage.local.set({
            [key]: scrollData
        }).catch(error => {
            console.log('Auto Scroll Marker: Error saving scroll position:', error);
        });
    }
    
    // Restore scroll position
    function restoreScrollPosition() {
        const key = getStorageKey();
        
        chrome.storage.local.get([key]).then(result => {
            const scrollData = result[key];
            
            if (scrollData && scrollData.x !== undefined && scrollData.y !== undefined) {
                isRestoring = true;
                
                // Smooth scroll to saved position
                window.scrollTo({
                    left: scrollData.x,
                    top: scrollData.y,
                    behavior: 'smooth'
                });
                
                // Reset restoring flag after scroll completes
                setTimeout(() => {
                    isRestoring = false;
                }, 1000);
                
                console.log(`Auto Scroll Marker: Restored scroll position (${scrollData.x}, ${scrollData.y})`);
            }
        }).catch(error => {
            console.log('Auto Scroll Marker: Error restoring scroll position:', error);
        });
    }
    
    // Throttled scroll handler
    function handleScroll() {
        if (isRestoring) return;
        
        clearTimeout(saveTimer);
        saveTimer = setTimeout(saveScrollPosition, SAVE_INTERVAL);
    }
    
    // Initialize extension
    function init() {
        // Wait for page to be fully loaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
            return;
        }
        
        // Restore scroll position after a short delay
        setTimeout(restoreScrollPosition, SCROLL_DELAY);
        
        // Set up scroll listener
        window.addEventListener('scroll', handleScroll, { passive: true });
        
        // Save position when page is about to unload
        window.addEventListener('beforeunload', saveScrollPosition);
        
        console.log('Auto Scroll Marker: Initialized for', window.location.href);
    }
    
    // Start the extension
    init();
})();