// functions/src/Reseller/demoSeedData.ts
// Canonical sample employee set for reseller demo organizations.
// Seeded on demo deploy and re-seeded on demo reset.
//
// Every employee here is fictional and used only to give a prospect
// a working system to evaluate. Two default departments already exist
// (Operations + Admin) — these references match DEFAULT_DEPARTMENTS.

export interface DemoSeedEmployee {
  employeeNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  whatsappNumber?: string;
  department: 'Operations' | 'Admin';
  position: string;
  contractType: 'permanent' | 'contract' | 'temporary';
  // Delivery preferences
  preferredMethod: 'email' | 'whatsapp' | 'printed';
}

export const DEMO_SAMPLE_EMPLOYEES: DemoSeedEmployee[] = [
  {
    employeeNumber: 'EMP-001',
    firstName: 'Thabo',
    lastName: 'Mokoena',
    email: 'thabo.mokoena@demo.local',
    phoneNumber: '+27 82 555 0101',
    whatsappNumber: '+27 82 555 0101',
    department: 'Operations',
    position: 'Shift Supervisor',
    contractType: 'permanent',
    preferredMethod: 'whatsapp'
  },
  {
    employeeNumber: 'EMP-002',
    firstName: 'Lerato',
    lastName: 'Dlamini',
    email: 'lerato.dlamini@demo.local',
    phoneNumber: '+27 83 555 0102',
    department: 'Operations',
    position: 'Warehouse Assistant',
    contractType: 'permanent',
    preferredMethod: 'email'
  },
  {
    employeeNumber: 'EMP-003',
    firstName: 'Sipho',
    lastName: 'Ndlovu',
    email: 'sipho.ndlovu@demo.local',
    phoneNumber: '+27 71 555 0103',
    whatsappNumber: '+27 71 555 0103',
    department: 'Operations',
    position: 'Driver',
    contractType: 'permanent',
    preferredMethod: 'whatsapp'
  },
  {
    employeeNumber: 'EMP-004',
    firstName: 'Nomvula',
    lastName: 'Khumalo',
    email: 'nomvula.khumalo@demo.local',
    phoneNumber: '+27 84 555 0104',
    department: 'Operations',
    position: 'Quality Controller',
    contractType: 'permanent',
    preferredMethod: 'email'
  },
  {
    employeeNumber: 'EMP-005',
    firstName: 'Pieter',
    lastName: 'van der Merwe',
    email: 'pieter.vdm@demo.local',
    phoneNumber: '+27 82 555 0105',
    whatsappNumber: '+27 82 555 0105',
    department: 'Operations',
    position: 'Machine Operator',
    contractType: 'contract',
    preferredMethod: 'email'
  },
  {
    employeeNumber: 'EMP-006',
    firstName: 'Ayesha',
    lastName: 'Patel',
    email: 'ayesha.patel@demo.local',
    phoneNumber: '+27 76 555 0106',
    department: 'Operations',
    position: 'Stock Clerk',
    contractType: 'permanent',
    preferredMethod: 'email'
  },
  {
    employeeNumber: 'EMP-007',
    firstName: 'Johan',
    lastName: 'Botha',
    email: 'johan.botha@demo.local',
    phoneNumber: '+27 83 555 0107',
    whatsappNumber: '+27 83 555 0107',
    department: 'Admin',
    position: 'HR Officer',
    contractType: 'permanent',
    preferredMethod: 'email'
  },
  {
    employeeNumber: 'EMP-008',
    firstName: 'Zanele',
    lastName: 'Mthembu',
    email: 'zanele.mthembu@demo.local',
    phoneNumber: '+27 72 555 0108',
    department: 'Admin',
    position: 'Accounts Clerk',
    contractType: 'permanent',
    preferredMethod: 'email'
  },
  {
    employeeNumber: 'EMP-009',
    firstName: 'Bongani',
    lastName: 'Sithole',
    email: 'bongani.sithole@demo.local',
    phoneNumber: '+27 81 555 0109',
    whatsappNumber: '+27 81 555 0109',
    department: 'Admin',
    position: 'Reception',
    contractType: 'temporary',
    preferredMethod: 'whatsapp'
  },
  {
    employeeNumber: 'EMP-010',
    firstName: 'Michelle',
    lastName: 'Pedersen',
    email: 'michelle.pedersen@demo.local',
    phoneNumber: '+27 82 555 0110',
    department: 'Admin',
    position: 'Office Manager',
    contractType: 'permanent',
    preferredMethod: 'email'
  }
];
