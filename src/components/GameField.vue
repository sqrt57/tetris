<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch, type Ref } from 'vue'
import { storeToRefs } from 'pinia'
import * as game from '../stores/game'

const props = defineProps<{
  width?: number
  height?: number
}>()

const gameStore = game.useStore()
const canvas = ref<HTMLCanvasElement | null>(null)

function redraw(state: typeof gameStore.$state, canvas: HTMLCanvasElement | null) {
  if (canvas === null || !canvas.getContext) return

  const ctx = canvas.getContext('2d')
  if (ctx === null) return

  const delta = Math.min(Math.trunc(canvas.width / state.width), Math.trunc(canvas.height / state.height))
  const v0 = {
    width: delta * state.width,
    height: delta * state.height,
  }

  const v = {
    ...v0,
    x: Math.trunc((canvas.width - v0.width) / 2),
    y: Math.trunc((canvas.height - v0.height) / 2),
  }

  ctx.fillStyle = 'rgb(245,250,255)'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  ctx.fillStyle = 'white'
  ctx.fillRect(v.x, v.y, v.width, v.height)

  ctx.strokeStyle = 'rgb(0,0,192)'
  ctx.fillStyle = 'rgb(195,220,255)'

  for (let x = 0; x < state.width; x++) {
    for (let y = 0; y < state.height; y++) {
      const c = {
        x: v.x + x * delta,
        y: v.y + (state.height - y - 1) * delta,
        width: delta,
        height: delta,
      }
      if (state.field[y][x].filled) {
        ctx.strokeRect(c.x, c.y, c.width - 1, c.height - 1)
        ctx.fillRect(c.x, c.y, c.width - 1, c.height - 1)
      }
    }
  }

  ctx.strokeStyle = 'rgb(0,0,224)'
  ctx.fillStyle = 'rgb(235,245,255)'

  for (let x = 0; x < state.pieceWidth; x++) {
    for (let y = 0; y < state.pieceHeight; y++) {
      const c = {
        x: v.x + (state.pieceX + x) * delta,
        y: v.y + (state.height - (state.pieceY + y) - 1) * delta,
        width: delta,
        height: delta,
      }
      if (state.piece[y][x].filled) {
        ctx.strokeRect(c.x, c.y, c.width - 1, c.height - 1)
        ctx.fillRect(c.x, c.y, c.width - 1, c.height - 1)
      }
    }
  }

  ctx.strokeStyle = 'black'
  ctx.fillStyle = 'transparent'
  ctx.strokeRect(v.x, v.y, v.width, v.height)
}

gameStore.$subscribe((mutation, state) => {
  redraw(state, canvas.value)
})

onMounted(() => {
  redraw(gameStore.$state, canvas.value)
  document.addEventListener('keydown', (event) => {
    switch (event.key) {
      case "ArrowLeft":
        gameStore.moveLeft()
        break
      case "ArrowRight":
        gameStore.moveRight()
        break
      case "ArrowUp":
        gameStore.rotate()
        break
      case "ArrowDown":
        gameStore.moveDown()
        break
      case " ":
        gameStore.drop()
        break
    }
  })
})

</script>

<template>
  <div class="field">
    <canvas ref="canvas" :width="width" :height="height"></canvas>
  </div>
</template>

<style scoped>
canvas {
  border: 1px solid black;
}
</style>
