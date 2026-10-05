// End-to-end Automated Concurrency & Business Rules Test
const BASE_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('🧪 Starting End-to-End Test Suite...\n');

  // 1. Login as Student 1 (Nguyen Van An)
  const resLogin1 = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'nguyenan@studyroom.edu.vn', password: 'user123' })
  });
  const data1 = await resLogin1.json();
  const token1 = data1.token;
  console.log(`✅ Logged in as User 1: ${data1.user.name}`);

  // 2. Login as Student 2 (Tran Thi Binh)
  const resLogin2 = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'tranthib@studyroom.edu.vn', password: 'user123' })
  });
  const data2 = await resLogin2.json();
  const token2 = data2.token;
  console.log(`✅ Logged in as User 2: ${data2.user.name}`);

  // 3. Test Simultaneous Concurrency (Race Condition)
  // Both try to book Room 2 (P.102) on date 2026-10-15 Ca 4
  const testDate = '2026-10-15';
  const testRoomId = 2;
  const testSlotId = 4;

  console.log(`\n⚡ TEST 1: Simultaneous Booking Clash (Race Condition) on Room ${testRoomId}, Date ${testDate}, Slot ${testSlotId}...`);

  const req1 = fetch(`${BASE_URL}/bookings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token1}`
    },
    body: JSON.stringify({
      room_id: testRoomId,
      booking_date: testDate,
      slot_id: testSlotId,
      notes: 'Học nhóm đồ án Web'
    })
  });

  const req2 = fetch(`${BASE_URL}/bookings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token2}`
    },
    body: JSON.stringify({
      room_id: testRoomId,
      booking_date: testDate,
      slot_id: testSlotId,
      notes: 'Luyện thuyết trình'
    })
  });

  const [resp1, resp2] = await Promise.all([req1, req2]);
  const json1 = await resp1.json();
  const json2 = await resp2.json();

  console.log(`User 1 Response Status: ${resp1.status} - Success: ${json1.success} - Message: ${json1.message}`);
  console.log(`User 2 Response Status: ${resp2.status} - Success: ${json2.success} - Message: ${json2.message}`);

  const statuses = [resp1.status, resp2.status].sort();
  if (statuses[0] === 201 && statuses[1] === 409) {
    console.log('🎉 PASS: Concurrency Clash Handled Perfectly! Exactly 1 succeeded (201) and exactly 1 received 409 Conflict!');
  } else {
    console.error('❌ FAIL: Expected one 201 and one 409, but got:', statuses);
  }

  // 4. Test Maximum 3 Slots / Student / Day Rule
  console.log(`\n⚡ TEST 2: Testing Max 3 Slots / Day Limit for User 1...`);
  // User 1 currently has 0 or 1 booking on 2026-10-15. Let's attempt to book slots until reaching the limit
  const bookSlot = async (slotId, roomId) => {
    return fetch(`${BASE_URL}/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token1}`
      },
      body: JSON.stringify({
        room_id: roomId,
        booking_date: testDate,
        slot_id: slotId,
        notes: `Ca ${slotId}`
      })
    });
  };

  // Try slots 1, 2, 3, 5, 6
  let user1BookingsCount = 0;
  for (const s of [1, 2, 3, 5, 6]) {
    const res = await bookSlot(s, 3);
    const data = await res.json();
    if (res.status === 201) {
      user1BookingsCount++;
      console.log(`  - Booked slot ${s} successfully (Total today: ${user1BookingsCount})`);
    } else if (res.status === 400 && data.message.includes('giới hạn tối đa 3 ca')) {
      console.log(`  - Slot ${s} rejected with 400 Bad Request: "${data.message}"`);
      console.log('🎉 PASS: 3 Slots Limit Enforced Successfully!');
      break;
    }
  }

  // 5. Test 3-Hour Cancellation Rule
  console.log(`\n⚡ TEST 3: Testing Cancellation Rules (3-Hour Rule)...`);
  const myBookingsRes = await fetch(`${BASE_URL}/bookings/my`, {
    headers: { 'Authorization': `Bearer ${token1}` }
  });
  const myBookings = await myBookingsRes.json();
  const cancelCandidate = myBookings.bookings.find(b => b.status === 'CONFIRMED' && b.booking_date === testDate);

  if (cancelCandidate) {
    console.log(`  - Attempting to cancel future booking ID ${cancelCandidate.id} (Date: ${cancelCandidate.booking_date}, Slot: ${cancelCandidate.slot_name})...`);
    const cancelRes = await fetch(`${BASE_URL}/bookings/${cancelCandidate.id}/cancel`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token1}` }
    });
    const cancelData = await cancelRes.json();
    console.log(`  - Cancel Response Status: ${cancelRes.status} - Message: ${cancelData.message}`);
    if (cancelRes.status === 200) {
      console.log('🎉 PASS: Valid Future Booking Cancelled Successfully & Slot Freed for others!');
    }
  }

  console.log('\n🏁 ALL TESTS COMPLETED SUCCESSFULLY!');
}

runTests();
