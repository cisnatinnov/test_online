<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const display = ref('0')
let expr = ''
let disp = ''

function update() { display.value = disp || '0' }

function num(n) { expr += n; disp += n; update() }
function op(o) { expr += o; disp += o; update() }
function ins(s) { expr += s; disp += s; update() }

function fn(fnName) {
  const map = { sin: 'Math.sin(', cos: 'Math.cos(', tan: 'Math.tan(', asin: 'Math.asin(', acos: 'Math.acos(', atan: 'Math.atan(', log: 'Math.log10(', ln: 'Math.log(', sqrt: 'Math.sqrt(', cbrt: 'Math.cbrt(' }
  expr += map[fnName] || fnName + '('; disp += fnName + '('; update()
}

function del() { expr = expr.slice(0, -1); disp = disp.slice(0, -1); update() }
function clear() { expr = ''; disp = ''; update() }

function eval_() {
  try {
    const safe = expr.replace(/\^/g, '**').replace(/pi/g, 'Math.PI').replace(/(?<![a-z])e(?![a-z])/g, 'Math.E')
    const result = Function('"use strict";return (' + safe + ')')()
    disp = String(result); expr = disp; update()
  } catch (e) { display.value = 'Error'; expr = ''; disp = '' }
}
</script>

<template>
  <div style="max-width:420px;margin:0 auto;padding:20px">
    <div style="display:flex;justify-content:space-between;align-items:center">
      <button class="link-btn" @click="router.push('/tools')">Back</button>
      <button class="link-btn" @click="router.push('/')">Home</button>
    </div>
    <h2 style="text-align:center">Scientific Calculator</h2>
    <div style="background:#1a1a2e;color:#2ecc71;font-size:28px;padding:15px;border-radius:8px;text-align:right;word-break:break-all;min-height:60px;margin-bottom:10px;font-family:monospace">{{ display }}</div>
    <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:6px">
      <button @click="fn('sin')" style="padding:14px 6px;font-size:15px;border:1px solid #333;border-radius:6px;background:#444;color:#fff;cursor:pointer">sin</button>
      <button @click="fn('cos')" style="padding:14px 6px;font-size:15px;border:1px solid #333;border-radius:6px;background:#444;color:#fff;cursor:pointer">cos</button>
      <button @click="fn('tan')" style="padding:14px 6px;font-size:15px;border:1px solid #333;border-radius:6px;background:#444;color:#fff;cursor:pointer">tan</button>
      <button @click="fn('asin')" style="padding:14px 6px;font-size:15px;border:1px solid #333;border-radius:6px;background:#444;color:#fff;cursor:pointer">sin-1</button>
      <button @click="fn('acos')" style="padding:14px 6px;font-size:15px;border:1px solid #333;border-radius:6px;background:#444;color:#fff;cursor:pointer">cos-1</button>
      <button @click="fn('atan')" style="padding:14px 6px;font-size:15px;border:1px solid #333;border-radius:6px;background:#444;color:#fff;cursor:pointer">tan-1</button>
      <button @click="fn('log')" style="padding:14px 6px;font-size:15px;border:1px solid #333;border-radius:6px;background:#444;color:#fff;cursor:pointer">log</button>
      <button @click="fn('ln')" style="padding:14px 6px;font-size:15px;border:1px solid #333;border-radius:6px;background:#444;color:#fff;cursor:pointer">ln</button>
      <button @click="fn('sqrt')" style="padding:14px 6px;font-size:15px;border:1px solid #333;border-radius:6px;background:#444;color:#fff;cursor:pointer">sqrt</button>
      <button @click="fn('cbrt')" style="padding:14px 6px;font-size:15px;border:1px solid #333;border-radius:6px;background:#444;color:#fff;cursor:pointer">cbrt</button>
      <button @click="ins('(')" style="padding:14px 6px;font-size:15px;border:1px solid #333;border-radius:6px;background:#007BFF;color:#fff;cursor:pointer">(</button>
      <button @click="ins(')')" style="padding:14px 6px;font-size:15px;border:1px solid #333;border-radius:6px;background:#007BFF;color:#fff;cursor:pointer">)</button>
      <button @click="ins('^')" style="padding:14px 6px;font-size:15px;border:1px solid #333;border-radius:6px;background:#007BFF;color:#fff;cursor:pointer">^</button>
      <button @click="ins('pi')" style="padding:14px 6px;font-size:15px;border:1px solid #333;border-radius:6px;background:#444;color:#fff;cursor:pointer">pi</button>
      <button @click="ins('e')" style="padding:14px 6px;font-size:15px;border:1px solid #333;border-radius:6px;background:#444;color:#fff;cursor:pointer">e</button>
      <button @click="num('7')" style="padding:14px 6px;font-size:15px;border:1px solid #333;border-radius:6px;background:#2a2a3e;color:#fff;cursor:pointer">7</button>
      <button @click="num('8')" style="padding:14px 6px;font-size:15px;border:1px solid #333;border-radius:6px;background:#2a2a3e;color:#fff;cursor:pointer">8</button>
      <button @click="num('9')" style="padding:14px 6px;font-size:15px;border:1px solid #333;border-radius:6px;background:#2a2a3e;color:#fff;cursor:pointer">9</button>
      <button @click="op('/')" style="padding:14px 6px;font-size:15px;border:1px solid #333;border-radius:6px;background:#007BFF;color:#fff;cursor:pointer">/</button>
      <button @click="del()" style="padding:14px 6px;font-size:15px;border:1px solid #333;border-radius:6px;background:#e74c3c;color:#fff;cursor:pointer">DEL</button>
      <button @click="num('4')" style="padding:14px 6px;font-size:15px;border:1px solid #333;border-radius:6px;background:#2a2a3e;color:#fff;cursor:pointer">4</button>
      <button @click="num('5')" style="padding:14px 6px;font-size:15px;border:1px solid #333;border-radius:6px;background:#2a2a3e;color:#fff;cursor:pointer">5</button>
      <button @click="num('6')" style="padding:14px 6px;font-size:15px;border:1px solid #333;border-radius:6px;background:#2a2a3e;color:#fff;cursor:pointer">6</button>
      <button @click="op('*')" style="padding:14px 6px;font-size:15px;border:1px solid #333;border-radius:6px;background:#007BFF;color:#fff;cursor:pointer">*</button>
      <button @click="clear()" style="padding:14px 6px;font-size:15px;border:1px solid #333;border-radius:6px;background:#e74c3c;color:#fff;cursor:pointer">AC</button>
      <button @click="num('1')" style="padding:14px 6px;font-size:15px;border:1px solid #333;border-radius:6px;background:#2a2a3e;color:#fff;cursor:pointer">1</button>
      <button @click="num('2')" style="padding:14px 6px;font-size:15px;border:1px solid #333;border-radius:6px;background:#2a2a3e;color:#fff;cursor:pointer">2</button>
      <button @click="num('3')" style="padding:14px 6px;font-size:15px;border:1px solid #333;border-radius:6px;background:#2a2a3e;color:#fff;cursor:pointer">3</button>
      <button @click="op('-')" style="padding:14px 6px;font-size:15px;border:1px solid #333;border-radius:6px;background:#007BFF;color:#fff;cursor:pointer">-</button>
      <button @click="eval_()" style="padding:14px 6px;font-size:18px;border:1px solid #333;border-radius:6px;background:#2ecc71;color:#fff;cursor:pointer;grid-column:span 2">=</button>
      <button @click="num('0')" style="padding:14px 6px;font-size:15px;border:1px solid #333;border-radius:6px;background:#2a2a3e;color:#fff;cursor:pointer">0</button>
      <button @click="ins('.')" style="padding:14px 6px;font-size:15px;border:1px solid #333;border-radius:6px;background:#2a2a3e;color:#fff;cursor:pointer">.</button>
      <button @click="op('+')" style="padding:14px 6px;font-size:15px;border:1px solid #333;border-radius:6px;background:#007BFF;color:#fff;cursor:pointer">+</button>
    </div>
  </div>
</template>
