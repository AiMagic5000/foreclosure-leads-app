'use client'

import { useEffect, useRef } from 'react'
import Hls from 'hls.js'
import { getSessionOffset } from '@/data/webcast-scripted-chat'

const HLS_URL = 'https://stream.usforeclosureleads.com/webcast.m3u8'

/**
 * Silent-only webcast preview for the landing page.
 * No sound, no unmute, no chat -- just a muted video teaser
 * that drives visitors to /webcast to sign up for the full session.
 */
export function LandingWebcastPlayer() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const hlsRef = useRef<Hls | null>(null)
  const videoStartedRef = useRef(false)
  const initialOffset = getSessionOffset()
  const videoOffsetRef = useRef(initialOffset)

  // Initialize HLS player -- always muted, no unmute
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    function startPlayback() {
      if (videoStartedRef.current) return
      videoStartedRef.current = true
      video!.currentTime = videoOffsetRef.current
      video!.muted = true
      video!.play().catch(() => {})
    }

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        startLevel: -1,
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
      })
      hlsRef.current = hls
      hls.loadSource(HLS_URL)
      hls.attachMedia(video)
      hls.on(Hls.Events.MANIFEST_PARSED, () => setTimeout(startPlayback, 500))
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          if (data.type === Hls.ErrorTypes.NETWORK_ERROR) hls.startLoad()
          else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) hls.recoverMediaError()
        }
      })
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = HLS_URL
      video.addEventListener('loadedmetadata', () => setTimeout(startPlayback, 500), { once: true })
    } else {
      video.src = '/assets/webcast.mp4'
      video.addEventListener('loadedmetadata', () => setTimeout(startPlayback, 500), { once: true })
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy()
        hlsRef.current = null
      }
    }
  }, [])

  // Block seeking
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    let lastTime = initialOffset

    const handleTimeUpdate = () => {
      if (video.currentTime < lastTime - 2) video.currentTime = lastTime
      else lastTime = video.currentTime
    }
    const handleSeeking = () => {
      if (video.currentTime < lastTime - 2) video.currentTime = lastTime
    }

    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('seeking', handleSeeking)
    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('seeking', handleSeeking)
    }
  }, [initialOffset])

  // Force muted -- block any programmatic unmute attempts
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    const enforceMute = () => { video.muted = true }
    video.addEventListener('volumechange', enforceMute)
    return () => video.removeEventListener('volumechange', enforceMute)
  }, [])

  return (
    <div style={{ background: '#050d1a', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 10px 40px rgba(0,0,0,0.2)', border: '2px solid rgba(212,168,75,0.3)' }}>
      <div style={{ position: 'relative' }}>
        {/* LIVE badge */}
        <div style={{ position: 'absolute', top: '10px', left: '10px', zIndex: 2, display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(0,0,0,0.7)', padding: '4px 10px', borderRadius: '20px' }}>
          <span style={{ width: '8px', height: '8px', background: '#ef4444', borderRadius: '50%', animation: 'pulse 1.5s infinite', display: 'inline-block' }} />
          <span style={{ color: '#ef4444', fontWeight: 700, fontSize: '12px' }}>LIVE NOW</span>
        </div>

        {/* MUTED badge -- tells visitor to join for full audio */}
        <div style={{ position: 'absolute', bottom: '10px', left: '10px', zIndex: 2, display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(0,0,0,0.8)', padding: '6px 12px', borderRadius: '8px' }}>
          <span style={{ color: '#d4a84b', fontWeight: 700, fontSize: '12px' }}>Join the session for full audio and live chat</span>
        </div>

        <video
          ref={videoRef}
          style={{ width: '100%', aspectRatio: '16/9', display: 'block', background: '#000' }}
          playsInline
          muted
          autoPlay
          controlsList="nodownload nofullscreen noremoteplayback noplaybackrate"
          disablePictureInPicture
        />
      </div>
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h3 style={{ color: '#d4a84b', marginBottom: '8px', fontSize: '18px' }}>Live Training Session in Progress</h3>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', margin: '0 0 15px 0' }}>Sign up to unlock full audio, live chat with Corey, and the partnership offer</p>
        <a href="/webcast" style={{ display: 'inline-block', background: 'linear-gradient(135deg, #d4a84b 0%, #b8922f 100%)', color: '#09274c', textDecoration: 'none', padding: '14px 36px', borderRadius: '8px', fontSize: '16px', fontWeight: 700 }}>JOIN LIVE SESSION FREE</a>
      </div>
    </div>
  )
}
