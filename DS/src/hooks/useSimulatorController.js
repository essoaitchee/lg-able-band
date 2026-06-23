import { useEffect, useMemo, useRef, useState } from 'react'
import { sendSimulatorEvent } from '../api/notificationApi'
import { APPLIANCES, APPLIANCE_EVENT_MAP } from '../constants/applianceEvents'

const WASHER_MODES = ['표준', '쾌속', '이불']
const WASHER_MODE_ANGLES = {
  표준: 0,
  쾌속: 120,
  이불: 240,
}

const initialStates = {
  washingMachine: {
    machineState: 'OFF',
    power: '꺼짐',
    status: '전원 꺼짐',
    mode: '표준',
    doorOpen: false,
    running: false,
    completed: false,
    error: false,
    drumRotation: 0,
    dialAngle: 0,
    displayMessage: 'OFF',
    displayDetail: '전원을 켜세요',
    countdown: 0,
    interactionHint: '문을 클릭하고 다이얼을 돌려 보세요.',
    doorShakeTick: 0,
  },
  airQualitySensor: {
    power: '켜짐',
    status: '정상',
    mode: '실내 모니터링',
    co2: 650,
    temperature: 24,
    humidity: 45,
    fineDust: 15,
  },
  tv: {
    power: '꺼짐',
    status: '대기',
    mode: 'HDMI 1',
    on: false,
    volume: 12,
    channel: 7,
    remotePulse: false,
  },
  electricRange: {
    power: '꺼짐',
    status: '대기',
    mode: '출력 없음',
    on: false,
    overheating: false,
    residual: false,
    glowColor: '#5f6570',
  },
  doorSensor: {
    power: '켜짐',
    status: '닫힘',
    mode: '일반',
    open: false,
    warning: false,
    elapsed: 0,
  },
  refrigerator: {
    power: '켜짐',
    status: '정상 냉장',
    mode: '일반 냉장',
    doorOpen: false,
    temperature: 3,
    temperatureWarning: false,
    highlightShelf: 0,
  },
}

export function useSimulatorController(selectedApplianceId, targetUserEmail) {
  const [stateMap, setStateMap] = useState(initialStates)
  const [latestEvent, setLatestEvent] = useState('')
  const [notificationResult, setNotificationResult] = useState(null)
  const [busyAction, setBusyAction] = useState('')
  const timersRef = useRef([])
  const washerCycleTokenRef = useRef(0)
  const washerBlockedStartNotifiedRef = useRef(false)
  const washerRunningDoorNotifiedRef = useRef(false)

  useEffect(
    () => () => {
      timersRef.current.forEach((timer) => window.clearTimeout(timer))
      timersRef.current = []
    },
    [],
  )

  useEffect(() => {
    timersRef.current.forEach((timer) => window.clearTimeout(timer))
    timersRef.current = []
    setBusyAction('')
  }, [selectedApplianceId])

  const currentState = stateMap[selectedApplianceId]
  const applianceMeta = APPLIANCES.find((item) => item.id === selectedApplianceId)

  const statusView = useMemo(() => {
    switch (selectedApplianceId) {
      case 'washingMachine':
        return {
          applianceName: '세탁기',
          powerState: currentState.power,
          operatingState: currentState.machineState,
          modeLabel: currentState.mode,
          statusLines: [
            `문 상태: ${currentState.doorOpen ? '열림' : '닫힘'}`,
            `디스플레이: ${currentState.displayMessage}${currentState.displayDetail ? ` · ${currentState.displayDetail}` : ''}`,
            currentState.interactionHint,
          ],
        }
      case 'airQualitySensor':
        return {
          applianceName: 'LG 공기질 센서',
          powerState: currentState.power,
          operatingState: currentState.status,
          modeLabel: `${currentState.co2} ppm`,
          statusLines: [
            `온도 ${currentState.temperature}°C`,
            `습도 ${currentState.humidity}%`,
            `미세먼지 ${currentState.fineDust} μg/m³`,
          ],
        }
      case 'tv':
        return {
          applianceName: 'TV',
          powerState: currentState.power,
          operatingState: currentState.status,
          modeLabel: currentState.mode,
          statusLines: [`채널 ${currentState.channel}`, `볼륨 ${currentState.volume}`],
        }
      case 'electricRange':
        return {
          applianceName: '전기레인지',
          powerState: currentState.power,
          operatingState: currentState.status,
          modeLabel: currentState.mode,
          statusLines: [currentState.residual ? '잔열 상태가 유지되고 있어요.' : '안전한 대기 상태를 시연하고 있어요.'],
        }
      case 'doorSensor':
        return {
          applianceName: '도어센서',
          powerState: currentState.power,
          operatingState: currentState.status,
          modeLabel: currentState.mode,
          statusLines: [currentState.open ? `문이 열린 시간 ${currentState.elapsed}초` : '문이 닫혀 있어요.'],
        }
      case 'refrigerator':
        return {
          applianceName: '냉장고',
          powerState: currentState.power,
          operatingState: currentState.status,
          modeLabel: `${currentState.temperature}°C`,
          statusLines: ['문 열림, 온도 경고, 식재료 찾기 시연이 가능합니다.'],
        }
      default:
        return { applianceName: '', powerState: '', operatingState: '', modeLabel: '', statusLines: [] }
    }
  }, [currentState, selectedApplianceId])

  async function dispatchEvent(actionKey) {
    const normalizedTargetUserEmail = String(targetUserEmail || '').trim().toLowerCase()

    if (!normalizedTargetUserEmail) {
      setNotificationResult({ type: 'error', message: '사용자 이메일을 먼저 입력해 주세요.' })
      return false
    }

    if (!normalizedTargetUserEmail.includes('@')) {
      setNotificationResult({ type: 'error', message: '올바른 이메일 형식으로 입력해 주세요.' })
      return false
    }

    const eventMeta = APPLIANCE_EVENT_MAP[selectedApplianceId]?.[actionKey]
    if (!eventMeta || busyAction) {
      return false
    }

    setBusyAction(actionKey)
    setLatestEvent(`${applianceMeta.label} · ${eventMeta.eventType}`)
    setNotificationResult({ type: 'pending', message: '알림을 전송하는 중입니다...' })

    try {
      await sendSimulatorEvent({
        targetUserEmail: normalizedTargetUserEmail,
        applianceType: applianceMeta.applianceType,
        eventType: eventMeta.eventType,
        title: eventMeta.title,
        message: eventMeta.message,
      })
      setNotificationResult({ type: 'success', message: eventMeta.toast })
      return true
    } catch (error) {
      setNotificationResult({ type: 'error', message: error.message || '알림 전송에 실패했습니다.' })
      return false
    } finally {
      setBusyAction('')
    }
  }

  function updateCurrentState(updater) {
    setStateMap((current) => ({
      ...current,
      [selectedApplianceId]:
        typeof updater === 'function'
          ? updater(current[selectedApplianceId])
          : { ...current[selectedApplianceId], ...updater },
    }))
  }

  function updateWasherState(updater) {
    setStateMap((current) => ({
      ...current,
      washingMachine:
        typeof updater === 'function'
          ? updater(current.washingMachine)
          : { ...current.washingMachine, ...updater },
    }))
  }

  function registerTimer(callback, delay) {
    const timer = window.setTimeout(callback, delay)
    timersRef.current.push(timer)
    return timer
  }

  function resetWasherNotificationGuards() {
    washerBlockedStartNotifiedRef.current = false
    washerRunningDoorNotifiedRef.current = false
  }

  async function notifyWasherModeChange(mode) {
    const changed = await dispatchEvent('CHANGE_MODE')
    if (changed) {
      updateWasherState((current) => ({
        ...current,
        displayMessage: mode,
        displayDetail: '모드 변경 완료',
        interactionHint: '전원 버튼을 켜고 시작 버튼을 눌러 보세요.',
      }))
    }
  }

  const washerActions = {
    async toggleDoor() {
      const washer = stateMap.washingMachine

      if (washer.machineState === 'WASHING') {
        updateWasherState((current) => ({
          ...current,
          machineState: 'ERROR',
          status: '문 열기 오류',
          error: true,
          displayMessage: 'ERROR',
          displayDetail: '작동 중 문 열림',
          interactionHint: '세탁 중에는 문을 열 수 없어요.',
          doorShakeTick: current.doorShakeTick + 1,
        }))

        if (!washerRunningDoorNotifiedRef.current) {
          washerRunningDoorNotifiedRef.current = true
          await dispatchEvent('TRIGGER_ERROR')
        }
        return
      }

      if (washer.doorOpen) {
        resetWasherNotificationGuards()
        updateWasherState((current) => ({
          ...current,
          doorOpen: false,
          error: false,
          machineState: current.power === '켜짐' ? 'READY' : 'OFF',
          status: current.power === '켜짐' ? '대기' : '전원 꺼짐',
          displayMessage: current.power === '켜짐' ? current.mode : 'OFF',
          displayDetail: current.power === '켜짐' ? '문 닫힘' : '전원을 켜세요',
          interactionHint: '시작 버튼을 눌러 세탁을 시작할 수 있어요.',
        }))
        return
      }

      resetWasherNotificationGuards()
      updateWasherState((current) => ({
        ...current,
        doorOpen: true,
        completed: false,
        error: false,
        machineState: 'DOOR_OPEN',
        status: '문 열림',
        displayMessage: 'DOOR',
        displayDetail: '문이 열렸습니다',
        interactionHint: '문을 다시 클릭하면 닫을 수 있어요.',
      }))
      await dispatchEvent('OPEN_DOOR')
    },

    async selectMode(mode) {
      const washer = stateMap.washingMachine

      if (washer.machineState === 'WASHING' || washer.mode === mode) {
        return
      }

      resetWasherNotificationGuards()
      updateWasherState((current) => ({
        ...current,
        mode,
        dialAngle: WASHER_MODE_ANGLES[mode] || 0,
        error: false,
        completed: false,
        machineState: current.power === '켜짐' ? (current.doorOpen ? 'DOOR_OPEN' : 'READY') : 'OFF',
        status: current.power === '켜짐' ? '모드 선택' : '전원 꺼짐',
        displayMessage: current.power === '켜짐' ? mode : 'OFF',
        displayDetail: current.power === '켜짐' ? '모드 변경 중' : '전원을 켜세요',
        interactionHint: '다이얼을 드래그해서 모드를 바꿀 수 있어요.',
      }))
      await notifyWasherModeChange(mode)
    },

    async stepMode(direction = 1) {
      const washer = stateMap.washingMachine
      const currentIndex = WASHER_MODES.indexOf(washer.mode)
      const nextIndex = (currentIndex + direction + WASHER_MODES.length) % WASHER_MODES.length
      await washerActions.selectMode(WASHER_MODES[nextIndex])
    },

    togglePower() {
      const washer = stateMap.washingMachine
      if (washer.machineState === 'WASHING') {
        return
      }

      resetWasherNotificationGuards()
      updateWasherState((current) => {
        const nextPowered = current.power !== '켜짐'
        return {
          ...current,
          power: nextPowered ? '켜짐' : '꺼짐',
          error: false,
          completed: nextPowered ? current.completed : false,
          machineState: nextPowered ? (current.doorOpen ? 'DOOR_OPEN' : current.completed ? 'COMPLETED' : 'READY') : 'OFF',
          status: nextPowered ? (current.doorOpen ? '문 열림' : current.completed ? '세탁 완료' : '대기') : '전원 꺼짐',
          displayMessage: nextPowered ? current.mode : 'OFF',
          displayDetail: nextPowered ? (current.doorOpen ? '문을 닫아 주세요' : current.completed ? '세탁 완료' : '시작 준비 완료') : '전원을 켜세요',
          interactionHint: nextPowered ? '시작 버튼을 눌러 세탁을 시작하세요.' : '전원 버튼을 눌러 기기를 켜세요.',
        }
      })
    },

    async pressStart() {
      const washer = stateMap.washingMachine
      if (washer.power !== '켜짐') {
        updateWasherState((current) => ({
          ...current,
          displayMessage: 'OFF',
          displayDetail: '전원을 먼저 켜세요',
          interactionHint: '전원 버튼을 먼저 눌러 주세요.',
        }))
        return
      }

      if (washer.doorOpen) {
        updateWasherState((current) => ({
          ...current,
          machineState: 'ERROR',
          status: '시작 실패',
          error: true,
          displayMessage: 'Close Door',
          displayDetail: '문을 닫아 주세요',
          interactionHint: '문을 닫은 뒤 다시 시작 버튼을 눌러 주세요.',
          doorShakeTick: current.doorShakeTick + 1,
        }))

        if (!washerBlockedStartNotifiedRef.current) {
          washerBlockedStartNotifiedRef.current = true
          await dispatchEvent('TRIGGER_ERROR')
        }
        return
      }

      if (washer.machineState !== 'READY') {
        return
      }

      resetWasherNotificationGuards()
      washerCycleTokenRef.current += 1
      const cycleToken = washerCycleTokenRef.current

      updateWasherState((current) => ({
        ...current,
        machineState: 'WASHING',
        status: '세탁 중',
        running: true,
        completed: false,
        error: false,
        countdown: 5,
        displayMessage: current.mode,
        displayDetail: '5초 남음',
        interactionHint: '세탁 중에는 문을 열 수 없어요.',
      }))

      ;[4, 3, 2, 1].forEach((secondsLeft, index) => {
        registerTimer(() => {
          if (washerCycleTokenRef.current !== cycleToken) {
            return
          }
          updateWasherState((current) => ({
            ...current,
            countdown: secondsLeft,
            displayMessage: current.mode,
            displayDetail: `${secondsLeft}초 남음`,
          }))
        }, (index + 1) * 1000)
      })

      registerTimer(async () => {
        if (washerCycleTokenRef.current !== cycleToken) {
          return
        }
        updateWasherState((current) => ({
          ...current,
          machineState: 'COMPLETED',
          status: '세탁 완료',
          running: false,
          completed: true,
          error: false,
          countdown: 0,
          displayMessage: 'DONE',
          displayDetail: '세탁 완료',
          interactionHint: '문을 열고 세탁물을 꺼내 보세요.',
        }))
        await dispatchEvent('START_WASHING')
      }, 5000)
    },
  }

  const actions = createApplianceActions({
    applianceId: selectedApplianceId,
    state: currentState,
    updateCurrentState,
    dispatchEvent,
    registerTimer,
    washerActions,
  })

  return {
    currentState,
    latestEvent,
    notificationResult,
    busyAction,
    statusView,
    actions,
  }
}

function createApplianceActions({
  applianceId,
  state,
  updateCurrentState,
  dispatchEvent,
  registerTimer,
  washerActions,
}) {
  if (applianceId === 'washingMachine') {
    return washerActions
  }

  if (applianceId === 'airQualitySensor') {
    return {
      async increaseCo2() {
        updateCurrentState((current) => ({ ...current, co2: 1500, status: '경고', mode: '환기 필요' }))
        await dispatchEvent('HIGH_CO2')
      },
      async updateTemperature(value) {
        updateCurrentState((current) => ({ ...current, temperature: value, status: value >= 31 ? '경고' : '정상' }))
        if (value >= 31 || state.humidity >= 70) {
          await dispatchEvent('TEMP_HUMIDITY_ALERT')
        }
      },
      async updateHumidity(value) {
        updateCurrentState((current) => ({ ...current, humidity: value, status: value >= 70 ? '경고' : '정상' }))
        if (value >= 70 || state.temperature >= 31) {
          await dispatchEvent('TEMP_HUMIDITY_ALERT')
        }
      },
      async increaseFineDust() {
        updateCurrentState((current) => ({ ...current, fineDust: 80, status: '경고', mode: '공기질 악화' }))
        await dispatchEvent('HIGH_FINE_DUST')
      },
    }
  }

  if (applianceId === 'tv') {
    return {
      async togglePower() {
        updateCurrentState((current) => ({
          ...current,
          on: !current.on,
          power: current.on ? '꺼짐' : '켜짐',
          status: current.on ? '대기' : '시청 중',
        }))
        await dispatchEvent('TOGGLE_POWER')
      },
      async changeVolume(delta) {
        updateCurrentState((current) => ({
          ...current,
          on: true,
          power: '켜짐',
          status: '볼륨 변경',
          volume: Math.max(0, Math.min(40, current.volume + delta)),
        }))
        await dispatchEvent('CHANGE_MEDIA')
      },
      async changeChannel(delta) {
        updateCurrentState((current) => ({
          ...current,
          on: true,
          power: '켜짐',
          status: '채널 변경',
          channel: Math.max(1, current.channel + delta),
        }))
        await dispatchEvent('CHANGE_MEDIA')
      },
      async findRemote() {
        updateCurrentState((current) => ({ ...current, remotePulse: true, status: '리모컨 위치 안내' }))
        registerTimer(() => updateCurrentState((current) => ({ ...current, remotePulse: false, status: '대기' })), 2200)
        await dispatchEvent('FIND_REMOTE')
      },
    }
  }

  if (applianceId === 'electricRange') {
    return {
      async powerOn() {
        updateCurrentState((current) => ({
          ...current,
          on: true,
          power: '켜짐',
          status: '가열 중',
          glowColor: '#ff5b43',
          residual: false,
          overheating: false,
        }))
        await dispatchEvent('POWER_ON')
      },
      async startCooking() {
        updateCurrentState((current) => ({
          ...current,
          on: true,
          power: '켜짐',
          status: '조리 중',
          glowColor: '#ff6546',
          residual: false,
        }))
        registerTimer(() => {
          updateCurrentState((current) => ({
            ...current,
            status: '조리 완료',
            on: false,
            power: '꺼짐',
            residual: true,
            glowColor: '#e78d5c',
          }))
          void dispatchEvent('START_COOKING')
        }, 5000)
      },
      async triggerOverheating() {
        updateCurrentState((current) => ({
          ...current,
          on: true,
          power: '켜짐',
          status: '과열 경고',
          overheating: true,
          glowColor: '#ff2f2f',
        }))
        await dispatchEvent('OVERHEAT')
      },
      turnOff() {
        updateCurrentState((current) => ({
          ...current,
          on: false,
          power: '꺼짐',
          status: '잔열 주의',
          residual: true,
          overheating: false,
          glowColor: '#e78d5c',
        }))
      },
    }
  }

  if (applianceId === 'doorSensor') {
    return {
      async openDoor() {
        updateCurrentState((current) => ({ ...current, open: !current.open, status: '문 열림', warning: false, elapsed: 0 }))
        await dispatchEvent('OPEN_DOOR')
        registerTimer(() => {
          updateCurrentState((current) => ({ ...current, warning: true, status: '장시간 열림 경고', elapsed: 5 }))
          void dispatchEvent('LEFT_OPEN')
        }, 5000)
      },
      async awayMode() {
        updateCurrentState((current) => ({
          ...current,
          mode: '외출 모드',
          warning: current.open,
          status: current.open ? '문 확인 필요' : '외출 준비 완료',
        }))
        if (state.open) {
          await dispatchEvent('CHECK_DOOR')
        }
      },
      async sleepMode() {
        updateCurrentState((current) => ({
          ...current,
          mode: '취침 모드',
          warning: current.open,
          status: current.open ? '문 확인 필요' : '취침 준비 완료',
        }))
        if (state.open) {
          await dispatchEvent('CHECK_DOOR')
        }
      },
    }
  }

  return {
    async openDoor() {
      updateCurrentState((current) => ({ ...current, doorOpen: !current.doorOpen, status: '문 열림', highlightShelf: 0 }))
      await dispatchEvent('OPEN_DOOR')
      registerTimer(() => {
        updateCurrentState((current) => ({ ...current, temperature: 9, temperatureWarning: true, status: '온도 경고' }))
        void dispatchEvent('TEMPERATURE_ALERT')
      }, 5000)
    },
    async findItem(item) {
      const shelfMap = { 우유: 0.9, 계란: 0.2, 물: -0.45, 채소: -1.05 }
      updateCurrentState((current) => ({
        ...current,
        doorOpen: true,
        highlightShelf: shelfMap[item] || 0.4,
        status: `${item} 위치 안내`,
      }))
      await dispatchEvent('FIND_ITEM')
    },
  }
}
