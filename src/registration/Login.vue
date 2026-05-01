
<template>
  <div class="login-wrapper d-flex flex-row align-items-center justify-content-center">
    <CContainer>
      <CRow class="justify-content-center">
        <CCol md="8" lg="7">

          <CCardGroup class="login-group shadow-lg">

            <!-- LEFT: FORM -->
            <CCard class="p-4 border-0 login-card animate-fade">
              <CCardBody>
                <CForm @submit.prevent="onSubmit">

                  <div class="text-center mb-4">
                    <h1 class="title">Login</h1>
                    <p class="subtitle">Sign in to your account</p>
                  </div>

                  <CAlert v-if="error" color="danger" class="mb-3 text-center">
                    {{ error }}
                  </CAlert>

                  <!-- Username -->
                  <CInputGroup class="mb-3 input-wrap">
                    <CInputGroupText class="input-icon">
                      <CIcon icon="cil-user" />
                    </CInputGroupText>
                    <CFormInput
                      v-model="username"
                      placeholder="Email or ID"
                      autocomplete="username"
                      required
                    />
                  </CInputGroup>

                  <!-- Password -->
                  <CInputGroup class="mb-3 input-wrap">
                    <CInputGroupText class="input-icon">
                      <CIcon icon="cil-lock-locked" />
                    </CInputGroupText>
                    <CFormInput
                      v-model="password"
                      type="password"
                      placeholder="Password"
                      autocomplete="current-password"
                      required
                    />
                  </CInputGroup>

                  <!-- Role -->
                  <CInputGroup class="mb-4 input-wrap">
                    <CInputGroupText class="input-icon">
                      <CIcon icon="cil-people" />
                    </CInputGroupText>
                    <CFormSelect v-model="role" :disabled="loading" required>
                      <option disabled value="" selected>Select role</option>
                      <option value="administrator">Administrator</option>
                      <option value="principal">Principal</option>
                      <option value="student">Parent</option>
                      <option value="staff">Teacher</option>
                    </CFormSelect>
                  </CInputGroup>

                  <!-- Buttons -->
                  <CRow class="align-items-center">
                    <CCol xs="6">
                      <CButton
                        type="submit"
                        color="dark"
                        class="px-4 py-2 text-white rounded-pill w-100 fw-semibold animate-scale"
                        :disabled="loading"
                      >
                        <CSpinner v-if="loading" size="sm" class="me-2" />
                        Login
                      </CButton>
                    </CCol>

                    <CCol xs="6" class="text-end">
                      <router-link to="/reset-password" class="forgot-link">
                        Forgot password?
                      </router-link>
                    </CCol>
                  </CRow>

                </CForm>
              </CCardBody>
            </CCard>

            <!-- RIGHT: BRANDING -->
            <CCard class="brand-card text-white py-5 border-0 animate-slide">
              <CCardBody class="text-center">
                <h2 class="brand-title">KING OF GLORY PREP. SCHOOL</h2>
                <hr class="brand-line" />
                <p class="brand-text">
                  Simplify school fees.<br />
                  Stay organized.<br />
                  Manage payments with ease.
                </p>
              </CCardBody>
            </CCard>

          </CCardGroup>

        </CCol>
      </CRow>
    </CContainer>
  </div>
</template>



<script setup lang="ts">
import { useToast } from 'vue-toastification'
const toast = useToast()
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { login } from '../services/api' // your API helper

const router = useRouter()
const route = useRoute()

const username = ref('')
const password = ref('')
// const role = ref('') later         // <--- new

const role = ref('administrator')

const loading = ref(false)
const error = ref<string | null>(null)

function storeAuth(token: string, user: any, family: any, staff: any) {
  localStorage.setItem('token', token)
  localStorage.setItem('user', JSON.stringify(user))
  localStorage.setItem('family', JSON.stringify(family))
  localStorage.setItem('staff', JSON.stringify(staff))

}


function nextTarget() {
  // 1) Honor ?redirect=<routeName> from guard (validate it exists)
  const redirectName = route?.query?.redirect
  if (redirectName) {
    const resolved = router.resolve({ name: redirectName })
    if (resolved && resolved.name) {
      return { name: redirectName }
    }
    // if invalid, fall through to role home
  }

  // 2) Get user safely from storage
  let user = null
  try {
    const raw = localStorage.getItem('user')
    if (raw) user = JSON.parse(raw)
  } catch (e) {

  }

  // 3) Role-based landing (use names that DEFINITELY exist)
  if (user && user.role === 'administrator') {
    return { name: 'student_fee_records_admin' }
  }

  if (user && user.role === 'principal') {
    return { name: 'PrincipalDashboard' }
  }


  if (user && user.role === 'student') {
    return { name: 'AcademicRecords' }   // StudentDashboard
  }

  if (user && user.role === 'staff') {
    return { name: 'StaffDashboard' }
  }

  // 4) Fallback
  return { name: 'Login' }
}

// async function onSubmit() {
//   error.value = null
//   loading.value = true
//   try {
//     const payload = {
//       login_id: username.value,
//       password: password.value,
//       role: role.value, // keep only if backend expects this
//     }

//     const { data } = await login(payload)
//     const token = data?.token || data?.access || data?.key
//     if (!token) throw new Error('No token received from server')

//     // Persist server-authoritative user + token
//     storeAuth(token, data.user, data.family, data.staff,)

//     // Decide where to go
//     const target = nextTarget()

//     // Avoid self-redirect; prefer replace after login
//     const currentName = router.currentRoute.value?.name
//     if (target?.name && target.name !== currentName) {
//       await router.replace(target)
//     } else {
//   const roleRoutes = {
//     principal: { name: 'PrincipalDashboard' },
//     administrator: { name: 'student_fee_records_admin' },
//     student: { name: 'AcademicRecords' }   // StudentDashboard
//   }

//   await router.replace(
//     roleRoutes[data.user?.role] || { name: 'Login' }
//   )
// }


//   } catch (e) {



//     const backendError =
//       e?.response?.data?.non_field_errors?.[0] ||
//       e?.response?.data?.detail ||
//       e?.response?.data?.error ||
//       e?.response?.data?.password?.[0] ||
//       e?.message ||
//       'Login failed'
//     error.value = backendError
//   } finally {
//     loading.value = false
//   }
// } to be used later when backend auth is ready


async function onSubmit() {
  error.value = null
  loading.value = true

  try {
    // ✅ DEV MODE: fake user, no backend call
    const fakeUser = {
      role: role.value || 'administrator',
    }

    localStorage.setItem('token', 'dev-token')
    localStorage.setItem('user', JSON.stringify(fakeUser))

    // ✅ Go straight to role dashboard
    const roleRoutes: Record<string, any> = {
      administrator: { name: 'student_fee_records_admin' },
      principal: { name: 'PrincipalDashboard' },
      student: { name: 'AcademicRecords' },
      staff: { name: 'StaffDashboard' },
    }

    await router.replace(
      roleRoutes[fakeUser.role] || { name: 'student_fee_records_admin' }
    )

  } catch (e: any) {
    error.value = 'Login failed'
  } finally {
    loading.value = false
  }
}





</script>




<style scoped>
/* PAGE */
.login-wrapper {
  min-height: 100vh;
  background: #ffffff;
  padding: 20px;
}

/* CARD GROUP */
.login-group {
  border-radius: 22px;
  overflow: hidden;
}

/* LEFT CARD */
.login-card {
  background: #ffffff;
  border-right: 1px solid #f0f0f0;
}

/* RIGHT BRAND CARD */
.brand-card {
  background: linear-gradient(180deg, #6461f2, #6461f2);
}

.brand-title {
  font-weight: 700;
  font-size: 1.6rem;
}

.brand-line {
  border-color: rgba(255, 255, 255, 0.3);
  width: 50%;
}

.brand-text {
  opacity: 0.85;
  line-height: 1.6;
}

/* TITLES */
.title {
  font-size: 2rem;
  font-weight: 700;
}

.subtitle {
  font-size: 0.95rem;
  color: #888;
}

/* INPUTS */
.input-wrap input,
.input-wrap select {
  background: #f7f7f7 !important;
  border: 1px solid #e5e5e5 !important;
  padding: 11px 12px !important;
  border-radius: 6px !important;
}

.input-wrap input:focus,
.input-wrap select:focus {
  border-color: #000 !important;
  box-shadow: none !important;
}

.input-icon {
  background: #efefef !important;
  border-right: none !important;
}

/* Forgot link */
.forgot-link {
  color: #333;
  font-weight: 600;
  text-decoration: none;
}

.forgot-link:hover {
  text-decoration: underline;
}

/* ✅ ANIMATIONS */
.animate-fade {
  animation: fadeIn 0.8s ease-out;
}

.animate-slide {
  animation: slideIn 0.9s ease-out;
}

.animate-scale:hover {
  transform: scale(1.03);
  transition: 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
}

@keyframes slideIn {
  from { opacity: 0; transform: translateX(20px); }
  to   { opacity: 1; transform: translateX(0); }
}

/* ✅ RESPONSIVE */
@media (max-width: 991px) {
  .login-group {
    flex-direction: column;
  }
  .login-card {
    border-right: none;
    border-bottom: 1px solid #f0f0f0;
  }
}
</style>
