'use client'

import { useGLTF } from '@react-three/drei'
import { useMemo, useEffect, useState, useRef } from 'react'
import * as THREE from 'three'
import type { ConversationState } from '@/types/conversation'

type Props = {
  modelUrl: string
  conversationState: ConversationState
  frameYOffset?: number
  desiredHeadY?: number
  targetHeight?: number
  sizeMultiplier?: number
}

export function Avatar3D({
  modelUrl,
  conversationState,
  frameYOffset = 0,
  desiredHeadY = 1.28,
  targetHeight = 1.55,
  sizeMultiplier = 1,
}: Props) {
  const { scene } = useGLTF(modelUrl)

  const [blinkAmount, setBlinkAmount] = useState(0)
  const [time, setTime] = useState(0)

  const blinkTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const blinkOpenTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  /* =========================
     AVATAR NORMALIZATION
     ========================= */
  const avatar = useMemo(() => {
    const clone = scene.clone(true)

    clone.traverse(obj => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh
        mesh.frustumCulled = false
        mesh.castShadow = true
        mesh.receiveShadow = true

        // 🔎 DEBUG DEFINITIVO: MORPH TARGETS
        if (mesh.morphTargetDictionary) {
          console.log(
            '🧠 MORPHS FOUND ON:',
            mesh.name,
            Object.keys(mesh.morphTargetDictionary)
          )
        }
      }
    })

    // === NORMALIZACIÓN RPM ===
    const box = new THREE.Box3().setFromObject(clone)
    const size = new THREE.Vector3()
    const center = new THREE.Vector3()
    box.getSize(size)
    box.getCenter(center)

    const safeHeight = size.y > 0 ? size.y : 1
    const scale = (targetHeight * sizeMultiplier) / safeHeight
    clone.scale.setScalar(scale)

    clone.position.set(-center.x * scale, -box.min.y * scale, -center.z * scale)

    clone.updateMatrixWorld(true)

    let headY: number | null = null
    clone.traverse(obj => {
      if (headY !== null) return
      if ((obj as THREE.Bone).isBone && /head/i.test(obj.name)) {
        const pos = new THREE.Vector3()
        obj.getWorldPosition(pos)
        headY = pos.y
      }
    })

    const fallbackHeadY = box.max.y * scale + clone.position.y
    const currentHeadY = headY ?? fallbackHeadY
    clone.position.y += desiredHeadY - currentHeadY
    clone.position.y -= frameYOffset

    return clone
  }, [scene, frameYOffset, desiredHeadY, targetHeight, sizeMultiplier])

  /* =========================
     BLINK (HUMANO)
     ========================= */
  useEffect(() => {
    const clearTimers = () => {
      if (blinkTimerRef.current) clearTimeout(blinkTimerRef.current)
      if (blinkOpenTimerRef.current) clearTimeout(blinkOpenTimerRef.current)
    }

    const scheduleBlink = () => {
      const delay = 2000 + Math.random() * 3000
      blinkTimerRef.current = setTimeout(() => {
        setBlinkAmount(1)
        blinkOpenTimerRef.current = setTimeout(() => {
          setBlinkAmount(0)
          scheduleBlink()
        }, 120 + Math.random() * 40)
      }, delay)
    }

    scheduleBlink()
    return clearTimers
  }, [])

  /* =========================
     TIME (IDLE MOTION)
     ========================= */
  useEffect(() => {
    let raf: number
    const tick = () => {
      setTime(t => t + 0.016)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  /* =========================
     FACIAL EXPRESSIONS
     ========================= */
  useEffect(() => {
    avatar.traverse(obj => {
      if (
        (obj as THREE.Mesh).isMesh &&
        (obj as THREE.Mesh).morphTargetDictionary &&
        (obj as THREE.Mesh).morphTargetInfluences
      ) {
        const mesh = obj as THREE.Mesh
        const dict = mesh.morphTargetDictionary
        const influences = mesh.morphTargetInfluences
        if (!dict || !influences) return

        influences.fill(0)

        const setMorph = (names: string[], value: number) => {
          names.forEach(name => {
            const index = dict[name]
            if (index !== undefined) influences[index] = value
          })
        }

        // 👁 PARPADEO
        setMorph(['eyeBlinkLeft', 'EyeBlinkLeft', 'blink_l'], blinkAmount)
        setMorph(['eyeBlinkRight', 'EyeBlinkRight', 'blink_r'], blinkAmount)

        // 🙂 IDLE
        if (conversationState === 'listening') {
          setMorph(['mouthSmile', 'mouthSmileLeft', 'mouthSmileRight'], 0.12)
        }

        // 🗣 HABLAR
        if (conversationState === 'speaking') {
          const talk = 0.18 + Math.sin(time * 6) * 0.05
          setMorph(['jawOpen', 'viseme_aa'], talk)
          setMorph(['mouthSmile', 'mouthSmileLeft', 'mouthSmileRight'], 0.22)
        }
      }
    })
  }, [avatar, blinkAmount, time, conversationState])

  return <primitive object={avatar} />
}
