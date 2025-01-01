<template>
    <div class="flex flex-col items-stretch md:items-center space-y-2">
        <i :class="['fas', icon, 'text-red-800', 'text-3xl']"></i>
        <p1>{{ navTitle }}</p1>
    </div>
</template>

<script>
export default {
  name: 'NavigationItem',
  props: {
    icon: {
      type: String,
      required: true,
    },
    navTitle: {
      type: String,
      required: true,
    },
  },
}
</script>