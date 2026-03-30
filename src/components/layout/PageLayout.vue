<template>
  <div class="page-layout">
    <!-- Page header with optional back link, title, and subtitle -->
    <div class="page-header" v-if="title || backRoute">
      <RouterLink v-if="backRoute" :to="backRoute" class="back-link">Back</RouterLink>
      <h1 v-if="title" class="page-title">{{ title }}</h1>
      <p v-if="subtitle" class="page-subtitle">{{ subtitle }}</p>
    </div>
    <!-- Page content injected via default slot -->
    <slot />
  </div>
</template>

<script setup>
defineProps({
  title:     { type: String, default: '' },
  subtitle:  { type: String, default: '' },
  backRoute: { type: String, default: '' },
})
</script>

<style scoped>
.page-layout {
  max-width: 900px;
  margin: 0 auto;
  padding: 0 var(--space-md) var(--space-2xl);
}

.page-header {
  margin-bottom: var(--space-lg);
  padding: var(--space-lg) var(--space-xl);
  border-radius: var(--radius-lg);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.88), rgba(255, 255, 255, 0.68));
  border: 1px solid rgba(255, 255, 255, 0.72);
  box-shadow: var(--shadow-lg);
  backdrop-filter: blur(16px);
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.45rem 0.9rem;
  font-size: 0.82rem;
  color: var(--color-primary-dark);
  font-weight: 700;
  margin-bottom: 0.85rem;
  border-radius: var(--radius-full);
  background: rgba(239, 246, 255, 0.88);
  box-shadow: var(--shadow-sm);
}

.page-title {
  margin: 0;
  font-size: clamp(1.55rem, 2vw, 2rem);
  font-weight: 800;
  color: var(--color-primary-dark);
  letter-spacing: -0.03em;
}

.page-subtitle {
  margin-top: 0.5rem;
  margin-bottom: 0;
  color: var(--color-text-muted);
  font-size: 0.98rem;
}

@media (max-width: 768px) {
  .page-layout {
    padding: 0 var(--space-sm) var(--space-xl);
  }

  .page-header {
    padding: var(--space-lg);
  }
}
</style>