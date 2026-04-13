<template>
  <div class="home">

    <!-- Hero section to introduce platform -->
    <section class="hero-panel">
      <div class="hero-panel__content">
        <div class="hero-panel__eyebrow">Singapore's Smart Clinic Queue</div>
        <h1 class="hero-panel__title">Welcome to Clinic Queue</h1>
        <p class="hero-panel__subtitle">
          Skip the waiting room. Find a clinic near you, join the queue online,
          and arrive just in time for your consultation.
        </p>
        <div class="hero-panel__actions">
          <AppButton size="lg" @click="router.push('/clinics')">Find a Clinic</AppButton>
          <AppButton size="lg" variant="outline" @click="router.push('/login')">Log In</AppButton>
        </div>
      </div>
    </section>

    <!-- Features section to introduce features of platform -->
    <section class="features">
      <div class="features__grid">
        <article v-for="feature in features" :key="feature.title" class="feature-card">
          <div class="feature-card__icon">{{ feature.icon }}</div>
          <h3 class="feature-card__title">{{ feature.title }}</h3>
          <p class="feature-card__desc">{{ feature.desc }}</p>
        </article>
      </div>
    </section>

    <!-- Information section to introduce how the platform works -->
    <section class="info-panel">
      <h2 class="section-title">How It Works</h2>
      <div class="steps">
        <article v-for="(step, i) in steps" :key="step.label" class="step">
          <div class="step__number">{{ i + 1 }}</div>
          <h4 class="step__label">{{ step.label }}</h4>
          <p class="step__desc">{{ step.desc }}</p>
        </article>
      </div>
    </section>

    <!-- Call-to-action section to encourage users to start using the platform -->
    <section class="cta-panel">
      <h2 class="cta-panel__title">Ready to skip the queue?</h2>
      <p class="cta-panel__sub">Join thousands of patients who save time every day with Clinic Queue.</p>
      <div class="cta-panel__actions">
        <AppButton size="lg" @click="router.push('/register')">Get Started</AppButton>
        <AppButton size="lg" variant="outline" @click="router.push('/clinics')">Browse Clinics</AppButton>
      </div>
    </section>

  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import AppButton from '@/components/base/AppButton.vue'

const router = useRouter()

const features = [
  {
    icon: 'Hospital',
    title: 'Find Nearby Clinics',
    desc: 'Browse clinics by district, service, wait time, and opening hours to find the best option for you.'
  },
  {
    icon: 'Mobile',
    title: 'Join Queue Online',
    desc: 'Reserve your place before arriving, so you spend less time waiting at the clinic.'
  },
  {
    icon: 'Live',
    title: 'Track in Real Time',
    desc: 'Watch your queue position update live and head over only when it is close to your turn.'
  }
]

const steps = [
  { label: 'Find a Clinic', desc: 'Search our directory by location, service, or availability.' },
  { label: 'Join the Queue', desc: 'Select a service and join the queue with a few taps.' },
  { label: 'Arrive on Time', desc: 'Track your position and head to the clinic just in time.' }
]
</script>

<style scoped>
.home {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 var(--space-md);
}

.hero-panel {
  background:
    radial-gradient(circle at top center, rgba(59, 130, 246, 0.05) 0%, rgba(59, 130, 246, 0) 58%),
    white url("data:image/svg+xml;utf8,<svg width='34' height='34' viewBox='0 0 34 34' xmlns='http://www.w3.org/2000/svg'><circle cx='17' cy='17' r='1.4' fill='%23d5e4f4'/></svg>") repeat;
  border-radius: 2rem;
  box-shadow: var(--shadow-lg);
  border: 1px solid rgba(255, 255, 255, 0.75);
  padding: 5.5rem 2rem;
  text-align: center;
}

.hero-panel__content {
  max-width: 760px;
  margin: 0 auto;
}

.hero-panel__eyebrow {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.45rem 1.1rem;
  margin-bottom: 1.5rem;
  border-radius: var(--radius-full);
  background: rgba(239, 246, 255, 0.92);
  color: var(--color-primary-dark);
  font-size: 0.76rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.hero-panel__title {
  margin-bottom: 1rem;
  font-size: clamp(2.5rem, 6vw, 4rem);
  font-weight: 800;
  color: var(--color-primary);
  letter-spacing: -0.05em;
}

.hero-panel__subtitle {
  max-width: 760px;
  margin: 0 auto 2.25rem;
  color: var(--color-text-muted);
  font-size: 1.2rem;
  line-height: 1.7;
}

.hero-panel__actions {
  display: flex;
  justify-content: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.features {
  padding: var(--space-xl) 0;
}

.features__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-lg);
}

.feature-card {
  background: rgba(255, 255, 255, 0.92);
  border-radius: 1.6rem;
  padding: 2rem 1.7rem;
  box-shadow: var(--shadow-md);
  border: 1px solid rgba(255, 255, 255, 0.75);
  text-align: center;
}

.feature-card__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 4.25rem;
  height: 4.25rem;
  padding: 0 1rem;
  margin-bottom: 1rem;
  border-radius: 1.2rem;
  background: var(--color-primary-light);
  color: var(--color-primary-dark);
  font-family: var(--font-display);
  font-size: 0.95rem;
  font-weight: 800;
  letter-spacing: 0.02em;
}

.feature-card__title {
  margin-bottom: 0.75rem;
  color: var(--color-primary-dark);
  font-size: 1.2rem;
}

.feature-card__desc {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.96rem;
  line-height: 1.7;
}

.info-panel,
.cta-panel {
  background: rgba(255, 255, 255, 0.92);
  border-radius: 2rem;
  box-shadow: var(--shadow-md);
  border: 1px solid rgba(255, 255, 255, 0.75);
  padding: 3rem 2rem;
}

.info-panel {
  margin-bottom: var(--space-xl);
  text-align: center;
}

.section-title {
  margin-bottom: 2.5rem;
  color: var(--color-primary-dark);
}

.steps {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1.5rem;
}

.step {
  padding: 1.2rem;
}

.step__number {
  width: 3.5rem;
  height: 3.5rem;
  margin: 0 auto 1rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
  color: white;
  font-family: var(--font-display);
  font-size: 1.25rem;
  font-weight: 800;
  box-shadow: 0 10px 16px -6px rgba(59, 130, 246, 0.35);
}

.step__label {
  margin-bottom: 0.65rem;
  color: var(--color-text-main);
}

.step__desc {
  margin: 0;
  color: var(--color-text-muted);
  line-height: 1.7;
}

.cta-panel {
  text-align: center;
  margin-bottom: var(--space-xl);
}

.cta-panel__title {
  margin-bottom: 0.75rem;
  color: var(--color-primary-dark);
}

.cta-panel__sub {
  margin-bottom: 2rem;
  color: var(--color-text-muted);
  font-size: 1rem;
}

.cta-panel__actions {
  display: flex;
  justify-content: center;
  gap: 1rem;
  flex-wrap: wrap;
}

@media (max-width: 900px) {
  .features__grid,
  .steps {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .home {
    padding: 0 var(--space-sm) var(--space-xl);
  }

  .hero-panel,
  .info-panel,
  .cta-panel {
    padding: 2.5rem 1.25rem;
    border-radius: 1.6rem;
  }

  .hero-panel__title {
    font-size: 2.45rem;
  }

  .hero-panel__subtitle {
    font-size: 1rem;
  }
}
</style>