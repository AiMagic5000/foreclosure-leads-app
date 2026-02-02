import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Easing,
} from 'remotion';

// Scene Components
const IntroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOpacity = interpolate(frame, [0, 30], [0, 1], { extrapolateRight: 'clamp' });
  const titleScale = spring({ frame, fps, from: 0.8, to: 1, durationInFrames: 45 });
  const subtitleOpacity = interpolate(frame, [30, 60], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ backgroundColor: '#0f172a' }}>
      {/* Background pattern */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: 'radial-gradient(circle at 25% 25%, #1e3a5f 0%, transparent 50%), radial-gradient(circle at 75% 75%, #10b981 0%, transparent 40%)',
        opacity: 0.3,
      }} />

      {/* Main content */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        padding: 80,
      }}>
        <h1 style={{
          fontSize: 120,
          fontWeight: 'bold',
          color: 'white',
          textAlign: 'center',
          opacity: titleOpacity,
          transform: `scale(${titleScale})`,
          marginBottom: 40,
          lineHeight: 1.1,
        }}>
          Asset Recovery<br/>
          <span style={{ color: '#10b981' }}>Made Simple</span>
        </h1>

        <p style={{
          fontSize: 48,
          color: '#94a3b8',
          textAlign: 'center',
          opacity: subtitleOpacity,
          maxWidth: 1200,
        }}>
          Fresh foreclosure leads, delivered daily to your dashboard
        </p>
      </div>
    </AbsoluteFill>
  );
};

const LeadsScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({ frame, fps, from: 0, to: 1, durationInFrames: 30 });
  const dataFlow = interpolate(frame, [0, 150], [0, 100]);

  return (
    <AbsoluteFill style={{ backgroundColor: '#0f172a' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        height: '100%',
        padding: 100,
      }}>
        {/* Left side - Text */}
        <div style={{ flex: 1, paddingRight: 60 }}>
          <h2 style={{
            fontSize: 80,
            fontWeight: 'bold',
            color: '#1e3a5f',
            marginBottom: 30,
            transform: `scale(${scale})`,
          }}>
            Step 1: Fresh Leads
          </h2>
          <p style={{
            fontSize: 36,
            color: '#94a3b8',
            lineHeight: 1.6,
            opacity: interpolate(frame, [20, 50], [0, 1], { extrapolateRight: 'clamp' }),
          }}>
            Our Crawl4AI system scrapes county recorders, public trustees, and auction sites across all 50 states — every single day.
          </p>

          <div style={{
            display: 'flex',
            gap: 20,
            marginTop: 40,
            opacity: interpolate(frame, [40, 70], [0, 1], { extrapolateRight: 'clamp' }),
          }}>
            {['Tax Deeds', 'Mortgage Surplus', 'Sheriff Sales'].map((item, i) => (
              <div key={i} style={{
                padding: '15px 30px',
                backgroundColor: '#1e3a5f',
                borderRadius: 8,
                color: 'white',
                fontSize: 24,
              }}>
                {item}
              </div>
            ))}
          </div>
        </div>

        {/* Right side - Database animation */}
        <div style={{
          flex: 1,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <svg width="400" height="400" viewBox="0 0 400 400">
            {/* Database icon */}
            <ellipse cx="200" cy="100" rx="120" ry="40" fill="#1e3a5f" opacity="0.8" />
            <rect x="80" y="100" width="240" height="200" fill="#1e3a5f" opacity="0.6" />
            <ellipse cx="200" cy="300" rx="120" ry="40" fill="#1e3a5f" opacity="0.8" />
            <ellipse cx="200" cy="200" rx="120" ry="40" fill="none" stroke="#3b82f6" strokeWidth="3" opacity="0.5" />

            {/* Data flowing in */}
            {[...Array(5)].map((_, i) => (
              <circle
                key={i}
                cx={50 + (i * 80)}
                cy={50 - (dataFlow % 50) + (i * 10)}
                r="8"
                fill="#10b981"
                opacity={Math.sin((frame + i * 10) / 10) * 0.5 + 0.5}
              />
            ))}
          </svg>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const OutreachScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const phoneRing = Math.sin(frame / 3) * 5;

  return (
    <AbsoluteFill style={{ backgroundColor: '#0f172a' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        height: '100%',
        padding: 100,
      }}>
        {/* Left side - Phone animation */}
        <div style={{
          flex: 1,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <svg width="350" height="400" viewBox="0 0 350 400">
            {/* Phone */}
            <rect
              x="100"
              y="50"
              width="150"
              height="300"
              rx="20"
              fill="#1e3a5f"
              stroke="#3b82f6"
              strokeWidth="4"
              transform={`rotate(${phoneRing} 175 200)`}
            />
            <rect x="130" y="80" width="90" height="200" rx="5" fill="#0f172a" />

            {/* Sound waves */}
            {[1, 2, 3].map((i) => (
              <path
                key={i}
                d={`M 270 ${180 + i * 10} Q ${290 + i * 20} 200 270 ${220 - i * 10}`}
                fill="none"
                stroke="#10b981"
                strokeWidth="4"
                opacity={interpolate(
                  (frame + i * 10) % 30,
                  [0, 15, 30],
                  [0, 1, 0]
                )}
              />
            ))}
          </svg>
        </div>

        {/* Right side - Text */}
        <div style={{ flex: 1, paddingLeft: 60 }}>
          <h2 style={{
            fontSize: 80,
            fontWeight: 'bold',
            color: '#3b82f6',
            marginBottom: 30,
          }}>
            Step 2: Automated Outreach
          </h2>
          <p style={{
            fontSize: 36,
            color: '#94a3b8',
            lineHeight: 1.6,
          }}>
            Every lead is skip-traced with phone numbers and emails. Our AI generates personalized voicemails delivered automatically.
          </p>

          <div style={{
            marginTop: 40,
            padding: 30,
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            borderRadius: 12,
            borderLeft: '4px solid #3b82f6',
          }}>
            <p style={{ color: '#e2e8f0', fontSize: 28, fontStyle: 'italic' }}>
              "Hi, this is about the surplus funds from your property at 123 Main St..."
            </p>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const ConversionScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const barHeights = [
    interpolate(frame, [0, 30], [20, 60], { extrapolateRight: 'clamp' }),
    interpolate(frame, [10, 40], [30, 80], { extrapolateRight: 'clamp' }),
    interpolate(frame, [20, 50], [40, 100], { extrapolateRight: 'clamp' }),
    interpolate(frame, [30, 60], [50, 130], { extrapolateRight: 'clamp' }),
    interpolate(frame, [40, 70], [60, 170], { extrapolateRight: 'clamp' }),
  ];

  return (
    <AbsoluteFill style={{ backgroundColor: '#0f172a' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        height: '100%',
        padding: 100,
      }}>
        {/* Left side - Text */}
        <div style={{ flex: 1, paddingRight: 60 }}>
          <h2 style={{
            fontSize: 80,
            fontWeight: 'bold',
            color: '#10b981',
            marginBottom: 30,
          }}>
            Step 3: Conversions
          </h2>
          <p style={{
            fontSize: 36,
            color: '#94a3b8',
            lineHeight: 1.6,
          }}>
            Property owners call back ready to sign. Track every callback, contract, and commission in your dashboard.
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 20,
            marginTop: 40,
          }}>
            {[
              { label: 'Callbacks', value: '23%' },
              { label: 'Contracts', value: '8.5%' },
              { label: 'Avg Recovery', value: '$12,400' },
              { label: 'Your Fee', value: '20-30%' },
            ].map((stat, i) => (
              <div key={i} style={{
                padding: 20,
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                borderRadius: 8,
              }}>
                <div style={{ color: '#10b981', fontSize: 36, fontWeight: 'bold' }}>{stat.value}</div>
                <div style={{ color: '#94a3b8', fontSize: 20 }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right side - Chart animation */}
        <div style={{
          flex: 1,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <svg width="400" height="350" viewBox="0 0 400 350">
            {/* Chart bars */}
            {barHeights.map((height, i) => (
              <rect
                key={i}
                x={50 + i * 70}
                y={300 - height * 1.5}
                width="50"
                height={height * 1.5}
                fill={`rgba(16, 185, 129, ${0.5 + i * 0.1})`}
                rx="4"
              />
            ))}

            {/* Trend line */}
            <path
              d={`M 75 ${300 - barHeights[0] * 1.5} ${barHeights.map((h, i) => `L ${75 + i * 70} ${300 - h * 1.5}`).join(' ')}`}
              fill="none"
              stroke="#f59e0b"
              strokeWidth="4"
              strokeDasharray="10,5"
            />
          </svg>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const SuccessScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const dollarScale = spring({ frame, fps, from: 0, to: 1, durationInFrames: 30 });
  const moneyRain = frame % 60;

  return (
    <AbsoluteFill style={{ backgroundColor: '#0f172a' }}>
      {/* Money rain effect */}
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${(i * 5) + (frame % 100) / 10}%`,
            top: `${((moneyRain + i * 20) % 120) - 20}%`,
            fontSize: 40,
            color: '#10b981',
            opacity: 0.2,
          }}
        >
          $
        </div>
      ))}

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        padding: 100,
      }}>
        {/* Big dollar sign */}
        <div style={{
          fontSize: 200,
          fontWeight: 'bold',
          color: '#10b981',
          transform: `scale(${dollarScale})`,
          marginBottom: 40,
        }}>
          $
        </div>

        <h2 style={{
          fontSize: 90,
          fontWeight: 'bold',
          color: 'white',
          textAlign: 'center',
          marginBottom: 30,
        }}>
          Help Families.<br/>
          <span style={{ color: '#10b981' }}>Earn Big.</span>
        </h2>

        <p style={{
          fontSize: 40,
          color: '#94a3b8',
          textAlign: 'center',
          maxWidth: 1000,
          opacity: interpolate(frame, [30, 60], [0, 1], { extrapolateRight: 'clamp' }),
        }}>
          Surplus funds rightfully belong to former property owners.<br/>
          You connect them with their money — and earn 20-30% for your service.
        </p>
      </div>
    </AbsoluteFill>
  );
};

const CTAScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const buttonPulse = 1 + Math.sin(frame / 10) * 0.05;

  return (
    <AbsoluteFill style={{ backgroundColor: '#0f172a' }}>
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: 'radial-gradient(circle at 50% 50%, #1e3a5f 0%, transparent 60%)',
        opacity: 0.5,
      }} />

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        padding: 100,
      }}>
        <h2 style={{
          fontSize: 100,
          fontWeight: 'bold',
          color: 'white',
          textAlign: 'center',
          marginBottom: 50,
        }}>
          Start Your 7-Day<br/>
          <span style={{ color: '#10b981' }}>Free Trial</span>
        </h2>

        <div style={{
          padding: '30px 80px',
          backgroundColor: '#10b981',
          borderRadius: 16,
          fontSize: 48,
          fontWeight: 'bold',
          color: 'white',
          transform: `scale(${buttonPulse})`,
          boxShadow: '0 20px 60px rgba(16, 185, 129, 0.4)',
        }}>
          Get Started Now →
        </div>

        <p style={{
          fontSize: 32,
          color: '#64748b',
          marginTop: 40,
        }}>
          foreclosure-leads.alwaysencrypted.com
        </p>
      </div>
    </AbsoluteFill>
  );
};

// Main Video Composition
export const ExplainerVideo: React.FC = () => {
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill>
      {/* Background music at 4% volume */}
      <Audio src={staticFile('background-music.mp3')} volume={0.04} />

      {/* Scene 1: Intro (0-5 seconds) */}
      <Sequence from={0} durationInFrames={fps * 5}>
        <IntroScene />
      </Sequence>

      {/* Scene 2: Leads (5-25 seconds) */}
      <Sequence from={fps * 5} durationInFrames={fps * 20}>
        <LeadsScene />
      </Sequence>

      {/* Scene 3: Outreach (25-45 seconds) */}
      <Sequence from={fps * 25} durationInFrames={fps * 20}>
        <OutreachScene />
      </Sequence>

      {/* Scene 4: Conversions (45-65 seconds) */}
      <Sequence from={fps * 45} durationInFrames={fps * 20}>
        <ConversionScene />
      </Sequence>

      {/* Scene 5: Success (65-80 seconds) */}
      <Sequence from={fps * 65} durationInFrames={fps * 15}>
        <SuccessScene />
      </Sequence>

      {/* Scene 6: CTA (80-90 seconds) */}
      <Sequence from={fps * 80} durationInFrames={fps * 10}>
        <CTAScene />
      </Sequence>
    </AbsoluteFill>
  );
};
