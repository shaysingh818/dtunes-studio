import { exists, mkdir, writeFile } from '@tauri-apps/plugin-fs';
import { dataDir, BaseDirectory } from '@tauri-apps/api/path';

// Function to download the SQLite file from GitHub and save it locally
export async function downloadSQLiteFile() {
  try {
    // Fetch the SQLite file from the raw GitHub URL
    const RAW_FILE_URL = "https://raw.githubusercontent.com/shaysingh818/dtunes-studio/release/database/build/dtunes-audio-app.sqlite3"
    const response = await fetch(RAW_FILE_URL);
    if (!response.ok) {
      throw new Error(`Failed to fetch the file: ${response.statusText}`);
    }

    // Read the file as a Blob (binary data)
    const fileBlob = await response.blob();
    const arrayBuffer = await fileBlob.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);


    // Write the file to the local data directory
    await writeFile(
      'dtunes-audio-app/metadata/dtunes-audio-app.sqlite3', 
      uint8Array, 
      { baseDir: BaseDirectory.Data }
    );

    console.log(`SQLite file downloaded and saved`);
  } catch (error) {
    console.error("Error downloading the SQLite file:", error);
  }
}



export async function checkAppDataFolders(): Promise<boolean> {

    let check = false;
    const appDataDir = await dataDir(); // Get the app's data directory path

    const directoriesToCheck = [
      'dtunes-audio-app/images',
      'dtunes-audio-app/audio_files',
      'dtunes-audio-app/metadata'
    ];

    for (const dir of directoriesToCheck) {
      const fullDirPath = `${appDataDir}/${dir}`;
      const dirExists = await exists(fullDirPath);
      if(dirExists) {
        check = true; 
      }
    }

    return check; 
}

// Function to create directories if they do not exist
export async function createAppDataFolders() {
  try {
    const appDataDir = await dataDir(); // Get the app's data directory path

    // Define paths for the directories you want to create
    const directoriesToCreate = [
      'dtunes-audio-app/images',
      'dtunes-audio-app/audio_files',
      'dtunes-audio-app/metadata'
    ];

    // Loop through and create each directory if it doesn't exist
    for (const dir of directoriesToCreate) {
        const fullDirPath = `${appDataDir}/${dir}`;
        await mkdir(fullDirPath);
    }
  } catch (error) {
    console.error("Error creating app data folders:", error);
  }
}
