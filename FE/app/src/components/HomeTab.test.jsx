import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { HomeTab } from './HomeTab'

const baseSummary = {
  safetyStatus: {
    level: 'CAUTION',
    message: '에어센서 확인이 필요합니다.',
    lastCheckedAt: '2026-06-10T14:30:00+09:00',
  },
  recentAlerts: [
    {
      alertId: 1,
      type: 'LIFE',
      severity: 'LOW',
      title: '식사 완료',
      message: '식사가 준비되었습니다.',
      deviceName: '식탁',
      occurredAt: '2026-06-10T14:20:00+09:00',
      status: 'CONFIRMED',
    },
    {
      alertId: 2,
      type: 'DANGER',
      severity: 'HIGH',
      title: '전기레인지 과열 주의',
      message: '주방에서 위험 신호가 감지되었습니다.',
      deviceName: '전기레인지',
      occurredAt: '2026-06-10T14:10:00+09:00',
      status: 'UNREAD',
    },
  ],
  deviceSummary: {
    totalCount: 4,
    connectedCount: 4,
    warningCount: 0,
    uwbSupportedCount: 1,
  },
  emergency: {
    enabled: true,
    primaryGuardianName: '보호자',
  },
  quickActions: {
    canRequestEmergency: false,
  },
}

describe('HomeTab', () => {
  it('keeps the safety-status alert metrics while hiding the real-time alert summary', () => {
    renderHomeTab()

    expect(screen.getByText('주의')).toBeTruthy()
    expect(screen.getByText('주의가 필요한 알림이 있어요. 내용을 확인해 주세요.')).toBeTruthy()
    expect(screen.queryByText(/60점/)).toBeNull()
    expect(document.querySelector('.status-badge')?.className).toContain('status-badge-caution')
    expect(screen.queryByText('방금')).toBeNull()
    expect(screen.getByText(/분 전|시간 전/)).toBeTruthy()
    expect(screen.getByRole('button', { name: '최근 알림 2건' })).toBeTruthy()
    expect(screen.getByRole('button', { name: '미확인 1건' })).toBeTruthy()
    expect(screen.queryByText('위험 1건')).toBeNull()
    expect(screen.queryByText('실시간 알림 요약')).toBeNull()
    expect(screen.queryByText('최근 알림')).toBeNull()
    expect(screen.queryByText('전기레인지 과열 주의')).toBeNull()
    expect(screen.queryByText('식사 완료')).toBeNull()
    expect(screen.queryByText('기기 연결 상태')).toBeNull()
    expect(screen.queryByText('주의/오류 없음')).toBeNull()
  })

  it('does not render alert details from the real-time summary data', () => {
    renderHomeTab({
      ...baseSummary,
      recentAlerts: [
        {
          alertId: 9,
          type: 'DANGER',
          severity: 'HIGH',
          title: 'UTC 알림',
          message: '시간은 한국 시간으로 보여야 합니다.',
          deviceName: '테스트 기기',
          occurredAt: '2026-06-19T07:43:00Z',
          status: 'UNREAD',
        },
      ],
    })

    expect(screen.queryByText('UTC 알림')).toBeNull()
    expect(screen.queryByText('시간은 한국 시간으로 보여야 합니다.')).toBeNull()
    expect(screen.queryByText(/16:43/)).toBeNull()
  })

  it('shows a safe summary when only a confirmed life alert remains', () => {
    renderHomeTab({
      ...baseSummary,
      safetyStatus: { ...baseSummary.safetyStatus, level: 'EMERGENCY' },
      recentAlerts: [
        {
          alertId: 11,
          type: 'LIFE',
          severity: 'LOW',
          title: '세탁 완료',
          status: 'CONFIRMED',
        },
      ],
    })

    expect(screen.getByText('안전')).toBeTruthy()
    expect(screen.getByText('안전한 상태예요. 확인이 필요한 알림은 없어요.')).toBeTruthy()
    expect(screen.queryByText('긴급')).toBeNull()
    expect(document.querySelector('.status-badge')?.className).toContain('status-badge-safe')
  })

  it('uses the emergency color class for the time badge when an emergency alert is active', () => {
    renderHomeTab({
      ...baseSummary,
      recentAlerts: [
        {
          alertId: 12,
          type: 'EMERGENCY',
          severity: 'CRITICAL',
          title: '긴급 알림',
          status: 'UNREAD',
        },
      ],
    })

    expect(screen.getByText('긴급')).toBeTruthy()
    expect(document.querySelector('.status-badge')?.className).toContain('status-badge-emergency')
  })

  it('keeps the SOS button clickable when a guardian must be registered first', async () => {
    const user = userEvent.setup()
    const handleEmergencyRequest = vi.fn()
    renderHomeTab(baseSummary, { onEmergencyRequest: handleEmergencyRequest })

    const sosButton = screen.getByRole('button', { name: '긴급 지원 요청' })

    expect(sosButton.disabled).toBe(false)

    await user.click(sosButton)

    expect(handleEmergencyRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        canRequest: false,
        reason: expect.stringContaining('보호자를 등록'),
      }),
    )
  })

  it('refreshes the home data from the status control', async () => {
    const user = userEvent.setup()
    const handleRefreshHome = vi.fn()
    renderHomeTab(baseSummary, { onRefreshHome: handleRefreshHome })

    await user.click(screen.getByRole('button', { name: '홈 정보 새로고침' }))

    expect(handleRefreshHome).toHaveBeenCalledTimes(1)
  })

  it('opens all alerts or unread alerts from the matching safety-summary item', async () => {
    const user = userEvent.setup()
    const handleOpenAlerts = vi.fn()
    const handleOpenUnreadAlerts = vi.fn()
    renderHomeTab(baseSummary, { onOpenAlerts: handleOpenAlerts, onOpenUnreadAlerts: handleOpenUnreadAlerts })

    await user.click(screen.getByRole('button', { name: '최근 알림 2건' }))
    await user.click(screen.getByRole('button', { name: '미확인 1건' }))

    expect(handleOpenAlerts).toHaveBeenCalledTimes(1)
    expect(handleOpenUnreadAlerts).toHaveBeenCalledTimes(1)
  })

  it('shows a disabled syncing control while the home data refreshes', () => {
    renderHomeTab(baseSummary, { refreshing: true })

    const refreshButton = screen.getByRole('button', { name: '홈 정보 새로고침' })
    expect(refreshButton.disabled).toBe(true)
  })

  it('sends the emergency request action when SOS is available', async () => {
    const user = userEvent.setup()
    const handleEmergencyRequest = vi.fn()
    renderHomeTab(
      {
        ...baseSummary,
        quickActions: { canRequestEmergency: true },
      },
      { onEmergencyRequest: handleEmergencyRequest },
    )

    await user.click(screen.getByRole('button', { name: '긴급 지원 요청' }))

    expect(handleEmergencyRequest).toHaveBeenCalledTimes(1)
  })
})

function renderHomeTab(summary = baseSummary, options = {}) {
  return render(
    <HomeTab
      emergencyMessage={options.emergencyMessage || ''}
      emergencySubmitting={false}
      refreshing={options.refreshing || false}
      summary={summary}
      onEmergencyRequest={options.onEmergencyRequest || (() => {})}
      onOpenAlerts={options.onOpenAlerts || (() => {})}
      onOpenUnreadAlerts={options.onOpenUnreadAlerts || (() => {})}
      onRefreshHome={options.onRefreshHome || (() => {})}
    />,
  )
}
