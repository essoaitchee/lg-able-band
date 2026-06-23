import { Canvas, useFrame } from '@react-three/fiber'
import { Environment, OrbitControls, RoundedBox, Text, useCursor } from '@react-three/drei'
import { Suspense, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'

const WASHER_MODE_SEQUENCE = ['표준', '쾌속', '이불']
const WASHER_MODE_ANGLES = {
  표준: 0,
  쾌속: (Math.PI * 2) / 3,
  이불: (Math.PI * 4) / 3,
}

function WasherDoor({ state, onToggleDoor }) {
  const pivotRef = useRef(null)
  const [hovered, setHovered] = useState(false)
  const shakeRef = useRef({ offset: 0, velocity: 0, tick: state.doorShakeTick })
  useCursor(hovered)

  useFrame((_, delta) => {
    if (!pivotRef.current) {
      return
    }

    if (shakeRef.current.tick !== state.doorShakeTick) {
      shakeRef.current.tick = state.doorShakeTick
      shakeRef.current.velocity = 8.5
    }

    shakeRef.current.velocity *= 0.9
    shakeRef.current.offset = THREE.MathUtils.lerp(
      shakeRef.current.offset,
      Math.sin(performance.now() * 0.03) * Math.min(shakeRef.current.velocity * 0.018, 0.06),
      0.25,
    )

    if (shakeRef.current.velocity < 0.1) {
      shakeRef.current.offset = THREE.MathUtils.lerp(shakeRef.current.offset, 0, 0.2)
    }

    const targetRotation = state.doorOpen ? -1.48 : 0
    pivotRef.current.rotation.y = THREE.MathUtils.lerp(
      pivotRef.current.rotation.y,
      targetRotation + shakeRef.current.offset,
      delta * 6,
    )
  })

  return (
    <group
      position={[-0.93, -0.15, 1.06]}
      onPointerOver={(event) => {
        event.stopPropagation()
        setHovered(true)
      }}
      onPointerOut={(event) => {
        event.stopPropagation()
        setHovered(false)
      }}
      onClick={(event) => {
        event.stopPropagation()
        void onToggleDoor()
      }}
    >
      <group ref={pivotRef}>
        <group position={[0.93, 0, 0]}>
          <mesh>
            <cylinderGeometry args={[0.96, 0.96, 0.08, 72]} />
            <meshStandardMaterial
              color={state.error ? '#241d20' : '#11161c'}
              emissive={hovered || state.error ? '#5d8cff' : '#000000'}
              emissiveIntensity={hovered ? 0.16 : state.error ? 0.14 : 0}
            />
          </mesh>
          <mesh position={[0, 0, 0.018]}>
            <cylinderGeometry args={[0.76, 0.76, 0.04, 72]} />
            <meshStandardMaterial color="#3d4958" metalness={0.2} roughness={0.45} />
          </mesh>
          <mesh position={[0, 0, 0.04]}>
            <cylinderGeometry args={[0.66, 0.66, 0.035, 72]} />
            <meshPhysicalMaterial
              color="#9eb4ca"
              roughness={0.1}
              transmission={0.38}
              transparent
              opacity={0.92}
            />
          </mesh>
          <mesh position={[0.72, 0, 0.05]}>
            <boxGeometry args={[0.1, 0.28, 0.05]} />
            <meshStandardMaterial
              color={hovered ? '#85a8d8' : '#71859d'}
              emissive={hovered ? '#4e77d4' : '#000000'}
              emissiveIntensity={hovered ? 0.12 : 0}
            />
          </mesh>
        </group>
      </group>
    </group>
  )
}

function WasherDrum({ state }) {
  const drumRef = useRef(null)

  useFrame((_, delta) => {
    if (!drumRef.current) {
      return
    }
    drumRef.current.rotation.z += (state.running ? 5.5 : 0.18) * delta
  })

  return (
    <group position={[0, -0.15, 0.78]}>
      <mesh>
        <cylinderGeometry args={[0.8, 0.8, 1.05, 48]} />
        <meshStandardMaterial color="#20262e" roughness={0.95} />
      </mesh>
      <mesh ref={drumRef} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.52, 0.16, 24, 72]} />
        <meshStandardMaterial
          color={state.running ? '#7d91a8' : '#7a8798'}
          metalness={0.45}
          roughness={0.35}
          emissive={state.running ? '#365fb8' : '#000000'}
          emissiveIntensity={state.running ? 0.2 : 0}
        />
      </mesh>
      <mesh position={[0, 0, 0.01]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.14, 0.14, 0.1, 24]} />
        <meshStandardMaterial color="#8f9eae" metalness={0.35} roughness={0.35} />
      </mesh>
    </group>
  )
}

function WasherDial({ state, onAdvanceMode, onSelectMode, onDialDragStateChange }) {
  const dialRef = useRef(null)
  const dragRef = useRef({ active: false, startX: 0, moved: false })
  const [hovered, setHovered] = useState(false)
  useCursor(hovered || dragRef.current.active)

  useFrame((_, delta) => {
    if (!dialRef.current) {
      return
    }
    const targetRotation = -(WASHER_MODE_ANGLES[state.mode] || 0)
    dialRef.current.rotation.z = THREE.MathUtils.lerp(dialRef.current.rotation.z, targetRotation, delta * 7)
  })

  function endDrag(event) {
    event.stopPropagation()
    dragRef.current.active = false
    onDialDragStateChange(false)
    event.target.releasePointerCapture?.(event.pointerId)
  }

  return (
    <group
      position={[0, 1.27, 1.12]}
      onPointerOver={(event) => {
        event.stopPropagation()
        setHovered(true)
      }}
      onPointerOut={(event) => {
        event.stopPropagation()
        if (!dragRef.current.active) {
          setHovered(false)
        }
      }}
      onPointerDown={(event) => {
        event.stopPropagation()
        dragRef.current = { active: true, startX: event.nativeEvent.clientX, moved: false }
        onDialDragStateChange(true)
        event.target.setPointerCapture?.(event.pointerId)
      }}
      onPointerMove={(event) => {
        if (!dragRef.current.active) {
          return
        }
        event.stopPropagation()
        const deltaX = event.nativeEvent.clientX - dragRef.current.startX
        if (Math.abs(deltaX) < 16) {
          return
        }
        dragRef.current.startX = event.nativeEvent.clientX
        dragRef.current.moved = true
        void onAdvanceMode(deltaX > 0 ? 1 : -1)
      }}
      onPointerUp={endDrag}
      onPointerMissed={() => {
        dragRef.current.active = false
        onDialDragStateChange(false)
        setHovered(false)
      }}
      onClick={(event) => {
        event.stopPropagation()
        if (dragRef.current.moved) {
          dragRef.current.moved = false
          return
        }
        const currentIndex = WASHER_MODE_SEQUENCE.indexOf(state.mode)
        const nextMode = WASHER_MODE_SEQUENCE[(currentIndex + 1) % WASHER_MODE_SEQUENCE.length]
        void onSelectMode(nextMode)
      }}
    >
      <group ref={dialRef}>
        <mesh>
          <cylinderGeometry args={[0.28, 0.28, 0.12, 48]} />
          <meshStandardMaterial
            color={hovered ? '#e9edf2' : '#d6dce5'}
            emissive={hovered ? '#4f77c3' : '#000000'}
            emissiveIntensity={hovered ? 0.1 : 0}
          />
        </mesh>
        <mesh position={[0, 0, 0.045]}>
          <cylinderGeometry args={[0.2, 0.2, 0.03, 48]} />
          <meshStandardMaterial color="#bbc5d1" />
        </mesh>
        <mesh position={[0, 0.18, 0.055]}>
          <boxGeometry args={[0.03, 0.1, 0.02]} />
          <meshStandardMaterial color="#2f3947" />
        </mesh>
      </group>
    </group>
  )
}

function WasherDisplay({ state }) {
  const poweredOn = state.power === '켜짐'

  return (
    <group position={[1.02, 1.28, 1.115]}>
      <mesh>
        <boxGeometry args={[0.9, 0.26, 0.05]} />
        <meshStandardMaterial color="#12171d" />
      </mesh>
      <Text position={[0, 0.04, 0.03]} fontSize={0.08} color={poweredOn ? '#cfe9ff' : '#7c8794'}>
        {state.displayMessage}
      </Text>
      <Text position={[0, -0.055, 0.03]} fontSize={0.05} color={poweredOn ? '#9dcaef' : '#68727c'}>
        {state.displayDetail}
      </Text>
    </group>
  )
}

function WasherPowerButton({ state, onTogglePower }) {
  const ref = useRef(null)
  const [hovered, setHovered] = useState(false)
  const [pressed, setPressed] = useState(false)
  useCursor(hovered)

  useFrame((_, delta) => {
    if (!ref.current) {
      return
    }
    ref.current.position.z = THREE.MathUtils.lerp(ref.current.position.z, pressed ? 0.03 : 0, delta * 14)
  })

  return (
    <mesh
      ref={ref}
      position={[0.64, 1.07, 1.12]}
      onPointerOver={(event) => {
        event.stopPropagation()
        setHovered(true)
      }}
      onPointerOut={(event) => {
        event.stopPropagation()
        setHovered(false)
        setPressed(false)
      }}
      onPointerDown={(event) => {
        event.stopPropagation()
        setPressed(true)
      }}
      onPointerUp={(event) => {
        event.stopPropagation()
        setPressed(false)
      }}
      onClick={(event) => {
        event.stopPropagation()
        onTogglePower()
      }}
    >
      <cylinderGeometry args={[0.075, 0.075, 0.05, 24]} />
      <meshStandardMaterial
        color={state.power === '켜짐' ? '#76c68d' : '#d4dae4'}
        emissive={hovered ? '#4f77c3' : state.power === '켜짐' ? '#5bb470' : '#000000'}
        emissiveIntensity={hovered ? 0.12 : state.power === '켜짐' ? 0.14 : 0}
      />
    </mesh>
  )
}

function WasherStartButton({ onPressStart }) {
  const ref = useRef(null)
  const [hovered, setHovered] = useState(false)
  const [pressed, setPressed] = useState(false)
  useCursor(hovered)

  useFrame((_, delta) => {
    if (!ref.current) {
      return
    }
    ref.current.position.z = THREE.MathUtils.lerp(ref.current.position.z, pressed ? 0.025 : 0, delta * 14)
  })

  return (
    <mesh
      ref={ref}
      position={[1.28, 1.07, 1.12]}
      onPointerOver={(event) => {
        event.stopPropagation()
        setHovered(true)
      }}
      onPointerOut={(event) => {
        event.stopPropagation()
        setHovered(false)
        setPressed(false)
      }}
      onPointerDown={(event) => {
        event.stopPropagation()
        setPressed(true)
      }}
      onPointerUp={(event) => {
        event.stopPropagation()
        setPressed(false)
      }}
      onClick={(event) => {
        event.stopPropagation()
        void onPressStart()
      }}
    >
      <boxGeometry args={[0.22, 0.12, 0.045]} />
      <meshStandardMaterial
        color={hovered ? '#eaf0f8' : '#dbe2ea'}
        emissive={hovered ? '#557bd4' : '#000000'}
        emissiveIntensity={hovered ? 0.12 : 0}
      />
    </mesh>
  )
}

function WashingMachineModel({ state, actions, onDialDragStateChange }) {
  return (
    <group position={[0, -0.3, 0]}>
      <RoundedBox args={[3.2, 4.2, 2.2]} radius={0.13}>
        <meshStandardMaterial color="#f3f5f7" />
      </RoundedBox>

      <mesh position={[0, 1.45, 1.105]}>
        <boxGeometry args={[2.72, 0.78, 0.05]} />
        <meshStandardMaterial color="#f7f8fa" />
      </mesh>

      <mesh position={[-1.08, 1.28, 1.115]}>
        <boxGeometry args={[0.58, 0.28, 0.04]} />
        <meshStandardMaterial color="#eceff3" />
      </mesh>

      <mesh position={[-1.02, 1.23, 1.135]}>
        <boxGeometry args={[0.3, 0.045, 0.02]} />
        <meshStandardMaterial color="#b2bcc7" />
      </mesh>

      <mesh position={[0, -0.15, 1.02]}>
        <cylinderGeometry args={[1.05, 1.05, 0.03, 72]} />
        <meshStandardMaterial color="#d7dde5" />
      </mesh>

      <WasherDrum state={state} />
      <WasherDoor state={state} onToggleDoor={actions.toggleDoor} />

      <group position={[0, 0, 0]}>
        <WasherDial
          state={state}
          onAdvanceMode={actions.stepMode}
          onSelectMode={actions.selectMode}
          onDialDragStateChange={onDialDragStateChange}
        />
        <WasherDisplay state={state} />
        <WasherPowerButton state={state} onTogglePower={actions.togglePower} />
        <WasherStartButton onPressStart={actions.pressStart} />
      </group>

      <mesh position={[-1.08, -1.72, 1.11]}>
        <boxGeometry args={[0.54, 0.54, 0.04]} />
        <meshStandardMaterial color="#edf0f4" />
      </mesh>

      <Text position={[0, -2.45, 1.05]} fontSize={0.1} color="#5e6874">
        {state.interactionHint}
      </Text>
    </group>
  )
}

function RefrigeratorModel({ state }) {
  return (
    <group>
      <RoundedBox args={[2.7, 4.8, 2.1]} radius={0.12}>
        <meshStandardMaterial color="#f7f7f4" />
      </RoundedBox>
      <mesh position={[0.9, 0.2, 1.08]} rotation={[0, state.doorOpen ? -0.75 : 0, 0]}>
        <boxGeometry args={[1.2, 4.2, 0.12]} />
        <meshStandardMaterial color={state.temperatureWarning ? '#ffd2bf' : '#ececeb'} emissive={state.doorOpen ? '#fff1b8' : '#000000'} />
      </mesh>
      {state.highlightShelf ? (
        <mesh position={[0, state.highlightShelf, 0.7]}>
          <boxGeometry args={[1.5, 0.12, 1.2]} />
          <meshStandardMaterial color="#6fc5ff" emissive="#6fc5ff" emissiveIntensity={0.9} />
        </mesh>
      ) : null}
    </group>
  )
}

function DoorSensorModel({ state }) {
  return (
    <group>
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[2.4, 4.6, 0.18]} />
        <meshStandardMaterial color="#7f5f4c" />
      </mesh>
      <mesh position={[1.1, 0.2, 0.18]} rotation={[0, state.open ? -0.95 : 0, 0]}>
        <boxGeometry args={[2.1, 4.4, 0.14]} />
        <meshStandardMaterial color="#a77e64" />
      </mesh>
      <mesh position={[1.25, 1.4, 0.22]}>
        <boxGeometry args={[0.15, 0.32, 0.15]} />
        <meshStandardMaterial color={state.warning ? '#ff8c5c' : '#c3d2e7'} emissive={state.warning ? '#ff8c5c' : '#000000'} />
      </mesh>
    </group>
  )
}

function ElectricRangeModel({ state }) {
  return (
    <group>
      <RoundedBox args={[3.6, 0.5, 2.4]} radius={0.08}>
        <meshStandardMaterial color="#20252c" />
      </RoundedBox>
      <mesh position={[0, 0.32, 0]}>
        <cylinderGeometry args={[0.7, 0.7, 0.12, 48]} />
        <meshStandardMaterial
          color={state.glowColor}
          emissive={state.glowColor}
          emissiveIntensity={state.on ? (state.overheating ? 2.3 : state.residual ? 0.9 : 1.4) : 0}
        />
      </mesh>
      <mesh position={[0, 0.85, 0]}>
        <cylinderGeometry args={[0.82, 0.95, 0.84, 36]} />
        <meshStandardMaterial color="#696f7b" />
      </mesh>
    </group>
  )
}

function TVModel({ state }) {
  return (
    <group>
      <RoundedBox args={[4.3, 2.6, 0.2]} radius={0.08}>
        <meshStandardMaterial color="#101318" />
      </RoundedBox>
      <mesh position={[0, 0, 0.12]}>
        <planeGeometry args={[3.8, 2.15]} />
        <meshStandardMaterial color={state.on ? '#4f85ff' : '#181d24'} emissive={state.on ? '#284bd0' : '#000000'} />
      </mesh>
      <Text position={[0, 0.15, 0.16]} fontSize={0.28} color="#ffffff">
        {state.on ? `CH ${state.channel} · VOL ${state.volume}` : 'OFF'}
      </Text>
      <mesh position={[2.6, -1.2, 0.4]} rotation={[0.25, 0, state.remotePulse ? 0.4 : 0]}>
        <boxGeometry args={[0.45, 1.4, 0.18]} />
        <meshStandardMaterial color={state.remotePulse ? '#ffdf7a' : '#3b4351'} emissive={state.remotePulse ? '#ffdf7a' : '#000000'} />
      </mesh>
    </group>
  )
}

function AirQualitySensorModel({ state }) {
  const warning = state.co2 >= 1500 || state.fineDust >= 80 || state.temperature >= 31 || state.humidity >= 70

  return (
    <group>
      <RoundedBox args={[2, 3, 1.2]} radius={0.18}>
        <meshStandardMaterial color={warning ? '#ffe0d1' : '#f5f7fb'} />
      </RoundedBox>
      <Text position={[0, 0.9, 0.62]} fontSize={0.16} color={warning ? '#d44d26' : '#234'}>
        {`CO2 ${state.co2} ppm`}
      </Text>
      <Text position={[0, 0.35, 0.62]} fontSize={0.16} color={warning ? '#d44d26' : '#234'}>
        {`${state.temperature}°C · ${state.humidity}%`}
      </Text>
      <Text position={[0, -0.2, 0.62]} fontSize={0.16} color={warning ? '#d44d26' : '#234'}>
        {`미세먼지 ${state.fineDust} μg/m³`}
      </Text>
      {state.fineDust >= 80 ? (
        <mesh position={[0, 0.1, 0]}>
          <sphereGeometry args={[1.6, 24, 24]} />
          <meshStandardMaterial color="#a2a7b4" transparent opacity={0.15} />
        </mesh>
      ) : null}
    </group>
  )
}

function GenericStage({ title }) {
  return (
    <group>
      <RoundedBox args={[3.4, 2.2, 1.6]} radius={0.14}>
        <meshStandardMaterial color="#edf1f7" />
      </RoundedBox>
      <Text position={[0, 0, 0.9]} fontSize={0.26} color="#2b3441">
        {title}
      </Text>
    </group>
  )
}

function SceneContent({ applianceId, sceneState, actions, onDialDragStateChange }) {
  switch (applianceId) {
    case 'washingMachine':
      return <WashingMachineModel state={sceneState} actions={actions} onDialDragStateChange={onDialDragStateChange} />
    case 'refrigerator':
      return <RefrigeratorModel state={sceneState} />
    case 'doorSensor':
      return <DoorSensorModel state={sceneState} />
    case 'electricRange':
      return <ElectricRangeModel state={sceneState} />
    case 'tv':
      return <TVModel state={sceneState} />
    case 'airQualitySensor':
      return <AirQualitySensorModel state={sceneState} />
    default:
      return <GenericStage title="가전을 선택해 주세요." />
  }
}

export function ApplianceScene({ applianceId, sceneState, actions }) {
  const orbitControlsRef = useRef(null)
  const [orbitEnabled, setOrbitEnabled] = useState(true)

  const cameraSettings = useMemo(
    () =>
      applianceId === 'washingMachine'
        ? { position: [5, 3.5, 7], fov: 35, near: 0.1, far: 40 }
        : { position: [0, 1.7, 7.5], fov: 42, near: 0.1, far: 40 },
    [applianceId],
  )

  const controlTarget = applianceId === 'washingMachine' ? [0, 0.7, 0] : [0, 0, 0]

  return (
    <div className="scene-shell">
      <Canvas camera={cameraSettings} shadows>
        <color attach="background" args={['#edf2f7']} />
        <ambientLight intensity={1.05} />
        <directionalLight position={[6, 8, 5]} intensity={1.8} castShadow />
        <Suspense fallback={null}>
          <SceneContent
            applianceId={applianceId}
            sceneState={sceneState}
            actions={actions}
            onDialDragStateChange={(dragging) => {
              setOrbitEnabled(!dragging)
              if (orbitControlsRef.current) {
                orbitControlsRef.current.enabled = !dragging
              }
            }}
          />
          <Environment preset="city" />
        </Suspense>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.6, 0]} receiveShadow>
          <planeGeometry args={[24, 24]} />
          <shadowMaterial opacity={0.16} />
        </mesh>
        <OrbitControls
          ref={orbitControlsRef}
          enabled={orbitEnabled}
          target={controlTarget}
          enablePan={false}
          minDistance={5.8}
          maxDistance={10.5}
          minAzimuthAngle={-0.55}
          maxAzimuthAngle={0.55}
          minPolarAngle={0.95}
          maxPolarAngle={1.45}
        />
      </Canvas>
    </div>
  )
}
