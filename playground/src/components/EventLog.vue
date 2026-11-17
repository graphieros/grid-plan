<script setup>
defineProps({ events: { type: Array, required: true } });
defineEmits(['clear']);
</script>
<template>
  <section class="panel inspector">
    <div class="section-heading"><h2>Events</h2><button class="text-button" @click="$emit('clear')">Clear log</button></div>
    <p v-if="!events.length" class="empty">Your next interaction will appear here.</p>
    <div class="event-list">
      <details v-for="event in events" :key="event.id">
        <summary><span class="event-name">{{ event.name }}</span><time>{{ event.time }}</time></summary>
        <pre>{{ event.detail }}</pre>
      </details>
    </div>
  </section>
</template>
