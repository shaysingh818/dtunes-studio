<script setup lang="ts">
import NavigationBar from "./components/navigation/NavigationBar.vue";
</script>


<template>

   <div class="flex">
    <NavigationBar />
  </div>

  <main class = "ml-32 p-2">
    <RouterView />
  </main>
</template>

<style>

</style>