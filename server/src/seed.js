const bcrypt = require('bcryptjs');
const db = require('./db');

function seed() {
  console.log('🌱 Seeding database...');

  // 1. Seed Slots
  const slotCount = db.prepare('SELECT COUNT(*) as count FROM slots').get().count;
  if (slotCount === 0) {
    const insertSlot = db.prepare('INSERT INTO slots (id, name, start_time, end_time, slot_order) VALUES (?, ?, ?, ?, ?)');
    const slots = [
      [1, 'Ca 1 (07:30 - 09:30)', '07:30', '09:30', 1],
      [2, 'Ca 2 (09:45 - 11:45)', '09:45', '11:45', 2],
      [3, 'Ca 3 (13:00 - 15:00)', '13:00', '15:00', 3],
      [4, 'Ca 4 (15:15 - 17:15)', '15:15', '17:15', 4],
      [5, 'Ca 5 (17:30 - 19:30)', '17:30', '19:30', 5],
      [6, 'Ca 6 (19:45 - 21:45)', '19:45', '21:45', 6],
    ];
    for (const slot of slots) {
      insertSlot.run(...slot);
    }
    console.log('✅ Seeded 6 time slots');
  }

  // 2. Seed Users
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (userCount === 0) {
    const insertUser = db.prepare(`
      INSERT INTO users (name, email, password_hash, role, student_id, department, phone, avatar)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const adminHash = bcrypt.hashSync('admin123', 10);
    const userHash = bcrypt.hashSync('user123', 10);

    insertUser.run(
      'Quản Trị Viên Thư Viện',
      'admin@studyroom.edu.vn',
      adminHash,
      'ADMIN',
      'ADM001',
      'Ban Quản Trị Trung Tâm Học Liệu',
      '0901234567',
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'
    );

    insertUser.run(
      'Nguyễn Văn An',
      'nguyenan@studyroom.edu.vn',
      userHash,
      'STUDENT',
      'SV20240101',
      'Khoa Công Nghệ Thông Tin',
      '0912345678',
      'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=300&q=80'
    );

    insertUser.run(
      'Trần Thị Bình',
      'tranthib@studyroom.edu.vn',
      userHash,
      'STUDENT',
      'SV20240202',
      'Khoa Kinh Tế & Quản Trị',
      '0923456789',
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80'
    );

    console.log('✅ Seeded 3 default users (1 Admin, 2 Students)');
  }

  // 3. Seed Rooms
  const roomCount = db.prepare('SELECT COUNT(*) as count FROM rooms').get().count;
  if (roomCount === 0) {
    const insertRoom = db.prepare(`
      INSERT INTO rooms (name, code, floor, capacity, image_url, description, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const sampleRooms = [
      [
        'P.101 - Không Gian Thảo Luận Alpha',
        'R-101',
        1,
        4,
        'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1000&q=80',
        'Phòng nhỏ yên tĩnh tràn ngập ánh sáng tự nhiên, thích hợp học nhóm 2-4 người, trang bị bảng kính và cổng sạc nhanh.',
        'AVAILABLE'
      ],
      [
        'P.102 - Không Gian Sáng Tạo Beta',
        'R-102',
        1,
        8,
        'https://images.unsplash.com/photo-1527192491265-7e15c55b1ed2?auto=format&fit=crop&w=1000&q=80',
        'Phòng thiết kế phong cách Nordic sáng sủa, view ban công xanh mát, bàn ghế module linh hoạt cho 6-8 người.',
        'AVAILABLE'
      ],
      [
        'P.103 - Phòng Nghiên Cứu Nhóm 1',
        'R-103',
        1,
        6,
        'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=1000&q=80',
        'Không gian cách âm tiêu chuẩn, ánh sáng chuẩn bảo vệ mắt, trang bị màn hình chia sẻ không dây.',
        'AVAILABLE'
      ],
      [
        'P.201 - Hội Thảo Chuyên Đề Seminar',
        'R-201',
        2,
        16,
        'https://images.unsplash.com/photo-1431540015161-0bf868a2d407?auto=format&fit=crop&w=1000&q=80',
        'Phòng hội thảo hiện đại sức chứa 16 người, trang bị màn hình tương tác thông minh và micro hội nghị không dây.',
        'AVAILABLE'
      ],
      [
        'P.202 - Studio Học Thuật Delta',
        'R-202',
        2,
        10,
        'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1000&q=80',
        'Phòng chuyên sâu cho đồ án công nghệ, nhiều cổng mạng Gigabit và hệ thống bàn ghế công thái học cao cấp.',
        'AVAILABLE'
      ],
      [
        'P.203 - Phòng Thảo Luận Gamma',
        'R-203',
        2,
        4,
        'https://images.unsplash.com/photo-1568992687947-868a62a9f521?auto=format&fit=crop&w=1000&q=80',
        'Phòng thảo luận riêng tư, tông màu gỗ sáng thanh lịch cho 2-4 bạn sinh viên cần sự tập trung cao độ.',
        'AVAILABLE'
      ],
      [
        'P.301 - Hội Trường Sinh Viên Đại Dương',
        'R-301',
        3,
        24,
        'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=1000&q=80',
        'Hội trường sinh viên ngập tràn ánh sáng với sức chứa 24 người, thích hợp cho câu lạc bộ học thuật và workshop.',
        'AVAILABLE'
      ],
      [
        'P.302 - Phòng Đa Phương Tiện Multimedia',
        'R-302',
        3,
        12,
        'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=1000&q=80',
        'Phòng đang được trang bị hệ thống âm thanh vòm và màn hình 4K siêu nét phục vụ nghiên cứu đa phương tiện.',
        'MAINTENANCE'
      ],
    ];

    for (const room of sampleRooms) {
      insertRoom.run(...room);
    }
    console.log('✅ Seeded 8 modern study rooms across Floors 1, 2, 3');
  }

  // 4. Seed Sample Bookings for today/tomorrow
  const bookingCount = db.prepare('SELECT COUNT(*) as count FROM bookings').get().count;
  if (bookingCount === 0) {
    const today = new Date().toISOString().split('T')[0];
    const insertBooking = db.prepare(`
      INSERT INTO bookings (user_id, room_id, booking_date, slot_id, status, notes)
      VALUES (?, ?, ?, ?, 'CONFIRMED', ?)
    `);

    // Let's seed an existing booking for Room 1 (P.101) on today slot 2 by Student 2
    // and Room 4 (P.201) on today slot 3 by Student 1
    insertBooking.run(3, 1, today, 2, 'Học nhóm ôn tập môn Kinh tế vĩ mô');
    insertBooking.run(2, 4, today, 3, 'Họp ban chủ nhiệm CLB Lập trình');

    console.log('✅ Seeded sample active bookings');
  }

  console.log('🚀 Database seeding completed!');
}

seed();
