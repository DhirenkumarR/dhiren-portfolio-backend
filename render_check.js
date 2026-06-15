import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from './src/models/User.js';
import ContactRequest from './src/models/ContactRequest.js';

dotenv.config();

const email = process.env.ADMIN_EMAIL || 'dhiren.m.rathod@gmail.com';
const password = process.env.ADMIN_PASSWORD || 'Dhiren792000@';

const test = async () => {
  // Connect to DB
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/dhiren_portfolio');
  console.log('Connected to DB');

  // Find an active request
  const request = await ContactRequest.findOne({ isArchived: { $ne: true } });
  if (!request) {
    console.log('No active inquiries found to test with!');
    await mongoose.disconnect();
    return;
  }
  const id = request._id.toString();
  console.log(`Testing with inquiry ID: ${id}, sender: ${request.name}`);

  // Login to get session cookie
  const loginForm = new URLSearchParams();
  loginForm.append('email', email);
  loginForm.append('password', password);

  const loginRes = await fetch('http://localhost:5000/admin/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: loginForm.toString(),
    redirect: 'manual'
  });

  const setCookie = loginRes.headers.get('set-cookie');
  if (!setCookie) {
    console.error('Login failed! Response headers:', loginRes.headers);
    await mongoose.disconnect();
    return;
  }
  const tokenCookie = setCookie.split(';')[0];
  console.log('Logged in successfully, session cookie obtained.');

  // Test Archive POST request via HTTP
  console.log(`\nSending POST to archive request: /admin/contact/${id}/archive`);
  const archiveRes = await fetch(`http://localhost:5000/admin/contact/${id}/archive`, {
    method: 'POST',
    headers: {
      'Cookie': tokenCookie,
      'Accept': 'application/json'
    }
  });

  console.log('Status code:', archiveRes.status);
  const archiveResult = await archiveRes.json();
  console.log('Response body:', archiveResult);

  // Check in DB
  const updatedRequest = await ContactRequest.findById(id);
  console.log('Is archived in DB now?', updatedRequest.isArchived);

  // Test Unarchive POST request via HTTP
  console.log(`\nSending POST to restore request: /admin/contact/${id}/unarchive`);
  const restoreRes = await fetch(`http://localhost:5000/admin/contact/${id}/unarchive`, {
    method: 'POST',
    headers: {
      'Cookie': tokenCookie,
      'Accept': 'application/json'
    }
  });

  console.log('Status code:', restoreRes.status);
  const restoreResult = await restoreRes.json();
  console.log('Response body:', restoreResult);

  // Check in DB
  const finalRequest = await ContactRequest.findById(id);
  console.log('Is archived in DB now?', finalRequest.isArchived);

  await mongoose.disconnect();
};

test().catch(async (err) => {
  console.error(err);
  await mongoose.disconnect();
});
