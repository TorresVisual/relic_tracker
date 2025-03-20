// File storage for persistent data
const FILE_NAME = "relic_tracker.json";

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
}

// Load saved relic data or initialize
let relicData = loadRelicData();

// Initialize saved chests and unlocked relics if not exists
if (!relicData.savedChests) {
  relicData.savedChests = {};
}
if (!relicData.unlockedRelics) {
  relicData.unlockedRelics = {};
}

// Show main menu
await showMainMenu();

// Save data before exiting
saveRelicData();

async function showMainMenu() {
  let menu = new Alert();
  menu.title = "Relic Tracker";
  menu.addAction("Add New Chest");
  menu.addAction("View Relic Progress");
  menu.addAction("Edit Relic Shards");
  menu.addAction("Manage Saved Chests");
  menu.addAction("Manage Unlocked Relics");
  menu.addCancelAction("Exit");

  let choice = await menu.present();
  if (choice == 0) {
    await addNewChest();
  } else if (choice == 1) {
    await showRelicProgress();
  } else if (choice == 2) {
    await editRelicShards();
  } else if (choice == 3) {
    await manageSavedChests();
  } else if (choice == 4) {
    await manageUnlockedRelics();
  }
}

async function manageSavedChests() {
  let menu = new Alert();
  menu.title = "Saved Chests";
  
  if (Object.keys(relicData.savedChests).length === 0) {
    menu.message = "No saved chests";
    menu.addAction("OK");
    await menu.present();
    return;
  }

  Object.keys(relicData.savedChests).forEach(chest => {
    menu.addAction(`${chest} (${relicData.savedChests[chest]}x)`);
  });
  
  menu.addAction("Add New Saved Chest");
  menu.addCancelAction("Back");

  let choice = await menu.present();
  if (choice === Object.keys(relicData.savedChests).length) {
    await addNewSavedChest();
  } else if (choice >= 0) {
    await openSavedChest(Object.keys(relicData.savedChests)[choice]);
  }
}

async function addNewSavedChest() {
  let boxMenu = new Alert();
  boxMenu.title = "Select a Chest";
  let boxNames = Object.keys(BOXES);
  boxNames.forEach(box => boxMenu.addAction(box));
  boxMenu.addCancelAction("Cancel");

  let choice = await boxMenu.present();
  if (choice >= 0) {
    let selectedBox = boxNames[choice];
    let prompt = new Alert();
    prompt.title = "How many chests?";
    prompt.addTextField("Count", "1");
    prompt.addAction("OK");
    prompt.addCancelAction("Cancel");

    let result = await prompt.present();
    if (result === 0) {
      let count = parseInt(prompt.textFields[0].text, 10) || 1;
      relicData.savedChests[selectedBox] = (relicData.savedChests[selectedBox] || 0) + count;
      saveRelicData();
    }
  }
}

async function openSavedChest(chestName) {
  let menu = new Alert();
  menu.title = `Open ${chestName}`;
  menu.message = `You have ${relicData.savedChests[chestName]} saved`;
  menu.addAction("Open 1");
  menu.addAction("Open All");
  menu.addCancelAction("Cancel");

  let choice = await menu.present();
  if (choice >= 0) {
    let count = choice === 0 ? 1 : relicData.savedChests[chestName];
    relicData.savedChests[chestName] -= count;
    
    if (relicData.savedChests[chestName] <= 0) {
      delete relicData.savedChests[chestName];
    }

    // Add shards for each chest opened
    for (let i = 0; i < count; i++) {
      BOXES[chestName].forEach(relic => updateRelicShards(relic));
    }
    
    saveRelicData();
    await checkForUnlocks();
    await showRelicProgress();
  }
}

async function addNewChest() {
  let boxMenu = new Alert();
  boxMenu.title = "Select a Chest";
  let boxNames = Object.keys(BOXES);
  boxNames.forEach(box => boxMenu.addAction(box));
  boxMenu.addCancelAction("Cancel");

  let choice = await boxMenu.present();
  if (choice >= 0) {
    let selectedBox = boxNames[choice];
    let relics = BOXES[selectedBox];

    // Add all relics from the chest to inventory
    relics.forEach(relic => updateRelicShards(relic));
    
    // Check if any relics have reached 50 shards
    await checkForUnlocks();
    await showRelicProgress();
  }
}

function updateRelicShards(relic) {
  if (!relicData.shards[relic]) {
    relicData.shards[relic] = 0;
  }
  relicData.shards[relic] += 1; // Each chest contributes 1 shard per relic
}

async function showRelicProgress() {
  let progressList = Object.keys(relicData.shards)
    .map(r => {
      let progress = relicData.shards[r];
      let percentage = (progress / 50 * 100).toFixed(1);
      let status = relicData.unlockedRelics[r] ? " (Unlocked)" : "";
      return `${r}${status}:\n${progress}/50 shards (${percentage}%)\n${getProgressBar(progress)}`;
    })
    .join("\n\n");

  let alert = new Alert();
  alert.title = "Relic Progress";
  alert.message = progressList || "No relics tracked yet.";
  alert.addAction("OK");
  await alert.present();
}

function getProgressBar(progress) {
  const total = 20;
  const filled = Math.round((progress / 50) * total);
  return "█".repeat(filled) + "░".repeat(total - filled);
}

async function checkForUnlocks() {
  let readyToUnlock = Object.keys(relicData.shards).filter(r => 
    relicData.shards[r] >= 50 && !relicData.unlockedRelics[r]
  );
  
  if (readyToUnlock.length > 0) {
    let alert = new Alert();
    alert.title = "Relics Ready to Unlock!";
    alert.message = readyToUnlock.join(", ");
    alert.addAction("Mark as Unlocked");
    alert.addAction("Keep Progress");
    alert.addCancelAction("Cancel");
    
    let choice = await alert.present();
    if (choice === 0) {
      // Mark as unlocked and remove the shards
      readyToUnlock.forEach(relic => {
        relicData.unlockedRelics[relic] = true;
        relicData.shards[relic] -= 50;
        if (relicData.shards[relic] <= 0) {
          delete relicData.shards[relic];
        }
      });
      saveRelicData();
    }
  }
}

async function editRelicShards() {
  let relicNames = Object.keys(relicData.shards);
  let editMenu = new Alert();
  editMenu.title = "Edit Relic Shards";

  relicNames.forEach(relic => {
    editMenu.addAction(`${relic}: ${relicData.shards[relic]}`);
  });

  editMenu.addAction("Remove Progress");
  editMenu.addCancelAction("Cancel");
  let choice = await editMenu.present();

  if (choice >= 0 && choice < relicNames.length) {
    let selectedRelic = relicNames[choice];
    let shardInput = await promptForShards(selectedRelic);
    if (shardInput !== null) {
      relicData.shards[selectedRelic] = shardInput;
    }
    await showRelicProgress();
  } else if (choice === relicNames.length) {
    // Remove Progress option selected
    let removeMenu = new Alert();
    removeMenu.title = "Remove Progress";
    
    relicNames.forEach(relic => {
      removeMenu.addAction(`${relic}: ${relicData.shards[relic]}`);
    });
    
    removeMenu.addCancelAction("Cancel");
    let removeChoice = await removeMenu.present();
    
    if (removeChoice >= 0 && removeChoice < relicNames.length) {
      let selectedRelic = relicNames[removeChoice];
      let confirmMenu = new Alert();
      confirmMenu.title = "Confirm Removal";
      confirmMenu.message = `Are you sure you want to remove progress for ${selectedRelic}?`;
      confirmMenu.addAction("Yes, Remove");
      confirmMenu.addCancelAction("Cancel");
      
      let confirmChoice = await confirmMenu.present();
      if (confirmChoice === 0) {
        delete relicData.shards[selectedRelic];
        saveRelicData();
        await showRelicProgress();
      }
    }
  }
}

async function promptForShards(relic) {
  let prompt = new Alert();
  prompt.title = `Enter Shard Count for ${relic}`;
  prompt.addTextField("Shard count", `${relicData.shards[relic] || 0}`);
  prompt.addAction("OK");
  prompt.addCancelAction("Cancel");

  let result = await prompt.present();
  if (result === 0) {
    return parseInt(prompt.textFields[0].text, 10);
  }
  return null;
}

async function manageUnlockedRelics() {
  let menu = new Alert();
  menu.title = "Manage Unlocked Relics";
  
  if (Object.keys(relicData.unlockedRelics).length === 0) {
    menu.message = "No unlocked relics";
    menu.addAction("Add Unlocked Relic");
    menu.addAction("OK");
    menu.addCancelAction("Cancel");
    
    let choice = await menu.present();
    if (choice === 0) {
      await addUnlockedRelic();
    }
    return;
  }

  Object.keys(relicData.unlockedRelics).forEach(relic => {
    menu.addAction(`${relic} (Unlocked)`);
  });
  
  menu.addAction("Add Unlocked Relic");
  menu.addCancelAction("Back");

  let choice = await menu.present();
  if (choice === Object.keys(relicData.unlockedRelics).length) {
    await addUnlockedRelic();
  } else if (choice >= 0) {
    await removeUnlockedRelic(Object.keys(relicData.unlockedRelics)[choice]);
  }
}

async function addUnlockedRelic() {
  let menu = new Alert();
  menu.title = "Add Unlocked Relic";
  
  // Get all possible relics from all chests
  let allRelics = new Set();
  Object.values(BOXES).forEach(relics => {
    relics.forEach(relic => allRelics.add(relic));
  });
  
  // Convert to array and sort
  let relicList = Array.from(allRelics).sort();
  
  relicList.forEach(relic => {
    menu.addAction(relic);
  });
  
  menu.addCancelAction("Cancel");
  let choice = await menu.present();
  
  if (choice >= 0 && choice < relicList.length) {
    let selectedRelic = relicList[choice];
    relicData.unlockedRelics[selectedRelic] = true;
    saveRelicData();
  }
}

async function removeUnlockedRelic(relic) {
  let confirmMenu = new Alert();
  confirmMenu.title = "Confirm Removal";
  confirmMenu.message = `Are you sure you want to mark ${relic} as locked again?`;
  confirmMenu.addAction("Yes, Remove");
  confirmMenu.addCancelAction("Cancel");
  
  let choice = await confirmMenu.present();
  if (choice === 0) {
    delete relicData.unlockedRelics[relic];
    saveRelicData();
  }
}

// Data storage functions
function loadRelicData() {
  let fm = FileManager.iCloud();
  let path = fm.joinPath(fm.documentsDirectory(), FILE_NAME);
  if (fm.fileExists(path)) {
    return JSON.parse(fm.readString(path));
  }
  return { shards: {} };
}

function saveRelicData() {
  let fm = FileManager.iCloud();
  let path = fm.joinPath(fm.documentsDirectory(), FILE_NAME);
  fm.writeString(path, JSON.stringify(relicData));
}
