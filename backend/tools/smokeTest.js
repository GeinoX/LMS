const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

const BASE = process.env.BASE_URL || 'http://localhost:5000';

async function run() {
  console.log('Smoke test starting. BASE =', BASE);

  try {
    console.log('\n1) GET /');
    const r1 = await axios.get(`${BASE}/`).catch(e => e.response || e);
    console.log('status:', r1.status || 'no-status', 'data:', r1.data || r1.statusText || r1);
  } catch (err) {
    console.error('GET / failed:', err.message || err);
  }

  try {
    console.log('\n2) GET /AllSubjects/test (expect 400 invalid id)');
    const r2 = await axios.get(`${BASE}/AllSubjects/test`).catch(e => e.response || e);
    console.log('status:', r2.status || 'no-status', 'data:', r2.data || r2.statusText || r2);
  } catch (err) {
    console.error('GET /AllSubjects/test failed:', err.message || err);
  }

  try {
    console.log('\n3) POST /AdminReg (create a test admin)');
    const payload = { name: 'Smoke Admin', schoolName: 'SmokeSchool', email: 'smoke@example.com', password: 'password', role: 'Admin' };
    const r3 = await axios.post(`${BASE}/AdminReg`, payload).catch(e => e.response || e);
    console.log('status:', r3.status || 'no-status', 'data:', r3.data || r3.statusText || r3);
  } catch (err) {
    console.error('POST /AdminReg failed:', err.message || err);
  }

  try {
    console.log('\n4) POST /SclassCreate (create a class) - requires admin id from previous step');
    console.log('   If AdminReg failed, skip class creation.');
  } catch (err) {
    console.error('SclassCreate step skipped due to previous errors');
  }

  console.log('\nSmoke test finished.');
}

run();
