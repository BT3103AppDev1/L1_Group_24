<template>
  <AuthLayout>
    <div class="wip-box">
      <div class="wip-icon">🛠️</div>
      <h2 class="form-heading">Coming Soon</h2>
      <p class="form-sub">
        Password reset is currently unavailable.
      </p>
    </div>
    <p class="auth-footer">
      <RouterLink to="/login">← Back to Log In</RouterLink>
    </p>
  </AuthLayout>
</template>

<style scoped>
.form-heading { 
    font-size: 1.4rem; 
    font-weight: 800; 
    color: #1f2937; 
    margin-bottom: .25rem; 
}

.form-sub { 
    color: #6b7280; 
    font-size: .875rem; 
    line-height: 1.6; 
}

.wip-box { 
    text-align: 
    center; 
    padding: 1rem 0; 
}

.wip-icon { 
    font-size: 3rem; 
    margin-bottom: 1rem; 
}

.auth-footer { 
    text-align: center; 
    margin-top: 1.25rem; 
    font-size: .875rem; 
}

.auth-footer a { 
    color: #3b82f6; 
    font-weight: 500; 
}
</style>