<script setup lang="ts">
</script>


<template>
    <div class="audio-bar-container">

        <div class="flex flex-row">

            <div class="song-info">
                <div class="player-image-container">
                    <img :src="thumbnail" :alt="thumbnail" class="image p-1" :id="`${audioFileId.toString()}-player`" />
                </div>

                <div class="player-audio-file-info">
                    <div class="audio-title">
                        <h1>{{ title  }}</h1>
                    </div>
                    <div class="player-icons">

                      <div class="player-icon-item">
                        <div>
                          <i :class="['fas', 'fa-play', 'text-red-800']"></i>
                        </div>
                        <div>
                          <p>{{ plays }}</p>
                        </div>
                      </div>

                      <div class="player-icon-item">
                        <div>
                          <i :class="['fas', 'fa-clock', 'text-red-800']"></i>
                        </div>
                        <div>
                          <p :id="`${audioFileId}-player-duration`">{{ duration }}</p>
                        </div>
                      </div>

                    </div>
                </div>
            </div>

            <div class="player-controls">

                <div class="flex flex-col gap-2">
                    <div class="player-buttons">
                        <div @click="audioStore.previousAudioFile()">
                            <i :class="['fas', 'fa-backward', 'text-white']"></i>
                        </div>
                        <div @click="audioStore.rewind()">
                            <i :class="['fas', 'fa-rotate-left', 'text-white']"></i>
                        </div>
                        <div v-if="audioStore.playing == true" class="play-button" @click="pauseFile()">
                            <i :class="['fas', 'fa-pause', 'text-white']"></i>
                        </div>
                        <div v-if="audioStore.resume == true && audioStore.playing == false" class="play-button" @click="resumeFile()">
                            <i :class="['fas', 'fa-play', 'text-white']"></i>
                        </div>
                        <div @click="audioStore.forward()">
                            <i :class="['fas', 'fa-rotate-right', 'text-white']"></i>
                        </div>
                        <div @click="audioStore.nextAudioFile()">
                            <i :class="['fas', 'fa-forward', 'text-white']"></i>
                        </div>
                    </div>
                    <div class="audio-duration">
                        <div class="w-full bg-gray-200 rounded-full h-1 dark:bg-gray-700">
                            <div class="bg-red-600 h-1 rounded-full" id="duration-tracker"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>


<script setup>
import { audioStore, AudioFile } from '../../api/AudioFile';
</script>

<script>
import { audioStore, AudioFile } from '../../api/AudioFile';
import { BaseDirectory, readFile } from '@tauri-apps/plugin-fs';

export default {
  name: 'AudioPlayer',
  props: {
    audioFileId: {
      type: Number,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    datePosted: {
      type: String,
      required: true,
    },
    duration: {
      type: String,
      required: true,
    }, 
    filePath: {
      type: String,
      required: true,
    },
    lastModified: {
      type: String,
      required: true,
    },
    plays: {
      type: Number,
      required: true,
    },
    sampleRate: {
      type: String,
      required: true,
    },
    thumbnail: {
      type: String,
      required: true,
    }, 
  },
  methods: {
    async playFile() {

        const audioFile = new AudioFile({
            audio_file_id: this.audioFileId,
            date_created: this.datePosted,
            duration: this.duration,
            file_name: this.title,
            file_path: this.filePath,
            last_modified: this.lastModified,
            plays: this.plays,
            sample_rate: this.sampleRate,
            thumbnail: this.thumbnail
        });


        const fileBuffer = await readFile(`dtunes-audio-app/images/${this.thumbnail}`, {
            baseDir: BaseDirectory.Data,
        });

        const imageUrl = URL.createObjectURL(new Blob([fileBuffer]));
        let imageElem = document.getElementById(`${this.audioFileId.toString()}-player`);
        if(imageElem && imageElem instanceof HTMLImageElement) {
          imageElem.src = imageUrl;
        } else {
          console.log(`${this.audioFileId} not found`)
        }

        audioStore.playAudio(audioFile);
    },
    async pauseFile() {
        audioStore.pauseAudio();
    },
    async resumeFile() {
        audioStore.resumeAudio();
    },
  },
  async mounted() { 

    const fileBuffer = await readFile(`dtunes-audio-app/images/${this.thumbnail}`, {
        baseDir: BaseDirectory.Data,
    });

    const imageUrl = URL.createObjectURL(new Blob([fileBuffer]));
    console.log("IMAGE URL: ", imageUrl)
    let imageElem = document.getElementById(`${this.audioFileId.toString()}-player`);
    if(imageElem && imageElem instanceof HTMLImageElement) {
      imageElem.src = imageUrl;
    } else {
      console.log(`${this.audioFileId} not found`)
    }

    let durationElem = document.getElementById(`${this.audioFileId.toString()}-player-duration`);
    if(durationElem) {
      durationElem.innerHTML = await audioStore.convertSecondsToMinutes(parseInt(this.duration)); 
    }
  },
}



const updatePlayer = () => {
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
    //clearInterval(intervalId);
  }


};

if(audioStore.audioPlayerInterval == null) {
  audioStore.audioPlayerInterval = setInterval(updatePlayer, 1000);
}



</script>


<style scoped>

.audio-bar-container {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 75px; 
  background-color: #333;
  color: white;
  padding: 10px;
}


.player-image-container {
  border-radius: 10%;
  height: 55px;
  width: 55px;
  background-size: cover;
  background-position: center;
}

.song-info {
  display: flex;
  flex-direction: row;
  gap: 0.5rem; 
  justify-content: left;
  align-items: left;
  height: 15%; 
  width: 35%;
}

.player-controls {
  display: flex;
  justify-content: left;
  align-items: left;
  height: 20%;
  width: 55%;  
}

.image {
  border: 1px; 
  border-radius: 15%; 
  height: 100%;
  width: 100%;   
}

.text-container {
  padding: 4px; 
  height: 100%;
  justify-content: left;
}

.play-button {
  border-radius: 50%;
  display: flex;
  align-items: center;
  background-color: red;
  width: 30px;
  height: 30px;
  justify-content: center; 
}

.player-icons {
  display: flex;
  flex-direction: row;
  gap: 1.0rem; 
}

.player-icon-item {
  display: flex;
  flex-direction: row;
  gap: 0.5rem;
  justify-content: center; 
  align-items: center;
}

.player-audio-file-info {
  display: flex;
  flex-direction: column;
}

.audio-title {
  max-width: 175px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.audio-duration {
    width: 400px;
}

.player-buttons {
  display: flex;
  flex-direction: row;
  gap: 1rem; 
  justify-content: center;
  align-items: center;
}

hr {
  border: 1px solid gray 
}

h1 {
    font-size: 15px;
}

p {
    font-size: 10px;
}

</style>