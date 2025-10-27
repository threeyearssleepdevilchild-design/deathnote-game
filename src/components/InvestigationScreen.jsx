import { useState, useEffect } from 'react'
import { ref, onValue, update, get } from 'firebase/database'
import { database } from '../config/firebase'
import RulesModal from './RulesModal'

export default function InvestigationScreen({ roomId, nickname }) {
  const [gameData, setGameData] = useState(null)
  const [showRules, setShowRules] = useState(false)
  const [myHand, setMyHand] = useState([])
  const [selectedCard, setSelectedCard] = useState(null)
  const [showCardAction, setShowCardAction] = useState(false)
  const [currentPlayer, setCurrentPlayer] = useState('')
  const [isMyTurn, setIsMyTurn] = useState(false)
  const [turnCount, setTurnCount] = useState(1)
  const [showPlayerSelect, setShowPlayerSelect] = useState(false)
  const [cardEffect, setCardEffect] = useState('')
  const [showInfoModal, setShowInfoModal] = useState(false)
  const [infoModalContent, setInfoModalContent] = useState(null)
  const [showCardSelect, setShowCardSelect] = useState(false)
  const [exchangeData, setExchangeData] = useState(null)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [confirmModalData, setConfirmModalData] = useState(null)
  const [showShinigamiInfo, setShowShinigamiInfo] = useState(false)
  const [showShinigamiWaiting, setShowShinigamiWaiting] = useState(false)
  const [shinigamiData, setShinigamiData] = useState(null)
  const [showDirectionSelect, setShowDirectionSelect] = useState(false)
  const [showInterrogationCardSelect, setShowInterrogationCardSelect] = useState(false)
  const [showInterrogationWaiting, setShowInterrogationWaiting] = useState(false)
  const [interrogationData, setInterrogationData] = useState(null)

  // ゲームデータの監視
  useEffect(() => {
    const gameRef = ref(database, `rooms/${roomId}/game`)
    const unsubscribe = onValue(gameRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val()
        setGameData(data)
// 死亡プレイヤーのターンをスキップ（最初の生存プレイヤーのみ実行）
      if (data.phase === 'card_draw' || data.phase === 'card_use') {
        const currentPlayer = data.turnOrder?.[data.currentTurn % data.turnOrder.length]
        const deadPlayers = data.deadPlayers || []
        
        if (currentPlayer && deadPlayers.includes(currentPlayer) && !data.skipInProgress) {
          // 最初の生存プレイヤーだけがスキップ処理を実行
          const firstAlivePlayer = data.turnOrder.find(p => !deadPlayers.includes(p))
          
          if (firstAlivePlayer === nickname) {
            console.log('🔄 死亡プレイヤーのターンをスキップします:', currentPlayer)
            // 自分が最初の生存プレイヤーなので、スキップ処理を実行
            skipDeadPlayerTurn(data)
          }
        }
      }
        // 自分の手札を取得
        if (data.hands && data.hands[nickname]) {
          console.log('🎴 Firebase から取得した手札:', data.hands[nickname])
          setMyHand(data.hands[nickname])
        }

        // 現在のターンプレイヤーを取得
        if (data.turnOrder && typeof data.currentTurn === 'number') {
          const currentPlayerName = data.turnOrder[data.currentTurn % data.turnOrder.length]
          setCurrentPlayer(currentPlayerName)
          setIsMyTurn(currentPlayerName === nickname)
          setTurnCount(Math.floor(data.currentTurn / data.turnOrder.length) + 1)
        }

        // 交換カードの状態を監視
        if (data.exchangeInProgress) {
          const exchange = data.exchangeInProgress
          
          if (exchange.targetPlayer === nickname && !exchange.targetCardSelected) {
            setExchangeData(exchange)
            setShowCardSelect(true)
          }
          else if (exchange.initiator === nickname && exchange.targetCardSelected && !exchange.initiatorCardSelected) {
            setExchangeData(exchange)
            setShowCardSelect(true)
          } else {
            setShowCardSelect(false)
          }
        } else {
          setExchangeData(null)
          setShowCardSelect(false)
        }

        // 拳銃カードの結果を監視（全員に表示）
        if (data.lastAction && data.lastAction.type === 'handgun' && data.lastAction.timestamp) {
          const now = Date.now()
          if (now - data.lastAction.timestamp < 5000) {
            const action = data.lastAction
            
            if (action.player !== nickname) {
              setInfoModalContent(
                <div className="text-center">
                  <p className="text-lg mb-4 font-bold">
                    {action.player} が {action.target} に拳銃を使用
                  </p>
                  <div className="bg-gray-800 rounded-lg p-4">
                    <p className="text-sm text-gray-400 mb-3">{action.target} が公開したカード</p>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-2xl font-bold">{action.revealedCard.name}</span>
                      <span className="text-gray-400">#{action.revealedCard.number}</span>
                    </div>
                    <p className="text-sm text-gray-300">{action.revealedCard.description}</p>
                  </div>
                </div>
              )
              setShowInfoModal(true)
            }
          }
        }

        // 死神カードの状態を監視
        if (data.shinigamiInProgress) {
          const shinigami = data.shinigamiInProgress
          const myRole = data.roles[nickname]
          
          const roleId = myRole?.role?.id || myRole?.roleId
          if (myRole && (roleId === 'kira' || roleId === 'believer')) {
            setShinigamiData(shinigami)
            
            if (!shinigami.confirmed || !shinigami.confirmed[nickname]) {
              setShowShinigamiInfo(true)
              setShowShinigamiWaiting(false)
            } else {
              setShowShinigamiInfo(false)
              setShowShinigamiWaiting(true)
            }
          } else {
            setShowShinigamiWaiting(true)
            setShowShinigamiInfo(false)
          }
        } else {
          setShowShinigamiInfo(false)
          setShowShinigamiWaiting(false)
          setShinigamiData(null)
        }

        // 取り調べカードの状態を監視
        if (data.interrogationInProgress) {
          const interrogation = data.interrogationInProgress
          setInterrogationData(interrogation)
          
          // 自分が死亡している場合は何も表示しない
          const amIDead = (data.deadPlayers || []).includes(nickname)
          
          if (amIDead) {
            setShowInterrogationCardSelect(false)
            setShowInterrogationWaiting(false)
          } else {
            // 自分がまだカードを選択していない場合
            if (!interrogation.selectedCards || !interrogation.selectedCards[nickname]) {
              setShowInterrogationCardSelect(true)
              setShowInterrogationWaiting(false)
            } else {
              // 既に選択済みの場合は待機
              setShowInterrogationCardSelect(false)
              setShowInterrogationWaiting(true)
            }
          }
        } else {
          setShowInterrogationCardSelect(false)
          setShowInterrogationWaiting(false)
          setInterrogationData(null)
        }
        
        // 自分のターンで自分が死亡している場合、自動的にターンをスキップ
        const isDead = (data.deadPlayers || []).includes(nickname)
        const currentPlayerName = data.turnOrder?.[data.currentTurn % data.turnOrder.length]
        
        if (isDead && currentPlayerName === nickname && data.phase === 'card_draw') {
          // 自動的に次のプレイヤーにターンを回す
          skipDeadPlayerTurn(data)
        }
      }
    })

    return () => unsubscribe()
  }, [roomId, nickname])

  // カードをクリック
  const handleCardClick = (card, index) => {
    // 死亡している場合は操作不可
    if (isDead) {
      alert('あなたは死亡しているため、カードを使用できません')
      return
    }
    
    if (!isMyTurn) {
      alert('あなたのターンではありません')
      return
    }
    
    if (gameData.phase !== 'card_use') {
      alert('カードを使用できるフェーズではありません')
      return
    }
    
    setSelectedCard({ card, index })
    setShowCardAction(true)
  }

  // カードを使用
  const useSelectedCard = () => {
    setShowCardAction(false)
    
    const { card, index } = selectedCard
    
    // 役職による使用制限チェック
    const myRole = gameData.roles[nickname]
    const myRoleId = myRole?.role?.id || myRole?.roleId
    
    // 拳銃カード：警察・メロのみ使用可能
    if (card.cardId === 'handgun') {
      if (myRoleId !== 'police' && myRoleId !== 'melo') {
        alert('拳銃カードは警察とメロのみ使用できます')
        setSelectedCard(null)
        return
      }
    }
    
    // 逮捕カード：Lのみ使用可能
    if (card.cardId === 'arrest') {
      if (myRoleId !== 'l') {
        alert('逮捕カードはLのみ使用できます')
        setSelectedCard(null)
        return
      }
    }
    
    switch (card.cardId) {
      case 'vote':
        handleVoteCard(index)
        break
      case 'exchange':
        setCardEffect('exchange')
        setShowPlayerSelect(true)
        break
      case 'handgun':
        handleHandgunCard()
        break
      case 'arrest':
        handleArrestCard()
        break
      case 'shinigami':
        handleShinigamiCard(index)
        break
      case 'interrogation':
        setShowDirectionSelect(true)
        break
      case 'surveillance':
        setCardEffect('surveillance')
        setShowPlayerSelect(true)
        break
      case 'witness':
        setCardEffect('witness')
        setShowPlayerSelect(true)
        break
      default:
        alert(`${card.name}の効果はまだ実装されていません`)
        setSelectedCard(null)
    }
  }

  // 投票カード
  const handleVoteCard = async (cardIndex) => {
    if (!gameData) return
    
    try {
      const discardedCard = myHand[cardIndex]
      const newHand = myHand.filter((_, i) => i !== cardIndex)
      const newDiscardPile = [...(gameData?.discardPile || []), discardedCard]
      
      const newTurn = gameData.currentTurn + 1
      const totalPlayers = Object.keys(gameData.roles).length
      
      await update(ref(database, `rooms/${roomId}/game`), {
        [`hands/${nickname}`]: newHand,
        discardPile: newDiscardPile,
        currentTurn: newTurn,
        phase: 'card_draw',
        lastAction: {
          type: 'vote',
          player: nickname,
          timestamp: Date.now()
        }
      })
      
      await checkJudgmentTime(newTurn, totalPlayers)
      
      setSelectedCard(null)
      
      alert('投票カードを使用しました。全員でキラだと思うプレイヤーを指差してください！')
      
    } catch (error) {
      console.error('投票エラー:', error)
    }
  }

  // カードを捨て札にする
  const discardCard = async (cardIndex) => {
    try {
      const discardedCard = myHand[cardIndex]
      const newHand = myHand.filter((_, i) => i !== cardIndex)
      const newDiscardPile = [...(gameData?.discardPile || []), discardedCard]
      
      const newTurn = gameData.currentTurn + 1
      const totalPlayers = Object.keys(gameData.roles).length
      
      await update(ref(database, `rooms/${roomId}/game`), {
        [`hands/${nickname}`]: newHand,
        discardPile: newDiscardPile,
        currentTurn: newTurn,
        phase: 'card_draw'
      })
      
      await checkJudgmentTime(newTurn, totalPlayers)
      
    } catch (error) {
      console.error('カード破棄エラー:', error)
    }
  }

  // カードを捨て札にする（選択されたカード）
  const discardSelectedCard = () => {
    setShowCardAction(false)
    
    if (selectedCard.card.canDiscard === false) {
      alert(`${selectedCard.card.name}は捨て札にできません`)
      setSelectedCard(null)
      return
    }
    
    discardCard(selectedCard.index)
    setSelectedCard(null)
  }

  // 交換カードの開始
  const handleExchangeStart = async (targetPlayer) => {
    try {
      await update(ref(database, `rooms/${roomId}/game`), {
        exchangeInProgress: {
          initiator: nickname,
          targetPlayer: targetPlayer,
          initiatorCard: null,
          targetCard: null,
          targetCardSelected: false,
          initiatorCardSelected: false,
          timestamp: Date.now()
        }
      })
      
      setSelectedCard(null)
      
    } catch (error) {
      console.error('交換開始エラー:', error)
    }
  }

  // 交換カードの選択
  const onExchangeCardSelected = async (card, cardIndex) => {
    try {
      if (!exchangeData) return

      if (exchangeData.targetPlayer === nickname) {
        await update(ref(database, `rooms/${roomId}/game/exchangeInProgress`), {
          targetCard: card,
          targetCardIndex: cardIndex,
          targetCardSelected: true
        })
      }
      else if (exchangeData.initiator === nickname) {
        await update(ref(database, `rooms/${roomId}/game/exchangeInProgress`), {
          initiatorCard: card,
          initiatorCardIndex: cardIndex,
          initiatorCardSelected: true
        })
      }

      setShowCardSelect(false)

      const gameRef = ref(database, `rooms/${roomId}/game`)
      const snapshot = await get(gameRef)
      
      if (snapshot.exists()) {
        const data = snapshot.val()
        const exchange = data.exchangeInProgress
        
        if (exchange && exchange.targetCardSelected && exchange.initiatorCardSelected) {
          await completeExchange(data, exchange)
        }
      }

    } catch (error) {
      console.error('カード選択エラー:', error)
    }
  }

  // より小さい数字のカード確認
  const confirmExchangeCardSelection = async (card, cardIndex) => {
    setShowConfirmModal(false)
    setConfirmModalData(null)
    await onExchangeCardSelected(card, cardIndex)
  }

  // 交換を完了
  const completeExchange = async (gameData, exchange) => {
    try {
      const initiatorHand = gameData.hands[exchange.initiator] || []
      const targetHand = gameData.hands[exchange.targetPlayer] || []

      const newInitiatorHand = [
        ...initiatorHand.filter((_, i) => i !== exchange.initiatorCardIndex),
        exchange.targetCard
      ]

      const newTargetHand = [
        ...targetHand.filter((_, i) => i !== exchange.targetCardIndex),
        exchange.initiatorCard
      ]

      const discardedCard = initiatorHand.find(card => card.cardId === 'exchange')
      const newDiscardPile = discardedCard 
        ? [...(gameData.discardPile || []), discardedCard]
        : gameData.discardPile || []

      const newHands = {
        ...gameData.hands,
        [exchange.initiator]: newInitiatorHand.filter(card => card.cardId !== 'exchange'),
        [exchange.targetPlayer]: newTargetHand
      }

      const newTurn = gameData.currentTurn + 1
      const totalPlayers = Object.keys(gameData.roles).length

      await update(ref(database, `rooms/${roomId}/game`), {
        hands: newHands,
        discardPile: newDiscardPile,
        exchangeInProgress: null,
        currentTurn: newTurn,
        phase: 'card_draw',
        lastAction: {
          type: 'exchange_complete',
          initiator: exchange.initiator,
          target: exchange.targetPlayer,
          timestamp: Date.now()
        }
      })

      await checkJudgmentTime(newTurn, totalPlayers)

    } catch (error) {
      console.error('交換完了エラー:', error)
    }
  }

  // 拳銃カード
  const handleHandgunCard = () => {
    setCardEffect('handgun')
    setShowPlayerSelect(true)
  }

  // 拳銃カードの効果
  const handleHandgunEffect = async (targetPlayer) => {
    try {
      if (!gameData) return
      
      const myRoleId = gameData.roles[nickname]?.role?.id || gameData.roles[nickname]?.roleId
      
      // メロの場合：殺害処理
      if (myRoleId === 'melo') {
        await handleMeloHandgun(targetPlayer)
        return
      }
      
      // 警察の場合：カード公開処理（従来の処理）
      const targetHand = gameData.hands[targetPlayer] || []
      
      if (targetHand.length === 0) {
        alert(`${targetPlayer}は手札を持っていません`)
        setSelectedCard(null)
        return
      }
      
      const smallestCard = targetHand.reduce((min, card) => 
        card.number < min.number ? card : min
      )
      
      setInfoModalContent(
        <div className="text-center">
          <p className="text-lg mb-4 font-bold">
            {nickname} が {targetPlayer} に拳銃を使用
          </p>
          <div className="bg-gray-800 rounded-lg p-4">
            <p className="text-sm text-gray-400 mb-3">{targetPlayer} が公開したカード</p>
            <div className="flex justify-between items-center mb-2">
              <span className="text-2xl font-bold">{smallestCard.name}</span>
              <span className="text-gray-400">#{smallestCard.number}</span>
            </div>
            <p className="text-sm text-gray-300">{smallestCard.description}</p>
          </div>
        </div>
      )
      setShowInfoModal(true)
      
      const discardedCard = myHand[selectedCard.index]
      const newHand = myHand.filter((_, i) => i !== selectedCard.index)
      const newDiscardPile = [...(gameData?.discardPile || []), discardedCard]
      
      const newTurn = gameData.currentTurn + 1
      const totalPlayers = Object.keys(gameData.roles).length
      
      await update(ref(database, `rooms/${roomId}/game`), {
        [`hands/${nickname}`]: newHand,
        discardPile: newDiscardPile,
        currentTurn: newTurn,
        phase: 'card_draw',
        lastAction: {
          type: 'handgun',
          player: nickname,
          target: targetPlayer,
          revealedCard: smallestCard,
          timestamp: Date.now()
        }
      })
      
      await checkJudgmentTime(newTurn, totalPlayers)
      
      setSelectedCard(null)
      
    } catch (error) {
      console.error('拳銃エラー:', error)
    }
  }

  // メロの拳銃：殺害処理
  const handleMeloHandgun = async (targetPlayer) => {
    try {
      if (!gameData) return
      
      const targetRole = gameData.roles[targetPlayer]
      const targetRoleId = targetRole?.role?.id || targetRole?.roleId
      const targetHand = gameData.hands[targetPlayer] || []
      const deadPlayers = gameData.deadPlayers || []
      
      // カードを捨て札に
      const discardedCard = myHand[selectedCard.index]
      const newHand = myHand.filter((_, i) => i !== selectedCard.index)
      const newDiscardPile = [...(gameData?.discardPile || []), discardedCard]
      
      // 対象の手札を捨て札に移動
      const allDiscardedCards = [...newDiscardPile, ...targetHand]
      const newDeadPlayers = [...deadPlayers, targetPlayer]
      // 死亡プレイヤーを観戦者に移動
      await update(ref(database, `rooms/${roomId}/spectators/${targetPlayer}`), {
        nickname: targetPlayer,
        isSpectator: true,
        wasDead: true,
        joinedAt: Date.now()
      })
      // 新しい手札構成
      const newHands = {
        ...gameData.hands,
        [nickname]: newHand,
        [targetPlayer]: []
      }
      
      const newTurn = gameData.currentTurn + 1
      const totalPlayers = Object.keys(gameData.roles).length
      
      // キラを殺害した場合：メロの単独勝利
      if (targetRoleId === 'kira') {
        await update(ref(database, `rooms/${roomId}/game`), {
          phase: 'game_over',
          winner: 'melo',
          winCondition: 'melo_killed_kira',
          killedPlayer: targetPlayer,
          timestamp: Date.now()
        })
        
        alert(`${targetPlayer}（キラ）を殺害しました！メロの単独勝利です！`)
        setSelectedCard(null)
        return
      }
      
      // 殺害前のLの人数をチェック
      const allRoles = Object.entries(gameData.roles)
      const lPlayers = allRoles.filter(([player, data]) => {
        const roleId = data.role?.id || data.roleId
        return roleId === 'l'
      }).map(([player]) => player)
      
      const survivingLsBeforeKill = lPlayers.filter(player => 
        !deadPlayers.includes(player) // 殺害前の状態
      )
      
      // Lを殺害した場合
      if (targetRoleId === 'l') {
        // 殺害前にLが1人のみだった場合：全L排除でキラ陣営勝利
        if (survivingLsBeforeKill.length === 1) {
          await update(ref(database, `rooms/${roomId}/game`), {
            phase: 'game_over',
            winner: 'kira_team',
            winCondition: 'all_l_eliminated',
            timestamp: Date.now()
          })
          
          alert(`全てのLが排除されました！キラ陣営の勝利です！`)
          setSelectedCard(null)
          return
        }
        
        // 殺害前にLが2人以上いた場合（1人目のLを殺害）：メロの正体公開
        await update(ref(database, `rooms/${roomId}/game`), {
          hands: newHands,
          discardPile: allDiscardedCards,
          deadPlayers: newDeadPlayers,
          meloRevealed: true,
          meloPlayer: nickname,
          currentTurn: newTurn,
          phase: 'card_draw',
          lastAction: {
            type: 'melo_handgun_revealed',
            player: nickname,
            target: targetPlayer,
            targetRole: targetRole.role.name,
            timestamp: Date.now()
          }
        })
        
        await checkJudgmentTime(newTurn, totalPlayers)
        
        alert(`${targetPlayer}（${targetRole.role.name}）を殺害しました！\nメロの正体が全員に公開されました！`)
        setSelectedCard(null)
        return
      }
      
      // 警察、信者、ワタリを殺害：メロの正体公開
      if (['police', 'believer', 'watari'].includes(targetRoleId)) {
        await update(ref(database, `rooms/${roomId}/game`), {
          hands: newHands,
          discardPile: allDiscardedCards,
          deadPlayers: newDeadPlayers,
          meloRevealed: true,
          meloPlayer: nickname,
          currentTurn: newTurn,
          phase: 'card_draw',
          lastAction: {
            type: 'melo_handgun_revealed',
            player: nickname,
            target: targetPlayer,
            targetRole: targetRole.role.name,
            timestamp: Date.now()
          }
        })
        
        await checkJudgmentTime(newTurn, totalPlayers)
        
        alert(`${targetPlayer}（${targetRole.role.name}）を殺害しました！\nメロの正体が全員に公開されました！`)
        setSelectedCard(null)
        return
      }
      
      // その他の場合：通常の殺害（正体公開なし）
      await update(ref(database, `rooms/${roomId}/game`), {
        hands: newHands,
        discardPile: allDiscardedCards,
        deadPlayers: newDeadPlayers,
        currentTurn: newTurn,
        phase: 'card_draw',
        lastAction: {
          type: 'melo_handgun',
          player: nickname,
          target: targetPlayer,
          timestamp: Date.now()
        }
      })
      
      await checkJudgmentTime(newTurn, totalPlayers)
      
      alert(`${targetPlayer}を殺害しました`)
      setSelectedCard(null)
      
    } catch (error) {
      console.error('メロ拳銃エラー:', error)
    }
  }

  // 監視カードの効果
  const handleSurveillanceEffect = async (targetPlayer) => {
    try {
      if (!gameData) return
      
      const targetHand = gameData.hands[targetPlayer] || []
      
      if (targetHand.length === 0) {
        alert(`${targetPlayer}は手札を持っていません`)
        setSelectedCard(null)
        return
      }
      
      setInfoModalContent(
        <div className="text-center">
          <p className="text-lg mb-4 font-bold">{targetPlayer} の手札</p>
          <div className="space-y-2">
            {targetHand.map((card, index) => (
              <div key={index} className="bg-gray-800 rounded-lg p-3">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-lg font-bold">{card.name}</span>
                  <span className="text-gray-400 text-sm">#{card.number}</span>
                </div>
                <p className="text-xs text-gray-300">{card.description}</p>
              </div>
            ))}
          </div>
        </div>
      )
      setShowInfoModal(true)
      
      const discardedCard = myHand[selectedCard.index]
      const newHand = myHand.filter((_, i) => i !== selectedCard.index)
      const newDiscardPile = [...(gameData?.discardPile || []), discardedCard]
      
      const newTurn = gameData.currentTurn + 1
      const totalPlayers = Object.keys(gameData.roles).length
      
      await update(ref(database, `rooms/${roomId}/game`), {
        [`hands/${nickname}`]: newHand,
        discardPile: newDiscardPile,
        currentTurn: newTurn,
        phase: 'card_draw',
        lastAction: {
          type: 'surveillance',
          player: nickname,
          target: targetPlayer,
          timestamp: Date.now()
        }
      })
      
      await checkJudgmentTime(newTurn, totalPlayers)
      
      setSelectedCard(null)
      
    } catch (error) {
      console.error('監視エラー:', error)
    }
  }

  // 目撃カードの効果
  const handleWitnessEffect = async (targetPlayer) => {
    try {
      if (!gameData) return
      
      const targetRole = gameData.roles[targetPlayer]
      
      setInfoModalContent(
        <div className="text-center">
          <p className="text-lg mb-4 font-bold">{targetPlayer} の正体</p>
          <div className={`bg-gradient-to-br ${
            targetRole.role.color === 'red' 
              ? 'from-red-600 to-red-800' 
              : 'from-blue-600 to-blue-800'
          } rounded-lg p-6`}>
            <div className="text-4xl font-bold mb-2">{targetRole.role.name}</div>
            <div className="text-lg">
              {targetRole.role.team === 'kira' ? 'キラチーム' : 'Lチーム'}
            </div>
          </div>
        </div>
      )
      setShowInfoModal(true)
      
      const discardedCard = myHand[selectedCard.index]
      const newHand = myHand.filter((_, i) => i !== selectedCard.index)
      const newDiscardPile = [...(gameData?.discardPile || []), discardedCard]
      
      const newTurn = gameData.currentTurn + 1
      const totalPlayers = Object.keys(gameData.roles).length
      
      await update(ref(database, `rooms/${roomId}/game`), {
        [`hands/${nickname}`]: newHand,
        discardPile: newDiscardPile,
        currentTurn: newTurn,
        phase: 'card_draw',
        lastAction: {
          type: 'witness',
          player: nickname,
          target: targetPlayer,
          timestamp: Date.now()
        }
      })
      
      await checkJudgmentTime(newTurn, totalPlayers)
      
      setSelectedCard(null)
      
    } catch (error) {
      console.error('目撃エラー:', error)
    }
  }

  // 逮捕カード
  const handleArrestCard = () => {
    setCardEffect('arrest')
    setShowPlayerSelect(true)
  }

  // 逮捕カードの効果
  const handleArrestEffect = async (targetPlayer) => {
    try {
      if (!gameData) return
      
      const targetRole = gameData.roles[targetPlayer]
      const targetHand = gameData.hands[targetPlayer] || []
      
      const arrestCard = myHand[selectedCard.index]
      
      if (targetRole.role.id === 'kira') {
        const hasAlibi = targetHand.some(card => card.cardId === 'alibi')
        
        if (hasAlibi) {
          const validAlibi = targetHand.find(card => card.cardId === 'alibi' && !card.used)
          
          if (validAlibi) {
            alert(`${targetPlayer}はアリバイカードで否認しました！ゲーム続行です。`)
            
            const newHand = myHand.filter((_, i) => i !== selectedCard.index)
            
            const alibiIndex = targetHand.findIndex(card => card.cardId === 'alibi' && !card.used)
            const targetNewHand = targetHand.map((card, index) => {
              if (index === alibiIndex) {
                return { ...card, used: true }
              }
              return card
            })
            
            const newEliminatedCards = [...(gameData.eliminatedCards || []), arrestCard]
            
            const arrestCardsEliminated = newEliminatedCards.filter(card => card.cardId === 'arrest').length
            const totalPlayers = Object.keys(gameData.roles).length
            const totalArrestCards = totalPlayers === 4 ? 1 : 2
            
            if (arrestCardsEliminated >= totalArrestCards) {
              await update(ref(database, `rooms/${roomId}/game`), {
                [`hands/${nickname}`]: newHand,
                [`hands/${targetPlayer}`]: targetNewHand,
                eliminatedCards: newEliminatedCards,
                phase: 'game_over',
                winner: 'kira_team',
                winCondition: 'arrest_cards_eliminated',
                winReason: '逮捕カードが全て除外されました',
                timestamp: Date.now()
              })
              
              alert('逮捕カードが全て除外されました！キラチームの勝利です！')
            } else {
              const newTurn = gameData.currentTurn + 1
              
              await update(ref(database, `rooms/${roomId}/game`), {
                [`hands/${nickname}`]: newHand,
                [`hands/${targetPlayer}`]: targetNewHand,
                eliminatedCards: newEliminatedCards,
                currentTurn: newTurn,
                phase: 'card_draw',
                lastAction: {
                  type: 'arrest_denied',
                  player: nickname,
                  target: targetPlayer,
                  timestamp: Date.now()
                }
              })
              
              await checkJudgmentTime(newTurn, totalPlayers)
            }
          } else {
            await update(ref(database, `rooms/${roomId}/game`), {
              phase: 'game_over',
              winner: 'l_team',
              winCondition: 'arrest',
              arrestedPlayer: targetPlayer,
              timestamp: Date.now()
            })
            
            alert(`逮捕成功！${targetPlayer}のアリバイは使用済みでした！Lチームの勝利です！`)
          }
        } else {
          await update(ref(database, `rooms/${roomId}/game`), {
            phase: 'game_over',
            winner: 'l_team',
            winCondition: 'arrest',
            arrestedPlayer: targetPlayer,
            timestamp: Date.now()
          })
          
          alert(`逮捕成功！${targetPlayer}はキラでした！Lチームの勝利です！`)
        }
      } else {
        alert(`${targetPlayer}はキラではありませんでした。ゲーム続行です。`)
        
        const newHand = myHand.filter((_, i) => i !== selectedCard.index)
        
        const newEliminatedCards = [...(gameData.eliminatedCards || []), arrestCard]
        
        const arrestCardsEliminated = newEliminatedCards.filter(card => card.cardId === 'arrest').length
        const totalPlayers = Object.keys(gameData.roles).length
        const totalArrestCards = totalPlayers === 4 ? 1 : 2
        
        if (arrestCardsEliminated >= totalArrestCards) {
          await update(ref(database, `rooms/${roomId}/game`), {
            [`hands/${nickname}`]: newHand,
            eliminatedCards: newEliminatedCards,
            phase: 'game_over',
            winner: 'kira_team',
            winCondition: 'arrest_cards_eliminated',
            winReason: '逮捕カードが全て除外されました',
            timestamp: Date.now()
          })
          
          alert('逮捕カードが全て除外されました！キラチームの勝利です！')
        } else {
          const newTurn = gameData.currentTurn + 1
          
          await update(ref(database, `rooms/${roomId}/game`), {
            [`hands/${nickname}`]: newHand,
            eliminatedCards: newEliminatedCards,
            currentTurn: newTurn,
            phase: 'card_draw',
            lastAction: {
              type: 'arrest_failed',
              player: nickname,
              target: targetPlayer,
              timestamp: Date.now()
            }
          })
          
          await checkJudgmentTime(newTurn, totalPlayers)
        }
      }
      
      setSelectedCard(null)
      
    } catch (error) {
      console.error('逮捕エラー:', error)
    }
  }

  // 死神カード
  const handleShinigamiCard = async (cardIndex) => {
    try {
      if (!gameData) return
      
      const deathNoteHolder = Object.entries(gameData.hands).find(([player, hand]) => 
        hand.some(card => card.cardId === 'death_note')
      )?.[0] || '不明'
      
      const kiraPlayer = Object.entries(gameData.roles).find(([player, data]) => 
        data.role.id === 'kira'
      )?.[0] || null
      
      const misaPlayer = Object.entries(gameData.roles).find(([player, data]) => 
        data.role.id === 'believer'
      )?.[0] || null
      
      const discardedCard = myHand[cardIndex]
      const newHand = myHand.filter((_, i) => i !== cardIndex)
      const newDiscardPile = [...(gameData?.discardPile || []), discardedCard]
      
      await update(ref(database, `rooms/${roomId}/game`), {
        [`hands/${nickname}`]: newHand,
        discardPile: newDiscardPile,
        shinigamiInProgress: {
          initiator: nickname,
          kiraPlayer: kiraPlayer,
          misaPlayer: misaPlayer,
          deathNoteHolder: deathNoteHolder,
          confirmed: {},
          timestamp: Date.now()
        }
      })
      
      setSelectedCard(null)
      
    } catch (error) {
      console.error('死神エラー:', error)
    }
  }

  // 死神カード：キラ/ミサの確認
  const confirmShinigami = async () => {
    try {
      await update(ref(database, `rooms/${roomId}/game/shinigamiInProgress/confirmed/${nickname}`), {
        confirmed: true,
        timestamp: Date.now()
      })
      
      const gameRef = ref(database, `rooms/${roomId}/game`)
      const snapshot = await get(gameRef)
      
      if (snapshot.exists()) {
        const data = snapshot.val()
        const shinigami = data.shinigamiInProgress
        
        if (!shinigami) return
        
        const kiraTeamPlayers = Object.entries(data.roles)
          .filter(([player, roleData]) => 
            roleData.role.id === 'kira' || 
            roleData.role.id === 'believer'
          )
          .map(([player]) => player)
        
        const allKiraTeamConfirmed = kiraTeamPlayers.every(player => 
          shinigami.confirmed && shinigami.confirmed[player]
        )
        
        if (allKiraTeamConfirmed) {
          const newTurn = data.currentTurn + 1
          const totalPlayers = Object.keys(data.roles).length
          
          await update(ref(database, `rooms/${roomId}/game`), {
            shinigamiInProgress: null,
            currentTurn: newTurn,
            phase: 'card_draw',
            lastAction: {
              type: 'shinigami',
              player: shinigami.initiator,
              timestamp: Date.now()
            }
          })
          
          await checkJudgmentTime(newTurn, totalPlayers)
        }
      }
      
      setShowShinigamiInfo(false)
      
    } catch (error) {
      console.error('死神確認エラー:', error)
    }
  }

  // 取り調べカード：方向選択
  const handleInterrogationDirection = async (direction) => {
    try {
      if (!gameData) return
      
      setShowDirectionSelect(false)
      
      const discardedCard = myHand[selectedCard.index]
      const newHand = myHand.filter((_, i) => i !== selectedCard.index)
      const newDiscardPile = [...(gameData?.discardPile || []), discardedCard]
      
      // 取り調べ発動状態をFirebaseに保存
      await update(ref(database, `rooms/${roomId}/game`), {
        [`hands/${nickname}`]: newHand,
        discardPile: newDiscardPile,
        interrogationInProgress: {
          initiator: nickname,
          direction: direction,
          selectedCards: {},
          timestamp: Date.now()
        }
      })
      
      setSelectedCard(null)
      
    } catch (error) {
      console.error('取り調べ開始エラー:', error)
    }
  }
// 取り調べカード：カード選択
  const handleInterrogationCardSelect = async (card, cardIndex) => {
    try {
      if (!gameData || !interrogationData) return
      
      await update(ref(database, `rooms/${roomId}/game/interrogationInProgress/selectedCards/${nickname}`), {
        card: card,
        cardIndex: cardIndex,
        timestamp: Date.now()
      })
      
      setShowInterrogationCardSelect(false)
      setShowInterrogationWaiting(true)
      
      const gameRef = ref(database, `rooms/${roomId}/game`)
      const snapshot = await get(gameRef)
      
      if (snapshot.exists()) {
        const data = snapshot.val()
        const interrogation = data.interrogationInProgress
        
        if (!interrogation) return
        
        const deadPlayers = data.deadPlayers || []
        const alivePlayers = data.turnOrder.filter(p => !deadPlayers.includes(p))
        const selectedCount = Object.keys(interrogation.selectedCards || {}).length
        
        // 生存者全員が選択した場合、カード交換を実行
        if (selectedCount >= alivePlayers.length) {
          await executeInterrogationExchange(data, interrogation)
        }
      }
      
    } catch (error) {
      console.error('取り調べカード選択エラー:', error)
    }
  }

  // 取り調べカード：カード交換を実行
  const executeInterrogationExchange = async (gameData, interrogation) => {
    try {
      const turnOrder = gameData.turnOrder
      const direction = interrogation.direction
      const selectedCards = interrogation.selectedCards
      const deadPlayers = gameData.deadPlayers || []
      
      // 新しい手札を構築
      const newHands = {}
      
      // 生存プレイヤーのみを対象にする
      const alivePlayers = turnOrder.filter(player => !deadPlayers.includes(player))
      
      alivePlayers.forEach((player, index) => {
        const currentHand = gameData.hands[player] || []
        const selectedCardData = selectedCards[player]
        
        if (!selectedCardData) return
        
        const filteredHand = currentHand.filter((_, i) => i !== selectedCardData.cardIndex)
        
        // 受け取るプレイヤーを計算（生存プレイヤーのみ）
        let receiveFromIndex
        if (direction === 'left') {
          receiveFromIndex = (index + 1) % alivePlayers.length
        } else {
          receiveFromIndex = (index - 1 + alivePlayers.length) % alivePlayers.length
        }
        
        const receiveFromPlayer = alivePlayers[receiveFromIndex]
        const receivedCard = selectedCards[receiveFromPlayer]?.card
        
        newHands[player] = receivedCard ? [...filteredHand, receivedCard] : filteredHand
      })
      
      const newTurn = gameData.currentTurn + 1
      const totalPlayers = Object.keys(gameData.roles).length
      
      await update(ref(database, `rooms/${roomId}/game`), {
        hands: newHands,
        interrogationInProgress: null,
        currentTurn: newTurn,
        phase: 'card_draw',
        lastAction: {
          type: 'interrogation',
          player: interrogation.initiator,
          direction: direction,
          timestamp: Date.now()
        }
      })
      
      await checkJudgmentTime(newTurn, totalPlayers)
      
    } catch (error) {
      console.error('取り調べ交換エラー:', error)
    }
  }
  // ターン進行後、死亡プレイヤーをスキップ
  const advanceTurnWithDeadCheck = async (newTurn, totalPlayers) => {
    try {
      await update(ref(database, `rooms/${roomId}/game`), {
        currentTurn: newTurn,
        phase: 'card_draw'
      })
      
      await checkJudgmentTime(newTurn, totalPlayers)
      
      // ターン進行後、現在のプレイヤーが死亡していたらスキップ
      const gameRef = ref(database, `rooms/${roomId}/game`)
      const snapshot = await get(gameRef)
      
      if (snapshot.exists()) {
        const data = snapshot.val()
        const currentPlayer = data.turnOrder?.[data.currentTurn % data.turnOrder.length]
        const deadPlayers = data.deadPlayers || []
        
        if (currentPlayer && deadPlayers.includes(currentPlayer)) {
          await skipDeadPlayerTurn(data)
        }
      }
      
    } catch (error) {
      console.error('ターン進行エラー:', error)
    }
  }
  
  // 裁きの時間の発動チェック
  const checkJudgmentTime = async (currentTurn, totalPlayers) => {
    try {
      console.log('🔍 裁きの時間チェック:', { currentTurn, totalPlayers })
      
      let shouldTrigger = false
      
      if (totalPlayers === 4) {
        // 4人：8ターン目（2巡目完了後）、その後4ターンごと
        if (currentTurn === 8) {
          shouldTrigger = true
        } else if (currentTurn > 8 && (currentTurn - 8) % 4 === 0) {
          shouldTrigger = true
        }
      } else {
        // 5人以上：totalPlayers ターン目（1巡目完了後）、その後 totalPlayers ターンごと
        if (currentTurn > 0 && currentTurn % totalPlayers === 0) {
          shouldTrigger = true
        }
      }
      
      if (shouldTrigger) {
        await startJudgmentTime()
      }
      
    } catch (error) {
      console.error('裁きの時間チェックエラー:', error)
    }
  }

// 裁きの時間を開始
  const startJudgmentTime = async () => {
    try {
      const gameRef = ref(database, `rooms/${roomId}/game`)
      const snapshot = await get(gameRef)
      
      if (!snapshot.exists()) return
      
      const data = snapshot.val()
      
      // デスノート保有者を探す
      const deathNoteHolder = Object.entries(data.hands).find(([player, hand]) => 
        hand.some(card => card.cardId === 'death_note')
      )?.[0] || '不明'
      
      // キラとミサを探す
      const kiraPlayer = Object.entries(data.roles).find(([player, roleData]) => 
        roleData.role.id === 'kira'
      )?.[0] || null
      
      const misaPlayer = Object.entries(data.roles).find(([player, roleData]) => 
        roleData.role.id === 'believer'
      )?.[0] || null
      
      await update(ref(database, `rooms/${roomId}/game`), {
        phase: 'judgment',
        judgmentInProgress: {
          deathNoteHolder: deathNoteHolder,
          kiraPlayer: kiraPlayer,
          misaPlayer: misaPlayer,
          confirmed: {},
          timestamp: Date.now()
        }
      })
      
    } catch (error) {
      console.error('裁きの時間開始エラー:', error)
    }
  }

  // プレイヤー選択処理
  const handlePlayerSelected = (targetPlayer) => {
    setShowPlayerSelect(false)
    
    switch (cardEffect) {
      case 'exchange':
        handleExchangeStart(targetPlayer)
        break
      case 'handgun':
        handleHandgunEffect(targetPlayer)
        break
      case 'surveillance':
        handleSurveillanceEffect(targetPlayer)
        break
      case 'witness':
        handleWitnessEffect(targetPlayer)
        break
      case 'arrest':
        handleArrestEffect(targetPlayer)
        break
      default:
        setSelectedCard(null)
    }
    
    setCardEffect('')
  }

  // 死亡プレイヤーのターンをスキップ（ロック付き）
  const skipDeadPlayerTurn = async (data) => {
    try {
      // スキップ処理中かチェック
      if (data.skipInProgress) {
        console.log('⏳ スキップ処理実行中のため待機')
        return
      }
      
      // ロックを設定
      await update(ref(database, `rooms/${roomId}/game`), {
        skipInProgress: true
      })
      
      let newTurn = data.currentTurn + 1
      const totalPlayers = data.turnOrder.length
      const deadPlayers = data.deadPlayers || []
      
      // 次のプレイヤーも死亡している場合は、さらにスキップ
      let maxSkips = totalPlayers // 無限ループ防止
      while (maxSkips > 0) {
        const nextPlayer = data.turnOrder[newTurn % totalPlayers]
        if (!deadPlayers.includes(nextPlayer)) {
          break // 生存プレイヤーが見つかった
        }
        newTurn++
        maxSkips--
      }
      
      // 全員が死亡している場合（通常は起こらない）
      if (maxSkips === 0) {
        console.error('全プレイヤーが死亡しています')
        await update(ref(database, `rooms/${roomId}/game`), {
          skipInProgress: false
        })
        return
      }
      
      console.log('✅ ターンをスキップ:', data.currentTurn, '→', newTurn)
      
      await update(ref(database, `rooms/${roomId}/game`), {
        currentTurn: newTurn,
        phase: 'card_draw',
        skipInProgress: false
      })
      
      // 裁きの時間チェック
      await checkJudgmentTime(newTurn, totalPlayers)
      
    } catch (error) {
      console.error('ターンスキップエラー:', error)
      // エラー時はロックを解除
      await update(ref(database, `rooms/${roomId}/game`), {
        skipInProgress: false
      })
    }
  }

  const drawCards = async () => {
    try {
      // 死亡している場合は操作不可
      if (isDead) {
        alert('あなたは死亡しているため、カードを引けません')
        return
      }
      
      const gameRef = ref(database, `rooms/${roomId}/game`)
      const snapshot = await get(gameRef)
      
      if (snapshot.exists()) {
        let data = snapshot.val()
        let deck = data.deck || []
        let discardPile = data.discardPile || []
        const currentHand = data.hands[nickname] || []
        
        // 手札が4枚以上の場合は引けない
        if (currentHand.length >= 4) {
          alert('手札は既に4枚です')
          return
        }
        
        // 山札がない場合、捨て札をシャッフルして山札に補充
        if (deck.length === 0) {
          if (discardPile.length === 0) {
            alert('山札も捨て札もありません')
            return
          }
          
          // Step 1: まず捨て札をシャッフルして山札に補充
          const shuffledDiscardPile = [...discardPile].sort(() => Math.random() - 0.5)
          
          await update(ref(database, `rooms/${roomId}/game`), {
            deck: shuffledDiscardPile,
            discardPile: []
          })
          
          // Step 2: 更新後のデータを再取得
          const newSnapshot = await get(gameRef)
          if (newSnapshot.exists()) {
            data = newSnapshot.val()
            deck = data.deck || []
          }
        }
        
        // 山札が空でないことを確認
        if (deck.length === 0) {
          alert('カードを引けません')
          return
        }
        
        // 1枚だけ引く
        const drawnCard = deck[0]
        const newDeck = deck.slice(1)
        const newHand = [...currentHand, drawnCard]
        
        await update(ref(database, `rooms/${roomId}/game`), {
          deck: newDeck,
          [`hands/${nickname}`]: newHand,
          phase: 'card_use'
        })
        
      }
    } catch (error) {
      console.error('カード補充エラー:', error)
    }
  }

    // 自分が死亡しているかチェック
  const isDead = gameData && (gameData.deadPlayers || []).includes(nickname)

  if (!gameData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">ゲームデータを読み込み中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4">
      {/* 死亡プレイヤーの場合、観戦モード表示 */}
      {isDead && (
        <div className="bg-red-900 border-2 border-red-600 rounded-lg p-4 mb-4 text-center">
          <div className="text-4xl mb-2">💀</div>
          <p className="text-xl font-bold mb-2">あなたは死亡しました</p>
          <p className="text-gray-300">観戦モードでゲームを見守ってください</p>
        </div>
      )}
      
      <div className="max-w-6xl mx-auto">
        {/* ヘッダー */}
        <div className="bg-gray-800 rounded-lg p-4 mb-4">
          <div className="flex justify-between items-center mb-2">
            <div>
              <h2 className="text-2xl font-bold">捜査の時間</h2>
              <p className="text-gray-400">第{turnCount}ターン</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-400">現在の手番</p>
              <p className="text-2xl font-bold text-red-500">{currentPlayer}</p>
              {isMyTurn && (
                <span className="inline-block mt-1 bg-red-600 text-white text-xs px-3 py-1 rounded-full">
                  あなたのターン
                </span>
              )}
            </div>
          </div>

          {/* ルールボタン */}
          <div className="mb-4">
            <button
              onClick={() => setShowRules(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold py-2 px-4 rounded transition"
            >
              📖 ルール確認
            </button>
          </div>

          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-2xl font-bold">捜査の時間</h2>
              <p className="text-gray-400">第{turnCount}ターン</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-400">現在の手番</p>
              <p className="text-2xl font-bold text-red-500">{currentPlayer}</p>
              {isMyTurn && (
                <span className="inline-block mt-1 bg-red-600 text-white text-xs px-3 py-1 rounded-full">
                  あなたのターン
                </span>
              )}
            </div>
          </div>

          {/* 自分の正体 */}
          <div className={`rounded-lg p-4 ${
            gameData.roles[nickname]?.role.team === 'kira' 
              ? 'bg-gradient-to-r from-red-900 to-red-800' 
              : 'bg-gradient-to-r from-blue-900 to-blue-800'
          }`}>
            <p className="text-sm text-gray-300 mb-1">あなたの正体</p>
            <p className="text-xl font-bold">{gameData.roles[nickname]?.role.name}</p>
          </div>
        </div>
{/* メロの正体公開 */}
        {gameData.meloRevealed && gameData.meloPlayer && (
          <div className="bg-purple-900 border-2 border-purple-500 rounded-lg p-4 mb-4 text-center animate-pulse">
            <div className="text-4xl mb-2">🔫</div>
            <p className="text-xl font-bold mb-2">メロの正体が判明！</p>
            <p className="text-2xl font-bold text-purple-300">{gameData.meloPlayer}</p>
            <p className="text-sm text-gray-300 mt-2">メロは独立陣営です</p>
          </div>
        )}
        {/* 座席情報 */}
        <div className="bg-gray-800 rounded-lg p-4 mb-4">
          <p className="text-sm text-gray-400 mb-2">座順</p>
          <div className="flex gap-2 overflow-x-auto">
            {gameData.turnOrder?.map((player, index) => {
              const isDead = (gameData.deadPlayers || []).includes(player)
              const isMelo = gameData.meloRevealed && gameData.meloPlayer === player
              const playerRole = gameData.roles[player]
              const roleName = playerRole?.role?.name
              
              return (
                <div
                  key={player}
                  className={`flex-shrink-0 px-3 py-2 rounded relative ${
                    isDead
                      ? 'bg-gray-900 text-gray-600'
                      : player === currentPlayer
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-700 text-gray-300'
                  } ${isMelo ? 'border-2 border-purple-500' : ''}`}
                >
                  <div>
                    <div className={isDead ? 'line-through' : ''}>
                      <span className="text-xs">{index + 1}.</span> {player}
                      {isMelo && <span className="ml-1 text-purple-400">🔫</span>}
                      {isDead && <span className="ml-1">💀</span>}
                    </div>
                    {isDead && roleName && (
                      <div className="text-xs text-gray-500 mt-1">
                        ({roleName})
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* カード枚数 */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="bg-gray-800 rounded-lg p-4 text-center">
            <p className="text-gray-400 text-sm">山札</p>
            <p className="text-3xl font-bold">{gameData.deck?.length || 0}</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 text-center">
            <p className="text-gray-400 text-sm">捨て札</p>
            <p className="text-3xl font-bold">{gameData.discardPile?.length || 0}</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 text-center">
            <p className="text-gray-400 text-sm">あなたの手札</p>
            <p className="text-3xl font-bold">{myHand.length}</p>
          </div>
        </div>

        {/* カード補充 */}
        {gameData.phase === 'card_draw' && isMyTurn && !isDead && (
          <div className="bg-red-900 rounded-lg p-6 mb-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xl font-bold mb-2">① カード補充</p>
                <p>山札からカードを引いてください</p>
              </div>
              <button
                onClick={drawCards}
                className="bg-red-600 hover:bg-red-700 px-6 py-3 rounded-lg font-bold"
              >
                カードを引く
              </button>
            </div>
          </div>
        )}

        {/* 自分の手札 */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-xl font-bold mb-4">あなたの手札</h3>
          {myHand.length === 0 ? (
            <p className="text-gray-400 text-center py-8">手札がありません</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {myHand.map((card, index) => (
              <div
                key={`hand-${card.id || card.cardId}-${index}`}
                  onClick={() => {
                    if (isMyTurn && gameData.phase === 'card_use') {
                      handleCardClick(card, index)
                    }
                  }}
                  className={`bg-gray-700 rounded-lg p-4 border-2 transition ${
                    card.used ? 'opacity-50 border-gray-800' : ''
                  } ${
                    isMyTurn && gameData.phase === 'card_use' && !card.used
                      ? 'border-blue-500 hover:bg-gray-600 hover:scale-105 cursor-pointer'
                      : 'border-gray-600'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xl font-bold">{card.name}</span>
                    <span className="text-gray-400 text-sm">#{card.number}</span>
                  </div>
                  <p className="text-xs text-gray-300 line-clamp-3">
                    {card.description}
                  </p>
                  {card.used && (
                    <p className="text-xs text-red-400 mt-2">【効果使用済み】</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

        {/* カードアクションモーダル */}
        {showCardAction && selectedCard && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg max-w-md w-full p-6">
              <h3 className="text-2xl font-bold mb-4">{selectedCard.card.name}</h3>
              <p className="text-gray-300 mb-6">{selectedCard.card.description}</p>
              
              <div className="space-y-3">
                <button
                  onClick={useSelectedCard}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition"
                >
                  使用する
                </button>
                
                {selectedCard.card.canDiscard !== false && (
                  <button
                    onClick={discardSelectedCard}
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg transition"
                  >
                    捨て札にする
                  </button>
                )}
                
                <button
                  onClick={() => {
                    setShowCardAction(false)
                    setSelectedCard(null)
                  }}
                  className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 rounded-lg transition"
                >
                  キャンセル
                </button>
              </div>
            </div>
          </div>
        )}

        {/* プレイヤー選択モーダル */}
        {showPlayerSelect && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg max-w-md w-full p-6">
              <h3 className="text-2xl font-bold mb-4">対象プレイヤーを選択</h3>
              
              <div className="space-y-2">
                {gameData.turnOrder
                  ?.filter(player => 
                    player !== nickname && 
                    !(gameData.deadPlayers || []).includes(player)
                  )
                  .map(player => (
                    <button
                      key={player}
                      onClick={() => handlePlayerSelected(player)}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition"
                    >
                      {player}
                    </button>
                  ))}
              </div>
              
              <button
                onClick={() => {
                  setShowPlayerSelect(false)
                  setCardEffect('')
                  setSelectedCard(null)
                }}
                className="w-full mt-4 bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 rounded-lg transition"
              >
                キャンセル
              </button>
            </div>
          </div>
        )}

        {/* 情報表示モーダル */}
        {showInfoModal && (
          <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg max-w-2xl w-full p-6">
              {infoModalContent}
              
              <button
                onClick={() => {
                  setShowInfoModal(false)
                  setInfoModalContent(null)
                }}
                className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition"
              >
                閉じる
              </button>
            </div>
          </div>
        )}

        {/* 交換カード選択モーダル */}
        {showCardSelect && exchangeData && (
          <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto">
              <h3 className="text-2xl font-bold mb-4 text-center">
                {exchangeData.targetPlayer === nickname 
                  ? '渡すカードを選択' 
                  : '受け取るカードを選択'}
              </h3>
              
              <div className="bg-yellow-900 bg-opacity-50 border border-yellow-600 rounded-lg p-4 mb-6">
                <p className="text-sm text-yellow-200 text-center">
                  {exchangeData.targetPlayer === nickname 
                    ? `⚠️ 番号が小さいカード1枚を選んでください` 
                    : `⚠️ 任意のカード1枚を選んでください`}
                </p>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {myHand
                  .map((card, index) => ({ card, index, originalIndex: index }))
                  .sort((a, b) => a.card.number - b.card.number)
                  .map(({ card, originalIndex }) => (
                    <div
                      key={`exchange-${card.id || card.cardId}-${originalIndex}`}
                      onClick={() => {
                        if (exchangeData.targetPlayer === nickname) {
                          setConfirmModalData({ card, originalIndex })
                          setShowConfirmModal(true)
                        } else {
                          onExchangeCardSelected(card, originalIndex)
                        }
                      }}
                      className="bg-gray-700 rounded-lg p-4 border-2 border-blue-500 hover:bg-gray-600 hover:scale-105 cursor-pointer transition"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xl font-bold">{card.name}</span>
                        <span className="text-gray-400 text-sm">#{card.number}</span>
                      </div>
                      <p className="text-xs text-gray-300 line-clamp-3">
                        {card.description}
                      </p>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* 確認モーダル */}
        {showConfirmModal && confirmModalData && (
          <div className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-[60] p-4">
            <div className="bg-gray-800 rounded-lg max-w-md w-full p-6">
              <h3 className="text-xl font-bold mb-4 text-center">このカードを渡しますか？</h3>
              
              <div className="bg-gray-700 rounded-lg p-4 mb-6">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-2xl font-bold">{confirmModalData.card.name}</span>
                  <span className="text-gray-400">#{confirmModalData.card.number}</span>
                </div>
                <p className="text-sm text-gray-300">{confirmModalData.card.description}</p>
              </div>
              
              <div className="space-y-3">
                <button
                  onClick={() => confirmExchangeCardSelection(confirmModalData.card, confirmModalData.originalIndex)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition"
                >
                  はい、このカードを渡す
                </button>
                
                <button
                  onClick={() => {
                    setShowConfirmModal(false)
                    setConfirmModalData(null)
                  }}
                  className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 rounded-lg transition"
                >
                  別のカードを選ぶ
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 死神カード：情報モーダル */}
        {showShinigamiInfo && shinigamiData && (
          <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-red-600 to-red-800 rounded-lg max-w-md w-full p-6">
              <h3 className="text-3xl font-bold mb-6 text-center">死神の情報</h3>
              
              <div className="bg-black bg-opacity-30 rounded-lg p-6 mb-6 space-y-4">
                <div>
                  <p className="text-sm text-gray-300 mb-1">キラ</p>
                  <p className="text-2xl font-bold">{shinigamiData.kiraPlayer || '不明'}</p>
                </div>
                
                {shinigamiData.misaPlayer && (
                  <div>
                    <p className="text-sm text-gray-300 mb-1">ミサ（信者）</p>
                    <p className="text-2xl font-bold">{shinigamiData.misaPlayer}</p>
                  </div>
                )}
                
                <div>
                  <p className="text-sm text-gray-300 mb-1">デスノート所持者</p>
                  <p className="text-2xl font-bold">{shinigamiData.deathNoteHolder || '不明'}</p>
                </div>
              </div>
              
              <button
                onClick={confirmShinigami}
                className="w-full bg-white text-red-600 hover:bg-gray-100 font-bold py-3 rounded-lg transition"
              >
                確認しました
              </button>
            </div>
          </div>
        )}

        {/* 死神カード：待機モーダル */}
        {showShinigamiWaiting && (
          <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg max-w-md w-full p-6 text-center">
              <div className="text-6xl mb-4">⏳</div>
              <h3 className="text-2xl font-bold mb-4">死神カード発動中</h3>
              <p className="text-gray-400">
                {gameData?.roles[nickname]?.role.team === 'kira'
                  ? '他のキラ陣営の確認を待っています...'
                  : 'キラ陣営が情報を確認しています...'}
              </p>
            </div>
          </div>
        )}

        {/* 取り調べカード：方向選択モーダル */}
        {showDirectionSelect && (
          <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg max-w-md w-full p-6">
              <h3 className="text-2xl font-bold mb-4 text-center">取り調べカードの方向を選択</h3>
              
              <p className="text-gray-300 mb-6 text-center">
                全員がカードを渡す方向を選んでください
              </p>
              
              <div className="space-y-3">
                <button
                  onClick={() => handleInterrogationDirection('left')}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-lg transition flex items-center justify-center gap-2"
                >
                  <span className="text-2xl">←</span>
                  <span>左に渡す</span>
                </button>
                
                <button
                  onClick={() => handleInterrogationDirection('right')}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-lg transition flex items-center justify-center gap-2"
                >
                  <span>右に渡す</span>
                  <span className="text-2xl">→</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 取り調べカード：カード選択モーダル */}
        {showInterrogationCardSelect && interrogationData && (
          <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto">
              <h3 className="text-2xl font-bold mb-4 text-center">渡すカードを選択</h3>
              
              <div className="bg-yellow-900 bg-opacity-50 border border-yellow-600 rounded-lg p-4 mb-6">
                <p className="text-sm text-yellow-200 text-center">
                  ⚠️ 番号が小さいカード1枚を選んでください
                </p>
                <p className="text-xs text-gray-400 text-center mt-2">
                  方向: {interrogationData.direction === 'left' ? '左へ ←' : '右へ →'}
                </p>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {myHand
                  .map((card, index) => ({ card, index, originalIndex: index }))
                  .sort((a, b) => a.card.number - b.card.number)
                  .map(({ card, originalIndex }) => (
                    <div
                      key={`interrogation-${card.id || card.cardId}-${originalIndex}`}
                      onClick={() => handleInterrogationCardSelect(card, originalIndex)}
                      className="bg-gray-700 rounded-lg p-4 border-2 border-blue-500 hover:bg-gray-600 hover:scale-105 cursor-pointer transition"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xl font-bold">{card.name}</span>
                        <span className="text-gray-400 text-sm">#{card.number}</span>
                      </div>
                      <p className="text-xs text-gray-300 line-clamp-3">
                        {card.description}
                      </p>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* 取り調べカード：待機モーダル */}
        {showInterrogationWaiting && (
          <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg max-w-md w-full p-6 text-center">
              <div className="text-6xl mb-4">⏳</div>
              <h3 className="text-2xl font-bold mb-4">取り調べカード発動中</h3>
              <p className="text-gray-400">
                他のプレイヤーがカードを選択しています...
              </p>
            </div>
          </div>
        )}
      {/* ルールモーダル */}
      <RulesModal isOpen={showRules} onClose={() => setShowRules(false)} />
    </div>
  )
}