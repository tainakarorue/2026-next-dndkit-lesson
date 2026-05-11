export type CardId = string
export type ColumnId = string

export type Card = {
  id: CardId
  title: string
  description?: string
  label?: 'red' | 'yellow' | 'green' | 'blue'
}

export type Column = {
  id: ColumnId
  title: string
  cardIds: CardId[]
}

export type BoardState = {
  cards: Record<CardId, Card>
  columns: Column[]
}
