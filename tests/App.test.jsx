import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import App, { filterCustomers, getPaymentSummary, getCallStatusClass, roleDefinitions } from '../src/App.jsx'

afterEach(() => cleanup())

beforeEach(() => {
  localStorage.clear()
})

describe('customer class manager requirements', () => {
  it('summarizes payment states including before and after deposit', () => {
    const summary = getPaymentSummary([
      { paymentStatus: '입금 전' },
      { paymentStatus: '입금 후' },
      { paymentStatus: '입금 후' },
      { paymentStatus: '부분 입금' },
    ])

    expect(summary).toEqual({ before: 1, after: 2, partial: 1 })
  })

  it('filters customers by class name and payment status', () => {
    const customers = [
      { name: '김민지', phone: '010-1111-1111', className: 'AI 스마트폰 기초', paymentStatus: '입금 전', owner: '이선생' },
      { name: '박준호', phone: '010-2222-2222', className: '챗GPT 업무자동화', paymentStatus: '입금 후', owner: '최매니저' },
    ]

    expect(filterCustomers(customers, { query: '챗GPT', paymentStatus: '전체', className: '전체' })).toHaveLength(1)
    expect(filterCustomers(customers, { query: '', paymentStatus: '입금 전', className: '전체' })[0].name).toBe('김민지')
    expect(filterCustomers(customers, { query: '', paymentStatus: '전체', className: 'AI 스마트폰 기초' })[0].name).toBe('김민지')
  })

  it('protects the customer list behind company login', () => {
    render(<App />)

    expect(screen.getByRole('heading', { name: '회사 내부 고객명단' })).toBeInTheDocument()
    expect(screen.queryByText('고객 관리 대시보드')).not.toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('회사 비밀번호'), { target: { value: 'company1234' } })
    fireEvent.click(screen.getByRole('button', { name: '입장하기' }))

    expect(screen.getByText('고객 관리 대시보드')).toBeInTheDocument()
  })

  it('maps call statuses to the requested row color classes', () => {
    expect(getCallStatusClass('통화전')).toBe('call-before')
    expect(getCallStatusClass('통화후 입금대기중')).toBe('call-waiting-payment')
    expect(getCallStatusClass('수업 듣지 않음')).toBe('call-rejected')
    expect(getCallStatusClass('부재중')).toBe('call-missed')
  })

  it('lets staff add a customer with class, payment status, and colored call status', () => {
    render(<App />)
    fireEvent.change(screen.getByLabelText('회사 비밀번호'), { target: { value: 'company1234' } })
    fireEvent.click(screen.getByRole('button', { name: '입장하기' }))

    fireEvent.change(screen.getByLabelText('고객명'), { target: { value: '홍길동' } })
    fireEvent.change(screen.getByLabelText('연락처'), { target: { value: '010-9999-9999' } })
    fireEvent.change(screen.getByLabelText('수업명'), { target: { value: 'AI 부업 실전반' } })
    fireEvent.change(screen.getByLabelText('입금 상태'), { target: { value: '입금 전' } })
    fireEvent.change(screen.getByLabelText('통화/상담 상태'), { target: { value: '통화후 입금대기중' } })
    fireEvent.change(screen.getByLabelText('담당자'), { target: { value: '희민마마' } })
    fireEvent.click(screen.getByRole('button', { name: '고객 추가' }))

    const row = screen.getByTestId('customer-row-홍길동')
    expect(within(row).getByText('AI 부업 실전반')).toBeInTheDocument()
    expect(within(row).getByText('입금 전')).toBeInTheDocument()
    expect(within(row).getByText('통화후 입금대기중')).toBeInTheDocument()
    expect(row).toHaveClass('call-waiting-payment')
  })

  it('defines owner, manager, and staff permissions for the admin page', () => {
    expect(roleDefinitions.owner.canManageRoles).toBe(true)
    expect(roleDefinitions.owner.canExportAll).toBe(true)
    expect(roleDefinitions.manager.canManageRoles).toBe(false)
    expect(roleDefinitions.manager.canDeleteCustomers).toBe(false)
    expect(roleDefinitions.staff.dataScope).toBe('assigned')
  })

  it('lets the 최고 관리자 open the admin page and change a staff role', () => {
    render(<App />)
    fireEvent.change(screen.getByLabelText('회사 비밀번호'), { target: { value: 'company1234' } })
    fireEvent.click(screen.getByRole('button', { name: '입장하기' }))

    fireEvent.click(screen.getByRole('button', { name: '관리자 설정' }))

    expect(screen.getByRole('heading', { name: '관리자 권한 설정' })).toBeInTheDocument()
    expect(screen.getAllByText('대표').length).toBeGreaterThan(0)
    expect(screen.getAllByText('돈·권한·삭제·전체 다운로드 최종 통제').length).toBeGreaterThan(0)

    fireEvent.change(screen.getByLabelText('최매니저 권한'), { target: { value: 'manager' } })

    const managerRow = screen.getByTestId('staff-row-최매니저')
    expect(within(managerRow).getByText('운영 총괄')).toBeInTheDocument()
  })
})
