import { CARD_SETS, ROLES, INVESTIGATION_CARDS } from '../data/cards'

// 配列をシャッフルする関数
export function shuffleArray(array) {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

// 正体カードを配布
export function distributeRoles(playerCount, playerNames) {
  const cardSet = CARD_SETS[playerCount]
  if (!cardSet) {
    throw new Error(`${playerCount}人用のカードセットが見つかりません`)
  }

  // 正体カードをシャッフル
  const shuffledRoles = shuffleArray(cardSet.roles)
  
  // 各プレイヤーに正体を割り当て
  const roleAssignments = {}
  playerNames.forEach((name, index) => {
    roleAssignments[name] = {
      roleId: shuffledRoles[index],
      role: ROLES[shuffledRoles[index].toUpperCase()]
    }
  })

  return roleAssignments
}

// 捜査カードの初期手札を配布
export function distributeInitialHands(playerCount, playerNames) {
  const cardSet = CARD_SETS[playerCount]
  if (!cardSet) {
    throw new Error(`${playerCount}人用のカードセットが見つかりません`)
  }

  // 捜査カードのリストを作成
  const cards = cardSet.investigationCards.map((cardId, index) => ({
    id: `${cardId}_${index}`,
    cardId: cardId,
    ...INVESTIGATION_CARDS[cardId.toUpperCase()]
  }))

  // デスノートと逮捕を探す（最初に見つかったもの）
  let deathNote = null
  let arrest = null
  const remainingCards = []

  for (const card of cards) {
    if (card.cardId === 'death_note' && !deathNote) {
      deathNote = card
    } else if (card.cardId === 'arrest' && !arrest) {
      arrest = card
    } else {
      remainingCards.push(card)
    }
  }

  if (!deathNote || !arrest) {
    throw new Error('デスノートまたは逮捕カードが見つかりません')
  }

  // 残りのカードをシャッフル
  const shuffledCards = shuffleArray(remainingCards)
  const neededCards = playerCount * 2 - 2 // デスノートと逮捕を除いた必要枚数
  const selectedCards = shuffledCards.slice(0, neededCards)
  const deckCards = shuffledCards.slice(neededCards) // 残りは山札へ

  // デスノートと逮捕を追加して再シャッフル
  const allCards = shuffleArray([deathNote, arrest, ...selectedCards])

  // 各プレイヤーに2枚ずつ配布
  const hands = {}
  playerNames.forEach((name, index) => {
    hands[name] = [
      allCards[index * 2],
      allCards[index * 2 + 1]
    ]
  })

  // 残りのカードは山札に
  const deck = deckCards

  return { hands, deck, discardPile: [] }
}