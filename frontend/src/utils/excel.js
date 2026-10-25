import ExcelJS from 'exceljs/dist/exceljs.min.js'

function getWorkbookConstructor() {
  return ExcelJS.Workbook || ExcelJS.default?.Workbook || ExcelJS
}

/**
 * Download a buffer as a file in the browser
 */
function downloadBuffer(buffer, filename) {
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  setTimeout(() => {
    document.body.removeChild(anchor)
    URL.revokeObjectURL(url)
  }, 150)
}

/**
 * Format date string for Indonesian locale
 */
function formatIndoDate(date) {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

/**
 * Export users to a beautifully styled Excel workbook
 * @param {Array} users - List of user objects
 * @param {'all'|'user'|'admin'} roleFilter - Role filter
 */
export async function exportUsersToExcel(users, roleFilter = 'all') {
  const filteredUsers = users.filter((entry) => {
    if (roleFilter === 'user') return entry.role === 'user'
    if (roleFilter === 'admin') return entry.role === 'admin'
    return true
  })

  const roleLabel =
    roleFilter === 'user'
      ? 'Hanya Pengguna'
      : roleFilter === 'admin'
        ? 'Hanya Admin'
        : 'Semua Akun (Admin & Pengguna)'

  const Workbook = getWorkbookConstructor()
  const workbook = new Workbook()
  workbook.creator = 'Kreatifest Indonesia'
  workbook.created = new Date()

  const worksheet = workbook.addWorksheet('Daftar Akun', {
    views: [{ showGridLines: true }],
    pageSetup: { paperSize: 9, orientation: 'portrait', fitToPage: true },
  })

  // Colors
  const BRAND_NAVY = '1E1B4B'
  const BRAND_ACCENT = '4F46E5'
  const TABLE_HEADER_FILL = '1E293B'
  const ZEBRA_ROW_FILL = 'F8FAFC'
  const BORDER_COLOR = 'CBD5E1'
  const MUTED_TEXT = '64748B'

  // Row 1: Main Title Banner
  worksheet.mergeCells('A1:D1')
  const titleCell = worksheet.getCell('A1')
  titleCell.value = 'KREATIFEST INDONESIA'
  titleCell.font = { name: 'Segoe UI', size: 16, bold: true, color: { argb: 'FFFFFF' } }
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' }
  titleCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: BRAND_NAVY },
  }
  worksheet.getRow(1).height = 40

  // Row 2: Subtitle
  worksheet.mergeCells('A2:D2')
  const subTitleCell = worksheet.getCell('A2')
  subTitleCell.value = `Daftar Akun Terdaftar — Filter: ${roleLabel}`
  subTitleCell.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: '334155' } }
  subTitleCell.alignment = { horizontal: 'center', vertical: 'middle' }
  subTitleCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'EEF2FF' },
  }
  worksheet.getRow(2).height = 24

  // Row 3: Metadata / Export Info
  worksheet.mergeCells('A3:D3')
  const infoCell = worksheet.getCell('A3')
  const now = new Date()
  const adminCount = filteredUsers.filter((u) => u.role === 'admin').length
  const userCount = filteredUsers.filter((u) => u.role === 'user').length
  infoCell.value = `Tanggal Ekspor: ${formatIndoDate(now)}  |  Total Data: ${filteredUsers.length} Akun (Admin: ${adminCount}, Pengguna: ${userCount})`
  infoCell.font = { name: 'Segoe UI', size: 9, italic: true, color: { argb: MUTED_TEXT } }
  infoCell.alignment = { horizontal: 'center', vertical: 'middle' }
  infoCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'F8FAFC' },
  }
  worksheet.getRow(3).height = 20

  // Row 4: Spacer
  worksheet.getRow(4).height = 12

  // Row 5: Table Headers
  const headers = ['Nama', 'Email', 'Role', 'No. Telepon']
  const headerRow = worksheet.getRow(5)
  headerRow.height = 30

  headers.forEach((headerText, index) => {
    const colNumber = index + 1
    const cell = headerRow.getCell(colNumber)
    cell.value = headerText
    cell.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: 'FFFFFF' } }
    cell.alignment = {
      horizontal: headerText === 'Role' ? 'center' : 'left',
      vertical: 'middle',
      indent: headerText === 'Role' ? 0 : 1,
    }
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: TABLE_HEADER_FILL },
    }
    cell.border = {
      top: { style: 'medium', color: { argb: BRAND_NAVY } },
      bottom: { style: 'medium', color: { argb: BRAND_NAVY } },
      left: { style: 'thin', color: { argb: '334155' } },
      right: { style: 'thin', color: { argb: '334155' } },
    }
  })

  // Data Rows
  let currentRowIndex = 6
  filteredUsers.forEach((entry, idx) => {
    const row = worksheet.getRow(currentRowIndex)
    row.height = 24
    const isEven = idx % 2 === 1

    const roleName = entry.role === 'admin' ? 'Admin' : 'Pengguna'
    const phoneDisplay = entry.phone ? String(entry.phone) : '-'

    const rowValues = [
      entry.name || '-',
      entry.email || '-',
      roleName,
      phoneDisplay,
    ]

    rowValues.forEach((val, colIdx) => {
      const cell = row.getCell(colIdx + 1)
      cell.value = val
      cell.font = {
        name: 'Segoe UI',
        size: 10,
        bold: colIdx === 0, // bold for Name
        color: { argb: colIdx === 0 ? '0F172A' : '334155' },
      }
      cell.alignment = {
        horizontal: colIdx === 2 ? 'center' : 'left',
        vertical: 'middle',
        indent: colIdx === 2 ? 0 : 1,
      }

      // Formatting phone column as text so leading zeros or + are preserved
      if (colIdx === 3) {
        cell.numFmt = '@'
      }

      // Role badge effect
      if (colIdx === 2) {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: entry.role === 'admin' ? 'EDE9FE' : (isEven ? ZEBRA_ROW_FILL : 'FFFFFF') },
        }
        if (entry.role === 'admin') {
          cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: '4338CA' } }
        }
      } else if (isEven) {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: ZEBRA_ROW_FILL },
        }
      } else {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFFF' },
        }
      }

      cell.border = {
        top: { style: 'thin', color: { argb: BORDER_COLOR } },
        bottom: { style: 'thin', color: { argb: BORDER_COLOR } },
        left: { style: 'thin', color: { argb: BORDER_COLOR } },
        right: { style: 'thin', color: { argb: BORDER_COLOR } },
      }
    })

    currentRowIndex++
  })

  // Summary Row at the bottom
  const summaryRow = worksheet.getRow(currentRowIndex)
  summaryRow.height = 26
  summaryRow.getCell(1).value = `TOTAL: ${filteredUsers.length} AKUN`
  summaryRow.getCell(1).font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: '1E293B' } }
  summaryRow.getCell(1).alignment = { vertical: 'middle', indent: 1 }

  summaryRow.getCell(2).value = ''
  summaryRow.getCell(3).value = `Admin: ${adminCount} | Pengguna: ${userCount}`
  summaryRow.getCell(3).font = { name: 'Segoe UI', size: 9.5, bold: true, color: { argb: BRAND_ACCENT } }
  summaryRow.getCell(3).alignment = { horizontal: 'center', vertical: 'middle' }

  summaryRow.getCell(4).value = ''

  for (let c = 1; c <= 4; c++) {
    const cell = summaryRow.getCell(c)
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'EEF2FF' },
    }
    cell.border = {
      top: { style: 'medium', color: { argb: BRAND_ACCENT } },
      bottom: { style: 'medium', color: { argb: BRAND_ACCENT } },
      left: { style: 'thin', color: { argb: BORDER_COLOR } },
      right: { style: 'thin', color: { argb: BORDER_COLOR } },
    }
  }

  // Calculate Column Widths dynamically with safe minimums
  const minWidths = [26, 32, 16, 22]
  for (let c = 1; c <= 4; c++) {
    let maxLength = minWidths[c - 1]
    filteredUsers.forEach((entry) => {
      let val = ''
      if (c === 1) val = entry.name || ''
      if (c === 2) val = entry.email || ''
      if (c === 3) val = entry.role === 'admin' ? 'Admin' : 'Pengguna'
      if (c === 4) val = entry.phone || ''
      if (val.length + 4 > maxLength) {
        maxLength = val.length + 4
      }
    })
    worksheet.getColumn(c).width = maxLength
  }

  const timestamp = new Date().toISOString().slice(0, 10)
  const roleSlug = roleFilter === 'user' ? 'pengguna' : roleFilter === 'admin' ? 'admin' : 'semua'
  const filename = `Kreatifest_Akun_${roleSlug}_${timestamp}.xlsx`

  const buffer = await workbook.xlsx.writeBuffer()
  downloadBuffer(buffer, filename)
}

/**
 * Generate and download sample Excel template for importing
 */
export async function downloadExcelTemplate() {
  const Workbook = getWorkbookConstructor()
  const workbook = new Workbook()
  workbook.creator = 'Kreatifest Indonesia'

  const worksheet = workbook.addWorksheet('Template Import Akun', {
    views: [{ showGridLines: true }],
  })

  // Banner
  worksheet.mergeCells('A1:E1')
  const title = worksheet.getCell('A1')
  title.value = 'TEMPLATE IMPORT AKUN KREATIFEST'
  title.font = { name: 'Segoe UI', size: 14, bold: true, color: { argb: 'FFFFFF' } }
  title.alignment = { horizontal: 'center', vertical: 'middle' }
  title.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: '1E1B4B' },
  }
  worksheet.getRow(1).height = 36

  worksheet.mergeCells('A2:E2')
  const guide = worksheet.getCell('A2')
  guide.value = 'Petunjuk: Kolom Nama & Email wajib diisi. Role diisi "Pengguna" atau "Admin" (default: Pengguna). Password minimal 8 karakter (opsional, default: Kreatifest123!).'
  guide.font = { name: 'Segoe UI', size: 9.5, italic: true, color: { argb: '475569' } }
  guide.alignment = { horizontal: 'center', vertical: 'middle' }
  guide.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'EEF2FF' },
  }
  worksheet.getRow(2).height = 24

  worksheet.getRow(3).height = 10

  // Headers
  const headers = [
    { title: 'Nama', desc: '(Wajib)' },
    { title: 'Email', desc: '(Wajib, unik)' },
    { title: 'Role', desc: '(Admin / Pengguna)' },
    { title: 'No. Telepon', desc: '(8-15 digit)' },
    { title: 'Password', desc: '(Opsional, min. 8 kar.)' },
  ]

  const headerRow = worksheet.getRow(4)
  headerRow.height = 28
  headers.forEach((h, idx) => {
    const cell = headerRow.getCell(idx + 1)
    cell.value = `${h.title} ${h.desc}`
    cell.font = { name: 'Segoe UI', size: 10.5, bold: true, color: { argb: 'FFFFFF' } }
    cell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 }
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '1E293B' },
    }
    cell.border = {
      top: { style: 'medium', color: { argb: '1E1B4B' } },
      bottom: { style: 'medium', color: { argb: '1E1B4B' } },
      left: { style: 'thin', color: { argb: '334155' } },
      right: { style: 'thin', color: { argb: '334155' } },
    }
  })

  // Sample data rows
  const sampleData = [
    ['Budi Santoso', 'budi.santoso@gmail.com', 'Pengguna', '081234567890', 'Kreatifest123!'],
    ['Siti Rahmawati', 'siti.rahma@gmail.com', 'Pengguna', '+628987654321', 'Kreatifest123!'],
    ['Administrator Baru', 'admin.baru@kreatifest.id', 'Admin', '085712345678', 'AdminKreatifest2026!'],
  ]

  sampleData.forEach((rowValues, idx) => {
    const row = worksheet.getRow(5 + idx)
    row.height = 22
    rowValues.forEach((val, cIdx) => {
      const cell = row.getCell(cIdx + 1)
      cell.value = val
      cell.font = { name: 'Segoe UI', size: 10, color: { argb: '334155' } }
      cell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 }
      if (cIdx === 3) cell.numFmt = '@'
      cell.border = {
        top: { style: 'thin', color: { argb: 'CBD5E1' } },
        bottom: { style: 'thin', color: { argb: 'CBD5E1' } },
        left: { style: 'thin', color: { argb: 'CBD5E1' } },
        right: { style: 'thin', color: { argb: 'CBD5E1' } },
      }
    })
  })

  worksheet.getColumn(1).width = 25
  worksheet.getColumn(2).width = 32
  worksheet.getColumn(3).width = 22
  worksheet.getColumn(4).width = 22
  worksheet.getColumn(5).width = 26

  const buffer = await workbook.xlsx.writeBuffer()
  downloadBuffer(buffer, 'Template_Import_Akun_Kreatifest.xlsx')
}

/**
 * Parse uploaded Excel file and extract user records
 * @param {File} file - Excel file from input element
 * @returns {Promise<{ validUsers: Array, invalidRows: Array, totalRows: number }>}
 */
export async function parseUsersFromExcel(file) {
  const buffer = await file.arrayBuffer()
  const Workbook = getWorkbookConstructor()
  const workbook = new Workbook()
  await workbook.xlsx.load(buffer)

  const worksheet = workbook.worksheets[0]
  if (!worksheet) {
    throw new Error('File Excel tidak memiliki worksheet yang valid.')
  }

  // Find header row (usually contains 'nama' or 'email')
  let headerRowIndex = -1
  let colMap = { name: -1, email: -1, role: -1, phone: -1, password: -1 }

  worksheet.eachRow((row, rowNumber) => {
    if (headerRowIndex !== -1) return
    row.eachCell((cell, colNumber) => {
      const val = String(cell.value || '').toLowerCase().trim()
      if (val.includes('nama') || val.includes('name')) colMap.name = colNumber
      if (val.includes('email') || val.includes('surel')) colMap.email = colNumber
      if (val.includes('role') || val.includes('peran')) colMap.role = colNumber
      if (val.includes('telp') || val.includes('phone') || val.includes('telepon') || val.includes('hp') || val.includes('whatsapp')) colMap.phone = colNumber
      if (val.includes('password') || val.includes('sandi')) colMap.password = colNumber
    })

    if (colMap.name !== -1 && colMap.email !== -1) {
      headerRowIndex = rowNumber
    }
  })

  // If header not detected by name, assume standard columns: 1: Name, 2: Email, 3: Role, 4: Phone, 5: Password
  if (headerRowIndex === -1) {
    headerRowIndex = 1
    colMap = { name: 1, email: 2, role: 3, phone: 4, password: 5 }
  }

  const validUsers = []
  const invalidRows = []
  let totalRows = 0

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber <= headerRowIndex) return

    const getCellValue = (colIdx) => {
      if (colIdx === -1) return ''
      const cell = row.getCell(colIdx)
      if (!cell || cell.value === null || cell.value === undefined) return ''
      // handle rich text or formula object
      if (typeof cell.value === 'object') {
        if (cell.value.text) return String(cell.value.text).trim()
        if (cell.value.result) return String(cell.value.result).trim()
      }
      return String(cell.value).trim()
    }

    const name = getCellValue(colMap.name)
    const email = getCellValue(colMap.email)
    const rawRole = getCellValue(colMap.role).toLowerCase()
    const rawPhone = getCellValue(colMap.phone)
    const rawPassword = getCellValue(colMap.password)

    // Skip empty lines
    if (!name && !email && !rawPhone) return

    totalRows++

    // Validation
    const errors = []
    if (!name || name.length < 2) errors.push('Nama minimal 2 karakter')
    if (name.length > 120) errors.push('Nama maksimal 120 karakter')

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email || !emailRegex.test(email)) errors.push('Format email tidak valid')

    let role = 'user'
    if (rawRole.includes('admin')) {
      role = 'admin'
    }

    let phone = rawPhone.replace(/[^\d+(). -]/g, '')
    if (phone) {
      const digits = phone.replace(/\D/g, '')
      if (digits.length < 8 || digits.length > 15) {
        errors.push('Nomor telepon harus 8-15 digit')
      }
    }

    const password = rawPassword && rawPassword.length >= 8 ? rawPassword : 'Kreatifest123!'

    if (errors.length > 0) {
      invalidRows.push({
        rowNumber,
        name: name || '(Kosong)',
        email: email || '(Kosong)',
        errors: errors.join(', '),
      })
    } else {
      validUsers.push({
        name,
        email: email.toLowerCase(),
        role,
        phone,
        password,
      })
    }
  })

  return { validUsers, invalidRows, totalRows }
}
