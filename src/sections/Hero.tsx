import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { Canvas, useFrame } from '@react-three/fiber'
import { Environment, Float, Sparkles } from '@react-three/drei'
import { Button } from '../components/ui/button'
import { useLanguage } from '../lib/LanguageContext'

function Scene() {
  const meshRef = useRef<any>(null)
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.getElapsedTime() * 0.1
      meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.15
    }
  })

  return (
    <>
      <ambientLight intensity={0.2} />
      <directionalLight position={[10, 10, 5]} intensity={1} color="#781C2E" />
      <directionalLight position={[-10, -10, -5]} intensity={0.5} color="#54101E" />
      
      <Float speed={2} rotationIntensity={1} floatIntensity={2}>
        <mesh ref={meshRef}>
          <octahedronGeometry args={[2, 0]} />
          <meshStandardMaterial 
            color="#111111" 
            roughness={0.1}
            metalness={0.8}
            wireframe={true}
          />
        </mesh>
      </Float>
      
      <Sparkles count={100} scale={12} size={2} speed={0.4} opacity={0.4} color="#9E253C" />
      <Environment preset="city" />
    </>
  )
}

export default function Hero() {
  const { scrollY } = useScroll()
  const y = useTransform(scrollY, [0, 1000], [0, 300])
  const opacity = useTransform(scrollY, [0, 500], [1, 0])
  const { t } = useLanguage()

  const handleScrollTo = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <section className="relative h-screen w-full overflow-hidden bg-background">
      {/* 3D Background */}
      <div className="absolute inset-0 z-0">
        <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
          <Scene />
        </Canvas>
      </div>

      {/* Cinematic Lighting/Gradient Overlays */}
      <div className="absolute inset-0 z-10 bg-gradient-to-b from-background/40 via-transparent to-background" />
      <div className="absolute inset-0 z-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary-glow/20 via-transparent to-transparent opacity-60" />

      {/* Content */}
      <motion.div 
        style={{ y, opacity }}
        className="relative z-20 h-full flex flex-col items-center justify-center text-center px-6"
      >
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-4xl mx-auto space-y-8"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card text-sm font-medium text-primary mb-4">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            {t('hero.badge')}
          </div>
          
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-cinematic font-bold tracking-tight text-foreground drop-shadow-2xl">
            {t('hero.title').split(' ').slice(0, 2).join(' ')} <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary-accent to-primary">
              {t('hero.title').split(' ').slice(2).join(' ')}
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            {t('hero.desc')}
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
            <Button 
              size="lg" 
              onClick={() => handleScrollTo('studios')}
              className="h-14 px-8 bg-primary hover:bg-primary-velvet text-white text-lg rounded-full w-full sm:w-auto shadow-[0_0_40px_rgba(120,28,46,0.4)] transition-all hover:shadow-[0_0_60px_rgba(120,28,46,0.6)] cursor-pointer"
            >
              {t('hero.primaryBtn')}
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              onClick={() => handleScrollTo('about')}
              className="h-14 px-8 border-primary/20 hover:bg-primary/5 text-foreground text-lg rounded-full w-full sm:w-auto glass cursor-pointer"
            >
              {t('hero.secondaryBtn')}
            </Button>
          </div>
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 1 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2"
      >
        <span className="text-xs uppercase tracking-widest text-muted-foreground">{t('hero.scroll')}</span>
        <div className="w-[1px] h-12 bg-gradient-to-b from-primary/50 to-transparent" />
      </motion.div>
    </section>
  )
}
