export const APPLIANCES = [
  { id: 'washingMachine', label: '세탁기', applianceType: 'WASHING_MACHINE' },
  { id: 'airQualitySensor', label: 'LG 공기질 센서', applianceType: 'AIR_QUALITY_SENSOR' },
  { id: 'tv', label: 'TV', applianceType: 'TV' },
  { id: 'electricRange', label: '전기레인지', applianceType: 'ELECTRIC_RANGE' },
  { id: 'doorSensor', label: '도어센서', applianceType: 'DOOR_SENSOR' },
  { id: 'refrigerator', label: '냉장고', applianceType: 'REFRIGERATOR' },
]

export const APPLIANCE_EVENT_MAP = {
  washingMachine: {
    START_WASHING: {
      eventType: 'WASHING_COMPLETED',
      title: '세탁 완료 알림',
      message: '세탁이 완료되었습니다. 세탁물을 꺼내 주세요.',
      toast: '세탁 완료 알림을 전송했어요.',
    },
    CHANGE_MODE: {
      eventType: 'WASHING_MODE_CHANGED',
      title: '세탁 모드 변경 안내',
      message: '세탁 모드가 변경되었습니다. 현재 설정을 확인해 주세요.',
      toast: '세탁 모드 변경 알림을 전송했어요.',
    },
    OPEN_DOOR: {
      eventType: 'WASHING_MACHINE_ERROR_OR_DOOR_OPEN',
      title: '세탁기 오류 또는 문 열림 안내',
      message: '세탁기 문이 열려 있거나 동작 오류가 감지되었습니다.',
      toast: '세탁기 문 열림 알림을 전송했어요.',
    },
    TRIGGER_ERROR: {
      eventType: 'WASHING_MACHINE_ERROR_OR_DOOR_OPEN',
      title: '세탁기 오류 또는 문 열림 안내',
      message: '세탁기 문이 열려 있거나 동작 오류가 감지되었습니다.',
      toast: '세탁기 오류 알림을 전송했어요.',
    },
  },
  airQualitySensor: {
    HIGH_CO2: {
      eventType: 'HIGH_CO2',
      title: '이산화탄소 농도 안내',
      message: '이산화탄소 농도가 높습니다. 환기가 필요합니다.',
      toast: '이산화탄소 경고 알림을 전송했어요.',
    },
    TEMP_HUMIDITY_ALERT: {
      eventType: 'TEMPERATURE_HUMIDITY_ALERT',
      title: '온도 및 습도 안내',
      message: '실내 온도 또는 습도가 쾌적 범위를 벗어났습니다.',
      toast: '온습도 경고 알림을 전송했어요.',
    },
    HIGH_FINE_DUST: {
      eventType: 'HIGH_FINE_DUST',
      title: '미세먼지 안내',
      message: '실내 미세먼지 농도가 높습니다.',
      toast: '미세먼지 경고 알림을 전송했어요.',
    },
  },
  tv: {
    TOGGLE_POWER: {
      eventType: 'TV_POWER_STATUS_CHANGED',
      title: 'TV 전원 상태 안내',
      message: 'TV 전원 상태가 변경되었습니다.',
      toast: 'TV 전원 알림을 전송했어요.',
    },
    CHANGE_MEDIA: {
      eventType: 'TV_VOLUME_OR_CHANNEL_CHANGED',
      title: 'TV 볼륨 및 채널 안내',
      message: 'TV 볼륨 또는 채널이 변경되었습니다.',
      toast: 'TV 채널 및 볼륨 알림을 전송했어요.',
    },
    FIND_REMOTE: {
      eventType: 'FIND_TV_REMOTE',
      title: 'TV 리모컨 찾기',
      message: '리모컨 위치 안내를 시작합니다.',
      toast: '리모컨 찾기 알림을 전송했어요.',
    },
  },
  electricRange: {
    POWER_ON: {
      eventType: 'ELECTRIC_RANGE_POWER_ON',
      title: '전기레인지 전원 켜짐 안내',
      message: '전기레인지 전원이 켜져 있습니다.',
      toast: '전기레인지 전원 알림을 전송했어요.',
    },
    START_COOKING: {
      eventType: 'COOKING_COMPLETED',
      title: '조리 완료 알림',
      message: '조리가 완료되었습니다.',
      toast: '조리 완료 알림을 전송했어요.',
    },
    OVERHEAT: {
      eventType: 'RESIDUAL_HEAT_OR_OVERHEATING_WARNING',
      title: '잔열 또는 과열 경고',
      message: '전기레인지에 잔열 또는 과열 위험이 감지되었습니다.',
      toast: '과열 경고 알림을 전송했어요.',
    },
  },
  doorSensor: {
    OPEN_DOOR: {
      eventType: 'DOOR_OPENED',
      title: '문 열림 알림',
      message: '문이 열렸습니다.',
      toast: '문 열림 알림을 전송했어요.',
    },
    LEFT_OPEN: {
      eventType: 'DOOR_LEFT_OPEN',
      title: '문 장시간 열림 경고',
      message: '문이 오랫동안 열려 있습니다.',
      toast: '문 장시간 열림 알림을 전송했어요.',
    },
    CHECK_DOOR: {
      eventType: 'CHECK_DOOR_BEFORE_LEAVING_OR_SLEEPING',
      title: '외출 또는 취침 전 문 확인',
      message: '외출 또는 취침 전에 문 잠금 상태를 확인해 주세요.',
      toast: '문 상태 확인 알림을 전송했어요.',
    },
  },
  refrigerator: {
    OPEN_DOOR: {
      eventType: 'REFRIGERATOR_DOOR_OPEN',
      title: '냉장고 문 열림 알림',
      message: '냉장고 문이 열려 있습니다.',
      toast: '냉장고 문 열림 알림을 전송했어요.',
    },
    TEMPERATURE_ALERT: {
      eventType: 'REFRIGERATOR_TEMPERATURE_ALERT',
      title: '냉장고 온도 이상 안내',
      message: '냉장고 내부 온도에 이상이 있습니다.',
      toast: '냉장고 온도 경고 알림을 전송했어요.',
    },
    FIND_ITEM: {
      eventType: 'FIND_REFRIGERATOR_FOOD_ITEM',
      title: '냉장고 식재료 찾기',
      message: '냉장고 안 식재료 위치 안내를 시작합니다.',
      toast: '냉장고 식재료 찾기 알림을 전송했어요.',
    },
  },
}
