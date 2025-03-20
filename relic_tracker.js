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
  menu.addCancelAction("Exit");

  let choice = await menu.present();
  if (choice == 0) {
    await addNewChest();
  } else if (choice == 1) {
    await showRelicProgress();
  } else if (choice == 2) {
    await editRelicShards();
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
    .map(r => `${r}: ${relicData.shards[r]}/50 shards`)
    .join("\n");

  let alert = new Alert();
  alert.title = "Relic Progress";
  alert.message = progressList || "No relics tracked yet.";
  alert.addAction("OK");
  await alert.present();

  await checkForUnlocks();
}

async function checkForUnlocks() {
  let unlocked = Object.keys(relicData.shards).filter(r => relicData.shards[r] >= 50);
  if (unlocked.length > 0) {
    let alert = new Alert();
    alert.title = "Relics Unlocked!";
    alert.message = unlocked.join(", ");
    alert.addAction("OK");
    await alert.present();
  }
}

async function editRelicShards() {
  let relicNames = Object.keys(relicData.shards);
  let editMenu = new Alert();
  editMenu.title = "Edit Relic Shards";

  relicNames.forEach(relic => {
    editMenu.addAction(`${relic}: ${relicData.shards[relic]}`);
  });

  editMenu.addCancelAction("Cancel");
  let choice = await editMenu.present();

  if (choice >= 0) {
    let selectedRelic = relicNames[choice];
    let shardInput = await promptForShards(selectedRelic);
    if (shardInput !== null) {
      relicData.shards[selectedRelic] = shardInput;
    }
    await showRelicProgress();
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
