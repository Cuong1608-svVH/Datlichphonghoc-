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
        'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80',
        'Phòng nhỏ yên tĩnh, thích hợp học nhóm 2-4 người, trang bị bảng kính và ổ cắm tiện lợi.',
        'AVAILABLE'
      ],
      [
        'P.102 - Không Gian Sáng Tạo Beta',
        'R-102',
        1,
        8,
        'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80',
        'Phòng thiết kế mở, view sân trường thoáng đãng, bàn ghế module linh hoạt cho 6-8 người.',
        'AVAILABLE'
      ],
      [
        'P.103 - Phòng Nghiên Cứu Nhóm 1',
        'R-103',
        1,
        6,
        'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=800&q=80',
        'Trang bị hệ thống cách âm chuyên sâu, phù hợp luyện thuyết trình và phỏng vấn học bổng.',
        'AVAILABLE'
      ],
      [
        'P.201 - Hội Thảo Chuyên Đề Seminar',
        'R-201',
        2,
        16,
        'https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&w=800&q=80',
        'Phòng hội thảo lớn sức chứa 16 người, trang bị màn hình tương tác thông minh và micro hội nghị.',
        'AVAILABLE'
      ],
      [
        'P.202 - Studio Học Thuật Delta',
        'R-202',
        2,
        10,
        'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=800&q=80',
        'Phòng chuyên sâu cho đồ án công nghệ, nhiều cổng mạng tốc độ cao và ánh sáng chuẩn công thái học.',
        'AVAILABLE'
      ],
      [
        'P.203 - Phòng Thảo Luận Gamma',
        'R-203',
        2,
        4,
        'https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&w=800&q=80',
        'Phòng nhỏ riêng tư cho 2-4 bạn sinh viên cần sự tập trung cao độ ôn thi hoặc làm bài tập nhóm.',
        'AVAILABLE'
      ],
      [
        'P.301 - Hội Trường Sinh Viên Đại Dương',
        'R-301',
        3,
        24,
        'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80',
        'Không gian siêu rộng sức chứa tới 24 người, thích hợp cho câu lạc bộ học thuật và workshop.',
        'AVAILABLE'
      ],
      [
        'P.302 - Phòng Đa Phương Tiện Multimedia',
        'R-302',
        3,
        12,
        'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=800&q=80',
        'Phòng đang được nâng cấp hệ thống âm thanh vòm và máy chiếu 4K.',
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
