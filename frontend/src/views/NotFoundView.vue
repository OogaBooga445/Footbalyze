<template>
  <div class="not-found">
    <h1 class="nf-code">404</h1>
    <p class="nf-msg">Page not found.</p>
    <RouterLink to="/" class="nf-home">Go home</RouterLink>
  </div>
</template>

<style scoped>
.not-found {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  gap: 12px;
  text-align: center;
}
.nf-code {
  font-size: 6rem;
  font-weight: 800;
  color: var(--accent, #3b82f6);
  margin: 0;
}
.nf-msg {
  color: rgba(255,255,255,0.5);
  margin: 0;
}
.nf-home {
  margin-top: 8px;
  color: var(--accent, #3b82f6);
  text-decoration: underline;
}
</style>
