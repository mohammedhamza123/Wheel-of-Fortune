import React, { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import './App.css'

// دالة للتحقق من تحميل الخط
const checkFontLoaded = () => {
  if (document.fonts && document.fonts.check) {
    return document.fonts.check('bold 16px "Cairo"')
  }
  return true // افتراض أن الخط محمّل إذا لم يكن document.fonts متاحاً
}

// دالة لتنظيف الاسم العربي من المسافات الزائدة
const normalizeArabicName = (name) => {
  if (!name) return ''
  return name
    .trim()
    .replace(/\s+/g, ' ') // استبدال المسافات المتعددة بمسافة واحدة
    .replace(/^\s+|\s+$/g, '') // إزالة المسافات من البداية والنهاية
}

// دالة لتقسيم الاسم الرباعي إلى سطرين متوازنين
const splitFullName = (name) => {
  const normalized = normalizeArabicName(name)
  const words = normalized.split(' ').filter(word => word.length > 0)
  
  if (words.length === 0) {
    return { line1: '', line2: '' }
  }
  
  if (words.length === 1) {
    return { line1: words[0], line2: '' }
  }
  
  if (words.length === 2) {
    return { line1: words[0], line2: words[1] }
  }
  
  if (words.length === 3) {
    return { line1: words[0], line2: `${words[1]} ${words[2]}` }
  }
  
  // 4 كلمات أو أكثر: تقسيم متوازن
  // السطر الأول: الكلمتان الأوليان
  // السطر الثاني: باقي الكلمات
  const midPoint = Math.ceil(words.length / 2)
  const line1 = words.slice(0, midPoint).join(' ')
  const line2 = words.slice(midPoint).join(' ')
  
  return { line1, line2 }
}

const API_BASE_URL = 'http://localhost:8000/api'

function App() {
  const [participants, setParticipants] = useState([])
  const [winners, setWinners] = useState([])
  const [isSpinning, setIsSpinning] = useState(false)
  const [winner, setWinner] = useState(null)
  const [newName, setNewName] = useState('')
  const [bulkNames, setBulkNames] = useState('')
  const [rotation, setRotation] = useState(0)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [wheelImage, setWheelImage] = useState(null)
  const [wheelImageUrl, setWheelImageUrl] = useState(null)
  const [forceRedraw, setForceRedraw] = useState(0)
  const [showSettings, setShowSettings] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [wheelTitle, setWheelTitle] = useState('')
  const [textColor, setTextColor] = useState('#333333') // لون افتراضي داكن للنص
  const [maxDisplayNames, setMaxDisplayNames] = useState(0) // 0 يعني بدون حد
  const [soundMuted, setSoundMuted] = useState(false) // حالة كتم الصوت
  const canvasRef = useRef(null)
  const imageRef = useRef(null)
  const animationFrameRef = useRef(null)
  const fullscreenRef = useRef(null)
  const spinningAudioRef = useRef(null)
  const winningAudioRef = useRef(null)
  const audioContextRef = useRef(null)

  // تهيئة Audio Context للأصوات
  useEffect(() => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext
      if (AudioContext) {
        audioContextRef.current = new AudioContext()
      }
    } catch (error) {
      console.error('خطأ في تهيئة Audio Context:', error)
    }
  }, [])

  // دالة لإنشاء صوت الدوران الاحترافي والرسمي
  const playSpinningSound = () => {
    try {
      if (!audioContextRef.current || soundMuted) return
      
      const audioContext = audioContextRef.current
      // استئناف AudioContext إذا كان متوقفاً
      if (audioContext.state === 'suspended') {
        audioContext.resume()
      }
      
      const startTime = audioContext.currentTime
      const duration = 7 // مدة الدوران
      
      // إنشاء Reverb effect باستخدام ConvolverNode (محاكاة)
      const reverbGain = audioContext.createGain()
      reverbGain.gain.value = 0.1
      
      // طبقة صوتية 1: صوت دوران أساسي رسمي (صوت منخفض وناعم)
      const baseOsc = audioContext.createOscillator()
      const baseGain = audioContext.createGain()
      const baseFilter = audioContext.createBiquadFilter()
      
      baseFilter.type = 'lowpass'
      baseFilter.frequency.value = 150 // تردد منخفض أكثر للرسمية
      baseFilter.Q.value = 0.5 // Q منخفض للنعومة
      
      baseOsc.type = 'sine' // صوت ناعم ورسمي
      baseOsc.frequency.setValueAtTime(55, startTime)
      // تغيير التردد تدريجياً لمحاكاة الدوران
      baseOsc.frequency.exponentialRampToValueAtTime(40, startTime + duration)
      
      baseGain.gain.setValueAtTime(0.06, startTime) // حجم أقل للرسمية
      baseGain.gain.setValueAtTime(0.06, startTime + duration * 0.85)
      baseGain.gain.exponentialRampToValueAtTime(0.001, startTime + duration)
      
      baseOsc.connect(baseFilter)
      baseFilter.connect(baseGain)
      baseGain.connect(audioContext.destination)
      
      // طبقة صوتية 2: صوت احتكاك خفيف ورسمي
      const frictionOsc = audioContext.createOscillator()
      const frictionGain = audioContext.createGain()
      const frictionFilter = audioContext.createBiquadFilter()
      
      frictionFilter.type = 'lowpass' // تغيير إلى lowpass للرسمية
      frictionFilter.frequency.value = 600 // تردد أقل
      frictionFilter.Q.value = 1
      
      frictionOsc.type = 'triangle' // صوت ناعم
      frictionOsc.frequency.setValueAtTime(110, startTime)
      frictionOsc.frequency.exponentialRampToValueAtTime(75, startTime + duration)
      
      frictionGain.gain.setValueAtTime(0.02, startTime) // حجم أقل
      frictionGain.gain.setValueAtTime(0.02, startTime + duration * 0.8)
      frictionGain.gain.exponentialRampToValueAtTime(0.001, startTime + duration)
      
      frictionOsc.connect(frictionFilter)
      frictionFilter.connect(frictionGain)
      frictionGain.connect(audioContext.destination)
      
      // طبقة صوتية 3: صوت تردد متوسط رسمي (لإضافة عمق ناعم)
      const midOsc = audioContext.createOscillator()
      const midGain = audioContext.createGain()
      const midFilter = audioContext.createBiquadFilter()
      
      midFilter.type = 'lowpass'
      midFilter.frequency.value = 350 // تردد أقل
      midFilter.Q.value = 0.8 // Q أقل للنعومة
      
      midOsc.type = 'sine' // صوت ناعم
      midOsc.frequency.setValueAtTime(90, startTime)
      midOsc.frequency.exponentialRampToValueAtTime(65, startTime + duration)
      
      midGain.gain.setValueAtTime(0.04, startTime) // حجم أقل
      midGain.gain.setValueAtTime(0.04, startTime + duration * 0.8)
      midGain.gain.exponentialRampToValueAtTime(0.001, startTime + duration)
      
      midOsc.connect(midFilter)
      midFilter.connect(midGain)
      midGain.connect(audioContext.destination)
      
      // طبقة صوتية 4: ضوضاء بيضاء خفيفة جداً (لإضافة واقعية خفيفة)
      const noiseBuffer = audioContext.createBuffer(1, audioContext.sampleRate * 0.1, audioContext.sampleRate)
      const noiseData = noiseBuffer.getChannelData(0)
      for (let i = 0; i < noiseData.length; i++) {
        noiseData[i] = (Math.random() * 2 - 1) * 0.5 // تقليل الضوضاء
      }
      
      const noiseSource = audioContext.createBufferSource()
      const noiseGain = audioContext.createGain()
      const noiseFilter = audioContext.createBiquadFilter()
      
      noiseFilter.type = 'lowpass' // تغيير إلى lowpass للرسمية
      noiseFilter.frequency.value = 800 // تردد أقل
      noiseFilter.Q.value = 0.8
      
      noiseSource.buffer = noiseBuffer
      noiseSource.loop = true
      
      noiseGain.gain.setValueAtTime(0.01, startTime) // حجم أقل بكثير
      noiseGain.gain.setValueAtTime(0.01, startTime + duration * 0.85)
      noiseGain.gain.exponentialRampToValueAtTime(0.001, startTime + duration)
      
      noiseSource.connect(noiseFilter)
      noiseFilter.connect(noiseGain)
      noiseGain.connect(audioContext.destination)
      
      // بدء جميع الأصوات
      baseOsc.start(startTime)
      frictionOsc.start(startTime)
      midOsc.start(startTime)
      noiseSource.start(startTime)
      
      baseOsc.stop(startTime + duration)
      frictionOsc.stop(startTime + duration)
      midOsc.stop(startTime + duration)
      noiseSource.stop(startTime + duration)
      
      // حفظ المراجع للإيقاف
      spinningAudioRef.current = { 
        baseOsc, frictionOsc, midOsc, noiseSource,
        baseGain, frictionGain, midGain, noiseGain
      }
    } catch (error) {
      console.error('خطأ في تشغيل صوت الدوران:', error)
    }
  }

  // دالة لإيقاف صوت الدوران
  const stopSpinningSound = () => {
    try {
      if (spinningAudioRef.current && audioContextRef.current) {
        const { baseOsc, frictionOsc, midOsc, noiseSource, baseGain, frictionGain, midGain, noiseGain } = spinningAudioRef.current
        const audioContext = audioContextRef.current
        const stopTime = audioContext.currentTime + 0.3
        
        // إيقاف تدريجي لجميع الطبقات
        if (baseGain) baseGain.gain.exponentialRampToValueAtTime(0.001, stopTime)
        if (frictionGain) frictionGain.gain.exponentialRampToValueAtTime(0.001, stopTime)
        if (midGain) midGain.gain.exponentialRampToValueAtTime(0.001, stopTime)
        if (noiseGain) noiseGain.gain.exponentialRampToValueAtTime(0.001, stopTime)
        
        if (baseOsc) baseOsc.stop(stopTime)
        if (frictionOsc) frictionOsc.stop(stopTime)
        if (midOsc) midOsc.stop(stopTime)
        if (noiseSource) noiseSource.stop(stopTime)
        
        spinningAudioRef.current = null
      }
    } catch (error) {
      console.error('خطأ في إيقاف صوت الدوران:', error)
    }
  }

  // دالة لإنشاء صوت الفوز الاحترافي والرسمي
  const playWinningSound = () => {
    try {
      if (!audioContextRef.current || soundMuted) return
      
      const audioContext = audioContextRef.current
      // استئناف AudioContext إذا كان متوقفاً
      if (audioContext.state === 'suspended') {
        audioContext.resume()
      }
      
      const startTime = audioContext.currentTime
      
      // لحن انتصار رسمي واحترافي - سلم موسيقي أنيق
      const melody = [
        { freq: 523.25, duration: 0.18, volume: 0.22 },  // C5 - نغمة واضحة
        { freq: 659.25, duration: 0.18, volume: 0.22 },  // E5
        { freq: 783.99, duration: 0.18, volume: 0.22 },  // G5
        { freq: 1046.50, duration: 0.45, volume: 0.28 },  // C6 (قمة واضحة)
        { freq: 880.00, duration: 0.25, volume: 0.22 },  // A5
        { freq: 1046.50, duration: 0.6, volume: 0.32 },  // C6 (قمة طويلة وواضحة)
      ]
      
      // لحن ثانوي للعمق (أوكتاف أقل) - أكثر وضوحاً
      const bassMelody = [
        { freq: 261.63, duration: 0.18, volume: 0.18 },  // C4
        { freq: 329.63, duration: 0.18, volume: 0.18 },  // E4
        { freq: 392.00, duration: 0.18, volume: 0.18 },  // G4
        { freq: 523.25, duration: 0.45, volume: 0.20 },  // C5
        { freq: 440.00, duration: 0.25, volume: 0.18 },  // A4
        { freq: 523.25, duration: 0.6, volume: 0.22 },  // C5
      ]
      
      let currentTime = startTime
      
      // تشغيل اللحن الرئيسي
      melody.forEach((note, index) => {
        // طبقة رئيسية
        const osc1 = audioContext.createOscillator()
        const gain1 = audioContext.createGain()
        const filter1 = audioContext.createBiquadFilter()
        
        filter1.type = 'lowpass'
        filter1.frequency.value = 2500 // تردد أعلى للوضوح
        filter1.Q.value = 1.2 // Q محسّن
        
        osc1.type = 'sine'
        osc1.frequency.setValueAtTime(note.freq, currentTime)
        
        const noteStart = currentTime
        const noteEnd = noteStart + note.duration
        
        // تأثير fade in/out سلس
        gain1.gain.setValueAtTime(0, noteStart)
        gain1.gain.linearRampToValueAtTime(note.volume, noteStart + 0.05)
        gain1.gain.setValueAtTime(note.volume, noteEnd - 0.1)
        gain1.gain.linearRampToValueAtTime(0, noteEnd)
        
        osc1.connect(filter1)
        filter1.connect(gain1)
        gain1.connect(audioContext.destination)
        
        osc1.start(noteStart)
        osc1.stop(noteEnd)
        
        // طبقة ثانوية للعمق (harmony)
        if (index < bassMelody.length) {
          const osc2 = audioContext.createOscillator()
          const gain2 = audioContext.createGain()
          const filter2 = audioContext.createBiquadFilter()
          
          filter2.type = 'lowpass'
          filter2.frequency.value = 1800 // تردد أعلى للوضوح
          filter2.Q.value = 1.1
          
          osc2.type = 'triangle'
          osc2.frequency.setValueAtTime(bassMelody[index].freq, currentTime)
          
          gain2.gain.setValueAtTime(0, noteStart)
          gain2.gain.linearRampToValueAtTime(bassMelody[index].volume, noteStart + 0.05)
          gain2.gain.setValueAtTime(bassMelody[index].volume, noteEnd - 0.1)
          gain2.gain.linearRampToValueAtTime(0, noteEnd)
          
          osc2.connect(filter2)
          filter2.connect(gain2)
          gain2.connect(audioContext.destination)
          
          osc2.start(noteStart)
          osc2.stop(noteEnd)
        }
        
        currentTime += note.duration
      })
      
      // إضافة نغمة نهائية قوية (fanfare)
      const fanfareTime = currentTime
      const fanfareOsc = audioContext.createOscillator()
      const fanfareGain = audioContext.createGain()
      const fanfareFilter = audioContext.createBiquadFilter()
      
      fanfareFilter.type = 'lowpass'
      fanfareFilter.frequency.value = 3500 // تردد أعلى للوضوح
      fanfareFilter.Q.value = 1.8
      
      fanfareOsc.type = 'sine'
      fanfareOsc.frequency.setValueAtTime(1318.51, fanfareTime) // E6
      fanfareOsc.frequency.exponentialRampToValueAtTime(1567.98, fanfareTime + 0.3) // G6
      
      fanfareGain.gain.setValueAtTime(0, fanfareTime)
      fanfareGain.gain.linearRampToValueAtTime(0.28, fanfareTime + 0.05) // حجم أعلى قليلاً
      fanfareGain.gain.setValueAtTime(0.28, fanfareTime + 0.3)
      fanfareGain.gain.exponentialRampToValueAtTime(0, fanfareTime + 0.6) // مدة أطول قليلاً
      
      fanfareOsc.connect(fanfareFilter)
      fanfareFilter.connect(fanfareGain)
      fanfareGain.connect(audioContext.destination)
      
      fanfareOsc.start(fanfareTime)
      fanfareOsc.stop(fanfareTime + 0.6)
      
      // إضافة طبقة من الضوضاء البيضاء الخفيفة للقمة (sparkle effect)
      const sparkleTime = startTime + 0.6
      const sparkleBuffer = audioContext.createBuffer(1, audioContext.sampleRate * 0.2, audioContext.sampleRate)
      const sparkleData = sparkleBuffer.getChannelData(0)
      for (let i = 0; i < sparkleData.length; i++) {
        sparkleData[i] = (Math.random() * 2 - 1) * 0.3
      }
      
      const sparkleSource = audioContext.createBufferSource()
      const sparkleGain = audioContext.createGain()
      const sparkleFilter = audioContext.createBiquadFilter()
      
      sparkleFilter.type = 'bandpass'
      sparkleFilter.frequency.value = 3000
      sparkleFilter.Q.value = 3
      
      sparkleSource.buffer = sparkleBuffer
      
      sparkleGain.gain.setValueAtTime(0, sparkleTime)
      sparkleGain.gain.linearRampToValueAtTime(0.1, sparkleTime + 0.1)
      sparkleGain.gain.setValueAtTime(0.1, sparkleTime + 0.15)
      sparkleGain.gain.exponentialRampToValueAtTime(0, sparkleTime + 0.2)
      
      sparkleSource.connect(sparkleFilter)
      sparkleFilter.connect(sparkleGain)
      sparkleGain.connect(audioContext.destination)
      
      sparkleSource.start(sparkleTime)
      sparkleSource.stop(sparkleTime + 0.2)
      
    } catch (error) {
      console.error('خطأ في تشغيل صوت الفوز:', error)
    }
  }

  // جلب البيانات عند تحميل الصفحة
  useEffect(() => {
    fetchParticipants()
    fetchWinners()
    fetchWheelImage()
    fetchWheelTitle()
    fetchTextColor()
    fetchMaxDisplayNames()
    fetchSoundMuted()
  }, [])

  // إدارة وضع Fullscreen
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange)
    document.addEventListener('mozfullscreenchange', handleFullscreenChange)
    document.addEventListener('MSFullscreenChange', handleFullscreenChange)

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange)
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange)
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange)
    }
  }, [])

  const toggleFullscreen = async () => {
    const element = fullscreenRef.current

    if (!document.fullscreenElement) {
      try {
        if (element.requestFullscreen) {
          await element.requestFullscreen()
        } else if (element.webkitRequestFullscreen) {
          await element.webkitRequestFullscreen()
        } else if (element.mozRequestFullScreen) {
          await element.mozRequestFullScreen()
        } else if (element.msRequestFullscreen) {
          await element.msRequestFullscreen()
        }
        setIsFullscreen(true)
      } catch (err) {
        console.error('خطأ في تفعيل وضع ملء الشاشة:', err)
      }
    } else {
      try {
        if (document.exitFullscreen) {
          await document.exitFullscreen()
        } else if (document.webkitExitFullscreen) {
          await document.webkitExitFullscreen()
        } else if (document.mozCancelFullScreen) {
          await document.mozCancelFullScreen()
        } else if (document.msExitFullscreen) {
          await document.msExitFullscreen()
        }
        setIsFullscreen(false)
      } catch (err) {
        console.error('خطأ في إغلاق وضع ملء الشاشة:', err)
      }
    }
  }

  const fetchWheelImage = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/wheel-image`)
      if (response.data.exists) {
        setWheelImageUrl(`http://localhost:8000${response.data.url}`)
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.src = `http://localhost:8000${response.data.url}`
        img.onload = () => {
          imageRef.current = img
          setForceRedraw(prev => prev + 1)
        }
      }
    } catch (error) {
      console.error('خطأ في جلب صورة العجلة:', error)
    }
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert('يجب أن يكون الملف صورة')
      return
    }

    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await axios.post(`${API_BASE_URL}/upload-wheel-image`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.src = `http://localhost:8000${response.data.url}`
      img.onload = () => {
        imageRef.current = img
        setWheelImageUrl(`http://localhost:8000${response.data.url}`)
        setForceRedraw(prev => prev + 1)
      }
      alert('تم رفع الصورة بنجاح')
    } catch (error) {
      alert('حدث خطأ في رفع الصورة')
    }
  }

  const removeWheelImage = async () => {
    try {
      await axios.delete(`${API_BASE_URL}/wheel-image`)
      setWheelImageUrl(null)
      imageRef.current = null
      setForceRedraw(prev => prev + 1)
      alert('تم حذف الصورة بنجاح')
    } catch (error) {
      alert('حدث خطأ في حذف الصورة')
    }
  }

  const fetchWheelTitle = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/settings/title`)
      if (response.data.exists) {
        setWheelTitle(response.data.title)
      }
    } catch (error) {
      console.error('خطأ في جلب العنوان:', error)
    }
  }

  const saveWheelTitle = async (title) => {
    try {
      await axios.post(`${API_BASE_URL}/settings/title`, { title })
      setWheelTitle(title)
      alert('تم حفظ العنوان بنجاح')
    } catch (error) {
      alert('حدث خطأ في حفظ العنوان')
    }
  }

  const removeWheelTitle = async () => {
    try {
      await axios.delete(`${API_BASE_URL}/settings/title`)
      setWheelTitle('')
      alert('تم حذف العنوان بنجاح')
    } catch (error) {
      alert('حدث خطأ في حذف العنوان')
    }
  }

  const fetchTextColor = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/settings/text-color`)
      // دائماً نجلب اللون حتى لو لم يكن موجوداً (سيستخدم الافتراضي)
      if (response.data.exists && response.data.color) {
        setTextColor(response.data.color)
      } else {
        // إذا لم يكن هناك لون محفوظ، نستخدم الافتراضي
        setTextColor('#333333')
      }
    } catch (error) {
      console.error('خطأ في جلب لون النص:', error)
      // في حالة الخطأ، نستخدم اللون الافتراضي
      setTextColor('#333333')
    }
  }

  const saveTextColor = async (color) => {
    try {
      await axios.post(`${API_BASE_URL}/settings/text-color`, { color })
      setTextColor(color)
      setForceRedraw(prev => prev + 1) // إعادة رسم العجلة
      alert('تم حفظ لون النص بنجاح')
    } catch (error) {
      alert('حدث خطأ في حفظ لون النص')
    }
  }

  const fetchMaxDisplayNames = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/settings/max-display-names`)
      if (response.data.exists) {
        setMaxDisplayNames(response.data.max_names)
      }
    } catch (error) {
      console.error('خطأ في جلب الحد الأقصى للأسماء:', error)
    }
  }

  const fetchSoundMuted = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/settings/sound-muted`)
      setSoundMuted(response.data.muted || false)
    } catch (error) {
      console.error('خطأ في جلب حالة كتم الصوت:', error)
      setSoundMuted(false)
    }
  }

  const saveSoundMuted = async (muted) => {
    try {
      await axios.post(`${API_BASE_URL}/settings/sound-muted`, { muted })
      setSoundMuted(muted)
    } catch (error) {
      alert('حدث خطأ في حفظ حالة الصوت')
    }
  }

  const saveMaxDisplayNames = async (maxNames) => {
    try {
      await axios.post(`${API_BASE_URL}/settings/max-display-names`, { max_names: maxNames })
      setMaxDisplayNames(maxNames)
      setForceRedraw(prev => prev + 1) // إعادة رسم العجلة
      alert('تم حفظ الحد الأقصى للأسماء بنجاح')
    } catch (error) {
      alert('حدث خطأ في حفظ الحد الأقصى للأسماء')
    }
  }

  // رسم العجلة (مع تحسين الأداء للأعداد الكبيرة)
  useEffect(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }
    
    // تحسين الأداء للأعداد الكبيرة - استخدام throttling ذكي
    // للأعداد الكبيرة جداً، نستخدم debounce لتقليل إعادة الرسم
    let drawDelay = 0
    if (participants.length > 1000 && !isSpinning) {
      drawDelay = 50  // تأخير للأعداد الكبيرة جداً عند عدم الدوران
    } else if (participants.length > 500 && !isSpinning) {
      drawDelay = 30
    }
    
    const timeoutId = drawDelay > 0 ? setTimeout(() => {
      animationFrameRef.current = requestAnimationFrame(() => {
        drawWheel()
      })
    }, drawDelay) : null
    
    if (!timeoutId) {
      animationFrameRef.current = requestAnimationFrame(() => {
        drawWheel()
      })
    }
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [participants, rotation, wheelImageUrl, forceRedraw, textColor, maxDisplayNames, isSpinning])

  // إعادة رسم العجلة عند إغلاق نافذة الفائز
  useEffect(() => {
    if (!winner && !isSpinning) {
      // إعادة رسم العجلة بعد إغلاق النافذة
      setTimeout(() => {
        setForceRedraw(prev => prev + 1)
      }, 300)
    }
  }, [winner, isSpinning])

  const fetchParticipants = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/participants`)
      setParticipants(response.data.participants)
      // إعادة رسم العجلة بعد تحديث المشاركين
      setTimeout(() => {
        setForceRedraw(prev => prev + 1)
      }, 50)
    } catch (error) {
      console.error('خطأ في جلب المشاركين:', error)
    }
  }

  const fetchWinners = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/winners`)
      setWinners(response.data.winners)
    } catch (error) {
      console.error('خطأ في جلب الفائزين:', error)
    }
  }

  const addParticipant = async () => {
    if (!newName.trim()) return
    try {
      await axios.post(`${API_BASE_URL}/participants`, { name: newName.trim() })
      setNewName('')
      fetchParticipants()
    } catch (error) {
      alert(error.response?.data?.detail || 'حدث خطأ')
    }
  }

  const addBulkParticipants = async () => {
    if (!bulkNames.trim()) return
    const names = bulkNames.split('\n').filter(name => name.trim())
    if (names.length === 0) return
    try {
      const response = await axios.post(`${API_BASE_URL}/participants/bulk`, { names })
      setBulkNames('')
      fetchParticipants()
      alert(`تم إضافة ${response.data.added_count} مشارك`)
    } catch (error) {
      alert(error.response?.data?.detail || 'حدث خطأ')
    }
  }

  const removeParticipant = async (name) => {
    try {
      await axios.delete(`${API_BASE_URL}/participants/${encodeURIComponent(name)}`)
      fetchParticipants()
    } catch (error) {
      alert(error.response?.data?.detail || 'حدث خطأ')
    }
  }

  const spinWheel = async () => {
    if (participants.length === 0) {
      alert('لا يوجد مشاركون في العجلة!')
      return
    }
    if (isSpinning) return

    setIsSpinning(true)
    setWinner(null)

    // جلب الفائز من السيرفر أولاً
    let winnerName = null
    let winnerIndex = -1
    
    try {
      const response = await axios.post(`${API_BASE_URL}/spin`)
      winnerName = response.data.winner
      // البحث عن index الفائز في القائمة
      winnerIndex = participants.findIndex(p => p === winnerName)
      
      if (winnerIndex === -1) {
        // إذا لم نجد الفائز، نستخدم فائز عشوائي آمن
        const randomArray = new Uint32Array(1)
        if (window.crypto && window.crypto.getRandomValues) {
          window.crypto.getRandomValues(randomArray)
        }
        const secureRandom = randomArray[0] / (0xFFFFFFFF + 1)
        winnerIndex = Math.floor(secureRandom * participants.length)
        winnerName = participants[winnerIndex]
      }
    } catch (error) {
      alert(error.response?.data?.detail || 'حدث خطأ')
      setIsSpinning(false)
      return
    }

    setSelectedIndex(winnerIndex)

    // حساب عدد الدورات + الدوران للفائز (physics-based)
    // استخدام crypto.getRandomValues() للعشوائية الآمنة (مثل wheelofnames.com)
    const randomArray = new Uint32Array(1)
    if (window.crypto && window.crypto.getRandomValues) {
      window.crypto.getRandomValues(randomArray)
    }
    const secureRandom = randomArray[0] / (0xFFFFFFFF + 1) // تحويل إلى 0-1
    const spins = 8 + secureRandom * 4 // 8-12 دورات للأنيميشن الطبيعي
    const anglePerItem = 360 / participants.length
    
    // حساب الزاوية المستهدفة للفائز بدقة عالية (مثل wheelofnames.com)
    // استخدام displayParticipants إذا كان هناك حد أقصى، وإلا استخدام participants
    const effectiveCount = maxDisplayNames > 0 && participants.length > maxDisplayNames 
      ? maxDisplayNames 
      : (participants.length > 1000 && maxDisplayNames === 0 ? 800 : 
         participants.length > 700 && maxDisplayNames === 0 ? 700 : participants.length)
    
    // حساب index الفائز في القائمة المعروضة بدقة أعلى
    let displayWinnerIndex = winnerIndex
    if (effectiveCount < participants.length) {
      // إذا كان هناك عرض محدود، نحتاج لحساب index في القائمة المعروضة
      const step = participants.length / effectiveCount
      // استخدام حساب أدق للفهرس
      displayWinnerIndex = Math.floor(winnerIndex / step)
      if (displayWinnerIndex >= effectiveCount) displayWinnerIndex = effectiveCount - 1
      if (displayWinnerIndex < 0) displayWinnerIndex = 0
    }
    
    // حساب الزاوية المستهدفة بدقة عالية
    // استخدام الزاوية الفعلية للفائز في القائمة الكاملة (وليس المعروضة فقط)
    // لضمان الدقة حتى مع الأعداد الكبيرة
    const actualAnglePerItem = 360 / participants.length
    const targetOffset = 90 - (winnerIndex + 0.5) * actualAnglePerItem
    
    // تطبيع الدوران الحالي
    const currentRotationNormalized = ((rotation % 360) + 360) % 360
    
    // حساب الدوران النهائي مع ضمان الوصول للزاوية المستهدفة بدقة
    // إضافة دورات كاملة + تعديل للوصول للزاوية المستهدفة
    const finalRotation = rotation + (spins * 360) + (360 - currentRotationNormalized) + targetOffset

    console.log('الفائز:', winnerName, 'Index:', winnerIndex, 'Display Index:', displayWinnerIndex, 'Target Offset:', targetOffset, 'Final Rotation:', finalRotation)
    
    // استخدام physics-based animation مع easing محسّن للسلاسة (مثل wheelofnames.com)
    const startTime = performance.now() // استخدام performance.now() للدقة
    const duration = 6000 // 6 ثواني للأنيميشن السلس (مثل wheelofnames.com)
    const startRotation = rotation
    
    let animationId = null
    let lastFrameTime = startTime
    let lastRotation = startRotation
    
    // دالة easing محسّنة للسلاسة (ease-out-quintic - أكثر سلاسة من cubic)
    const easeOutQuint = (t) => {
      return 1 - Math.pow(1 - t, 5)
    }
    
    const animate = (currentTime) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      
      // استخدام easing function محسّن للسلاسة (ease-out-quintic)
      // يوفر سلاسة ممتازة مثل wheelofnames.com
      let easeProgress
      if (progress === 1) {
        easeProgress = 1
      } else {
        easeProgress = easeOutQuint(progress)
      }
      
      const currentRotation = startRotation + (finalRotation - startRotation) * easeProgress
      
      // تحديث الدوران فقط إذا تغير بشكل ملحوظ (تحسين الأداء)
      // تقليل threshold للأعداد الكبيرة لضمان السلاسة
      const rotationThreshold = participants.length > 1000 ? 0.05 : participants.length > 500 ? 0.08 : 0.1
      const rotationDelta = Math.abs(currentRotation - lastRotation)
      if (rotationDelta > rotationThreshold || progress === 1) {
        setRotation(currentRotation)
        lastRotation = currentRotation
      }
      
      // استخدام frame throttling محسّن للأعداد الكبيرة لتحسين الأداء
      const frameDelta = currentTime - lastFrameTime
      // تحسين throttling للأعداد الكبيرة - تخطي المزيد من الإطارات
      let shouldSkipFrame = false
      if (participants.length > 1000) {
        shouldSkipFrame = frameDelta < 16 // ~60fps للأعداد الكبيرة جداً
      } else if (participants.length > 500) {
        shouldSkipFrame = frameDelta < 12 // ~83fps للأعداد الكبيرة
      } else if (participants.length > 200) {
        shouldSkipFrame = frameDelta < 10 // ~100fps للأعداد المتوسطة
      } else {
        shouldSkipFrame = frameDelta < 8 // ~125fps للأعداد الصغيرة
      }
      
      if (progress < 1) {
        if (!shouldSkipFrame) {
          lastFrameTime = currentTime
        }
        animationId = requestAnimationFrame(animate)
      } else {
        // انتهاء الأنيميشن - التأكد من الوصول للزاوية النهائية بدقة
        setRotation(finalRotation)
        setIsSpinning(false)
        stopSpinningSound() // إيقاف صوت الدوران
        fetchWinners()
        // تشغيل صوت الفوز بعد تأخير قصير جداً لضمان الانتقال السلس
        setTimeout(() => {
          playWinningSound()
        }, 50) // تقليل التأخير لضمان الانتقال السلس
        setWinner(winnerName)
      }
    }
    
    // تشغيل صوت الدوران
    playSpinningSound()
    
    // بدء الأنيميشن
    animationId = requestAnimationFrame(animate)
    
    // تنظيف عند إلغاء الأنيميشن
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId)
      }
      stopSpinningSound()
    }
  }

  const drawWheel = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    // التحقق من تحميل الخط
    const isFontLoaded = checkFontLoaded()

    // إعادة تعيين Canvas لضمان الرسم الصحيح
    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    
    // حجم ديناميكي للعجلة لاستيعاب الأعداد الكبيرة من الأسماء (مثل wheelofnames.com)
    // زيادة حجم العجلة تدريجياً مع زيادة عدد الأسماء
    let baseSize = 600 // حجم أساسي
    if (participants.length > 2000) {
      baseSize = 1000  // حجم كبير جداً للأعداد الكبيرة جداً
    } else if (participants.length > 1000) {
      baseSize = 900  // حجم كبير جداً للأعداد الكبيرة جداً
    } else if (participants.length > 700) {
      baseSize = 850  // حجم كبير جداً لـ 700+ اسم
    } else if (participants.length > 500) {
      baseSize = 750  // حجم كبير للأعداد الكبيرة
    } else if (participants.length > 200) {
      baseSize = 650  // حجم متوسط للأعداد المتوسطة
    }
    const currentWidth = baseSize
    const currentHeight = baseSize
    
    // تحديث حجم Canvas ليكون دائماً ثابت
    if (canvas.style.width !== `${baseSize}px` || canvas.style.height !== `${baseSize}px`) {
      canvas.style.width = `${baseSize}px`
      canvas.style.height = `${baseSize}px`
    }
    
    // حفظ الأبعاد السابقة لتجنب إعادة الرسم غير الضروري
    if (canvas.width !== currentWidth * dpr || canvas.height !== currentHeight * dpr) {
      canvas.width = currentWidth * dpr
      canvas.height = currentHeight * dpr
      canvas.style.width = currentWidth + 'px'
      canvas.style.height = currentHeight + 'px'
    }

    const ctx = canvas.getContext('2d', { 
      alpha: false, // تحسين الأداء بإزالة الشفافية
      desynchronized: true // تحسين الأداء للرسوم المتحركة
    })
    
    // إعادة تعيين context بشكل كامل
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.scale(dpr, dpr)
    
    // مسح Canvas بالكامل
    ctx.clearRect(0, 0, currentWidth, currentHeight)
    
    // إعادة تعيين جميع الإعدادات
    ctx.save()
    
    // تحسين الأداء للأعداد الكبيرة - تعطيل بعض الميزات غير الضرورية
    // أثناء الدوران، نستخدم جودة أقل لضمان السلاسة
    if (isSpinning && participants.length > 200) {
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'medium' // جودة متوسطة أثناء الدوران
    } else if (participants.length > 500) {
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
    }

    const centerX = currentWidth / 2
    const centerY = currentHeight / 2
    // زيادة radius للأعداد الكبيرة لاستيعاب المزيد من الأسماء
    const radiusMargin = participants.length > 500 ? 30 : 25
    const radius = Math.min(centerX, centerY) - radiusMargin

    if (participants.length === 0) {
      // خلفية احترافية فارغة
      ctx.fillStyle = '#f8f9fa'
      ctx.beginPath()
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI)
      ctx.fill()
      ctx.strokeStyle = '#dee2e6'
      ctx.lineWidth = 3
      ctx.stroke()
      
      ctx.fillStyle = '#6c757d'
      ctx.font = 'bold 24px Cairo'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('أضف مشاركين للبدء', centerX, centerY)
      return
    }

    // رسم خلفية بيضاء للعجلة
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI)
    ctx.fillStyle = '#ffffff'
    ctx.fill()
    ctx.strokeStyle = '#e0e0e0'
    ctx.lineWidth = 2
    ctx.stroke()

    // رسم الصورة كخلفية للعجلة بالكامل إذا كانت موجودة
    if (imageRef.current && imageRef.current.complete) {
      ctx.save()
      // رسم دائرة للعجلة
      ctx.beginPath()
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI)
      ctx.clip()
      
      // حساب أبعاد الصورة لتغطي العجلة بالكامل
      const imgSize = radius * 2
      const imgX = centerX - radius
      const imgY = centerY - radius
      
      // رسم الصورة
      ctx.drawImage(imageRef.current, imgX, imgY, imgSize, imgSize)
      ctx.restore()
    }

    // تحديد الأسماء التي سيتم عرضها على العجلة (مثل wheelofnames.com)
    // تحسين للأداء: تقليل عدد الأسماء المرسومة أثناء الدوران مع الحفاظ على التوزيع المتساوي
    let displayParticipants = participants
    let targetDisplayCount = participants.length
    
    // أثناء الدوران، نستخدم Level of Detail (LOD) محسّن لضمان السلاسة
    if (isSpinning) {
      if (participants.length > 2000) {
        targetDisplayCount = 500 // تقليل كبير للأعداد الكبيرة جداً
      } else if (participants.length > 1000) {
        targetDisplayCount = 400 // تقليل كبير أثناء الدوران
      } else if (participants.length > 500) {
        targetDisplayCount = 300
      } else if (participants.length > 200) {
        targetDisplayCount = 200
      } else {
        targetDisplayCount = participants.length // للأعداد الصغيرة، نرسم الكل
      }
    } else {
      // عند عدم الدوران، نستخدم الإعدادات العادية مع تحسينات
      if (maxDisplayNames > 0 && participants.length > maxDisplayNames) {
        targetDisplayCount = maxDisplayNames
      } else if (participants.length > 1000 && maxDisplayNames === 0) {
        targetDisplayCount = 800 // زيادة الحد الأقصى للأعداد الكبيرة
      } else if (participants.length > 700 && maxDisplayNames === 0) {
        targetDisplayCount = 700
      } else {
        targetDisplayCount = participants.length
      }
    }
    
    // توزيع الأسماء بشكل متساوي ومحسّن (مثل wheelofnames.com)
    if (targetDisplayCount < participants.length) {
      const step = participants.length / targetDisplayCount
      displayParticipants = []
      // استخدام توزيع متساوي محسّن
      for (let i = 0; i < targetDisplayCount; i++) {
        // استخدام توزيع متساوي بدقة أعلى
        const exactIndex = i * step
        const index = Math.floor(exactIndex)
        if (index < participants.length) {
          displayParticipants.push(participants[index])
        }
      }
      // التأكد من أن آخر اسم موجود
      if (displayParticipants.length < targetDisplayCount && participants.length > 0) {
        const lastIndex = participants.length - 1
        if (!displayParticipants.includes(participants[lastIndex])) {
          displayParticipants.push(participants[lastIndex])
        }
      }
      // التأكد من أن أول اسم موجود
      if (participants.length > 0 && !displayParticipants.includes(participants[0])) {
        displayParticipants.unshift(participants[0])
      }
    }
    
    const displayCount = displayParticipants.length
    const anglePerItem = (2 * Math.PI) / displayCount
    // استخدام rotation الحالي فقط - لا تغييره
    const currentRotation = (rotation * Math.PI) / 180

    // حساب حجم الخط الديناميكي بناءً على عدد الأسماء المعروضة (مثل wheelofnames.com)
    // تحسين شامل لضمان عدم التداخل والترتيب الصحيح مع دعم أفضل للأعداد الكبيرة
    let fontSize, textRadius, minSpacing
    
    // تحسين حساب حجم الخط والمسافات لضمان وضوحه وعدم التداخل
    // ضبط textRadius بشكل متوازن لضمان وضوح النص وعدم خروجه من الحدود
    // دعم محسّن للأعداد الكبيرة جداً (2000+) مع ضمان عدم التداخل
    if (displayCount > 2000) {
      fontSize = Math.max(9, Math.min(13, radius / 55)) // تقليل حجم الخط للأعداد الكبيرة جداً
      textRadius = radius * 0.76 // تقليل المسافة من المركز
      minSpacing = radius * 0.026 // زيادة المسافة بين الأسماء
    } else if (displayCount > 1000) {
      fontSize = Math.max(10, Math.min(14, radius / 50)) // تقليل حجم الخط قليلاً
      textRadius = radius * 0.75 // تقليل المسافة من المركز
      minSpacing = radius * 0.025 // زيادة المسافة بين الأسماء
    } else if (displayCount > 700) {
      fontSize = Math.max(11, Math.min(15, radius / 45))
      textRadius = radius * 0.76
      minSpacing = radius * 0.024
    } else if (displayCount > 500) {
      fontSize = Math.max(12, Math.min(16, radius / 40))
      textRadius = radius * 0.74
      minSpacing = radius * 0.028
    } else if (displayCount > 200) {
      fontSize = Math.max(13, Math.min(17, radius / 35))
      textRadius = radius * 0.72
      minSpacing = radius * 0.03
    } else if (displayCount > 100) {
      fontSize = Math.max(15, Math.min(19, radius / 30))
      textRadius = radius * 0.70
      minSpacing = radius * 0.025
    } else if (displayCount > 50) {
      fontSize = Math.max(17, Math.min(21, radius / 24))
      textRadius = radius * 0.68
      minSpacing = radius * 0.02
    } else if (displayCount > 20) {
      fontSize = Math.max(19, Math.min(23, radius / 18))
      textRadius = radius * 0.65
      minSpacing = radius * 0.015
    } else {
      fontSize = Math.max(21, Math.min(26, radius / 14))
      textRadius = radius * 0.62
      minSpacing = radius * 0.01
    }
    
    // التأكد من أن fontSize ليس صغيراً جداً - الحد الأدنى 9 بكسل للوضوح
    if (fontSize < 9) fontSize = 9

    // رسم القطع بدون ألوان (شفافة تماماً)
    // التأكد من أن هناك مشاركين
    if (participants.length === 0) {
      ctx.restore()
      return
    }
    
    // تحسين توزيع الأسماء لمنع التداخل
    // حساب المسافة بين الأسماء بناءً على العدد (تحسين للتنسيق)
    const spacingFactor = displayCount > 200 ? 1.15 : displayCount > 100 ? 1.12 : displayCount > 50 ? 1.08 : 1.05
    
    // حساب القيم المشتركة مرة واحدة خارج الحلقة لتحسين الأداء
    // استخدام خط عربي Cairo بحجم مناسب ومنسق مع ضمان عدم التداخل
    let arabicFontSize
    if (displayCount > 1000) {
      arabicFontSize = Math.max(10, Math.min(13, radius / 50)) // تقليل حجم الخط
    } else if (displayCount > 700) {
      arabicFontSize = Math.max(11, Math.min(14, radius / 45))
    } else if (displayCount > 500) {
      arabicFontSize = Math.max(12, Math.min(15, radius / 40))
    } else if (displayCount > 200) {
      arabicFontSize = Math.max(13, Math.min(16, radius / 35))
    } else if (displayCount > 100) {
      arabicFontSize = Math.max(15, Math.min(18, radius / 30))
    } else if (displayCount > 50) {
      arabicFontSize = Math.max(17, Math.min(20, radius / 24))
    } else if (displayCount > 20) {
      arabicFontSize = Math.max(19, Math.min(22, radius / 18))
    } else {
      arabicFontSize = Math.max(21, Math.min(25, radius / 14))
    }
    
    // التأكد من أن arabicFontSize ليس صغيراً جداً
    if (arabicFontSize < 10) arabicFontSize = 10
    
    // حساب المسافة من المركز - تحسين بناءً على العدد لضمان عدم التداخل
    let dynamicTextRadius = textRadius
    
    // حساب المسافة الآمنة بناءً على حجم الخط وعدد الأسماء
    const shadowOffset = displayCount > 500 ? 3 : 4
    const baseMargin = displayCount > 500 ? 12 : 15 // زيادة الهامش
    const fontSizeMargin = arabicFontSize * 1.5 // هامش بناءً على حجم الخط
    const safeMargin = Math.max(fontSizeMargin + shadowOffset + baseMargin, 
                                displayCount > 500 ? 20 : 25) // زيادة الهامش الآمن
    const safeRadius = radius - safeMargin
    
    if (dynamicTextRadius > safeRadius) {
      dynamicTextRadius = safeRadius
    }
    
    // الحد الأدنى للمسافة من المركز لضمان وضوح النص
    const minRadiusFactor = displayCount > 500 ? 0.4 : 0.45
    if (dynamicTextRadius < radius * minRadiusFactor) {
      dynamicTextRadius = radius * minRadiusFactor
    }
    
    // حساب القيم المشتركة للنص مع تحسينات لمنع التداخل
    // سنستخدم finalAnglePerItem بعد تحديد finalDisplayCount
    let arcLength = dynamicTextRadius * anglePerItem
    
    // إعداد الخط والظل مرة واحدة
    const fontString = `${arabicFontSize}px "Cairo", "Segoe UI", Arial, sans-serif`
    const textColorValue = textColor || '#333333'
    
    // تعيين إعدادات الظل مرة واحدة
    // تقليل جودة الظل أثناء الدوران للأعداد الكبيرة لتحسين الأداء
    if (isSpinning && participants.length > 500) {
      ctx.shadowColor = 'rgba(0, 0, 0, 0.6)'
      ctx.shadowBlur = 4 // تقليل blur
      ctx.shadowOffsetX = 1
      ctx.shadowOffsetY = 1
    } else {
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)'
      ctx.shadowBlur = 8
      ctx.shadowOffsetX = 2
      ctx.shadowOffsetY = 2
    }
    
    // تحسين الأداء للأعداد الكبيرة - استخدام batch rendering
    const shouldDrawLines = displayCount <= 50
    const batchSize = displayCount > 500 ? 10 : displayCount > 200 ? 5 : 1
    
    // رسم الخطوط الفاصلة (إذا لزم الأمر) في batch منفصل
    // لا نرسم الخطوط أثناء الدوران للأعداد الكبيرة لتحسين الأداء
    if (shouldDrawLines && !(isSpinning && displayCount > 200)) {
      ctx.beginPath()
      displayParticipants.forEach((participant, index) => {
        const startAngle = index * anglePerItem - Math.PI / 2 + currentRotation
        ctx.moveTo(centerX, centerY)
        ctx.lineTo(
          centerX + Math.cos(startAngle) * radius,
          centerY + Math.sin(startAngle) * radius
        )
      })
      ctx.strokeStyle = 'rgba(200, 200, 200, 0.15)'
      ctx.lineWidth = 0.5
      ctx.stroke()
    }
    
    // رسم النصوص - تحسين شامل لمنع التداخل وضمان الترتيب (مثل wheelofnames.com)
    // تقليل عدد الأسماء المرسومة أثناء الدوران لضمان السلاسة مع الحفاظ على التوزيع المتساوي
    let finalDisplayParticipants = displayParticipants
    let finalDisplayCount = displayCount
    
    // أثناء الدوران، نستخدم Level of Detail (LOD) محسّن لتقليل عدد الأسماء المرسومة
    // مع الحفاظ على التوزيع المتساوي للأسماء
    if (isSpinning && displayCount > 2000) {
      // للأعداد الكبيرة جداً أثناء الدوران، نرسم كل اسم رابع فقط
      const step = 4
      finalDisplayParticipants = displayParticipants.filter((_, index) => index % step === 0)
      finalDisplayCount = finalDisplayParticipants.length
    } else if (isSpinning && displayCount > 1000) {
      // للأعداد الكبيرة جداً أثناء الدوران، نرسم كل اسم ثالث فقط
      const step = 3
      finalDisplayParticipants = displayParticipants.filter((_, index) => index % step === 0)
      finalDisplayCount = finalDisplayParticipants.length
    } else if (isSpinning && displayCount > 500) {
      // للأعداد الكبيرة أثناء الدوران، نرسم كل اسم ثاني
      const step = 2
      finalDisplayParticipants = displayParticipants.filter((_, index) => index % step === 0)
      finalDisplayCount = finalDisplayParticipants.length
    }
    
    // إعادة حساب anglePerItem إذا تغير عدد الأسماء
    const finalAnglePerItem = finalDisplayCount !== displayCount 
      ? (2 * Math.PI) / finalDisplayCount 
      : anglePerItem
    
    // إعادة حساب arcLength بناءً على finalAnglePerItem
    arcLength = dynamicTextRadius * finalAnglePerItem
    
    // حساب أقصى عرض للنص بناءً على finalDisplayCount
    let maxTextWidthFactor
    if (finalDisplayCount > 1000) {
      maxTextWidthFactor = 0.55 // تقليل العرض للأعداد الكبيرة
    } else if (finalDisplayCount > 500) {
      maxTextWidthFactor = 0.60
    } else if (finalDisplayCount > 200) {
      maxTextWidthFactor = 0.65
    } else if (finalDisplayCount > 100) {
      maxTextWidthFactor = 0.70
    } else if (finalDisplayCount > 50) {
      maxTextWidthFactor = 0.75
    } else {
      maxTextWidthFactor = 0.80
    }
    
    // حساب أقصى عرض للنص مع مسافة آمنة إضافية
    const widthMultiplier = finalDisplayCount > 500 ? 0.65 : 0.70 // تقليل المضاعف
    const maxTextWidth = Math.min(arcLength * maxTextWidthFactor, dynamicTextRadius * widthMultiplier)
    
    // تقليل threshold لضمان عدم التداخل
    const widthThreshold = finalDisplayCount > 500 ? 0.95 : 1.0 // تقليل threshold
    const charWidthFactor = finalDisplayCount > 500 ? 0.85 : 0.90 // تقليل factor
    
    finalDisplayParticipants.forEach((participant, index) => {
      // حساب الزوايا بدقة - استخدام منتصف القطعة بالضبط
      const startAngle = index * finalAnglePerItem - Math.PI / 2 + currentRotation
      const endAngle = (index + 1) * finalAnglePerItem - Math.PI / 2 + currentRotation
      const midAngle = (startAngle + endAngle) / 2
      
      // رسم النص بوضوح عالي
      ctx.save()
      ctx.translate(centerX, centerY)
      ctx.rotate(midAngle)
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.font = fontString
      ctx.direction = 'rtl'
      ctx.fillStyle = textColorValue
      
      const text = String(participant || '').trim()
      
      if (!text || text.length === 0) {
        ctx.restore()
        return
      }
      
      // تنظيف الاسم العربي
      const normalizedName = normalizeArabicName(text)
      
      // عرض جميع الأسماء على سطر واحد
      let displayText = normalizedName
      
      // قياس النص أولاً
      let metrics = ctx.measureText(displayText)
      
      // قص النص بشكل ذكي لضمان عدم التداخل
      let finalDisplayText = displayText
      const availableWidth = maxTextWidth * widthThreshold
      
      if (metrics.width > availableWidth && displayText.length > 0) {
        // حساب عدد الأحرف المناسبة بناءً على العرض المتاح
        const avgCharWidth = metrics.width / displayText.length
        const maxChars = Math.floor(availableWidth * charWidthFactor / avgCharWidth)
        
        // التأكد من أن maxChars معقول
        if (maxChars > 3 && displayText.length > maxChars) {
          // محاولة قص من آخر مسافة
          const truncated = displayText.substring(0, maxChars)
          const lastSpace = truncated.lastIndexOf(' ')
          
          if (lastSpace > maxChars * 0.4 && lastSpace > 3) {
            // قص من آخر مسافة
            finalDisplayText = truncated.substring(0, lastSpace) + '...'
          } else {
            // قص مباشر
            finalDisplayText = truncated + '...'
          }
          
          // إعادة قياس النص المقطوع
          metrics = ctx.measureText(finalDisplayText)
          
          // التأكد من أن النص المقطوع لا يزال مناسباً
          if (metrics.width > availableWidth * 1.1) {
            // قص أكثر إذا لزم الأمر
            const newMaxChars = Math.floor(maxChars * 0.9)
            if (newMaxChars > 3) {
              finalDisplayText = displayText.substring(0, newMaxChars) + '...'
              metrics = ctx.measureText(finalDisplayText)
            }
          }
        }
      }
      
      if (finalDisplayText.length === 0) {
        ctx.restore()
        return
      }
      
      // حساب المسافة النهائية من المركز مع ضمان عدم التداخل
      // إضافة مسافة إضافية صغيرة لضمان الفصل بين الأسماء
      const spacingOffset = finalDisplayCount > 500 ? 2 : finalDisplayCount > 200 ? 3 : 4
      const finalTextRadius = dynamicTextRadius + spacingOffset
      
      // رسم النص مع الظل (تم تعيينه مسبقاً)
      try {
        // التأكد من أن النص في منتصف القطعة تماماً
        ctx.fillText(finalDisplayText, finalTextRadius, 0)
      } catch (e) {
        console.error('خطأ في رسم النص:', e, finalDisplayText)
      }
      
      ctx.restore()
    })
    
    // إعادة تعيين الظل بعد الانتهاء من رسم جميع الأسماء
    ctx.shadowColor = 'transparent'
    ctx.shadowBlur = 0
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 0

    // رسم دائرة داخلية بسيطة
    const innerRadius = radius * 0.15
    ctx.beginPath()
    ctx.arc(centerX, centerY, innerRadius, 0, 2 * Math.PI)
    ctx.fillStyle = '#ffffff'
    ctx.fill()
    ctx.strokeStyle = '#dee2e6'
    ctx.lineWidth = 2
    ctx.stroke()

    // دائرة خارجية احترافية
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius + 5, 0, 2 * Math.PI)
    ctx.strokeStyle = '#495057'
    ctx.lineWidth = 6
    ctx.stroke()
    
    // دائرة خارجية ذهبية
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius + 8, 0, 2 * Math.PI)
    ctx.strokeStyle = '#ffd700'
    ctx.lineWidth = 2
    ctx.stroke()
    
    // إعادة تعيين context
    ctx.restore()
  }

  const clearParticipants = async () => {
    if (!confirm('هل أنت متأكد من مسح جميع المشاركين؟')) return
    try {
      await axios.delete(`${API_BASE_URL}/participants`)
      fetchParticipants()
    } catch (error) {
      alert('حدث خطأ')
    }
  }

  const clearWinners = async () => {
    if (!confirm('هل أنت متأكد من مسح قائمة الفائزين؟')) return
    try {
      await axios.delete(`${API_BASE_URL}/winners`)
      fetchWinners()
    } catch (error) {
      alert('حدث خطأ')
    }
  }

  return (
    <div className="app">
      <div className="container">
        <header className="header">
          <h1>🎡 عجلة الحظ</h1>
          <p className="subtitle">اختر الفائز بطريقة عادلة وممتعة</p>
        </header>

        <div className="main-content">
          <div className="wheel-section" ref={fullscreenRef}>
            <button 
              className="fullscreen-button"
              onClick={toggleFullscreen}
              title={isFullscreen ? 'إغلاق وضع ملء الشاشة' : 'فتح وضع ملء الشاشة'}
            >
              {isFullscreen ? '🗗' : '🗖'}
            </button>
            {isFullscreen && wheelTitle && (
              <div className="fullscreen-title">
                <h1>{wheelTitle}</h1>
              </div>
            )}
            <div className="wheel-container">
              <div className="wheel-wrapper">
                <canvas
                  ref={canvasRef}
                  className={`wheel ${isSpinning ? 'spinning' : ''}`}
                  style={{
                    transform: `rotate(${rotation}deg)`,
                    transition: 'none', // لا نستخدم CSS transition، نستخدم requestAnimationFrame
                    willChange: isSpinning ? 'transform' : 'auto',
                    // تحسينات إضافية للأداء
                    transformOrigin: 'center center',
                    backfaceVisibility: 'hidden',
                    perspective: '1000px',
                    WebkitBackfaceVisibility: 'hidden',
                    WebkitPerspective: '1000px'
                  }}
                />
                <div className="wheel-pointer"></div>
              </div>
              {winner && (
                <div 
                  className="winner-popup"
                  onClick={(e) => {
                    if (e.target.className === 'winner-popup') {
                      // إغلاق النافذة بدون رفرش
                      setWinner(null)
                    }
                  }}
                >
                  <div className="winner-card" onClick={(e) => e.stopPropagation()}>
                    {/* تأثيرات التحايا الاحترافية */}
                    <div className="celebration-confetti">
                      {[...Array(50)].map((_, i) => (
                        <div 
                          key={i} 
                          className="confetti-piece"
                          style={{
                            left: `${Math.random() * 100}%`,
                            animationDelay: `${Math.random() * 2}s`,
                            animationDuration: `${2 + Math.random() * 2}s`
                          }}
                        ></div>
                      ))}
                    </div>
                    
                    <div className="winner-card-header">
                      <div className="winner-icon">🎉</div>
                      <h2>مبروك!</h2>
                    </div>
                    <div className="winner-card-body">
                      <p className="winner-label">الفائز المحظوظ هو:</p>
                      <p className="winner-name">{winner}</p>
                      {splitFullName(winner).line1 && splitFullName(winner).line2 && (
                        <div className="winner-name-split">
                          <span className="winner-name-line">{splitFullName(winner).line1}</span>
                          <span className="winner-name-line">{splitFullName(winner).line2}</span>
                        </div>
                      )}
                      <div className="celebration-sparkles">
                        <span className="sparkle">✨</span>
                        <span className="sparkle">⭐</span>
                        <span className="sparkle">🌟</span>
                        <span className="sparkle">💫</span>
                      </div>
                    </div>
                    <div className="winner-card-footer">
                      <button 
                        className="winner-close-btn"
                        onClick={() => {
                          // إغلاق النافذة بدون رفرش
                          setWinner(null)
                        }}
                      >
                        إغلاق
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="wheel-controls">
              <button
                className="spin-button"
                onClick={spinWheel}
                disabled={isSpinning || participants.length === 0}
              >
                {isSpinning ? '⏳ جاري التدوير...' : '🎯 تدوير العجلة'}
              </button>
              <p className="participants-count">
                المشاركون المتبقون: <strong>{participants.length}</strong>
              </p>
            </div>
          </div>

          {/* نافذة الإعدادات */}
          {showSettings && (
            <div 
              className="settings-overlay"
              onClick={(e) => {
                if (e.target.className === 'settings-overlay') {
                  setShowSettings(false)
                }
              }}
            >
              <div className="settings-panel" onClick={(e) => e.stopPropagation()}>
                <div className="settings-header">
                  <h2>⚙️ إعدادات العجلة</h2>
                  <button 
                    className="close-settings-btn"
                    onClick={() => setShowSettings(false)}
                  >
                    ✕
                  </button>
                </div>
                
                <div className="settings-content">
                  <div className="settings-section">
                    <h3>📝 عنوان العجلة</h3>
                    <div className="input-group">
                      <input
                        type="text"
                        value={wheelTitle}
                        onChange={(e) => setWheelTitle(e.target.value)}
                        placeholder="أدخل عنوان العجلة (سيظهر في وضع fullscreen)"
                        style={{ width: '100%' }}
                      />
                    </div>
                    <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                      <button 
                        onClick={() => saveWheelTitle(wheelTitle)}
                        className="full-width"
                        style={{ flex: 1 }}
                      >
                        حفظ العنوان
                      </button>
                      {wheelTitle && (
                        <button 
                          onClick={removeWheelTitle}
                          style={{ 
                            background: '#dc3545',
                            flex: 1
                          }}
                          className="full-width"
                        >
                          حذف العنوان
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="settings-section">
                    <h3>🎨 لون النص</h3>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>
                      <input
                        type="color"
                        value={textColor}
                        onChange={(e) => setTextColor(e.target.value)}
                        style={{ width: '60px', height: '40px', cursor: 'pointer' }}
                      />
                      <input
                        type="text"
                        value={textColor}
                        onChange={(e) => setTextColor(e.target.value)}
                        placeholder="#ffffff"
                        style={{ flex: 1, padding: '10px' }}
                      />
                    </div>
                    <button 
                      onClick={() => saveTextColor(textColor)}
                      className="full-width"
                    >
                      حفظ لون النص
                    </button>
                    <div style={{ marginTop: '10px', display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                      <button 
                        onClick={() => saveTextColor('#ffffff')}
                        style={{ background: '#ffffff', color: '#000', padding: '5px 10px', fontSize: '12px' }}
                      >
                        أبيض
                      </button>
                      <button 
                        onClick={() => saveTextColor('#000000')}
                        style={{ background: '#000000', color: '#fff', padding: '5px 10px', fontSize: '12px' }}
                      >
                        أسود
                      </button>
                      <button 
                        onClick={() => saveTextColor('#ff0000')}
                        style={{ background: '#ff0000', color: '#fff', padding: '5px 10px', fontSize: '12px' }}
                      >
                        أحمر
                      </button>
                      <button 
                        onClick={() => saveTextColor('#0000ff')}
                        style={{ background: '#0000ff', color: '#fff', padding: '5px 10px', fontSize: '12px' }}
                      >
                        أزرق
                      </button>
                      <button 
                        onClick={() => saveTextColor('#00ff00')}
                        style={{ background: '#00ff00', color: '#000', padding: '5px 10px', fontSize: '12px' }}
                      >
                        أخضر
                      </button>
                    </div>
                  </div>

                  <div className="settings-section">
                    <h3>🔊 إعدادات الصوت</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
                      <button
                        onClick={() => saveSoundMuted(!soundMuted)}
                        className="full-width"
                        style={{
                          background: soundMuted ? '#dc3545' : '#28a745',
                          color: 'white',
                          padding: '15px 25px',
                          fontSize: '1.1rem',
                          fontWeight: 'bold'
                        }}
                      >
                        {soundMuted ? '🔇 الصوت مكتوم - اضغط للتفعيل' : '🔊 الصوت مفعّل - اضغط للكتم'}
                      </button>
                    </div>
                    <p style={{ fontSize: '13px', color: '#666', fontStyle: 'italic' }}>
                      {soundMuted 
                        ? '⚠️ الصوت مكتوم حالياً - لن يتم تشغيل أي أصوات أثناء الدوران أو الفوز'
                        : '✅ الصوت مفعّل - سيتم تشغيل أصوات احترافية أثناء الدوران والفوز'}
                    </p>
                  </div>

                  <div className="settings-section">
                    <h3>🔢 الحد الأقصى للأسماء الظاهرة</h3>
                    <p style={{ fontSize: '14px', color: '#666', marginBottom: '10px' }}>
                      حدد الحد الأقصى لعدد الأسماء التي تظهر على العجلة (0 = بدون حد)
                    </p>
                    <div className="input-group">
                      <input
                        type="number"
                        value={maxDisplayNames || ''}
                        onChange={(e) => setMaxDisplayNames(parseInt(e.target.value) || 0)}
                        placeholder="0 = بدون حد"
                        min="0"
                        style={{ width: '100%', padding: '10px' }}
                      />
                    </div>
                    <button 
                      onClick={() => saveMaxDisplayNames(maxDisplayNames)}
                      className="full-width"
                      style={{ marginTop: '10px' }}
                    >
                      حفظ الحد الأقصى
                    </button>
                    <p style={{ fontSize: '12px', color: '#999', marginTop: '5px' }}>
                      الأسماء الحالية: {participants.length} | 
                      {maxDisplayNames > 0 ? (
                        ` سيتم عرض: ${Math.min(maxDisplayNames, participants.length)}`
                      ) : participants.length > 700 ? (
                        ` سيتم عرض: 700 (لضمان السلاسة) من أصل ${participants.length}`
                      ) : (
                        ' سيتم عرض جميع الأسماء'
                      )}
                    </p>
                    {participants.length > 700 && maxDisplayNames === 0 && (
                      <p style={{ fontSize: '11px', color: '#ff9800', marginTop: '5px', fontStyle: 'italic' }}>
                        💡 تلميح: للأعداد الكبيرة جداً (700+)، يتم عرض 700 اسم تلقائياً لضمان أداء سلس
                      </p>
                    )}
                  </div>

                  <div className="settings-section">
                    <h3>📷 صورة العجلة</h3>
                    <div className="image-upload-section">
                      {wheelImageUrl ? (
                        <div className="image-preview">
                          <img src={wheelImageUrl} alt="صورة العجلة" />
                          <button onClick={removeWheelImage} className="remove-image-btn">
                            حذف الصورة
                          </button>
                        </div>
                      ) : (
                        <div className="upload-area">
                          <label htmlFor="wheel-image-upload" className="upload-label">
                            <span>📷 اضغط لرفع صورة</span>
                            <span className="upload-hint">ستظهر كخلفية للعجلة</span>
                          </label>
                          <input
                            id="wheel-image-upload"
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            style={{ display: 'none' }}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="settings-section">
                    <h3>➕ إضافة مشارك</h3>
                    <div className="input-group">
                      <input
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addParticipant()}
                        placeholder="اسم المشارك"
                      />
                      <button onClick={addParticipant}>إضافة</button>
                    </div>
                  </div>

                  <div className="settings-section">
                    <h3>📝 إضافة عدة مشاركين</h3>
                    <textarea
                      value={bulkNames}
                      onChange={(e) => setBulkNames(e.target.value)}
                      placeholder="أدخل الأسماء (سطر لكل اسم)"
                      rows="5"
                    />
                    <button onClick={addBulkParticipants} className="full-width">
                      إضافة الجميع
                    </button>
                  </div>

                  <div className="settings-section">
                    <h3>👥 المشاركون ({participants.length})</h3>
                    <div className="participants-list">
                      {participants.length === 0 ? (
                        <p className="empty-state">لا يوجد مشاركون</p>
                      ) : (
                        participants.map((name, index) => (
                          <div key={index} className="participant-item">
                            <span>{name}</span>
                            <button
                              className="remove-btn"
                              onClick={() => removeParticipant(name)}
                            >
                              ✕
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                    {participants.length > 0 && (
                      <button onClick={clearParticipants} className="clear-btn">
                        مسح الكل
                      </button>
                    )}
                  </div>

                  <div className="settings-section">
                    <h3>🏆 الفائزون ({winners.length})</h3>
                    <div className="winners-list">
                      {winners.length === 0 ? (
                        <p className="empty-state">لا يوجد فائزون بعد</p>
                      ) : (
                        winners.map((winner, index) => (
                          <div key={index} className="winner-item">
                            <span className="winner-number">{index + 1}</span>
                            <span className="winner-name">{winner.name}</span>
                            <span className="winner-time">
                              {new Date(winner.won_at).toLocaleDateString('ar-SA')}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                    {winners.length > 0 && (
                      <button onClick={clearWinners} className="clear-btn">
                        مسح القائمة
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="sidebar">
            <div className="card">
              <h2>📊 ملخص سريع</h2>
              <div className="summary-stats">
                <div className="stat-item">
                  <span className="stat-label">المشاركون:</span>
                  <span className="stat-value">{participants.length}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">الفائزون:</span>
                  <span className="stat-value">{winners.length}</span>
                </div>
              </div>
              <button 
                className="open-settings-btn"
                onClick={() => setShowSettings(true)}
              >
                ⚙️ فتح الإعدادات
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App

