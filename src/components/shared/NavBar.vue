<template>
    <header class="app-header">
        <div class="container header-inner">
            <RouterLink to="/" class="brand" @click="closeMenu">
                <span class="brand-mark" aria-hidden="true"></span>
                <span>ClinicQ</span>
            </RouterLink>

            <button class="mobile-menu-btn mobile-only" type="button" @click="mobileOpen = !mobileOpen"
                aria-label="Menu">
                <span></span>
                <span></span>
                <span></span>
            </button>

            <nav class="desktop-nav" :class="{ 'is-open': mobileOpen }">
                <template v-if="portal === 'public'">
                    <RouterLink to="/clinics" class="nav-link" @click="closeMenu">Clinic Directory</RouterLink>
                    <RouterLink to="/login" class="nav-link" @click="closeMenu">Log In</RouterLink>
                </template>
                <template v-else-if="portal === 'patient'">
                    <RouterLink to="/patient/dashboard" class="nav-link" @click="closeMenu">Dashboard</RouterLink>
                    <RouterLink to="/patient/records" class="nav-link" @click="closeMenu">My Records</RouterLink>
                    <RouterLink to="/clinics" class="nav-link" @click="closeMenu">Find a Clinic</RouterLink>
                    <RouterLink to="/patient/profile" class="nav-link" @click="closeMenu">Profile</RouterLink>
                    <button class="btn btn-outline nav-btn" type="button" @click="closeAndLogout">Logout</button>
                </template>
                <template v-else-if="portal === 'clinic'">
                    <span class="welcome-text">{{ clinicName }}</span>
                    <RouterLink to="/clinic/dashboard" class="nav-link" @click="closeMenu">Queue Dashboard</RouterLink>
                    <RouterLink to="/clinic/post-consult" class="nav-link" @click="closeMenu">Post-Consult</RouterLink>
                    <RouterLink to="/clinic/profile" class="nav-link" @click="closeMenu">Profile</RouterLink>
                    <button class="btn btn-outline nav-btn" type="button" @click="closeAndLogout">Logout</button>
                </template>
            </nav>
        </div>
    </header>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/useAuthStore.js'

defineProps({ portal: { type: String, default: 'public' } })
const emit = defineEmits(['logout'])

const authStore = useAuthStore()
const route = useRoute()
const mobileOpen = ref(false)

const clinicName = computed(() => authStore.clinic?.name || authStore.clinic?.clinicName || 'Clinic Portal')

function closeMenu() {
    mobileOpen.value = false
}

function closeAndLogout() {
    closeMenu()
    emit('logout')
}

watch(() => route.fullPath, closeMenu)
</script>

<style scoped>
.app-header {
    position: sticky;
    top: var(--space-md);
    z-index: 100;
    margin: var(--space-md) var(--space-md) var(--space-lg);
    border-radius: var(--radius-full);
    background: rgba(255, 255, 255, 0.92);
    border: 1px solid rgba(226, 232, 240, 0.9);
    box-shadow: var(--shadow-lg);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
}

.header-inner {
    position: relative;
    min-height: 72px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-md);
    padding: 0 var(--space-lg);
}

.brand {
    display: inline-flex;
    align-items: center;
    gap: 0.75rem;
    font-family: var(--font-display);
    font-size: 1.35rem;
    font-weight: 800;
    color: var(--color-primary-dark);
    letter-spacing: -0.03em;
}

.brand-mark {
    width: 18px;
    height: 18px;
    border-radius: 6px;
    background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
    box-shadow: 0 10px 15px -3px rgba(59, 130, 246, 0.28);
}

.desktop-nav {
    display: none;
    width: 100%;
    flex-direction: column;
    position: absolute;
    top: calc(100% + 10px);
    left: 0;
    padding: var(--space-md);
    border-radius: var(--radius-lg);
    background: rgba(255, 255, 255, 0.96);
    border: 1px solid rgba(255, 255, 255, 0.8);
    box-shadow: var(--shadow-lg);
    gap: var(--space-sm);
}

.desktop-nav.is-open {
    display: flex;
}

.nav-link {
    font-family: var(--font-display);
    font-size: 0.95rem;
    font-weight: 700;
    color: var(--color-text-muted);
    letter-spacing: 0.02em;
    transition: color 0.2s ease;
}

.nav-link:hover,
.nav-link.router-link-active {
    color: var(--color-primary);
}

.nav-btn {
    min-height: 48px;
}

.welcome-text {
    display: inline-flex;
    align-items: center;
    padding: 0.45rem 0.95rem;
    border-radius: var(--radius-full);
    background: rgba(239, 246, 255, 0.92);
    color: var(--color-primary-dark);
    font-size: 0.82rem;
    font-weight: 800;
    box-shadow: var(--shadow-sm);
}

.mobile-menu-btn {
    background: none;
    border: none;
    padding: 0.35rem;
    display: inline-flex;
    flex-direction: column;
    gap: 4px;
    cursor: pointer;
}

.mobile-menu-btn span {
    width: 22px;
    height: 2px;
    background: var(--color-text-main);
    border-radius: 999px;
}

.mobile-only {
    display: inline-flex;
}

@media (max-width: 768px) {
    .app-header {
        top: var(--space-sm);
        margin: var(--space-sm) var(--space-sm) var(--space-md);
    }

    .header-inner {
        padding: 0 var(--space-md);
    }

    .desktop-nav .btn,
    .desktop-nav .nav-link,
    .welcome-text {
        width: 100%;
    }

    .desktop-nav .btn,
    .desktop-nav .nav-link {
        text-align: left;
        justify-content: flex-start;
    }

    .desktop-nav .nav-link {
        padding: 0.8rem 0.25rem;
    }
}

@media (min-width: 769px) {
    .desktop-nav {
        display: flex;
        position: static;
        width: auto;
        flex-direction: row;
        align-items: center;
        background: transparent;
        border: none;
        box-shadow: none;
        padding: 0;
        gap: var(--space-lg);
    }

    .mobile-only {
        display: none;
    }
}
</style>