import { ConversationView } from '@/components/conversation/conversation-view'

/**
 * Interactive AI Avatar - Main Experience Page
 * 
 * This is the entry point for the voice conversation experience.
 * The page displays:
 * 1. Avatar selection gallery
 * 2. Selected avatar with real-time animations
 * 3. Voice input controls
 * 
 * Architecture notes for future improvements:
 * - Lip sync: Currently volume-based. Can be upgraded to phoneme-based
 *   by integrating Rhubarb Lip Sync or similar and modifying avatar-animation.ts
 * - Streaming: Currently turn-based. Can upgrade to real-time streaming
 *   by implementing WebRTC in the conversation hook
 * - Avatar styles: SVG-based for performance. Can upgrade to 3D using
 *   Three.js/React Three Fiber by creating new avatar components
 * - Personalities: Framework in place via avatar-config.ts. Expand the
 *   chat API system prompt for more distinct personalities
 */
export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* Gradient background for immersive feel */}
      <div className="fixed inset-0 bg-gradient-to-b from-background via-background to-background/95" />
      
      {/* Subtle animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-1/4 w-1/2 h-1/2 bg-primary/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-accent/5 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>
      
      {/* Main conversation interface */}
      <div className="relative z-10">
        <ConversationView />
      </div>
    </main>
  )
}
