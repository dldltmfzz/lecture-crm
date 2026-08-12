import { useMemo, useState } from 'react'

const PASSWORD = 'company1234'
const STORAGE_KEY = 'company-customer-class-manager-v1'
const STAFF_STORAGE_KEY = 'company-staff-role-manager-v1'
const SIGNUP_STORAGE_KEY = 'company-signup-approval-v1'
const AUTH_STORAGE_KEY = 'company-customer-authed'
const CURRENT_USER_STORAGE_KEY = 'company-current-user-v1'

export const callStatusOptions = ['통화전', '통화후 입금대기중', '수업 듣지 않음', '부재중']

export const roleDefinitions = {
  owner: {
    label: '대표',
    short: '최고 관리자',
    summary: '돈·권한·삭제·전체 다운로드 최종 통제',
    dataScope: 'all',
    canManageRoles: true,
    canExportAll: true,
    canDeleteCustomers: true,
    canEditPayments: true,
  },
  manager: {
    label: '관리자',
    short: '운영 총괄',
    summary: '전체 고객 운영·상담 배정·진행 체크, 삭제/권한 변경 불가',
    dataScope: 'all',
    canManageRoles: false,
    canExportAll: false,
    canDeleteCustomers: false,
    canEditPayments: false,
  },
  staff: {
    label: '상담직원',
    short: '상담 담당',
    summary: '배정된 고객만 보고 전화·상담기록·재연락 처리',
    dataScope: 'assigned',
    canManageRoles: false,
    canExportAll: false,
    canDeleteCustomers: false,
    canEditPayments: false,
  },
}

const seedStaff = [
  { id: 'u-1', name: '희민마마', role: 'owner', note: '대표 계정', username: 'owner', password: PASSWORD, finalApproved: true },
  { id: 'u-2', name: '최매니저', role: 'staff', note: '운영 담당자' },
  { id: 'u-3', name: '이선생', role: 'staff', note: '상담 담당자' },
]

const seedCustomers = [
  { id: 'c-1', name: '김민지', phone: '010-1111-1111', className: 'AI 스마트폰 기초', paymentStatus: '입금 전', callStatus: '통화전', owner: '이선생', memo: '첫 상담 완료, 카드결제 안내 필요', status: '상담중' },
  { id: 'c-2', name: '박준호', phone: '010-2222-2222', className: '챗GPT 업무자동화', paymentStatus: '입금 후', callStatus: '통화후 입금대기중', owner: '최매니저', memo: '월요일 저녁반 확정', status: '등록완료' },
  { id: 'c-3', name: '오수진', phone: '010-3333-3333', className: 'AI 부업 실전반', paymentStatus: '부분 입금', callStatus: '부재중', owner: '희민마마', memo: '잔금 금요일 예정', status: '입금확인중' },
]

const seedSignupRequests = []

export function getCallStatusClass(callStatus) {
  return {
    통화전: 'call-before',
    '통화후 입금대기중': 'call-waiting-payment',
    '수업 듣지 않음': 'call-rejected',
    부재중: 'call-missed',
  }[callStatus] || 'call-before'
}

export function getPaymentSummary(customers) {
  return customers.reduce((acc, customer) => {
    if (customer.paymentStatus === '입금 전') acc.before += 1
    if (customer.paymentStatus === '입금 후') acc.after += 1
    if (customer.paymentStatus === '부분 입금') acc.partial += 1
    return acc
  }, { before: 0, after: 0, partial: 0 })
}

export function filterCustomers(customers, filters) {
  const query = filters.query.trim().toLowerCase()
  return customers.filter((customer) => {
    const matchesQuery = !query || [customer.name, customer.phone, customer.className, customer.owner, customer.memo, customer.status, customer.callStatus].join(' ').toLowerCase().includes(query)
    const matchesPayment = filters.paymentStatus === '전체' || customer.paymentStatus === filters.paymentStatus
    const matchesClass = filters.className === '전체' || customer.className === filters.className
    return matchesQuery && matchesPayment && matchesClass
  })
}

export function canCreateCredentials(signupRequests, name, phone) {
  const cleanName = name.trim()
  const cleanPhone = phone.trim()
  return signupRequests.some((request) => request.name === cleanName && request.phone === cleanPhone && request.status === 'approved')
}

function loadList(key, fallback) {
  try {
    const saved = localStorage.getItem(key)
    return saved ? JSON.parse(saved) : fallback
  } catch {
    return fallback
  }
}

function getSignupStatusLabel(status) {
  return {
    pending: '1차 승인 대기',
    approved: '아이디 생성 가능',
    credentialsPending: '최종 승인 대기',
    completed: '가입 완료',
    rejected: '반려',
  }[status] || '확인 필요'
}

export default function App() {
  const [loginMode, setLoginMode] = useState('owner')
  const [password, setPassword] = useState('')
  const [staffLogin, setStaffLogin] = useState({ username: '', password: '' })
  const [signupForm, setSignupForm] = useState({ name: '', phone: '' })
  const [credentialForm, setCredentialForm] = useState({ name: '', phone: '', username: '', password: '' })
  const [authMessage, setAuthMessage] = useState('')
  const [loginError, setLoginError] = useState('')
  const [isAuthed, setIsAuthed] = useState(() => localStorage.getItem(AUTH_STORAGE_KEY) === 'yes')
  const [currentUser, setCurrentUser] = useState(() => loadList(CURRENT_USER_STORAGE_KEY, { name: '희민마마', role: 'owner' }))
  const [customers, setCustomers] = useState(() => loadList(STORAGE_KEY, seedCustomers))
  const [staff, setStaff] = useState(() => loadList(STAFF_STORAGE_KEY, seedStaff))
  const [signupRequests, setSignupRequests] = useState(() => loadList(SIGNUP_STORAGE_KEY, seedSignupRequests))
  const [activePage, setActivePage] = useState('dashboard')
  const [newStaffName, setNewStaffName] = useState('')
  const [filters, setFilters] = useState({ query: '', paymentStatus: '전체', className: '전체' })
  const [form, setForm] = useState({ name: '', phone: '', className: '', paymentStatus: '입금 전', callStatus: '통화전', owner: '', memo: '', status: '상담중' })

  const classOptions = useMemo(() => Array.from(new Set(customers.map((customer) => customer.className).filter(Boolean))), [customers])
  const filteredCustomers = useMemo(() => filterCustomers(customers, filters), [customers, filters])
  const paymentSummary = useMemo(() => getPaymentSummary(customers), [customers])
  const isOwner = currentUser?.role === 'owner'

  function persistAuth(user) {
    localStorage.setItem(AUTH_STORAGE_KEY, 'yes')
    localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(user))
    setCurrentUser(user)
    setIsAuthed(true)
    setActivePage('dashboard')
    setLoginError('')
    setAuthMessage('')
  }

  function handleOwnerLogin(event) {
    event.preventDefault()
    if (password === PASSWORD) {
      persistAuth({ name: '희민마마', role: 'owner' })
      return
    }
    setLoginError('비밀번호가 맞지 않습니다. 관리자에게 확인해 주세요.')
  }

  function handleStaffLogin(event) {
    event.preventDefault()
    const user = staff.find((member) => member.username === staffLogin.username.trim() && member.password === staffLogin.password && member.finalApproved)
    if (!user) {
      setLoginError('아이디/비밀번호가 틀렸거나 대표 최종 승인이 아직입니다.')
      return
    }
    persistAuth({ name: user.name, role: user.role, username: user.username })
  }

  function handleSignupRequest(event) {
    event.preventDefault()
    const name = signupForm.name.trim()
    const phone = signupForm.phone.trim()
    if (!name || !phone) return
    const existing = signupRequests.find((request) => request.name === name && request.phone === phone)
    const nextRequests = existing
      ? signupRequests.map((request) => (request.id === existing.id ? { ...request, status: request.status === 'rejected' ? 'pending' : request.status } : request))
      : [{ id: `s-${Date.now()}`, name, phone, status: 'pending', requestedAt: new Date().toISOString() }, ...signupRequests]
    updateSignupRequests(nextRequests)
    setSignupForm({ name: '', phone: '' })
    setAuthMessage('대표 최종 승인 대기중입니다.')
  }

  function handleCredentialCreate(event) {
    event.preventDefault()
    const name = credentialForm.name.trim()
    const phone = credentialForm.phone.trim()
    const username = credentialForm.username.trim()
    const newPassword = credentialForm.password
    if (!name || !phone || !username || !newPassword) return
    if (staff.some((member) => member.username === username)) {
      setAuthMessage('이미 사용 중인 아이디입니다.')
      return
    }
    if (!canCreateCredentials(signupRequests, name, phone)) {
      setAuthMessage('대표가 이름과 핸드폰번호를 먼저 승인해야 아이디를 만들 수 있습니다.')
      return
    }
    updateSignupRequests(signupRequests.map((request) => (
      request.name === name && request.phone === phone
        ? { ...request, username, password: newPassword, status: 'credentialsPending' }
        : request
    )))
    setCredentialForm({ name: '', phone: '', username: '', password: '' })
    setAuthMessage('아이디 생성 완료. 대표 최종 승인을 기다려 주세요.')
  }

  function updateCustomers(nextCustomers) {
    setCustomers(nextCustomers)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextCustomers))
  }

  function updateStaff(nextStaff) {
    setStaff(nextStaff)
    localStorage.setItem(STAFF_STORAGE_KEY, JSON.stringify(nextStaff))
  }

  function updateSignupRequests(nextRequests) {
    setSignupRequests(nextRequests)
    localStorage.setItem(SIGNUP_STORAGE_KEY, JSON.stringify(nextRequests))
  }

  function addCustomer(event) {
    event.preventDefault()
    if (!form.name.trim() || !form.phone.trim() || !form.className.trim()) return
    updateCustomers([{ ...form, id: `c-${Date.now()}`, name: form.name.trim(), phone: form.phone.trim(), className: form.className.trim(), owner: form.owner.trim() || '미배정' }, ...customers])
    setForm({ name: '', phone: '', className: '', paymentStatus: '입금 전', callStatus: '통화전', owner: '', memo: '', status: '상담중' })
  }

  function updatePayment(id, paymentStatus) {
    updateCustomers(customers.map((customer) => (customer.id === id ? { ...customer, paymentStatus } : customer)))
  }

  function updateCallStatus(id, callStatus) {
    updateCustomers(customers.map((customer) => (customer.id === id ? { ...customer, callStatus } : customer)))
  }

  function removeCustomer(id) {
    if (!isOwner) return
    updateCustomers(customers.filter((customer) => customer.id !== id))
  }

  function updateStaffRole(id, role) {
    updateStaff(staff.map((member) => (member.id === id ? { ...member, role } : member)))
  }

  function addStaffMember(event) {
    event.preventDefault()
    const name = newStaffName.trim()
    if (!name) return
    updateStaff([{ id: `u-${Date.now()}`, name, role: 'staff', note: '새 직원' }, ...staff])
    setNewStaffName('')
  }

  function removeStaffMember(id) {
    const member = staff.find((item) => item.id === id)
    if (member?.role === 'owner') return
    updateStaff(staff.filter((item) => item.id !== id))
  }

  function approveSignupIdentity(id) {
    updateSignupRequests(signupRequests.map((request) => (request.id === id ? { ...request, status: 'approved' } : request)))
  }

  function finalizeSignup(id) {
    const request = signupRequests.find((item) => item.id === id)
    if (!request || request.status !== 'credentialsPending') return
    const nextStaff = staff.some((member) => member.username === request.username)
      ? staff.map((member) => (member.username === request.username ? { ...member, finalApproved: true, role: member.role || 'staff' } : member))
      : [{ id: `u-${Date.now()}`, name: request.name, phone: request.phone, username: request.username, password: request.password, finalApproved: true, role: 'staff', note: '회원가입 승인 직원' }, ...staff]
    updateStaff(nextStaff)
    updateSignupRequests(signupRequests.map((item) => (item.id === id ? { ...item, status: 'completed' } : item)))
  }

  function rejectSignup(id) {
    updateSignupRequests(signupRequests.map((request) => (request.id === id ? { ...request, status: 'rejected' } : request)))
  }

  function lockApp() {
    localStorage.removeItem(AUTH_STORAGE_KEY)
    localStorage.removeItem(CURRENT_USER_STORAGE_KEY)
    setIsAuthed(false)
    setPassword('')
    setStaffLogin({ username: '', password: '' })
    setLoginMode('owner')
  }

  if (!isAuthed) {
    return (
      <main className="login-page">
        <section className="login-card wide-login-card">
          <p className="eyebrow">Private Company Tool</p>
          <h1>회사 내부 고객명단</h1>
          <p>승인된 직원만 고객 정보, 수업 신청, 입금 상태를 확인할 수 있는 내부 관리 앱입니다.</p>
          <div className="login-tabs" aria-label="로그인 메뉴">
            <button type="button" className={loginMode === 'owner' ? 'active-tab' : 'ghost'} onClick={() => { setLoginMode('owner'); setLoginError(''); setAuthMessage('') }}>대표 로그인</button>
            <button type="button" className={loginMode === 'staff' ? 'active-tab' : 'ghost'} onClick={() => { setLoginMode('staff'); setLoginError(''); setAuthMessage('') }}>직원 로그인 화면</button>
            <button type="button" className={loginMode === 'signup' ? 'active-tab' : 'ghost'} onClick={() => { setLoginMode('signup'); setLoginError(''); setAuthMessage('') }}>회원가입 요청</button>
            <button type="button" className={loginMode === 'credentials' ? 'active-tab' : 'ghost'} onClick={() => { setLoginMode('credentials'); setLoginError(''); setAuthMessage('') }}>아이디 만들기</button>
          </div>

          {loginMode === 'owner' && (
            <form onSubmit={handleOwnerLogin}>
              <label htmlFor="password">회사 비밀번호</label>
              <input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="초기 비밀번호: company1234" />
              {loginError && <p className="error">{loginError}</p>}
              <button type="submit">입장하기</button>
            </form>
          )}

          {loginMode === 'staff' && (
            <form onSubmit={handleStaffLogin}>
              <label>아이디<input aria-label="아이디" value={staffLogin.username} onChange={(event) => setStaffLogin({ ...staffLogin, username: event.target.value })} /></label>
              <label>비밀번호<input aria-label="비밀번호" type="password" value={staffLogin.password} onChange={(event) => setStaffLogin({ ...staffLogin, password: event.target.value })} /></label>
              {loginError && <p className="error">{loginError}</p>}
              <button type="submit">직원 로그인</button>
            </form>
          )}

          {loginMode === 'signup' && (
            <form onSubmit={handleSignupRequest}>
              <label>가입 승인용 이름<input aria-label="가입 승인용 이름" value={signupForm.name} onChange={(event) => setSignupForm({ ...signupForm, name: event.target.value })} placeholder="실명" /></label>
              <label>가입 승인용 핸드폰번호<input aria-label="가입 승인용 핸드폰번호" value={signupForm.phone} onChange={(event) => setSignupForm({ ...signupForm, phone: event.target.value })} placeholder="010-0000-0000" /></label>
              <button type="submit">가입 승인 요청하기</button>
            </form>
          )}

          {loginMode === 'credentials' && (
            <form onSubmit={handleCredentialCreate}>
              <label>승인받은 이름<input aria-label="승인받은 이름" value={credentialForm.name} onChange={(event) => setCredentialForm({ ...credentialForm, name: event.target.value })} /></label>
              <label>승인받은 핸드폰번호<input aria-label="승인받은 핸드폰번호" value={credentialForm.phone} onChange={(event) => setCredentialForm({ ...credentialForm, phone: event.target.value })} /></label>
              <label>새 아이디<input aria-label="새 아이디" value={credentialForm.username} onChange={(event) => setCredentialForm({ ...credentialForm, username: event.target.value })} /></label>
              <label>새 비밀번호<input aria-label="새 비밀번호" type="password" value={credentialForm.password} onChange={(event) => setCredentialForm({ ...credentialForm, password: event.target.value })} /></label>
              <button type="submit">아이디 비밀번호 만들기</button>
            </form>
          )}

          {authMessage && <p className="success-message">{authMessage}</p>}
          <small>가입 순서: 이름·핸드폰 요청 → 대표 1차 승인 → 아이디/비밀번호 생성 → 대표 최종 승인 → 로그인 완료</small>
        </section>
      </main>
    )
  }

  return (
    <main className="app-shell">
      <header className="hero">
        <div>
          <p className="eyebrow">Customer · Class · Payment</p>
          <h1>고객 관리 대시보드</h1>
          <p>고객이 어떤 수업을 듣는지, 입금 전인지 후인지 한 화면에서 확인합니다.</p>
          <p className="muted">현재 로그인: {currentUser.name} · {roleDefinitions[currentUser.role]?.label || '직원'}</p>
        </div>
        <div className="header-actions">
          {isOwner && <button className="ghost" onClick={() => setActivePage(activePage === 'admin' ? 'dashboard' : 'admin')}>{activePage === 'admin' ? '대시보드' : '관리자 설정'}</button>}
          <button className="ghost" onClick={lockApp}>잠금</button>
        </div>
      </header>

      {activePage === 'admin' && isOwner ? (
        <>
          <section className="panel admin-panel">
            <div className="toolbar"><div><p className="eyebrow">Owner Control</p><h2>관리자 권한 설정</h2><p className="muted">최고 관리자인 대표가 직원별 계급과 접근 권한을 정합니다. 현재 설정은 이 브라우저에 저장됩니다.</p></div></div>
            <div className="role-grid">
              {Object.entries(roleDefinitions).map(([roleKey, role]) => (
                <article key={roleKey} className={`role-card role-${roleKey}`}>
                  <strong>{role.label}</strong><span>{role.short}</span><p>{role.summary}</p>
                  <ul><li>데이터 범위: {role.dataScope === 'all' ? '전체 고객' : '배정 고객만'}</li><li>권한 변경: {role.canManageRoles ? '가능' : '불가'}</li><li>전체 다운로드: {role.canExportAll ? '가능' : '불가'}</li><li>삭제 권한: {role.canDeleteCustomers ? '가능' : '불가'}</li></ul>
                </article>
              ))}
            </div>
          </section>

          <section className="panel">
            <div className="toolbar"><h2>회원가입 승인 관리</h2><p className="muted">1차로 이름·핸드폰번호를 승인하고, 아이디 생성 후 대표가 최종 승인해야 가입이 마무리됩니다.</p></div>
            <div className="table-wrap"><table><thead><tr><th>이름</th><th>핸드폰번호</th><th>아이디</th><th>상태</th><th>승인</th></tr></thead><tbody>
              {signupRequests.length === 0 && <tr><td colSpan="5">대기 중인 회원가입 요청이 없습니다.</td></tr>}
              {signupRequests.map((request) => (
                <tr key={request.id} data-testid={`signup-row-${request.name}`}>
                  <td>{request.name}</td><td>{request.phone}</td><td>{request.username || '-'}</td><td>{getSignupStatusLabel(request.status)}</td>
                  <td className="action-cell">
                    <button disabled={request.status !== 'pending'} onClick={() => approveSignupIdentity(request.id)}>1차 승인</button>
                    <button disabled={request.status !== 'credentialsPending'} onClick={() => finalizeSignup(request.id)}>최종 승인</button>
                    <button className="danger" disabled={request.status === 'completed'} onClick={() => rejectSignup(request.id)}>반려</button>
                  </td>
                </tr>
              ))}
            </tbody></table></div>
          </section>

          <section className="panel">
            <div className="toolbar"><h2>직원 계정 관리</h2><form className="staff-add" onSubmit={addStaffMember}><input aria-label="새 직원 이름" placeholder="직원 이름" value={newStaffName} onChange={(event) => setNewStaffName(event.target.value)} /><button type="submit">직원 추가</button></form></div>
            <div className="table-wrap"><table><thead><tr><th>이름</th><th>현재 계급</th><th>설명</th><th>권한 선택</th><th>관리</th></tr></thead><tbody>
              {staff.map((member) => {
                const role = roleDefinitions[member.role]
                return <tr key={member.id} data-testid={`staff-row-${member.name}`}><td>{member.name}</td><td><strong>{role.label}</strong><br /><span>{role.short}</span></td><td>{role.summary}</td><td><select aria-label={`${member.name} 권한`} value={member.role} onChange={(event) => updateStaffRole(member.id, event.target.value)} disabled={member.role === 'owner'}><option value="owner">대표</option><option value="manager">관리자</option><option value="staff">상담직원</option></select></td><td><button className="danger" disabled={member.role === 'owner'} onClick={() => removeStaffMember(member.id)}>직원 삭제</button></td></tr>
              })}
            </tbody></table></div>
          </section>
        </>
      ) : (
        <>
          <section className="stats-grid" aria-label="입금 요약">
            <article><strong>{customers.length}</strong><span>전체 고객</span></article><article><strong>{paymentSummary.before}</strong><span>입금 전</span></article><article><strong>{paymentSummary.after}</strong><span>입금 후</span></article><article><strong>{paymentSummary.partial}</strong><span>부분 입금</span></article>
          </section>
          <section className="panel"><h2>새 고객 추가</h2><form className="customer-form" onSubmit={addCustomer}>
            <label>고객명<input aria-label="고객명" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>
            <label>연락처<input aria-label="연락처" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></label>
            <label>수업명<input aria-label="수업명" value={form.className} onChange={(event) => setForm({ ...form, className: event.target.value })} placeholder="예: AI 부업 실전반" /></label>
            <label>입금 상태<select aria-label="입금 상태" value={form.paymentStatus} onChange={(event) => setForm({ ...form, paymentStatus: event.target.value })}><option>입금 전</option><option>부분 입금</option><option>입금 후</option></select></label>
            <label>통화/상담 상태<select aria-label="통화/상담 상태" value={form.callStatus} onChange={(event) => setForm({ ...form, callStatus: event.target.value })}>{callStatusOptions.map((option) => <option key={option}>{option}</option>)}</select></label>
            <label>담당자<input aria-label="담당자" value={form.owner} onChange={(event) => setForm({ ...form, owner: event.target.value })} /></label>
            <label className="wide">메모<input aria-label="메모" value={form.memo} onChange={(event) => setForm({ ...form, memo: event.target.value })} /></label><button type="submit">고객 추가</button>
          </form></section>
          <section className="panel"><div className="toolbar"><h2>고객 목록</h2><div className="filters"><input aria-label="검색" placeholder="이름, 연락처, 수업, 담당자 검색" value={filters.query} onChange={(event) => setFilters({ ...filters, query: event.target.value })} /><select aria-label="입금 필터" value={filters.paymentStatus} onChange={(event) => setFilters({ ...filters, paymentStatus: event.target.value })}><option>전체</option><option>입금 전</option><option>부분 입금</option><option>입금 후</option></select><select aria-label="수업 필터" value={filters.className} onChange={(event) => setFilters({ ...filters, className: event.target.value })}><option>전체</option>{classOptions.map((className) => <option key={className}>{className}</option>)}</select></div></div>
            <div className="table-wrap"><table><thead><tr><th>고객명</th><th>연락처</th><th>듣는 수업</th><th>입금 상태</th><th>통화/상담 상태</th><th>담당자</th><th>진행상태/메모</th><th>관리</th></tr></thead><tbody>{filteredCustomers.map((customer) => <tr key={customer.id} data-testid={`customer-row-${customer.name}`} className={getCallStatusClass(customer.callStatus)}><td>{customer.name}</td><td>{customer.phone}</td><td>{customer.className}</td><td><select className="payment-select" value={customer.paymentStatus} onChange={(event) => updatePayment(customer.id, event.target.value)} aria-label={`${customer.name} 입금 상태 변경`}><option>입금 전</option><option>부분 입금</option><option>입금 후</option></select></td><td><select className="status-select" value={customer.callStatus || '통화전'} onChange={(event) => updateCallStatus(customer.id, event.target.value)} aria-label={`${customer.name} 통화 상태 변경`}>{callStatusOptions.map((option) => <option key={option}>{option}</option>)}</select></td><td>{customer.owner}</td><td><strong>{customer.status}</strong><br /><span>{customer.memo || '메모 없음'}</span></td><td><button className="danger" disabled={!isOwner} onClick={() => removeCustomer(customer.id)}>삭제</button></td></tr>)}</tbody></table></div>
          </section>
        </>
      )}
    </main>
  )
}
