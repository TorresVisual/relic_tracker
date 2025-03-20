// Register Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
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
    window.onclick = function(event) {
        if (event.target.classList.contains('modal')) {
            closeModal();
        }
    };

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
});

// Utility Functions
function saveData() {
    localStorage.setItem('relicData', JSON.stringify(relicData));
}

function showModal(modal) {
    if (modal) {
        modal.style.display = 'block';
        modal.classList.remove('hidden');
    }
}

function closeModal() {
    if (chestModal) {
        chestModal.style.display = 'none';
        chestModal.classList.add('hidden');
    }
    if (relicModal) {
        relicModal.style.display = 'none';
        relicModal.classList.add('hidden');
    }
}

// Chest Management
function showChestSelection() {
    chestList.innerHTML = '';
    Object.keys(BOXES).forEach(chest => {
        const div = document.createElement('div');
        div.className = 'chest-item';
        div.innerHTML = `
            <div class="chest-name">${chest}</div>
            <div class="chest-actions">
                <button class="btn-small add-chest-btn">Add Chest</button>
                <button class="btn-small add-multiple-btn">Add Multiple</button>
            </div>
        `;
        
        // Add click handlers
        const addBtn = div.querySelector('.add-chest-btn');
        addBtn.onclick = () => {
            addChest(chest);
            closeModal();
        };
        
        const addMultipleBtn = div.querySelector('.add-multiple-btn');
        addMultipleBtn.onclick = () => {
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
            <h2>Add Multiple ${chestName}</h2>
            <div class="input-group">
                <label for="chestCount">Number of chests:</label>
                <input type="number" id="chestCount" min="1" value="1" class="number-input">
            </div>
            <div class="modal-actions">
                <button class="btn-small confirm-btn">Add</button>
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
    chestList.innerHTML = '';
    
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
                <button class="btn-small open-chest-btn">Open 1</button>
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
    if (window.progressDisplay) {
        window.progressDisplay.classList.remove('hidden');
        updateProgressDisplay();
    }
}

function hideProgress() {
    if (window.progressDisplay) {
        window.progressDisplay.classList.add('hidden');
    }
}

function updateProgressDisplay() {
    if (!window.progressList) return;
    
    window.progressList.innerHTML = '';
    
    // Calculate total shards for each relic
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
    
    // If no relics have any shards, show a message
    if (Object.keys(totalShards).length === 0) {
        window.progressList.innerHTML = '<div class="no-relics">No relics tracked yet. Add some chests or shards to see progress.</div>';
        return;
    }
    
    // Display progress for each relic
    Object.entries(totalShards).forEach(([relic, count]) => {
        const percentage = (count / 50 * 100).toFixed(1);
        const isUnlocked = relicData.unlockedRelics[relic];
        const existingShards = relicData.shards[relic] || 0;
        const chestShards = count - existingShards;
        
        const div = document.createElement('div');
        div.className = 'progress-item';
        div.innerHTML = `
            <h3>${relic}${isUnlocked ? ' (Unlocked)' : ''}</h3>
            <p>${count}/50 shards (${percentage}%)</p>
            <p class="shard-breakdown">Existing: ${existingShards} | From Chests: ${chestShards}</p>
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${percentage}%"></div>
            </div>
        `;
        window.progressList.appendChild(div);
    });
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
            showNotification('Relics marked as unlocked!');
        }
    }
} 