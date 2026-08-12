import { useMemo, useState } from 'react'

const PASSWORD = 'company1234'
const STORAGE_KEY = 'company-customer-class-manager-v1'

export const callStatusOptions = ['통화전', '통화후 입금대기중', '수업 듣지 않음', '부재중']

export function getCallStatusClass(callStatus) {
  return {
    통화전: 'call-before',
    '통화후 입금대기중': 'call-waiting-payment',
    '수업 듣지 않음': 'call-rejected',
    부재중: 'call-missed',
  }[callStatus] || 'call-before'
}

const seedCustomers = [
  {
    id: 'c-1',
    name: '김민지',
    phone: '010-1111-1111',
    className: 'AI 스마트폰 기초',
    paymentStatus: '입금 전',
    callStatus: '통화전',
    owner: '이선생',
    memo: '첫 상담 완료, 카드결제 안내 필요',
    status: '상담중',
  },
  {
    id: 'c-2',
    name: '박준호',
    phone: '010-2222-2222',
    className: '챗GPT 업무자동화',
    paymentStatus: '입금 후',
    callStatus: '통화후 입금대기중',
    owner: '최매니저',
    memo: '월요일 저녁반 확정',
    status: '등록완료',
  },
  {
    id: 'c-3',
    name: '오수진',
    phone: '010-3333-3333',
    className: 'AI 부업 실전반',
    paymentStatus: '부분 입금',
    callStatus: '부재중',
    owner: '희민마마',
    memo: '잔금 금요일 예정',
    status: '입금확인중',
  },
]

export function getPaymentSummary(customers) {
  return customers.reduce(
    (acc, customer) => {
      if (customer.paymentStatus === '입금 전') acc.before += 1
      if (customer.paymentStatus === '입금 후') acc.after += 1
      if (customer.paymentStatus === '부분 입금') acc.partial += 1
      return acc
    },
    { before: 0, after: 0, partial: 0 },
  )
}

export function filterCustomers(customers, filters) {
  const query = filters.query.trim().toLowerCase()
  return customers.filter((customer) => {
    const matchesQuery =
      !query ||
      [customer.name, customer.phone, customer.className, customer.owner, customer.memo, customer.status, customer.callStatus]
        .join(' ')
        .toLowerCase()
        .includes(query)
    const matchesPayment = filters.paymentStatus === '전체' || customer.paymentStatus === filters.paymentStatus
    const matchesClass = filters.className === '전체' || customer.className === filters.className
    return matchesQuery && matchesPayment && matchesClass
  })
}

function loadCustomers() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved) : seedCustomers
  } catch {
    return seedCustomers
  }
}

function saveCustomers(customers) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(customers))
}

export default function App() {
  const [password, setPassword] = useState('')
  const [isAuthed, setIsAuthed] = useState(() => localStorage.getItem('company-customer-authed') === 'yes')
  const [loginError, setLoginError] = useState('')
  const [customers, setCustomers] = useState(loadCustomers)
  const [filters, setFilters] = useState({ query: '', paymentStatus: '전체', className: '전체' })
  const [form, setForm] = useState({
    name: '',
    phone: '',
    className: '',
    paymentStatus: '입금 전',
    callStatus: '통화전',
    owner: '',
    memo: '',
    status: '상담중',
  })

  const classOptions = useMemo(() => {
    return Array.from(new Set(customers.map((customer) => customer.className).filter(Boolean)))
  }, [customers])

  const filteredCustomers = useMemo(() => filterCustomers(customers, filters), [customers, filters])
  const paymentSummary = useMemo(() => getPaymentSummary(customers), [customers])

  function handleLogin(event) {
    event.preventDefault()
    if (password === PASSWORD) {
      localStorage.setItem('company-customer-authed', 'yes')
      setIsAuthed(true)
      setLoginError('')
      return
    }
    setLoginError('비밀번호가 맞지 않습니다. 관리자에게 확인해 주세요.')
  }

  function updateCustomers(nextCustomers) {
    setCustomers(nextCustomers)
    saveCustomers(nextCustomers)
  }

  function addCustomer(event) {
    event.preventDefault()
    if (!form.name.trim() || !form.phone.trim() || !form.className.trim()) return
    updateCustomers([
      {
        ...form,
        id: `c-${Date.now()}`,
        name: form.name.trim(),
        phone: form.phone.trim(),
        className: form.className.trim(),
        owner: form.owner.trim() || '미배정',
      },
      ...customers,
    ])
    setForm({ name: '', phone: '', className: '', paymentStatus: '입금 전', callStatus: '통화전', owner: '', memo: '', status: '상담중' })
  }

  function updatePayment(id, paymentStatus) {
    updateCustomers(customers.map((customer) => (customer.id === id ? { ...customer, paymentStatus } : customer)))
  }

  function updateCallStatus(id, callStatus) {
    updateCustomers(customers.map((customer) => (customer.id === id ? { ...customer, callStatus } : customer)))
  }

  function removeCustomer(id) {
    updateCustomers(customers.filter((customer) => customer.id !== id))
  }

  if (!isAuthed) {
    return (
      <main className="login-page">
        <section className="login-card">
          <p className="eyebrow">Private Company Tool</p>
          <h1>회사 내부 고객명단</h1>
          <p>회사 사람들만 고객 정보, 수업 신청, 입금 상태를 확인할 수 있는 내부 관리 앱입니다.</p>
          <form onSubmit={handleLogin}>
            <label htmlFor="password">회사 비밀번호</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="초기 비밀번호: company1234"
            />
            {loginError && <p className="error">{loginError}</p>}
            <button type="submit">입장하기</button>
          </form>
          <small>초기 MVP용 비밀번호입니다. 실제 배포 시에는 직원별 계정으로 바꾸면 됩니다.</small>
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
        </div>
        <button
          className="ghost"
          onClick={() => {
            localStorage.removeItem('company-customer-authed')
            setIsAuthed(false)
          }}
        >
          잠금
        </button>
      </header>

      <section className="stats-grid" aria-label="입금 요약">
        <article><strong>{customers.length}</strong><span>전체 고객</span></article>
        <article><strong>{paymentSummary.before}</strong><span>입금 전</span></article>
        <article><strong>{paymentSummary.after}</strong><span>입금 후</span></article>
        <article><strong>{paymentSummary.partial}</strong><span>부분 입금</span></article>
      </section>

      <section className="panel">
        <h2>새 고객 추가</h2>
        <form className="customer-form" onSubmit={addCustomer}>
          <label>고객명<input aria-label="고객명" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>
          <label>연락처<input aria-label="연락처" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></label>
          <label>수업명<input aria-label="수업명" value={form.className} onChange={(event) => setForm({ ...form, className: event.target.value })} placeholder="예: AI 부업 실전반" /></label>
          <label>입금 상태
            <select aria-label="입금 상태" value={form.paymentStatus} onChange={(event) => setForm({ ...form, paymentStatus: event.target.value })}>
              <option>입금 전</option>
              <option>부분 입금</option>
              <option>입금 후</option>
            </select>
          </label>
          <label>통화/상담 상태
            <select aria-label="통화/상담 상태" value={form.callStatus} onChange={(event) => setForm({ ...form, callStatus: event.target.value })}>
              {callStatusOptions.map((option) => <option key={option}>{option}</option>)}
            </select>
          </label>
          <label>담당자<input aria-label="담당자" value={form.owner} onChange={(event) => setForm({ ...form, owner: event.target.value })} /></label>
          <label className="wide">메모<input aria-label="메모" value={form.memo} onChange={(event) => setForm({ ...form, memo: event.target.value })} /></label>
          <button type="submit">고객 추가</button>
        </form>
      </section>

      <section className="panel">
        <div className="toolbar">
          <h2>고객 목록</h2>
          <div className="filters">
            <input aria-label="검색" placeholder="이름, 연락처, 수업, 담당자 검색" value={filters.query} onChange={(event) => setFilters({ ...filters, query: event.target.value })} />
            <select aria-label="입금 필터" value={filters.paymentStatus} onChange={(event) => setFilters({ ...filters, paymentStatus: event.target.value })}>
              <option>전체</option>
              <option>입금 전</option>
              <option>부분 입금</option>
              <option>입금 후</option>
            </select>
            <select aria-label="수업 필터" value={filters.className} onChange={(event) => setFilters({ ...filters, className: event.target.value })}>
              <option>전체</option>
              {classOptions.map((className) => <option key={className}>{className}</option>)}
            </select>
          </div>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>고객명</th><th>연락처</th><th>듣는 수업</th><th>입금 상태</th><th>통화/상담 상태</th><th>담당자</th><th>진행상태/메모</th><th>관리</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map((customer) => (
                <tr key={customer.id} data-testid={`customer-row-${customer.name}`} className={getCallStatusClass(customer.callStatus)}>
                  <td>{customer.name}</td>
                  <td>{customer.phone}</td>
                  <td>{customer.className}</td>
                  <td>
                    <select className="payment-select" value={customer.paymentStatus} onChange={(event) => updatePayment(customer.id, event.target.value)} aria-label={`${customer.name} 입금 상태 변경`}>
                      <option>입금 전</option>
                      <option>부분 입금</option>
                      <option>입금 후</option>
                    </select>
                  </td>
                  <td>
                    <select className="status-select" value={customer.callStatus || '통화전'} onChange={(event) => updateCallStatus(customer.id, event.target.value)} aria-label={`${customer.name} 통화 상태 변경`}>
                      {callStatusOptions.map((option) => <option key={option}>{option}</option>)}
                    </select>
                  </td>
                  <td>{customer.owner}</td>
                  <td><strong>{customer.status}</strong><br /><span>{customer.memo || '메모 없음'}</span></td>
                  <td><button className="danger" onClick={() => removeCustomer(customer.id)}>삭제</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  )
}
