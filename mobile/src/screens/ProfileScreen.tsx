import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { theme } from '../styles/theme';
import { useAuth } from '../context/AuthContext';
import { api, getBackendUrl, setBackendUrl, resetBackendUrl } from '../api/client';

export const ProfileScreen: React.FC = () => {
  const { user, login, register, logout, refreshUser } = useAuth();

  // Auth form state if not logged in
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [department, setDepartment] = useState('');
  const [phone, setPhone] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Server URL Configuration & Diagnostics
  const [currentUrl, setCurrentUrl] = useState('');
  const [customInputUrl, setCustomInputUrl] = useState('');
  const [showConfig, setShowConfig] = useState(false);
  const [pingResult, setPingResult] = useState<string | null>(null);
  const [pingLoading, setPingLoading] = useState(false);

  useEffect(() => {
    getBackendUrl().then((u) => {
      setCurrentUrl(u);
      setCustomInputUrl(u);
    });
  }, []);

  const handlePing = async () => {
    setPingLoading(true);
    setPingResult('Đang kiểm tra...');
    const res = await api.ping();
    setPingLoading(false);
    if (res.ok) {
      setPingResult(`Kết nối tốt (${res.timeMs}ms)`);
    } else {
      setPingResult(`Lỗi kết nối (${res.timeMs}ms): ${res.error}`);
    }
  };

  const handleSaveCustomUrl = async () => {
    if (!customInputUrl.trim()) return;
    await setBackendUrl(customInputUrl.trim());
    const u = await getBackendUrl();
    setCurrentUrl(u);
    setPingResult(null);
    Alert.alert('Thành công', 'Đã lưu URL máy chủ mới!');
    handlePing();
  };

  const handleResetUrl = async () => {
    await resetBackendUrl();
    const u = await getBackendUrl();
    setCurrentUrl(u);
    setCustomInputUrl(u);
    setPingResult(null);
    Alert.alert('Thành công', 'Đã đặt lại về Cloudflare Tunnel mặc định');
    handlePing();
  };

  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [editStudentId, setEditStudentId] = useState(user?.student_id || '');
  const [editDepartment, setEditDepartment] = useState(user?.department || '');
  const [editPhone, setEditPhone] = useState(user?.phone || '');
  const [saveLoading, setSaveLoading] = useState(false);

  const handleAuthSubmit = async () => {
    if (!email || !password) {
      Alert.alert('Lỗi', 'Vui lòng nhập email và mật khẩu');
      return;
    }

    setAuthLoading(true);
    if (isLoginMode) {
      const res = await login({ email, password });
      setAuthLoading(false);
      if (!res.success) {
        Alert.alert('Đăng nhập thất bại', res.message || 'Sai email hoặc mật khẩu');
      }
    } else {
      if (!name) {
        Alert.alert('Lỗi', 'Vui lòng nhập họ và tên');
        setAuthLoading(false);
        return;
      }
      const res = await register({
        name,
        email,
        password,
        student_id: studentId,
        department,
        phone,
      });
      setAuthLoading(false);
      if (!res.success) {
        Alert.alert('Đăng ký thất bại', res.message || 'Không thể tạo tài khoản');
      }
    }
  };

  const handleSaveProfile = async () => {
    setSaveLoading(true);
    try {
      const res = await api.updateProfile({
        name: editName,
        student_id: editStudentId,
        department: editDepartment,
        phone: editPhone,
      });
      if (res.success) {
        await refreshUser();
        setIsEditing(false);
        Alert.alert('Thành công', 'Đã cập nhật hồ sơ cá nhân.');
      } else {
        Alert.alert('Lỗi', res.message || 'Cập nhật thất bại');
      }
    } catch (err) {
      Alert.alert('Lỗi', 'Không thể kết nối máy chủ');
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {user ? (
          /* Profile Logged In View */
          <View>
            <View style={styles.profileCard}>
              <Image
                source={{ uri: user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=2563eb&color=fff&bold=true` }}
                style={styles.avatar}
              />
              <Text style={styles.userName}>{user.name}</Text>
              <Text style={styles.userEmail}>{user.email}</Text>
              <View style={[styles.roleBadge, user.role === 'ADMIN' ? styles.roleAdmin : styles.roleStudent]}>
                <Text style={styles.roleText}>{user.role === 'ADMIN' ? 'Ban Quản Trị' : 'Sinh Viên'}</Text>
              </View>

              <View style={styles.infoTable}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Mã số SV:</Text>
                  <Text style={styles.infoVal}>{user.student_id || 'Chưa cập nhật'}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Khoa / Ngành:</Text>
                  <Text style={styles.infoVal}>{user.department || 'Chưa cập nhật'}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Số điện thoại:</Text>
                  <Text style={styles.infoVal}>{user.phone || 'Chưa cập nhật'}</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.editBtn}
                onPress={() => {
                  setIsEditing(!isEditing);
                  setEditName(user.name);
                  setEditStudentId(user.student_id || '');
                  setEditDepartment(user.department || '');
                  setEditPhone(user.phone || '');
                }}
              >
                <Text style={styles.editBtnText}>{isEditing ? 'Đóng form sửa' : 'Chỉnh sửa thông tin'}</Text>
              </TouchableOpacity>
            </View>

            {/* Edit Drawer Form */}
            {isEditing && (
              <View style={styles.editCard}>
                <Text style={styles.editTitle}>Cập Nhật Thông Tin</Text>
                <Text style={styles.label}>Họ và tên</Text>
                <TextInput style={styles.input} value={editName} onChangeText={setEditName} />

                <Text style={styles.label}>Mã số sinh viên (MSSV)</Text>
                <TextInput style={styles.input} value={editStudentId} onChangeText={setEditStudentId} />

                <Text style={styles.label}>Khoa / Viện đào tạo</Text>
                <TextInput style={styles.input} value={editDepartment} onChangeText={setEditDepartment} />

                <Text style={styles.label}>Số điện thoại</Text>
                <TextInput style={styles.input} value={editPhone} onChangeText={setEditPhone} keyboardType="phone-pad" />

                <TouchableOpacity style={styles.saveBtn} onPress={handleSaveProfile} disabled={saveLoading}>
                  {saveLoading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.saveBtnText}>Lưu Thay Đổi</Text>}
                </TouchableOpacity>
              </View>
            )}

            {/* Logout button */}
            <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
              <Text style={styles.logoutBtnText}>Đăng Xuất Tài Khoản</Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* Login / Register Card */
          <View style={styles.authCard}>
            <Text style={styles.authTitle}>{isLoginMode ? 'Đăng Nhập Sinh Viên' : 'Đăng Ký Tài Khoản'}</Text>
            <Text style={styles.authSubtitle}>
              {isLoginMode ? 'Đăng nhập để đặt phòng học và theo dõi lịch' : 'Tạo tài khoản để sử dụng dịch vụ thư viện'}
            </Text>

            {!isLoginMode && (
              <>
                <Text style={styles.label}>Họ và tên *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Lê Hoàng Nam"
                  placeholderTextColor={theme.colors.textMuted}
                  value={name}
                  onChangeText={setName}
                />
              </>
            )}

            <Text style={styles.label}>Email trường *</Text>
            <TextInput
              style={styles.input}
              placeholder="name@studyroom.edu.vn"
              placeholderTextColor={theme.colors.textMuted}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <Text style={styles.label}>Mật khẩu *</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor={theme.colors.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            {!isLoginMode && (
              <>
                <Text style={styles.label}>Mã số sinh viên (MSSV)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="SV2024..."
                  placeholderTextColor={theme.colors.textMuted}
                  value={studentId}
                  onChangeText={setStudentId}
                />

                <Text style={styles.label}>Khoa / Ngành</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Khoa Công Nghệ Thông Tin"
                  placeholderTextColor={theme.colors.textMuted}
                  value={department}
                  onChangeText={setDepartment}
                />

                <Text style={styles.label}>Số điện thoại</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0987654321"
                  placeholderTextColor={theme.colors.textMuted}
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                />
              </>
            )}

            <TouchableOpacity style={styles.submitAuthBtn} onPress={handleAuthSubmit} disabled={authLoading}>
              {authLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitAuthText}>{isLoginMode ? 'Đăng Nhập' : 'Tạo Tài Khoản'}</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.switchAuthBtn}
              onPress={() => setIsLoginMode(!isLoginMode)}
            >
              <Text style={styles.switchAuthText}>
                {isLoginMode ? 'Chưa có tài khoản? Đăng ký ngay' : 'Đã có tài khoản? Đăng nhập'}
              </Text>
            </TouchableOpacity>

            {/* Server Connection Status & Config */}
            <View style={styles.serverWidget}>
              <View style={styles.serverHeader}>
                <View style={styles.serverStatusDot} />
                <Text style={styles.serverTitle}>Máy chủ Backend (Cloudflare)</Text>
                <TouchableOpacity
                  style={styles.pingBtn}
                  onPress={handlePing}
                  disabled={pingLoading}
                >
                  {pingLoading ? (
                    <ActivityIndicator size="small" color="#93C5FD" />
                  ) : (
                    <Text style={styles.pingBtnText}>⚡ Kiểm tra</Text>
                  )}
                </TouchableOpacity>
              </View>

              <Text style={styles.serverUrlText} numberOfLines={1}>
                {currentUrl || 'Đang nạp URL...'}
              </Text>

              {pingResult && (
                <Text style={[styles.pingResultText, pingResult.includes('tốt') ? styles.pingSuccess : styles.pingError]}>
                  {pingResult}
                </Text>
              )}

              <TouchableOpacity
                style={styles.toggleConfigBtn}
                onPress={() => setShowConfig(!showConfig)}
              >
                <Text style={styles.toggleConfigText}>
                  {showConfig ? 'Thu gọn cấu hình' : 'Tùy chỉnh URL máy chủ'}
                </Text>
              </TouchableOpacity>

              {showConfig && (
                <View style={styles.configBox}>
                  <Text style={styles.configLabel}>URL máy chủ Backend:</Text>
                  <TextInput
                    style={styles.configInput}
                    value={customInputUrl}
                    onChangeText={setCustomInputUrl}
                    autoCapitalize="none"
                    autoCorrect={false}
                    placeholder="https://... hoặc http://10.60.x.x:5000"
                    placeholderTextColor={theme.colors.textMuted}
                  />
                  <View style={styles.configBtnRow}>
                    <TouchableOpacity style={styles.saveUrlBtn} onPress={handleSaveCustomUrl}>
                      <Text style={styles.saveUrlBtnText}>Lưu URL</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.resetUrlBtn} onPress={handleResetUrl}>
                      <Text style={styles.resetUrlBtnText}>Mặc định</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bgPrimary,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: theme.radius.lg,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    marginBottom: 10,
  },
  userName: {
    color: theme.colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
  },
  userEmail: {
    color: theme.colors.textMuted,
    fontSize: 13,
    marginTop: 2,
  },
  roleBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: theme.radius.full,
    marginTop: 8,
  },
  roleAdmin: {
    backgroundColor: 'rgba(236, 72, 153, 0.2)',
  },
  roleStudent: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  roleText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  infoTable: {
    width: '100%',
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoLabel: {
    color: theme.colors.textMuted,
    fontSize: 13,
  },
  infoVal: {
    color: theme.colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  editBtn: {
    marginTop: 14,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: theme.radius.sm,
  },
  editBtnText: {
    color: theme.colors.primaryLight,
    fontSize: 12,
    fontWeight: '700',
  },
  editCard: {
    backgroundColor: theme.colors.bgCard,
    padding: 16,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 16,
  },
  editTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 12,
  },
  label: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
    marginTop: 8,
  },
  input: {
    backgroundColor: theme.colors.bgInput,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    color: '#FFFFFF',
    padding: 10,
    fontSize: 14,
  },
  saveBtn: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 12,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    marginTop: 16,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  logoutBtn: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingVertical: 12,
    borderRadius: theme.radius.md,
    alignItems: 'center',
  },
  logoutBtnText: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '700',
  },
  authCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: theme.radius.lg,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  authTitle: {
    color: theme.colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  authSubtitle: {
    color: theme.colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  submitAuthBtn: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 14,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    marginTop: 18,
  },
  submitAuthText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  switchAuthBtn: {
    alignItems: 'center',
    marginTop: 14,
  },
  switchAuthText: {
    color: theme.colors.primaryLight,
    fontSize: 12,
    fontWeight: '600',
  },
  serverWidget: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  serverHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  serverStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginRight: 6,
  },
  serverTitle: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  pingBtn: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  pingBtnText: {
    color: '#93C5FD',
    fontSize: 11,
    fontWeight: '700',
  },
  serverUrlText: {
    color: '#64748B',
    fontSize: 11,
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  pingResultText: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
    marginBottom: 6,
  },
  pingSuccess: {
    color: '#34D399',
  },
  pingError: {
    color: '#F87171',
  },
  toggleConfigBtn: {
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  toggleConfigText: {
    color: theme.colors.primaryLight,
    fontSize: 11,
    fontWeight: '600',
  },
  configBox: {
    marginTop: 10,
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  configLabel: {
    color: theme.colors.textMuted,
    fontSize: 11,
    marginBottom: 4,
  },
  configInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    color: '#0F172A',
    fontSize: 12,
    marginBottom: 8,
  },
  configBtnRow: {
    flexDirection: 'row',
    gap: 8,
  },
  saveUrlBtn: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  saveUrlBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  resetUrlBtn: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  resetUrlBtnText: {
    color: '#475569',
    fontSize: 11,
    fontWeight: '600',
  },
});
