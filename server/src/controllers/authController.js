const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { JWT_SECRET } = require('../middleware/auth');

function register(req, res) {
  const { name, email, password, student_id, department, phone } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'Vui lòng cung cấp đầy đủ họ tên, email và mật khẩu.' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.trim().toLowerCase());
  if (existing) {
    return res.status(400).json({ success: false, message: 'Email này đã được sử dụng. Vui lòng chọn email khác.' });
  }

  const passwordHash = bcrypt.hashSync(password, 10);
  const defaultAvatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name)}`;

  const result = db.prepare(`
    INSERT INTO users (name, email, password_hash, role, student_id, department, phone, avatar)
    VALUES (?, ?, ?, 'STUDENT', ?, ?, ?, ?)
  `).run(
    name.trim(),
    email.trim().toLowerCase(),
    passwordHash,
    student_id ? student_id.trim() : null,
    department ? department.trim() : null,
    phone ? phone.trim() : null,
    defaultAvatar
  );

  const newUser = db.prepare('SELECT id, name, email, role, student_id, department, phone, avatar FROM users WHERE id = ?').get(result.lastInsertRowid);
  const token = jwt.sign({ id: newUser.id, role: newUser.role }, JWT_SECRET, { expiresIn: '7d' });

  return res.status(201).json({
    success: true,
    message: 'Đăng ký tài khoản thành công!',
    token,
    user: newUser
  });
}

function login(req, res) {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Vui lòng nhập email và mật khẩu.' });
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.trim().toLowerCase());
  if (!user) {
    return res.status(401).json({ success: false, message: 'Email hoặc mật khẩu không chính xác.' });
  }

  const isMatch = bcrypt.compareSync(password, user.password_hash);
  if (!isMatch) {
    return res.status(401).json({ success: false, message: 'Email hoặc mật khẩu không chính xác.' });
  }

  const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

  const safeUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    student_id: user.student_id,
    department: user.department,
    phone: user.phone,
    avatar: user.avatar,
    created_at: user.created_at
  };

  return res.json({
    success: true,
    message: 'Đăng nhập thành công!',
    token,
    user: safeUser
  });
}

function getMe(req, res) {
  const userId = req.user.id;
  const user = db.prepare('SELECT id, name, email, role, student_id, department, phone, avatar, created_at FROM users WHERE id = ?').get(userId);

  // Calculate statistics
  const stats = db.prepare(`
    SELECT
      COUNT(*) AS total_bookings,
      SUM(CASE WHEN status = 'CONFIRMED' THEN 1 ELSE 0 END) AS confirmed_bookings,
      SUM(CASE WHEN status = 'CANCELLED' THEN 1 ELSE 0 END) AS cancelled_bookings
    FROM bookings
    WHERE user_id = ?
  `).get(userId);

  return res.json({
    success: true,
    user,
    stats: {
      total: stats.total_bookings || 0,
      confirmed: stats.confirmed_bookings || 0,
      cancelled: stats.cancelled_bookings || 0
    }
  });
}

function updateProfile(req, res) {
  const userId = req.user.id;
  const { name, student_id, department, phone, avatar } = req.body;

  db.prepare(`
    UPDATE users
    SET name = COALESCE(?, name),
        student_id = COALESCE(?, student_id),
        department = COALESCE(?, department),
        phone = COALESCE(?, phone),
        avatar = COALESCE(?, avatar)
    WHERE id = ?
  `).run(name, student_id, department, phone, avatar, userId);

  const updatedUser = db.prepare('SELECT id, name, email, role, student_id, department, phone, avatar, created_at FROM users WHERE id = ?').get(userId);

  return res.json({
    success: true,
    message: 'Cập nhật thông tin thành công!',
    user: updatedUser
  });
}

module.exports = {
  register,
  login,
  getMe,
  updateProfile
};
