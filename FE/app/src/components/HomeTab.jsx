import { useEffect, useState } from 'react'
import {
  createHomeAlertMetrics,
  formatStatusUpdatedAt,
  getEmergencyAvailability,
  getHomeSafetySummary,
} from '../utils/homeSummaryUtils'

export function HomeTab({
  emergencyMessage,
  emergencySubmitting,
  alerts,
  refreshError,
  refreshing,
  summary,
  onEmergencyRequest,
  onOpenAlerts,
  onOpenUnreadAlerts,
  onRefreshHome,
}) {
  const [currentTime, setCurrentTime] = useState(() => new Date())
  const homeAlerts = alerts || summary.recentAlerts
  const alertMetrics = createHomeAlertMetrics(homeAlerts)
  const homeSafetySummary = getHomeSafetySummary(homeAlerts)
  const updatedAtLabel = formatStatusUpdatedAt(summary.safetyStatus.lastCheckedAt, currentTime)
  const emergencyAvailability = getEmergencyAvailability(summary)
  const emergencyStatusMessage = emergencyMessage
  const emergencyToastTone = getEmergencyToastTone(emergencyStatusMessage)

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setCurrentTime(new Date())
    }, 60_000)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [])

  function handleEmergencyClick() {
    onEmergencyRequest(emergencyAvailability)
  }

  return (
    <>
      <section className={`status-card home-safety-card status-${homeSafetySummary.level.toLowerCase()}`}>
        <div className="status-card-header">
          <div>
            <p className="card-label">오늘의 안전 상태</p>
            <strong className="card-title safety-status-title">
              <span>{homeSafetySummary.label}</span>
              <span className="safety-status-emoji" aria-hidden="true">
                {homeSafetySummary.emoji}
              </span>
            </strong>
          </div>
          <div className="status-refresh-control">
            {updatedAtLabel ? (
              <span className={`status-badge status-badge-${homeSafetySummary.level.toLowerCase()}`}>
                {updatedAtLabel}
              </span>
            ) : null}
          </div>
        </div>
        <p className="status-copy">{homeSafetySummary.message}</p>
        {refreshError ? (
          <p className="status-refresh-error" role="alert">
            {refreshError}
          </p>
        ) : null}
        <div className="home-metric-row" aria-label="오늘 알림 요약">
          <div className="home-metric-pills home-metric-pills-two">
            <button className="home-metric-pill home-metric-button" type="button" onClick={onOpenAlerts}>
              최근 알림 {alertMetrics.total}건
            </button>
            <button
              className="home-metric-pill home-metric-button"
              type="button"
              onClick={onOpenUnreadAlerts}
            >
              미확인 {alertMetrics.unread}건
            </button>
          </div>
          <button
            className="status-refresh-button home-metric-refresh-button"
            type="button"
            aria-label="홈 정보 새로고침"
            aria-busy={refreshing}
            disabled={refreshing}
            onClick={onRefreshHome}
          >
            <svg className={refreshing ? 'is-spinning' : undefined} viewBox="0 0 24 24" focusable="false">
              <path d="M20 11a8 8 0 0 0-14.7-4.4L4 8" />
              <path d="M4 4v4h4" />
              <path d="M4 13a8 8 0 0 0 14.7 4.4L20 16" />
              <path d="M20 20v-4h-4" />
            </svg>
          </button>
        </div>
      </section>

      <section className="emergency-card">
        <div>
          <p className="card-label">긴급 지원 요청</p>
          <strong className="card-title">보호자에게 바로 알림</strong>
          <p className="emergency-card-copy">버튼을 누르면 보호자에게 상황을 즉시 알립니다.</p>
        </div>
        <button
          className="sos-button"
          type="button"
          aria-busy={emergencySubmitting}
          disabled={emergencySubmitting}
          onClick={handleEmergencyClick}
        >
          {emergencySubmitting ? '요청 전송 중...' : '긴급 지원 요청'}
        </button>
      </section>

      {emergencyStatusMessage ? (
        <div
          className="device-toast"
          role={emergencyToastTone === 'error' ? 'alert' : 'status'}
          aria-live={emergencyToastTone === 'error' ? 'assertive' : 'polite'}
        >
          <p className="device-toast-message">{emergencyStatusMessage}</p>
        </div>
      ) : null}
    </>
  )
}

function getEmergencyToastTone(message) {
  if (!message) {
    return 'success'
  }

  if (
    message.includes('등록한 뒤 사용할 수 있습니다') ||
    message.includes('먼저 등록') ||
    message.includes('실패') ||
    message.includes('못했습니다') ||
    message.includes('다시 시도')
  ) {
    return 'error'
  }

  return 'success'
}
