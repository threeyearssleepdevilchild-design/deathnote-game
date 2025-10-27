import { useState, useEffect } from 'react'
import { ref, onValue } from 'firebase/database'
import { database } from './config/firebase'
import HomeScreen from './components/HomeScreen'
import CreateRoomScreen from './components/CreateRoomScreen'
import JoinRoomScreen from './components/JoinRoomScreen'
import LobbyScreen from './components/LobbyScreen'
import RoleRevealScreen from './components/RoleRevealScreen'
import WatariCheckScreen from './components/WatariCheckScreen'
import InvestigationScreen from './components/InvestigationScreen'
import JudgmentScreen from './components/JudgmentScreen'
import ResultScreen from './components/ResultScreen'
import SpectatorScreen from './components/SpectatorScreen'

function App() {
  const [currentScreen, setCurrentScreen] = useState('home')
  const [playerCount, setPlayerCount] = useState(4)
  const [roomId, setRoomId] = useState(null)
  const [nickname, setNickname] = useState('')
  const [gamePhase, setGamePhase] = useState(null)
  const [isSpectator, setIsSpectator] = useState(false)
  const [isDead, setIsDead] = useState(false)
  // 観戦者状態の監視
  useEffect(() => {
    if (!roomId || !nickname) return

    const spectatorRef = ref(database, `rooms/${roomId}/spectators/${nickname}`)
    const unsubscribe = onValue(spectatorRef, (snapshot) => {
      setIsSpectator(snapshot.exists())
    })

    return () => unsubscribe()
  }, [roomId, nickname])
  // 死亡状態の監視
  useEffect(() => {
    if (!roomId || !nickname) return

    const deadPlayersRef = ref(database, `rooms/${roomId}/game/deadPlayers`)
    const unsubscribe = onValue(deadPlayersRef, (snapshot) => {
      if (snapshot.exists()) {
        const deadPlayers = snapshot.val()
        setIsDead(deadPlayers.includes(nickname))
      } else {
        setIsDead(false)
      }
    })

    return () => unsubscribe()
  }, [roomId, nickname])
  // ゲームフェーズの監視
  useEffect(() => {
    if (!roomId) return

    const gameRef = ref(database, `rooms/${roomId}/game/phase`)
    const unsubscribe = onValue(gameRef, (snapshot) => {
      if (snapshot.exists()) {
        setGamePhase(snapshot.val())
      }
    })

    return () => unsubscribe()
  }, [roomId])

  // ゲームフェーズによって画面を切り替え
  useEffect(() => {
    // 死亡または観戦者の場合、ゲーム中はすべて観戦画面
    if ((isSpectator || isDead) && gamePhase && gamePhase !== 'game_over') {
      setCurrentScreen('spectator')
      return
    }
    
    if (gamePhase === 'role_reveal') {
      setCurrentScreen('roleReveal')
    } else if (gamePhase === 'watari_check') {
      setCurrentScreen('watariCheck')
    } else if (gamePhase === 'card_draw' || gamePhase === 'card_use') {
      setCurrentScreen('investigation')
    } else if (gamePhase === 'judgment') {
      setCurrentScreen('judgment')
    } else if (gamePhase === 'game_over') {
      setCurrentScreen('result')
    }
  }, [gamePhase, isSpectator, isDead])

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {currentScreen === 'home' && (
        <HomeScreen setCurrentScreen={setCurrentScreen} />
      )}
      {currentScreen === 'createRoom' && (
        <CreateRoomScreen 
          setCurrentScreen={setCurrentScreen}
          playerCount={playerCount}
          setPlayerCount={setPlayerCount}
          setRoomId={setRoomId}
          setNickname={setNickname}
        />
      )}
      {currentScreen === 'joinRoom' && (
        <JoinRoomScreen 
          setCurrentScreen={setCurrentScreen}
          setRoomId={setRoomId}
          setNickname={setNickname}
        />
      )}
      {currentScreen === 'lobby' && (
        <LobbyScreen 
          roomId={roomId}
          nickname={nickname}
          playerCount={playerCount}
          setCurrentScreen={setCurrentScreen}
          setRoomId={setRoomId}
        />
      )}
      {currentScreen === 'roleReveal' && (
        
        <RoleRevealScreen 
          roomId={roomId}
          nickname={nickname}
        />
      )}
      {currentScreen === 'watariCheck' && (
  <WatariCheckScreen 
    roomId={roomId}
    nickname={nickname}
  />
)}
{currentScreen === 'investigation' && (
  <InvestigationScreen 
    roomId={roomId}
    nickname={nickname}
  />
)}
{currentScreen === 'judgment' && (
  <JudgmentScreen 
    roomId={roomId}
    nickname={nickname}
  />
)}
{currentScreen === 'result' && (
        <ResultScreen 
          roomId={roomId}
          setCurrentScreen={setCurrentScreen}
          setRoomId={setRoomId}
        />
      )}
      {currentScreen === 'spectator' && (
        <SpectatorScreen 
          roomId={roomId}
          nickname={nickname}
        />
      )}
    </div>
  )
}

export default App