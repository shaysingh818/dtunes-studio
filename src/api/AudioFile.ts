import { BaseDirectory, readFile } from '@tauri-apps/plugin-fs';
import { invoke } from "@tauri-apps/api/core";
import { dataDir} from '@tauri-apps/api/path';
import { reactive } from 'vue';

// Define the type for the AudioFile object
export interface AudioFile {
  audio_file_id: number;
  date_created: string;
  duration: string;
  file_name: string;
  file_path: string;
  last_modified: string;
  plays: number;
  sample_rate: string;
  thumbnail: string;
}

export class AudioFile {
  audio_file_id: number;
  date_created: string;
  duration: string;
  file_name: string;
  file_path: string;
  last_modified: string;
  plays: number;
  sample_rate: string;
  thumbnail: string;

  constructor({
    audio_file_id,
    date_created,
    duration,
    file_name,
    file_path,
    last_modified,
    plays,
    sample_rate,
    thumbnail,
  }: {
    audio_file_id: number;
    date_created: string;
    duration: string;
    file_name: string;
    file_path: string;
    last_modified: string;
    plays: number;
    sample_rate: string;
    thumbnail: string;
  }) {
    this.audio_file_id = audio_file_id;
    this.date_created = date_created;
    this.duration = duration;
    this.file_name = file_name;
    this.file_path = file_path;
    this.last_modified = last_modified;
    this.plays = plays;
    this.sample_rate = sample_rate;
    this.thumbnail = thumbnail;
  }
}

export const audioStore = reactive({

  audioFiles: [] as AudioFile[],
  queuedAudioFiles: [] as AudioFile[],
  audioFilePlaying: {} as AudioFile,
  player: null as HTMLAudioElement | null,
  playing: false as boolean,
  paused: false as boolean, 
  resume: false as boolean, 
  currentTime: 0 as number,
  duration: 0 as number,
  queueIndex: 0 as number,
  audioPlayerInterval: null as NodeJS.Timeout | null,


  async setCurrentPlaying(audioFile: AudioFile) {
    this.audioFilePlaying = audioFile;
    this.resume = false;
    this.currentTime = 0;

    const fileBuffer = await readFile(`dtunes-audio-app/audio_files/${audioFile.file_path}`, {
        baseDir: BaseDirectory.Data,
    });

    const audioUrl = URL.createObjectURL(new Blob([fileBuffer]));
    this.player = new Audio(audioUrl);
    this.duration = this.player.duration; 
  },

  async loadAudioFiles() {
    try {
        const dataDirPath = await dataDir(); 
        const userDbPath = `${dataDirPath}/dtunes-audio-app/metadata/dtunes-audio-app.sqlite3`;
        const audioFiles = await invoke<AudioFile[]>('view_audio_files', { userDbPath});
        this.audioFiles = audioFiles;

    } catch(error) {
        console.error("Error loading audio files: ", error); 
    }
  },

  async viewAudioFile(audioFileId: string): Promise<AudioFile> {
    const dataDirPath = await dataDir();
    const userDbPath = `${dataDirPath}/dtunes-audio-app/metadata/dtunes-audio-app.sqlite3`;
    return await invoke("view_audio_file", { userDbPath, audioFileId });
  },

  async createAudioFile(aliasFileName: string, userLocalFilePath: string, userLocalThumbnailPath: string): Promise<string> {

    const dataDirPath = await dataDir(); 
    const userThumbnailPath = `${dataDirPath}/dtunes-audio-app/images`; 
    const userAudioFilePath = `${dataDirPath}/dtunes-audio-app/audio_files`;
    const userDbPath = `${dataDirPath}/dtunes-audio-app/metadata/dtunes-audio-app.sqlite3`; 

    const audioFileName = userLocalFilePath.replace(/^.*[\\/]/, '');
    const thumbnailFileName = userLocalThumbnailPath.replace(/^.*[\\/]/, '');

    return await invoke("create_audio_file", { 
        aliasFileName,
        audioFileName,
        thumbnailFileName,
        userLocalFilePath,
        userLocalThumbnailPath,
        userThumbnailPath,
        userAudioFilePath,
        userDbPath
    });
  },

  async editAudioFile(audioFileId: string, aliasFileName: string, userLocalFilePath: string, userLocalThumbnailPath: string): Promise<string> {

    const dataDirPath = await dataDir(); 
    const userThumbnailPath = `${dataDirPath}/dtunes-audio-app/images`; 
    const userAudioFilePath = `${dataDirPath}/dtunes-audio-app/audio_files`;
    const userDbPath = `${dataDirPath}/dtunes-audio-app/metadata/dtunes-audio-app.sqlite3`; 

    const audioFileName = userLocalFilePath.replace(/^.*[\\/]/, '');
    const thumbnailFileName = userLocalThumbnailPath.replace(/^.*[\\/]/, '');

    return await invoke("edit_audio_file", { 
        audioFileId,
        aliasFileName,
        audioFileName,
        thumbnailFileName,
        userLocalFilePath,
        userLocalThumbnailPath,
        userThumbnailPath,
        userAudioFilePath,
        userDbPath
    });
  },

  async deleteAudioFile(audioFileId: string): Promise<string> {

    const dataDirPath = await dataDir();
    const userThumbnailPath = `${dataDirPath}/dtunes-audio-app/images`; 
    const userAudioFilePath = `${dataDirPath}/dtunes-audio-app/audio_files`;
    const userDbPath = `${dataDirPath}/dtunes-audio-app/metadata/dtunes-audio-app.sqlite3`; 

    return await invoke("delete_audio_file", { 
      userDbPath, 
      userThumbnailPath, 
      userAudioFilePath, 
      audioFileId
    });
  },

  async searchAudioFiles(searchTerm: string) {
    try {
        const dataDirPath = await dataDir(); 
        const userDbPath = `${dataDirPath}/dtunes-audio-app/metadata/dtunes-audio-app.sqlite3`;
        const audioFiles = await invoke<AudioFile[]>('search_audio_files', { userDbPath, searchTerm});
        this.audioFiles = audioFiles;

    } catch(error) {
        console.error("Error loading audio files from search term: ", error); 
    }
  },

  async addPlay(audioFileId: string) {
    const dataDirPath = await dataDir();
    const userDbPath = `${dataDirPath}/dtunes-audio-app/metadata/dtunes-audio-app.sqlite3`; 

    return await invoke("play_audio_file", {
      userDbPath,
      audioFileId
    });
  },

  async playAudio(audioFile: AudioFile) {

    console.log("PLAYING AUDIO FILE"); 
    console.log(audioFile); 

    this.audioFilePlaying = audioFile;
    this.playing = true;
    this.duration = parseInt(audioFile.duration);

    const fileBuffer = await readFile(`dtunes-audio-app/audio_files/${audioFile.file_path}`, {
        baseDir: BaseDirectory.Data,
    });

    const audioUrl = URL.createObjectURL(new Blob([fileBuffer]));
    console.log("Attempting to play:", audioUrl);

    await updateAudioPlayerInformation(
      audioFile.audio_file_id.toString(), 
      audioFile.thumbnail,
      parseInt(audioFile.duration)
    );

    if(this.audioPlayerInterval == null) {
      this.audioPlayerInterval = setInterval(updateRealtimePlayerInformation, 1000); 
    }

    console.log("QUEUE LENGTH", this.queuedAudioFiles.length); 

    try {
        this.player = new Audio(audioUrl);
        this.player.play();

        this.player.onended = () => {
          this.addPlay(audioFile.audio_file_id.toString()); 
          this.resume = false;  
          this.playing = false;         
        }

        this.player.onpause = () => {
          if(this.player) {
            this.currentTime = this.player.currentTime;
          }
          this.paused = true;
        }

        this.player.ontimeupdate = () => {
          if(this.player) {
            this.currentTime  = this.player.currentTime;
          }
        }

    } catch (error) {
        console.error("Could not play audio file: ", error); 
    }
    
  },

  async pauseAudio() {
    this.playing = false;
    if(this.player) {
        this.player.pause();
        this.resume = true;
    }
    
  },

  async resumeAudio() {
    if(this.paused && this.player) {
      this.player.play();
      this.player.currentTime = this.currentTime;
      this.playing = true;
      this.paused = false; 
      this.resume = false;
    }
  },

  async forward() {
    if(this.player) {
      const newDuration = this.player.currentTime - 30;
      if(newDuration <= this.duration) {
        this.player.currentTime += 30;
        this.currentTime = this.player.currentTime; 
      }
    }
  },

  async rewind() {
    if(this.player) {
      const newDuration = this.player.currentTime - 30;
      if(newDuration > 0) {
        this.player.currentTime -= 30;
        this.currentTime = this.player.currentTime; 
      }
    }
  },

  async nextAudioFile() {
    this.queueIndex += 1; 
    const audioFile = this.queuedAudioFiles[this.queueIndex];
    const queueIndexCondition = this.queueIndex < this.queuedAudioFiles.length;
    const playCondition = this.playing == true && this.queuedAudioFiles.length > 0;

    if(this.queueIndex == this.queueAudioFiles.length) {
      console.log("NO MORE TRACKS TO GO TO NEXT");
      this.pauseAudio(); 
      this.playing = false;
    }

    if(queueIndexCondition && playCondition) {
      this.pauseAudio();
      this.playAudio(audioFile)
    } 

  },

  async previousAudioFile() {
    if(this.queueIndex > 0) {
      this.queueIndex -= 1; 
      const audioFile = this.queuedAudioFiles[this.queueIndex];
      const queueIndexCondition = this.queueIndex < this.queuedAudioFiles.length;
      const playCondition = this.playing == true && this.queuedAudioFiles.length > 0;
      if(queueIndexCondition && playCondition) {
        this.pauseAudio();
        this.playAudio(audioFile)
      }
    }
  },

  async convertSecondsToMinutes(seconds: number) {
    const hours = Math.floor(seconds / 3600); // Get full hours
    const minutes = Math.floor(seconds/60) // Get full minutes
    const remainingSeconds = Math.floor(seconds % 60); // Get the remaining seconds 
    const formattedMinutes = minutes < 10 ? '0' + minutes : minutes;
    const formattedSeconds = remainingSeconds < 10 ? '0' + remainingSeconds : remainingSeconds;
    return `${hours}:${formattedMinutes}:${formattedSeconds}`;
  },

  async queueAudioFiles(audioFileId: string) {

    let audioFile = await this.viewAudioFile(audioFileId);
    this.queuedAudioFiles.push(audioFile);

    await this.loadAudioFiles();
    this.audioFiles.forEach( (audioFile) => {
      this.queuedAudioFiles.push(audioFile);
    });

    this.queueIndex = 0; 
  },

})

export async function updateAudioPlayerInformation(audioFileId: string, thumbnail: string, duration: number) {

    const fileBuffer = await readFile(`dtunes-audio-app/images/${thumbnail}`, {
        baseDir: BaseDirectory.Data,
    });

    const imageUrl = URL.createObjectURL(new Blob([fileBuffer]));
    let imageElem = document.getElementById(`${audioFileId}-player`);
    if(imageElem && imageElem instanceof HTMLImageElement) {
      imageElem.src = imageUrl;
    } else {
      console.log(`${audioFileId} not found`)
    }

    let durationElem = document.getElementById(`${audioFileId}-player-duration`);
    if(durationElem) {
      durationElem.innerHTML = await audioStore.convertSecondsToMinutes(duration); 
    }
}

export async function updateRealtimePlayerInformation() {

  const durationElement = document.getElementById("duration-tracker");
  const currentTime = audioStore.currentTime; 
  if(durationElement && currentTime > 0 && audioStore.playing)  {
    const value = (currentTime/audioStore.duration) * 100;
    console.log("CURRENT DURATION: ", value);  
    durationElement.style.width = `${value}%`;
  }

  if(audioStore.resume == false && audioStore.playing == false) {
    audioStore.queueIndex += 1; 
    const audioFile = audioStore.queuedAudioFiles[audioStore.queueIndex];
    console.log("NEXT AUDIO FILE"); 
    console.log(audioFile);
    audioStore.pauseAudio(); 
    audioStore.playAudio(audioFile); 
  }

  if(audioStore.queueIndex == audioStore.queuedAudioFiles.length) {
    console.log("All tracks played, stopping interval")
    audioStore.queuedAudioFiles = [];
    audioStore.playing = false; 
    if(audioStore.audioPlayerInterval != null) {
      clearInterval(audioStore.audioPlayerInterval); 
    }
  }

}


