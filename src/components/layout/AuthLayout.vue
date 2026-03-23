<template>
  <div class="auth-page">
    <div class="auth-card">
      <div class="auth-brand">
        <RouterLink to="/" class="brand-link">
          <span class="brand-icon" aria-hidden="true"></span>
          <span class="brand-name">ClinicQ</span>
        </RouterLink>
        <p class="brand-copy">Smart queueing for patients and clinics.</p>
      </div>
      <slot />
    </div>
  </div>
</template>

<script setup></script>

<style scoped>
.auth-page {
  min-height: calc(100vh - 164px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 var(--space-md) var(--space-2xl);
}

.auth-card {
  width: 100%;
  max-width: 520px;
  padding: var(--space-xl);
  border-radius: var(--radius-lg);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.92), rgba(255, 255, 255, 0.8));
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.72);
  box-shadow: var(--shadow-lg);
}

.auth-brand {
  text-align: center;
  margin-bottom: 2rem;
}

.brand-link {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  text-decoration: none;
}

.brand-icon {
  width: 18px;
  height: 18px;
  border-radius: 6px;
  background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
  box-shadow: 0 10px 15px -3px rgba(59, 130, 246, 0.3);
}

.brand-name {
  font-family: var(--font-display);
  font-size: 1.7rem;
  font-weight: 800;
  color: var(--color-primary-dark);
  letter-spacing: -0.03em;
}

.brand-copy {
  margin: 0.75rem 0 0;
  font-size: 0.92rem;
  color: var(--color-text-muted);
}
</style>
