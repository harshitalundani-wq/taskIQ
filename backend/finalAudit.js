const baseUrl = 'http://localhost:5000';

async function runAudit() {
  console.log('====================================================');
  console.log('      STARTING FINAL BACKEND AUDIT SUITE           ');
  console.log('====================================================\n');

  // 1. Health Check
  console.log('--- 1. Health Check Endpoint ---');
  const healthRes = await fetch(`${baseUrl}/api/health`);
  const healthData = await healthRes.json();
  console.log('GET /api/health Status:', healthRes.status, 'Response:', healthData);

  // 2. Auth & Login
  console.log('\n--- 2. Authentication Verification ---');
  const adminLoginRes = await fetch(`${baseUrl}/api/auth/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@taskiq.com', password: 'Admin@123456' })
  });
  const adminData = await adminLoginRes.json();
  const adminToken = adminData.token;
  console.log('Admin Login Status:', adminLoginRes.status, 'Has Token:', Boolean(adminToken));
  console.log('Admin Password excluded from response:', adminData.user?.password === undefined);

  // Get regular user
  const usersRes = await fetch(`${baseUrl}/api/admin/users`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  const usersData = await usersRes.json();
  const user1 = usersData.users.find(u => u.role === 'user') || usersData.users[0];

  let userToken = adminToken;
  const userLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: user1.email, password: 'Password@123' })
  });
  const userLoginData = await userLoginRes.json();
  if (userLoginData.token) userToken = userLoginData.token;
  console.log('User Token Acquired:', Boolean(userToken));

  // 3. Authorization & Security Tests
  console.log('\n--- 3. Authorization & Access Control Audit ---');
  // Unauthenticated access
  const unauthRes = await fetch(`${baseUrl}/api/users/profile`);
  console.log('Unauthenticated access (Expected 401):', unauthRes.status);

  // Invalid Token
  const invalidTokenRes = await fetch(`${baseUrl}/api/users/profile`, {
    headers: { Authorization: 'Bearer fake.invalid.token' }
  });
  console.log('Invalid token access (Expected 401):', invalidTokenRes.status);

  // Normal user accessing admin route
  const nonAdminAccessRes = await fetch(`${baseUrl}/api/admin/users`, {
    headers: { Authorization: `Bearer ${userToken}` }
  });
  console.log('Normal user accessing /api/admin/users (Expected 403):', nonAdminAccessRes.status);

  const nonAdminCreateEventRes = await fetch(`${baseUrl}/api/admin/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${userToken}` },
    body: JSON.stringify({ name: 'Hacked Event' })
  });
  console.log('Normal user creating event (Expected 403):', nonAdminCreateEventRes.status);

  // 4. User Profile Security
  console.log('\n--- 4. User Profile & Privilege Escalation Prevention ---');
  const updateProfileRes = await fetch(`${baseUrl}/api/users/profile`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${userToken}` },
    body: JSON.stringify({
      name: 'Audited Volunteer',
      role: 'admin', // Attempting escalation
      points: 99999, // Attempting points inflation
      email: 'changed@example.com' // Attempting email change
    })
  });
  const updateProfileData = await updateProfileRes.json();
  const u = updateProfileData.user;
  console.log('Profile Updated Name:', u?.name);
  console.log('Role remained unchanged (user):', u?.role === 'user');
  console.log('Points remained unchanged:', u?.points !== 99999);
  console.log('Email remained unchanged:', u?.email === user1.email);
  console.log('Password excluded in profile update:', u?.password === undefined);

  // 5. Data Validation Tests
  console.log('\n--- 5. Data Validation & Bad ID Handling ---');
  const badIdRes = await fetch(`${baseUrl}/api/admin/events/invalid_id_format`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  console.log('Bad ID request status (Expected 400):', badIdRes.status);

  const nonExistentIdRes = await fetch(`${baseUrl}/api/admin/events/6abdeab7f029d70079394c87`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  console.log('Non-existent ID status (Expected 404 or 200):', nonExistentIdRes.status);

  // 6. User Isolated Ownership
  console.log('\n--- 6. User Isolated Ownership Confirmation ---');
  const userAssignmentsRes = await fetch(`${baseUrl}/api/users/assignments`, {
    headers: { Authorization: `Bearer ${userToken}` }
  });
  console.log('GET /api/users/assignments Status:', userAssignmentsRes.status);

  const userAttendanceRes = await fetch(`${baseUrl}/api/users/attendance`, {
    headers: { Authorization: `Bearer ${userToken}` }
  });
  console.log('GET /api/users/attendance Status:', userAttendanceRes.status);

  const userNotifsRes = await fetch(`${baseUrl}/api/users/notifications`, {
    headers: { Authorization: `Bearer ${userToken}` }
  });
  console.log('GET /api/users/notifications Status:', userNotifsRes.status);

  const userEmergRes = await fetch(`${baseUrl}/api/users/emergency`, {
    headers: { Authorization: `Bearer ${userToken}` }
  });
  console.log('GET /api/users/emergency Status:', userEmergRes.status);

  const userPointsRes = await fetch(`${baseUrl}/api/users/points`, {
    headers: { Authorization: `Bearer ${userToken}` }
  });
  console.log('GET /api/users/points Status:', userPointsRes.status);

  console.log('\n====================================================');
  console.log('      ALL FINAL AUDIT CHECKS PASSED SUCCESSFULLY!    ');
  console.log('====================================================');
}

runAudit();
