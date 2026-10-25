import { useCallback, useEffect, useState } from 'react'
import { brand } from '../../data/content'
import { authRequest } from '../../services/auth'
import Icon from '../ui/Icon'
import { exportUsersToExcel, downloadExcelTemplate, parseUsersFromExcel } from '../../utils/excel'
import './Portal.css'

const userNavigation = [
  { id: 'account', label: 'Profil Saya', icon: 'users' },
  { id: 'settings', label: 'Grup WhatsApp', icon: 'chat' },
]
const adminNavigation = [
  { id: 'account', label: 'Info akun', icon: 'users' },
  { id: 'settings', label: 'Grup WhatsApp', icon: 'chat' },
  { id: 'users', label: 'Kelola akun', icon: 'layers' },
  { id: 'logins', label: 'Riwayat login', icon: 'chat' },
]

function formatDate(value, withTime = false) {
  if (!value) return 'Belum pernah'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Belum pernah'
  return new Intl.DateTimeFormat('id-ID', withTime
    ? { dateStyle: 'medium', timeStyle: 'short' }
    : { day: 'numeric', month: 'short', year: 'numeric' }).format(date)
}

const emptyUserForm = { name: '', email: '', phone: '', password: '', role: 'user' }

export default function DashboardPage({ role, user, token, onLogout, onLandingPage, onUserUpdated }) {
  const isAdmin = role === 'admin'
  const navigation = isAdmin ? adminNavigation : userNavigation
  const [activePage, setActivePage] = useState(isAdmin ? 'users' : 'account')
  const [overview, setOverview] = useState(null)
  const [users, setUsers] = useState([])
  const [logins, setLogins] = useState([])
  const [settings, setSettings] = useState({ whatsappGroupUrl: '', adminEmail: 'kreatifest.ind@gmail.com' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const [userForm, setUserForm] = useState(emptyUserForm)
  const [editingUserId, setEditingUserId] = useState(null)
  const [whatsappUrl, setWhatsappUrl] = useState('')
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '' })
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
  })
  const [editingProfile, setEditingProfile] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState('')
  const [deleteUserConfirmation, setDeleteUserConfirmation] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [exportRole, setExportRole] = useState('all')
  const [exporting, setExporting] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [importFile, setImportFile] = useState(null)
  const [importPreview, setImportPreview] = useState(null)
  const [importing, setImporting] = useState(false)
  const [importError, setImportError] = useState('')

  const sectionTitle = navigation.find((item) => item.id === activePage)?.label || 'Ringkasan'
  const reloadData = () => {
    setLoading(true)
    setError('')
    setReloadKey((key) => key + 1)
  }
  const request = useCallback(
    (path, options = {}) => authRequest(path, { token, ...options }),
    [token],
  )

  useEffect(() => {
    let active = true
    const dataRequest = isAdmin
      ? Promise.all([
        request('/admin/overview'),
        request('/admin/users'),
        request('/admin/logins'),
        request('/admin/settings'),
      ]).then(([overviewResult, userResult, loginResult, settingsResult]) => {
        if (!active) return
        setOverview(overviewResult)
        setUsers(userResult.users)
        setLogins(loginResult.logins)
        setSettings(settingsResult)
        setWhatsappUrl(settingsResult.whatsappGroupUrl || '')
      })
      : request('/auth/me/settings').then((settingsResult) => {
        if (!active) return
        setSettings(settingsResult)
      })

    dataRequest
      .catch((requestError) => {
        if (active) setError(requestError.message)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => { active = false }
  }, [isAdmin, request, reloadKey])

  async function saveUser(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setNotice('')
    try {
      const result = editingUserId
        ? await request(`/admin/users/${editingUserId}`, {
          method: 'PATCH',
          body: JSON.stringify({ name: userForm.name, email: userForm.email, phone: userForm.phone, role: userForm.role }),
        })
        : await request('/admin/users', { method: 'POST', body: JSON.stringify(userForm) })
      setUsers((current) => editingUserId
        ? current.map((entry) => entry.id === editingUserId ? result.user : entry)
        : [result.user, ...current])
      setNotice(editingUserId ? 'Data pengguna berhasil diperbarui.' : 'Akun pengguna berhasil dibuat.')
      setUserForm(emptyUserForm)
      setEditingUserId(null)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSaving(false)
    }
  }

  async function removeUser(targetUser) {
    if (!window.confirm(`Hapus akun ${targetUser.name} dan proyek miliknya?`)) return
    setSaving(true)
    setError('')
    setNotice('')
    try {
      await request(`/admin/users/${targetUser.id}`, { method: 'DELETE' })
      setUsers((current) => current.filter((entry) => entry.id !== targetUser.id))
      setNotice(`Akun ${targetUser.name} berhasil dihapus.`)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSaving(false)
    }
  }

  async function saveWhatsApp(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setNotice('')
    try {
      const result = await request('/admin/settings/whatsapp', {
        method: 'PATCH',
        body: JSON.stringify({ url: whatsappUrl }),
      })
      setSettings((current) => ({ ...current, whatsappGroupUrl: result.whatsappGroupUrl }))
      setNotice('Tautan grup WhatsApp berhasil diperbarui.')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSaving(false)
    }
  }

  async function saveProfile(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setNotice('')
    try {
      const result = await request('/auth/me', {
        method: 'PATCH',
        body: JSON.stringify(profileForm),
      })
      onUserUpdated(result.user)
      if (isAdmin) {
        setUsers((current) => current.map((entry) => entry.id === result.user.id ? { ...entry, ...result.user } : entry))
      }
      setProfileForm({
        name: result.user.name,
        email: result.user.email,
        phone: result.user.phone || '',
      })
      setEditingProfile(false)
      setNotice(result.message)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSaving(false)
    }
  }

  function startEditingProfile() {
    setProfileForm({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
    })
    setEditingProfile(true)
    setError('')
    setNotice('')
  }

  function openProfileEditor() {
    setActivePage('account')
    startEditingProfile()
  }

  async function updatePassword(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setNotice('')
    try {
      await request(isAdmin ? '/admin/me/password' : '/auth/me/password', {
        method: 'PATCH',
        body: JSON.stringify(passwordForm),
      })
      onLogout()
    } catch (requestError) {
      setError(requestError.message)
      setSaving(false)
    }
  }

  async function deleteMyAccount(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setNotice('')
    try {
      const result = await request('/auth/me', {
        method: 'DELETE',
        body: JSON.stringify({ confirmation: deleteConfirmation }),
      })
      setNotice(result.message)
      onLogout()
    } catch (requestError) {
      setError(requestError.message)
      setSaving(false)
    }
  }

  async function deleteUserByConfirmation(event) {
    event.preventDefault()
    if (deleteUserConfirmation !== 'hapus akun') {
      setError('Ketik tepat "hapus akun" untuk menghapus akun pengguna.')
      return
    }
    const target = users.find((entry) => entry.id === editingUserId)
    if (!target) {
      setError('Pilih akun pengguna yang akan dihapus terlebih dahulu.')
      return
    }
    setDeleteUserConfirmation('')
    await removeUser(target)
    setEditingUserId(null)
    setUserForm(emptyUserForm)
  }

  function beginEditUser(entry) {
    setEditingUserId(entry.id)
    setUserForm({ name: entry.name, email: entry.email, phone: entry.phone || '', password: '', role: entry.role })
    setDeleteUserConfirmation('')
    setError('')
    setNotice('')
  }

  const filteredUsers = users.filter((entry) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.trim().toLowerCase()
    return (entry.name || '').toLowerCase().includes(q) || (entry.email || '').toLowerCase().includes(q)
  })

  async function handleExportExcel() {
    setExporting(true)
    setError('')
    try {
      await exportUsersToExcel(users, exportRole)
      setNotice('Data akun berhasil diekspor ke Microsoft Excel.')
    } catch (err) {
      setError(err.message || 'Gagal mengekspor data ke Excel.')
    } finally {
      setExporting(false)
    }
  }

  async function handleFileSelect(event) {
    const file = event.target.files?.[0]
    if (!file) return
    setImportFile(file)
    setImportError('')
    try {
      const parsed = await parseUsersFromExcel(file)
      setImportPreview(parsed)
      if (parsed.validUsers.length === 0) {
        setImportError('Tidak ada data akun valid yang ditemukan dalam file.')
      }
    } catch (err) {
      setImportError(err.message || 'Gagal membaca file Excel.')
      setImportPreview(null)
    }
  }

  async function handleExecuteImport() {
    if (!importPreview || importPreview.validUsers.length === 0) return
    setImporting(true)
    setImportError('')
    setError('')
    setNotice('')

    try {
      let createdCount = 0
      let updatedCount = 0
      let failedCount = 0
      const currentUsersMap = new Map(users.map((u) => [(u.email || '').trim().toLowerCase(), u]))
      const newlyCreatedUsers = []
      const updatedUsersList = []

      for (const item of importPreview.validUsers) {
        const emailKey = (item.email || '').trim().toLowerCase()
        const existing = currentUsersMap.get(emailKey)

        if (existing) {
          try {
            const res = await request('/admin/users/' + existing.id, {
              method: 'PATCH',
              body: JSON.stringify({
                name: item.name,
                email: item.email,
                phone: item.phone !== undefined && item.phone !== '' ? item.phone : (existing.phone || ''),
                role: item.role || existing.role,
              }),
            })
            if (res.user) {
              updatedCount++
              updatedUsersList.push(res.user)
              if (String(res.user.id) === String(user?.id)) {
                onUserUpdated(res.user)
              }
            }
          } catch {
            failedCount++
          }
        } else {
          try {
            const res = await request('/admin/users', {
              method: 'POST',
              body: JSON.stringify(item),
            })
            if (res.user) {
              createdCount++
              newlyCreatedUsers.push(res.user)
            }
          } catch {
            failedCount++
          }
        }
      }

      setUsers((current) => {
        const updatedMap = new Map(updatedUsersList.map((u) => [u.id, u]))
        const mapped = current.map((u) => (updatedMap.has(u.id) ? updatedMap.get(u.id) : u))
        return [...newlyCreatedUsers, ...mapped]
      })

      const summaryParts = []
      summaryParts.push('Proses import selesai!')
      if (createdCount > 0) summaryParts.push(createdCount + ' akun baru ditambahkan.')
      if (updatedCount > 0) summaryParts.push(updatedCount + ' akun diperbarui namanya/datanya.')
      if (failedCount > 0) summaryParts.push(failedCount + ' akun dilewati/gagal.')

      setNotice(summaryParts.join(' '))
      setShowImportModal(false)
      setImportPreview(null)
      setImportFile(null)
    } catch (err) {
      setImportError(err.message || 'Gagal mengimpor akun.')
    } finally {
      setImporting(false)
    }
  }

  const mailtoHref = `mailto:${encodeURIComponent(settings.adminEmail || 'kreatifest.ind@gmail.com')}?subject=${encodeURIComponent('Permintaan bantuan lupa kata sandi Kreatifest')}&body=${encodeURIComponent(`Halo Admin Kreatifest,\n\nSaya ${user?.name} (${user?.email}) lupa kata sandi akun saya. Mohon bantu hapus akun saya agar saya dapat mendaftar kembali.\n\nTerima kasih.`)}`

  return (
    <main className="portal-dashboard">
      <aside className="portal-sidebar">
        <a className="portal-brand portal-brand--sidebar" href="/" onClick={(event) => { event.preventDefault(); onLandingPage() }}>
          <img src={brand.logo} alt="" />
          <span>{brand.name}</span>
        </a>
        <span className="portal-sidebar__label">MENU</span>
        <nav aria-label="Navigasi dashboard">
          {navigation.map((item) => (
            <button
              className={`portal-sidebar__link ${activePage === item.id ? 'is-active' : ''}`}
              key={item.id}
              type="button"
              aria-current={activePage === item.id ? 'page' : undefined}
              onClick={() => { setActivePage(item.id); setError(''); setNotice('') }}
            >
              <Icon name={item.icon} size={19} />
              {item.label}
            </button>
          ))}
        </nav>
        <span className="portal-sidebar__label portal-sidebar__label--home">BERANDA</span>
        <a className="portal-sidebar__link portal-sidebar__home" href="/" onClick={(event) => { event.preventDefault(); onLandingPage() }}>
          <Icon name="arrow-up-right" size={17} />
          Landing Page
        </a>
        <div className="portal-sidebar__bottom">
          {!isAdmin && (
            <div className="portal-sidebar__help">
              <span className="portal-sidebar__help-icon"><Icon name="lightbulb" size={18} /></span>
              <strong>Butuh bantuan?</strong>
              <span>Hubungi admin untuk bantuan akun.</span>
              <a href={mailtoHref}>Email admin <Icon name="arrow-up-right" size={14} /></a>
            </div>
          )}
          <button className="portal-sidebar__logout" type="button" onClick={onLogout}>
            <Icon name="arrow-right" size={18} /> Keluar
          </button>
        </div>
      </aside>

      <section className="portal-dashboard__main">
        <header className="portal-topbar">
          <div className="portal-breadcrumb"><span>Dashboard</span><span>/</span><strong>{sectionTitle}</strong></div>
          <div className="portal-topbar__user">
            <span className="portal-topbar__avatar">{user?.name?.[0]?.toUpperCase() || 'K'}</span>
            <span><strong>{user?.name || 'Akun pengguna'}</strong><small>{isAdmin ? 'Administrator' : 'Pengguna'}</small></span>
            <button className="portal-topbar__edit" type="button" onClick={openProfileEditor}>Edit akun</button>
            <button className="portal-topbar__logout" type="button" onClick={onLogout} aria-label="Keluar">
              <Icon name="arrow-right" size={18} />
            </button>
          </div>
        </header>

        <div className="portal-dashboard__content">
          <div className="portal-welcome">
            <div>
              <span className="portal-eyebrow">{isAdmin ? 'ADMINISTRASI KREATIFEST' : 'AKUN PENGGUNA'}</span>
              <h1>{sectionTitle}</h1>
              <p>{activePage === 'users'
                ? 'Cari, tambah, edit, hapus akun, dan atur peran pengguna.'
                : activePage === 'account'
                  ? isAdmin ? 'Informasi akun admin dan pengaturan keamanan.' : `Selamat datang di ruang Kreatifest, ${user?.name?.split(' ')[0] || 'Kreator'}.`
                  : activePage === 'settings'
                    ? isAdmin ? 'Atur tautan grup WhatsApp yang akan dilihat pengguna.' : 'Gabung grup untuk mendapatkan kabar terbaru Kreatifest.'
                    : 'Pantau proyek dan aktivitas terbaru di workspace Kreatifest.'}</p>
            </div>
            <span className="portal-welcome__date"><Icon name="sun" size={17} /> {new Intl.DateTimeFormat('id-ID', { dateStyle: 'long' }).format(new Date())}</span>
          </div>

          {error && <p className="portal-form__error" role="alert">{error}{' '}<button className="portal-inline-link" type="button" onClick={reloadData}>Coba lagi</button></p>}
          {notice && <p className="portal-success" role="status">{notice}</p>}
          {loading ? <p className="portal-dashboard__message" role="status">Memuat data dari server...</p> : (
            <>
              {activePage === 'users' && isAdmin && (
                <>
                  <section className="portal-stat-grid" aria-label="Ringkasan akun">
                    <article className="portal-stat-card"><span className="portal-stat-card__icon portal-tone--violet"><Icon name="users" size={20} /></span><span className="portal-stat-card__label">Akun terdaftar</span><strong>{users.length}</strong><small>Semua peran akun</small></article>
                    <article className="portal-stat-card"><span className="portal-stat-card__icon portal-tone--coral"><Icon name="layers" size={20} /></span><span className="portal-stat-card__label">Admin aktif</span><strong>{users.filter((entry) => entry.role === 'admin').length}</strong><small>Termasuk akun Anda</small></article>
                    <article className="portal-stat-card"><span className="portal-stat-card__icon portal-tone--amber"><Icon name="chat" size={20} /></span><span className="portal-stat-card__label">Login hari ini</span><strong>{overview?.loginsToday ?? 0}</strong><small>Akses berhasil tercatat</small></article>
                  </section>
                  <section className="portal-panel">
                    <div className="portal-panel__heading"><div><h2>{editingUserId ? 'Edit akun pengguna' : 'Buat akun pengguna'}</h2><p>{editingUserId ? 'Perbarui nama, email, atau role akun.' : 'Admin dapat mendaftarkan akun untuk pengguna.'}</p></div></div>
                    <form className="portal-form portal-admin-form" onSubmit={saveUser}>
                      <label htmlFor="admin-user-name">Nama</label><input id="admin-user-name" value={userForm.name} onChange={(event) => setUserForm({ ...userForm, name: event.target.value })} required maxLength={120} />
                      <label htmlFor="admin-user-email">Email</label><input id="admin-user-email" type="email" value={userForm.email} onChange={(event) => setUserForm({ ...userForm, email: event.target.value })} required />
                      <label htmlFor="admin-user-phone">Nomor telepon / WhatsApp</label><input id="admin-user-phone" type="tel" value={userForm.phone} onChange={(event) => setUserForm({ ...userForm, phone: event.target.value })} maxLength={24} inputMode="tel" pattern="[0-9+(). -]{0,24}" title="Masukkan nomor telepon dengan 8 sampai 15 digit, atau kosongkan." />
                      {!editingUserId && <><label htmlFor="admin-user-password">Kata sandi awal</label><input id="admin-user-password" type="password" value={userForm.password} onChange={(event) => setUserForm({ ...userForm, password: event.target.value })} required minLength={8} maxLength={72} /></>}
                      <label htmlFor="admin-user-role">Role</label><select id="admin-user-role" value={userForm.role} onChange={(event) => setUserForm({ ...userForm, role: event.target.value })}><option value="user">Pengguna</option><option value="admin">Admin</option></select>
                      <div className="portal-form__actions"><button className="portal-submit" type="submit" disabled={saving}>{saving ? 'Menyimpan...' : editingUserId ? 'Simpan perubahan' : 'Buat akun'} <Icon name="arrow-right" size={17} /></button>{editingUserId && <button className="portal-secondary-button" type="button" onClick={() => { setEditingUserId(null); setUserForm(emptyUserForm); setDeleteUserConfirmation('') }}>Batal</button>}</div>
                    </form>
                    {editingUserId && <form className="portal-form portal-delete-form" onSubmit={deleteUserByConfirmation}><label htmlFor="admin-delete-confirmation">Untuk menghapus akun ini, ketik <strong>hapus akun</strong></label><div className="portal-form__actions"><input id="admin-delete-confirmation" value={deleteUserConfirmation} onChange={(event) => setDeleteUserConfirmation(event.target.value)} /><button className="portal-danger-button" type="submit" disabled={saving}>Hapus akun</button></div></form>}
                  </section>
                  <section className="portal-panel">
                    <div className="portal-panel__heading">
                      <div>
                        <h2>Semua akun</h2>
                        <p>{searchQuery.trim() ? `Menampilkan ${filteredUsers.length} dari ${users.length} akun terdaftar` : `${users.length} akun terdaftar`}</p>
                      </div>
                    </div>

                    <div className="portal-users-toolbar">
                      <div className="portal-search-box">
                        <Icon name="search" size={16} className="portal-search-icon" />
                        <input
                          type="search"
                          className="portal-search-input"
                          placeholder="Cari username / nama akun..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          aria-label="Cari username atau nama akun"
                        />
                        {searchQuery && (
                          <button
                            type="button"
                            className="portal-search-clear"
                            onClick={() => setSearchQuery('')}
                            aria-label="Reset pencarian"
                            title="Reset"
                          >
                            ✕
                          </button>
                        )}
                      </div>

                      <div className="portal-table-tools">
                        <div className="portal-export-group">
                          <select
                            className="portal-export-select"
                            value={exportRole}
                            onChange={(e) => setExportRole(e.target.value)}
                            aria-label="Filter role untuk ekspor"
                          >
                            <option value="all">Semua Role</option>
                            <option value="user">Hanya Pengguna</option>
                            <option value="admin">Hanya Admin</option>
                          </select>
                          <button
                            type="button"
                            className="portal-action-btn portal-action-btn--excel"
                            onClick={handleExportExcel}
                            disabled={exporting || users.length === 0}
                            title="Ekspor tabel akun ke format Microsoft Excel (.xlsx)"
                          >
                            <Icon name="download" size={15} />
                            {exporting ? 'Mengekspor...' : 'Ekspor Excel'}
                          </button>
                        </div>

                        <button
                          type="button"
                          className="portal-action-btn portal-action-btn--import"
                          onClick={() => {
                            setShowImportModal(true)
                            setImportError('')
                            setImportPreview(null)
                            setImportFile(null)
                          }}
                          title="Import data akun dari file Microsoft Excel (.xlsx)"
                        >
                          <Icon name="upload" size={15} />
                          Import Excel
                        </button>
                      </div>
                    </div>

                    <div className="portal-table-wrap">
                      <table className="portal-table">
                        <thead>
                          <tr>
                            <th>Nama / email</th>
                            <th>Role</th>
                            <th>Nomor telepon</th>
                            <th>Total login</th>
                            <th>Aksi</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredUsers.map((entry) => (
                            <tr key={entry.id}>
                              <td>
                                <strong>{entry.name}</strong>
                                <small>{entry.email}</small>
                              </td>
                              <td>{entry.role === 'admin' ? 'Admin' : 'Pengguna'}</td>
                              <td>{entry.phone ? <span className="portal-phone-cell">{entry.phone}</span> : <span style={{ color: 'var(--color-text-soft)' }}>-</span>}</td>
                              <td>{entry.loginCount}</td>
                              <td>
                                <div className="portal-table__actions">
                                  <button className="portal-secondary-button" type="button" onClick={() => beginEditUser(entry)}>Edit</button>
                                  <button className="portal-danger-button" type="button" disabled={saving} onClick={() => removeUser(entry)}>Hapus</button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {users.length > 0 && filteredUsers.length === 0 && (
                      <div className="portal-search-empty">
                        <p>Tidak ada akun yang sesuai dengan pencarian &ldquo;<strong>{searchQuery}</strong>&rdquo;.</p>
                        <button type="button" className="portal-secondary-button" onClick={() => setSearchQuery('')}>Reset pencarian</button>
                      </div>
                    )}

                    {!users.length && <p className="portal-dashboard__message">Belum ada akun pengguna.</p>}
                  </section>
                </>
              )}
              {activePage === 'logins' && isAdmin && <section className="portal-panel"><div className="portal-panel__heading"><div><h2>Riwayat login</h2><p>Maksimal 200 akses terakhir, termasuk akun yang sudah dihapus.</p></div></div><LoginTable logins={logins} /></section>}
              {activePage === 'settings' && (
                isAdmin
                  ? <section className="portal-panel"><div className="portal-panel__heading"><div><h2>Tautan grup WhatsApp</h2><p>Pengguna dapat bergabung melalui halaman Grup WhatsApp mereka.</p></div></div><form className="portal-form portal-settings-form" onSubmit={saveWhatsApp}><label htmlFor="whatsapp-group-url">Tautan undangan</label><input id="whatsapp-group-url" type="url" value={whatsappUrl} onChange={(event) => setWhatsappUrl(event.target.value)} placeholder="https://chat.whatsapp.com/..." required /><button className="portal-submit" type="submit" disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan tautan'} <Icon name="arrow-right" size={17} /></button></form></section>
                  : <WhatsAppPanel url={settings.whatsappGroupUrl} />
              )}
              {activePage === 'account' && isAdmin && (
                <div className="portal-info-grid">
                  <AccountInfoPanel
                    isEditing={editingProfile}
                    form={profileForm}
                    setForm={setProfileForm}
                    user={user}
                    saving={saving}
                    onEdit={startEditingProfile}
                    onCancel={() => setEditingProfile(false)}
                    onSubmit={saveProfile}
                  />
                  <PasswordForm form={passwordForm} setForm={setPasswordForm} onSubmit={updatePassword} saving={saving} />
                </div>
              )}
              {activePage === 'account' && !isAdmin && (
                <>
                  <div className="portal-info-grid">
                    <AccountInfoPanel
                      isEditing={editingProfile}
                      form={profileForm}
                      setForm={setProfileForm}
                      user={user}
                      saving={saving}
                      onEdit={startEditingProfile}
                      onCancel={() => setEditingProfile(false)}
                      onSubmit={saveProfile}
                    />
                    <section className="portal-panel portal-forgot-panel">
                      <div className="portal-panel__heading"><div><span className="portal-eyebrow">KEAMANAN</span><h2>Lupa password?</h2><p>Hubungi admin melalui email. Draft pesan sudah disiapkan untuk meminta penghapusan akun agar Anda dapat mendaftar kembali.</p></div></div>
                      <a className="portal-submit portal-forgot-button" href={mailtoHref}>Buat email ke admin <Icon name="arrow-up-right" size={17} /></a>
                    </section>
                  </div>
                  <PasswordForm form={passwordForm} setForm={setPasswordForm} onSubmit={updatePassword} saving={saving} />
                  <section className="portal-panel portal-panel--danger"><div className="portal-panel__heading"><div><h2>Hapus akun</h2><p>Akun dan proyek yang dimiliki akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.</p></div></div><form className="portal-form portal-delete-form" onSubmit={deleteMyAccount}><label htmlFor="delete-account-confirmation">Ketik <strong>hapus akun</strong> untuk melanjutkan</label><div className="portal-form__actions"><input id="delete-account-confirmation" value={deleteConfirmation} onChange={(event) => setDeleteConfirmation(event.target.value)} autoComplete="off" /><button className="portal-danger-button" type="submit" disabled={saving || deleteConfirmation.trim().toLowerCase() !== 'hapus akun'}>Hapus akun saya</button></div></form></section>
                </>
              )}
            </>
          )}
          <p className="portal-demo-footer"><Icon name="info" size={15} /> Data ditampilkan dari akun dan database Kreatifest.</p>
        </div>
      </section>
    
      {showImportModal && (
        <div
          className="portal-modal-overlay"
          onClick={() => !importing && setShowImportModal(false)}
          role="dialog"
          aria-modal="true"
        >
          <div className="portal-modal" onClick={(e) => e.stopPropagation()}>
            <div className="portal-modal__header">
              <div>
                <h2>Import Akun dari Ms. Excel</h2>
                <p>Tambah akun baru atau perbarui nama &amp; data akun yang sudah ada.</p>
              </div>
              <button
                type="button"
                className="portal-modal__close"
                onClick={() => !importing && setShowImportModal(false)}
                disabled={importing}
                aria-label="Tutup jendela"
              >
                ✕
              </button>
            </div>

            <div className="portal-template-banner">
              <span>Kolom: <strong>Nama, Email, Role, No. Telepon, Password</strong></span>
              <button type="button" onClick={downloadExcelTemplate}>
                <Icon name="download" size={13} /> Unduh Format Template
              </button>
            </div>

            {importError && (
              <p className="portal-form__error" style={{ marginBottom: '1rem' }} role="alert">
                {importError}
              </p>
            )}

            {!importPreview && (
              <label className="portal-dropzone">
                <input
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileSelect}
                  disabled={importing}
                />
                <span className="portal-dropzone__icon">
                  <Icon name="upload" size={24} />
                </span>
                <strong>Pilih file Excel atau klik di sini</strong>
                <span>Mendukung format .xlsx dan .xls (Jika email sudah terdaftar, data nama &amp; telepon akan diperbarui otomatis)</span>
              </label>
            )}

            {importPreview && (
              <div className="portal-import-preview">
                <h4>Pratinjau Data ({importFile?.name})</h4>
                <div className="portal-import-stats">
                  <span className="portal-badge--success">
                    ✓ {importPreview.validUsers.length} data terbaca dari Excel
                  </span>
                  {importPreview.invalidRows.length > 0 && (
                    <span className="portal-badge--warning">
                      ⚠ {importPreview.invalidRows.length} baris tidak valid (dilewati)
                    </span>
                  )}
                </div>

                <div className="portal-table-wrap" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                  <table className="portal-preview-table">
                    <thead>
                      <tr>
                        <th>Status</th>
                        <th>Nama</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>No. Telp</th>
                      </tr>
                    </thead>
                    <tbody>
                      {importPreview.validUsers.slice(0, 8).map((u, i) => {
                        const isExisting = users.some(
                          (existing) => (existing.email || '').trim().toLowerCase() === (u.email || '').trim().toLowerCase()
                        )
                        return (
                          <tr key={i}>
                            <td>
                              <span
                                style={{
                                  fontSize: '0.68rem',
                                  padding: '0.15rem 0.45rem',
                                  borderRadius: '999px',
                                  fontWeight: 650,
                                  background: isExisting ? '#fef3c7' : '#dcfce7',
                                  color: isExisting ? '#92400e' : '#166534',
                                }}
                              >
                                {isExisting ? 'Update' : 'Baru'}
                              </span>
                            </td>
                            <td><strong>{u.name}</strong></td>
                            <td>{u.email}</td>
                            <td>{u.role === 'admin' ? 'Admin' : 'Pengguna'}</td>
                            <td>{u.phone || '-'}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
                {importPreview.validUsers.length > 8 && (
                  <p style={{ fontSize: '0.7rem', color: 'var(--color-text-soft)', marginTop: '0.45rem', textAlign: 'center' }}>
                    ...dan {importPreview.validUsers.length - 8} akun lainnya
                  </p>
                )}

                <div style={{ marginTop: '0.75rem', textAlign: 'right' }}>
                  <button
                    type="button"
                    className="portal-secondary-button"
                    onClick={() => {
                      setImportPreview(null)
                      setImportFile(null)
                      setImportError('')
                    }}
                    disabled={importing}
                  >
                    Ganti file
                  </button>
                </div>
              </div>
            )}

            <div className="portal-modal__actions">
              <button
                type="button"
                className="portal-secondary-button"
                onClick={() => setShowImportModal(false)}
                disabled={importing}
              >
                Batal
              </button>
              <button
                type="button"
                className="portal-submit"
                onClick={handleExecuteImport}
                disabled={importing || !importPreview || importPreview.validUsers.length === 0}
              >
                {importing ? 'Memproses import...' : 'Proses ' + (importPreview?.validUsers?.length || 0) + ' Akun'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

function AccountInfoPanel({ isEditing, form, setForm, user, saving, onEdit, onCancel, onSubmit }) {
  return (
    <section className="portal-panel">
      <div className="portal-panel__heading">
        <div>
          <h2>{isEditing ? 'Edit informasi akun' : 'Informasi akun'}</h2>
          <p>{isEditing ? 'Perbarui nama, email, dan nomor telepon Anda.' : 'Detail akun yang terdaftar di Kreatifest.'}</p>
        </div>
        {!isEditing && <button className="portal-secondary-button portal-profile-edit-button" type="button" onClick={onEdit}>Edit informasi akun</button>}
      </div>
      {isEditing ? (
        <form className="portal-form portal-profile-form" onSubmit={onSubmit}>
          <label htmlFor="profile-name">Nama lengkap</label>
          <input id="profile-name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} maxLength={120} autoComplete="name" required />
          <label htmlFor="profile-email">Email</label>
          <input id="profile-email" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} maxLength={254} autoComplete="email" required />
          <label htmlFor="profile-phone">Nomor telepon / WhatsApp</label>
          <input id="profile-phone" type="tel" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} maxLength={24} autoComplete="tel" inputMode="tel" pattern="[0-9+(). -]{0,24}" title="Masukkan nomor telepon dengan 8 sampai 15 digit, atau kosongkan." />
          <div className="portal-form__actions">
            <button className="portal-submit" type="submit" disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan perubahan'} <Icon name="arrow-right" size={17} /></button>
            <button className="portal-secondary-button" type="button" onClick={onCancel} disabled={saving}>Batal</button>
          </div>
        </form>
      ) : (
        <dl className="portal-account-details portal-account-details--single">
          <div><dt>Nama lengkap</dt><dd>{user?.name}</dd></div>
          <div><dt>Email</dt><dd>{user?.email}</dd></div>
          <div><dt>Nomor telepon / WhatsApp</dt><dd>{user?.phone || 'Belum diisi'}</dd></div>
          <div><dt>Role</dt><dd>{user?.role === 'admin' ? 'Administrator' : 'Pengguna'}</dd></div>
        </dl>
      )}
    </section>
  )
}

function LoginTable({ logins }) {
  return <div className="portal-table-wrap"><table className="portal-table"><thead><tr><th>Email</th><th>Role</th><th>Waktu login</th><th>Status akun</th></tr></thead><tbody>{logins.map((login) => <tr key={login.id}><td>{login.email}</td><td>{login.role === 'admin' ? 'Admin' : 'Pengguna'}</td><td>{formatDate(login.logged_at, true)}</td><td>{login.user_id ? 'Terdaftar' : 'Akun dihapus'}</td></tr>)}</tbody></table>{!logins.length && <p className="portal-dashboard__message">Belum ada riwayat login.</p>}</div>
}

function WhatsAppPanel({ url }) {
  return <section className="portal-panel portal-whatsapp-panel"><div><span className="portal-stat-card__icon portal-tone--coral"><Icon name="chat" size={20} /></span><h2>Gabung grup WhatsApp</h2><p>Dapatkan kabar dan informasi terbaru dari komunitas Kreatifest.</p></div>{url ? <a className="portal-submit portal-whatsapp-button" href={url} target="_blank" rel="noreferrer">Gabung grup <Icon name="arrow-up-right" size={17} /></a> : <p className="portal-dashboard__message">Tautan grup belum diatur admin.</p>}</section>
}

function PasswordForm({ form, setForm, onSubmit, saving }) {
  return <section className="portal-panel"><div className="portal-panel__heading"><div><h2>Ubah kata sandi</h2><p>Anda akan diminta masuk kembali setelah kata sandi diperbarui.</p></div></div><form className="portal-form portal-settings-form" onSubmit={onSubmit}><label htmlFor="current-password">Kata sandi saat ini</label><input id="current-password" type="password" value={form.currentPassword} onChange={(event) => setForm({ ...form, currentPassword: event.target.value })} autoComplete="current-password" required /><label htmlFor="new-password">Kata sandi baru</label><input id="new-password" type="password" value={form.newPassword} onChange={(event) => setForm({ ...form, newPassword: event.target.value })} autoComplete="new-password" minLength={8} maxLength={72} required /><button className="portal-submit" type="submit" disabled={saving}>{saving ? 'Menyimpan...' : 'Perbarui kata sandi'} <Icon name="arrow-right" size={17} /></button></form></section>
}
