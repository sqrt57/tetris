<script setup lang="ts">
import { onMounted, onUnmounted, computed } from 'vue'
import { storeToRefs } from 'pinia'
import * as game from './stores/game'
import GameField from './components/GameField.vue'

const gameStore = game.useStore()
const gameRunner = game.useRunner()
let { score } = storeToRefs(gameStore)

function tick() {
  gameStore.tick()
}

function reset() {
  gameStore.init()
}

const gameOver = computed(() => gameStore.gameOver)

onMounted(() => {
  gameStore.init()
  gameRunner.start()
})

onUnmounted(() => {
  gameRunner.stop()
})

</script>

<template>
  <header>
    <h1>Tetris</h1>
  </header>

  <main>
    <p>Score: {{ score }}</p>
    <!-- <input type="button" @click="tick" value="Tick" /> -->
    <GameField :width="400" :height="600" />
    <div v-if="gameOver">
        <h2>Game Over</h2>
        <input type="button" @click="reset" value="Restart" />
    </div>
  </main>
</template>
