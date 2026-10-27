<script setup>
defineProps({ name: String })
const paths = {
  assistant: 'M12 3l2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3zM20 3v4m-2-2h4',
  health: 'M3 12h4l3-8 4 16 3-8h4',
  money: 'M12 3v18m5-14H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6',
  estate: 'M12 21v-7M5 14l7-11 7 11H5zm-2 5h18',
  chat: 'M21 11.5a8.5 8.5 0 01-8.5 8.5H3l2-5a8.5 8.5 0 1116-3.5zM8 11h.01M12 11h.01M16 11h.01',
  library: 'M12 5v16M3 3h4a5 5 0 015 3 5 5 0 015-3h4v16h-4a5 5 0 00-5 2 5 5 0 00-5-2H3V3z',
  tools: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM17 14v6m-3-3h6',
  list: 'M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M16 3a4 4 0 010 8m6 10v-2a4 4 0 00-3-3.87M13 7a4 4 0 11-8 0 4 4 0 018 0z',
}
</script>
<template><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path :d="paths[name] || paths.tools" /></svg></template>
