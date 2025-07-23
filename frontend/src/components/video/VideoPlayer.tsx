import React, { useState, useRef, useEffect, useCallback } from 'react';
import { postService } from '../../services/post.service';
import './VideoPlayer.css';

interface VideoPlayerProps {
  src: string;
  thumbnail?: string;
  postId: string;
  autoplay?: boolean;
  loop?: boolean;
  muted?: boolean;
  aspectRatio?: number;
  className?: string;
  onPlay?: () => void;
  onPause?: () => void;
}

// Custom hook for intersection observer
const useIntersectionObserver = (
  ref: React.RefObject<Element>,
  callback: (entry: IntersectionObserverEntry) => void,
  options: IntersectionObserverInit = {}
) => {
  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(([entry]) => {
      callback(entry);
    }, { threshold: 0.5, ...options }); // 50% visibility threshold

    observer.observe(element);
    return () => observer.disconnect();
  }, [ref, callback, options]);
};

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  src,
  thumbnail,
  postId,
  autoplay = false,
  loop = true,
  muted = true,
  aspectRatio = 16/9,
  className = '',
  onPlay,
  onPause,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showThumbnail, setShowThumbnail] = useState(!!thumbnail);
  const [hasStartedPlaying, setHasStartedPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(muted);
  const [showControls, setShowControls] = useState(false);
  
  // Analytics tracking state
  const [tracked25, setTracked25] = useState(false);
  const [tracked50, setTracked50] = useState(false);
  const [tracked75, setTracked75] = useState(false);
  const [trackedComplete, setTrackedComplete] = useState(false);
  const [hasTrackedView, setHasTrackedView] = useState(false);

  // Track video engagement
  const trackVideoEngagement = useCallback(async (event: 'play' | '25%' | '50%' | '75%' | 'complete') => {
    try {
      console.log('📊 VIDEO_ANALYTICS: Tracking', event, 'for post', postId);
      // For now, just increment views on first play
      if (event === 'play' && !hasTrackedView) {
        await postService.incrementVideoViews(postId);
        setHasTrackedView(true);
      }
      // TODO: Add more detailed analytics tracking here
    } catch (error) {
      console.error('❌ VIDEO_ANALYTICS: Failed to track', event, error);
    }
  }, [postId, hasTrackedView]);

  // Handle intersection observer for autoplay
  const handleIntersection = useCallback((entry: IntersectionObserverEntry) => {
    const video = videoRef.current;
    if (!video) return;

    console.log('🎬 VIDEO_AUTOPLAY: Intersection ratio:', entry.intersectionRatio);

    if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
      console.log('🎬 VIDEO_AUTOPLAY: Video is 50%+ visible, starting autoplay');
      if (autoplay && !hasStartedPlaying) {
        handlePlay();
      }
    } else {
      console.log('🎬 VIDEO_AUTOPLAY: Video not sufficiently visible, pausing');
      if (isPlaying && hasStartedPlaying) {
        handlePause();
      }
    }
  }, [autoplay, hasStartedPlaying, isPlaying]);

  useIntersectionObserver(containerRef, handleIntersection, { threshold: 0.5 });

  const handlePlay = async () => {
    const video = videoRef.current;
    if (!video) return;

    try {
      setShowThumbnail(false);
      await video.play();
      setIsPlaying(true);
      setHasStartedPlaying(true);
      
      // Track initial play
      if (!hasTrackedView) {
        await trackVideoEngagement('play');
      }
      
      onPlay?.();
      console.log('▶️ VIDEO_PLAYER: Started playing');
    } catch (error) {
      console.error('❌ VIDEO_PLAYER: Play failed:', error);
    }
  };

  const handlePause = () => {
    const video = videoRef.current;
    if (!video) return;

    video.pause();
    setIsPlaying(false);
    onPause?.();
    console.log('⏸️ VIDEO_PLAYER: Paused');
  };

  const handleTimeUpdate = async () => {
    const video = videoRef.current;
    if (!video || !duration) return;

    const current = video.currentTime;
    setCurrentTime(current);

    const percent = (current / duration) * 100;

    // Track engagement milestones
    if (percent >= 25 && !tracked25) {
      setTracked25(true);
      await trackVideoEngagement('25%');
    } else if (percent >= 50 && !tracked50) {
      setTracked50(true);
      await trackVideoEngagement('50%');
    } else if (percent >= 75 && !tracked75) {
      setTracked75(true);
      await trackVideoEngagement('75%');
    } else if (percent >= 95 && !trackedComplete) {
      setTrackedComplete(true);
      await trackVideoEngagement('complete');
    }
  };

  const handleLoadedMetadata = () => {
    const video = videoRef.current;
    if (!video) return;
    
    setDuration(video.duration);
    console.log('📊 VIDEO_PLAYER: Loaded metadata, duration:', video.duration);
  };

  const handleClick = () => {
    if (showThumbnail) {
      handlePlay();
    } else {
      isPlaying ? handlePause() : handlePlay();
    }
  };

  const handleMuteToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;

    const newMutedState = !isMuted;
    video.muted = newMutedState;
    setIsMuted(newMutedState);
    console.log('🔊 VIDEO_PLAYER: Mute toggled:', newMutedState);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div 
      ref={containerRef}
      className={`video-player-container ${className}`}
      style={{ 
        position: 'relative',
        aspectRatio: aspectRatio.toString(),
        backgroundColor: '#000',
        borderRadius: '8px',
        overflow: 'hidden',
        cursor: 'pointer'
      }}
      onClick={handleClick}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
      data-testid="video-player"
    >
      {/* Thumbnail overlay */}
      {showThumbnail && thumbnail && (
        <div 
          className="video-thumbnail"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 2
          }}
          data-testid="video-thumbnail"
        >
          <img 
            src={thumbnail} 
            alt="Video preview"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
          />
          <div 
            className="play-overlay"
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '60px',
              height: '60px',
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '24px'
            }}
          >
            ▶️
          </div>
        </div>
      )}

      {/* Video element */}
      <video
        ref={videoRef}
        src={src}
        muted={isMuted}
        loop={loop}
        playsInline
        preload="metadata"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: showThumbnail ? 'none' : 'block'
        }}
        data-testid="video-element"
      />

      {/* Custom controls overlay */}
      {!showThumbnail && (showControls || !isPlaying) && (
        <div 
          className="video-controls"
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
            padding: '20px 15px 15px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            color: 'white',
            fontSize: '14px',
            zIndex: 3
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={(e) => { e.stopPropagation(); isPlaying ? handlePause() : handlePlay(); }}
            style={{
              background: 'none',
              border: 'none',
              color: 'white',
              fontSize: '16px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '24px',
              height: '24px'
            }}
          >
            {isPlaying ? (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <rect x="4" y="3" width="3" height="10" rx="0.5" />
                <rect x="9" y="3" width="3" height="10" rx="0.5" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M4 2.5v11a.5.5 0 00.773.416l8-5.5a.5.5 0 000-.832l-8-5.5A.5.5 0 004 2.5z" />
              </svg>
            )}
          </button>
          
          <div style={{ flex: 1, fontSize: '12px' }}>
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
          
          <button
            onClick={handleMuteToggle}
            style={{
              background: 'none',
              border: 'none',
              color: 'white',
              fontSize: '16px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '24px',
              height: '24px'
            }}
          >
            {isMuted ? (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M6.717 3.55A.5.5 0 017 4v8a.5.5 0 01-.812.39L3.825 10.5H1.5A.5.5 0 011 10V6a.5.5 0 01.5-.5h2.325l2.363-1.89a.5.5 0 01.529-.06z" />
                <path d="M11.025 4.025a.5.5 0 01.707 0l.707.707.707-.707a.5.5 0 11.708.708L13.147 5.44l.707.707a.5.5 0 01-.708.708l-.707-.708-.707.708a.5.5 0 01-.708-.708l.708-.707-.708-.707a.5.5 0 010-.708z" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M6.717 3.55A.5.5 0 017 4v8a.5.5 0 01-.812.39L3.825 10.5H1.5A.5.5 0 011 10V6a.5.5 0 01.5-.5h2.325l2.363-1.89a.5.5 0 01.529-.06z" />
                <path d="M11.025 3.025c.175.175.35.372.508.588A4.98 4.98 0 0113 8a4.98 4.98 0 01-1.467 4.387c-.158.216-.333.413-.508.588a.5.5 0 01-.708-.708c.15-.15.3-.318.436-.504A3.98 3.98 0 0012 8a3.98 3.98 0 00-1.247-3.763 4.015 4.015 0 00-.436-.504.5.5 0 11.708-.708z" />
                <path d="M9.025 5.025c.127.127.253.273.371.435A2.99 2.99 0 0110 8a2.99 2.99 0 01-.604 2.54c-.118.162-.244.308-.371.435a.5.5 0 01-.708-.708c.092-.092.184-.2.268-.324A1.99 1.99 0 009 8a1.99 1.99 0 00-.415-1.943 2.016 2.016 0 00-.268-.324.5.5 0 01.708-.708z" />
              </svg>
            )}
          </button>
        </div>
      )}

      {/* Progress bar */}
      {!showThumbnail && duration > 0 && (
        <div 
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '3px',
            backgroundColor: 'rgba(255, 255, 255, 0.3)',
            zIndex: 4
          }}
        >
          <div 
            style={{
              height: '100%',
              backgroundColor: '#8b5cf6',
              width: `${(currentTime / duration) * 100}%`,
              transition: 'width 0.1s ease'
            }}
          />
        </div>
      )}
    </div>
  );
};