// 正体カードの定義
export const ROLES = {
  KIRA: {
    id: 'kira',
    name: 'キラ',
    team: 'kira',
    description: '「デスノート」が手札にある時、裁きの時間にプレイヤーを殺害できる。「デスノート」の番号を変えられる。',
    color: 'red'
  },
  BELIEVER: {
    id: 'believer',
    name: 'ミサ（信者）',
    team: 'kira',
    description: '裁きの時間と「死神」カードの使用中、目を開けてキラと意思疎通できる。',
    color: 'red'
  },
  L: {
    id: 'l',
    name: 'L',
    team: 'l',
    description: '「逮捕」カードを使用できる。「逮捕」の番号を変えられる。',
    color: 'blue'
  },
  POLICE: {
    id: 'police',
    name: '警察',
    team: 'l',
    description: '「拳銃」カードを使用できる。「拳銃」の番号を変えられる。',
    color: 'blue'
  },
  WATARI: {
    id: 'watari',
    name: 'ワタリ',
    team: 'l',
    description: 'ゲーム開始前にLが誰か把握できる。「逮捕」の番号を変えられる。',
    color: 'blue'
  },
  MELO: {
    id: 'melo',
    name: 'メロ',
    team: 'melo',
    description: '「拳銃」を使用してプレイヤーを殺害できる。キラを殺害すれば単独勝利。',
    color: 'purple'
  }
}

// 捜査カードの定義
export const INVESTIGATION_CARDS = {
  DEATH_NOTE: {
    id: 'death_note',
    number: 0,
    name: 'デスノート',
    description: '【誰も使用できない】【捨札にできない】キラが持っていると、裁きの時間に誰かの名前を書いて殺害できる。',
    usableBy: [],
    canDiscard: false
  },
  ARREST: {
    id: 'arrest',
    number: 1,
    name: '逮捕',
    description: '【Lのみ使用可能】【捨札にできない】【使用後はゲームから除外】プレイヤー1人を指名する。キラならLチームの勝利。',
    usableBy: ['l', 'watari'],
    canDiscard: false
  },
  HANDGUN: {
    id: 'handgun',
    number: 2,
    name: '拳銃',
    description: '【警察・メロのみ使用可能】プレイヤー1人を指名。警察の場合は番号が小さいカードを公開。メロの場合は対象を殺害。',
    usableBy: ['police', 'melo']
  },
  FAKE_NAME: {
    id: 'fake_name',
    number: 3,
    name: '偽名',
    description: '裁きの時間に名前を書かれたとき、このカードを公開すれば殺害されない。',
    usableBy: ['all']
  },
  ALIBI: {
    id: 'alibi',
    number: 4,
    name: 'アリバイ',
    description: 'キラが持っていると「逮捕」で指名されても否認できる。',
    usableBy: ['all']
  },
  WITNESS: {
    id: 'witness',
    number: 5,
    name: '目撃',
    description: 'プレイヤー1人を指名し、自分だけが正体カードを見る。',
    usableBy: ['all']
  },
  SURVEILLANCE: {
    id: 'surveillance',
    number: 6,
    name: '監視',
    description: 'プレイヤー1人を指名し、自分だけが手札をすべて見る。',
    usableBy: ['all']
  },
  VOTE: {
    id: 'vote',
    number: 7,
    name: '投票',
    description: 'すべてのプレイヤーは一斉に、キラだと思うプレイヤーを指差す。',
    usableBy: ['all']
  },
  EXCHANGE: {
    id: 'exchange',
    number: 8,
    name: '交換',
    description: 'プレイヤー1人を指名し、番号が小さいカード1枚を受け取る。その後、自分は任意のカード1枚を渡す。',
    usableBy: ['all']
  },
  INTERROGATION: {
    id: 'interrogation',
    number: 9,
    name: '取調',
    description: 'すべてのプレイヤーは番号が小さいカード1枚を左か右に渡す。',
    usableBy: ['all']
  },
  SHINIGAMI: {
    id: 'shinigami',
    number: 13,
    name: '死神',
    description: '【手札にあれば必ず使用】全員、目をつぶって片手を握って前に出す。キラと信者は目を開ける。',
    usableBy: ['all'],
    mandatory: true
  }
}

// 人数別のカード構成
export const CARD_SETS = {
  4: {
    roles: ['kira', 'l', 'police', 'police'],
    investigationCards: [
      'death_note',
      'arrest',
      'handgun',
      'fake_name',
      'alibi',
      'surveillance',
      'vote', 'vote',
      'exchange', 'exchange', 'exchange', 'exchange',
      'interrogation', 'interrogation', 'interrogation', 'interrogation'
    ]
  },
  5: {
    roles: ['kira', 'believer', 'l', 'police', 'police'],
    investigationCards: [
      'death_note',
      'arrest', 'arrest',
      'handgun',
      'fake_name',
      'alibi',
      'surveillance', 'surveillance',
      'vote', 'vote', 'vote',
      'exchange', 'exchange', 'exchange', 'exchange',
      'interrogation', 'interrogation', 'interrogation', 'interrogation', 'interrogation'
    ]
  },
  6: {
    roles: ['kira', 'believer', 'l', 'l', 'police', 'police'],
    investigationCards: [
      'death_note',
      'arrest', 'arrest',
      'handgun',
      'fake_name',
      'alibi',
      'surveillance', 'surveillance',
      'vote', 'vote', 'vote',
      'exchange', 'exchange', 'exchange', 'exchange', 'exchange',
      'interrogation', 'interrogation', 'interrogation', 'interrogation', 'interrogation', 'interrogation',
      'witness',
      'shinigami'
    ]
  },
  7: {
    roles: ['kira', 'believer', 'l', 'l', 'police', 'police', 'watari'],
    investigationCards: [
      'death_note',
      'arrest', 'arrest',
      'handgun', 'handgun',
      'fake_name', 'fake_name',
      'alibi',
      'surveillance', 'surveillance',
      'vote', 'vote', 'vote', 'vote',
      'exchange', 'exchange', 'exchange', 'exchange', 'exchange',
      'interrogation', 'interrogation', 'interrogation', 'interrogation', 'interrogation', 'interrogation', 'interrogation',
      'witness',
      'shinigami'
    ]
  },
  8: {
    roles: ['kira', 'believer', 'l', 'l', 'police', 'police', 'watari', 'melo'],
    investigationCards: [
      'death_note',
      'arrest', 'arrest',
      'handgun', 'handgun', 'handgun',
      'fake_name', 'fake_name',
      'alibi',
      'surveillance', 'surveillance',
      'vote', 'vote', 'vote', 'vote', 'vote',
      'exchange', 'exchange', 'exchange', 'exchange', 'exchange', 'exchange',
      'interrogation', 'interrogation', 'interrogation', 'interrogation', 'interrogation', 'interrogation', 'interrogation', 'interrogation',
      'witness',
      'shinigami'
    ]
  }
}