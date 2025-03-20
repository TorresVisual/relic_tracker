// Register Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(registration => {
                console.log('ServiceWorker registration successful');
            })
            .catch(err => {
                console.log('ServiceWorker registration failed: ', err);
            });
    });
}

// Predefined boxes and relic contents
const BOXES = {
    "UR Relic Shard Choice Chest": ["Swelling Earth Shard", "Eastern Emperor Bell Shard", "Zhurong's Halberd Shard", "Pangu's Banner Shard", "Azure Lotus Shard"],
    "Brawl Relic Choice Chest": ["Zhurong's Halberd Shard", "Temporal Insight Shard"],
    "Siege Relic Choice Chest": ["Pangu's Banner Shard", "Primordial Charm Shard"],
    "Merchant Relic Choice Chest": ["Celestial Goldenscale Boat Shard", "Terrain Chronicles Shard"],
    "Trove Neidan Choice Chest": ["Zhen Thunder Shard", "Li Fire Shard"],
    "Penglai Collection Choice Chest": ["Azure Lotus Shard", "Sovereign Blade Shard", "Fuxi's Bagua Jade Shard"],
    "Samsara Relic Choice Chest": ["Nirvana Lamp Shard", "Fusang Retreat Shard"],
    "Siege Stash Choice Chest": ["Pangu's Banner Shard", "Primordial Charm Shard", "Di Jun Cosmic Jade Shard"],
    "Merchant Stash Choice Chest": ["Celestial Goldenscale Boat Shard", "Terrain Chronicles Shard", "Wandering Immortal Sword Shard"],
    "Brawl Stash Choice Chest": ["Zhurong's Halberd Shard", "Temporal Insight Shard", "Infinite Expanse Pestle Shard"],
    "Scuffle Stash Choice Chest": ["Eastern Emperor Bell Shard", "Sunslayer Shard", "Phoenix Gold Crown Shard"],
    "Triple Trove Neidan Chest": ["Zhen Thunder Shard", "Li Fire Shard", "Xun Wind Shard"]
};

// Initialize data from localStorage or create new data structure
let relicData = JSON.parse(localStorage.getItem('relicData')) || {
    shards: {},
    unlockedRelics: {},
    availableChests: []
};

// Ensure the data structure is complete
if (!relicData.availableChests) {
    relicData.availableChests = [];
}
if (!relicData.shards) {
    relicData.shards = {};
}
if (!relicData.unlockedRelics) {
    relicData.unlockedRelics = {};
}

// Wait for DOM to be fully loaded before initializing
document.addEventListener('DOMContentLoaded', () => {
    // Initialize DOM Elements
    window.addChestBtn = document.getElementById('addChestBtn');
    window.viewProgressBtn = document.getElementById('viewProgressBtn');
    window.editShardsBtn = document.getElementById('editShardsBtn');
    window.manageChestsBtn = document.getElementById('manageChestsBtn');
    window.manageUnlockedBtn = document.getElementById('manageUnlockedBtn');
    window.progressDisplay = document.getElementById('progressDisplay');
    window.progressList = document.getElementById('progressList');
    window.chestModal = document.getElementById('chestModal');
    window.relicModal = document.getElementById('relicModal');
    window.chestList = document.getElementById('chestList');
    window.relicList = document.getElementById('relicList');

    // Initialize progress display
    if (window.progressDisplay) {
        window.progressDisplay.classList.add('hidden');
    }

    // Add click handlers for modal close buttons
    const closeButtons = document.querySelectorAll('.modal .btn');
    closeButtons.forEach(button => {
        button.onclick = closeModal;
    });

    // Close modal when clicking outside
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
    });

    // Add event listeners
    window.addChestBtn.addEventListener('click', showChestSelection);
    window.viewProgressBtn.addEventListener('click', () => {
        if (window.progressDisplay.classList.contains('hidden')) {
            showProgress();
        } else {
            hideProgress();
        }
    });
    window.editShardsBtn.addEventListener('click', showEditShards);
    window.manageChestsBtn.addEventListener('click', showManageChests);
    window.manageUnlockedBtn.addEventListener('click', showManageUnlocked);

    // Initialize unlocked relics tracker
    updateUnlockedRelicsTracker();
});

// Utility Functions
function saveData() {
    localStorage.setItem('relicData', JSON.stringify(relicData));
}

function showModal(modal) {
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('visible');
        document.body.classList.add('modal-open');
    }
}

function closeModal() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.remove('visible');
        modal.classList.add('hidden');
    });
    document.body.classList.remove('modal-open');
}

// Chest Management
function showChestSelection() {
    const chestList = document.getElementById('chestList');
    chestList.innerHTML = ''; // Clear existing content
    
    Object.keys(BOXES).forEach(chest => {
        const div = document.createElement('div');
        div.className = 'chest-item';
        div.innerHTML = `
            <div class="chest-icon">
                <img src="./src/img/${encodeURIComponent(chest)}.png" alt="${chest}" onerror="this.src='./src/img/default-chest.png'" title="${chest}">
            </div>
            <div class="chest-actions">
                <button class="action-btn primary">Add Chest</button>
                <button class="action-btn secondary">Add Multiple</button>
            </div>
        `;
        
        // Add click handlers
        const addBtn = div.querySelector('.action-btn.primary');
        addBtn.onclick = (e) => {
            e.stopPropagation();
            addChest(chest);
            closeModal();
        };
        
        const addMultipleBtn = div.querySelector('.action-btn.secondary');
        addMultipleBtn.onclick = (e) => {
            e.stopPropagation();
            showMultipleChestInput(chest);
        };
        
        chestList.appendChild(div);
    });
    showModal(chestModal);
}

function showMultipleChestInput(chestName) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h2>Add Multiple Chests</h2>
            <div class="chest-icon" style="margin: 0 auto 20px;">
                <img src="./src/img/${encodeURIComponent(chestName)}.png" alt="${chestName}" onerror="this.src='./src/img/default-chest.png'" title="${chestName}">
            </div>
            <div class="input-group">
                <label for="chestCount">Number of ${chestName} to add:</label>
                <input type="number" id="chestCount" min="1" value="1" class="number-input">
            </div>
            <div class="modal-actions">
                <button class="btn-small confirm-btn">Add Chests</button>
                <button class="btn-small cancel-btn">Cancel</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    showModal(modal);
    
    // Add event listeners
    const confirmBtn = modal.querySelector('.confirm-btn');
    const cancelBtn = modal.querySelector('.cancel-btn');
    const input = modal.querySelector('#chestCount');
    
    confirmBtn.onclick = () => {
        const count = parseInt(input.value);
        if (!isNaN(count) && count > 0) {
            for (let i = 0; i < count; i++) {
                addChest(chestName);
            }
            showNotification(`Added ${count} ${chestName}`);
        }
        modal.remove();
        closeModal();
    };
    
    cancelBtn.onclick = () => {
        modal.remove();
    };
    
    // Close on outside click
    modal.onclick = (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    };
}

function addChest(chestName) {
    console.log('Adding chest:', chestName); // Debug log
    const chest = {
        name: chestName,
        dateAdded: new Date().toISOString(),
        notes: '',
        relics: BOXES[chestName]
    };
    
    relicData.availableChests.push(chest);
    saveData();
    console.log('Chest added:', relicData.availableChests); // Debug log
    
    // Check for potential unlocks when adding new chests
    checkPotentialUnlocks();
}

function checkPotentialUnlocks() {
    // Count total shards for each relic across all chests
    const totalShards = {};
    
    // Count existing shards
    Object.entries(relicData.shards).forEach(([relic, count]) => {
        totalShards[relic] = count;
    });
    
    // Count potential shards from chests
    relicData.availableChests.forEach(chest => {
        chest.relics.forEach(relic => {
            if (!totalShards[relic]) {
                totalShards[relic] = 0;
            }
            totalShards[relic]++;
        });
    });
    
    // Check which relics are close to or at 50 shards
    const readyToUnlock = Object.entries(totalShards)
        .filter(([relic, count]) => count >= 50 && !relicData.unlockedRelics[relic]);
    
    if (readyToUnlock.length > 0) {
        const relics = readyToUnlock.map(([relic, count]) => `${relic} (${count} total)`).join(', ');
        showNotification(`🎉 Relics ready to unlock: ${relics}`);
        
        if (confirm(`The following relics are ready to unlock: ${relics}\n\nWould you like to mark them as unlocked?`)) {
            readyToUnlock.forEach(([relic, count]) => {
                relicData.unlockedRelics[relic] = true;
                // Only deduct from existing shards, not from chests
                if (relicData.shards[relic]) {
                    relicData.shards[relic] -= 50;
                    if (relicData.shards[relic] <= 0) {
                        delete relicData.shards[relic];
                    }
                }
            });
            saveData();
            showProgress();
            showNotification('Relics marked as unlocked!');
        }
    }
}

function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Remove notification after 3 seconds
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

function showManageChests() {
    const chestList = document.getElementById('chestList');
    chestList.innerHTML = '';
    chestList.className = 'manage-view';
    
    if (relicData.availableChests.length === 0) {
        chestList.innerHTML = '<div class="no-chests">No chests available</div>';
        showModal(chestModal);
        return;
    }
    
    // Group chests by name
    const chestGroups = {};
    relicData.availableChests.forEach(chest => {
        if (!chestGroups[chest.name]) {
            chestGroups[chest.name] = {
                count: 0,
                chests: [],
                notes: new Set()
            };
        }
        chestGroups[chest.name].count++;
        chestGroups[chest.name].chests.push(chest);
        if (chest.notes) {
            chestGroups[chest.name].notes.add(chest.notes);
        }
    });
    
    // Display grouped chests
    Object.entries(chestGroups).forEach(([chestName, group]) => {
        const div = document.createElement('div');
        div.className = 'chest-item';
        div.innerHTML = `
            <div class="chest-header">
                <h3>${chestName}</h3>
                <span class="chest-count">x${group.count}</span>
            </div>
            <div class="chest-relics">
                ${BOXES[chestName].map(relic => `<span class="relic-tag">${relic}</span>`).join('')}
            </div>
            <div class="chest-notes">
                <input type="text" placeholder="Add notes..." value="${Array.from(group.notes).join(', ')}" class="notes-input">
            </div>
            <div class="chest-actions">
                <button class="btn-small open-chest-btn">Open</button>
                <button class="btn-small open-multiple-btn">Open Multiple</button>
                <button class="btn-small delete delete-chest-btn">Delete All</button>
            </div>
        `;
        
        const notesInput = div.querySelector('.notes-input');
        notesInput.addEventListener('change', (e) => {
            e.stopPropagation();
            updateChestNotes(chestName, e.target.value);
        });
        
        const openBtn = div.querySelector('.open-chest-btn');
        openBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            openChest(chestName, 1);
        });
        
        const openMultipleBtn = div.querySelector('.open-multiple-btn');
        openMultipleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            showOpenMultipleInput(chestName, group.count);
        });
        
        const deleteBtn = div.querySelector('.delete-chest-btn');
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteAllChests(chestName);
        });
        
        chestList.appendChild(div);
    });
    
    showModal(chestModal);
}

function showOpenMultipleInput(chestName, maxCount) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h2>Open Multiple ${chestName}</h2>
            <div class="input-group">
                <label for="openCount">Number of chests to open (max ${maxCount}):</label>
                <input type="number" id="openCount" min="1" max="${maxCount}" value="1" class="number-input">
            </div>
            <div class="modal-actions">
                <button class="btn-small confirm-btn">Open</button>
                <button class="btn-small cancel-btn">Cancel</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    showModal(modal);
    
    const confirmBtn = modal.querySelector('.confirm-btn');
    const cancelBtn = modal.querySelector('.cancel-btn');
    const input = modal.querySelector('#openCount');
    
    confirmBtn.onclick = () => {
        const count = parseInt(input.value);
        if (!isNaN(count) && count > 0 && count <= maxCount) {
            openChest(chestName, count);
        }
        modal.remove();
    };
    
    cancelBtn.onclick = () => {
        modal.remove();
    };
    
    modal.onclick = (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    };
}

function openChest(chestName, count = 1) {
    const chests = relicData.availableChests.filter(c => c.name === chestName);
    for (let i = 0; i < count && i < chests.length; i++) {
        const index = relicData.availableChests.indexOf(chests[i]);
        relicData.availableChests.splice(index, 1);
    }
    saveData();
    closeModal();
    showRelicSelection(chestName);
}

function deleteAllChests(chestName) {
    if (confirm(`Are you sure you want to delete all ${chestName} chests?`)) {
        relicData.availableChests = relicData.availableChests.filter(c => c.name !== chestName);
        saveData();
        showManageChests();
    }
}

function updateChestNotes(chestName, notes) {
    relicData.availableChests
        .filter(c => c.name === chestName)
        .forEach(c => c.notes = notes);
    saveData();
}

function showRelicSelection(chestName) {
    relicList.innerHTML = '';
    BOXES[chestName].forEach(relic => {
        const div = document.createElement('div');
        div.className = 'relic-item';
        div.textContent = relic;
        div.addEventListener('click', (e) => {
            e.stopPropagation();
            addShard(relic);
            closeModal();
        });
        relicList.appendChild(div);
    });
    showModal(relicModal);
}

function addShard(relic) {
    if (!relicData.shards[relic]) {
        relicData.shards[relic] = 0;
    }
    relicData.shards[relic]++;
    saveData();
    checkForUnlocks();
    showProgress();
}

// Progress Display
function showProgress() {
    const progressList = document.getElementById('progressList');
    const totalRelicsProgress = document.getElementById('totalRelicsProgress');
    const completedRelicsProgress = document.getElementById('completedRelicsProgress');
    const overallProgressFill = document.getElementById('overallProgressFill');
    const overallProgressText = document.getElementById('overallProgressText');
    
    progressList.innerHTML = '';
    
    // Get all unique relics from chests, shards, and unlocked relics
    const allRelics = new Set();
    
    // Add relics from chests
    relicData.availableChests.forEach(chest => {
        chest.relics.forEach(relic => allRelics.add(relic));
    });
    
    // Add relics from existing shards
    Object.keys(relicData.shards).forEach(relic => allRelics.add(relic));
    
    // Add unlocked relics
    Object.keys(relicData.unlockedRelics).forEach(relic => allRelics.add(relic));
    
    // Calculate progress for each relic
    let totalRelics = 0;
    let completedRelics = 0;
    
    allRelics.forEach(relic => {
        const isUnlocked = relicData.unlockedRelics[relic] || false;
        const currentShards = relicData.shards[relic] || 0;
        const requiredShards = 50; // Changed to 50 shards required for each relic
        
        // Count potential shards from chests
        let potentialShards = 0;
        relicData.availableChests.forEach(chest => {
            chest.relics.forEach(chestRelic => {
                if (chestRelic === relic) {
                    potentialShards++;
                }
            });
        });
        
        // Total shards is current shards plus potential shards from chests
        const totalShards = currentShards + potentialShards;
        
        // If relic is unlocked, it's 100% complete
        // Otherwise, calculate progress based on total shards
        const progress = isUnlocked ? 100 : Math.min((totalShards / requiredShards) * 100, 100);
        
        if (progress === 100) {
            completedRelics++;
        }
        totalRelics++;
        
        const div = document.createElement('div');
        div.className = 'progress-item';
        div.innerHTML = `
            <div class="progress-item-header">
                <span class="progress-item-name">${relic}${isUnlocked ? ' (Unlocked)' : ''}</span>
                <span class="progress-item-count">${isUnlocked ? 'Completed' : `${totalShards}/${requiredShards} shards (${currentShards} current + ${potentialShards} in chests)`}</span>
            </div>
            <div class="progress-item-bar">
                <div class="progress-item-fill" style="width: ${progress}%"></div>
            </div>
            <div class="progress-item-status">${Math.round(progress)}% Complete</div>
        `;
        progressList.appendChild(div);
    });
    
    // Update statistics
    totalRelicsProgress.textContent = totalRelics;
    completedRelicsProgress.textContent = completedRelics;
    
    // Update overall progress
    const overallProgress = totalRelics > 0 ? (completedRelics / totalRelics) * 100 : 0;
    overallProgressFill.style.width = `${overallProgress}%`;
    overallProgressText.textContent = `${Math.round(overallProgress)}% Complete`;
    
    progressDisplay.classList.remove('hidden');
}

function hideProgress() {
    if (window.progressDisplay) {
        window.progressDisplay.classList.add('hidden');
    }
}

// Unlocked Relics Management
function showManageUnlocked() {
    relicList.innerHTML = '';
    Object.keys(relicData.unlockedRelics).forEach(relic => {
        const div = document.createElement('div');
        div.className = 'relic-item';
        div.textContent = `${relic} (Unlocked)`;
        div.addEventListener('click', () => removeUnlockedRelic(relic));
        relicList.appendChild(div);
    });
    const addNewDiv = document.createElement('div');
    addNewDiv.className = 'relic-item';
    addNewDiv.textContent = 'Add Unlocked Relic';
    addNewDiv.addEventListener('click', () => addUnlockedRelic());
    relicList.appendChild(addNewDiv);
    showModal(relicModal);
}

function addUnlockedRelic() {
    closeModal();
    relicList.innerHTML = '';
    const allRelics = new Set();
    Object.values(BOXES).forEach(relics => {
        relics.forEach(relic => allRelics.add(relic));
    });
    Array.from(allRelics).sort().forEach(relic => {
        const div = document.createElement('div');
        div.className = 'relic-item';
        div.textContent = relic;
        div.addEventListener('click', () => {
            relicData.unlockedRelics[relic] = true;
            saveData();
            closeModal();
            updateUnlockedRelicsTracker();
        });
        relicList.appendChild(div);
    });
    showModal(relicModal);
}

function removeUnlockedRelic(relic) {
    if (confirm(`Are you sure you want to mark ${relic} as locked again?`)) {
        delete relicData.unlockedRelics[relic];
        saveData();
        showManageUnlocked();
        updateUnlockedRelicsTracker();
    }
}

// Shard Management
function showEditShards() {
    relicList.innerHTML = '';
    Object.entries(relicData.shards).forEach(([relic, count]) => {
        const div = document.createElement('div');
        div.className = 'relic-item';
        div.textContent = `${relic}: ${count}`;
        div.addEventListener('click', () => editShardCount(relic));
        relicList.appendChild(div);
    });
    showModal(relicModal);
}

function editShardCount(relic) {
    const newCount = prompt(`Enter new shard count for ${relic}:`, relicData.shards[relic]);
    if (newCount !== null) {
        const count = parseInt(newCount);
        if (!isNaN(count)) {
            if (count <= 0) {
                delete relicData.shards[relic];
            } else {
                relicData.shards[relic] = count;
            }
            saveData();
            showProgress();
        }
    }
    closeModal();
}

// Unlock Checking
function checkForUnlocks() {
    const readyToUnlock = Object.entries(relicData.shards)
        .filter(([relic, count]) => count >= 50 && !relicData.unlockedRelics[relic]);
    
    if (readyToUnlock.length > 0) {
        const relics = readyToUnlock.map(([relic]) => relic).join(', ');
        showNotification(`🎉 Relics ready to unlock: ${relics}`);
        
        if (confirm(`The following relics are ready to unlock: ${relics}\n\nWould you like to mark them as unlocked?`)) {
            readyToUnlock.forEach(([relic, count]) => {
                relicData.unlockedRelics[relic] = true;
                relicData.shards[relic] -= 50;
                if (relicData.shards[relic] <= 0) {
                    delete relicData.shards[relic];
                }
            });
            saveData();
            showProgress();
            updateUnlockedRelicsTracker();
            showNotification('Relics marked as unlocked!');
        }
    }
}

// Add this function to update the unlocked relics tracker
function updateUnlockedRelicsTracker() {
    const unlockedList = document.getElementById('unlockedList');
    const unlockedCount = document.getElementById('unlockedCount');
    
    // Update count
    const count = Object.keys(relicData.unlockedRelics).length;
    unlockedCount.textContent = count;
    
    // Update list
    unlockedList.innerHTML = '';
    
    if (count === 0) {
        unlockedList.innerHTML = '<div class="unlocked-relic-item">No relics unlocked yet</div>';
        return;
    }
    
    Object.keys(relicData.unlockedRelics).sort().forEach(relic => {
        const div = document.createElement('div');
        div.className = 'unlocked-relic-item';
        div.innerHTML = `
            <span class="material-icons">check_circle</span>
            ${relic}
        `;
        unlockedList.appendChild(div);
    });
} 