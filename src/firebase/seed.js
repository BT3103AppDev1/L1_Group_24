import { createUserWithEmailAndPassword } from 'firebase/auth'
import { auth } from './config.js'
import { createPatient, createClinic } from './firestore.js'

// mock patients
const patients = [
  { fullName: 'Ahmad Bin Ali', email: 'patient3@test.com', mobileNumber: '91234563', postalCode: '345678' },
  { fullName: 'Priya Nair', email: 'patient4@test.com', mobileNumber: '91234564', postalCode: '456789' },
  { fullName: 'Wong Jun Kai', email: 'patient5@test.com', mobileNumber: '91234565', postalCode: '567890' },
  { fullName: 'Siti Binte Rahmat', email: 'patient6@test.com', mobileNumber: '91234566', postalCode: '678901' },
  { fullName: 'Lim Chee Keong', email: 'patient7@test.com', mobileNumber: '91234567', postalCode: '789012' },
  { fullName: 'Kavitha Suresh', email: 'patient8@test.com', mobileNumber: '91234568', postalCode: '890123' },
  { fullName: 'Muhammad Fariz', email: 'patient9@test.com', mobileNumber: '91234569', postalCode: '901234' },
  { fullName: 'Chua Beng Huat', email: 'patient10@test.com', mobileNumber: '91234570', postalCode: '112345' },
  { fullName: 'Nur Aisyah Binte Zul', email: 'patient11@test.com', mobileNumber: '91234571', postalCode: '223456' },
  { fullName: 'Ravi Krishnamurthy', email: 'patient12@test.com', mobileNumber: '91234572', postalCode: '334567' },
]

// mock clinics
const clinics = [
  {
    clinicName: 'Bright Family Clinic',
    contactNumber: '61110001',
    postalCode: '238858',
    address: '123 Orchard Rd #01-01',
    district: 'Central',
    operatingHours: {
        mon: { open: true, start: '08:00', end: '18:00' },
        tue: { open: true, start: '08:00', end: '18:00' },
        wed: { open: true, start: '08:00', end: '18:00' },
        thu: { open: true, start: '08:00', end: '18:00' },
        fri: { open: true, start: '08:00', end: '18:00' },
        sat: { open: true, start: '09:00', end: '13:00' },
        sun: { open: false }
    },
    services: ['general_consultation', 'vaccination', 'health_screening'],
    email: "clinicc@test.com",
  },
  {
    clinicName: 'Sunshine Medical Centre',
    contactNumber: '61110002',
    postalCode: '520456', 
    address: '456 Tampines St 42 #02-10',
    district: 'Tampines',
    operatingHours: {
        mon: { open: true, start: '08:00', end: '18:00' },
        tue: { open: true, start: '08:00', end: '18:00' },
        wed: { open: true, start: '08:00', end: '18:00' },
        thu: { open: true, start: '08:00', end: '18:00' },
        fri: { open: true, start: '08:00', end: '18:00' },
        sat: { open: true, start: '09:00', end: '13:00' },
        sun: { open: false }
    },
    services: ['general_consultation', 'chronic_disease', 'pharmacy'],
    email: "clinicd@test.com",
  },
  {
    clinicName: 'Caring Hands Clinic',
    contactNumber: '61110003',
    postalCode: '640789',
    address: '789 Jurong West St 81 #01-05',
    district: 'Jurong West',
    operatingHours: {
        mon: { open: true, start: '08:00', end: '18:00' },
        tue: { open: true, start: '08:00', end: '18:00' },
        wed: { open: true, start: '08:00', end: '18:00' },
        thu: { open: true, start: '08:00', end: '18:00' },
        fri: { open: true, start: '08:00', end: '18:00' },
        sat: { open: true, start: '09:00', end: '13:00' },
        sun: { open: false }
    },
    services: ['general_consultation', 'child_health', 'womens_health'],
    email: "clinice@test.com",
  },
  {
    clinicName: 'HealthFirst Clinic',
    contactNumber: '61110004',
    postalCode: '738343',
    address: '10 Woodlands Ave 2 #01-22',
    district: 'Woodlands',
    operatingHours: {
        mon: { open: true, start: '08:00', end: '18:00' },
        tue: { open: true, start: '08:00', end: '18:00' },
        wed: { open: true, start: '08:00', end: '18:00' },
        thu: { open: true, start: '08:00', end: '18:00' },
        fri: { open: true, start: '08:00', end: '18:00' },
        sat: { open: true, start: '09:00', end: '13:00' },
        sun: { open: false }
    },
    services: ['general_consultation', 'health_screening', 'pharmacy'],
    email: "clinicf@test.com",
  },
  {
    clinicName: 'Bedok Medical Clinic',
    contactNumber: '61110005',
    postalCode: '460216',
    address: '216 Bedok North St 1 #01-08',
    district: 'Bedok',
    operatingHours: {
        mon: { open: true, start: '08:00', end: '18:00' },
        tue: { open: true, start: '08:00', end: '18:00' },
        wed: { open: true, start: '08:00', end: '18:00' },
        thu: { open: true, start: '08:00', end: '18:00' },
        fri: { open: true, start: '08:00', end: '18:00' },
        sat: { open: true, start: '09:00', end: '13:00' },
        sun: { open: false }
    },
    services: ['general_consultation', 'xray', 'vaccination'],
    email: "clinicg@test.com",
  },
  {
    clinicName: 'Yishun Family Practice',
    contactNumber: '61110006',
    postalCode: '760101',
    address: '101 Yishun Ave 5 #02-01',
    district: 'Yishun',
    operatingHours: {
        mon: { open: true, start: '08:00', end: '18:00' },
        tue: { open: true, start: '08:00', end: '18:00' },
        wed: { open: true, start: '08:00', end: '18:00' },
        thu: { open: true, start: '08:00', end: '18:00' },
        fri: { open: true, start: '08:00', end: '18:00' },
        sat: { open: true, start: '09:00', end: '13:00' },
        sun: { open: false }
    },
    services: ['general_consultation', 'chronic_disease', 'child_health'],
    email: "clinich@test.com",
  },
  {
    clinicName: 'Central Wellness Clinic',
    contactNumber: '61110007',
    postalCode: '149053',
    address: '3 Queenstown Rd #01-10',
    district: 'Queenstown',
    operatingHours: {
        mon: { open: true, start: '08:00', end: '18:00' },
        tue: { open: true, start: '08:00', end: '18:00' },
        wed: { open: true, start: '08:00', end: '18:00' },
        thu: { open: true, start: '08:00', end: '18:00' },
        fri: { open: true, start: '08:00', end: '18:00' },
        sat: { open: true, start: '09:00', end: '13:00' },
        sun: { open: false }
    },
    services: ['general_consultation', 'physiotherapy', 'health_screening'],
    email: "clinici@test.com",
  },
  {
    clinicName: 'Bukit Timah Medical',
    contactNumber: '61110008',
    postalCode: '229832',
    address: '1 Bukit Timah Rd #02-15',
    district: 'Bukit Timah',
    operatingHours: {
        mon: { open: true, start: '08:00', end: '18:00' },
        tue: { open: true, start: '08:00', end: '18:00' },
        wed: { open: true, start: '08:00', end: '18:00' },
        thu: { open: true, start: '08:00', end: '18:00' },
        fri: { open: true, start: '08:00', end: '18:00' },
        sat: { open: true, start: '09:00', end: '13:00' },
        sun: { open: false }
    },
    services: ['general_consultation', 'dental', 'vaccination'],
    email: "clinicj@test.com",
  },
  {
    clinicName: 'Pasir Ris Health Clinic',
    contactNumber: '61110009',
    postalCode: '510446',
    address: '446 Pasir Ris Drive 6 #01-12',
    district: 'Pasir Ris',
    operatingHours: {
        mon: { open: true, start: '08:00', end: '18:00' },
        tue: { open: true, start: '08:00', end: '18:00' },
        wed: { open: true, start: '08:00', end: '18:00' },
        thu: { open: true, start: '08:00', end: '18:00' },
        fri: { open: true, start: '08:00', end: '18:00' },
        sat: { open: true, start: '09:00', end: '13:00' },
        sun: { open: false }
    },
    services: ['general_consultation', 'womens_health', 'pharmacy'],
    email: "clinick@test.com",
  },
  {
    clinicName: 'Ang Mo Kio Clinic',
    contactNumber: '61110010',
    postalCode: '560628',
    address: '628 Ang Mo Kio Ave 6 #01-05',
    district: 'Ang Mo Kio',
    operatingHours: {
        mon: { open: true, start: '08:00', end: '18:00' },
        tue: { open: true, start: '08:00', end: '18:00' },
        wed: { open: true, start: '08:00', end: '18:00' },
        thu: { open: true, start: '08:00', end: '18:00' },
        fri: { open: true, start: '08:00', end: '18:00' },
        sat: { open: true, start: '09:00', end: '13:00' },
        sun: { open: false }
    },
    services: ['general_consultation', 'chronic_disease', 'xray'],
    email: "clinicl@test.com",
  },
]


// seed patients
async function seedPatients() {
  console.log('Seeding patients...')
  for (const p of patients) {
    try {
      const credential = await createUserWithEmailAndPassword(auth, p.email, 'Abcde12345_')
      const uid = credential.user.uid
      await createPatient(uid, {
        fullName: p.fullName,
        email: p.email,
        mobileNumber: p.mobileNumber,
        postalCode: p.postalCode,
      })
    } catch (e) {
      if (e.code === 'auth/email-already-in-use') {
        console.log(`${p.email} already exists in database`)
      } else {
        console.error(`Failed to store ${p.fullName}`, e.message)
      }
    }
  }
}

// seed clinics
async function seedClinics() {
  console.log('Seeding clinics...')
  for (const c of clinics) {
    try {
      const credential = await createUserWithEmailAndPassword(auth, c.email, 'Abcde12345_')
      const uid = credential.user.uid

      await createClinic(uid, {
        clinicName: c.clinicName,
        contactNumber: c.contactNumber,
        postalCode: c.postalCode,
        district: c.district,
        operatingHours: c.operatingHours,
        services: c.services,
        email: c.email,
        address: c.address,
      })
    } catch (e) {
      if (e.code === 'auth/email-already-in-use') {
        console.log(`${c.email} already exists in database`)
      } else {
        console.error(`Failed to store ${c.clinicName}`, e.message)
      }
    }
  }
}

// seed both patient and clinic
export async function runSeed() {
  await seedPatients()
  await seedClinics()
  console.log('Seeding complete!')
}