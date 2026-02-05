'use client'

import { useGLTF } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useMemo, useEffect, useState, useRef } from 'react'
import * as THREE from 'three'
import type { ConversationState } from '@/types/conversation'

type Props = {
  modelUrl: string
  conversationState: ConversationState
  audioEnergy?: number
  frameYOffset?: number
  desiredHeadY?: number
  targetHeight?: number
  sizeMultiplier?: number
}

export function Avatar3D({
  modelUrl,
  conversationState,
  audioEnergy = 0,
  frameYOffset = 0,
  desiredHeadY = 1.28,
  targetHeight = 1.55,
  sizeMultiplier = 1,
}: Props) {
  const { scene } = useGLTF(modelUrl)

  const [blinkAmount, setBlinkAmount] = useState(0)

  const blinkTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const blinkOpenTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const headBoneRef = useRef<THREE.Bone | null>(null)
  const neckBoneRef = useRef<THREE.Bone | null>(null)

  /* =========================
     AVATAR NORMALIZATION
     ========================= */
  const avatar = useMemo(() => {
    const clone = scene.clone(true)

    clone.traverse(obj => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh
        mesh.frustumCulled = false
        // Evita artefactos tipo puntos/cuadros en piel por auto-sombras.
        mesh.castShadow = false
        mesh.receiveShadow = false

        const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
        materials.forEach(material => {
          const stdMaterial = material as THREE.MeshStandardMaterial
          if (!stdMaterial) return
          const maps = [
            stdMaterial.map,
            stdMaterial.normalMap,
            stdMaterial.roughnessMap,
            stdMaterial.metalnessMap,
            stdMaterial.emissiveMap,
            stdMaterial.alphaMap,
          ]
          maps.forEach(tex => {
            if (!tex) return
            tex.generateMipmaps = true
            tex.minFilter = THREE.LinearMipmapLinearFilter
            tex.magFilter = THREE.LinearFilter
            tex.needsUpdate = true
          })
          // Ajuste PBR para look más tipo RPM
          if (stdMaterial.roughness !== undefined) {
            stdMaterial.roughness = Math.min(0.92, Math.max(0.35, stdMaterial.roughness))
          }
          if (stdMaterial.metalness !== undefined) {
            stdMaterial.metalness = Math.min(0.2, Math.max(0, stdMaterial.metalness))
          }
          if ('envMapIntensity' in stdMaterial) {
            stdMaterial.envMapIntensity = 0.65
          }
          stdMaterial.needsUpdate = true
        })
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

  useEffect(() => {
    headBoneRef.current = null
    neckBoneRef.current = null

    avatar.traverse(obj => {
      if (!(obj as THREE.Bone).isBone) return
      const bone = obj as THREE.Bone
      const name = bone.name.toLowerCase()
      if (!headBoneRef.current && /head/.test(name)) headBoneRef.current = bone
      if (!neckBoneRef.current && /(neck|spine2|spine1)/.test(name)) neckBoneRef.current = bone
    })
  }, [avatar])

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

        const setMorph = (pattern: RegExp, value: number) => {
          Object.keys(dict).forEach(name => {
            if (!pattern.test(name)) return
            const index = dict[name]
            if (index !== undefined) influences[index] = value
          })
        }

        // 👁 PARPADEO
        setMorph(/(blink|eye.*close|close.*eye|eyelid)/i, blinkAmount)

        // 🙂 IDLE
        if (conversationState === 'listening') {
          setMorph(/mouth.*smile/i, 0.1)
          setMorph(/(brow.*up|innerbrowup|browinnerup)/i, 0.1)
        }

        // 🗣 HABLAR
        if (conversationState === 'speaking') {
          const talk = Math.min(0.32, 0.02 + audioEnergy * 0.28)
          setMorph(/(jaw.*open|viseme_aa)/i, talk)
          setMorph(/mouth.*smile/i, 0.12)
          setMorph(/(brow.*up|innerbrowup|browinnerup)/i, Math.min(0.18, 0.05 + audioEnergy * 0.12))
        }
      }
    })
  }, [avatar, blinkAmount, audioEnergy, conversationState])

  useFrame(({ clock }) => {
    const head = headBoneRef.current
    if (!head) return

    const neck = neckBoneRef.current
    const t = clock.getElapsedTime()
    const e = Math.min(1, Math.max(0, audioEnergy))

    const talking = conversationState === 'speaking'
    const listening = conversationState === 'listening'

    const targetPitch = talking
      ? Math.sin(t * 6.5) * (0.008 + e * 0.018)
      : listening
        ? Math.sin(t * 2.2) * 0.006
        : 0

    const targetYaw = listening
      ? Math.sin(t * 1.4) * 0.018
      : talking
        ? Math.sin(t * 1.8) * 0.01
        : 0

    const targetRoll = talking ? Math.sin(t * 2.8) * 0.004 : 0

    head.rotation.x = THREE.MathUtils.lerp(head.rotation.x, targetPitch, 0.15)
    head.rotation.y = THREE.MathUtils.lerp(head.rotation.y, targetYaw, 0.12)
    head.rotation.z = THREE.MathUtils.lerp(head.rotation.z, targetRoll, 0.12)

    if (neck) {
      neck.rotation.x = THREE.MathUtils.lerp(neck.rotation.x, targetPitch * 0.4, 0.1)
      neck.rotation.y = THREE.MathUtils.lerp(neck.rotation.y, targetYaw * 0.35, 0.1)
    }
  })

  return <primitive object={avatar} />
}
